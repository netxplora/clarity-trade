import { useState, useEffect } from "react";
import AdminLayout from "@/components/layouts/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Search, ShieldCheck, CheckCircle, X, Eye, ShieldAlert, AlertCircle, Clock,
  Filter, FileText, Download, SortAsc, SortDesc
} from "lucide-react";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { AppUser } from "@/store/useStore";

interface KYCSubmissionExt {
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
  user?: AppUser; // Joined user data
}

const AdminKYC = () => {
  const [submissions, setSubmissions] = useState<KYCSubmissionExt[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [levelFilter, setLevelFilter] = useState("all");
  
  const [selectedSubmission, setSelectedSubmission] = useState<KYCSubmissionExt | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [rejectionDialog, setRejectionDialog] = useState<KYCSubmissionExt | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");

  const fetchData = async () => {
    try {
      const { data: kycData, error: kycError } = await supabase
        .from('kyc_submissions')
        .select(`
          *,
          user:profiles ( id, name, email, avatar_url )
        `)
        .order('created_at', { ascending: false });

      if (kycError) throw kycError;
      
      // We map the referenced profile as 'user'
      const mapped = (kycData || []).map((row: any) => ({
        ...row,
        user: Array.isArray(row.user) ? row.user[0] : row.user
      }));

      setSubmissions(mapped);
    } catch (err: any) {
      toast.error(err.message || "Failed to load KYC submissions");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    const sub = supabase.channel('admin-kyc-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'kyc_submissions' }, () => fetchData())
      .subscribe();

    return () => { supabase.removeChannel(sub); };
  }, []);

  const handleApprove = async (submission: KYCSubmissionExt) => {
    try {
      const { error: kycErr } = await supabase.from('kyc_submissions').update({ 
        status: 'Verified', 
        reviewed_at: new Date().toISOString() 
      }).eq('id', submission.id);
      if (kycErr) throw kycErr;

      // Simple implementation: Update profile status if Level 1, 2, or 3 Verified
      const { error: profErr } = await supabase.from('profiles').update({ kyc: 'Verified' }).eq('id', submission.user_id);
      if (profErr) throw profErr;
      
      toast.success(`Level ${submission.kyc_level} Verified for ${submission.user?.name || 'User'}`);
      setSelectedSubmission(null);
      fetchData();
    } catch (err: any) {
      toast.error(err.message || "Approval failed");
    }
  };

  const handleReject = async () => {
    if (!rejectionDialog || !rejectionReason.trim()) return;
    try {
      const { error: kycErr } = await supabase.from('kyc_submissions').update({
        status: 'Rejected',
        rejection_reason: rejectionReason,
        reviewed_at: new Date().toISOString()
      }).eq('id', rejectionDialog.id);
      if (kycErr) throw kycErr;

      const { error: profErr } = await supabase.from('profiles').update({ kyc: 'Rejected' }).eq('id', rejectionDialog.user_id);
      if (profErr) throw profErr;
      
      toast.error(`Level ${rejectionDialog.kyc_level} Rejected for ${rejectionDialog.user?.name || 'User'}`);
      setRejectionReason("");
      setRejectionDialog(null);
      setSelectedSubmission(null);
      fetchData();
    } catch (err: any) {
      toast.error(err.message || "Rejection failed");
    }
  };

  const filtered = submissions.filter(s => {
    const matchesSearch = !search || s.user?.name?.toLowerCase().includes(search.toLowerCase()) || s.user?.email?.toLowerCase().includes(search.toLowerCase()) || s.id_number?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || s.status.toLowerCase() === statusFilter.toLowerCase();
    const matchesLevel = levelFilter === "all" || s.kyc_level === parseInt(levelFilter);
    return matchesSearch && matchesStatus && matchesLevel;
  });

  return (
    <AdminLayout>
      <div className="space-y-8">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-border">
          <div>
            <div className="flex items-center gap-2 text-primary mb-1">
               <ShieldAlert className="w-4 h-4" />
               <span className="text-[10px] font-black tracking-[0.2em] uppercase">Compliance</span>
            </div>
            <h1 className="text-3xl font-black text-foreground tracking-tight">KYC Management</h1>
            <p className="text-muted-foreground mt-1 text-xs font-bold uppercase tracking-widest opacity-60">Review and verify user identities</p>
          </div>
        </header>

        {/* Toolbar */}
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-card p-4 rounded-2xl border border-border shadow-sm">
          <div className="relative w-full md:w-96 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/40 group-focus-within:text-primary transition-colors" />
            <input 
              placeholder="Search by name, email, or document number..." 
              className="w-full h-11 bg-secondary/50 border border-border rounded-xl pl-11 pr-4 text-xs font-bold outline-none focus:border-primary transition-all"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-3 w-full md:w-auto overflow-x-auto">
            <select className="h-11 px-4 rounded-xl bg-secondary/50 border border-border text-xs font-bold outline-none uppercase tracking-widest" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
              <option value="all">All Statuses</option>
              <option value="pending">Pending Review</option>
              <option value="verified">Verified</option>
              <option value="rejected">Rejected</option>
            </select>
            <select className="h-11 px-4 rounded-xl bg-secondary/50 border border-border text-xs font-bold outline-none uppercase tracking-widest" value={levelFilter} onChange={e => setLevelFilter(e.target.value)}>
              <option value="all">All Levels</option>
              <option value="1">Level 1 (Basic)</option>
              <option value="2">Level 2 (Identity)</option>
              <option value="3">Level 3 (Address)</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="rounded-[2rem] bg-card border border-border overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-[9px] font-black text-muted-foreground uppercase tracking-widest border-b border-border bg-secondary/30">
                  <th className="text-left py-4 px-6 w-16">Profile</th>
                  <th className="text-left py-4 px-6">User Details</th>
                  <th className="text-left py-4 px-6">KYC Level</th>
                  <th className="text-left py-4 px-6">Status</th>
                  <th className="text-left py-4 px-6 hidden md:table-cell">Submission Date</th>
                  <th className="text-right py-4 px-6">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map(sub => (
                  <tr key={sub.id} className="hover:bg-secondary/20 transition-colors">
                    <td className="py-4 px-6">
                      <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center overflow-hidden font-bold text-foreground">
                        {sub.user?.avatar_url ? <img src={sub.user.avatar_url} className="w-full h-full object-cover" /> : sub.user?.name?.charAt(0) || '?'}
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="font-bold text-sm text-foreground">{sub.user?.name || sub.full_name || 'Unknown User'}</div>
                      <div className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">{sub.user?.email || 'No email'}</div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-md bg-secondary flex items-center justify-center text-xs font-black text-foreground">{sub.kyc_level}</div>
                        <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                          {sub.kyc_level === 1 ? 'Basic Info' : sub.kyc_level === 2 ? 'Identity Doc' : 'Address Proof'}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <Badge className={`uppercase text-[9px] font-black tracking-widest px-2.5 py-1 ${
                        sub.status === 'Verified' ? 'bg-green-500/10 text-green-500 border-green-500/20' : 
                        sub.status === 'Pending' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' : 
                        'bg-red-500/10 text-red-500 border-red-500/20'
                      }`}>
                        {sub.status === 'Pending' ? <Clock className="w-3 h-3 mr-1 inline" /> : null}
                        {sub.status}
                      </Badge>
                    </td>
                    <td className="py-4 px-6 hidden md:table-cell text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                      {new Date(sub.submitted_at || sub.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-4 px-6 text-right">
                      <Button variant="outline" size="sm" onClick={() => setSelectedSubmission(sub)} className="h-8 rounded-lg text-[9px] font-bold uppercase tracking-widest">
                        <Eye className="w-3.5 h-3.5 mr-1.5" /> Review
                      </Button>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && !loading && (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-muted-foreground">
                      <ShieldCheck className="w-8 h-8 opacity-20 mx-auto mb-3" />
                      <p className="text-xs font-bold uppercase tracking-widest">No KYC submissions found</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Review Dialog */}
      <Dialog open={!!selectedSubmission} onOpenChange={(open) => { if(!open) setSelectedSubmission(null); }}>
        <DialogContent className="max-w-3xl bg-card border-border shadow-huge p-0 rounded-[2rem] overflow-hidden flex flex-col max-h-[90vh]">
          {selectedSubmission && (
            <>
              <div className="p-6 border-b border-border bg-secondary/10 shrink-0 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary text-lg font-black">{selectedSubmission.kyc_level}</div>
                  <div>
                    <h2 className="text-lg font-bold text-foreground">Level {selectedSubmission.kyc_level} Verification</h2>
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{selectedSubmission.user?.name || selectedSubmission.full_name}</p>
                  </div>
                </div>
                <Badge className={`uppercase text-[10px] font-black tracking-widest px-3 py-1.5 ${selectedSubmission.status === 'Verified' ? 'bg-green-500 text-white' : selectedSubmission.status === 'Pending' ? 'bg-amber-500 text-white' : 'bg-red-500 text-white'}`}>
                  {selectedSubmission.status}
                </Badge>
              </div>

              <div className="p-6 overflow-y-auto flex-1 space-y-8">
                {selectedSubmission.kyc_level === 1 && (
                  <div className="grid grid-cols-2 gap-4">
                    {[{l:'Full Name', v: selectedSubmission.full_name}, {l: 'Date of Birth', v: selectedSubmission.date_of_birth}, {l: 'Country', v: selectedSubmission.country}, {l: 'Phone', v: selectedSubmission.phone}, {l: 'Residential Address', v: selectedSubmission.address}].map(({l,v}) => v ? (
                      <div key={l} className="p-4 rounded-2xl bg-secondary/30 border border-border">
                        <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{l}</div>
                        <div className="text-sm font-bold text-foreground mt-1">{v}</div>
                      </div>
                    ) : null)}
                  </div>
                )}

                {selectedSubmission.kyc_level === 2 && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 rounded-2xl bg-secondary/30 border border-border">
                        <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Document Type</div>
                        <div className="text-sm font-bold text-foreground mt-1">{selectedSubmission.id_type || 'N/A'}</div>
                      </div>
                      <div className="p-4 rounded-2xl bg-secondary/30 border border-border">
                        <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Document Number</div>
                        <div className="text-sm font-bold text-foreground mt-1 font-mono">{selectedSubmission.id_number || 'N/A'}</div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      {selectedSubmission.document_front && (
                        <div onClick={() => setPreviewImage(selectedSubmission.document_front)} className="group relative rounded-2xl border border-border bg-card overflow-hidden h-48 hover:border-primary transition-all cursor-zoom-in shadow-sm">
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-10">
                            <span className="text-white text-xs font-bold uppercase tracking-widest bg-black/50 px-4 py-2 rounded-full backdrop-blur-md"><Eye className="w-4 h-4 inline mr-2" />Preview Image</span>
                          </div>
                          <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-sm px-3 py-1 rounded-lg text-[9px] font-black text-white uppercase tracking-widest z-10 border border-white/10">Front Side</div>
                          <img src={selectedSubmission.document_front} className="w-full h-full object-cover" alt="ID Front" />
                        </div>
                      )}
                      {selectedSubmission.document_back && (
                        <div onClick={() => setPreviewImage(selectedSubmission.document_back)} className="group relative rounded-2xl border border-border bg-card overflow-hidden h-48 hover:border-primary transition-all cursor-zoom-in shadow-sm">
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-10">
                            <span className="text-white text-xs font-bold uppercase tracking-widest bg-black/50 px-4 py-2 rounded-full backdrop-blur-md"><Eye className="w-4 h-4 inline mr-2" />Preview Image</span>
                          </div>
                          <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-sm px-3 py-1 rounded-lg text-[9px] font-black text-white uppercase tracking-widest z-10 border border-white/10">Back Side</div>
                          <img src={selectedSubmission.document_back} className="w-full h-full object-cover" alt="ID Back" />
                        </div>
                      )}
                      {selectedSubmission.selfie_url && (
                        <div onClick={() => setPreviewImage(selectedSubmission.selfie_url)} className="group col-span-2 md:col-span-1 relative rounded-2xl border border-border bg-card overflow-hidden h-48 hover:border-primary transition-all cursor-zoom-in shadow-sm">
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-10">
                            <span className="text-white text-xs font-bold uppercase tracking-widest bg-black/50 px-4 py-2 rounded-full backdrop-blur-md"><Eye className="w-4 h-4 inline mr-2" />Preview Image</span>
                          </div>
                          <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-sm px-3 py-1 rounded-lg text-[9px] font-black text-white uppercase tracking-widest z-10 border border-white/10">Selfie</div>
                          <img src={selectedSubmission.selfie_url} className="w-full h-full object-cover object-top" alt="Selfie" />
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {selectedSubmission.kyc_level === 3 && (
                  <div className="space-y-6">
                    <div className="p-4 rounded-2xl bg-secondary/30 border border-border">
                      <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Document Type</div>
                      <div className="text-sm font-bold text-foreground mt-1">{selectedSubmission.address_doc_type || 'N/A'}</div>
                    </div>
                    {selectedSubmission.address_doc_url && (
                      <div onClick={() => setPreviewImage(selectedSubmission.address_doc_url)} className="group relative rounded-2xl border border-border bg-card overflow-hidden h-64 hover:border-primary transition-all cursor-zoom-in shadow-sm w-full md:w-2/3">
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-10">
                          <span className="text-white text-xs font-bold uppercase tracking-widest bg-black/50 px-4 py-2 rounded-full backdrop-blur-md"><Eye className="w-4 h-4 inline mr-2" />Preview Document</span>
                        </div>
                        <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-sm px-3 py-1 rounded-lg text-[9px] font-black text-white uppercase tracking-widest z-10 border border-white/10">Proof of Address</div>
                        {selectedSubmission.address_doc_url.toLowerCase().endsWith('.pdf') ? (
                           <div className="w-full h-full flex flex-col justify-center items-center bg-secondary/50">
                              <FileText className="w-16 h-16 text-primary mb-2 opacity-50" />
                              <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">PDF Document</span>
                           </div>
                        ) : (
                           <img src={selectedSubmission.address_doc_url} className="w-full h-full object-cover" alt="Address Proof" />
                        )}
                      </div>
                    )}
                  </div>
                )}
                
                {selectedSubmission.status === 'Rejected' && selectedSubmission.rejection_reason && (
                  <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20">
                    <h4 className="text-[10px] font-black text-red-600 uppercase tracking-widest mb-1.5 flex items-center gap-1"><AlertCircle className="w-3.5 h-3.5" /> Rejection Reason</h4>
                    <p className="text-sm text-foreground">{selectedSubmission.rejection_reason}</p>
                  </div>
                )}
              </div>

              <div className="p-6 border-t border-border bg-secondary/5 shrink-0 flex flex-col sm:flex-row gap-3">
                <Button variant="outline" className="flex-1 h-12 rounded-xl text-xs font-bold uppercase tracking-widest" onClick={() => setSelectedSubmission(null)}>Close Review</Button>
                {selectedSubmission.status === 'Pending' && (
                  <>
                    <Button variant="outline" className="flex-1 h-12 rounded-xl text-xs font-bold uppercase tracking-widest border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300" onClick={() => { 
                      setSelectedSubmission(null);
                      setTimeout(() => setRejectionDialog(selectedSubmission), 200); 
                    }}>
                      <X className="w-4 h-4 mr-2" /> Reject
                    </Button>
                    <Button variant="hero" className="flex-1 h-12 rounded-xl text-xs font-bold uppercase tracking-widest text-white shadow-gold" onClick={() => handleApprove(selectedSubmission)}>
                      Approve <CheckCircle className="w-4 h-4 ml-2" />
                    </Button>
                  </>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
      
      {/* Rejection Dialog */}
      <Dialog open={!!rejectionDialog} onOpenChange={(open) => { if(!open) { setRejectionDialog(null); setRejectionReason(''); } }}>
        <DialogContent className="bg-card border-border shadow-huge p-8 max-w-md rounded-2xl">
          {rejectionDialog && (
            <>
              <DialogHeader>
                <DialogTitle className="text-lg font-bold text-foreground">Reject Validation</DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground mt-1">
                  Specify why this Level {rejectionDialog.kyc_level} submission is being rejected. The user will see this message.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Provide a clear reason..."
                  rows={4}
                  className="w-full px-4 py-3 rounded-xl bg-secondary/50 border border-border text-sm text-foreground outline-none focus:border-primary transition-all resize-none"
                />
                <div className="flex gap-2 flex-wrap">
                  {['Blurred Image', 'Expired Document', 'Information Mismatch', 'Missing Document'].map(r => (
                    <button key={r} onClick={() => setRejectionReason(r)} className="text-[10px] font-bold text-muted-foreground px-3 py-1.5 rounded-lg bg-secondary border border-border hover:text-primary transition-all">{r}</button>
                  ))}
                </div>
              </div>
              <DialogFooter className="mt-6">
                <Button variant="outline" className="flex-1 h-11 rounded-xl" onClick={() => { setRejectionDialog(null); setRejectionReason(''); }}>Cancel</Button>
                <Button variant="destructive" className="flex-1 h-11 rounded-xl font-bold" disabled={!rejectionReason.trim()} onClick={handleReject}>Reject Submission</Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Lightbox */}
      <Dialog open={!!previewImage} onOpenChange={(open) => { if(!open) setPreviewImage(null); }}>
        <DialogContent className="max-w-[95vw] lg:max-w-[80vw] p-0 bg-transparent border-none shadow-none flex items-center justify-center">
          {previewImage && (
             <div className="relative group w-full flex flex-col items-center">
                <div className="absolute -top-12 left-1/2 -translate-x-1/2 flex items-center gap-4 bg-black/80 backdrop-blur-xl px-6 py-2 rounded-full border border-white/10 z-50">
                   <div className="text-[10px] font-black text-white uppercase tracking-widest">Document Preview</div>
                   <button onClick={() => setPreviewImage(null)} className="text-white/60 hover:text-white transition-colors ml-4"><X className="w-4 h-4" /></button>
                </div>
                {previewImage.toLowerCase().endsWith('.pdf') ? (
                  <iframe src={previewImage} className="w-full h-[85vh] rounded-3xl bg-white" />
                ) : (
                  <img src={previewImage} className="max-h-[85vh] w-auto rounded-3xl border border-white/10 shadow-huge bg-black/50" alt="Preview" />
                )}
             </div>
          )}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminKYC;
