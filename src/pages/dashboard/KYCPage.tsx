import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CheckCircle2, ShieldAlert, Upload, Loader2, FileText, AlertCircle, Info } from "lucide-react";
import { useStore } from "@/store/useStore";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

const KYCPage = () => {
  const { user, setUser } = useStore();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState<any>(null);
  const [formData, setFormData] = useState({
    fullName: "",
    idType: "Passport",
    idNumber: "",
    frontImage: null as File | null,
    backImage: null as File | null,
  });

  useEffect(() => {
    const fetchStatus = async () => {
      if (!user?.id) return;
      const { data, error } = await supabase
        .from('kyc_submissions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (data) setStatus(data);
      setLoading(false);
    };
    fetchStatus();
  }, [user?.id]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, side: 'front' | 'back') => {
    if (e.target.files?.[0]) {
      setFormData({ ...formData, [side === 'front' ? 'frontImage' : 'backImage']: e.target.files[0] });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!formData.fullName || !formData.frontImage) {
      toast.error("Please fill in required fields and upload at least the front of your ID");
      return;
    }

    setSubmitting(true);
    try {
      // 1. Upload front image to Supabase Storage
      let frontUrl: string | null = null;
      let backUrl: string | null = null;

      const timestamp = Date.now();
      const frontPath = `${user.id}/front_${timestamp}.${formData.frontImage.name.split('.').pop()}`;
      const { error: frontErr } = await supabase.storage
        .from('kyc-documents')
        .upload(frontPath, formData.frontImage, { upsert: true });

      if (frontErr) {
        console.error('Front upload error:', frontErr);
        toast.error("Upload issue — please ensure the 'kyc-documents' storage bucket exists.");
        throw frontErr;
      }

      const { data: frontPublic } = supabase.storage.from('kyc-documents').getPublicUrl(frontPath);
      frontUrl = frontPublic?.publicUrl || null;

      // 2. Upload back image if provided
      if (formData.backImage) {
        const backPath = `${user.id}/back_${timestamp}.${formData.backImage.name.split('.').pop()}`;
        const { error: backErr } = await supabase.storage
          .from('kyc-documents')
          .upload(backPath, formData.backImage, { upsert: true });
        
        if (!backErr) {
          const { data: backPublic } = supabase.storage.from('kyc-documents').getPublicUrl(backPath);
          backUrl = backPublic?.publicUrl || null;
        }
      }

      // 3. Insert submission record WITH document URLs
      const { error } = await supabase.from('kyc_submissions').insert({
        user_id: user.id,
        full_name: formData.fullName,
        id_type: formData.idType,
        id_number: formData.idNumber,
        document_front: frontUrl,
        document_back: backUrl,
        status: 'Pending'
      });

      if (error) throw error;

      // 4. Update profile status
      await supabase.from('profiles').update({ kyc: 'Pending' }).eq('id', user.id);
      
      toast.success("KYC Submitted Successfully", { description: "Our team will review your application within 24-48 hours." });
      setStatus({ status: 'Pending', full_name: formData.fullName, document_front: frontUrl, document_back: backUrl, created_at: new Date().toISOString() });
      
      // Update global store
      setUser({ ...user, kyc: 'Pending' });

    } catch (err: any) {
      toast.error(err.message || "Failed to submit KYC");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <DashboardLayout><div className="flex h-[60vh] items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div></DashboardLayout>;

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-8 p-4">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-border">
          <div>
            <h1 className="text-3xl font-black text-foreground">Identity Verification</h1>
            <p className="text-muted-foreground mt-1 text-sm font-medium">Verify your legal identity to enable full platform capabilities.</p>
          </div>
          <div className="flex gap-3">
             <div className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-primary/10 border border-primary/20 text-primary text-[10px] font-black uppercase tracking-widest shadow-sm">
               <ShieldAlert className="w-4 h-4" /> Quick Verification
             </div>
          </div>
        </header>

        {status?.status === 'Verified' ? (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="p-10 bg-green-500/10 border border-green-500/20 rounded-3xl text-center space-y-4">
            <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto shadow-lg shadow-green-500/20">
              <CheckCircle2 className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-foreground">You're Verified!</h2>
            <p className="text-muted-foreground max-w-md mx-auto">Your account is fully verified. You now have unrestricted access to all features on the platform.</p>
            <div className="pt-4">
               <span className="inline-flex items-center gap-2 px-4 py-2 bg-green-500/20 text-green-500 rounded-full text-xs font-bold uppercase tracking-widest">Status: Verified</span>
            </div>
          </motion.div>
        ) : status?.status === 'Pending' ? (
          <div className="p-12 bg-card border border-border rounded-[3rem] text-center space-y-8 shadow-huge max-w-2xl mx-auto py-20">
             <div className="w-24 h-24 bg-amber-500/10 border border-amber-500/20 rounded-full flex items-center justify-center mx-auto relative">
                <div className="absolute inset-0 bg-amber-500/20 rounded-full animate-ping" />
                <Loader2 className="w-10 h-10 text-amber-500 animate-spin relative z-10" />
             </div>
             <div className="space-y-3">
                <h2 className="text-2xl font-black text-foreground uppercase tracking-tight">Review in Progress</h2>
                <p className="text-xs text-muted-foreground max-w-sm mx-auto leading-relaxed font-bold uppercase tracking-widest opacity-80">
                   Our security team is currently reviewing your legal documents. 
                   Standard processing time is 12-24 hours.
                </p>
             </div>
             <div className="p-6 bg-secondary/50 rounded-2xl inline-block text-left text-[10px] space-y-3 border border-border min-w-[280px]">
                <div className="flex justify-between gap-8"><span className="text-muted-foreground font-black uppercase tracking-widest">Submitted</span> <span className="text-foreground font-black font-sans">{new Date(status.created_at).toLocaleDateString()}</span></div>
                <div className="flex justify-between gap-8"><span className="text-muted-foreground font-black uppercase tracking-widest">Document</span> <span className="text-foreground font-black font-sans uppercase tracking-widest">{status.id_type}</span></div>
                <div className="flex justify-between gap-8"><span className="text-muted-foreground font-black uppercase tracking-widest">Status</span> <span className="text-amber-500 font-black font-sans uppercase tracking-widest">Processing</span></div>
             </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 order-2 lg:order-1">
              <form onSubmit={handleSubmit} className="p-8 rounded-[2.5rem] bg-card border border-border shadow-sm space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Full Name (as on ID)</Label>
                    <Input 
                      value={formData.fullName} 
                      onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                      placeholder="John Doe" 
                      className="h-14 bg-secondary/50 border-border rounded-xl font-bold"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">ID Type</Label>
                    <select 
                      className="w-full h-14 bg-secondary/50 border border-border rounded-xl px-4 font-bold outline-none"
                      value={formData.idType}
                      onChange={(e) => setFormData({...formData, idType: e.target.value})}
                    >
                      <option value="Passport">Passport</option>
                      <option value="ID Card">National ID Card</option>
                      <option value="Driver License">Driver's License</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">ID / Document Number</Label>
                  <Input 
                    value={formData.idNumber} 
                    onChange={(e) => setFormData({...formData, idNumber: e.target.value})}
                    placeholder="Enter numbers only" 
                    className="h-14 bg-secondary/50 border-border rounded-xl font-bold"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div className="space-y-3">
                      <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Front of ID</Label>
                      <div className="relative group cursor-pointer border-2 border-dashed border-border rounded-[1.5rem] p-8 text-center hover:border-primary/50 transition-all bg-secondary/30">
                         <input type="file" onChange={(e) => handleFileChange(e, 'front')} className="absolute inset-0 opacity-0 cursor-pointer" />
                         <div className="space-y-2">
                            <Upload className="w-8 h-8 mx-auto text-muted-foreground group-hover:text-primary group-hover:scale-110 transition-all" />
                            <p className="text-[10px] font-bold text-muted-foreground uppercase">{formData.frontImage ? formData.frontImage.name : "Choose File"}</p>
                         </div>
                      </div>
                   </div>
                   <div className="space-y-3">
                      <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Back of ID (Optional)</Label>
                      <div className="relative group cursor-pointer border-2 border-dashed border-border rounded-[1.5rem] p-8 text-center hover:border-primary/50 transition-all bg-secondary/30">
                         <input type="file" onChange={(e) => handleFileChange(e, 'back')} className="absolute inset-0 opacity-0 cursor-pointer" />
                         <div className="space-y-2">
                            <Upload className="w-8 h-8 mx-auto text-muted-foreground group-hover:text-primary group-hover:scale-110 transition-all" />
                            <p className="text-[10px] font-bold text-muted-foreground uppercase">{formData.backImage ? formData.backImage.name : "Choose File"}</p>
                         </div>
                      </div>
                   </div>
                </div>

                <div className="pt-4">
                  <Button 
                    type="submit" 
                    className="w-full h-16 rounded-[1.5rem] text-sm font-black uppercase tracking-widest text-white shadow-gold"
                    variant="hero"
                    disabled={submitting}
                  >
                    {submitting ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <ShieldAlert className="w-5 h-5 mr-2" />}
                    Submit Verification
                  </Button>
                </div>
              </form>
            </div>

            <div className="space-y-6 order-1 lg:order-2">
              <div className="p-8 rounded-[2rem] bg-primary/5 border border-primary/20 space-y-6">
                 <div className="flex items-center gap-3 text-primary">
                    <Info className="w-5 h-5" />
                    <h3 className="font-bold text-sm uppercase tracking-widest">Why Verify?</h3>
                 </div>
                 <ul className="space-y-4">
                     {[
                      { icon: CheckCircle2, text: "Tier 1: Withdraw up to $10,000 / Day" },
                      { icon: CheckCircle2, text: "Tier 2: Withdraw up to $50,000 / Day" },
                      { icon: CheckCircle2, text: "Tier 3: Unlimited Institutional Access" },
                      { icon: CheckCircle2, text: "Priority Compliance Support" }
                    ].map((item, i) => (

                      <li key={i} className="flex items-center gap-3 text-[10px] font-bold text-muted-foreground uppercase">
                        <item.icon className="w-4 h-4 text-primary" />
                        {item.text}
                      </li>
                    ))}
                 </ul>
              </div>

              {status?.status === 'Rejected' && (
                 <div className="p-6 bg-red-500/10 border border-red-500/20 rounded-2xl space-y-3">
                    <div className="flex items-center gap-2 text-red-500">
                       <AlertCircle className="w-4 h-4" />
                       <h4 className="font-bold text-xs uppercase">Verification Rejected</h4>
                    </div>
                    <p className="text-[10px] text-muted-foreground font-medium leading-relaxed uppercase">Reason: <span className="text-foreground">{status.rejection_reason || "Document blurred or invalid"}</span></p>
                    <p className="text-[10px] text-muted-foreground font-medium uppercase italic">Please resubmit with clear documents.</p>
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
