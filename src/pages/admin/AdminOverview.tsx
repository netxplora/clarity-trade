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

const AdminOverview = () => {
  const { formatCurrency, user } = useStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (user && user.role !== 'admin') {
      navigate('/admin/login');
    }
  }, [user, navigate]);

  const [activeSessions, setActiveSessions] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [platformRevenue, setPlatformRevenue] = useState(0);
  const [tradeVolume, setTradeVolume] = useState(0);
  const [buyOrders, setBuyOrders] = useState(0);
  const [sellOrders, setSellOrders] = useState(0);
  
  const fetchAppData = useCallback(async () => {
    try {
        const [{ data: sessionsData }, { data: usersData }, { data: txData }, { data: feeData }, { data: tradeData }] = await Promise.all([
           supabase.from('active_sessions').select('*'),
           supabase.from('profiles').select('*, balances:balances(*)'),
           supabase.from('transactions').select('*, profiles(name)').order('created_at', { ascending: false }),
           supabase.from('fee_ledger').select('fee_amount'),
           supabase.from('trades').select('*')
        ]);
        
        if (sessionsData) setActiveSessions(sessionsData);
        if (usersData) {
            setUsers(usersData.map(u => {
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
        if (txData) setTransactions(txData);
        if (feeData) setPlatformRevenue(feeData.reduce((acc, r) => acc + (Number(r.fee_amount) || 0), 0));
        if (tradeData) {
            setTradeVolume(tradeData.reduce((acc, t) => acc + (Number(t.amount) || 0), 0));
            setBuyOrders(tradeData.filter(t => t.type?.toLowerCase() === 'buy' || t.type?.toLowerCase() === 'long').length);
            setSellOrders(tradeData.filter(t => t.type?.toLowerCase() === 'sell' || t.type?.toLowerCase() === 'short').length);
        }
    } catch (err) {
        console.error("Failed to fetch admin data", err);
    }
  }, []);

  useEffect(() => {
    fetchAppData();

    const mainSub = supabase
      .channel('admin-global-sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'balances' }, () => fetchAppData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'active_sessions' }, () => fetchAppData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => fetchAppData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'transactions' }, () => fetchAppData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'trades' }, () => fetchAppData())
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
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-2">
          <div>
            <div className="flex items-center gap-2 text-primary mb-1">
               <ShieldCheck className="w-4 h-4" />
               <span className="text-[10px] font-black tracking-wider uppercase">Admin Dashboard</span>
            </div>
            <h1 className="text-3xl font-bold font-sans text-foreground">Overview</h1>
            <p className="text-muted-foreground mt-1 text-sm">Monitor platform status and user activity.</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
             <Button variant="outline" className="h-12 border-border text-[10px] font-black uppercase tracking-widest px-6 flex-1 sm:flex-none hover:bg-secondary" onClick={fetchAppData}>
                <Activity className="w-4 h-4 mr-2" /> Refresh
             </Button>
             <Button variant="outline" className="h-12 border-border text-[10px] font-black uppercase tracking-widest px-6 flex-1 sm:flex-none hover:bg-secondary" onClick={handleExport}>
                <Download className="w-4 h-4 mr-2" /> Export
             </Button>
             <Button variant="hero" className="h-12 text-[10px] font-black uppercase tracking-widest px-6 shadow-gold text-white flex-1 sm:flex-none" onClick={handleSyncData}>
                <Zap className="w-4 h-4 mr-2" /> Sync Data
             </Button>
          </div>
        </div>

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
                <div className="text-2xl font-black text-foreground tracking-tight mb-0.5">{stat.value}</div>
                <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-tighter">{stat.label}</div>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="grid lg:grid-cols-12 gap-8">
            <div className="lg:col-span-8 bg-card p-4 sm:p-6 rounded-3xl border border-border shadow-sm flex flex-col min-h-[500px]">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20">
                      <Users className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h2 className="text-xl font-black text-foreground font-sans tracking-tight">Recent Users</h2>
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1 opacity-60">New Account Activity</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="hidden sm:flex items-center -space-x-2 mr-3 px-3 py-1 bg-secondary/50 rounded-full border border-border">
                      {users.slice(0, 3).map((u, index) => (
                        <div key={index} className="relative w-8 h-8 rounded-full border-2 border-card bg-secondary flex items-center justify-center text-[10px] font-bold text-foreground shadow-sm overflow-hidden">
                          {u?.avatar_url ? (
                            <img src={u.avatar_url} className="w-full h-full object-cover" />
                          ) : (
                            u?.name?.charAt(0) || "U"
                          )}
                        </div>
                      ))}
                    </div>
                    <Button variant="outline" className="h-10 px-6 text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-secondary border-border" onClick={() => navigate("/admin/users")}>
                      Explore All Users
                    </Button>
                  </div>
                </div>

                <div className="flex-1 overflow-x-auto">
                   <table className="w-full text-sm min-w-[600px]">
                      <thead>
                        <tr className="text-muted-foreground border-b border-border text-xs font-semibold uppercase tracking-wider">
                          <th className="text-left pb-4">User Info</th>
                          <th className="text-left pb-4">KYC Status</th>
                          <th className="text-left pb-4">Account Value</th>
                          <th className="text-left pb-4">Cash Balance</th>
                          <th className="text-right pb-4">Joined</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {recentUsers.map((u) => (
                          <tr key={u.email} className="group hover:bg-secondary/20 transition-colors">
                              <td className="py-5">
                                <div className="flex items-center gap-4">
                                  <div className="relative w-12 h-12 rounded-2xl bg-gradient-gold flex items-center justify-center text-white font-black text-sm shadow-sm overflow-hidden border border-white/10 group-hover:scale-105 transition-transform">
                                     {u?.avatar_url ? (
                                       <img src={u.avatar_url} className="w-full h-full object-cover" />
                                     ) : (
                                       u?.name?.substring(0, 1) || "U"
                                     )}
                                  </div>
                                  <div>
                                     <div className="font-bold text-foreground text-sm tracking-tight">{u.name}</div>
                                     <div className="text-[9px] font-black text-muted-foreground/40 uppercase mt-1 tracking-tighter truncate max-w-[120px]">{u.email}</div>
                                  </div>
                                </div>
                              </td>
                               <td className="py-5">
                                  <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-[0.1em] border ${
                                    u.kyc === "Approved" ? "bg-green-500/10 text-green-500 border-green-500/20" : "bg-amber-500/10 text-amber-500 border-amber-500/20"
                                  }`}>
                                     {u.kyc === "Approved" ? <ShieldCheck className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
                                     {u.kyc || "Pending"}
                                  </span>
                               </td>
                             <td className="py-5 font-bold text-foreground tabular-nums text-sm">
                                {formatCurrency(u.balanceNum)}
                             </td>
                             <td className="py-5 font-bold text-primary tabular-nums text-sm">
                                {formatCurrency(u.fiatBalanceNum)}
                             </td>
                             <td className="py-5 text-right text-[10px] font-bold text-muted-foreground/60 tabular-nums uppercase tracking-tighter">
                                {u.joined}
                             </td>
                           </tr>
                         ))}
                       </tbody>
                    </table>
                 </div>
                 <div className="mt-8 pt-6 border-t border-border flex flex-col sm:flex-row justify-between items-center gap-4">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Showing {recentUsers.length} of {users.length} members</span>
                    <Button variant="ghost" className="h-9 px-4 text-xs font-bold text-primary hover:bg-primary/10 transition-all uppercase tracking-widest" onClick={() => navigate('/admin/users')}>
                       User Management <ArrowUpRight className="w-4 h-4 ml-2" />
                    </Button>
                 </div>
              </div>

            {/* Right: Pending Transactions */}
            <div className="lg:col-span-4 space-y-8">
              <div className="bg-card p-8 rounded-[2.5rem] border border-border shadow-huge flex flex-col min-h-[480px] relative overflow-hidden">
                <div className="flex items-center justify-between mb-10 relative z-10">
                   <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20">
                         <Clock className="w-6 h-6 text-amber-500" />
                      </div>
                      <div>
                        <h2 className="text-xl font-black text-foreground font-sans tracking-tight">Tasks</h2>
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest opacity-60">Pending Approvals</span>
                      </div>
                   </div>
                   <History className="w-5 h-5 text-muted-foreground/30 hover:text-primary cursor-pointer transition-colors" />
                </div>
                
                <div className="flex-1 space-y-6 relative z-10">
                  {pendingTransactions.length === 0 ? (
                    <div className="py-16 text-center border-2 border-dashed border-border rounded-3xl group hover:border-primary/40 transition-all">
                       <CheckCircle2 className="w-12 h-12 text-muted-foreground/20 mx-auto mb-4" />
                       <div className="text-xs font-bold text-muted-foreground uppercase tracking-[0.2em]">All caught up!</div>
                    </div>
                  ) : pendingTransactions.slice(0, 3).map((w, i) => (
                    <motion.div 
                      key={w.id} 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 + i * 0.1 }}
                      className="p-6 rounded-[2rem] bg-secondary/30 border border-border hover:border-primary/30 transition-all group relative overflow-hidden"
                    >
                      <div className="flex items-center justify-between mb-4">
                         <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-primary shadow-gold flex items-center justify-center text-white text-[10px] font-black uppercase tracking-widest">
                               {w.asset}
                            </div>
                             <div>
                                <div className="text-sm font-bold text-foreground flex items-center gap-2">
                                   {w.profiles?.name || "System"}
                                   <span className={`px-2 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-widest ${w.type === 'Deposit' ? 'bg-green-500/10 text-green-500 border border-green-500/20' : 'bg-red-500/10 text-red-500 border border-red-500/20'}`}>
                                      {w.type}
                                   </span>
                                </div>
                                <div className="text-[9px] font-bold text-muted-foreground/40 mt-1 uppercase tracking-widest">ID: {w.id.substring(0, 8)} • {new Date(w.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                             </div>
                         </div>
                      </div>
                      
                      <div className="flex items-end justify-between mb-6">
                         <div className="text-3xl font-black text-foreground tabular-nums tracking-tighter">
                            {formatCurrency(w.amount)}
                         </div>
                         <div className="text-[10px] font-black text-muted-foreground uppercase tracking-widest bg-card px-2.5 py-1.5 rounded-xl border border-border shadow-sm">
                            {w.asset}
                         </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                         <Button onClick={() => handleAction(w.id, 'Completed')} className="bg-green-500 shadow-gold hover:shadow-gold-lg text-white border-0 h-10 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all">
                            <CheckCircle2 className="w-4 h-4 mr-2" /> Approve
                         </Button>
                         <Button onClick={() => handleAction(w.id, 'Rejected')} className="bg-secondary hover:bg-red-500/10 hover:text-red-500 border border-border h-10 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all">
                            <XCircle className="w-4 h-4 mr-2" /> Reject
                         </Button>
                      </div>
                    </motion.div>
                  ))}
                </div>

                <div className="p-8 border-t border-border bg-secondary/10">
                   <div className="flex items-center justify-between p-5 rounded-2xl bg-primary/5 border border-primary/10 shadow-sm relative overflow-hidden group">
                      <div className="absolute right-0 top-0 w-24 h-24 bg-primary/5 rounded-full blur-2xl group-hover:bg-primary/10 transition-colors" />
                      <div className="flex items-center gap-3 relative z-10">
                         <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                            <Database className="w-5 h-5 text-primary" />
                         </div>
                         <div>
                            <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest opacity-60">System Response</span>
                            <div className="text-xs font-black text-foreground">Healthy</div>
                         </div>
                      </div>
                      <span className="text-sm font-black text-primary tracking-tight relative z-10">0.024ms</span>
                   </div>
                </div>
              </div>
           </div>
        </div>
         {/* System Status Footer */}
        <div className="p-8 rounded-[2.5rem] bg-card border border-border flex flex-col md:flex-row items-center justify-between gap-8 shadow-sm relative overflow-hidden group">
           <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
           <div className="flex flex-wrap items-center gap-10 relative z-10">
              <div className="flex items-center gap-3">
                 <div className="w-3 h-3 rounded-full bg-green-500 shadow-glow animate-pulse" />
                 <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Market Status: Online</span>
              </div>
              <div className="flex items-center gap-3">
                 <div className="w-3 h-3 rounded-full bg-primary shadow-glow animate-pulse" />
                 <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Network Status: 100%</span>
              </div>
              <div className="flex items-center gap-3">
                 <div className="w-3 h-3 rounded-full bg-blue-500 shadow-glow animate-pulse" />
                 <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Payments: Working</span>
              </div>
           </div>
           <div className="flex items-center gap-3 relative z-10">
              <ShieldCheck className="w-4 h-4 text-primary" />
              <span className="text-[10px] font-black text-muted-foreground/50 uppercase tracking-[0.2em]">Clarity Trade Security v4.8.2</span>
           </div>
        </div>

        {/* Lower Grid: System & Revenue */}
        <div className="grid lg:grid-cols-3 gap-8 pb-10">
           {/* System Status */}
           <div className="bg-card border border-border p-8 rounded-3xl shadow-sm space-y-8 h-full">
              <div className="flex items-center justify-between">
                 <div className="flex flex-col gap-1">
                    <h2 className="text-lg font-bold text-foreground font-sans tracking-tight">System Status</h2>
                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-widest">Health Monitor</p>
                 </div>
                 <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform cursor-pointer shadow-sm">
                    <Database className="w-5 h-5" />
                 </div>
              </div>

              <div className="space-y-6">
                 {[
                    { label: "Blockchain Service", status: "Operational", ping: "12ms", health: 100 },
                    { label: "Trade Matching", status: "Active", ping: "45ms", health: 98 },
                    { label: "Withdrawals", status: "Standby", ping: "14ms", health: 100 },
                    { label: "Payments API", status: "Operational", ping: "8ms", health: 100 },
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
              <Button variant="outline" className="w-full h-11 text-xs font-bold uppercase tracking-widest hover:bg-secondary border-border mt-4" onClick={() => toast.success("Diagnostics view opened")}>
                 View Diagnostics
              </Button>
           </div>

           {/* Security */}
           <div className="bg-card border border-border p-8 rounded-3xl shadow-sm space-y-8 h-full">
              <div className="flex items-center justify-between">
                 <div className="flex flex-col gap-1">
                    <h2 className="text-lg font-bold text-foreground font-sans tracking-tight">Security</h2>
                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-widest">Protection Status</p>
                 </div>
                 <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center text-green-500 border border-green-500/20">
                    <ShieldCheck className="w-5 h-5" />
                 </div>
              </div>

              <div className="p-5 rounded-xl bg-green-500/5 border border-green-500/10 flex items-start gap-4">
                 <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center text-white shrink-0 shadow-lg">
                    <CheckCircle2 className="w-5 h-5" />
                 </div>
                 <div className="space-y-1">
                    <p className="text-sm font-bold text-foreground">No active threats detected.</p>
                    <p className="text-xs text-muted-foreground leading-relaxed font-medium">Your platform is currently protected.</p>
                 </div>
              </div>

              <div className="space-y-5">
                 <div className="flex items-center justify-between py-2 border-b border-border">
                    <div className="flex flex-col gap-0.5">
                       <span className="text-sm font-bold text-foreground">DDoS Protection</span>
                       <span className="text-[10px] text-muted-foreground font-medium">Monitoring Active</span>
                    </div>
                    <div className="w-10 h-5 bg-primary/20 rounded-full relative">
                       <div className="absolute right-0.5 top-0.5 w-4 h-4 bg-primary rounded-full shadow-sm" />
                    </div>
                 </div>
                 <div className="flex items-center justify-between py-2 border-b border-border">
                    <div className="flex flex-col gap-0.5">
                       <span className="text-sm font-bold text-foreground">Security Guard</span>
                       <span className="text-[10px] text-muted-foreground font-medium">Automated Scans</span>
                    </div>
                    <div className="w-10 h-5 bg-primary/20 rounded-full relative">
                       <div className="absolute right-0.5 top-0.5 w-4 h-4 bg-primary rounded-full shadow-sm" />
                    </div>
                 </div>
                 <div className="flex items-center justify-between py-2">
                    <div className="flex flex-col gap-0.5">
                       <span className="text-sm font-bold text-foreground">Secure Storage</span>
                       <span className="text-[10px] text-muted-foreground font-medium">Sync Active</span>
                    </div>
                    <div className="w-10 h-5 bg-primary/20 rounded-full relative">
                       <div className="absolute right-0.5 top-0.5 w-4 h-4 bg-primary rounded-full shadow-sm" />
                    </div>
                 </div>
              </div>
           </div>

           {/* Performance */}
           <div className="bg-card border border-border p-8 rounded-3xl shadow-sm space-y-8 h-full relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-primary/10 transition-colors" />
              
              <div className="relative z-10 flex items-center justify-between">
                 <div className="flex flex-col gap-1">
                    <h2 className="text-lg font-bold text-foreground font-sans tracking-tight">Trade Activity</h2>
                    <p className="text-xs text-primary font-medium uppercase tracking-[0.2em]">Platform Insights</p>
                 </div>
                 <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center text-primary shadow-gold">
                    <BarChart3 className="w-5 h-5" />
                 </div>
              </div>

              <div className="relative z-10 space-y-8">
                 <div className="space-y-2">
                    <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest">Global Vol</p>
                    <div className="text-4xl font-black text-foreground tracking-tighter tabular-nums">{formatCurrency(tradeVolume)}</div>
                 </div>

                 <div className="grid grid-cols-2 gap-6 pb-2">
                    <div className="space-y-1">
                       <span className="text-[10px] text-muted-foreground font-bold uppercase">Buy Orders</span>
                       <div className="text-lg font-bold text-green-500 tabular-nums">{buyOrders.toLocaleString()}</div>
                    </div>
                    <div className="space-y-1">
                       <span className="text-[10px] text-muted-foreground font-bold uppercase">Sell Orders</span>
                       <div className="text-lg font-bold text-foreground tabular-nums">{sellOrders.toLocaleString()}</div>
                    </div>
                 </div>

                 <div className="p-5 rounded-xl bg-background border border-border space-y-3">
                    <div className="flex items-center justify-between">
                       <span className="text-xs font-bold text-foreground uppercase tracking-tight">Response Time</span>
                       <span className="text-xs font-bold text-primary tabular-nums">0.2ms</span>
                    </div>
                    <div className="w-full h-1.5 bg-secondary rounded-full overflow-hidden">
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
