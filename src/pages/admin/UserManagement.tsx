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
        {/* Institutional Header */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-border">
          <div className="space-y-1">
            <h1 className="text-3xl font-black text-foreground tracking-tight uppercase">User Directory</h1>
            <p className="text-muted-foreground text-sm font-medium">Central repository for member accounts, verification status, and portfolio oversight.</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
             <Button variant="outline" className="h-11 border-border text-[10px] font-black uppercase tracking-[0.2em] px-6 hover:bg-secondary rounded-xl transition-all group">
                <Filter className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform" /> Set Filters
             </Button>
             <Button variant="hero" className="h-11 shadow-gold text-white text-[10px] font-black uppercase tracking-[0.2em] px-8 rounded-xl transition-all">
                Create Account
             </Button>
          </div>
        </header>



        {/* Search & Statistics Overview */}
        <div className="flex flex-col xl:flex-row gap-10 items-start xl:items-center">
            <div className="relative w-full xl:w-[500px] group/search">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/40 group-focus-within/search:text-primary transition-all" />
                <input 
                    placeholder="Search by name or email address..." 
                    className="w-full h-12 bg-secondary/20 border border-border rounded-xl pl-12 pr-6 text-[11px] font-black uppercase tracking-[0.1em] outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/5 transition-all"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-10 xl:ml-auto w-full xl:w-auto">
                <div className="space-y-1 text-center sm:text-left">
                    <span className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.2em] block opacity-40">Registered Members</span>
                    <span className="text-2xl font-black text-foreground tabular-nums">{users?.length || 0}</span>
                </div>
                <div className="space-y-1 text-center sm:text-left">
                    <span className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.2em] block opacity-40">Aggregate AUM</span>
                    <span className="text-2xl font-black text-foreground tabular-nums tracking-tighter">{formatCurrency(users?.reduce((acc, u) => acc + (u?.cryptoBalanceNum || 0), 0) || 0)}</span>
                </div>
                <div className="space-y-1 text-center sm:text-left col-span-2 sm:col-span-1">
                    <span className="text-[9px] font-black text-primary uppercase tracking-[0.2em] block">Available Liquidity</span>
                    <span className="text-2xl font-black text-primary tabular-nums tracking-tighter">{formatCurrency(users?.reduce((acc, u) => acc + (u?.fiatBalanceNum || 0) + (u?.tradingBalance || 0), 0) || 0)}</span>
                </div>
            </div>
        </div>



        {/* User Management View */}
        <div className="rounded-[2.5rem] bg-card border border-border overflow-hidden shadow-sm relative">
          <div className="overflow-x-auto relative z-10 hidden lg:block">
            <table className="w-full">
              <thead>
                <tr className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] border-b border-border bg-secondary/10">
                    <th className="text-left py-6 px-8">Member Identity</th>
                    <th className="text-left py-6 px-6">Total AUM</th>
                    <th className="text-left py-6 px-6">Crypto Portfolio</th>
                    <th className="text-left py-6 px-6">Available</th>
                    <th className="text-left py-6 px-6">Trading Capital</th>
                    <th className="text-center py-6 px-6">Status</th>
                    <th className="text-left py-6 px-6 hidden xl:table-cell">Reg. Date</th>
                    <th className="text-right py-6 px-8">Actions</th>
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
                    <td className="py-5 px-6">
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
                          <div className="flex flex-col items-center gap-1.5">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-primary shadow-gold text-white text-[9px] font-black uppercase tracking-widest">
                              <Target className="w-3 h-3" /> Online
                            </span>
                          </div>
                        ) : (
                           <div className="text-center">
                              <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest opacity-20">Offline</span>
                           </div>
                        )}
                     </td>
                    <td className="py-5 px-6 text-muted-foreground text-[10px] font-black uppercase tracking-widest opacity-60 hidden xl:table-cell">
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

          {/* Mobile Card View */}
          <div className="lg:hidden divide-y divide-border/50">
              {filtered.map((u) => (
                  <div key={u.id} className="p-8 space-y-8 group/card hover:bg-secondary/10 transition-all">
                      <div className="flex justify-between items-center">
                          <div className="flex items-center gap-5">
                              <div className="relative w-14 h-14 rounded-2xl bg-gradient-gold flex items-center justify-center font-black text-base text-white shadow-huge overflow-hidden border border-white/20 group-hover/card:scale-110 transition-transform duration-500">
                                  {u?.avatar_url ? (
                                      <img src={u.avatar_url} className="w-full h-full object-cover" />
                                  ) : (
                                      u?.name?.substring(0, 1) || "?"
                                  )}
                              </div>
                              <div className="space-y-1">
                                  <div className="font-black text-foreground text-sm flex items-center gap-2 uppercase tracking-tight">
                                      {u?.name || "Unknown Identity"}
                                      {(activeSessions || []).some(ct => ct && ct.user_id === String(u?.id) && ct.status === 'active') && (
                                         <div className="w-2 h-2 rounded-full bg-green-500 shadow-glow animate-pulse" />
                                      )}
                                  </div>
                                  <div className="text-[10px] text-muted-foreground/40 font-black uppercase truncate max-w-[180px] tracking-widest">{u?.email}</div>
                              </div>
                          </div>
                          
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="outline" size="icon" className="h-12 w-12 rounded-2xl border-border bg-card shadow-sm hover:border-primary/20">
                                <MoreHorizontal className="w-5 h-5" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-[85vw] max-w-sm p-3 bg-card border-border rounded-[2rem] shadow-huge relative overflow-hidden">
                                <div className="absolute inset-0 bg-primary/[0.02] pointer-events-none" />
                                <DropdownMenuItem className="rounded-xl px-5 py-4 font-black uppercase text-[10px] tracking-widest relative z-10" onClick={() => handleViewUser(u)}><Eye className="w-4 h-4 mr-4 text-primary" /> View Details</DropdownMenuItem>
                                <DropdownMenuItem className="rounded-xl px-5 py-4 font-black uppercase text-[10px] tracking-widest relative z-10" onClick={() => setBalanceDialog(u)}><Wallet className="w-4 h-4 mr-4 text-green-500" /> Adjust Balance</DropdownMenuItem>
                                <DropdownMenuSeparator className="bg-border/50 my-2 mx-2" />
                                <DropdownMenuItem className="rounded-xl px-5 py-4 font-black uppercase text-[10px] tracking-widest text-red-500 focus:text-red-600 focus:bg-red-500/5 relative z-10" onClick={() => handleDeleteUser(u.id, u.name)}><Trash2 className="w-4 h-4 mr-4" /> Delete User</DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                          <div className="p-5 rounded-[1.5rem] bg-secondary/50 border border-border/80 group-hover/card:border-primary/20 transition-colors">
                              <div className="text-[8px] font-black text-muted-foreground uppercase mb-2 tracking-[0.2em] opacity-40">Total Value</div>
                              <div className="text-sm font-black text-foreground tabular-nums tracking-tighter">{formatCurrency(u.balanceNum)}</div>
                          </div>
                          <div className="p-5 rounded-[1.5rem] bg-secondary/50 border border-border/80 group-hover/card:border-primary/20 transition-colors">
                              <div className="text-[8px] font-black text-muted-foreground uppercase mb-2 tracking-[0.2em] opacity-40">Available Funds</div>
                              <div className="text-sm font-black text-primary tabular-nums tracking-tighter">{formatCurrency(u?.fiatBalanceNum || 0)}</div>
                          </div>
                      </div>

                      <div className="flex items-center justify-between pb-2">
                          <div className={`px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-[0.1em] border ${u.kyc === 'Verified' || u.kyc === 'Approved' ? 'bg-green-500/10 text-green-600 border-green-500/20' : 'bg-amber-500/10 text-amber-600 border-amber-500/20'}`}>
                              Verification: {u.kyc || 'UNVERIFIED'}
                          </div>
                          <span className="text-[10px] font-black uppercase text-muted-foreground/30 tabular-nums tracking-widest">Joined: {u.joined?.split('T')[0]}</span>
                      </div>

                  </div>
              ))}
          </div>
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

      {/* Balance Edit Dialog */}
      <Dialog open={!!balanceDialog} onOpenChange={() => setBalanceDialog(null)}>
        <DialogContent className="bg-card border-border shadow-huge p-0 max-w-lg rounded-[2rem] overflow-hidden">
          {balanceDialog && (
            <div className="flex flex-col max-h-[90vh]">
              <DialogHeader className="p-8 pb-0 shrink-0">
                <div className="flex items-center gap-4 mb-6">
                     <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
                        <Wallet className="w-6 h-6" />
                    </div>
                    <div>
                        <DialogTitle className="text-xl font-black text-foreground uppercase tracking-tight">Manual Balance Update</DialogTitle>
                        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest opacity-40">Direct administrative balance modification</p>
                    </div>
                </div>
                
                <div className="p-6 rounded-[1.5rem] bg-secondary/40 border border-border/80 space-y-4">
                    <div className="flex justify-between items-center">
                        <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest opacity-60">Asset Class</span>
                        <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 font-black h-6">{selectedCurrency}</Badge>
                    </div>

                    <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-black text-foreground tabular-nums tracking-tighter">
                            {selectedCurrency === "USD" 
                              ? `${balanceDialog?.fiatBalanceNum?.toLocaleString() || "0.00"}` 
                              : selectedCurrency === "TRADING"
                              ? `${(balanceDialog as any)?.tradingBalance?.toLocaleString() || "0.00"}`
                              : `${(balanceDialog.balances as any)?.[selectedCurrency.toLowerCase()] || 0}`}
                        </span>
                        <span className="text-xs font-black text-muted-foreground uppercase tracking-widest">{selectedCurrency}</span>
                    </div>
                </div>
              </DialogHeader>
              
               <ScrollArea className="flex-1 p-8 space-y-8">
                 <div className="space-y-4">
                     <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest opacity-60">Select Currency Token</Label>
                     <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                        {["BTC", "ETH", "USDT", "SOL", "USD", "TRADING", "COPY_TRADING"].map((coin) => (
                            <button 
                                key={coin}
                                onClick={() => setSelectedCurrency(coin)}
                                className={`flex flex-col items-center justify-center gap-2 p-4 rounded-2xl text-[10px] font-black tracking-widest transition-all border ${selectedCurrency === coin ? 'bg-primary border-primary text-white shadow-gold' : 'bg-secondary/50 text-muted-foreground border-border hover:border-primary/30'}`}
                            >
                                {coin === "USD" ? <Globe className="w-4 h-4" /> : <Coins className="w-4 h-4" />}
                                <span className="truncate w-full text-center">{coin}</span>
                            </button>
                        ))}
                     </div>
                 </div>

                <div className="space-y-4 pt-4">
                  <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest opacity-60">Action Type</Label>
                  <div className="grid grid-cols-2 gap-4 p-1.5 bg-secondary rounded-2xl border border-border">
                    <button
                      onClick={() => setBalanceAction("credit")}
                      className={`flex items-center justify-center gap-2 py-4 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                        balanceAction === "credit" ? "bg-card text-green-600 shadow-sm border border-border" : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <ArrowUpRight className="w-4 h-4" /> Credit
                    </button>
                    <button
                      onClick={() => setBalanceAction("debit")}
                      className={`flex items-center justify-center gap-2 py-4 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                        balanceAction === "debit" ? "bg-card text-red-600 shadow-sm border border-border" : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <X className="w-4 h-4" /> Debit
                    </button>
                  </div>
                </div>

                
                 <div className="space-y-4 pt-4">
                   <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest opacity-60">Update Amount</Label>

                    <div className="relative group">
                      <Input
                        type="number"
                        placeholder="0.00"
                        className="h-16 bg-secondary/30 border-border rounded-2xl text-2xl font-black tabular-nums pr-20 focus:border-primary/50 focus:ring-4 focus:ring-primary/5 transition-all text-center"
                        value={balanceAmount}
                        onChange={(e) => setBalanceAmount(e.target.value)}
                      />
                      <div className="absolute right-6 top-1/2 -translate-y-1/2 text-[10px] font-black text-muted-foreground/40 uppercase tracking-widest">{selectedCurrency}</div>
                    </div>
                    {["USD", "TRADING"].indexOf(selectedCurrency) === -1 && balanceAmount && parseFloat(balanceAmount) > 0 && (
                        <div className="flex items-center gap-4 p-5 rounded-2xl bg-primary/5 border border-primary/10 animate-in slide-in-from-top-2 duration-300">
                            <Activity className="w-4 h-4 text-primary" />
                            <div className="flex flex-col">
                                <span className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] opacity-40">Valuation Approximation</span>
                                <span className="text-sm font-black text-primary tabular-nums">
                                    {formatCurrency(parseFloat(balanceAmount) * (
                                        { btc: 65000, eth: 3500, usdt: 1, sol: 145, usdc: 1, xrp: 0.62, bnb: 580 }[selectedCurrency.toLowerCase()] || 0
                                    ))}
                                </span>
                            </div>
                        </div>
                    )}
                </div>
              </ScrollArea>
              
              <DialogFooter className="p-8 border-t border-border bg-secondary/10 grid grid-cols-2 gap-4">
                <Button variant="outline" className="h-14 rounded-2xl text-[10px] font-black uppercase tracking-widest" onClick={() => setBalanceDialog(null)}>Cancel</Button>
                <Button variant="hero" className="h-14 rounded-2xl bg-primary shadow-gold text-white text-[10px] font-black uppercase tracking-widest" onClick={handleBalanceUpdate}>
                  Update Balance <Zap className="w-4 h-4 ml-2" />
                </Button>
              </DialogFooter>

            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* View User Dialog (Dossier) */}
      <Dialog open={!!viewUser} onOpenChange={() => setViewUser(null)}>
        <DialogContent className="max-w-[100vw] sm:max-w-4xl h-[100dvh] sm:h-[85vh] p-0 flex flex-col bg-card border-border shadow-huge sm:rounded-[2.5rem] overflow-hidden animate-in zoom-in-95 duration-300">
          {viewUser && (
            <>
              {/* Institutional Header */}
              <div className="p-8 pb-6 border-b border-border bg-secondary/10 shrink-0 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/[0.03] rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl pointer-events-none" />
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 relative z-10">
                  <div className="flex items-center gap-6">
                    <div className="relative w-20 h-20 rounded-3xl bg-gradient-gold flex items-center justify-center text-3xl font-black text-white shadow-huge ring-4 ring-background overflow-hidden border border-white/20">
                      {viewUser?.avatar_url ? (
                         <img src={viewUser.avatar_url} className="w-full h-full object-cover" />
                      ) : (
                         viewUser.name?.substring(0, 1) || "U"
                      )}
                    </div>
                    <div>
                      <h2 className="text-3xl font-black text-foreground tracking-tight leading-none uppercase">{viewUser.name}</h2>
                      <div className="flex flex-wrap items-center gap-3 mt-3">
                        <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest opacity-40">{viewUser.email}</span>
                        <div className="w-1.5 h-1.5 rounded-full bg-border" />
                        <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">ID: {viewUser.id?.toString().slice(0, 12)}...</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <Badge variant="outline" className="h-9 px-5 uppercase text-[9px] tracking-[0.2em] font-black border-border bg-card text-muted-foreground">
                      {viewUser.role} ACCESS
                    </Badge>
                    <Badge variant={viewUser.frozen ? "destructive" : "outline"} className={`h-9 px-5 uppercase text-[9px] tracking-[0.2em] font-black ${!viewUser.frozen ? 'bg-green-500/10 text-green-600 border-green-500/20 shadow-none' : 'shadow-none'}`}>
                      {viewUser.frozen ? "ACCOUNT FROZEN" : "ACCOUNT ACTIVE"}
                    </Badge>
                  </div>
                </div>
              </div>


              {/* Navigation Interface */}
              <div className="bg-secondary/5 px-8 pt-4 border-b border-border shrink-0">
                <Tabs defaultValue="overview" className="w-full">
                  <TabsList className="bg-transparent p-0 h-14 w-full justify-start gap-10 overflow-x-auto scrollbar-hide no-scrollbar">
                    {['overview', 'finances', 'activity', 'kyc'].map((tab) => (
                      <TabsTrigger 
                        key={tab} 
                        value={tab} 
                        className="rounded-none px-0 h-14 border-b-2 border-transparent data-[state=active]:border-primary bg-transparent text-[10px] font-black uppercase tracking-[0.25em] data-[state=active]:text-primary transition-all whitespace-nowrap"
                      >
                        {tab === 'kyc' ? 'Verification' : tab}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                </Tabs>
              </div>

              {/* Data Grid Body */}
              <ScrollArea className="flex-1 w-full bg-secondary/[0.02]">
                <Tabs defaultValue="overview" className="w-full contents">
                  <div className="p-8">
                    {/* Overview Tab */}
                    <TabsContent value="overview" className="space-y-10 mt-0 animate-in fade-in-50 duration-500">
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                        <div className="space-y-6">
                          <h3 className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em] flex items-center gap-3 opacity-40">
                             PROFILE INFORMATION <div className="h-px flex-1 bg-border/50" />
                          </h3>

                          <div className="grid grid-cols-1 gap-4">
                             {[
                               { label: 'Primary Alias', value: viewUser.name },
                               { label: 'Network Address', value: viewUser.email, isPrimary: true },
                               { label: 'Terminal Uplink', value: viewUser.phone || "UNLINKED" },
                               { label: 'Clearance Status', value: viewUser.frozen ? "RESTRICTED" : "VERIFIED", isStatus: true }
                             ].map((item, idx) => (
                                <div key={idx} className="flex justify-between items-center p-5 rounded-2xl bg-card border border-border shadow-sm group hover:border-primary/20 transition-all">
                                   <span className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-widest">{item.label}</span>
                                   <span className={`text-xs font-black uppercase tracking-tight ${item.isPrimary ? 'text-primary' : item.isStatus ? (viewUser.frozen ? 'text-red-500' : 'text-green-500') : 'text-foreground'}`}>{item.value}</span>
                                </div>
                             ))}
                          </div>
                        </div>

                        <div className="space-y-6">
                           <h3 className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em] flex items-center gap-3 opacity-40">
                              OPERATIONAL PREFERENCE <div className="h-px flex-1 bg-border/50" />
                           </h3>
                           <div className="grid grid-cols-1 gap-4">
                              {[
                                { label: 'Base Numéraire', value: viewUser.default_currency || "USD" },
                                { label: 'Affiliation Hash', value: viewUser.referralCode || "NONE" },
                                { label: 'Commission Tier', value: viewUser.current_plan || "STARTER" },
                                { label: 'Temporal Entry', value: viewUser.joined ? new Date(viewUser.joined).toLocaleDateString() : 'N/A' }
                              ].map((item, idx) => (
                                 <div key={idx} className="flex justify-between items-center p-5 rounded-2xl bg-card border border-border shadow-sm group hover:border-primary/20 transition-all">
                                    <span className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-widest">{item.label}</span>
                                    <span className="text-xs font-black uppercase tracking-tight text-foreground">{item.value}</span>
                                 </div>
                              ))}
                           </div>
                        </div>
                      </div>

                      <div className="p-8 rounded-[2rem] bg-card border border-border relative overflow-hidden group">
                        <div className="absolute inset-0 bg-primary/[0.01] pointer-events-none" />
                        <div className="flex flex-col md:flex-row items-center justify-between gap-8 relative z-10">
                           <div className="space-y-2 text-center md:text-left">
                              <h4 className="text-sm font-black uppercase tracking-tight text-foreground">Authorization Tier Scaling</h4>
                              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest opacity-40">Modify personnel clearance and transaction limits</p>
                           </div>
                           <div className="flex flex-wrap justify-center gap-3">
                              {['Starter', 'Silver', 'Gold', 'Elite'].map(plan => (
                                 <button
                                    key={plan}
                                    onClick={() => handleUpdatePlan(viewUser.id, plan)}
                                    className={`px-8 py-3 rounded-2xl text-[9px] font-black uppercase tracking-[0.2em] transition-all border ${
                                       (viewUser.current_plan || 'Starter') === plan
                                       ? "bg-primary border-primary text-white shadow-gold scale-105"
                                       : "bg-secondary/50 text-muted-foreground border-border hover:border-primary/30"
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
                    <TabsContent value="finances" className="space-y-10 mt-0 animate-in fade-in-50 duration-500">
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {[
                          { label: 'Cross-Asset Portfolio', value: viewUser.balanceNum, color: 'text-foreground' },
                          { label: 'Operational Liquidity', value: viewUser.fiatBalanceNum, color: 'text-primary' },
                          { label: 'Active Trade Exposure', value: (viewUser as any).tradingBalance, color: 'text-foreground' },
                          { label: 'Copy-Network Allocation', value: (viewUser as any).copyTradingBalance, color: 'text-foreground' }
                        ].map((stat, idx) => (
                          <div key={idx} className="p-8 rounded-[2rem] bg-card border border-border shadow-sm space-y-4 group hover:border-primary/20 transition-all">
                            <span className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.25em] opacity-40 block">{stat.label}</span>
                            <div className={`text-2xl font-black tabular-nums tracking-tighter ${stat.color}`}>{formatCurrency(stat.value)}</div>
                          </div>
                        ))}
                      </div>

                      <section className="space-y-8">
                        <h3 className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em] flex items-center gap-3 opacity-40">
                           ASSET DISTRIBUTION LEDGER <div className="h-px flex-1 bg-border/50" />
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                          {[
                            { coin: 'Bitcoin', symbol: 'BTC', balance: viewUser?.balances?.btc || 0, price: 65000, color: 'text-orange-500', bg: 'bg-orange-500/10' },
                            { coin: 'Ethereum', symbol: 'ETH', balance: viewUser?.balances?.eth || 0, price: 3500, color: 'text-blue-500', bg: 'bg-blue-500/10' },
                            { coin: 'Tether', symbol: 'USDT', balance: viewUser?.balances?.usdt || 0, price: 1, color: 'text-green-500', bg: 'bg-green-500/10' },
                            { coin: 'Solana', symbol: 'SOL', balance: viewUser?.balances?.sol || 0, price: 145, color: 'text-purple-500', bg: 'bg-purple-500/10' },
                            { coin: 'Cash Reserves', symbol: 'USD', balance: viewUser?.fiatBalanceNum || 0, price: 1, color: 'text-indigo-500', bg: 'bg-indigo-500/10' },
                            { coin: 'Market Liquidity', symbol: 'TRD', balance: (viewUser as any)?.tradingBalance || 0, price: 1, color: 'text-cyan-500', bg: 'bg-cyan-500/10' },
                          ].map((asset) => (
                            <div key={asset.symbol} className="p-6 rounded-[2rem] border border-border bg-card hover:border-primary/40 hover:shadow-huge transition-all group overflow-hidden relative">
                              <div className="absolute top-0 right-0 w-24 h-24 bg-primary/[0.02] rounded-full translate-x-1/2 -translate-y-1/2" />
                              <div className="flex items-center justify-between relative z-10">
                                <div className="flex items-center gap-4">
                                  <div className={`w-12 h-12 rounded-2xl ${asset.bg} flex items-center justify-center font-black text-xs ${asset.color} border border-border/50`}>
                                    {asset.symbol}
                                  </div>
                                  <div>
                                    <div className="text-sm font-black uppercase tracking-tight text-foreground">{asset.coin}</div>
                                    <div className="text-[10px] text-muted-foreground/40 font-black uppercase tracking-widest mt-1">{asset.symbol} SUB-LEDGER</div>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <div className="text-lg font-black text-foreground tabular-nums tracking-tighter">
                                    {asset.balance === 0 ? '0.00' : asset.balance.toLocaleString(undefined, { maximumFractionDigits: 4 })}
                                  </div>
                                  <div className="text-[10px] font-black text-primary/60 mt-1 tabular-nums">
                                    ≈ {formatCurrency(asset.balance * asset.price)}
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </section>
                    </TabsContent>

                    {/* Activity Tab */}
                    <TabsContent value="activity" className="space-y-10 mt-0 animate-in fade-in-50 duration-500">
                      <section className="space-y-8">
                        <h3 className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em] flex items-center gap-3 opacity-40">
                           REAL-TIME TRANSACTION LOG <div className="h-px flex-1 bg-border/50" />
                        </h3>
                        <div className="space-y-4">
                          {/* Active Trades */}
                          {(activeSessions || []).filter(ct => ct?.userId === String(viewUser?.id)).map((ct) => (
                            <div key={ct?.id} className="p-6 rounded-[2rem] border border-primary/20 bg-primary/[0.03] flex flex-col sm:flex-row sm:items-center justify-between gap-6 group hover:bg-primary/[0.05] transition-all">
                              <div className="flex items-center gap-6">
                                <div className="w-14 h-14 rounded-[1.5rem] bg-primary/10 flex items-center justify-center text-primary border border-primary/20 group-hover:scale-110 transition-transform duration-500">
                                  <Target className="w-6 h-6" />
                                </div>
                                <div className="space-y-1">
                                  <div className="text-sm font-black uppercase tracking-tight text-foreground">Market Position: {ct.traderName}</div>
                                  <div className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-widest flex items-center gap-3">
                                     Allocated: {formatCurrency(ct.allocated_amount)}
                                     <div className="w-1 h-1 rounded-full bg-border" />
                                     PnL: <span className={ct.pnl >= 0 ? 'text-green-500' : 'text-red-500'}>{formatCurrency(ct.pnl)}</span>
                                  </div>
                                </div>
                              </div>
                              <Badge className="bg-primary shadow-gold text-white uppercase text-[8px] font-black tracking-[0.2em] px-4 py-1.5 h-auto rounded-full w-fit">ACTIVE EXPOSURE</Badge>
                            </div>
                          ))}

                          {/* Regular Transactions */}
                          {(allTransactions || []).filter(tx => tx?.userId === String(viewUser?.id)).map((tx) => (
                            <div key={tx?.id} className="p-6 rounded-[1.5rem] border border-border bg-card flex flex-col sm:flex-row sm:items-center justify-between gap-6 group hover:border-primary/20 transition-all">
                              <div className="flex items-center gap-6">
                                <div className="w-12 h-12 rounded-2xl bg-secondary/50 border border-border flex items-center justify-center text-muted-foreground group-hover:text-primary transition-colors">
                                  {tx.type.includes('Deposit') ? <ArrowUpRight className="w-5 h-5 text-green-500" /> : <TrendingUp className="w-5 h-5 text-blue-500" />}
                                </div>
                                <div className="space-y-1">
                                  <div className="text-sm font-black uppercase tracking-tight text-foreground">{tx.type}</div>
                                  <div className="text-[10px] font-black text-muted-foreground/40 uppercase tracking-widest tabular-nums">{new Date(tx.created_at || tx.date).toISOString().replace('T', ' ').slice(0, 16)}</div>
                                </div>
                              </div>
                              <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-4 border-t sm:border-t-0 border-border/30 pt-4 sm:pt-0">
                                <div className="text-lg font-black text-foreground tabular-nums tracking-tighter">{tx.amount} {tx.asset || tx.crypto_type}</div>
                                <div className={`text-[9px] font-black uppercase tracking-[0.2em] ${tx.status === 'Completed' || tx.status === 'Verified' ? 'text-green-500' : 'text-amber-500'}`}>{tx.status}</div>
                              </div>
                            </div>
                          ))}

                          {/* Empty State */}
                          {(activeSessions || []).filter(ct => ct?.userId === String(viewUser?.id)).length === 0 && 
                           (allTransactions || []).filter(tx => tx?.userId === String(viewUser?.id)).length === 0 && (
                            <div className="text-center py-24 border border-dashed border-border rounded-[2.5rem] bg-secondary/10">
                              <p className="text-[10px] font-black text-muted-foreground/40 uppercase tracking-[0.3em]">No Temporal Artifacts Located</p>
                            </div>
                          )}
                        </div>
                      </section>
                    </TabsContent>

                    {/* Verification Tab */}
                    <TabsContent value="kyc" className="space-y-10 mt-0 animate-in fade-in-50 duration-500">
                      <section className="space-y-8">
                        <div className="flex items-center justify-between">
                          <h3 className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em] flex items-center gap-3 opacity-40">
                             IDENTITY AUTHENTICATION STATUS <div className="h-px flex-1 bg-border/50" />
                          </h3>
                          <Badge className={`uppercase text-[9px] font-black tracking-[0.2em] px-6 h-9 rounded-full ${viewUser.kyc === 'Verified' ? 'bg-green-500 text-white shadow-glow' : viewUser.kyc === 'Pending' ? 'bg-amber-500 text-white' : 'bg-red-500 text-white'}`}>
                            {viewUser.kyc || 'UNVERIFIED'}
                          </Badge>
                        </div>

                        {allKycSubmissions.length > 0 ? (
                          <div className="space-y-8">
                            {[1, 2, 3].map(level => {
                              const sub = allKycSubmissions.find(s => s.kyc_level === level);
                              if (!sub) {
                                return (
                                  <div key={level} className="p-8 rounded-[2rem] bg-secondary/10 border border-dashed border-border opacity-50 grayscale">
                                    <div className="flex items-center gap-5">
                                      <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center text-[10px] font-black text-muted-foreground">0{level}</div>
                                      <div>
                                        <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">PHASE {level}: {level === 1 ? 'Core Identification' : level === 2 ? 'Biometric & Document' : 'Residency Verification'}</span>
                                        <p className="text-[9px] text-muted-foreground/40 font-black uppercase mt-1 tracking-widest">AWAITING SUBMISSION</p>
                                      </div>
                                    </div>
                                  </div>
                                );
                              }
                              return (
                                <div key={level} className={`p-8 rounded-[2rem] border transition-all ${sub.status === 'Verified' ? 'bg-green-500/[0.02] border-green-500/20' : sub.status === 'Pending' ? 'bg-amber-500/[0.02] border-amber-500/20' : 'bg-red-500/[0.02] border-red-500/20'}`}>
                                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-8 pb-6 border-b border-border/50">
                                    <div className="flex items-center gap-5">
                                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xs font-black text-white shadow-sm ${sub.status === 'Verified' ? 'bg-green-500' : sub.status === 'Pending' ? 'bg-amber-500' : 'bg-red-500'}`}>0{level}</div>
                                      <div>
                                        <span className="text-sm font-black text-foreground uppercase tracking-tight">Phase {level}: {level === 1 ? 'Core Identification' : level === 2 ? 'Biometric & Document' : 'Residency Verification'}</span>
                                        <p className="text-[10px] text-muted-foreground/60 font-black uppercase tracking-widest mt-1">Ingested {new Date(sub.submitted_at || sub.created_at).toLocaleDateString()}</p>
                                      </div>
                                    </div>
                                    <Badge className={`text-[8px] font-black uppercase tracking-[0.2em] px-4 py-1.5 h-auto rounded-full ${sub.status === 'Verified' ? 'bg-green-500 text-white' : sub.status === 'Pending' ? 'bg-amber-500 text-white' : 'bg-red-500 text-white'}`}>{sub.status}</Badge>
                                  </div>

                                  {/* Data details per level */}
                                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                                     {level === 1 && (
                                       <>
                                         {[{l:'Full Identity', v: sub.full_name}, {l: 'Birth Sequence', v: sub.date_of_birth}, {l: 'Jurisdiction', v: sub.country}, {l: 'Comms Uplink', v: sub.phone}, {l: 'Registered Domicile', v: sub.address}].map(({l,v}) => v ? (
                                           <div key={l} className="p-5 rounded-2xl bg-card border border-border group hover:border-primary/20 transition-all">
                                             <div className="text-[8px] font-black text-muted-foreground uppercase tracking-[0.2em] opacity-40 mb-2">{l}</div>
                                             <div className="text-xs font-black text-foreground uppercase tracking-tight mt-0.5">{v}</div>
                                           </div>
                                         ) : null)}
                                       </>
                                     )}
                                     
                                     {level === 2 && (
                                       <>
                                          <div className="p-5 rounded-2xl bg-card border border-border group hover:border-primary/20 transition-all">
                                            <div className="text-[8px] font-black text-muted-foreground uppercase tracking-[0.2em] opacity-40 mb-2">Protocol Format</div>
                                            <div className="text-xs font-black text-foreground uppercase tracking-tight mt-0.5">{sub.id_type || 'STANDARD'}</div>
                                          </div>
                                          <div className="p-5 rounded-2xl bg-card border border-border group hover:border-primary/20 transition-all">
                                            <div className="text-[8px] font-black text-muted-foreground uppercase tracking-[0.2em] opacity-40 mb-2">Credential Hash</div>
                                            <div className="text-xs font-black text-foreground uppercase tracking-tight mt-0.5 tabular-nums">{sub.id_number || 'N/A'}</div>
                                          </div>
                                       </>
                                     )}
                                     
                                     {level === 3 && (
                                        <div className="p-5 rounded-2xl bg-card border border-border group hover:border-primary/20 transition-all">
                                          <div className="text-[8px] font-black text-muted-foreground uppercase tracking-[0.2em] opacity-40 mb-2">Evidence Format</div>
                                          <div className="text-xs font-black text-foreground uppercase tracking-tight mt-0.5">{sub.address_doc_type || 'UTILITY_BILL'}</div>
                                        </div>
                                     )}
                                  </div>

                                  {/* Media Previews */}
                                  {(level === 2 || level === 3) && (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                                      {sub.document_front && (
                                        <div onClick={() => setPreviewImage(sub.document_front)} className="group relative rounded-[2rem] border border-border bg-black/5 overflow-hidden h-48 hover:border-primary transition-all cursor-zoom-in">
                                          <div className="absolute inset-0 bg-primary/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-10 backdrop-blur-[2px]">
                                            <span className="text-white text-[9px] font-black uppercase tracking-[0.25em] bg-black shadow-2xl px-6 py-3 rounded-full flex items-center gap-2"><Eye className="w-3 h-3" /> INSPECT</span>
                                          </div>
                                          <div className="absolute top-4 left-4 bg-black/80 backdrop-blur-md px-3 py-1 rounded-full text-[8px] font-black text-white uppercase tracking-widest z-10">ANTERIOR</div>
                                          <img src={sub.document_front} className="w-full h-full object-cover" alt="ID Front" />
                                        </div>
                                      )}
                                      {sub.document_back && (
                                        <div onClick={() => setPreviewImage(sub.document_back)} className="group relative rounded-[2rem] border border-border bg-black/5 overflow-hidden h-48 hover:border-primary transition-all cursor-zoom-in">
                                          <div className="absolute inset-0 bg-primary/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-10 backdrop-blur-[2px]">
                                            <span className="text-white text-[9px] font-black uppercase tracking-[0.25em] bg-black shadow-2xl px-6 py-3 rounded-full flex items-center gap-2"><Eye className="w-3 h-3" /> INSPECT</span>
                                          </div>
                                          <div className="absolute top-4 left-4 bg-black/80 backdrop-blur-md px-3 py-1 rounded-full text-[8px] font-black text-white uppercase tracking-widest z-10">POSTERIOR</div>
                                          <img src={sub.document_back} className="w-full h-full object-cover" alt="ID Back" />
                                        </div>
                                      )}
                                      {sub.selfie_url && (
                                        <div onClick={() => setPreviewImage(sub.selfie_url)} className="group relative rounded-[2rem] border border-border bg-black/5 overflow-hidden h-48 hover:border-primary transition-all cursor-zoom-in">
                                          <div className="absolute inset-0 bg-primary/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-10 backdrop-blur-[2px]">
                                            <span className="text-white text-[9px] font-black uppercase tracking-[0.25em] bg-black shadow-2xl px-6 py-3 rounded-full flex items-center gap-2"><Eye className="w-3 h-3" /> INSPECT</span>
                                          </div>
                                          <div className="absolute top-4 left-4 bg-black/80 backdrop-blur-md px-3 py-1 rounded-full text-[8px] font-black text-white uppercase tracking-widest z-10">BIOMETRIC</div>
                                          <img src={sub.selfie_url} className="w-full h-full object-cover" alt="Selfie" />
                                        </div>
                                      )}
                                       {sub.address_doc_url && (
                                        <div onClick={() => setPreviewImage(sub.address_doc_url)} className="group relative rounded-[2rem] border border-border bg-black/5 overflow-hidden h-48 hover:border-primary transition-all cursor-zoom-in">
                                          <div className="absolute inset-0 bg-primary/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-10 backdrop-blur-[2px]">
                                            <span className="text-white text-[9px] font-black uppercase tracking-[0.25em] bg-black shadow-2xl px-6 py-3 rounded-full flex items-center gap-2"><Eye className="w-3 h-3" /> INSPECT</span>
                                          </div>
                                          <div className="absolute top-4 left-4 bg-black/80 backdrop-blur-md px-3 py-1 rounded-full text-[8px] font-black text-white uppercase tracking-widest z-10">RESIDENCY EVI.</div>
                                          <img src={sub.address_doc_url} className="w-full h-full object-cover" alt="Address Proof" />
                                        </div>
                                      )}
                                    </div>
                                  )}

                                  {/* Error states */}
                                  {sub.status === 'Rejected' && sub.rejection_reason && (
                                    <div className="p-6 rounded-[1.5rem] bg-red-500/5 border border-red-500/10 mb-8 flex gap-4 items-start">
                                      <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center text-red-500 shrink-0 mt-1"><X className="w-4 h-4" /></div>
                                      <div>
                                        <span className="text-[10px] font-black text-red-500 uppercase tracking-widest">Invalidation Rationale</span>
                                        <p className="text-xs text-foreground uppercase tracking-tight mt-1 leading-relaxed">{sub.rejection_reason}</p>
                                      </div>
                                    </div>
                                  )}

                                  {/* Decisional Controls */}
                                  {sub.status === 'Pending' && (
                                    <div className="flex flex-col sm:flex-row gap-4">
                                      <Button
                                        variant="outline"
                                        className="flex-1 h-14 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] border-red-500/20 text-red-500 hover:bg-red-500/10 hover:border-red-500/30 transition-all"
                                        onClick={() => setRejectionDialog({ userId: String(viewUser.id), userName: viewUser.name, level })}
                                      >
                                        REJECT PHASE 0{level}
                                      </Button>
                                      <Button
                                        variant="hero"
                                        className="flex-1 h-14 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] text-white shadow-gold bg-primary transition-all"
                                        onClick={() => handleKycApprove(viewUser.id, viewUser.name, level)}
                                      >
                                        AUTHORIZE PHASE 0{level} <CheckCircle className="w-4 h-4 ml-3" />
                                      </Button>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="text-center py-32 border border-dashed border-border rounded-[3rem] bg-secondary/5">
                            <Shield className="w-16 h-16 text-muted-foreground/10 mx-auto mb-6" />
                            <p className="text-[10px] font-black text-muted-foreground/30 uppercase tracking-[0.4em]">Awaiting Identity Transmission</p>
                          </div>
                        )}
                      </section>
                    </TabsContent>
                  </div>
                </Tabs>
              </ScrollArea>

              {/* Interface Exit */}
              <div className="p-8 border-t border-border bg-secondary/10 shrink-0 flex justify-end">
                <Button variant="outline" className="px-14 h-14 rounded-2xl text-[10px] font-black uppercase tracking-[0.25em] hover:bg-secondary transition-all" onClick={() => setViewUser(null)}>
                  CLOSE DOSSIER
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
              <DialogFooter className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
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
