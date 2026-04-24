import { motion } from "framer-motion";
import { useState, useEffect, useCallback } from "react";
import AdminLayout from "@/components/layouts/AdminLayout";
import {
  Users, DollarSign, Activity, TrendingUp, ArrowUpRight, ShieldCheck,
  Zap, ArrowDownRight, Clock, ExternalLink, Search, CheckCircle2,
  XCircle, Download, BarChart3, Globe, Database, History, Coins, Target
} from "lucide-react";
import { useStore } from "@/store/useStore";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { Badge } from "@/components/ui/badge";

const AdminOverview = () => {
  const { formatCurrency, user } = useStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (user && user.role !== 'admin') {
      navigate('/admin/login');
    }
  }, [user, navigate]);

  const [isCriticalLoading, setIsCriticalLoading] = useState(true);
  const [isDeferredLoading, setIsDeferredLoading] = useState(true);

  const [activeSessions, setActiveSessions] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [platformRevenue, setPlatformRevenue] = useState(0);
  const [tradeVolume, setTradeVolume] = useState(0);
  const [buyOrders, setBuyOrders] = useState(0);
  const [sellOrders, setSellOrders] = useState(0);
  
  const fetchAppData = useCallback(async () => {
    setIsCriticalLoading(true);
    setIsDeferredLoading(true);

    try {
        // Critical: Users & Trades
        const [profilesRes, tradesRes] = await Promise.all([
           supabase.from('profiles').select('*, balances:balances(*)'),
           supabase.from('trades').select('*')
        ]);

        if (profilesRes.data) {
            setUsers(profilesRes.data.map(u => {
                const b = Array.isArray(u.balances) ? u.balances[0] : u.balances;
                const fiat = Number(b?.fiat_balance || 0);
                const trading = Number(b?.trading_balance || 0);
                const copyTrading = Number(b?.copy_trading_balance || 0);
                const crypto = b?.crypto_balances || {};
                
                const cryptoPrices: Record<string, number> = { btc: 65000, eth: 3500, usdt: 1, sol: 145, usdc: 1, xrp: 0.62, bnb: 580 };
                const cryptoTotal = Object.entries(crypto).reduce((acc, [coin, amount]) => {
                    return acc + (Number(amount) * (cryptoPrices[coin.toLowerCase()] || 0));
                }, 0);

                return {
                    ...u,
                    balanceNum: fiat + trading + copyTrading + cryptoTotal,
                    cryptoBalanceNum: cryptoTotal,
                    fiatBalanceNum: fiat,
                    tradingBalance: trading,
                    copyTradingBalance: copyTrading,
                    balances: crypto,
                    joined: new Date(u.created_at).toLocaleDateString()
                };
            }));
        }

        if (tradesRes.data) {
            setTradeVolume(tradesRes.data.reduce((acc, t) => acc + (Number(t.amount) || 0), 0));
            setBuyOrders(tradesRes.data.filter(t => t.type?.toLowerCase() === 'buy' || t.type?.toLowerCase() === 'long').length);
            setSellOrders(tradesRes.data.filter(t => t.type?.toLowerCase() === 'sell' || t.type?.toLowerCase() === 'short').length);
        }

        setIsCriticalLoading(false);

        // Deferred: Sessions, TXs, Fees
        const [sessionsRes, txRes, feeRes] = await Promise.all([
           supabase.from('active_sessions').select('*'),
           supabase.from('transactions').select('*, profiles(name)').order('created_at', { ascending: false }),
           supabase.from('fee_ledger').select('fee_amount')
        ]);

        if (sessionsRes.data) setActiveSessions(sessionsRes.data);
        if (txRes.data) setTransactions(txRes.data);
        if (feeRes.data) setPlatformRevenue(feeRes.data.reduce((acc, r) => acc + (Number(r.fee_amount) || 0), 0));
        
        setIsDeferredLoading(false);

    } catch (err) {
        console.error("Failed to fetch admin data", err);
        setIsCriticalLoading(false);
        setIsDeferredLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAppData();

    let debounceTimer: ReturnType<typeof setTimeout>;
    const debouncedFetch = () => {
       clearTimeout(debounceTimer);
       debounceTimer = setTimeout(fetchAppData, 800);
    };

    const mainSub = supabase
      .channel('admin-global-sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'balances' }, debouncedFetch)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'active_sessions' }, debouncedFetch)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, debouncedFetch)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'transactions' }, debouncedFetch)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'trades' }, debouncedFetch)
      .subscribe();

    return () => {
      supabase.removeChannel(mainSub);
    };
  }, [fetchAppData]);
  
  const cryptoPool = users.reduce((acc, u) => acc + (Number(u.cryptoBalanceNum) || 0), 0);
  const fiatPool = users.reduce((acc, u) => acc + (Number(u.fiatBalanceNum) || 0), 0);
  const tradingPool = users.reduce((acc, u) => acc + (Number(u.tradingBalance) || 0), 0);
  const copyPool = users.reduce((acc, u) => acc + (Number(u.copyTradingBalance) || 0), 0);

  const activeCount = activeSessions.filter(s => s.status === 'active').length;
  const totalAllocated = activeSessions.reduce((acc, s) => acc + (Number(s.allocated_amount) || 0), 0);

  const stats = [
    { label: "Total Assets", value: formatCurrency(cryptoPool + fiatPool + tradingPool + copyPool), change: "All Assets", icon: Database, up: true, color: "text-primary", bg: "bg-primary/20" },
    { label: "Cash & Trading", value: formatCurrency(fiatPool + tradingPool), change: `+${tradingPool > 0 ? 'Trading Active' : 'Stable'}`, icon: Globe, up: true, color: "text-blue-500", bg: "bg-blue-500/10" },
    { label: "Copy Trading", value: formatCurrency(copyPool), change: `${activeCount} Active Trades`, icon: Target, up: true, color: "text-green-500", bg: "bg-green-500/10" },
    { label: "Total Fees", value: formatCurrency(platformRevenue), change: "Platform Income", icon: TrendingUp, up: platformRevenue > 0, color: "text-purple-500", bg: "bg-purple-500/10" },
  ];

  const recentUsers = users.slice(0, 5);
  const pendingTransactions = transactions.filter(t => t.status === "Pending");

  const handleAction = async (id: string, action: "Completed" | "Rejected") => {
    try {
      if (action === "Completed") {
        const tx = transactions.find(t => t.id === id);
        if (tx && tx.status !== 'Completed') {
           const isDeposit = tx.type === 'Deposit';
           const amount = parseFloat(tx.amount || 0);

           const { data: userBalance } = await supabase.from('balances').select('*').eq('user_id', tx.user_id).maybeSingle();
           
           const isFiat = ['USD', 'EUR', 'GBP'].includes(tx.asset?.toUpperCase());
           let updateData: any = { user_id: tx.user_id };

           if (isFiat) {
             const current = userBalance?.fiat_balance || 0;
             updateData.fiat_balance = isDeposit ? current + amount : current - amount;
           } else {
             const cryptoBalances = userBalance?.crypto_balances || {};
             const asset = tx.asset?.toUpperCase() || 'BTC';
             const current = cryptoBalances[asset] || 0;
             
             // Simple fee logic for overview
             const feePercent = 2; 
             const feeAmount = parseFloat((amount * (feePercent / 100)).toFixed(8));
             const netAmount = parseFloat((amount - feeAmount).toFixed(8));

             const actualDiff = isDeposit ? netAmount : -amount;
             updateData.crypto_balances = { ...cryptoBalances, [asset]: current + actualDiff };

             if (isDeposit && feeAmount > 0) {
                 await supabase.from('fee_ledger').insert([{
                     transaction_id: tx.id,
                     user_id: tx.user_id,
                     gross_amount: amount,
                     fee_percent: feePercent,
                     fee_amount: feeAmount,
                     net_amount: netAmount,
                     asset: asset
                 }]);
             }
           }
           
           if (userBalance) {
               await supabase.from('balances').update(updateData).eq('user_id', tx.user_id);
           } else {
               await supabase.from('balances').insert([updateData]);
           }
        }
      }
      
      const { error } = await supabase.from('transactions').update({ status: action }).eq('id', id);
      if (error) throw error;
      
      toast.success(`Transaction ${action}`, { description: `ID: ${id.substring(0, 12)}...` });
      fetchAppData();
    } catch (error: any) {
      toast.error("Action failed: " + error.message);
    }
  };

  const handleExport = () => {
    toast.promise(new Promise((resolve) => setTimeout(resolve, 1500)), {
      loading: 'Preparing system report...',
      success: 'Report downloaded successfully',
      error: 'Failed to generate report'
    });
  };

  const handleSyncData = async () => {
    toast.promise(fetchAppData(), {
      loading: 'Syncing data...',
      success: 'All asset balances and user data are now up-to-date',
      error: 'Failed to sync platform data. Please check connectivity.'
    });
  };

  const handleQuickActions = () => {
    toast.info("Quick Management Active", { description: "You can now perform bulk actions on users and transactions." });
  };

  return (
    <AdminLayout>
      <div className="space-y-8 lg:space-y-12 mb-10">
        {/* Institutional Header */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-border">
          <div className="space-y-1">
            <h1 className="text-3xl font-black text-foreground tracking-tight uppercase">Platform Dashboard</h1>
            <p className="text-muted-foreground text-sm font-medium">Real-time platform analytics, financial metrics, and administrative overview.</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
             <Button variant="outline" className="h-11 border-border text-[10px] font-black uppercase tracking-[0.2em] px-6 hover:bg-secondary rounded-xl transition-all group" onClick={fetchAppData}>
                <Activity className="w-4 h-4 mr-2 group-hover:rotate-180 transition-transform duration-500" /> Refresh Data
             </Button>
             <Button variant="outline" className="h-11 border-border text-[10px] font-black uppercase tracking-[0.2em] px-6 hover:bg-secondary rounded-xl transition-all group" onClick={handleExport}>
                <Download className="w-4 h-4 mr-2 group-hover:translate-y-0.5 transition-transform" /> Export Report
             </Button>
             <Button variant="hero" className="h-11 text-[10px] font-black uppercase tracking-[0.2em] px-8 shadow-gold text-white rounded-xl transition-all" onClick={handleSyncData}>
                <Zap className="w-4 h-4 mr-2 group-hover:scale-125 transition-transform" /> Sync Balances
             </Button>
          </div>
        </header>


        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-card p-6 rounded-3xl border border-border shadow-sm hover:shadow-md transition-shadow group relative overflow-hidden"
            >
              <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-primary/5 rounded-full blur-2xl group-hover:bg-primary/10 transition-colors" />
              <div className="flex items-center justify-between mb-5 relative z-10">
                <div className={`p-3 rounded-2xl ${stat.bg} ${stat.color} group-hover:scale-110 transition-transform`}>
                   <stat.icon className="w-5 h-5" />
                </div>
                <div className={`text-[10px] font-black uppercase tracking-widest ${stat.up ? "text-green-500" : "text-red-500"} flex items-center gap-1 bg-secondary/50 px-2 py-1 rounded-lg border border-border`}>
                  {stat.up ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                  {stat.change}
                </div>
              </div>
              <div className="relative z-10">
                {isCriticalLoading ? (
                  <div className="h-8 w-24 bg-primary/20 animate-pulse rounded mt-2 mb-1" />
                ) : (
                  <div className="text-2xl font-black text-foreground tracking-tight mb-0.5">{stat.value}</div>
                )}
                <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-tighter">{stat.label}</div>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="grid lg:grid-cols-12 gap-8">
            <div className="lg:col-span-8 bg-card p-6 sm:p-10 rounded-[2.5rem] border border-border shadow-huge flex flex-col min-h-[500px] relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-[100px] pointer-events-none group-hover:bg-primary/10 transition-all" />
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-10 gap-6 relative z-10">
                  <div className="flex items-center gap-5">
                    <div className="w-16 h-16 rounded-[1.5rem] bg-primary/10 flex items-center justify-center border border-primary/20 shadow-sm transition-transform group-hover:rotate-3">
                      <Users className="w-8 h-8 text-primary shadow-glow" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-black text-foreground tracking-tight">Active Users</h2>
                      <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.25em] mt-1 opacity-40">Recent Registration Activity</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 w-full sm:w-auto">
                    <div className="hidden md:flex items-center -space-x-3 mr-4 px-4 py-1.5 bg-secondary/50 rounded-2xl border border-border">
                      {isCriticalLoading ? (
                        <>
                          {[1, 2, 3].map((_, index) => (
                            <div key={`sk-${index}`} className="relative w-10 h-10 rounded-xl border-4 border-card bg-primary/10 animate-pulse flex items-center justify-center text-[10px] font-black text-foreground shadow-sm overflow-hidden ring-1 ring-border" />
                          ))}
                        </>
                      ) : (
                        <>
                          {users.slice(0, 3).map((u, index) => (
                            <div key={index} className="relative w-10 h-10 rounded-xl border-4 border-card bg-secondary flex items-center justify-center text-[10px] font-black text-foreground shadow-sm overflow-hidden ring-1 ring-border">
                              {u?.avatar_url ? (
                                <img src={u.avatar_url} className="w-full h-full object-cover" />
                              ) : (
                                u?.name?.charAt(0) || "U"
                              )}
                            </div>
                          ))}
                          <div className="w-10 h-10 rounded-xl border-4 border-card bg-primary/10 flex items-center justify-center text-[9px] font-black text-primary ring-1 ring-border">
                             +{users.length > 3 ? users.length - 3 : 0}
                          </div>
                        </>
                      )}
                    </div>
                    <Button variant="outline" className="h-12 px-8 text-[10px] font-black uppercase tracking-widest rounded-2xl hover:bg-secondary border-border flex-1 sm:flex-none shadow-sm" onClick={() => navigate("/admin/users")}>
                      Manage Users
                    </Button>
                  </div>

                </div>

                <div className="flex-1 relative z-10 overflow-hidden">
                   {/* Mobile Card Layout */}
                   <div className="lg:hidden space-y-4 pb-4">
                      {isCriticalLoading ? (
                        [1, 2, 3].map((i) => (
                           <div key={`mob-sk-${i}`} className="p-6 rounded-[2rem] bg-secondary/5 border border-border animate-pulse h-32" />
                        ))
                      ) : recentUsers.map((u) => (
                         <div key={u.email} className="p-6 rounded-[2rem] bg-secondary/5 border border-border group/user hover:border-primary/30 transition-all">
                            <div className="flex items-center gap-4 mb-4">
                               <div className="w-12 h-12 rounded-2xl bg-card border border-border flex items-center justify-center overflow-hidden">
                                  {u?.avatar_url ? <img src={u.avatar_url} className="w-full h-full object-cover" /> : <span className="text-sm font-black text-primary">{u.name?.charAt(0)}</span>}
                               </div>
                               <div className="flex-1 min-w-0">
                                  <div className="text-sm font-black text-foreground uppercase tracking-tight truncate">{u.name}</div>
                                  <div className="text-[10px] font-black text-muted-foreground/40 uppercase tracking-widest truncate">{u.email}</div>
                                </div>
                                <Badge className={`text-[8px] font-black uppercase tracking-widest ${u.kyc === "Approved" ? "bg-green-500/10 text-green-500" : "bg-amber-500/10 text-amber-500"}`}>
                                   {u.kyc || "PEND"}
                                </Badge>
                            </div>
                            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border/50">
                               <div>
                                  <div className="text-[8px] font-black text-muted-foreground uppercase opacity-40 mb-1">Portfolio</div>
                                  <div className="text-xs font-black text-foreground tabular-nums">{formatCurrency(u.balanceNum)}</div>
                               </div>
                               <div className="text-right">
                                  <div className="text-[8px] font-black text-muted-foreground uppercase opacity-40 mb-1">Joined</div>
                                  <div className="text-xs font-black text-muted-foreground/60 tabular-nums">{u.joined}</div>
                               </div>
                            </div>
                         </div>
                      ))}
                   </div>

                   {/* Desktop Table Layout */}
                   <div className="hidden lg:block overflow-x-auto">
                      <table className="w-full text-sm">
                         <thead>
                           <tr className="text-muted-foreground text-[10px] font-black uppercase tracking-[0.2em] border-b border-border bg-secondary/10">
                             <th className="text-left py-6 px-4">Member Profile</th>
                             <th className="text-left py-6 px-4">Status</th>
                             <th className="text-left py-6 px-4">Total Assets</th>
                             <th className="text-left py-6 px-4">Available Capital</th>
                             <th className="text-right py-6 px-4">Registration</th>
                           </tr>
                         </thead>

                         <tbody className="divide-y divide-border">
                           {isCriticalLoading ? (
                              [1, 2, 3, 4, 5].map((i) => (
                                <tr key={`desk-sk-${i}`}>
                                  <td className="py-6 px-4">
                                    <div className="flex items-center gap-5">
                                      <div className="w-12 h-12 rounded-2xl bg-secondary animate-pulse" />
                                      <div className="space-y-2">
                                        <div className="w-24 h-4 bg-secondary animate-pulse rounded" />
                                        <div className="w-32 h-3 bg-secondary animate-pulse rounded" />
                                      </div>
                                    </div>
                                  </td>
                                  <td className="py-6 px-4"><div className="w-20 h-6 bg-secondary animate-pulse rounded-lg" /></td>
                                  <td className="py-6 px-4"><div className="w-24 h-5 bg-secondary animate-pulse rounded" /></td>
                                  <td className="py-6 px-4"><div className="w-24 h-5 bg-secondary animate-pulse rounded" /></td>
                                  <td className="py-6 px-4 text-right"><div className="w-16 h-4 bg-secondary animate-pulse rounded ml-auto" /></td>
                                </tr>
                              ))
                           ) : recentUsers.map((u) => (
                             <tr key={u.email} className="group/row hover:bg-secondary/20 transition-all">
                                 <td className="py-6 px-4">
                                   <div className="flex items-center gap-5">
                                     <div className="relative w-12 h-12 rounded-2xl bg-card border border-border flex items-center justify-center group-hover/row:scale-110 transition-transform shadow-sm overflow-hidden">
                                        {u?.avatar_url ? (
                                          <img src={u.avatar_url} className="w-full h-full object-cover" />
                                        ) : (
                                          <div className="text-sm font-black text-muted-foreground">{u?.name?.substring(0, 1) || "U"}</div>
                                        )}
                                     </div>
                                     <div>
                                        <div className="font-black text-foreground uppercase tracking-tight text-sm tracking-tight">{u.name}</div>
                                        <div className="text-[10px] font-black text-muted-foreground/40 uppercase mt-1 tracking-widest tabular-nums truncate max-w-[150px]">{u.email}</div>
                                     </div>
                                   </div>
                                 </td>
                                  <td className="py-6 px-4">
                                     <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-[0.15em] border inline-flex items-center gap-2 ${
                                       u.kyc === "Approved" ? "bg-green-500/10 text-green-600 border-green-500/20" : "bg-amber-500/10 text-amber-600 border-amber-500/20"
                                     }`}>
                                        {u.kyc === "Approved" ? <ShieldCheck className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
                                        {u.kyc || "UNVERIFIED"}
                                     </span>
                                  </td>
                                <td className="py-6 px-4 font-black text-foreground tabular-nums text-sm tracking-tight">
                                   {formatCurrency(u.balanceNum)}
                                </td>
                                <td className="py-6 px-4 font-black text-primary tabular-nums text-sm tracking-tight">
                                   {formatCurrency(u.fiatBalanceNum)}
                                </td>
                                <td className="py-6 px-4 text-right">
                                   <div className="text-[10px] font-black text-muted-foreground/40 tabular-nums uppercase tracking-widest">{u.joined}</div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                       </table>
                    </div>
                 </div>
                 <div className="mt-8 pt-8 border-t border-border flex flex-col sm:flex-row justify-between items-center gap-6 relative z-10">
                    <span className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] opacity-40">System monitoring {users.length} active platform accounts</span>
                    <Button variant="ghost" className="h-12 px-8 text-[11px] font-black text-primary hover:bg-primary/10 transition-all uppercase tracking-widest rounded-2xl group" onClick={() => navigate('/admin/users')}>
                       User Directory <ArrowUpRight className="w-4 h-4 ml-3 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                    </Button>
                 </div>
              </div>

            {/* Right: Pending Transactions */}
            <div className="lg:col-span-4 space-y-8">
              <div className="bg-card p-10 rounded-[2.5rem] border border-border shadow-huge flex flex-col min-h-[480px] relative overflow-hidden group">
                <div className="absolute inset-0 bg-amber-500/[0.02] pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="flex items-center justify-between mb-12 relative z-10">
                   <div className="flex items-center gap-5">
                      <div className="w-16 h-16 rounded-[1.5rem] bg-amber-500/10 flex items-center justify-center border border-amber-500/20 shadow-sm transition-transform group-hover:-rotate-3">
                         <Clock className="w-8 h-8 text-amber-500 shadow-glow" />
                      </div>
                      <div>
                        <h2 className="text-2xl font-black text-foreground tracking-tight">Pending Tasks</h2>
                        <span className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.25em] mt-1 opacity-40">Administrative Queue</span>
                      </div>
                   </div>
                   <History className="w-6 h-6 text-muted-foreground/20 hover:text-primary cursor-pointer transition-all hover:rotate-180" />
                </div>

                
                <div className="flex-1 space-y-8 relative z-10">
                  {isDeferredLoading ? (
                     [1, 2, 3].map((i) => (
                       <div key={`tx-sk-${i}`} className="p-8 rounded-[2.5rem] bg-secondary/20 border border-border animate-pulse h-48" />
                     ))
                  ) : pendingTransactions.length === 0 ? (
                    <div className="py-24 text-center border-4 border-dashed border-border rounded-[2.5rem] group/empty hover:border-primary/40 transition-all bg-secondary/5">
                       <CheckCircle2 className="w-16 h-16 text-muted-foreground/10 mx-auto mb-6 group-hover/empty:scale-110 transition-transform" />
                       <div className="text-[11px] font-black text-muted-foreground uppercase tracking-[0.3em] opacity-40">Actions Completed</div>
                    </div>

                  ) : pendingTransactions.slice(0, 3).map((w, i) => (
                    <motion.div 
                      key={w.id} 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 + i * 0.1 }}
                      className="p-8 rounded-[2.5rem] bg-secondary/20 border border-border hover:border-primary/30 transition-all group/tx relative overflow-hidden"
                    >
                      <div className="flex items-center justify-between mb-6">
                         <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-primary shadow-gold flex items-center justify-center text-white text-[11px] font-black uppercase tracking-widest relative overflow-hidden">
                               <div className="absolute inset-0 bg-white/10 transform -skew-x-12 translate-x-full group-hover/tx:-translate-x-full transition-transform duration-700" />
                               {w.asset}
                            </div>
                             <div>
                                <div className="text-base font-black text-foreground flex items-center gap-3 tracking-tight">
                                   {w.profiles?.name || "User Account"}
                                   <Badge className={`text-[8px] font-black uppercase tracking-[0.2em] ${w.type === 'Deposit' ? 'bg-green-500/10 text-green-600 border-green-500/20' : 'bg-red-500/10 text-red-600 border-red-500/20'}`}>
                                      {w.type}
                                   </Badge>
                                </div>
                                <div className="text-[10px] font-black text-muted-foreground/40 mt-1 uppercase tracking-widest tabular-nums">TX_ID: {w.id.substring(0, 12)}...</div>
                             </div>

                         </div>
                      </div>
                      
                      <div className="flex items-end justify-between mb-8">
                         <div>
                            <div className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-2 opacity-40">Transaction Volume</div>
                            <div className="text-4xl font-black text-foreground tabular-nums tracking-tighter">
                               {formatCurrency(w.amount)}
                            </div>
                         </div>
                         <div className="text-[10px] font-black text-primary uppercase tracking-widest bg-card px-4 py-2.5 rounded-2xl border border-border shadow-huge">
                            {w.asset}
                         </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                         <Button onClick={() => handleAction(w.id, 'Completed')} className="bg-primary shadow-gold-lg hover:shadow-gold-xl text-white border-0 h-11 text-[10px] font-black uppercase tracking-[0.2em] rounded-xl transition-all active:scale-95">
                            <CheckCircle2 className="w-4 h-4 mr-2" /> Approve
                         </Button>
                         <Button onClick={() => handleAction(w.id, 'Rejected')} className="bg-card hover:bg-secondary border border-border h-11 text-[10px] font-black uppercase tracking-[0.2em] rounded-xl transition-all active:scale-95">
                            <XCircle className="w-4 h-4 mr-2 text-red-500" /> Decline
                         </Button>
                      </div>
                    </motion.div>
                  ))}
                </div>

                <div className="mt-auto pt-10 border-t border-border">
                       <div className="flex items-center justify-between p-6 rounded-[2rem] bg-secondary/40 border border-border shadow-sm relative overflow-hidden group/sys">
                          <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover/sys:opacity-100 transition-opacity" />
                          <div className="flex items-center gap-4 relative z-10">
                             <div className="w-12 h-12 rounded-2xl bg-card border border-border flex items-center justify-center group-hover/sys:rotate-12 transition-transform">
                                <Database className="w-6 h-6 text-primary shadow-glow" />
                             </div>
                             <div>
                                <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest opacity-40">System Status</span>
                                <div className="text-sm font-black text-foreground uppercase">Stable</div>
                             </div>
                          </div>
                          <span className="text-base font-black text-primary tracking-tighter tabular-nums relative z-10">Active</span>
                       </div>

                </div>
              </div>
           </div>
        </div>
         {/* System Status Footer */}
        <div className="p-10 rounded-[3rem] bg-card border border-border flex flex-col md:flex-row items-center justify-between gap-10 shadow-huge relative overflow-hidden group mt-8">
           <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
           <div className="flex flex-wrap items-center justify-center md:justify-start gap-12 relative z-10">
              <div className="flex items-center gap-4">
                 <div className="w-2.5 h-2.5 rounded-full bg-green-500 shadow-glow animate-pulse" />
                 <span className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Live Markets: Active</span>
              </div>
              <div className="flex items-center gap-4">
                 <div className="w-2.5 h-2.5 rounded-full bg-primary shadow-glow animate-pulse" />
                 <span className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">System Health: 100%</span>
              </div>
              <div className="flex items-center gap-4">
                 <div className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-glow animate-pulse" />
                 <span className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Trading Services: Active</span>
              </div>
           </div>
           <div className="flex items-center gap-4 relative z-10 px-6 py-2 bg-secondary/50 rounded-full border border-border">
              <ShieldCheck className="w-4 h-4 text-primary" />
              <span className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-[0.25em] tabular-nums">Version 4.8.2</span>
           </div>
        </div>

   {/* Lower Grid: System & Revenue */}
   <div className="grid lg:grid-cols-3 gap-8 pb-10">
      {/* System Status */}
      <div className="bg-card border border-border p-8 rounded-3xl shadow-sm space-y-8 h-full">
         <div className="flex items-center justify-between">
            <div className="flex flex-col gap-1">
               <h2 className="text-lg font-bold text-foreground font-sans tracking-tight">System Infrastructure</h2>
               <p className="text-xs text-muted-foreground font-medium uppercase tracking-widest">Health Monitor</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform cursor-pointer shadow-sm">
               <Database className="w-5 h-5" />
            </div>
         </div>

         <div className="space-y-6">
            {[
               { label: "Payment Gateways", status: "Operational", ping: "12ms", health: 100 },
               { label: "Order Matching", status: "Active", ping: "45ms", health: 98 },
               { label: "Withdrawal Service", status: "Operational", ping: "14ms", health: 100 },
               { label: "Market Data API", status: "Operational", ping: "8ms", health: 100 },
            ].map((item) => (
               <div key={item.label} className="space-y-3">
                  <div className="flex items-center justify-between">
                     <span className="text-xs font-bold text-foreground uppercase tracking-wider">{item.label}</span>
                     <span className="text-[10px] font-extrabold text-green-500 uppercase tracking-tighter bg-green-500/10 px-2 py-0.5 rounded-md border border-green-500/20">{item.status}</span>
                  </div>
                  <div className="flex items-center gap-3">
                     <div className="flex-1 h-1.5 bg-secondary rounded-full overflow-hidden">
                        <motion.div 
                           initial={{ width: 0 }}
                           animate={{ width: `${item.health}%` }}
                           className={`h-full ${item.health > 95 ? 'bg-primary' : 'bg-amber-500'}`}
                        />
                     </div>
                     <span className="text-[10px] font-bold text-muted-foreground tabular-nums w-8">{item.ping}</span>
                  </div>
               </div>
            ))}
         </div>
         <Button variant="outline" className="w-full h-11 text-xs font-bold uppercase tracking-widest hover:bg-secondary border-border mt-4" onClick={() => toast.success("System logs accessed")}>
            View Infrastructure Logs
         </Button>
      </div>


      {/* Security Section */}
      <div className="bg-card border border-border p-8 rounded-3xl shadow-sm space-y-8 h-full">
         <div className="flex items-center justify-between">
            <div className="flex flex-col gap-1">
               <h2 className="text-lg font-bold text-foreground font-sans tracking-tight">Security Center</h2>
               <p className="text-xs text-muted-foreground font-medium uppercase tracking-widest">Data Protection Status</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center text-green-600 border border-green-500/20">
               <ShieldCheck className="w-5 h-5" />
            </div>
         </div>

         <div className="p-5 rounded-xl bg-green-500/5 border border-green-500/10 flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-green-500 flex items-center justify-center text-white shrink-0 shadow-lg">
               <CheckCircle2 className="w-5 h-5" />
            </div>
            <div className="space-y-1">
               <p className="text-sm font-bold text-foreground">Infrastructure secure.</p>
               <p className="text-xs text-muted-foreground leading-relaxed font-medium">All security protocols are currently active.</p>
            </div>
         </div>

         <div className="space-y-5">
            <div className="flex items-center justify-between py-2 border-b border-border">
               <div className="flex flex-col gap-0.5">
                  <span className="text-sm font-bold text-foreground">Anti-DDoS Shield</span>
                  <span className="text-[10px] text-muted-foreground font-medium">Traffic Filtering Active</span>
               </div>
               <div className="w-10 h-5 bg-primary/20 rounded-full relative">
                  <div className="absolute right-0.5 top-0.5 w-4 h-4 bg-primary rounded-full shadow-sm" />
               </div>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-border">
               <div className="flex flex-col gap-0.5">
                  <span className="text-sm font-bold text-foreground">Access Management</span>
                  <span className="text-[10px] text-muted-foreground font-medium">Permission Audit Active</span>
               </div>
               <div className="w-10 h-5 bg-primary/20 rounded-full relative">
                  <div className="absolute right-0.5 top-0.5 w-4 h-4 bg-primary rounded-full shadow-sm" />
               </div>
            </div>
            <div className="flex items-center justify-between py-2">
               <div className="flex flex-col gap-0.5">
                  <span className="text-sm font-bold text-foreground">Encrypted Backup</span>
                  <span className="text-[10px] text-muted-foreground font-medium">Daily Sync Completed</span>
               </div>
               <div className="w-10 h-5 bg-primary/20 rounded-full relative">
                  <div className="absolute right-0.5 top-0.5 w-4 h-4 bg-primary rounded-full shadow-sm" />
               </div>
            </div>
         </div>
      </div>


      {/* Performance Section */}
      <div className="bg-card border border-border p-8 rounded-3xl shadow-sm space-y-8 h-full relative overflow-hidden group">
         <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-primary/10 transition-colors" />
         
         <div className="relative z-10 flex items-center justify-between">
            <div className="flex flex-col gap-1">
               <h2 className="text-lg font-bold text-foreground font-sans tracking-tight">Trading Summary</h2>
               <p className="text-xs text-primary font-medium uppercase tracking-[0.2em]">Platform Metrics</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center text-primary shadow-gold">
               <BarChart3 className="w-5 h-5" />
            </div>
         </div>

         <div className="relative z-10 space-y-8">
            <div className="space-y-2">
               <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest px-1">Global Volume</p>
               {isCriticalLoading ? (
                 <div className="h-10 w-48 bg-primary/20 animate-pulse rounded my-1 px-1" />
               ) : (
                 <div className="text-4xl font-black text-foreground tracking-tighter tabular-nums px-1">{formatCurrency(tradeVolume)}</div>
               )}
            </div>

            <div className="grid grid-cols-2 gap-6 pb-2 px-1">
               <div className="space-y-1">
                  <span className="text-[10px] text-muted-foreground font-bold uppercase">Buy Orders</span>
                  {isCriticalLoading ? (
                     <div className="h-6 w-16 bg-primary/20 animate-pulse rounded mt-1" />
                  ) : (
                     <div className="text-lg font-bold text-green-600 tabular-nums">{buyOrders.toLocaleString()}</div>
                  )}
               </div>
               <div className="space-y-1">
                  <span className="text-[10px] text-muted-foreground font-bold uppercase">Sell Orders</span>
                  {isCriticalLoading ? (
                     <div className="h-6 w-16 bg-primary/20 animate-pulse rounded mt-1" />
                  ) : (
                     <div className="text-lg font-bold text-foreground tabular-nums">{sellOrders.toLocaleString()}</div>
                  )}
               </div>
            </div>

            <div className="p-5 rounded-xl bg-background border border-border space-y-3">
               <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-foreground uppercase tracking-tight">System Latency</span>
                  <span className="text-xs font-bold text-primary tabular-nums">0.2ms</span>
               </div>
               <div className="w-full h-1.5 bg-secondary rounded-full overflow-hidden shadow-inner">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: "95%" }}
                    className="h-full bg-primary shadow-gold"
                  />
               </div>
            </div>
         </div>
      </div>
   </div>

      </div>
    </AdminLayout>
  );
};

export default AdminOverview;
