import { useState, useEffect, useCallback } from "react";
import AdminLayout from "@/components/layouts/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Search, Shield, CheckCircle, DollarSign, X, Snowflake, Flame, Eye,
  Filter, UserPlus, ArrowUpRight, ShieldCheck, Zap, Clock, ExternalLink,
  Globe, Coins, Target, Activity, Trash2, UserCog, UserCheck, TrendingUp,
  MoreHorizontal, Wallet, Shield as ShieldIcon
} from "lucide-react";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Tooltip, TooltipContent, TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { useStore, AppUser } from "@/store/useStore";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";

const UserManagement = () => {
  const [users, setUsers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const { formatCurrency } = useStore();
  
  const [balanceDialog, setBalanceDialog] = useState<AppUser | null>(null);
  const [selectedCurrency, setSelectedCurrency] = useState<string>("BTC");
  const [balanceAction, setBalanceAction] = useState<"credit" | "debit">("credit");
  const [balanceAmount, setBalanceAmount] = useState("");
  const [activeSessions, setActiveSessions] = useState<any[]>([]);
  const [allTransactions, setAllTransactions] = useState<any[]>([]);
  const [viewUser, setViewUser] = useState<AppUser | null>(null);
  const [selectedSubmission, setSelectedSubmission] = useState<any | null>(null);
  const [allKycSubmissions, setAllKycSubmissions] = useState<any[]>([]);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [rejectionDialog, setRejectionDialog] = useState<{ userId: string; userName: string; level: number } | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  const fetchUserKyc = async (userId: string | number) => {
    const { data } = await supabase
      .from('kyc_submissions')
      .select('*')
      .eq('user_id', userId)
      .order('kyc_level', { ascending: true });
    
    setAllKycSubmissions(data || []);
    // Keep latest single submission for backward compat
    if (data && data.length > 0) {
      setSelectedSubmission(data[data.length - 1]);
    } else {
      setSelectedSubmission(null);
    }
  };

  const handleViewUser = (u: AppUser) => {
     setViewUser(u);
     fetchUserKyc(u.id);
  };


  const fetchAppData = useCallback(async () => {
    try {
        const { data: profiles, error: pError } = await supabase.from('profiles').select('*, balances:balances(*)');
        if (pError) throw pError;

        if (profiles) {
            const mappedUsers = profiles.map(p => {
                const b = Array.isArray(p.balances) ? p.balances[0] : p.balances;
                const fiat = Number(b?.fiat_balance || 0);
                const trading = Number(b?.trading_balance || 0);
                const copyTrading = Number(b?.copy_trading_balance || 0);
                const crypto = b?.crypto_balances || {};
                
                // Calculate Crypto Total (Estimated)
                const cryptoPrices: Record<string, number> = { btc: 65000, eth: 3500, usdt: 1, sol: 145, usdc: 1 };
                const cryptoTotal = Object.entries(crypto).reduce((acc, [coin, amount]) => {
                    return acc + (Number(amount) * (cryptoPrices[coin.toLowerCase()] || 0));
                }, 0);

                return {
                    id: p.id,
                    name: p.name,
                    email: p.email,
                    phone: p.phone,
                    role: p.role,
                    status: p.status,
                    kyc: p.kyc,
                    frozen: p.frozen,
                    joined: p.created_at,
                    balanceNum: fiat + trading + copyTrading + cryptoTotal, // Total Balance
                    cryptoBalanceNum: cryptoTotal,
                    fiatBalanceNum: fiat,
                    tradingBalance: trading,
                    copyTradingBalance: copyTrading,
                    balances: crypto,
                    referralCode: p.referral_code,
                    default_currency: p.default_currency || 'USD',
                    preferred_currency: p.preferred_currency,
                    theme_preference: p.theme_preference || 'system',
                    admin_theme_preference: p.admin_theme_preference || 'light',
                    avatar_url: p.avatar_url,
                    current_plan: p.current_plan || 'Starter'
                };
            }) as AppUser[];
            setUsers(mappedUsers);
        }

        const [{ data: sessions }, { data: txs }] = await Promise.all([
            supabase.from('active_sessions').select('*'),
            supabase.from('transactions').select('*')
        ]);
        
        if (sessions) setActiveSessions(sessions);
        if (txs) setAllTransactions(txs);
        
    } catch (err: any) {
        console.error("Failed to fetch user analytics", err);
        toast.error("Database connection failed", {
            description: err.message || "Please check your connectivity or permissions."
        });
    } finally {
        setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAppData();

    // Listen for profile changes (roles, status, etc)
    const profileSub = supabase
      .channel('admin-profiles-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'profiles' },
        () => fetchAppData()
      )
      .subscribe();

    // Listen for balance changes
    const balanceSub = supabase
      .channel('admin-balances-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'balances' },
        () => fetchAppData()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(profileSub);
      supabase.removeChannel(balanceSub);
    };
  }, [fetchAppData]);

  const filtered = (users || []).filter(
    (u) => u && ((u.name?.toLowerCase() || "").includes(search.toLowerCase()) || (u.email?.toLowerCase() || "").includes(search.toLowerCase()))
  );

  const handleFreeze = async (id: string | number, name: string) => {
    const user = users.find(u => u.id === id);
    if (!user) return;
    const { error } = await supabase.from('profiles').update({ frozen: !user.frozen }).eq('id', id);
    if (!error) {
       toast.success(`Account status updated for ${name}`);
       fetchAppData();
    } else {
       toast.error(error.message);
    }
  };

  const handleKycApprove = async (id: string | number, name: string, level?: number) => {
    // Approve specific submission level
    if (level) {
      const sub = allKycSubmissions.find(s => s.kyc_level === level && s.user_id === id);
      if (sub) {
        await supabase.from('kyc_submissions').update({ status: 'Verified', reviewed_at: new Date().toISOString() }).eq('id', sub.id);
      }
    }
    // Update profile KYC status
    const { error } = await supabase.from('profiles').update({ kyc: 'Verified' }).eq('id', id);
    if (!error) {
       toast.success(`${level ? `Level ${level} a` : 'A'}pproved for ${name}`);
       fetchAppData();
       if (viewUser) fetchUserKyc(id);
    } else {
       toast.error(error.message);
    }
  };

  const handleKycReject = async (id: string | number, name: string, level?: number, reason?: string) => {
    // Reject specific submission level
    if (level) {
      const sub = allKycSubmissions.find(s => s.kyc_level === level && s.user_id === id);
      if (sub) {
        await supabase.from('kyc_submissions').update({
          status: 'Rejected',
          rejection_reason: reason || 'Documents could not be verified',
          reviewed_at: new Date().toISOString()
        }).eq('id', sub.id);
      }
    }
    const { error } = await supabase.from('profiles').update({ kyc: 'Rejected' }).eq('id', id);
    if (!error) {
       toast.error(`${level ? `Level ${level} r` : 'R'}ejected for ${name}`);
       fetchAppData();
       if (viewUser) fetchUserKyc(id);
    } else {
       toast.error(error.message);
    }
  };

  const handleDeleteUser = async (id: string | number, name: string) => {
    if (!window.confirm(`Are you sure you want to permanently delete ${name}? This action cannot be undone.`)) return;
    await supabase.from('balances').delete().eq('user_id', id);
    const { error } = await supabase.from('profiles').delete().eq('id', id);
    if (!error) {
       toast.success(`User ${name} has been deleted.`);
       fetchAppData();
    } else {
       toast.error(error.message);
    }
  };

  const handleUpdateRole = async (id: string | number, currentRole: string) => {
    const newRole = currentRole === 'admin' ? 'user' : 'admin';
    const { error } = await supabase.from('profiles').update({ role: newRole }).eq('id', id);
    if (!error) {
       toast.success(`Access level updated to ${newRole.toUpperCase()}`);
       fetchAppData();
    } else {
       toast.error(error.message);
    }
  };

  const handleUpdatePlan = async (id: string | number, newPlan: string) => {
    const { error } = await supabase.from('profiles').update({ current_plan: newPlan }).eq('id', id);
    if (!error) {
        toast.success(`Plan updated to ${newPlan}`);
        fetchAppData();
        if (viewUser) setViewUser({ ...viewUser, current_plan: newPlan });
    } else {
        toast.error(error.message);
    }
  };

   const handleBalanceUpdate = async () => {
    if (!balanceDialog || !balanceAmount) return;
    const amount = parseFloat(balanceAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error("Please enter a valid amount.");
      return;
    }
    
    const lowerCurr = selectedCurrency.toLowerCase();
    let currentVal = 0;
    if (lowerCurr === 'usd' || lowerCurr === 'fiat') {
        currentVal = balanceDialog.fiatBalanceNum || 0;
    } else if (lowerCurr === 'trading') {
        currentVal = (balanceDialog as any).tradingBalance || 0;
    } else if (lowerCurr === 'copy' || lowerCurr === 'copy_trading') {
        currentVal = (balanceDialog as any).copyTradingBalance || 0;
    } else {
        currentVal = (balanceDialog.balances as any)?.[lowerCurr] || 0;
    }

    const newBal = balanceAction === "credit" ? currentVal + amount : Math.max(0, currentVal - amount);
    
    try {
      // 1. Fetch LATEST state from DB to avoid race conditions or stale UI state
      const { data: b } = await supabase.from('balances').select('*').eq('user_id', balanceDialog.id).maybeSingle();
      
      let updateData: any = { user_id: balanceDialog.id };

      if (lowerCurr === 'usd' || lowerCurr === 'fiat') {
          const current = Number(b?.fiat_balance || 0);
          updateData.fiat_balance = balanceAction === "credit" ? current + amount : Math.max(0, current - amount);
      } else if (lowerCurr === 'trading') {
          const current = Number(b?.trading_balance || 0);
          updateData.trading_balance = balanceAction === "credit" ? current + amount : Math.max(0, current - amount);
      } else if (lowerCurr === 'copy' || lowerCurr === 'copy_trading') {
          const current = Number(b?.copy_trading_balance || 0);
          updateData.copy_trading_balance = balanceAction === "credit" ? current + amount : Math.max(0, current - amount);
      } else {
          const crypto = b?.crypto_balances || {};
          const current = Number(crypto[lowerCurr] || 0);
          const newVal = balanceAction === "credit" ? current + amount : Math.max(0, current - amount);
          updateData.crypto_balances = { ...crypto, [lowerCurr]: newVal };
      }

      const { error } = b 
        ? await supabase.from('balances').update(updateData).eq('user_id', balanceDialog.id)
        : await supabase.from('balances').insert([updateData]);

      if (error) throw error;

      toast.success(`${balanceAction === 'credit' ? 'Credited' : 'Debited'} ${amount} ${selectedCurrency} for ${balanceDialog.name}`);
      fetchAppData();
    } catch(err: any) {
      toast.error(err.message);
    }
    
    setBalanceDialog(null);
    setBalanceAmount("");
  };

  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-border">
          <div>
            <div className="flex items-center gap-2 text-primary mb-1">
               <ShieldCheck className="w-4 h-4" />
               <span className="text-[10px] font-black tracking-[0.2em] uppercase">Administration</span>
            </div>
            <h1 className="text-4xl font-black text-foreground tracking-tight">Users</h1>
            <p className="text-muted-foreground mt-1 text-[10px] font-black uppercase tracking-widest opacity-40">Manage accounts and balances</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
             <Button variant="outline" className="h-12 border-border text-[10px] font-black uppercase tracking-widest px-6 flex-1 sm:flex-none hover:bg-secondary rounded-xl" onClick={() => toast.info("Filters reset")}>
                <Filter className="w-4 h-4 mr-2" /> Filters
             </Button>
             <Button variant="hero" className="h-12 text-[10px] font-black uppercase tracking-widest px-6 shadow-gold text-white flex-1 sm:flex-none rounded-xl" onClick={() => toast.success("Creation wizard launched")}>
                <UserPlus className="w-4 h-4 mr-2" /> Add User
             </Button>
          </div>
        </div>

        {/* Search & Summary Overview */}
        <div className="flex flex-col lg:flex-row gap-8 items-start lg:items-center">
            <div className="relative w-full lg:max-w-md group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/40 group-focus-within:text-primary transition-colors" />
                <input 
                    placeholder="Search users..." 
                    className="w-full h-12 bg-card border border-border rounded-xl pl-11 pr-4 text-[13px] font-medium outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </div>
            <div className="flex flex-wrap gap-8 lg:ml-auto w-full lg:w-auto">
                <div className="text-right">
                    <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest block mb-1 opacity-60">Total Users</span>
                    <span className="text-2xl font-black font-sans text-foreground tabular-nums tracking-tight">{users?.length || 0}</span>
                </div>
                <div className="text-right border-l border-border pl-8">
                    <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest block mb-1 opacity-60">Total Portfolio</span>
                    <span className="text-2xl font-black text-foreground tabular-nums tracking-tight">{formatCurrency(users?.reduce((acc, u) => acc + (u?.cryptoBalanceNum || 0), 0) || 0)}</span>
                </div>
                <div className="text-right border-l border-border pl-8">
                    <span className="text-[10px] font-black text-primary uppercase tracking-widest block mb-1">Total Balance</span>
                    <span className="text-2xl font-black text-primary tabular-nums tracking-tight">{formatCurrency(users?.reduce((acc, u) => acc + (u?.fiatBalanceNum || 0) + (u?.tradingBalance || 0), 0) || 0)}</span>
                </div>
            </div>
        </div>

        {/* Users Control Center */}
        <div className="rounded-[2.5rem] bg-card border border-border overflow-hidden shadow-sm relative">
          <div className="overflow-x-auto relative z-10">
            <table className="w-full">
              <thead>
                <tr className="text-[10px] font-black text-muted-foreground uppercase tracking-widest border-b border-border bg-secondary/30">
                    <th className="text-left py-5 px-8">User Info</th>
                    <th className="text-left py-5 px-6 hidden md:table-cell">Total Balance</th>
                    <th className="text-left py-5 px-6">Portfolio</th>
                    <th className="text-left py-5 px-6">Cash Balance</th>
                    <th className="text-left py-5 px-6">Trading Balance</th>
                    <th className="text-left py-5 px-6">Status</th>
                    <th className="text-right py-5 px-8">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((u) => (
                  <tr key={u.id} className="group hover:bg-secondary/20 transition-colors">
                    <td className="py-5 px-8">
                      <div className="flex items-center gap-4">
                         <div className="relative w-12 h-12 rounded-2xl bg-gradient-gold flex items-center justify-center font-black text-sm text-white shadow-sm overflow-hidden border border-white/10 group-hover:scale-105 transition-transform duration-300">
                            {u?.avatar_url ? (
                               <img src={u.avatar_url} className="w-full h-full object-cover" />
                            ) : (
                               u?.name?.substring(0, 1) || "?"
                            )}
                         </div>
                         <div>
                            <div className="font-bold text-foreground text-sm flex items-center gap-2 tracking-tight">
                               {u?.name || "No User Name"}
                               <span className={`px-2 py-0.5 rounded-lg border text-[8px] font-black uppercase tracking-widest ${u.kyc === 'Verified' || u.kyc === 'Approved' ? 'bg-green-500/10 text-green-500 border-green-500/20' : u.kyc === 'Pending' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' : 'bg-red-500/10 text-red-500 border-red-500/20'}`}>
                                 {u.kyc || 'Unverified'}
                               </span>
                            </div>
                            <div className="text-[10px] text-muted-foreground font-black uppercase tracking-widest opacity-40 mt-1">{u?.email || "No email available"}</div>
                         </div>
                      </div>
                    </td>
                    <td className="py-5 px-6 hidden md:table-cell">
                       <div className="font-black text-foreground text-sm tabular-nums tracking-tight">
                          {formatCurrency(u.balanceNum)}
                       </div>
                       <div className="text-[9px] font-black text-muted-foreground mt-1 uppercase tracking-widest opacity-40">
                          Account Value
                       </div>
                    </td>
                    <td className="py-5 px-6">
                       <Tooltip>
                          <TooltipTrigger asChild>
                             <div className="cursor-help group/bal">
                                <div className="font-black text-foreground text-sm tabular-nums group-hover/bal:text-primary transition-colors tracking-tight">
                                   {formatCurrency((u as any).cryptoBalanceNum || 0)}
                                </div>
                                <div className="flex items-center gap-1.5 text-[9px] font-black text-muted-foreground mt-1 uppercase tracking-widest opacity-40">
                                   <Coins className="w-3 h-3 text-primary/60" /> Portfolio
                                </div>
                             </div>
                          </TooltipTrigger>
                          <TooltipContent className="p-5 min-w-[200px] bg-card border-border shadow-huge rounded-[2.5rem] relative overflow-hidden">
                             <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent" />
                             <div className="space-y-3 font-sans relative z-10">
                                <div className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] border-b border-border pb-3 mb-3 opacity-60">Portfolio Distribution</div>
                                {Object.entries(u.balances || {}).map(([c, a]) => (
                                  <div key={c} className="flex justify-between items-center gap-4">
                                     <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{c}</span>
                                     <span className="text-xs font-black text-foreground tabular-nums">{Number(a).toLocaleString()}</span>
                                  </div>
                                ))}
                             </div>
                          </TooltipContent>
                       </Tooltip>
                    </td>
                     <td className="py-5 px-6">
                        <div className="font-black text-primary text-sm tabular-nums tracking-tight">
                           {formatCurrency(u?.fiatBalanceNum || 0)}
                        </div>
                        <div className="text-[9px] font-black text-primary/40 mt-1 uppercase tracking-widest opacity-60">Available</div>
                     </td>
                     <td className="py-5 px-6">
                        <div className="font-black text-foreground text-sm tabular-nums tracking-tight">
                           {formatCurrency((u as any)?.tradingBalance || 0)}
                        </div>
                        <div className="text-[9px] font-bold text-muted-foreground/40 mt-1 uppercase tracking-widest">Active Funds</div>
                     </td>
                     <td className="py-5 px-6">
                        {(activeSessions || []).some(ct => ct && ct.user_id === String(u?.id) && ct.status === 'active') ? (
                          <div className="flex flex-col gap-1.5">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-primary shadow-gold text-white text-[9px] font-black uppercase tracking-widest">
                              <Target className="w-3 h-3" /> Online
                            </span>
                            <span className="text-[9px] text-muted-foreground font-black uppercase tracking-[0.1em] text-center opacity-40 text-nowrap">Session Active</span>
                          </div>
                        ) : (
                          <div className="flex flex-col gap-1">
                             <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest opacity-20">Offline</span>
                          </div>
                        )}
                     </td>
                    <td className="py-5 px-6 text-muted-foreground text-[10px] font-black uppercase tracking-widest opacity-60 hidden lg:table-cell">
                       {u.joined}
                    </td>
                    <td className="py-5 px-8 text-right">
                      <div className="flex items-center justify-end gap-2">
                         <Tooltip>
                           <TooltipTrigger asChild>
                             <Button variant="outline" size="icon" onClick={() => handleViewUser(u)} className="h-10 w-10 rounded-xl border-border hover:bg-primary/10 hover:text-primary transition-all shadow-sm">
                               <Eye className="w-4 h-4" />
                             </Button>
                           </TooltipTrigger>
                           <TooltipContent>View Profile</TooltipContent>
                         </Tooltip>
                        
                         <Tooltip>
                           <TooltipTrigger asChild>
                             <Button variant="outline" size="icon" onClick={() => setBalanceDialog(u)} className="h-10 w-10 rounded-xl border-border hover:bg-green-500/10 hover:text-green-500 transition-all shadow-sm">
                               <Wallet className="w-4 h-4" />
                             </Button>
                           </TooltipTrigger>
                           <TooltipContent>Edit Balance</TooltipContent>
                         </Tooltip>
                         
                         <DropdownMenu>
                           <DropdownMenuTrigger asChild>
                             <Button variant="outline" size="icon" className="h-10 w-10 rounded-xl border-border bg-secondary/10 hover:bg-secondary transition-all">
                               <MoreHorizontal className="w-4 h-4" />
                             </Button>
                           </DropdownMenuTrigger>
                           <DropdownMenuContent align="end" className="w-64 p-2 bg-card border-border rounded-2xl shadow-huge">
                             <DropdownMenuLabel className="text-[10px] font-black text-muted-foreground uppercase tracking-widest px-3 py-2 opacity-60">Actions</DropdownMenuLabel>
                             
                             <DropdownMenuItem className="rounded-xl px-3 py-3 cursor-pointer group" onClick={() => handleUpdateRole(u.id, u.role)}>
                               <ShieldIcon className="w-4 h-4 mr-3 text-primary transition-transform group-hover:scale-110" />
                               <div className="flex flex-col">
                                  <span className="text-xs font-black uppercase tracking-tight">{u.role === 'admin' ? "Remove Admin" : "Make Admin"}</span>
                                  <span className="text-[9px] text-muted-foreground font-bold">Manage system access</span>
                               </div>
                             </DropdownMenuItem>

                             {u.kyc === "Pending" && (
                               <DropdownMenuItem className="rounded-xl px-3 py-3 cursor-pointer text-green-500 focus:text-green-500 focus:bg-green-500/5 group" onClick={() => handleKycApprove(u.id, u.name)}>
                                 <CheckCircle className="w-4 h-4 mr-3 transition-transform group-hover:scale-110" />
                                 <div className="flex flex-col">
                                    <span className="text-xs font-black uppercase tracking-tight">Approve User</span>
                                    <span className="text-[9px] text-green-500/60 font-bold">Verify documentation</span>
                                 </div>
                               </DropdownMenuItem>
                             )}

                             <DropdownMenuItem className="rounded-xl px-3 py-3 cursor-pointer group" onClick={() => handleFreeze(u.id, u.name)}>
                               {u.frozen ? <Flame className="w-4 h-4 mr-3 text-green-500 transition-transform group-hover:scale-110" /> : <Snowflake className="w-4 h-4 mr-3 text-blue-500 transition-transform group-hover:scale-110" />}
                               <div className="flex flex-col">
                                  <span className="text-xs font-black uppercase tracking-tight">{u.frozen ? "Unfreeze Account" : "Freeze Account"}</span>
                                  <span className="text-[9px] text-muted-foreground font-bold">Change account status</span>
                               </div>
                             </DropdownMenuItem>

                             <DropdownMenuSeparator className="bg-border my-2 mx-2" />
                             <DropdownMenuItem className="rounded-xl px-3 py-3 cursor-pointer text-red-500 focus:text-red-500 focus:bg-red-500/10 group" onClick={() => handleDeleteUser(u.id, u.name)}>
                               <Trash2 className="w-4 h-4 mr-3 transition-transform group-hover:rotate-12" />
                               <div className="flex flex-col">
                                  <span className="text-xs font-black uppercase tracking-tight">Delete User</span>
                                  <span className="text-[9px] text-red-500/60 font-bold">Permanently delete this user</span>
                               </div>
                             </DropdownMenuItem>
                           </DropdownMenuContent>
                         </DropdownMenu>
                       </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <div className="p-8 border-t border-border bg-secondary/10 flex flex-col sm:flex-row items-center justify-between gap-6">
             <div className="flex items-center gap-6">
                <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest opacity-60">Status: {filtered.length} of {users.length} Users active</span>
                <div className="hidden md:flex h-1.5 w-32 bg-border rounded-full overflow-hidden">
                   <div className="h-full bg-primary animate-pulse shadow-glow" style={{ width: `${(filtered.length / users.length) * 100}%` }} />
                </div>
             </div>
             <div className="flex gap-3">
                <Button variant="outline" className="h-11 px-6 rounded-xl border-border text-[10px] font-black uppercase tracking-widest hover:bg-secondary">Previous</Button>
                <Button variant="outline" className="h-11 px-6 rounded-xl border-border text-[10px] font-black uppercase tracking-widest hover:bg-secondary">Next</Button>
             </div>
          </div>
        </div>
      </div>

      {/* Balance Edit Dialog */}
      <Dialog open={!!balanceDialog} onOpenChange={() => setBalanceDialog(null)}>
        <DialogContent className="bg-card border-border shadow-huge p-8 max-w-md rounded-2xl">
          {balanceDialog && (
            <>
              <DialogHeader className="mb-6">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-4">
                    <Target className="w-6 h-6" />
                </div>
                <DialogTitle className="text-xl font-bold text-foreground">Adjust Balance</DialogTitle>
                <div className="mt-4 p-4 rounded-2xl bg-secondary/50 border border-border space-y-3">
                    <div className="flex justify-between items-center text-xs font-bold text-muted-foreground uppercase tracking-widest">
                        <span>Current Asset</span>
                        <span className="text-primary">{selectedCurrency}</span>
                    </div>
                    <div className="flex justify-between items-baseline">
                        <span className="text-2xl font-black text-foreground tabular-nums">
                            {selectedCurrency === "USD" 
                              ? `${balanceDialog?.fiatBalanceNum?.toLocaleString() || "0.00"}` 
                              : selectedCurrency === "TRADING"
                              ? `${(balanceDialog as any)?.tradingBalance?.toLocaleString() || "0.00"}`
                              : `${(balanceDialog.balances as any)?.[selectedCurrency.toLowerCase()] || 0}`}
                        </span>
                        <span className="text-xs font-bold text-muted-foreground ml-2 uppercase">{selectedCurrency}</span>
                    </div>
                    {["USD", "TRADING"].indexOf(selectedCurrency) === -1 && (
                        <div className="pt-2 border-t border-border flex justify-between items-center">
                            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Fiat Equivalent (USD)</span>
                            <span className="text-sm font-bold text-primary tabular-nums">
                                {formatCurrency(((balanceDialog.balances as any)?.[selectedCurrency.toLowerCase()] || 0) * (
                                    { btc: 65000, eth: 3500, usdt: 1, sol: 145, usdc: 1, xrp: 0.62, bnb: 580 }[selectedCurrency.toLowerCase()] || 0
                                ))}
                            </span>
                        </div>
                    )}
                </div>
              </DialogHeader>
              
               <div className="space-y-6">
                 <div className="space-y-2">
                     <Label className="text-sm font-medium text-foreground">Select Currency</Label>
                     <div className="grid grid-cols-3 md:grid-cols-4 gap-2 p-1 bg-secondary rounded-xl border border-border">
                        {["BTC", "ETH", "USDT", "SOL", "USD", "TRADING", "COPY_TRADING"].map((coin) => (
                            <button 
                                key={coin}
                                onClick={() => setSelectedCurrency(coin)}
                                className={`flex flex-col items-center justify-center gap-1 py-3 rounded-lg text-[10px] font-bold tracking-tighter transition-all ${selectedCurrency === coin ? 'bg-gradient-gold text-white shadow-gold' : 'text-muted-foreground hover:text-foreground'}`}
                            >
                                {coin === "USD" ? <Globe className="w-3.5 h-3.5" /> : <Coins className="w-3.5 h-3.5" />}
                                {coin}
                            </button>
                        ))}
                     </div>
                 </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium text-foreground">Action</Label>
                  <div className="flex gap-3 p-1 bg-secondary rounded-xl border border-border">
                    <button
                      onClick={() => setBalanceAction("credit")}
                      className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-medium transition-all ${
                        balanceAction === "credit" ? "bg-green-600 text-white shadow-sm" : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <ArrowUpRight className="w-4 h-4" /> Credit
                    </button>
                    <button
                      onClick={() => setBalanceAction("debit")}
                      className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-medium transition-all ${
                        balanceAction === "debit" ? "bg-red-600 text-white shadow-sm" : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <X className="w-4 h-4" /> Debit
                    </button>
                  </div>
                </div>
                
                 <div className="space-y-2">
                   <Label className="text-sm font-medium text-foreground">Adjustment Amount ({selectedCurrency})</Label>
                    <div className="relative">
                      <Input
                        type="number"
                        placeholder="0.00"
                        className="h-12 bg-secondary/50 border-border rounded-xl text-lg font-bold tabular-nums pr-12 focus:border-primary/50 transition-all"
                        value={balanceAmount}
                        onChange={(e) => setBalanceAmount(e.target.value)}
                      />
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground uppercase">{selectedCurrency}</div>
                    </div>
                    {["USD", "TRADING"].indexOf(selectedCurrency) === -1 && balanceAmount && parseFloat(balanceAmount) > 0 && (
                        <div className="flex items-center gap-2 p-3 rounded-xl bg-primary/5 border border-primary/10">
                            <TrendingUp className="w-4 h-4 text-primary" />
                            <div className="flex flex-col">
                                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Adjustment Value (Estimated)</span>
                                <span className="text-sm font-black text-primary">
                                    {formatCurrency(parseFloat(balanceAmount) * (
                                        { btc: 65000, eth: 3500, usdt: 1, sol: 145, usdc: 1, xrp: 0.62, bnb: 580 }[selectedCurrency.toLowerCase()] || 0
                                    ))}
                                </span>
                            </div>
                        </div>
                    )}
                </div>
              </div>
              
              <DialogFooter className="mt-8 grid grid-cols-2 gap-3">
                <Button variant="outline" className="h-12 rounded-xl" onClick={() => setBalanceDialog(null)}>Cancel</Button>
                <Button variant="hero" className="h-12 rounded-xl shadow-gold text-white" onClick={handleBalanceUpdate}>
                  Confirm <Zap className="w-4 h-4 ml-2" />
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* View User Dialog */}
      <Dialog open={!!viewUser} onOpenChange={() => setViewUser(null)}>
        <DialogContent className="max-w-3xl h-[80vh] p-0 flex flex-col bg-card border-border shadow-huge rounded-2xl overflow-hidden animate-in zoom-in-95 duration-200">
          {viewUser && (
            <>
              {/* Sticky Header Section */}
              <div className="p-6 border-b border-border bg-secondary/10 shrink-0">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="flex items-center gap-5">
                    <div className="relative w-16 h-16 rounded-2xl bg-gradient-gold flex items-center justify-center text-2xl font-black text-white shadow-lg ring-4 ring-background overflow-hidden">
                      {viewUser?.avatar_url ? (
                         <img src={viewUser.avatar_url} className="w-full h-full object-cover" />
                      ) : (
                         viewUser.name?.substring(0, 1) || "U"
                      )}
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-foreground leading-tight">{viewUser.name}</h2>
                      <p className="text-muted-foreground font-medium flex items-center gap-2 mt-1">
                        {viewUser.email}
                        <span className="w-1 h-1 rounded-full bg-muted-foreground/30" />
                        <span className="text-xs uppercase tracking-widest font-bold">UID: {viewUser.id}</span>
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant={viewUser.role === 'admin' ? "default" : "secondary"} className="h-7 px-3 uppercase text-[10px] tracking-widest font-black">
                      {viewUser.role} Account
                    </Badge>
                    <Badge variant={viewUser.frozen ? "destructive" : "outline"} className={`h-7 px-3 uppercase text-[10px] tracking-widest font-black ${!viewUser.frozen ? 'bg-green-500/10 text-green-500 border-green-500/20 shadow-none' : ''}`}>
                      {viewUser.frozen ? "Frozen" : "Active"}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Scrollable Content Area */}
              <ScrollArea className="flex-1 w-full relative">
                <div className="p-6">
                  <Tabs defaultValue="overview" className="space-y-8">
                    <TabsList className="bg-secondary/50 p-1 h-12 rounded-xl border border-border w-full justify-start gap-1">
                      <TabsTrigger value="overview" className="rounded-lg px-6 h-10 data-[state=active]:bg-card data-[state=active]:shadow-sm">Profile Overview</TabsTrigger>
                      <TabsTrigger value="finances" className="rounded-lg px-6 h-10 data-[state=active]:bg-card data-[state=active]:shadow-sm">Wallet & Balances</TabsTrigger>
                      <TabsTrigger value="activity" className="rounded-lg px-6 h-10 data-[state=active]:bg-card data-[state=active]:shadow-sm">Activity History</TabsTrigger>
                      <TabsTrigger value="kyc" className="rounded-lg px-6 h-10 data-[state=active]:bg-card data-[state=active]:shadow-sm">Identity Verification</TabsTrigger>
                    </TabsList>

                    {/* Overview Tab */}
                    <TabsContent value="overview" className="space-y-8 mt-0 animate-in fade-in-50 duration-500">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <section className="space-y-4">
                          <h3 className="text-sm font-bold text-foreground uppercase tracking-widest flex items-center gap-2">
                            <UserCog className="w-4 h-4 text-primary" /> Personal Information
                          </h3>
                          <div className="space-y-3 p-6 rounded-2xl bg-secondary/30 border border-border">
                            <div className="flex justify-between items-center py-2 border-b border-border/50">
                              <span className="text-sm text-muted-foreground">Full Name</span>
                              <span className="text-sm font-semibold text-foreground">{viewUser.name}</span>
                            </div>
                            <div className="flex justify-between items-center py-2 border-b border-border/50">
                              <span className="text-sm text-muted-foreground">Contact Email</span>
                              <span className="text-sm font-semibold text-primary">{viewUser.email}</span>
                            </div>
                            <div className="flex justify-between items-center py-2 border-b border-border/50">
                              <span className="text-sm text-muted-foreground">Phone Number</span>
                              <span className="text-sm font-semibold text-foreground">{viewUser.phone || "Not provided"}</span>
                            </div>
                            <div className="flex justify-between items-center py-2">
                              <span className="text-sm text-muted-foreground">Account Status</span>
                              <span className={`text-xs font-bold ${viewUser.frozen ? 'text-red-500' : 'text-green-500'}`}>
                                {viewUser.frozen ? "Access Restricted" : "Active / Verified"}
                              </span>
                            </div>
                          </div>
                        </section>

                        <section className="space-y-4">
                          <h3 className="text-sm font-bold text-foreground uppercase tracking-widest flex items-center gap-2">
                            <Globe className="w-4 h-4 text-primary" /> Preferences & Referrals
                          </h3>
                          <div className="space-y-3 p-6 rounded-2xl bg-secondary/30 border border-border">
                            <div className="flex justify-between items-center py-2 border-b border-border/50">
                              <span className="text-sm text-muted-foreground">Base Currency</span>
                              <Badge variant="outline" className="font-bold">{viewUser.default_currency || "USD"}</Badge>
                            </div>
                            <div className="flex justify-between items-center py-2 border-b border-border/50">
                              <span className="text-sm text-muted-foreground">Referral Code</span>
                              <span className="text-sm font-bold text-foreground font-mono">{viewUser.referralCode || "NONE"}</span>
                            </div>
                            <div className="flex justify-between items-center py-2">
                              <span className="text-sm text-muted-foreground">Registration Date</span>
                              <span className="text-sm font-semibold text-foreground">
                                {viewUser.joined ? new Date(viewUser.joined).toLocaleDateString(undefined, { dateStyle: 'long' }) : 'N/A'}
                              </span>
                            </div>
                          </div>
                        </section>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                         <div className="p-6 rounded-2xl bg-primary/5 border border-primary/10 flex items-start gap-4">
                            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                            <Activity className="w-5 h-5" />
                            </div>
                            <div>
                            <h4 className="font-bold text-foreground">Quick Account Summary</h4>
                            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                                This user has joined {viewUser.joined ? new Date(viewUser.joined).toLocaleDateString() : 'recently'} and has 
                                completed their KYC steps. Total balance across all wallets is currently {formatCurrency(viewUser.balanceNum)}.
                            </p>
                            </div>
                        </div>

                        <div className="p-6 rounded-2xl bg-card border border-border flex flex-col gap-4">
                            <div>
                                <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
                                    <ShieldCheck className="w-4 h-4 text-primary" /> KYC Tier Level
                                </h4>
                                <p className="text-[10px] text-muted-foreground mt-1 uppercase tracking-tight">Current Tier: <span className="text-primary font-black italic">{viewUser.current_plan || 'Starter'}</span></p>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {['Starter', 'Silver', 'Gold', 'Elite'].map(plan => (
                                    <button
                                        key={plan}
                                        onClick={() => handleUpdatePlan(viewUser.id, plan)}
                                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
                                            (viewUser.current_plan || 'Starter') === plan
                                            ? "bg-gradient-gold text-white border-transparent shadow-gold"
                                            : "bg-secondary text-muted-foreground border-border hover:border-primary/50"
                                        }`}
                                    >
                                        {plan}
                                    </button>
                                ))}
                            </div>
                        </div>
                      </div>
                    </TabsContent>

                    {/* Finances Tab */}
                    <TabsContent value="finances" className="space-y-8 mt-0 animate-in fade-in-50 duration-500">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="p-6 rounded-2xl bg-secondary/30 border border-border space-y-2">
                          <span className="text-xs text-muted-foreground font-bold uppercase tracking-widest">Total Portfolio</span>
                          <div className="text-3xl font-black text-foreground tabular-nums">{formatCurrency(viewUser.balanceNum)}</div>
                          <p className="text-[10px] text-muted-foreground">Combined value of all asset types</p>
                        </div>
                        <div className="p-6 rounded-2xl bg-secondary/30 border border-border space-y-2">
                          <span className="text-xs text-muted-foreground font-bold uppercase tracking-widest">Main Balance</span>
                          <div className="text-3xl font-black text-primary tabular-nums">{formatCurrency(viewUser.fiatBalanceNum)}</div>
                          <p className="text-[10px] text-muted-foreground">Available for immediate withdrawal</p>
                        </div>
                        <div className="p-6 rounded-2xl bg-secondary/30 border border-border space-y-2">
                          <span className="text-xs text-muted-foreground font-bold uppercase tracking-widest">Trading Balance</span>
                          <div className="text-3xl font-black text-foreground tabular-nums">{formatCurrency((viewUser as any).tradingBalance)}</div>
                          <p className="text-[10px] text-muted-foreground">Actively allocated to markets</p>
                        </div>
                        <div className="p-6 rounded-2xl bg-secondary/30 border border-border space-y-2">
                          <span className="text-xs text-muted-foreground font-bold uppercase tracking-widest">Copy Trading</span>
                          <div className="text-3xl font-black text-foreground tabular-nums">{formatCurrency((viewUser as any).copyTradingBalance)}</div>
                          <p className="text-[10px] text-muted-foreground">Mirror trading allocation</p>
                        </div>
                      </div>

                      <section className="space-y-4">
                        <h3 className="text-sm font-bold text-foreground uppercase tracking-widest flex items-center gap-2">
                          <Coins className="w-4 h-4 text-primary" /> Asset Breakdown
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {[
                            { coin: 'Bitcoin', symbol: 'BTC', balance: viewUser?.balances?.btc || 0, price: 65000, color: 'text-orange-500', bg: 'bg-orange-500/10' },
                            { coin: 'Ethereum', symbol: 'ETH', balance: viewUser?.balances?.eth || 0, price: 3500, color: 'text-blue-500', bg: 'bg-blue-500/10' },
                            { coin: 'Tether', symbol: 'USDT', balance: viewUser?.balances?.usdt || 0, price: 1, color: 'text-green-500', bg: 'bg-green-500/10' },
                            { coin: 'Solana', symbol: 'SOL', balance: viewUser?.balances?.sol || 0, price: 145, color: 'text-purple-500', bg: 'bg-purple-500/10' },
                            { coin: 'Cash Balance', symbol: 'USD', balance: viewUser?.fiatBalanceNum || 0, price: 1, color: 'text-indigo-500', bg: 'bg-indigo-500/10' },
                            { coin: 'Trading Balance', symbol: 'TRD', balance: (viewUser as any)?.tradingBalance || 0, price: 1, color: 'text-cyan-500', bg: 'bg-cyan-500/10' },
                            { coin: 'Copy Trading', symbol: 'CPY', balance: (viewUser as any)?.copyTradingBalance || 0, price: 1, color: 'text-purple-500', bg: 'bg-purple-500/10' },
                          ].map((asset) => (
                            <div key={asset.symbol} className="p-5 rounded-2xl border border-border bg-card hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5 transition-all group">
                              <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-3">
                                  <div className={`w-10 h-10 rounded-xl ${asset.bg} flex items-center justify-center font-black text-xs ${asset.color}`}>
                                    {asset.symbol}
                                  </div>
                                  <div>
                                    <div className="text-sm font-bold text-foreground">{asset.coin}</div>
                                    <div className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">{asset.symbol} Asset</div>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <div className="text-lg font-black text-foreground tabular-nums">
                                    {asset.balance === 0 ? '0.00' : asset.balance.toLocaleString(undefined, { maximumFractionDigits: 8 })}
                                  </div>
                                  <div className="text-[10px] font-bold text-muted-foreground">
                                    ≈ ${(asset.balance * asset.price).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </section>
                    </TabsContent>

                    {/* Activity Tab */}
                    <TabsContent value="activity" className="space-y-8 mt-0 animate-in fade-in-50 duration-500">
                      <section className="space-y-4">
                        <h3 className="text-sm font-bold text-foreground uppercase tracking-widest flex items-center gap-2">
                          <Activity className="w-4 h-4 text-primary" /> Activity History
                        </h3>
                        <div className="space-y-3">
                          {/* Active Copy Trades */}
                          {(activeSessions || []).filter(ct => ct?.userId === String(viewUser?.id)).map((ct) => (
                            <div key={ct?.id} className="p-4 rounded-xl border border-border bg-primary/5 flex items-center justify-between group hover:bg-primary/10 transition-colors">
                              <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                                  <Target className="w-5 h-5" />
                                </div>
                                <div>
                                  <div className="text-sm font-bold text-foreground">Active Trade: {ct.traderName}</div>
                                  <div className="text-xs text-muted-foreground mt-0.5">Allocated: ${ct.allocated_amount} • Profits/Loss: <span className={ct.pnl >= 0 ? 'text-green-600' : 'text-red-500'}>${ct.pnl.toFixed(2)}</span></div>
                                </div>
                              </div>
                              <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/20 uppercase text-[9px] font-black">ACTIVE</Badge>
                            </div>
                          ))}

                          {/* Transactions */}
                          {(allTransactions || []).filter(tx => tx?.userId === String(viewUser?.id)).map((tx) => (
                            <div key={tx?.id} className="p-4 rounded-xl border border-border bg-secondary/30 flex items-center justify-between group hover:bg-secondary/50 transition-colors">
                              <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-xl bg-card border border-border flex items-center justify-center">
                                  {tx.type.includes('Deposit') ? <ArrowUpRight className="w-5 h-5 text-green-500" /> : <Eye className="w-5 h-5 text-blue-500" />}
                                </div>
                                <div>
                                  <div className="text-sm font-semibold text-foreground">{tx.type}</div>
                                  <div className="text-xs text-muted-foreground mt-0.5">{new Date(tx.created_at || tx.date).toLocaleDateString()} at {new Date(tx.created_at || tx.date).toLocaleTimeString()}</div>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="text-sm font-bold text-foreground">{tx.amount} {tx.asset || tx.crypto_type}</div>
                                <div className={`text-[10px] font-black uppercase tracking-widest ${tx.status === 'Completed' ? 'text-green-600' : 'text-amber-600'}`}>{tx.status}</div>
                              </div>
                            </div>
                          ))}

                          {(activeSessions || []).filter(ct => ct?.userId === String(viewUser?.id)).length === 0 && 
                           (allTransactions || []).filter(tx => tx?.userId === String(viewUser?.id)).length === 0 && (
                            <div className="text-center py-12 border border-dashed border-border rounded-2xl bg-secondary/10">
                              <p className="text-sm text-muted-foreground">No history found for this user.</p>
                            </div>
                          )}
                        </div>
                      </section>
                    </TabsContent>

                    {/* KYC Tab — Multi-Level */}
                    <TabsContent value="kyc" className="space-y-8 mt-0 animate-in fade-in-50 duration-500">
                      <section className="space-y-6">
                        <div className="flex items-center justify-between">
                          <h3 className="text-sm font-bold text-foreground uppercase tracking-widest flex items-center gap-2">
                            <ShieldCheck className="w-4 h-4 text-primary" /> Identity Status
                          </h3>
                          <Badge className={`uppercase text-[10px] font-black tracking-widest px-4 h-8 ${viewUser.kyc === 'Verified' ? 'bg-green-500 text-white' : viewUser.kyc === 'Pending' ? 'bg-amber-500 text-white' : 'bg-red-500 text-white'}`}>
                            {viewUser.kyc || 'Unverified'}
                          </Badge>
                        </div>

                        {allKycSubmissions.length > 0 ? (
                          <div className="space-y-6">
                            {[1, 2, 3].map(level => {
                              const sub = allKycSubmissions.find(s => s.kyc_level === level);
                              if (!sub) {
                                return (
                                  <div key={level} className="p-6 rounded-2xl bg-secondary/10 border border-dashed border-border">
                                    <div className="flex items-center gap-3">
                                      <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center text-xs font-bold text-muted-foreground">{level}</div>
                                      <div>
                                        <span className="text-xs font-bold text-muted-foreground">Level {level}: {level === 1 ? 'Basic Information' : level === 2 ? 'Identity Verification' : 'Address Verification'}</span>
                                        <p className="text-[10px] text-muted-foreground/60">Not submitted yet</p>
                                      </div>
                                    </div>
                                  </div>
                                );
                              }
                              return (
                                <div key={level} className={`p-6 rounded-2xl border ${sub.status === 'Verified' ? 'bg-green-500/5 border-green-500/20' : sub.status === 'Pending' ? 'bg-amber-500/5 border-amber-500/20' : 'bg-red-500/5 border-red-500/20'}`}>
                                  <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-white ${sub.status === 'Verified' ? 'bg-green-500' : sub.status === 'Pending' ? 'bg-amber-500' : 'bg-red-500'}`}>{level}</div>
                                      <div>
                                        <span className="text-xs font-bold text-foreground">Level {level}: {level === 1 ? 'Basic Information' : level === 2 ? 'Identity Verification' : 'Address Verification'}</span>
                                        <p className="text-[10px] text-muted-foreground">Submitted {new Date(sub.submitted_at || sub.created_at).toLocaleDateString()}</p>
                                      </div>
                                    </div>
                                    <Badge className={`text-[9px] font-black uppercase tracking-widest ${sub.status === 'Verified' ? 'bg-green-500 text-white' : sub.status === 'Pending' ? 'bg-amber-500 text-white' : 'bg-red-500 text-white'}`}>{sub.status}</Badge>
                                  </div>

                                  {/* Level 1 details */}
                                  {level === 1 && (
                                    <div className="grid grid-cols-2 gap-3 mb-4">
                                      {[{l:'Full Name', v: sub.full_name}, {l: 'Date of Birth', v: sub.date_of_birth}, {l: 'Country', v: sub.country}, {l: 'Phone', v: sub.phone}, {l: 'Address', v: sub.address}].map(({l,v}) => v ? (
                                        <div key={l} className="p-3 rounded-xl bg-card border border-border">
                                          <div className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">{l}</div>
                                          <div className="text-xs font-bold text-foreground mt-0.5">{v}</div>
                                        </div>
                                      ) : null)}
                                    </div>
                                  )}

                                  {/* Level 2 details */}
                                  {level === 2 && (
                                    <div className="space-y-4 mb-4">
                                      <div className="grid grid-cols-2 gap-3">
                                        <div className="p-3 rounded-xl bg-card border border-border">
                                          <div className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Document Type</div>
                                          <div className="text-xs font-bold text-foreground mt-0.5">{sub.id_type || 'N/A'}</div>
                                        </div>
                                        <div className="p-3 rounded-xl bg-card border border-border">
                                          <div className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Document Number</div>
                                          <div className="text-xs font-bold text-foreground mt-0.5 font-mono">{sub.id_number || 'N/A'}</div>
                                        </div>
                                      </div>
                                      <div className="grid grid-cols-2 gap-4">
                                        {sub.document_front && (
                                          <div onClick={() => setPreviewImage(sub.document_front)} className="group relative rounded-2xl border border-border bg-card overflow-hidden h-40 hover:border-primary transition-all cursor-zoom-in">
                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-10">
                                              <span className="text-white text-[10px] font-bold uppercase tracking-widest bg-black/50 px-3 py-1.5 rounded-full"><Eye className="w-3 h-3 inline mr-1" />Preview</span>
                                            </div>
                                            <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-sm px-2 py-0.5 rounded text-[8px] font-bold text-white uppercase z-10">Front</div>
                                            <img src={sub.document_front} className="w-full h-full object-cover" alt="ID Front" />
                                          </div>
                                        )}
                                        {sub.document_back && (
                                          <div onClick={() => setPreviewImage(sub.document_back)} className="group relative rounded-2xl border border-border bg-card overflow-hidden h-40 hover:border-primary transition-all cursor-zoom-in">
                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-10">
                                              <span className="text-white text-[10px] font-bold uppercase tracking-widest bg-black/50 px-3 py-1.5 rounded-full"><Eye className="w-3 h-3 inline mr-1" />Preview</span>
                                            </div>
                                            <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-sm px-2 py-0.5 rounded text-[8px] font-bold text-white uppercase z-10">Back</div>
                                            <img src={sub.document_back} className="w-full h-full object-cover" alt="ID Back" />
                                          </div>
                                        )}
                                        {sub.selfie_url && (
                                          <div onClick={() => setPreviewImage(sub.selfie_url)} className="group relative rounded-2xl border border-border bg-card overflow-hidden h-40 hover:border-primary transition-all cursor-zoom-in">
                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-10">
                                              <span className="text-white text-[10px] font-bold uppercase tracking-widest bg-black/50 px-3 py-1.5 rounded-full"><Eye className="w-3 h-3 inline mr-1" />Preview</span>
                                            </div>
                                            <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-sm px-2 py-0.5 rounded text-[8px] font-bold text-white uppercase z-10">Selfie</div>
                                            <img src={sub.selfie_url} className="w-full h-full object-cover" alt="Selfie" />
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  )}

                                  {/* Level 3 details */}
                                  {level === 3 && (
                                    <div className="space-y-3 mb-4">
                                      <div className="p-3 rounded-xl bg-card border border-border">
                                        <div className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Document Type</div>
                                        <div className="text-xs font-bold text-foreground mt-0.5">{sub.address_doc_type || 'N/A'}</div>
                                      </div>
                                      {sub.address_doc_url && (
                                        <div onClick={() => setPreviewImage(sub.address_doc_url)} className="group relative rounded-2xl border border-border bg-card overflow-hidden h-40 hover:border-primary transition-all cursor-zoom-in">
                                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-10">
                                            <span className="text-white text-[10px] font-bold uppercase tracking-widest bg-black/50 px-3 py-1.5 rounded-full"><Eye className="w-3 h-3 inline mr-1" />Preview</span>
                                          </div>
                                          <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-sm px-2 py-0.5 rounded text-[8px] font-bold text-white uppercase z-10">Address Proof</div>
                                          <img src={sub.address_doc_url} className="w-full h-full object-cover" alt="Address Proof" />
                                        </div>
                                      )}
                                    </div>
                                  )}

                                  {/* Rejection reason display */}
                                  {sub.status === 'Rejected' && sub.rejection_reason && (
                                    <div className="p-3 rounded-xl bg-red-500/5 border border-red-500/10 mb-4">
                                      <span className="text-[9px] font-bold text-red-500 uppercase tracking-widest">Rejection Reason</span>
                                      <p className="text-xs text-foreground mt-0.5">{sub.rejection_reason}</p>
                                    </div>
                                  )}

                                  {/* Action buttons per level */}
                                  {sub.status === 'Pending' && (
                                    <div className="flex gap-3 pt-2">
                                      <Button
                                        variant="outline"
                                        className="flex-1 h-10 rounded-xl text-[10px] font-bold uppercase tracking-widest border-red-500/20 text-red-600 hover:bg-red-500/10 hover:border-red-500/30"
                                        onClick={() => setRejectionDialog({ userId: String(viewUser.id), userName: viewUser.name, level })}
                                      >
                                        <X className="w-3.5 h-3.5 mr-1.5" /> Reject Level {level}
                                      </Button>
                                      <Button
                                        variant="hero"
                                        className="flex-1 h-10 rounded-xl text-[10px] font-bold uppercase tracking-widest text-white shadow-gold"
                                        onClick={() => handleKycApprove(viewUser.id, viewUser.name, level)}
                                      >
                                        Approve Level {level} <CheckCircle className="w-3.5 h-3.5 ml-1.5" />
                                      </Button>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="text-center py-20 border border-dashed border-border rounded-2xl bg-secondary/10">
                            <Shield className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
                            <p className="text-sm text-muted-foreground font-medium">No documents submitted yet.</p>
                          </div>
                        )}
                      </section>
                    </TabsContent>
                  </Tabs>
                </div>
              </ScrollArea>

              {/* Sticky Footer Area */}
              <div className="p-6 border-t border-border bg-secondary/5 shrink-0 flex justify-end">
                <Button variant="outline" className="px-10 h-11 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-secondary transition-colors" onClick={() => setViewUser(null)}>
                  Close
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
      
      {/* KYC Rejection Reason Dialog */}
      <Dialog open={!!rejectionDialog} onOpenChange={() => { setRejectionDialog(null); setRejectionReason(''); }}>
        <DialogContent className="bg-card border-border shadow-huge p-8 max-w-md rounded-2xl">
          {rejectionDialog && (
            <>
              <DialogHeader>
                <DialogTitle className="text-lg font-bold text-foreground">Reject Level {rejectionDialog.level} Verification</DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground mt-1">
                  Provide a reason for rejecting {rejectionDialog.userName}'s Level {rejectionDialog.level} submission. This will be visible to the user.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Rejection Reason</Label>
                  <textarea
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="E.g., Document is blurred, name does not match, expired document..."
                    rows={3}
                    className="w-full px-4 py-3 rounded-xl bg-secondary/50 border border-border text-sm text-foreground placeholder:text-muted-foreground/50 outline-none focus:border-primary/50 transition-colors resize-none"
                  />
                </div>
                <div className="flex gap-2 flex-wrap">
                  {['Document is blurred or unreadable', 'Name does not match records', 'Document has expired', 'Incomplete information provided', 'Suspected fraudulent document'].map(r => (
                    <button key={r} onClick={() => setRejectionReason(r)} className="text-[9px] font-bold text-muted-foreground px-2.5 py-1.5 rounded-lg bg-secondary border border-border hover:bg-primary/5 hover:text-primary hover:border-primary/20 transition-all">{r}</button>
                  ))}
                </div>
              </div>
              <DialogFooter className="mt-6 grid grid-cols-2 gap-3">
                <Button variant="outline" className="h-11 rounded-xl" onClick={() => { setRejectionDialog(null); setRejectionReason(''); }}>Cancel</Button>
                <Button
                  variant="destructive"
                  className="h-11 rounded-xl font-bold"
                  disabled={!rejectionReason.trim()}
                  onClick={() => {
                    handleKycReject(rejectionDialog.userId, rejectionDialog.userName, rejectionDialog.level, rejectionReason);
                    setRejectionDialog(null);
                    setRejectionReason('');
                  }}
                >
                  Confirm Rejection
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* KYC Image Preview Lightbox */}
      <Dialog open={!!previewImage} onOpenChange={() => setPreviewImage(null)}>
        <DialogContent className="max-w-[95vw] lg:max-w-[80vw] p-0 bg-transparent border-none shadow-none flex items-center justify-center">
          {previewImage && (
             <div className="relative group w-full flex flex-col items-center">
                <div className="absolute -top-12 left-1/2 -translate-x-1/2 flex items-center gap-4 bg-black/80 backdrop-blur-xl px-6 py-2 rounded-full border border-white/10 z-50">
                   <div className="text-[10px] font-black text-white uppercase tracking-widest">Document Preview</div>
                   <div className="w-px h-3 bg-white/20" />
                   <button onClick={() => setPreviewImage(null)} className="text-white/60 hover:text-white transition-colors">
                      <X className="w-4 h-4" />
                   </button>
                </div>
                <img 
                   src={previewImage} 
                   className="max-h-[85vh] w-auto rounded-3xl border border-white/10 shadow-huge" 
                   alt="KYC Preview" 
                />
             </div>
          )}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default UserManagement;
