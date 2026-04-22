import { useState, useEffect, useRef } from "react";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  CheckCircle2, ShieldCheck, Upload, Loader2, AlertCircle, Info,
  Lock, ChevronRight, User, MapPin, FileText, Camera, Calendar,
  Phone, Globe, Home
} from "lucide-react";
import { useStore } from "@/store/useStore";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

interface KYCSubmission {
  id: string;
  user_id: string;
  kyc_level: number;
  status: string;
  full_name?: string;
  date_of_birth?: string;
  country?: string;
  phone?: string;
  address?: string;
  id_type?: string;
  id_number?: string;
  document_front?: string;
  document_back?: string;
  selfie_url?: string;
  address_doc_type?: string;
  address_doc_url?: string;
  rejection_reason?: string;
  submitted_at?: string;
  reviewed_at?: string;
  created_at: string;
}

const LEVELS = [
  { level: 1, title: "Basic Information", description: "Personal details", icon: User, features: ["Deposits up to $5,000", "Basic trading access"] },
  { level: 2, title: "Identity Verification", description: "Government-issued ID", icon: ShieldCheck, features: ["Withdrawals up to $50,000/day", "Full trading access"] },
  { level: 3, title: "Address Verification", description: "Proof of address", icon: MapPin, features: ["Unlimited withdrawals", "Full platform access"] },
];

