import { motion } from "framer-motion";
import {
  ArrowUpRight, Wallet, Activity, TrendingUp, BarChart3,
  Users, Gift, ArrowRight, ShieldCheck, Search, LayoutGrid
} from "lucide-react";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { useStore } from "@/store/useStore";
import { Button } from "@/components/ui/button";
import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";

const traderAvatar = "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=100&h=100";

const Overview = () => {
  const { user, balance, formatCurrency, activeTrades, activeSessions, transactions, tradeHistory } = useStore();
  const navigate = useNavigate();

  // Aggregate all activity types (Trades, Transactions, Sessions)
  const combinedActivity = [
    ...transactions.map(t => ({
      id: t.id,
      pair: t.asset || 'Cash',
      type: t.type, // Deposit, Withdrawal, etc.
      amount: t.amount,
      pnl: null,
      created_at: t.created_at,
      status: t.status,
      isTransaction: true,
      isTrade: false
    })),
    ...activeTrades.map(t => ({
      id: t.id,
      pair: t.pair || t.asset,
      type: t.type, // Buy/Sell
      amount: t.amount,
      pnl: t.pnl,
      created_at: t.created_at,
      status: t.status,
      isTransaction: false,
      isTrade: true
    })),
    ...tradeHistory.filter(t => t.status === 'Closed').map(t => ({
      id: t.id,
      pair: t.pair || t.asset,
      type: t.type,
      amount: t.amount,
      pnl: t.pnl,
      created_at: t.created_at,
      status: t.status,
      isTransaction: false,
      isTrade: true
    }))
  ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
   .slice(0, 10);

  const [filterQuery, setFilterQuery] = useState("");

  const filteredActivity = combinedActivity.filter(item => 
    item.pair.toLowerCase().includes(filterQuery.toLowerCase()) || 
    item.type.toLowerCase().includes(filterQuery.toLowerCase())
  );

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
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-4">
          <div className="relative group">
            <div className="flex items-center gap-2 text-primary mb-3">
               <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse shadow-glow-gold" />
               <span className="text-[10px] font-black tracking-[0.4em] uppercase opacity-70">Platform Status: Online</span>
            </div>
            <h1 className="text-4xl lg:text-6xl font-black text-foreground tracking-tight leading-[0.9] flex flex-col">
              <span className="opacity-40 font-bold text-2xl lg:text-3xl mb-1">Portfolio Overview</span>
              <span>Welcome Back, <span className="text-primary italic font-serif pr-2">{user?.name?.split(' ')[0] || "Trader"}</span></span>
            </h1>
            <p className="text-muted-foreground text-sm font-semibold mt-4 max-w-xl opacity-60 leading-relaxed">
               Monitor global market positions, equity performance, and automated copy-trading sessions in real-time.
            </p>
          </div>
          <div className="flex items-center gap-3">
             <Button variant="outline" className="h-14 px-8 rounded-2xl border-border bg-card/50 font-bold uppercase tracking-widest text-[10px] hover:border-primary/50 transition-all" onClick={() => navigate("/dashboard/wallet")}>
                Deposit
             </Button>
             <Button variant="hero" className="h-14 px-8 rounded-2xl shadow-gold font-bold uppercase tracking-widest text-[10px]" onClick={() => navigate("/dashboard/trading")}>
                Trade Now
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
              transition={{ delay: i * 0.1, duration: 0.5, ease: "circOut" }}
              className="bg-card p-8 rounded-[2rem] border border-border shadow-huge hover:border-primary/30 transition-all group relative overflow-hidden ring-1 ring-border/5"
            >
              <div className="absolute -top-10 -right-10 w-32 h-32 bg-primary/5 rounded-full blur-3xl group-hover:bg-primary/20 transition-all duration-700" />
              <div className="flex items-center justify-between mb-6 relative z-10">
                <div className={`p-4 rounded-2xl bg-secondary ${stat.color} group-hover:scale-110 transition-all duration-500 shadow-sm`}>
                  <stat.icon className="w-6 h-6" />
                </div>
                <div className="flex flex-col items-end">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-black text-muted-foreground/40 uppercase tracking-widest leading-none">{stat.change}</span>
                    <ArrowUpRight className="w-3.5 h-3.5 text-green-500/60" />
                  </div>
                </div>
              </div>
              <div className="relative z-10">
                <div className="text-3xl font-black text-foreground tracking-tighter mb-1.5 tabular-nums drop-shadow-sm">{stat.value}</div>
                <div className="text-[10px] font-black text-muted-foreground/30 uppercase tracking-[0.2em]">{stat.label}</div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Dynamic Panels */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Recent Activity Ledger */}
          <div className="lg:col-span-8 bg-card p-6 sm:p-10 rounded-[2.5rem] border border-border shadow-huge flex flex-col min-h-[550px] relative overflow-hidden group/panel">
            <div className="absolute top-0 right-0 p-10 opacity-[0.01] pointer-events-none group-hover/panel:opacity-[0.03] transition-opacity">
               <Activity className="w-64 h-64 rotate-12" />
            </div>
            
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-10 gap-6 relative z-10">
              <div>
                <h2 className="text-2xl font-black text-foreground tracking-tight mb-1">Activity History</h2>
                <span className="text-[10px] font-bold text-muted-foreground/40 uppercase tracking-widest leading-none">Recent transactions</span>
              </div>
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <div className="relative flex-1 sm:w-64">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input 
                    className="h-12 pl-12 pr-4 bg-secondary/50 border border-border rounded-xl text-xs font-bold w-full focus:border-primary/50 transition-all outline-none placeholder:opacity-50" 
                    placeholder="Filter records..." 
                    value={filterQuery}
                    onChange={(e) => setFilterQuery(e.target.value)}
                  />
                </div>
                <Button variant="outline" size="icon" className="h-12 w-12 border-border bg-secondary shrink-0 rounded-xl"><LayoutGrid className="w-4 h-4" /></Button>
              </div>
            </div>

            <div className="flex-1 overflow-x-auto relative z-10 custom-scrollbar">
              <table className="w-full text-sm min-w-[700px]">
                <thead>
                  <tr className="text-muted-foreground/30 border-b border-border/50 text-[10px] font-black uppercase tracking-[0.2em]">
                    <th className="text-left pb-6">Event / Asset</th>
                    <th className="text-left pb-6">Category</th>
                    <th className="text-left pb-6">Value</th>
                    <th className="text-left pb-6">Result</th>
                    <th className="text-right pb-6">Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/20">
                  {filteredActivity.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-24 text-center">
                        <div className="flex flex-col items-center text-muted-foreground">
                          <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mb-6 opacity-40">
                             <Activity className="w-8 h-8" />
                          </div>
                          <p className="text-xs font-black uppercase tracking-[0.2em] opacity-40">No recent activity in your history.</p>
                          <Button variant="link" className="mt-4 text-primary font-bold text-[10px] uppercase tracking-widest" onClick={() => navigate("/dashboard/trading")}>Start Trading Now <ArrowRight className="w-3 h-3 ml-2" /></Button>
                        </div>
                      </td>
                    </tr>
                  ) : combinedActivity.map((item, i) => {
                    const isTransaction = item.isTransaction;
                    const isWin = item.pnl !== null && (item.pnl || 0) >= 0;
                    const isLoss = item.pnl !== null && (item.pnl || 0) < 0;
                    
                    return (
                      <tr key={`${item.id}-${i}`} className="group/row hover:bg-primary/[0.02] transition-colors">
                        <td className="py-6">
                          <div className="font-black text-foreground text-base tracking-tighter flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center border border-border group-hover/row:border-primary/30 transition-colors">
                               {isTransaction ? <Wallet className="w-4 h-4 opacity-50" /> : <BarChart3 className="w-4 h-4 opacity-50" />}
                            </div>
                            <div className="flex flex-col">
                              <span>{item.pair}</span>
                              <span className="text-[9px] font-black text-muted-foreground/30 uppercase tracking-tighter font-mono whitespace-nowrap">ID: {item.id?.substring(0, 10)}</span>
                            </div>
                          </div>
                        </td>
                        <td className="py-6">
                          <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-[0.1em] border flex items-center w-fit gap-1.5 ${
                            isTransaction 
                              ? "bg-blue-500/10 text-blue-500 border-blue-500/20" 
                              : item.type === "Buy" || item.type === "Long" 
                                ? "bg-green-500/10 text-green-500 border-green-500/20 shadow-glow-win" 
                                : "bg-red-500/10 text-red-500 border-red-500/20 shadow-glow-loss"
                            }`}>
                            <div className={`w-1 h-1 rounded-full ${
                              isTransaction ? "bg-blue-500" : item.type === "Buy" || item.type === "Long" ? "bg-green-500" : "bg-red-500"
                            }`} />
                            {isTransaction ? `${item.type}` : item.type}
                          </span>
                        </td>
                        <td className="py-6 font-black text-foreground tabular-nums text-sm font-mono tracking-tight">
                          {formatCurrency(item.amount)}
                        </td>
                        <td className="py-6 font-black tabular-nums">
                          {item.pnl !== null ? (
                            <div className={`flex items-center gap-1.5 text-sm font-mono ${isWin ? "text-green-500" : "text-red-500"}`}>
                              {isWin ? "+" : ""}{formatCurrency(item.pnl || 0)}
                            </div>
                          ) : (
                            <div className={`text-[10px] font-black uppercase tracking-widest ${item.status === 'Completed' || item.status === 'approved' ? 'text-green-500/50' : 'text-amber-500/50'}`}>
                              {item.status || 'Processed'}
                            </div>
                          )}
                        </td>
                        <td className="py-6 text-right text-[10px] font-black text-muted-foreground/50 tabular-nums uppercase tracking-tighter font-mono">
                          {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          <div className="text-[8px] opacity-40">{new Date(item.created_at).toLocaleDateString([], { day: '2-digit', month: 'short' })}</div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="mt-8 pt-6 border-t border-border/50 flex flex-col sm:flex-row justify-between items-center gap-4 relative z-10">
              <span className="text-[10px] font-bold text-muted-foreground/30 uppercase tracking-widest">Live Market Data: Active</span>
              <Button variant="ghost" className="h-10 px-6 text-[10px] font-black text-primary hover:bg-primary/10 transition-all uppercase tracking-[0.2em]" asChild>
                <Link to="/dashboard/trading">Go to Trading Platform <ArrowRight className="w-3.5 h-3.5 ml-2" /></Link>
              </Button>
            </div>
          </div>

          {/* Active Portfolios & Profit Forecast */}
          <div className="lg:col-span-4 space-y-8">
            <div className="bg-card p-10 rounded-[2.5rem] border border-border shadow-huge flex flex-col min-h-[550px] relative overflow-hidden group/session">
               <div className="absolute -bottom-10 -left-10 w-48 h-48 bg-primary/5 rounded-full blur-3xl group-hover/session:bg-primary/10 transition-all duration-700" />
               
              <div className="flex items-center justify-between mb-10 relative z-10">
                <div>
                  <h2 className="text-xl font-black text-foreground tracking-tight mb-1">Copy Trading</h2>
                  <span className="text-[10px] font-bold text-muted-foreground/40 uppercase tracking-widest leading-none">Active Traders</span>
                </div>
                <Link to="/dashboard/copy-trading" className="w-10 h-10 rounded-xl bg-secondary border border-border flex items-center justify-center hover:border-primary/50 transition-all group/arrow">
                   <ArrowUpRight className="w-4 h-4 text-muted-foreground group-hover/arrow:text-primary transition-colors" />
                </Link>
              </div>

              <div className="flex-1 space-y-5 relative z-10">
                {activeSessions.length === 0 ? (
                   <div className="py-24 text-center border-2 border-dashed border-border/10 rounded-[2rem] group/empty hover:border-primary/20 transition-all cursor-pointer bg-secondary/5">
                    <Users className="w-16 h-16 mx-auto mb-6 text-muted-foreground/10 group-hover/empty:text-primary/20 transition-colors duration-500" />
                    <p className="text-xs font-black text-muted-foreground/40 uppercase tracking-[0.2em] leading-loose px-4">No active copy trading sessions.<br />Follow traders to copy their positions.</p>
                  </div>
                ) : activeSessions.map((trader) => {
                  const pnlNum = trader.pnl || 0;
                  const roi = trader.allocated_amount > 0 ? (pnlNum / trader.allocated_amount * 100).toFixed(2) : "0.00";
                  return (
                    <div key={trader.id} className="flex items-center justify-between p-6 rounded-2xl bg-secondary/30 border border-border/50 hover:border-primary/40 transition-all group/card shadow-sm hover:translate-y-[-2px]">
                      <div className="flex items-center gap-5">
                        <div className="w-14 h-14 rounded-2xl overflow-hidden shadow-huge relative border-2 border-background shrink-0">
                          <img src={trader.avatar || traderAvatar} alt="Trader" className="w-full h-full object-cover transition-transform duration-700 group-hover/card:scale-110" />
                          <div className="absolute bottom-[-2px] right-[-2px] w-4.5 h-4.5 bg-green-500 border-[3px] border-background rounded-full shadow-sm" />
                        </div>
                        <div className="min-w-0">
                          <div className="font-black text-sm text-foreground tracking-tight truncate">{trader.trader_name}</div>
                          <div className="flex items-center gap-2 mt-1">
                             <div className="h-1.5 w-1.5 rounded-full bg-primary/40 animate-pulse" />
                             <div className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest opacity-60 tabular-nums">
                               {formatCurrency(trader.allocated_amount)}
                             </div>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`text-xl font-black tabular-nums tracking-tighter ${pnlNum >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                           {pnlNum >= 0 ? '+' : ''}{roi}%
                        </div>
                        <div className={`text-[10px] font-black uppercase tracking-tighter font-mono mt-1 ${pnlNum >= 0 ? 'text-green-500/60' : 'text-red-500/60'}`}>
                          {pnlNum >= 0 ? '+' : ''}{formatCurrency(pnlNum)}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-8 pt-6 border-t border-border/50 relative z-10">
                <Button variant="hero" className="w-full h-14 rounded-2xl text-white font-black uppercase tracking-[0.2em] text-[10px] shadow-gold-huge hov-scale" asChild>
                  <Link to="/dashboard/copy-trading">
                    View All Traders
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
