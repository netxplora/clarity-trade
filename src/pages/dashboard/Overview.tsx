import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowUpRight, Wallet, Activity, TrendingUp, BarChart3,
  Users, Search, ChevronRight, LayoutGrid, Gift, Zap, ShieldCheck,
  Layout, ArrowRight, Info, Copy, RefreshCw, Coins, Globe, Loader2,
  ArrowRightLeft
} from "lucide-react";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { useStore } from "@/store/useStore";
import { Button } from "@/components/ui/button";
import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";

const traderAvatar = "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=100&h=100";

const Overview = () => {
  const { user, balance, formatCurrency, fetchAppData: globalFetchSync } = useStore();
  const navigate = useNavigate();
  const [activeTrades, setActiveTrades] = useState<any[]>([]);
  const [copiedTraders, setCopiedTraders] = useState<any[]>([]);
  const [depositWallets, setDepositWallets] = useState<any[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);

  const fetchData = useCallback(async () => {
    if (!user) return;
    try {
      const [{ data: trades }, { data: sessions }, { data: wallets }] = await Promise.all([
        supabase.from('trades').select('*').eq('user_id', user.id).eq('status', 'Open').limit(5),
        supabase.from('active_sessions').select('*').eq('user_id', user.id),
        supabase.from('deposit_wallets').select('*').eq('status', 'Active')
      ]);

      if (trades) setActiveTrades(trades);
      if (sessions) setCopiedTraders(sessions);
      if (wallets) setDepositWallets(wallets);
    } catch (err) {
      console.error("Error fetching overview data:", err);
    }
  }, [user]);

  useEffect(() => {
    fetchData();

    if (!user?.id) return;

    const mainSub = supabase
      .channel('overview-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'trades', filter: `user_id=eq.${user.id}` }, () => fetchData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'active_sessions', filter: `user_id=eq.${user.id}` }, () => fetchData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'deposit_wallets' }, () => fetchData())
      .subscribe();

    return () => {
      supabase.removeChannel(mainSub);
    };
  }, [fetchData, user?.id]);

  const stats = [
    { label: "Total Balance", value: formatCurrency(balance.total), change: "Combined Assets", icon: Wallet, up: true, color: "text-primary" },
    { label: "Main Wallet", value: formatCurrency(balance.available), change: "Fiat Cash", icon: BarChart3, up: true, color: "text-indigo-600" },
    { label: "Trading Balance", value: formatCurrency(balance.invested), change: "Active Pool", icon: TrendingUp, up: true, color: "text-blue-600" },
    { label: "Copy Trading", value: formatCurrency(balance.copyTrading), change: "Social Pool", icon: Users, up: true, color: "text-purple-600" },
    { label: "Crypto Value", value: formatCurrency(user?.cryptoBalanceNum || 0), change: "Digital Assets", icon: Coins, up: true, color: "text-orange-500" },
    { label: "Active Yield", value: formatCurrency(balance.totalProfit), change: "Total PnL", icon: Activity, up: true, color: "text-green-600" },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-8 lg:space-y-12 mb-10">
        {/* Market Marquee */}
        <div className="bg-secondary/30 backdrop-blur-md border border-border rounded-2xl overflow-hidden py-3 mb-6">
          <div className="flex animate-marquee whitespace-nowrap gap-12 px-6">
            {[
              { s: "BTC/USD", p: "65,241.20", c: "+2.4%" },
              { s: "ETH/USD", p: "3,542.80", c: "-1.1%" },
              { s: "XRP/USD", p: "0.6214", c: "+0.3%" },
              { s: "SOL/USD", p: "148.25", c: "+5.8%" },
              { s: "BNB/USD", p: "582.10", c: "-0.5%" },
              { s: "ADA/USD", p: "0.4820", c: "+1.2%" },
              { s: "MATIC/USD", p: "0.9214", c: "+0.8%" },
              { s: "DOT/USD", p: "8.25", c: "+2.1%" }
            ].map((m, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{m.s}</span>
                <span className="text-sm font-bold text-foreground tabular-nums">{m.p}</span>
                <span className={`text-[10px] font-black ${m.c.startsWith('+') ? 'text-green-500' : 'text-red-500'}`}>{m.c}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Welcome Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-2">
          <div>
            <div className="flex items-center gap-2 text-primary mb-2">
               <ShieldCheck className="w-4 h-4 shadow-gold" />
               <span className="text-[10px] font-black tracking-[0.3em] uppercase">Account Secure</span>
            </div>
            <h1 className="text-3xl lg:text-5xl font-black text-foreground tracking-tight leading-none">
              Welcome Back, <span className="text-primary italic">{user?.name?.split(' ')[0] || "Trader"}</span>
            </h1>
            <p className="text-muted-foreground text-sm font-semibold mt-2 max-w-xl opacity-80">
               Ready to trade crypto and manage your portfolio.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 bg-card p-3 rounded-2xl border border-border shadow-huge relative overflow-hidden group">
            <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-start relative z-10">
              <div className="flex flex-col">
                <div className="text-[10px] font-black text-muted-foreground uppercase tracking-widest leading-none">
                  System Status: <span className="text-green-500 animate-pulse">Normal</span>
                </div>
                <div className="text-[9px] font-bold text-muted-foreground/40 mt-1.5 uppercase tracking-tighter">Connected: Server 1</div>
              </div>
              <div className="h-6 w-[px] bg-border hidden sm:block mx-1" />
              <Button 
                variant="hero" 
                size="sm" 
                id="sync-platform-btn"
                disabled={isSyncing}
                onClick={async () => {
                  setIsSyncing(true);
                  await Promise.all([fetchData(), globalFetchSync()]);
                  setTimeout(() => {
                    setIsSyncing(false);
                    toast.success("Accounts Synced", { 
                      description: "Balances and activity are up to date.",
                      duration: 4000
                    });
                  }, 800);
                }}
                className={`h-10 px-6 text-[10px] font-black uppercase tracking-widest shadow-gold rounded-xl transition-all hover:scale-105 active:scale-95 ${isSyncing ? 'animate-spin-slow' : ''}`}
              >
                <RefreshCw className="w-3.5 h-3.5 mr-2" /> Sync Account
              </Button>
            </div>
          </div>
        </div>

        {/* User Defined Wallets Display */}
        {depositWallets.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-6 rounded-3xl bg-secondary/50 border border-border shadow-sm overflow-hidden relative group"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-primary/20 transition-colors" />
            <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-gradient-gold flex items-center justify-center text-white shadow-gold shrink-0">
                  <Wallet className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-foreground text-sm uppercase tracking-wide">Deposit Wallets</h3>
                  <p className="text-xs text-muted-foreground font-medium">Use these addresses to add crypto to your account.</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-4 w-full md:w-auto">
                {depositWallets.slice(0, 3).map((w) => (
                  <div key={w.id} className="flex-1 min-w-[200px] p-3 rounded-xl bg-card border border-border flex items-center justify-between hover:border-primary/30 transition-all cursor-pointer group/item" onClick={() => {
                    window.navigator.clipboard.writeText(w.address);
                    toast.success(`${w.coin} address copied`);
                  }}>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center text-[10px] font-black">{w.coin}</div>
                      <div className="font-mono text-[10px] text-muted-foreground truncate w-24">{w.address}</div>
                    </div>
                    <Copy className="w-3 h-3 text-muted-foreground group-hover/item:text-primary transition-colors" />
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.1 }}
              className="bg-card p-6 rounded-3xl border border-border shadow-sm hover:shadow-md transition-shadow group relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full -mr-12 -mt-12 group-hover:bg-primary/10 transition-colors" />
              <div className="flex items-center justify-between mb-4 relative z-10">
                <div className={`p-3 rounded-2xl bg-secondary ${stat.color} group-hover:scale-110 transition-transform`}>
                  <stat.icon className="w-5 h-5" />
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest leading-none">{stat.change}</span>
                  {stat.up && <ArrowUpRight className="w-3 h-3 text-green-500 mt-1" />}
                </div>
              </div>
              <div className="relative z-10">
                <div className="text-2xl font-black text-foreground tracking-tight mb-0.5">{stat.value}</div>
                <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-tighter">{stat.label}</div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Dynamic Panels */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Active Trades */}
          <div className="lg:col-span-8 bg-card p-4 sm:p-6 rounded-3xl border border-border shadow-sm flex flex-col min-h-[500px]">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
              <h2 className="text-xl font-bold font-sans text-foreground">Recent Activity</h2>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <div className="relative flex-1 sm:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input className="h-10 pl-9 pr-4 bg-secondary border border-border rounded-xl text-xs font-semibold w-full focus:border-primary/50 transition-all outline-none" placeholder="Search pair..." />
                </div>
                <Button variant="outline" size="icon" className="h-10 w-10 border-border bg-secondary shrink-0"><LayoutGrid className="w-4 h-4" /></Button>
              </div>
            </div>

            <div className="flex-1 overflow-x-auto">
              <table className="w-full text-sm min-w-[600px]">
                <thead>
                  <tr className="text-muted-foreground border-b border-border text-xs font-semibold uppercase tracking-wider">
                    <th className="text-left pb-4">Asset</th>
                    <th className="text-left pb-4">Type</th>
                    <th className="text-left pb-4">Amount</th>
                    <th className="text-left pb-4">P&L</th>
                    <th className="text-right pb-4">Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {activeTrades.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-20 text-center">
                        <div className="flex flex-col items-center text-muted-foreground">
                          <Activity className="w-10 h-10 mb-3 opacity-20" />
                          <p className="text-sm font-semibold uppercase tracking-widest opacity-40">No recent activity detected.</p>
                        </div>
                      </td>
                    </tr>
                  ) : activeTrades.map((trade, i) => (
                    <tr key={trade.id} className="group/row hover:bg-secondary/30 transition-colors">
                      <td className="py-5">
                        <div className="font-bold text-foreground text-sm tracking-tight flex items-center gap-2">
                          {trade.pair}
                        </div>
                        <div className="text-[9px] font-black text-muted-foreground/40 uppercase mt-1 tracking-tighter">ID: {trade.id?.substring(0, 12)}</div>
                      </td>
                      <td className="py-5">
                        <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-[0.1em] border ${trade.type === "Buy" || trade.type === "Long" ? "bg-green-500/10 text-green-500 border-green-500/20" : "bg-red-500/10 text-red-500 border-red-500/20"
                          }`}>
                          {trade.type}
                        </span>
                      </td>
                      <td className="py-5 font-bold text-foreground tabular-nums text-sm">{formatCurrency(trade.amount)}</td>
                      <td className="py-5 font-bold tabular-nums">
                        <div className={`flex items-center gap-1.5 text-sm ${ (trade.pnl || 0) >= 0 ? "text-green-500" : "text-red-500"}`}>
                          { (trade.pnl || 0) >= 0 ? "+" : ""}{formatCurrency(trade.pnl || 0)}
                        </div>
                      </td>
                      <td className="py-5 text-right text-[10px] font-bold text-muted-foreground/60 tabular-nums uppercase tracking-tighter">
                        {new Date(trade.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-8 pt-6 border-t border-border flex flex-col sm:flex-row justify-between items-center gap-4">
              <div className="flex items-center gap-2 text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] opacity-40">
                 <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                 System: Optimal
              </div>
              <Button variant="ghost" className="h-9 px-4 text-xs font-bold text-primary hover:bg-primary/10 transition-all uppercase tracking-widest" asChild>
                <Link to="/dashboard/trading">Start Trading <ArrowRight className="w-3 h-3 ml-2" /></Link>
              </Button>
            </div>
          </div>

          {/* Active Portfolios & Yield Forecast */}
          <div className="lg:col-span-4 space-y-8">
            <div className="bg-card p-8 rounded-[2.5rem] border border-border shadow-huge flex flex-col min-h-[480px] relative overflow-hidden">
               <div className="absolute top-0 right-0 p-8 opacity-[0.02] pointer-events-none">
                  <Activity className="w-48 h-48 rotate-12" />
               </div>
              <div className="flex items-center justify-between mb-10 relative z-10">
                <h2 className="text-xl font-black font-sans text-foreground tracking-tight">Copy Trading</h2>
                <Link to="/dashboard/copy-trading" className="text-[10px] font-black text-primary hover:underline group flex items-center gap-1.5 uppercase tracking-widest">View All <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" /></Link>
              </div>

              <div className="flex-1 space-y-6 relative z-10">
                {copiedTraders.length === 0 ? (
                  <div className="py-16 text-center border-2 border-dashed border-border rounded-3xl group hover:border-primary/40 transition-all cursor-pointer">
                    <Users className="w-12 h-12 mx-auto mb-5 text-muted-foreground/20 group-hover:text-primary/40 transition-colors" />
                    <p className="text-xs font-bold text-muted-foreground/60 uppercase tracking-widest leading-loose">No Active Sessions.<br />Follow top traders to copy their strategies.</p>
                  </div>
                ) : copiedTraders.map((trader) => {
                  const pnlNum = trader.pnl || 0;
                  const roi = trader.allocated_amount > 0 ? (pnlNum / trader.allocated_amount * 100).toFixed(2) : "0.00";
                  return (
                    <div key={trader.id} className="flex items-center justify-between p-5 rounded-2xl bg-secondary/50 border border-border hover:border-primary/30 transition-all group shadow-sm">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl overflow-hidden shadow-huge relative border-2 border-background shrink-0">
                          <img src={trader.avatar || traderAvatar} alt="Trader" className="w-full h-full object-cover" />
                          <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-white rounded-full shadow-sm" />
                        </div>
                        <div className="min-w-0">
                          <div className="font-bold text-sm text-foreground truncate">{trader.trader_name}</div>
                          <div className="text-[10px] text-muted-foreground font-black mt-1 uppercase tracking-tighter opacity-60 tabular-nums">
                            {formatCurrency(trader.allocated_amount)} EQU
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`text-lg font-black tabular-nums transition-colors ${pnlNum >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                           {pnlNum >= 0 ? '+' : ''}{roi}%
                        </div>
                        <div className={`text-[9px] font-black uppercase tracking-widest mt-1 ${pnlNum >= 0 ? 'text-green-500/60' : 'text-red-500/60'}`}>
                          {pnlNum >= 0 ? '+' : ''}{formatCurrency(pnlNum)}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-6 pt-4 border-t border-border">
                <Button variant="hero" className="w-full h-12 rounded-xl text-white font-semibold text-sm shadow-gold" asChild>
                  <Link to="/dashboard/copy-trading">
                    Browse Top Traders
                  </Link>
                </Button>
              </div>
            </div>

          {/* Yield Forecast Small Card */}
            <div className="bg-[#1a1510] p-8 rounded-[2rem] border border-primary/20 shadow-2xl overflow-hidden relative group cursor-pointer hover:border-primary/50 transition-all">
              <div className="absolute top-0 right-0 w-48 h-48 bg-primary/10 rounded-full blur-[100px] -mr-24 -mt-24 group-hover:bg-primary/20 transition-all duration-700" />
              <div className="relative z-10 flex items-center justify-between mb-8">
                <div className="flex flex-col gap-1">
                  <h2 className="text-xl font-bold text-white font-sans tracking-tight">Yield Forecast</h2>
                  <div className="flex items-center gap-2">
                     <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse shadow-gold" />
                     <p className="text-[9px] text-primary/60 font-black uppercase tracking-[0.2em]">Forecast</p>
                  </div>
                </div>
                <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center group-hover:rotate-12 transition-transform">
                   <BarChart3 className="w-5 h-5 text-primary shadow-glow" />
                </div>
              </div>
              <div className="relative z-10 space-y-6">
                <div className="flex items-end justify-between gap-2 h-24 px-1">
                  {[30, 45, 60, 40, 80, 50, 95, 75].map((h, i) => (
                    <motion.div
                      key={i}
                      initial={{ height: 0 }}
                      animate={{ height: `${h}%` }}
                      transition={{ delay: 0.5 + i * 0.05, type: "spring", stiffness: 100 }}
                      className={`w-full rounded-t-lg transition-all duration-500 ${i === 6 ? 'bg-primary shadow-gold' : 'bg-white/5 group-hover:bg-white/10'}`}
                    />
                  ))}
                </div>
                <div className="pt-4 border-t border-white/5 flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="text-[10px] font-black text-white/30 uppercase tracking-widest">Estimated Monthly Return</div>
                    <div className="text-2xl font-black text-white tabular-nums tracking-tighter">+14.28%</div>
                  </div>
                  <div className="text-right">
                     <div className="text-[10px] font-black text-primary uppercase tracking-widest">Accuracy</div>
                     <div className="text-xs font-bold text-white/50">High</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Global Referral CTA */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="relative overflow-hidden bg-gradient-gold p-1 rounded-3xl group shadow-gold"
        >
          <div className="bg-[#1a1510] rounded-[22px] p-8 flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="flex items-center gap-6">
              <div className="w-16 h-16 rounded-2xl bg-primary/20 flex items-center justify-center border border-primary/20 shrink-0">
                <Gift className="w-8 h-8 text-primary shadow-glow" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-white mb-1">Refer your friends, <span className="text-primary italic">earn lifetime rewards.</span></h3>
                <p className="text-white/50 text-sm font-medium">Get 10% commission on every trading execution from your invited network.</p>
              </div>
            </div>
            <div className="flex items-center gap-4 w-full md:w-auto">
              <div className="flex-1 md:w-48 h-12 bg-white/5 border border-white/10 rounded-xl flex items-center px-4 font-mono text-sm text-primary font-bold">
                {user?.referralCode || "USER_REF"}
              </div>
              <Button
                className="h-12 px-8 rounded-xl bg-primary text-white font-bold uppercase tracking-wider hover:bg-primary/80 transition-all shadow-glow shrink-0"
                onClick={() => navigate("/dashboard/referrals")}
              >
                Get Started <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
          {/* Decorative Elements */}
          <div className="absolute -right-20 -top-20 w-64 h-64 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -left-20 -bottom-20 w-64 h-64 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
        </motion.div>

        {/* Quick Stats */}
        <div className="grid md:grid-cols-3 gap-8 pb-12">
            {/* Quick Access Grid */}
            <div className="bg-card border border-border p-8 rounded-3xl shadow-sm flex flex-col justify-between group">
              <div>
                <h3 className="text-lg font-bold text-foreground mb-6 flex items-center gap-3">
                  <Layout className="w-5 h-5 text-primary" /> Quick Links
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { icon: Wallet, label: "Deposit", path: "/dashboard/wallet?tab=deposit", color: "text-green-600", bg: "bg-green-50 border-green-100" },
                    { icon: ArrowRightLeft, label: "Transfer", path: "/dashboard/wallet?tab=transfer", color: "text-blue-600", bg: "bg-blue-50 border-blue-100" },
                    { icon: RefreshCw, label: "Swap", path: "/dashboard/wallet?tab=convert", color: "text-orange-600", bg: "bg-orange-50 border-orange-100" },
                    { icon: ArrowUpRight, label: "Withdraw", path: "/dashboard/wallet?tab=withdraw", color: "text-amber-600", bg: "bg-amber-50 border-amber-100" },
                    { icon: Gift, label: "Referrals", path: "/dashboard/referrals", color: "text-pink-600", bg: "bg-pink-50 border-pink-100" },
                    { icon: ShieldCheck, label: "Security", path: "/dashboard/settings", color: "text-purple-600", bg: "bg-purple-50 border-purple-100" }
                  ].map((card) => (
                    <Link key={card.label} to={card.path} className={`p-4 rounded-2xl border ${card.bg} flex flex-col items-center gap-2 hover:scale-105 transition-all shadow-sm group/card hover:shadow-md`}>
                      <div className={`w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-sm group-hover/card:shadow-md transition-shadow`}>
                        <card.icon className={`w-5 h-5 ${card.color}`} />
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-tighter text-muted-foreground/60">{card.label}</span>
                    </Link>
                  ))}
                </div>
              </div>

              <div className="mt-8 p-8 rounded-[2rem] bg-gradient-to-br from-primary/10 to-transparent border border-primary/20 space-y-4">
                 <div className="flex items-center gap-3">
                    <Zap className="w-5 h-5 text-primary animate-pulse" />
                    <span className="text-xs font-black text-foreground uppercase tracking-widest">Growth Engine</span>
                 </div>
                 <p className="text-[11px] text-muted-foreground font-medium leading-relaxed">
                    Optimize your capital by utilizing our advanced trading algorithms and copy-trading features. 
                    Manage all assets in your <Link to="/dashboard/wallet" className="text-primary hover:underline">Unified Wallet</Link>.
                 </p>
                 <Button variant="hero" className="w-full h-11 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-gold" asChild>
                    <Link to="/dashboard/wallet">Visit Wallet</Link>
                 </Button>
              </div>
            </div>

          <div className="bg-card border border-border p-8 rounded-3xl shadow-sm space-y-8">
            <h3 className="text-lg font-bold text-foreground flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Zap className="w-5 h-5 text-primary" /> Live Updates
              </div>
              <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-red-50 text-red-600 border border-red-100 text-[9px] font-black">
                <Activity className="w-3 h-3 animate-pulse" /> LIVE
              </div>
            </h3>
            <div className="space-y-6">
              {[
                { text: "US Consumer Price Index data released higher than expected.", time: "2m ago", type: "Economy" },
                { text: "Institutional inflow of $1.2B detected in BTC spot ETFs.", time: "15m ago", type: "Crypto" },
                { text: "Ethereum network update completed successfully.", time: "1h ago", type: "Dev" }
              ].map((news, i) => (
                <div key={i} className="flex gap-4 group cursor-pointer pb-6 border-b border-border last:border-0 last:pb-0">
                  <div className="flex flex-col items-center gap-2 pt-1">
                    <span className="text-[9px] font-black text-muted-foreground/30 uppercase tracking-[0.2em] transform -rotate-90 origin-center whitespace-nowrap mb-4">{news.time}</span>
                  </div>
                  <div className="space-y-1.5">
                    <div className="text-[10px] font-bold text-primary uppercase tracking-[0.15em]">{news.type}</div>
                    <p className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-all leading-relaxed line-clamp-2">{news.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-card border border-border p-8 rounded-3xl shadow-sm flex flex-col justify-between">
            <div>
              <h3 className="text-lg font-bold text-foreground mb-6 flex items-center gap-3">
                <ShieldCheck className="w-5 h-5 text-primary" /> Security
              </h3>
              <div className="bg-secondary/30 p-6 rounded-2xl border border-border mb-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="text-[10px] font-bold text-primary uppercase tracking-widest">2FA STATUS</div>
                  <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]" />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-foreground">Advanced Protection</span>
                  <span className="text-[10px] font-black text-green-600 bg-green-50 px-2 py-0.5 rounded-full border border-green-100">VERIFIED</span>
                </div>
              </div>

              <p className="text-xs text-muted-foreground leading-relaxed font-medium mb-6">
                Your assets are secured by cold storage multi-signature wallets and monitored 24/7 by our security team.
              </p>
            </div>

            <Button variant="outline" className="w-full justify-between h-12 border-border bg-card rounded-2xl text-[10px] font-extrabold uppercase tracking-[0.15em] hover:bg-secondary hover:border-primary/30 group">
              View Security Settings <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Overview;