const KYCPage = () => {
  const { user, setUser } = useStore();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submissions, setSubmissions] = useState<KYCSubmission[]>([]);
  const [activeLevel, setActiveLevel] = useState(1);

  // Level 1 form
  const [l1Form, setL1Form] = useState({ fullName: "", dob: "", country: "", phone: "", address: "" });
  // Level 2 form
  const [l2Form, setL2Form] = useState({ idType: "Passport", idNumber: "", frontImage: null as File | null, backImage: null as File | null, selfie: null as File | null });
  // Level 3 form
  const [l3Form, setL3Form] = useState({ docType: "Utility Bill", addressDoc: null as File | null });

  useEffect(() => {
    fetchSubmissions();
    const channel = supabase
      .channel(`kyc-${user?.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "kyc_submissions", filter: `user_id=eq.${user?.id}` }, () => fetchSubmissions())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user?.id]);

  const fetchSubmissions = async () => {
    if (!user?.id) return;
    const { data } = await supabase
      .from("kyc_submissions")
      .select("*")
      .eq("user_id", user.id);
    if (data) setSubmissions(data);
    setLoading(false);
  };

  const getSubmission = (level: number): KYCSubmission | undefined => {
    const levelSubs = submissions.filter(s => s.kyc_level === level);
    if (levelSubs.length === 0) return undefined;
    // Return the most recent submission for this level
    return levelSubs.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];
  };

  const getLevelStatus = (level: number): string => {
    const status = getSubmission(level)?.status || "Not Submitted";
    return status === "Approved" ? "Verified" : status;
  };

  const getHighestVerifiedLevel = (): number => {
    let highest = 0;
    for (let i = 1; i <= 3; i++) {
      if (getLevelStatus(i) === "Verified") highest = i;
      else break;
    }
    // Backward compatibility for users who were verified manually by an admin before multi-level existed
    if (highest === 0 && (user?.kyc === "Verified" || user?.kyc === "Approved")) {
        return 1;
    }
    return highest;
  };

  const isLevelUnlocked = (level: number): boolean => {
    if (level === 1) return true;
    return getHighestVerifiedLevel() >= level - 1;
  };

  const canSubmitLevel = (level: number): boolean => {
    if (!isLevelUnlocked(level)) return false;
    const status = getLevelStatus(level);
    return status === "Not Submitted" || status === "Rejected";
  };

  // Determine which level to show by default
  useEffect(() => {
    if (!loading) {
      const highest = getHighestVerifiedLevel();
      if (highest < 3) setActiveLevel(highest + 1);
      else setActiveLevel(3);
    }
  }, [loading, submissions, user?.kyc]);

  const uploadFile = async (file: File, folder: string): Promise<string | null> => {
    if (!user?.id) return null;
    const timestamp = Date.now();
    const ext = file.name.split('.').pop();
    const path = `${user.id}/${folder}_${timestamp}.${ext}`;
    const { error } = await supabase.storage.from("kyc-documents").upload(path, file, { upsert: true });
    if (error) { console.error("Upload error:", error); return null; }
    const { data } = supabase.storage.from("kyc-documents").getPublicUrl(path);
    return data?.publicUrl || null;
  };

  const handleSubmitLevel1 = async () => {
    if (!user?.id) return;
    if (!l1Form.fullName || !l1Form.dob || !l1Form.country) {
      toast.error("Please fill in all required fields"); return;
    }
    setSubmitting(true);
    try {
      const { error } = await supabase.from("kyc_submissions").insert({
        user_id: user.id, kyc_level: 1, status: "Pending",
        full_name: l1Form.fullName, date_of_birth: l1Form.dob,
        country: l1Form.country, phone: l1Form.phone, address: l1Form.address,
      });
      if (error) throw error;
      await supabase.from("profiles").update({ kyc: "Pending" }).eq("id", user.id);
      setUser({ ...user, kyc: "Pending" });
      toast.success("Level 1 Submitted", { description: "Your basic information is under review." });
      await fetchSubmissions();
    } catch (err: any) { toast.error(err.message || "Submission failed"); }
    finally { setSubmitting(false); }
  };

  const handleSubmitLevel2 = async () => {
    if (!user?.id) return;
    if (!l2Form.idNumber || !l2Form.frontImage) {
      toast.error("Please provide your ID number and upload the front of your ID"); return;
    }
    setSubmitting(true);
    try {
      const frontUrl = await uploadFile(l2Form.frontImage, "id_front");
      const backUrl = l2Form.backImage ? await uploadFile(l2Form.backImage, "id_back") : null;
      const selfieUrl = l2Form.selfie ? await uploadFile(l2Form.selfie, "selfie") : null;
      if (!frontUrl) throw new Error("Failed to upload ID document");

      const { error } = await supabase.from("kyc_submissions").insert({
        user_id: user.id, kyc_level: 2, status: "Pending",
        id_type: l2Form.idType, id_number: l2Form.idNumber,
        document_front: frontUrl, document_back: backUrl, selfie_url: selfieUrl,
      });
      if (error) throw error;
      toast.success("Level 2 Submitted", { description: "Your identity documents are under review." });
      await fetchSubmissions();
    } catch (err: any) { toast.error(err.message || "Submission failed"); }
    finally { setSubmitting(false); }
  };

  const handleSubmitLevel3 = async () => {
    if (!user?.id) return;
    if (!l3Form.addressDoc) {
      toast.error("Please upload your proof of address document"); return;
    }
    setSubmitting(true);
    try {
      const docUrl = await uploadFile(l3Form.addressDoc, "address_proof");
      if (!docUrl) throw new Error("Failed to upload address document");

      const { error } = await supabase.from("kyc_submissions").insert({
        user_id: user.id, kyc_level: 3, status: "Pending",
        address_doc_type: l3Form.docType, address_doc_url: docUrl,
      });
      if (error) throw error;
      toast.success("Level 3 Submitted", { description: "Your address verification is under review." });
      await fetchSubmissions();
    } catch (err: any) { toast.error(err.message || "Submission failed"); }
    finally { setSubmitting(false); }
  };

  const FileUploadBox = ({ label, file, onFileChange, accept = "image/*,.pdf" }: { label: string; file: File | null; onFileChange: (f: File) => void; accept?: string }) => (
    <div className="space-y-2">
      <Label className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest">{label}</Label>
      <div className="relative group cursor-pointer border-2 border-dashed border-border rounded-2xl p-6 text-center hover:border-primary/40 transition-all bg-secondary/20">
        <input type="file" accept={accept} onChange={(e) => e.target.files?.[0] && onFileChange(e.target.files[0])} className="absolute inset-0 opacity-0 cursor-pointer" />
        <Upload className="w-6 h-6 mx-auto text-muted-foreground group-hover:text-primary transition-colors mb-2" />
        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
          {file ? file.name : "Choose File"}
        </p>
        <p className="text-[9px] text-muted-foreground/50 mt-1">JPG, PNG, or PDF (max 10MB)</p>
      </div>
    </div>
  );

  if (loading) return <DashboardLayout><div className="flex h-[60vh] items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div></DashboardLayout>;

  const highestVerified = getHighestVerifiedLevel();
  const allVerified = highestVerified >= 3;

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-border">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Identity Verification</h1>
            <p className="text-sm text-muted-foreground mt-1">Complete verification to access all platform features.</p>
          </div>
          <div className="flex items-center gap-3">
            <div className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest border ${
              allVerified ? "bg-green-500/10 text-green-600 border-green-500/20" :
              highestVerified > 0 ? "bg-amber-500/10 text-amber-600 border-amber-500/20" :
              "bg-secondary text-muted-foreground border-border"
            }`}>
              <ShieldCheck className="w-4 h-4" />
              {allVerified ? "Fully Verified" : `Level ${highestVerified} Verified`}
            </div>
          </div>
        </header>

        {/* Progress Steps */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {LEVELS.map(({ level, title, description, icon: Icon, features }) => {
            const status = getLevelStatus(level);
            const unlocked = isLevelUnlocked(level);
            const isActive = activeLevel === level;
            const isVerified = status === "Verified";
            const isPending = status === "Pending";
            const isRejected = status === "Rejected";

            return (
              <button
                key={level}
                onClick={() => unlocked && setActiveLevel(level)}
                disabled={!unlocked}
                className={`relative p-5 rounded-2xl border text-left transition-all ${
                  isActive ? "bg-primary/5 border-primary/30 shadow-sm" :
                  isVerified ? "bg-green-500/5 border-green-500/20" :
                  isPending ? "bg-amber-500/5 border-amber-500/20" :
                  isRejected ? "bg-red-500/5 border-red-500/20" :
                  unlocked ? "bg-card border-border hover:border-primary/20 cursor-pointer" :
                  "bg-secondary/30 border-border/50 opacity-60 cursor-not-allowed"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    isVerified ? "bg-green-500 text-white" :
                    isPending ? "bg-amber-500 text-white" :
                    isRejected ? "bg-red-500 text-white" :
                    isActive ? "bg-primary/10 text-primary" :
                    "bg-secondary text-muted-foreground"
                  }`}>
                    {isVerified ? <CheckCircle2 className="w-5 h-5" /> :
                     !unlocked ? <Lock className="w-4 h-4" /> :
                     <Icon className="w-5 h-5" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Level {level}</span>
                      {isVerified && <span className="text-[8px] font-bold text-green-600 bg-green-500/10 px-1.5 py-0.5 rounded uppercase">Verified</span>}
                      {isPending && <span className="text-[8px] font-bold text-amber-600 bg-amber-500/10 px-1.5 py-0.5 rounded uppercase">Pending</span>}
                      {isRejected && <span className="text-[8px] font-bold text-red-600 bg-red-500/10 px-1.5 py-0.5 rounded uppercase">Rejected</span>}
                    </div>
                    <h3 className="text-xs font-bold text-foreground mt-0.5">{title}</h3>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{description}</p>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-border/50 space-y-1">
                  {features.map((f, i) => (
                    <div key={i} className="flex items-center gap-2 text-[9px] text-muted-foreground">
                      <CheckCircle2 className={`w-3 h-3 shrink-0 ${isVerified ? "text-green-500" : "text-muted-foreground/30"}`} />
                      {f}
                    </div>
                  ))}
                </div>
              </button>
            );
          })}
        </div>

        {/* Rejection Notice */}
        {getLevelStatus(activeLevel) === "Rejected" && (
          <div className="p-5 bg-red-500/5 border border-red-500/20 rounded-2xl flex items-start gap-4">
            <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-bold text-red-600">Level {activeLevel} Verification Rejected</h4>
              <p className="text-xs text-muted-foreground mt-1">
                Reason: <span className="text-foreground font-medium">{getSubmission(activeLevel)?.rejection_reason || "Documents could not be verified. Please resubmit."}</span>
              </p>
              <p className="text-[10px] text-muted-foreground mt-2">Please correct the issues and submit again below.</p>
            </div>
          </div>
        )}

        {/* Pending Notice */}
        {getLevelStatus(activeLevel) === "Pending" && (
          <div className="p-8 bg-card border border-border rounded-2xl text-center space-y-4">
            <div className="w-16 h-16 bg-amber-500/10 border border-amber-500/20 rounded-full flex items-center justify-center mx-auto relative">
              <div className="absolute inset-0 bg-amber-500/20 rounded-full animate-ping" />
              <Loader2 className="w-8 h-8 text-amber-500 animate-spin relative z-10" />
            </div>
            <h2 className="text-lg font-bold text-foreground">Level {activeLevel} Under Review</h2>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              Our compliance team is reviewing your Level {activeLevel} submission. This typically takes 12–48 hours.
            </p>
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-secondary/50 rounded-xl text-[10px] font-bold text-muted-foreground border border-border">
              <Calendar className="w-3.5 h-3.5" />
              Submitted: {new Date(getSubmission(activeLevel)?.submitted_at || getSubmission(activeLevel)?.created_at || "").toLocaleDateString()}
            </div>
          </div>
        )}

        {/* Verified Notice */}
        {getLevelStatus(activeLevel) === "Verified" && allVerified && (
          <div className="p-10 bg-green-500/5 border border-green-500/20 rounded-2xl text-center space-y-4">
            <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto shadow-lg shadow-green-500/20">
              <CheckCircle2 className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-xl font-bold text-foreground">Fully Verified</h2>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              Your identity has been fully verified across all 3 levels. You have unrestricted access to all platform features.
            </p>
          </div>
        )}

        {/* === LEVEL FORMS === */}
        {canSubmitLevel(activeLevel) && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              {/* Level 1 Form */}
              {activeLevel === 1 && (
                <div className="p-6 lg:p-8 rounded-2xl bg-card border border-border space-y-6">
                  <div>
                    <h2 className="text-sm font-bold text-foreground flex items-center gap-2"><User className="w-4 h-4 text-primary" /> Basic Information</h2>
                    <p className="text-xs text-muted-foreground mt-1">Provide your personal details as they appear on your legal documents.</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest">Full Legal Name *</Label>
                      <Input value={l1Form.fullName} onChange={(e) => setL1Form({ ...l1Form, fullName: e.target.value })} placeholder="As on your government ID" className="h-12 bg-secondary/30 border-border rounded-xl" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest">Date of Birth *</Label>
                      <Input type="date" value={l1Form.dob} onChange={(e) => setL1Form({ ...l1Form, dob: e.target.value })} className="h-12 bg-secondary/30 border-border rounded-xl" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest">Country *</Label>
                      <Input value={l1Form.country} onChange={(e) => setL1Form({ ...l1Form, country: e.target.value })} placeholder="United States" className="h-12 bg-secondary/30 border-border rounded-xl" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest">Phone Number</Label>
                      <Input value={l1Form.phone} onChange={(e) => setL1Form({ ...l1Form, phone: e.target.value })} placeholder="+1 (555) 000-0000" className="h-12 bg-secondary/30 border-border rounded-xl" />
                    </div>
                    <div className="col-span-full space-y-2">
                      <Label className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest">Residential Address</Label>
                      <Input value={l1Form.address} onChange={(e) => setL1Form({ ...l1Form, address: e.target.value })} placeholder="Street, City, State, ZIP" className="h-12 bg-secondary/30 border-border rounded-xl" />
                    </div>
                  </div>
                  <Button onClick={handleSubmitLevel1} disabled={submitting} className="w-full h-12 rounded-xl text-xs font-bold uppercase tracking-widest">
                    {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <ChevronRight className="w-4 h-4 mr-2" />}
                    Submit Level 1
                  </Button>
                </div>
              )}

              {/* Level 2 Form */}
              {activeLevel === 2 && (
                <div className="p-6 lg:p-8 rounded-2xl bg-card border border-border space-y-6">
                  <div>
                    <h2 className="text-sm font-bold text-foreground flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-primary" /> Identity Verification</h2>
                    <p className="text-xs text-muted-foreground mt-1">Upload a clear photo of your government-issued identification document.</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest">Document Type *</Label>
                      <select value={l2Form.idType} onChange={(e) => setL2Form({ ...l2Form, idType: e.target.value })} className="w-full h-12 bg-secondary/30 border border-border rounded-xl px-4 text-sm text-foreground outline-none focus:border-primary/50">
                        <option value="Passport">Passport</option>
                        <option value="National ID">National ID Card</option>
                        <option value="Driver License">Driver's License</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest">Document Number *</Label>
                      <Input value={l2Form.idNumber} onChange={(e) => setL2Form({ ...l2Form, idNumber: e.target.value })} placeholder="Enter your document number" className="h-12 bg-secondary/30 border-border rounded-xl" />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <FileUploadBox label="Front of ID *" file={l2Form.frontImage} onFileChange={(f) => setL2Form({ ...l2Form, frontImage: f })} />
                    <FileUploadBox label="Back of ID (if applicable)" file={l2Form.backImage} onFileChange={(f) => setL2Form({ ...l2Form, backImage: f })} />
                  </div>
                  <FileUploadBox label="Selfie with ID (Recommended)" file={l2Form.selfie} onFileChange={(f) => setL2Form({ ...l2Form, selfie: f })} accept="image/*" />
                  <Button onClick={handleSubmitLevel2} disabled={submitting} className="w-full h-12 rounded-xl text-xs font-bold uppercase tracking-widest">
                    {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <ChevronRight className="w-4 h-4 mr-2" />}
                    Submit Level 2
                  </Button>
                </div>
              )}

              {/* Level 3 Form */}
              {activeLevel === 3 && (
                <div className="p-6 lg:p-8 rounded-2xl bg-card border border-border space-y-6">
                  <div>
                    <h2 className="text-sm font-bold text-foreground flex items-center gap-2"><MapPin className="w-4 h-4 text-primary" /> Address Verification</h2>
                    <p className="text-xs text-muted-foreground mt-1">Upload a proof of address document issued within the last 3 months.</p>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest">Document Type *</Label>
                    <select value={l3Form.docType} onChange={(e) => setL3Form({ ...l3Form, docType: e.target.value })} className="w-full h-12 bg-secondary/30 border border-border rounded-xl px-4 text-sm text-foreground outline-none focus:border-primary/50">
                      <option value="Utility Bill">Utility Bill</option>
                      <option value="Bank Statement">Bank Statement</option>
                      <option value="Government Letter">Government Letter</option>
                      <option value="Tax Document">Tax Document</option>
                    </select>
                  </div>
                  <FileUploadBox label="Upload Proof of Address *" file={l3Form.addressDoc} onFileChange={(f) => setL3Form({ ...l3Form, addressDoc: f })} />
                  <Button onClick={handleSubmitLevel3} disabled={submitting} className="w-full h-12 rounded-xl text-xs font-bold uppercase tracking-widest">
                    {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <ChevronRight className="w-4 h-4 mr-2" />}
                    Submit Level 3
                  </Button>
                </div>
              )}
            </div>

            {/* Info sidebar */}
            <div className="space-y-5">
              <div className="p-6 rounded-2xl bg-primary/5 border border-primary/10 space-y-5">
                <div className="flex items-center gap-2 text-primary">
                  <Info className="w-4 h-4" />
                  <h3 className="text-xs font-bold uppercase tracking-widest">Level {activeLevel} Info</h3>
                </div>
                {activeLevel === 1 && (
                  <ul className="space-y-3 text-[10px] text-muted-foreground font-medium">
                    <li className="flex items-start gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" /> Name must match your government-issued ID exactly</li>
                    <li className="flex items-start gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" /> All basic information is encrypted and stored securely</li>
                    <li className="flex items-start gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" /> Review typically completes within 24 hours</li>
                  </ul>
                )}
                {activeLevel === 2 && (
                  <ul className="space-y-3 text-[10px] text-muted-foreground font-medium">
                    <li className="flex items-start gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" /> Accepted: Passport, National ID, Driver's License</li>
                    <li className="flex items-start gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" /> Images must be clear and not blurred or cropped</li>
                    <li className="flex items-start gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" /> Selfie with ID speeds up the verification process</li>
                  </ul>
                )}
                {activeLevel === 3 && (
                  <ul className="space-y-3 text-[10px] text-muted-foreground font-medium">
                    <li className="flex items-start gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" /> Document must be issued within the last 3 months</li>
                    <li className="flex items-start gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" /> Address must match your account registration details</li>
                    <li className="flex items-start gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" /> PDF and image formats are accepted</li>
                  </ul>
                )}
              </div>

              {/* Submission History */}
              {submissions.length > 0 && (
                <div className="p-5 rounded-2xl bg-card border border-border space-y-4">
                  <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Submission History</h4>
                  {submissions.map(sub => (
                    <div key={sub.id} className="flex items-center justify-between p-3 rounded-xl bg-secondary/30 border border-border">
                      <div>
                        <span className="text-[10px] font-bold text-foreground">Level {sub.kyc_level}</span>
                        <span className="text-[9px] text-muted-foreground ml-2">{new Date(sub.created_at).toLocaleDateString()}</span>
                      </div>
                      <span className={`text-[8px] font-bold uppercase tracking-widest px-2 py-0.5 rounded border ${
                        sub.status === "Verified" ? "bg-green-500/10 text-green-600 border-green-500/20" :
                        sub.status === "Pending" ? "bg-amber-500/10 text-amber-600 border-amber-500/20" :
                        "bg-red-500/10 text-red-600 border-red-500/20"
                      }`}>{sub.status}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default KYCPage;
