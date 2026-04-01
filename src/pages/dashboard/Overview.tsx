import { motion } from "framer-motion";
import {
  ArrowUpRight, Wallet, Activity, TrendingUp, BarChart3,
  Users, Gift, ArrowRight, ShieldCheck, Search
} from "lucide-react";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { useStore } from "@/store/useStore";
import { Button } from "@/components/ui/button";
import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";

const traderAvatar = "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=100&h=100";

const Overview = () => {
  const { user, balance, formatCurrency } = useStore();
  const navigate = useNavigate();
  const [activeTrades, setActiveTrades] = useState<any[]>([]);
  const [copiedTraders, setCopiedTraders] = useState<any[]>([]);

  const fetchData = useCallback(async () => {
    if (!user) return;
    try {
      const [{ data: trades }, { data: sessions }] = await Promise.all([
        supabase.from('trades').select('*').eq('user_id', user.id).eq('status', 'Open').limit(5),
        supabase.from('active_sessions').select('*').eq('user_id', user.id)
      ]);

      if (trades) setActiveTrades(trades);
      if (sessions) setCopiedTraders(sessions);
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
      .subscribe();

    return () => {
      supabase.removeChannel(mainSub);
    };
  }, [fetchData, user?.id]);

  const stats = [
    { label: "Total Balance", value: formatCurrency(balance.total), change: "Combined Assets", icon: Wallet, up: true, color: "text-primary" },
    { label: "Main Wallet", value: formatCurrency(balance.available), change: "Fiat Cash", icon: BarChart3, up: true, color: "text-indigo-600" },
    { label: "Trading Balance", value: formatCurrency(balance.invested), change: "Active Allocation", icon: TrendingUp, up: true, color: "text-blue-600" },
    { label: "Copy Trading", value: formatCurrency(balance.copyTrading), change: "Copied Assets", icon: Users, up: true, color: "text-purple-600" },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-8 lg:space-y-12 mb-10">


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
        </div>


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
              <div />
              <Button variant="ghost" className="h-9 px-4 text-xs font-bold text-primary hover:bg-primary/10 transition-all uppercase tracking-widest" asChild>
                <Link to="/dashboard/trading">Start Trading <ArrowRight className="w-3 h-3 ml-2" /></Link>
              </Button>
            </div>
          </div>

          {/* Active Portfolios & Profit Forecast */}
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


          </div>
        </div>

        {/* Global Referral CTA */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="relative overflow-hidden bg-primary/5 border border-primary/20 p-8 rounded-3xl group shadow-sm"
        >
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="flex items-center gap-6">
              <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center shrink-0">
                <Gift className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-foreground mb-1">Refer & Earn Rewards</h3>
                <p className="text-muted-foreground text-sm">Get 10% commission on every trade from your invited network.</p>
              </div>
            </div>
            <div className="flex items-center gap-4 w-full md:w-auto">
              <div className="flex-1 md:w-48 h-11 bg-card border border-border rounded-xl flex items-center px-4 font-mono text-xs text-primary font-bold">
                {user?.referralCode || "USER_REF"}
              </div>
              <Button
                className="h-11 px-6 rounded-xl bg-primary text-white font-bold uppercase tracking-wider text-xs"
                onClick={() => navigate("/dashboard/referrals")}
              >
                Invite Friends
              </Button>
            </div>
          </div>
        </motion.div>

      </div>
    </DashboardLayout>
  );
};

export default Overview;
