import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import AdminLayout from "@/components/layouts/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useStore } from "@/store/useStore";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import {
  Search, Filter, RefreshCw, Download, CheckCircle2, XCircle,
  ExternalLink, Clock, Eye, AlertTriangle, ShieldCheck, Flag,
  Wallet, Globe, Copy, ChevronDown, X, Camera
} from "lucide-react";
import {
  Dialog, DialogContent, DialogDescription, DialogTitle,
} from "@/components/ui/dialog";
import {
  DEPOSIT_STATUS_CONFIG, SUPPORTED_ASSETS, getExplorerUrl,
  type DepositStatus
} from "@/lib/deposit-helpers";

type StatusFilter = "all" | DepositStatus;

const AdminDeposits = () => {
  const { user, formatCurrency, addAuditLog } = useStore();
  const [deposits, setDeposits] = useState<any[]>([]);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDeposit, setSelectedDeposit] = useState<any | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const fetchDeposits = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("crypto_deposits")
        .select("*, profiles:user_id(name, email, avatar_url)")
        .order("created_at", { ascending: false });
      
      if (error) {
        if (error.code === '42P01' || error.message.includes('schema cache')) {
           toast.error("Database Table Missing", {
             description: "The 'crypto_deposits' table was not found. Please ensure you have run the migration script in your Supabase SQL Editor.",
             duration: 10000
           });
        }
        throw error;
      }
      if (data) setDeposits(data);
    } catch (err: any) {
      console.error("Fetch deposits error:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDeposits();
    const channel = supabase
      .channel("admin-crypto-deposits")
      .on("postgres_changes", { event: "*", schema: "public", table: "crypto_deposits" }, () => fetchDeposits())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchDeposits]);

  const filtered = deposits.filter((d: any) => {
    if (statusFilter !== "all" && d.status !== statusFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      const name = d.profiles?.name?.toLowerCase() || "";
      const email = d.profiles?.email?.toLowerCase() || "";
      const ref = d.reference_id?.toLowerCase() || "";
      const txid = d.txid?.toLowerCase() || "";
      if (!name.includes(q) && !email.includes(q) && !ref.includes(q) && !txid.includes(q)) return false;
    }
    return true;
  });

  const handleApprove = async (dep: any) => {
    setActionLoading(true);
    try {
      const actualAmount = Number(dep.actual_amount || dep.amount_expected);
      
      // 1. Update deposit status and actual amount
      const { error: depErr } = await supabase.from("crypto_deposits").update({
        status: "approved", 
        verified_by: user?.id, 
        verified_at: new Date().toISOString(),
        actual_amount: actualAmount // Assuming we added this column
      }).eq("id", dep.id);
      if (depErr) throw depErr;

      // 2. Fetch platform settings for fee calculation
      const { data: pSettings } = await supabase.from('platform_settings').select('*').eq('id', 1).maybeSingle();
      const feePercent = pSettings?.platformFeePercent || 0;
      const feeAmount = parseFloat((actualAmount * (feePercent / 100)).toFixed(8));
      const netAmount = parseFloat((actualAmount - feeAmount).toFixed(8));

      // 3. Credit user balance
      const { data: bal } = await supabase.from("balances").select("*").eq("user_id", dep.user_id).maybeSingle();
      const cryptoBalances = bal?.crypto_balances || {};
      const assetKey = dep.asset?.toLowerCase();
      const current = Number(cryptoBalances[assetKey] || 0);
      const updated = { ...cryptoBalances, [assetKey]: current + netAmount };

      if (bal) {
        await supabase.from("balances").update({ crypto_balances: updated }).eq("user_id", dep.user_id);
      } else {
        await supabase.from("balances").insert({ user_id: dep.user_id, crypto_balances: updated });
      }

      // 4. Create transaction record
      const { data: txData } = await supabase.from("transactions").insert({
        user_id: dep.user_id,
        type: "Deposit",
        amount: actualAmount,
        asset: dep.asset,
        status: "Completed",
        metadata: {
          tx_hash: dep.txid,
          method: "Crypto Deposit",
          reference_id: dep.reference_id,
          fee_deducted: feeAmount,
          net_credited: netAmount,
          expected_amount: dep.amount_expected,
          actual_amount: actualAmount
        }
      }).select().single();

      // 5. Record fee in ledger if applicable
      if (feeAmount > 0 && txData) {
        await supabase.from('fee_ledger').insert([{
          transaction_id: txData.id,
          user_id: dep.user_id,
          gross_amount: actualAmount,
          fee_percent: feePercent,
          fee_amount: feeAmount,
          net_amount: netAmount,
          asset: dep.asset
        }]);
      }

      // 6. Notify user
      await supabase.from("notifications").insert({
        user_id: dep.user_id,
        title: "Deposit Approved",
        message: `Your ${dep.asset} deposit has been verified. Received: ${actualAmount} ${dep.asset}. ${feeAmount > 0 ? `A fee of ${feeAmount} was applied, and ` : ''}${netAmount} ${dep.asset} has been credited. Ref: ${dep.reference_id}`,
        type: "DEPOSIT",
        is_read: false
      });

      // 7. Audit log
      await addAuditLog({
        action: "Deposit Approved",
        details: `Approved ${actualAmount} ${dep.asset} deposit (Expected: ${dep.amount_expected}). Ref: ${dep.reference_id}.`,
        type: "finance"
      });

      toast.success("Deposit approved and balance credited.");
      setSelectedDeposit(null);
      fetchDeposits();
    } catch (err: any) {
      toast.error("Approval failed: " + err.message);
    } finally {
      setActionLoading(false);
    }
  };


  const handleReject = async (dep: any) => {
    if (!rejectReason.trim()) { toast.error("Please provide a rejection reason."); return; }
    setActionLoading(true);
    try {
      const { error } = await supabase.from("crypto_deposits").update({
        status: "rejected", 
        rejection_reason: rejectReason, 
        verified_by: user?.id, 
        verified_at: new Date().toISOString()
      }).eq("id", dep.id);
      if (error) throw error;

      await supabase.from("notifications").insert({
        user_id: dep.user_id, title: "Deposit Rejected",
        message: `Your ${dep.asset} deposit (Ref: ${dep.reference_id}) was not approved. Reason: ${rejectReason}`,
        type: "SYSTEM", is_read: false
      });

      await addAuditLog({ action: "Deposit Rejected", details: `Rejected ${dep.amount_expected} ${dep.asset}. Ref: ${dep.reference_id}. Reason: ${rejectReason}`, type: "finance" });

      toast.success("Deposit rejected.");
      setSelectedDeposit(null);
      setRejectReason("");
      fetchDeposits();
    } catch (err: any) {
      toast.error("Rejection failed: " + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleFlag = async (dep: any) => {
    setActionLoading(true);
    try {
      await supabase.from("crypto_deposits").update({ status: "under_review" }).eq("id", dep.id);
      await addAuditLog({ action: "Deposit Flagged", details: `Flagged for review: ${dep.amount_expected} ${dep.asset}. Ref: ${dep.reference_id}`, type: "finance" });
      toast.success("Deposit flagged for further review.");
      fetchDeposits();
    } catch (err: any) {
      toast.error("Failed to flag: " + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const pendingCount = deposits.filter(d => d.status === "pending" || d.status === "submitted").length;

  const statusTabs: { value: StatusFilter; label: string }[] = [
    { value: "all", label: `All (${deposits.length})` },
    { value: "submitted", label: `Submitted (${deposits.filter(d => d.status === "submitted").length})` },
    { value: "pending", label: `Pending (${deposits.filter(d => d.status === "pending").length})` },
    { value: "under_review", label: `Review (${deposits.filter(d => d.status === "under_review").length})` },
    { value: "approved", label: `Approved` },
    { value: "rejected", label: `Rejected` },
  ];

  return (
    <AdminLayout>
      <div className="space-y-8">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-border">
          <div>
            <h1 className="text-3xl font-black text-foreground tracking-tight uppercase">Crypto Deposit Verification</h1>
            <p className="text-muted-foreground text-sm font-medium mt-1">Review, verify, and process manual crypto deposits.</p>
          </div>
          <div className="flex items-center gap-3">
            {pendingCount > 0 && (
              <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-600">
                <Clock className="w-4 h-4 animate-pulse" />
                <span className="text-xs font-black uppercase tracking-widest">{pendingCount} Awaiting Action</span>
              </div>
            )}
            <Button variant="outline" onClick={fetchDeposits} className="h-11 border-border text-[10px] font-black uppercase tracking-[0.2em] px-6 rounded-xl group">
              <RefreshCw className={`w-4 h-4 mr-2 group-hover:rotate-180 transition-transform duration-500 ${isLoading ? "animate-spin" : ""}`} /> Refresh
            </Button>
          </div>
        </header>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: "Total Deposits", value: deposits.length, color: "text-foreground", bg: "bg-secondary" },
            { label: "Pending Review", value: deposits.filter(d => ["pending", "submitted", "under_review"].includes(d.status)).length, color: "text-amber-500", bg: "bg-amber-500/10" },
            { label: "Approved", value: deposits.filter(d => d.status === "approved").length, color: "text-green-500", bg: "bg-green-500/10" },
            { label: "Rejected", value: deposits.filter(d => d.status === "rejected").length, color: "text-red-500", bg: "bg-red-500/10" },
          ].map(s => (
            <div key={s.label} className="p-5 rounded-2xl bg-card border border-border">
              <div className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mb-2">{s.label}</div>
              <div className={`text-2xl font-black ${s.color}`}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="bg-card rounded-3xl border border-border shadow-sm overflow-hidden">
          <div className="p-4 sm:p-6 border-b border-border bg-secondary/10">
            <div className="flex flex-col lg:flex-row items-center gap-4">
              <div className="flex items-center gap-1 overflow-x-auto no-scrollbar w-full pb-1 lg:pb-0">
                {statusTabs.map(t => (
                  <button key={t.value} onClick={() => setStatusFilter(t.value)}
                    className={`px-4 py-3 text-[9px] font-black uppercase tracking-[0.15em] whitespace-nowrap rounded-lg transition-all ${statusFilter === t.value ? "bg-card text-primary shadow-sm border border-border" : "text-muted-foreground hover:text-foreground"
                      }`}>{t.label}</button>
                ))}
              </div>
              <div className="relative w-full lg:w-72">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/30" />
                <Input placeholder="Search by name, email, ref, TXID..." value={search} onChange={(e: any) => setSearch(e.target.value)}
                  className="h-12 pl-12 bg-background border-border rounded-xl text-xs font-bold" />
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="p-4 sm:p-6">
            {/* Desktop */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/50 border-b border-border">
                    <th className="text-left py-4 pl-4">User / Reference</th>
                    <th className="text-left py-4">Asset / Amount</th>
                    <th className="text-left py-4">TXID</th>
                    <th className="text-center py-4">Status</th>
                    <th className="text-right py-4 pr-4">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/30">
                  {filtered.length === 0 ? (
                    <tr><td colSpan={5} className="py-20 text-center text-muted-foreground font-bold uppercase tracking-widest opacity-30">No deposits found</td></tr>
                  ) : filtered.map((d: any) => {
                    const sc = DEPOSIT_STATUS_CONFIG[d.status as DepositStatus] || DEPOSIT_STATUS_CONFIG.pending;
                    const asset = SUPPORTED_ASSETS.find(a => a.symbol === d.asset);
                    return (
                      <tr key={d.id} className="group hover:bg-secondary/20 transition-colors">
                        <td className="py-5 pl-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center text-muted-foreground/40 overflow-hidden shrink-0">
                              {d.profiles?.avatar_url ? <img src={d.profiles.avatar_url} className="w-full h-full object-cover" /> : <Globe className="w-4 h-4" />}
                            </div>
                            <div>
                              <div className="text-sm font-bold text-foreground">{d.profiles?.name || "Member"}</div>
                              <div className="text-[10px] font-bold text-muted-foreground/50 uppercase tracking-widest">{d.reference_id}</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-5">
                          <div className="flex items-center gap-2">
                            <span className={`text-lg font-black ${asset?.color || "text-primary"}`}>{asset?.icon || d.asset[0]}</span>
                            <div>
                              <div className="text-sm font-black text-foreground">{d.amount_expected} {d.asset}</div>
                              <div className="text-[10px] font-bold text-muted-foreground/50 uppercase">{d.network}</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-5">
                          {d.txid ? (
                            <div className="flex items-center gap-2">
                              <span className="text-[11px] font-mono text-muted-foreground truncate max-w-[140px]">{d.txid}</span>
                              <button onClick={() => window.open(getExplorerUrl(d.network, d.txid), "_blank")} className="text-primary hover:underline">
                                <ExternalLink className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : (
                            <span className="text-[10px] text-muted-foreground/30 font-bold uppercase tracking-widest">Not submitted</span>
                          )}
                        </td>
                        <td className="py-5 text-center">
                          <Badge className={`text-[8px] font-black uppercase tracking-widest px-2.5 py-1 border ${sc.color} ${sc.bg} ${sc.border}`}>{sc.label}</Badge>
                        </td>
                        <td className="py-5 pr-4 text-right">
                          {["pending", "submitted", "under_review"].includes(d.status) ? (
                            <div className="flex justify-end gap-2">
                              <Button size="sm" onClick={() => setSelectedDeposit({ ...d, action: "approve" })}
                                className="h-8 px-4 bg-green-500 text-white hover:bg-green-600 rounded-lg text-[9px] font-black uppercase tracking-widest">Approve</Button>
                              <Button size="sm" variant="outline" onClick={() => setSelectedDeposit({ ...d, action: "reject" })}
                                className="h-8 px-4 border-red-500/30 text-red-500 hover:bg-red-500/10 rounded-lg text-[9px] font-black uppercase tracking-widest">Reject</Button>
                              {d.status !== "under_review" && (
                                <Button size="sm" variant="outline" onClick={() => handleFlag(d)}
                                  className="h-8 w-8 p-0 border-amber-500/30 text-amber-500 hover:bg-amber-500/10 rounded-lg"><Flag className="w-3.5 h-3.5" /></Button>
                              )}
                            </div>
                          ) : (
                            <span className="text-[10px] text-muted-foreground/30 font-black uppercase tracking-widest">
                              {new Date(d.verified_at || d.updated_at).toLocaleDateString()}
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="lg:hidden space-y-4">
              {filtered.length === 0 ? (
                <div className="py-16 text-center text-muted-foreground/30 font-bold uppercase tracking-widest">No deposits found</div>
              ) : filtered.map((d: any) => {
                const sc = DEPOSIT_STATUS_CONFIG[d.status as DepositStatus] || DEPOSIT_STATUS_CONFIG.pending;
                const asset = SUPPORTED_ASSETS.find(a => a.symbol === d.asset);
                return (
                  <div key={d.id} className="p-5 rounded-2xl bg-secondary/10 border border-border space-y-4">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl bg-secondary flex items-center justify-center text-lg font-black ${asset?.color || "text-primary"}`}>{asset?.icon || "?"}</div>
                        <div>
                          <div className="text-sm font-bold text-foreground">{d.profiles?.name || "Member"}</div>
                          <div className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">{d.reference_id}</div>
                        </div>
                      </div>
                      <Badge className={`text-[8px] font-black uppercase ${sc.color} ${sc.bg} ${sc.border}`}>{sc.label}</Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 rounded-xl bg-card border border-border">
                        <div className="text-[8px] font-black text-muted-foreground uppercase mb-1">Amount</div>
                        <div className="text-sm font-black text-foreground">{d.amount_expected} {d.asset}</div>
                      </div>
                      <div className="p-3 rounded-xl bg-card border border-border">
                        <div className="text-[8px] font-black text-muted-foreground uppercase mb-1">Network</div>
                        <div className="text-sm font-black text-foreground uppercase">{d.network}</div>
                      </div>
                    </div>
                    {d.txid && (
                      <div className="flex items-center gap-2 p-3 rounded-xl bg-card border border-border">
                        <span className="text-[10px] font-mono text-muted-foreground truncate flex-1">{d.txid}</span>
                        <button onClick={() => window.open(getExplorerUrl(d.network, d.txid), "_blank")} className="text-primary shrink-0"><ExternalLink className="w-4 h-4" /></button>
                      </div>
                    )}
                    {["pending", "submitted", "under_review"].includes(d.status) && (
                      <div className="flex gap-2">
                        <Button className="flex-1 h-10 rounded-xl bg-green-500 text-white text-[10px] font-black uppercase tracking-widest" onClick={() => setSelectedDeposit({ ...d, action: "approve" })}>Approve</Button>
                        <Button variant="outline" className="flex-1 h-10 rounded-xl border-red-500/30 text-red-500 text-[10px] font-black uppercase tracking-widest" onClick={() => setSelectedDeposit({ ...d, action: "reject" })}>Reject</Button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Action Modal */}
      <AnimatePresence>
        {selectedDeposit && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" onClick={() => { setSelectedDeposit(null); setRejectReason(""); }} />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed inset-4 sm:inset-auto sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 z-50 bg-card border border-border rounded-3xl shadow-huge sm:w-[520px] max-h-[90vh] overflow-y-auto p-6 sm:p-8 space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-black text-foreground uppercase tracking-tight">
                  {selectedDeposit.action === "approve" ? "Approve Deposit" : "Reject Deposit"}
                </h3>
                <button onClick={() => { setSelectedDeposit(null); setRejectReason(""); }} className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center hover:bg-secondary/80"><X className="w-4 h-4" /></button>
              </div>

              <div className="space-y-3 p-5 rounded-2xl bg-secondary/30 border border-border">
                {[
                  { label: "User", value: selectedDeposit.profiles?.name || "Member" },
                  { label: "Email", value: selectedDeposit.profiles?.email || "—" },
                  { label: "Asset", value: `${selectedDeposit.amount_expected} ${selectedDeposit.asset}` },
                  { label: "Network", value: selectedDeposit.network?.toUpperCase() },
                  { label: "Reference", value: selectedDeposit.reference_id },
                  { label: "TXID", value: selectedDeposit.txid || "Not submitted", mono: true },
                ].map((item: any) => (
                  <div key={item.label} className="flex justify-between items-center gap-3">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{item.label}</span>
                    <span className={`text-xs font-bold text-foreground text-right truncate max-w-[250px] ${item.mono ? "font-mono text-[11px]" : ""}`}>{item.value}</span>
                  </div>
                ))}
                {selectedDeposit.amount_usd && (
                  <div className="flex justify-between items-center gap-3 pt-1 border-t border-border/20">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Initial USD</span>
                    <span className="text-xs font-black text-foreground">${selectedDeposit.amount_usd} (@ ${selectedDeposit.conversion_rate})</span>
                  </div>
                )}
              </div>


              {selectedDeposit.proof_image && (
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest block">Transaction Proof (Screenshot)</label>
                  <div onClick={() => setPreviewImage(selectedDeposit.proof_image)} 
                    className="relative group rounded-2xl border border-border bg-secondary/20 h-40 overflow-hidden cursor-zoom-in hover:border-primary transition-all">
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-10">
                      <span className="text-white text-[10px] font-black uppercase tracking-widest bg-black/50 px-4 py-2 rounded-full backdrop-blur-md">
                        <Eye className="w-4 h-4 inline mr-2" /> View Screenshot
                      </span>
                    </div>
                    <img src={selectedDeposit.proof_image} className="w-full h-full object-cover" />
                  </div>
                </div>
              )}

              {selectedDeposit.txid && (
                <Button variant="outline" onClick={() => window.open(getExplorerUrl(selectedDeposit.network, selectedDeposit.txid), "_blank")}
                  className="w-full h-11 rounded-xl border-border text-xs font-black uppercase tracking-widest gap-2">
                  <ExternalLink className="w-4 h-4" /> View on Blockchain Explorer
                </Button>
              )}

              {selectedDeposit.action === "reject" && (
                <div>
                  <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-2 block">Rejection Reason (Required)</label>
                  <textarea value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} placeholder="Provide a clear reason for rejection..."
                    className="w-full h-24 p-4 bg-secondary/50 border border-border rounded-xl text-sm font-medium resize-none focus:outline-none focus:border-primary/50" />
                </div>
              )}

              {selectedDeposit.action === "approve" && (
                <div className="space-y-4">
                  <div className="flex flex-col gap-3 p-4 rounded-xl bg-green-500/10 border border-green-500/20">
                    <div className="flex items-start gap-3">
                      <ShieldCheck className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                      <p className="text-xs text-green-600 font-medium leading-relaxed">
                        Verify the transaction on the blockchain. Enter the actual amount received below to credit the user.
                      </p>
                    </div>
                  </div>
                  
                  <div>
                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-2 block">Actual Amount Received ({selectedDeposit.asset})</label>
                    <Input 
                      type="number" 
                      defaultValue={selectedDeposit.amount_expected} 
                      id="actual-amount"
                      className="h-12 bg-secondary/50 border-border rounded-xl text-sm font-black" 
                    />
                  </div>

                  <div className="pl-2 space-y-1">
                    <div className="flex justify-between text-[10px] font-black uppercase text-green-700/60">
                      <span>Expected Amount</span>
                      <span>{selectedDeposit.amount_expected} {selectedDeposit.asset}</span>
                    </div>
                    <div className="flex justify-between text-[10px] font-black uppercase text-green-700/60">
                      <span>Platform Fee</span>
                      <span>Calculated on Actual Amount</span>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                {selectedDeposit.action === "approve" ? (
                  <Button onClick={() => {
                    const actual = (document.getElementById('actual-amount') as HTMLInputElement)?.value;
                    handleApprove({ ...selectedDeposit, actual_amount: parseFloat(actual || '0') });
                  }} disabled={actionLoading}
                    className="flex-1 h-12 rounded-xl bg-green-500 text-white font-black text-xs uppercase tracking-widest hover:bg-green-600">
                    {actionLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : "Confirm Approval"}
                  </Button>
                ) : (
                  <Button onClick={() => handleReject(selectedDeposit)} disabled={actionLoading || !rejectReason.trim()}
                    className="flex-1 h-12 rounded-xl bg-red-500 text-white font-black text-xs uppercase tracking-widest hover:bg-red-600">
                    {actionLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : "Confirm Rejection"}
                  </Button>
                )}
                <Button variant="outline" onClick={() => { setSelectedDeposit(null); setRejectReason(""); }}
                  className="h-12 px-6 rounded-xl border-border font-black text-xs uppercase tracking-widest">Cancel</Button>
              </div>

            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Lightbox */}
      <Dialog open={!!previewImage} onOpenChange={(open) => { if(!open) setPreviewImage(null); }}>
        <DialogContent className="max-w-[95vw] lg:max-w-[80vw] p-0 bg-transparent border-none shadow-none flex items-center justify-center">
          <DialogTitle className="sr-only">Proof Preview</DialogTitle>
          <DialogDescription className="sr-only">Viewing uploaded transaction proof image</DialogDescription>
          {previewImage && (
             <div className="relative group w-full flex flex-col items-center">
                <div className="absolute -top-12 left-1/2 -translate-x-1/2 flex items-center gap-4 bg-black/80 backdrop-blur-xl px-6 py-2 rounded-full border border-white/10 z-50">
                   <div className="text-[10px] font-black text-white uppercase tracking-widest flex items-center gap-2"><Camera className="w-4 h-4" /> Proof Preview</div>
                   <button onClick={() => setPreviewImage(null)} className="text-white/60 hover:text-white transition-colors ml-4"><X className="w-4 h-4" /></button>
                </div>
                <img src={previewImage} className="max-h-[85vh] w-auto rounded-3xl border border-white/10 shadow-huge bg-black/50" alt="Proof Preview" />
             </div>
          )}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminDeposits;
