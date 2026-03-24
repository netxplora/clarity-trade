import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { Button } from "@/components/ui/button";
import {
  Star,
  Search,
  Users,
  XCircle,
  TrendingUp,
  AlertCircle,
  Pause,
  Play,
  RotateCcw,
  Loader2,
  ShieldCheck,
  Target,
  ArrowUpRight,
  UserCheck,
  Activity,
  Globe,
  Coins
} from "lucide-react";
import { toast } from "sonner";
import { useStore } from "@/store/useStore";
import { supabase } from "@/lib/supabase";

type Filter = "all" | "low" | "medium" | "high";

const traderAvatar = "https://images.unsplash.com/photo-1560250097-0b93528c311a?q=80&w=256&auto=format&fit=crop";

const CopyTradingPage = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [selectedTrader, setSelectedTrader] = useState<string | null>(null);
  const [copyAmount, setCopyAmount] = useState("");
  
  const { balance, user, formatCurrency } = useStore();
  const [traders, setTraders] = useState<any[]>([]);
  const [activeSessions, setActiveSessions] = useState<any[]>([]);
  const [isConfirming, setIsConfirming] = useState(false);
  const [isProcessing, setIsProcessing] = useState<string | boolean>(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const fetchDashboardData = useCallback(async () => {
    if (!user?.id) return;
    try {
        const [tradersRes, sessionsRes] = await Promise.all([
            supabase.from('copy_traders').select('*').order('followers', { ascending: false }),
            supabase.from('active_sessions').select('*').eq('user_id', user.id).neq('status', 'stopped')
        ]);
            
        if (tradersRes.data) {
            setTraders(tradersRes.data);
        }

        if (sessionsRes.data) {
            const mapped = sessionsRes.data.map(dbCt => ({
               id: dbCt.id,
               userId: dbCt.user_id,
               traderId: dbCt.trader_id,
               traderName: dbCt.trader_name,
               allocated_amount: Number(dbCt.allocated_amount),
               current_value: Number(dbCt.current_value),
               pnl: Number(dbCt.pnl),
               status: dbCt.status
            }));
            setActiveSessions(mapped);
        }
    } catch (err) {
        console.error("Dashboard Sync Error:", err);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 10000);

    // High-Frequency Visual Simulation Loop (Frontend Only)
    const visualSimulation = setInterval(() => {
        setActiveSessions(prevSessions => prevSessions.map(session => {
            if (session.status !== 'active') return session;
            const microFluctuation = (Math.random() - 0.48) * (session.allocated_amount * 0.0004);
            return {
                ...session,
                pnl: session.pnl + microFluctuation,
                current_value: session.current_value + microFluctuation
            };
        }));
    }, 1500);

    // Persistence Simulation Engine (Backend Sync)
    const dbSimulation = setInterval(async () => {
        if (!user?.id) return;
        
        // Fetch fresh copy to avoid stale closure state
        const { data } = await supabase.from('active_sessions').select('*').eq('user_id', user.id).eq('status', 'active');
        if (!data || data.length === 0) return;

        for (const session of data) {
            const macroFluctuation = (Math.random() - 0.45) * (Number(session.allocated_amount) * 0.002);
            await supabase.from('active_sessions').update({
                pnl: Number(session.pnl) + macroFluctuation,
                current_value: Number(session.allocated_amount) + Number(session.pnl) + macroFluctuation,
                updated_at: new Date().toISOString()
            }).eq('id', session.id);
        }
    }, 20000);

    const mainSub = supabase
      .channel('copy-trading-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'active_sessions', filter: `user_id=eq.${user?.id}` }, () => fetchDashboardData())
      .subscribe();

    return () => {
        clearInterval(interval);
        clearInterval(visualSimulation);
        clearInterval(dbSimulation);
        supabase.removeChannel(mainSub);
    };
  }, [fetchDashboardData, user?.id, activeSessions.length]);

  const getRiskLabel = (score: number) => {
    if (score < 3) return { label: "LOW RISK", color: "text-green-700", bg: "bg-green-50", border: "border-green-200" };
    if (score < 7) return { label: "MEDIUM RISK", color: "text-orange-700", bg: "bg-orange-50", border: "border-orange-200" };
    return { label: "HIGH RISK", color: "text-red-700", bg: "bg-red-50", border: "border-red-200" };
  };

  const scoreToRiskLabel = (score: number) => {
     if (score < 3) return "Low";
     if (score < 7) return "Medium";
     return "High";
  };

  const filtered = traders.filter((t) => {
    const risk = scoreToRiskLabel(t.risk_score).toLowerCase();
    if (filter !== "all" && risk !== filter) return false;
    if (search && !t.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const handleInitiate = async () => {
    const amountNum = parseFloat(copyAmount);
    if (!amountNum || amountNum < 100) {
        toast.error("Minimum allocation is $100");
        return;
    }
    if (amountNum > balance.copyTrading) {
        toast.error("Insufficient copy trading balance. Use the Transfer module to move funds.");
        return;
    }
    setIsConfirming(true);
  };

  const confirmCopy = async () => {

    if (!agreedToTerms) {
        toast.error("You must agree to the risk disclosure");
        return;
    }

    setIsProcessing(true);
    const trader = traders.find(t => t.id === selectedTrader);
    const amount = parseFloat(copyAmount);
    
    try {
         // Deduct from copy trading balance in DB
         const { data: b } = await supabase.from('balances').select('*').eq('user_id', user?.id).maybeSingle();
         await supabase.from('balances').update({
             copy_trading_balance: Math.max(0, (b?.copy_trading_balance || 0) - amount)
         }).eq('user_id', user?.id);

         const { error } = await supabase.from('active_sessions').insert({
             user_id: user?.id,
             trader_id: String(selectedTrader),
             trader_name: trader?.name,
             allocated_amount: amount,
             status: 'active'
         });
        
        if (!error) {
            toast.success(`Successfully copying ${trader?.name}`);
            setIsConfirming(false);
            setSelectedTrader(null);
            setCopyAmount("");
            fetchDashboardData();
        } else {
            toast.error(error.message);
        }
    } catch (err) {
        toast.error("Failed to connect to trading engine");
    } finally {
        setIsProcessing(false);
    }
  };

  const handleStopCopy = async (sessionId: string) => {
    try {
        setIsProcessing(sessionId);
        const session = activeSessions.find(s => s.id === sessionId);
        if (!session) return;

        // Return to copy_trading_balance in DB, protecting against negative overflows
        const { data: b } = await supabase.from('balances').select('*').eq('user_id', user?.id).maybeSingle();
        const pnl = session.pnl || 0;
        const totalReturn = Math.max(0, session.allocated_amount + pnl);

        await supabase.from('balances').update({
            copy_trading_balance: (b?.copy_trading_balance || 0) + totalReturn
        }).eq('user_id', user?.id);

        const { error } = await supabase.from('active_sessions').update({ status: 'stopped' }).eq('id', sessionId);
        if (!error) {
            toast.success("Copy trade stopped. Funds returned to wallet.");
            fetchDashboardData();
        } else {
            toast.error(error.message);
        }
    } catch (err) {
        toast.error("Withdrawal failed");
    } finally {
        setIsProcessing(false);
    }
  };

  const handleTogglePause = async (sessionId: string, currentStatus: string) => {
    try {
        setIsProcessing(sessionId);
        const newStatus = currentStatus === 'active' ? 'paused' : 'active';
        const { error } = await supabase.from('active_sessions').update({ status: newStatus }).eq('id', sessionId);
        
        if (!error) {
            toast.success(`Session ${newStatus === 'active' ? 'resumed' : 'paused'} successfully.`);
            fetchDashboardData();
        } else {
            toast.error(error.message);
        }
    } catch (err) {
        toast.error("Execution failed");
    } finally {
        setIsProcessing(false);
    }
  };

  // Derived metrics based on real-time active sessions
  const dynamicTotalReturn = activeSessions.reduce((acc, s) => acc + s.pnl, 0);
  const totalAllocated = activeSessions.reduce((acc, s) => acc + s.allocated_amount, 0);
  const dynamicROI = totalAllocated > 0 ? (dynamicTotalReturn / totalAllocated) * 100 : 0;
  
  const copiedTraders = traders.filter(t => activeSessions.some(s => s.traderId === t.id));
  const avgWinRate = copiedTraders.length 
      ? Math.round(copiedTraders.reduce((acc, t) => acc + (t.win_rate || 0), 0) / copiedTraders.length) 
      : 0;
  const avgDrawdown = copiedTraders.length 
      ? (copiedTraders.reduce((acc, t) => acc + (t.drawdown || 0), 0) / copiedTraders.length).toFixed(1) 
      : "0.0";

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-border">
          <div>
            <h1 className="text-3xl font-bold font-sans text-foreground">Copy Trading</h1>
            <p className="text-muted-foreground mt-1 text-sm">Mirror the execution patterns of top performing traders.</p>
          </div>
          <div className="flex flex-wrap gap-4">
             <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary/5 border border-primary/20 text-primary text-xs font-bold uppercase tracking-wider">
               <ShieldCheck className="w-4 h-4" /> Verified Records
             </div>
             <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-green-500/5 border border-green-500/20 text-green-600 text-xs font-bold uppercase tracking-wider">
                <TrendingUp className="w-4 h-4" /> Real-time Execution
             </div>
          </div>
        </header>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="bg-card p-4 rounded-2xl border border-border shadow-sm">
                <div className="text-[10px] font-bold text-muted-foreground uppercase mb-1">Total Net PnL</div>
                <div className={`text-xl font-black ${dynamicTotalReturn >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {dynamicTotalReturn >= 0 ? "+" : ""}{formatCurrency(dynamicTotalReturn)}
                </div>
            </div>
            <div className="bg-card p-4 rounded-2xl border border-border shadow-sm">
                <div className="text-[10px] font-bold text-muted-foreground uppercase mb-1">Aggregate ROI</div>
                <div className={`text-xl font-black flex items-center gap-2 ${dynamicROI >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {dynamicROI >= 0 ? "+" : ""}{dynamicROI.toFixed(2)}%
                    <TrendingUp className={`w-4 h-4 ${dynamicROI < 0 ? "rotate-180" : ""}`} />
                </div>
            </div>
            <div className="bg-card p-4 rounded-2xl border border-border shadow-sm">
                <div className="text-[10px] font-bold text-muted-foreground uppercase mb-1">Avg. Win Rate</div>
                <div className="text-xl font-black text-foreground flex items-center gap-2">
                    {avgWinRate}%
                    <Target className="w-4 h-4 text-primary" />
                </div>
            </div>
            <div className="bg-card p-4 rounded-2xl border border-border shadow-sm">
                <div className="text-[10px] font-bold text-muted-foreground uppercase mb-1">Avg. Max Drawdown</div>
                <div className="text-xl font-black text-foreground flex items-center gap-2">
                    {avgDrawdown}%
                    <Activity className="w-4 h-4 text-red-500 rotate-180" />
                </div>
            </div>
        </div>

        {/* Filters and Search */}
        <div className="flex flex-col lg:flex-row gap-4 items-center bg-card p-4 rounded-2xl border border-border shadow-sm">
            <div className="relative w-full lg:w-96 group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <input 
                    placeholder="Search Traders..." 
                    className="w-full h-12 bg-secondary border border-border rounded-xl pl-11 pr-4 text-sm font-semibold outline-none focus:border-primary/50 transition-all placeholder:text-muted-foreground"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </div>
            <div className="flex flex-wrap gap-2 p-1 bg-secondary rounded-xl border border-border">
                {(["all", "low", "medium", "high"] as Filter[]).map((f) => (
                <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`px-6 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
                    filter === f ? "bg-card text-primary shadow-sm" : "text-muted-foreground hover:text-foreground"
                    }`}
                >
                    {f}
                </button>
                ))}
            </div>
            <div className="ml-auto flex items-center gap-6 text-right lg:pr-4">
                <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Copy Trading Wallet</span>
                    <span className="text-xl font-bold text-foreground">{formatCurrency(balance.copyTrading)}</span>
                </div>
                <div className="w-px h-10 bg-border" />
                <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Active Allocation</span>
                    <span className="text-xl font-bold text-primary">{formatCurrency(activeSessions.reduce((acc, s) => acc + s.current_value, 0))}</span>
                </div>
            </div>
        </div>

        {/* Active Sessions Monitoring */}
        {activeSessions.length > 0 && (
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold font-sans text-foreground flex items-center gap-2 italic">
                        <RotateCcw className="w-5 h-5 text-primary rotate-180" />
                        Active Portfolios
                    </h2>
                    <span className="text-[10px] font-black text-primary bg-primary/10 px-3 py-1 rounded-full uppercase tracking-widest animate-pulse">Live Execution Monitoring</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {activeSessions.map((session) => (
                        <motion.div 
                            key={session.id} 
                            initial={{ scale: 0.98, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="bg-card border-2 border-primary/20 rounded-3xl p-6 shadow-huge relative overflow-hidden group"
                        >
                            <div className="flex justify-between items-start mb-6">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center font-bold text-primary">
                                        {session.traderName.charAt(0)}
                                    </div>
                                    <div>
                                        <div className="text-sm font-black uppercase text-foreground">{session.traderName}</div>
                                        <div className={`text-[9px] font-bold uppercase tracking-tighter flex items-center gap-1 ${session.status === 'active' ? 'text-green-500' : 'text-amber-500'}`}>
                                            <div className={`w-1 h-1 rounded-full ${session.status === 'active' ? 'bg-green-500 animate-ping' : 'bg-amber-500'}`} />
                                            {session.status}
                                        </div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-[10px] font-bold text-muted-foreground uppercase opacity-50">Current PnL</div>
                                    <div className={`text-lg font-black tabular-nums transition-all ${session.pnl >= 0 ? "text-green-500" : "text-red-500"}`}>
                                        {session.pnl >= 0 ? "+" : ""}{formatCurrency(session.pnl)}
                                    </div>
                                    <div className={`text-[10px] font-black uppercase text-right -mt-0.5 ${session.pnl >= 0 ? "text-green-500/60" : "text-red-500/60"}`}>
                                        {session.allocated_amount > 0 ? (session.pnl / session.allocated_amount * 100).toFixed(2) : "0.00"}% ROI
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4 mb-4">
                                <div className="flex justify-between text-[11px] font-bold">
                                    <span className="text-muted-foreground uppercase">Equity Position</span>
                                    <span className="text-foreground">{formatCurrency(session.current_value)}</span>
                                </div>
                                <div className="h-2 bg-secondary rounded-full overflow-hidden border border-border">
                                    <motion.div 
                                        initial={{ width: 0 }} 
                                        animate={{ width: `${Math.min(100, (session.current_value / session.allocated_amount) * 100)}%` }} 
                                        className={`h-full ${session.pnl >= 0 ? 'bg-green-500' : 'bg-red-500'}`} 
                                    />
                                </div>
                                <div className="flex justify-between text-[11px] font-bold">
                                    <span className="text-muted-foreground uppercase">Initial Principal</span>
                                    <span className="text-foreground">{formatCurrency(session.allocated_amount)}</span>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                                <Button 
                                    variant="outline" 
                                    className="h-10 text-[10px] font-black uppercase rounded-xl border-border bg-card"
                                    onClick={() => handleTogglePause(session.id, session.status)}
                                    disabled={isProcessing === session.id}
                                >
                                    {isProcessing === session.id ? (
                                      <Loader2 className="w-3.5 h-3.5 animate-spin mx-auto" />
                                    ) : session.status === 'active' ? (
                                      <><Pause className="w-3.5 h-3.5 mr-2" /> Pause</>
                                    ) : (
                                      <><Play className="w-3.5 h-3.5 mr-2" /> Resume</>
                                    )}
                                </Button>
                                <Button 
                                    variant="outline" 
                                    className="h-10 text-[10px] font-black uppercase rounded-xl border-red-200 text-red-600 hover:bg-red-50"
                                    onClick={() => handleStopCopy(session.id)}
                                    disabled={isProcessing === session.id}
                                >
                                    {isProcessing === session.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Stop Session"}
                                </Button>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        )}

        <div className="space-y-4">
            <h2 className="text-xl font-bold font-sans text-foreground flex items-center gap-2">
                Discover Elite Traders
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filtered.map((trader, i) => {
                    const riskInfo = getRiskLabel(trader.risk_score);
                    const isBeingCopied = activeSessions.some(s => s.traderId === trader.id);

                    return (
                    <motion.div
                        key={trader.id}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.05 }}
                        className={`bg-card p-6 rounded-3xl border transition-all duration-300 relative flex flex-col group shadow-sm hover:shadow-md ${
                            isBeingCopied ? 'border-primary shadow-primary/10' : 'border-border hover:border-primary/30'
                        }`}
                    >
                        {isBeingCopied && (
                        <div className="absolute top-0 right-0 p-3 bg-primary text-white rounded-bl-2xl rounded-tr-3xl shadow-sm">
                            <UserCheck className="w-5 h-5" />
                        </div>
                        )}

                        <div className="flex items-start justify-between mb-6">
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 rounded-2xl border border-border overflow-hidden shadow-sm relative">
                                <img src={traderAvatar} alt="Trader" className="w-full h-full object-cover" />
                            </div>
                            <div>
                            <h4 className="font-bold text-foreground text-lg group-hover:text-primary transition-colors flex items-center gap-2">
                                {trader.name}
                                <ShieldCheck className="w-4 h-4 text-primary opacity-80" />
                            </h4>
                            <div className="flex items-center gap-2 mt-0.5">
                                <div className="flex text-amber-400">
                                    {[1,2,3,4,5].map((s) => <Star key={s} className="w-3 h-3 fill-current" />)}
                                </div>
                                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{trader.followers.toLocaleString()} COPIERS</span>
                            </div>
                            </div>
                        </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mb-6">
                            <div className="p-4 rounded-xl bg-secondary border border-border group-hover:border-primary/20 transition-colors">
                                <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex justify-between">
                                    <span>Return (YTD)</span>
                                    <TrendingUp className="w-3.5 h-3.5 text-green-600" />
                                </div>
                                <div className="text-xl font-bold text-green-600">+{trader.roi}%</div>
                            </div>
                            <div className="p-4 rounded-xl bg-secondary border border-border group-hover:border-primary/20 transition-colors">
                                <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex justify-between">
                                    <span>Risk Score</span>
                                    <Target className="w-3.5 h-3.5 text-muted-foreground" />
                                </div>
                                <div className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full inline-flex ${riskInfo.bg} ${riskInfo.color} border ${riskInfo.border}`}>{riskInfo.label}</div>
                            </div>
                        </div>

                        <div className="space-y-4 mb-8 text-xs font-semibold text-muted-foreground">
                            <div className="flex justify-between items-center px-1">
                                <span>Win Rate</span>
                                <span className="text-foreground">{trader.win_rate || 0}%</span>
                            </div>
                            <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                                <motion.div initial={{ width: 0 }} whileInView={{ width: `${trader.win_rate || 0}%` }} className="h-full bg-primary" />
                            </div>
                            <div className="flex justify-between items-center px-1">
                                <span>Max Drawdown</span>
                                <span className="text-red-600">{trader.drawdown}%</span>
                            </div>
                            <div className="flex justify-between items-center px-1">
                                <span>Total Trades</span>
                                <span className="text-foreground">{trader.total_trades || 0}</span>
                            </div>
                        </div>

                        {/* Interaction Logic */}
                        <div className="mt-auto">
                            {selectedTrader === trader.id ? (
                            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                                <div className="relative">
                                    <input
                                        placeholder="Min $100"
                                        type="number"
                                        value={copyAmount}
                                        onChange={(e) => setCopyAmount(e.target.value)}
                                        className="w-full h-12 bg-card border border-primary/50 rounded-xl px-4 text-sm font-bold focus:shadow-[0_0_0_2px_rgba(212,175,55,0.2)] transition-all outline-none"
                                        autoFocus
                                    />
                                    <button className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-bold text-primary hover:underline uppercase tracking-wider" onClick={() => setCopyAmount(balance.copyTrading.toString())}>MAX</button>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                <Button 
                                    variant="hero" 
                                    className="h-12 rounded-xl text-white text-xs font-bold uppercase tracking-wider shadow-md" 
                                    onClick={handleInitiate}
                                    disabled={!copyAmount || parseFloat(copyAmount) < 100}
                                >
                                    Init Copy
                                </Button>
                                <Button variant="outline" className="h-12 rounded-xl border-border bg-card text-xs font-bold uppercase tracking-wider hover:bg-secondary" onClick={() => setSelectedTrader(null)}>
                                    Cancel
                                </Button>
                                </div>
                            </motion.div>
                            ) : (
                            <Button
                                variant="hero"
                                className={`w-full h-12 rounded-xl text-white text-xs font-bold uppercase tracking-wider ${isBeingCopied ? 'opacity-50 pointer-events-none' : 'shadow-gold'}`}
                                onClick={() => { setSelectedTrader(trader.id); setCopyAmount(""); }}
                            >
                                {isBeingCopied ? "Currently Copying" : "Copy Trader"} <ArrowUpRight className="w-4 h-4 ml-2" />
                            </Button>
                            )}
                        </div>
                    </motion.div>
                    );
                })}
            </div>
        </div>

        {/* Informational Sections */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 pt-8 pb-12">
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="bg-card border border-border p-8 rounded-3xl shadow-sm">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
                    <TrendingUp className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold text-foreground mb-4">How it Works</h3>
                <ul className="space-y-4">
                    <li className="flex gap-3 text-sm text-muted-foreground font-medium">
                        <span className="w-5 h-5 rounded-full bg-secondary border border-border flex items-center justify-center text-[10px] font-bold text-primary shrink-0">1</span>
                        Choose a master trader based on their verified performance and risk score.
                    </li>
                    <li className="flex gap-3 text-sm text-muted-foreground font-medium">
                        <span className="w-5 h-5 rounded-full bg-secondary border border-border flex items-center justify-center text-[10px] font-bold text-primary shrink-0">2</span>
                        Allocate the capital you wish to invest and set your preferred risk parameters.
                    </li>
                    <li className="flex gap-3 text-sm text-muted-foreground font-medium">
                        <span className="w-5 h-5 rounded-full bg-secondary border border-border flex items-center justify-center text-[10px] font-bold text-primary shrink-0">3</span>
                        Our system automatically mirrors their trades in your account in real-time.
                    </li>
                </ul>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }} className="bg-card border border-border p-8 rounded-3xl shadow-sm">
                <div className="w-12 h-12 rounded-2xl bg-green-50 flex items-center justify-center mb-6">
                    <ShieldCheck className="w-6 h-6 text-green-600" />
                </div>
                <h3 className="text-xl font-bold text-foreground mb-4">Risk Management</h3>
                <p className="text-sm text-muted-foreground leading-relaxed mb-6">
                    We prioritize your capital safety. All master traders go through a rigorous verification process before being listed on the platform.
                </p>
                <div className="space-y-3">
                    <div className="flex items-center gap-2 text-xs font-bold text-foreground bg-secondary/50 p-3 rounded-xl border border-border">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                        STOP-LOSS PROTECTION
                    </div>
                    <div className="flex items-center gap-2 text-xs font-bold text-foreground bg-secondary/50 p-3 rounded-xl border border-border">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                        EQUITY DRAWDOWN LIMITS
                    </div>
                </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.2 }} className="bg-card border border-border p-8 rounded-3xl shadow-sm md:col-span-2 lg:col-span-1">
                <div className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center mb-6">
                    <Users className="w-6 h-6 text-amber-600" />
                </div>
                <h3 className="text-xl font-bold text-foreground mb-4">FAQ</h3>
                <div className="space-y-4">
                    <div>
                        <h4 className="text-sm font-bold text-foreground mb-1">What are the fees?</h4>
                        <p className="text-xs text-muted-foreground leading-relaxed">Typical profit sharing is 10-20% only when you make a profit. No management fees.</p>
                    </div>
                    <div>
                        <h4 className="text-sm font-bold text-foreground mb-1">Can I stop anytime?</h4>
                        <p className="text-xs text-muted-foreground leading-relaxed">Yes, you have full control. You can stop copying or adjust your allocation at any moment.</p>
                    </div>
                </div>
            </motion.div>
        </div>
      </div>

      <AnimatePresence>
        {isConfirming && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
                <motion.div 
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="bg-card border-2 border-primary/30 w-full max-w-lg rounded-[2.5rem] p-8 space-y-8 shadow-[0_0_100px_rgba(212,175,55,0.15)]"
                >
                    <div className="flex items-center gap-4 border-b border-border pb-6">
                        <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
                            <TrendingUp className="w-7 h-7 text-primary" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold font-sans text-foreground">Confirm Copy Activation</h3>
                            <p className="text-xs text-muted-foreground font-medium italic">Execution Engine Secure Channel</p>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-4 rounded-2xl bg-secondary/50 border border-border">
                                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block mb-1">Mirroring Target</span>
                                <span className="text-sm font-black text-foreground">{traders.find(t => t.id === selectedTrader)?.name}</span>
                            </div>
                            <div className="p-4 rounded-2xl bg-secondary/50 border border-border">
                                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block mb-1">Locked Capital</span>
                                <span className="text-sm font-black text-primary">{formatCurrency(parseFloat(copyAmount) || 0)}</span>
                            </div>
                        </div>

                        <div className="p-5 rounded-2xl bg-amber-500/5 border border-amber-500/20 flex gap-4">
                            <AlertCircle className="w-5 h-5 text-amber-500 shrink-0" />
                            <p className="text-[11px] text-amber-700 leading-relaxed font-bold uppercase">
                                Funds will be moved to a locked trading wallet. All master trades will be replicated proportionally using this principal.
                            </p>
                        </div>

                        <div className="flex items-start gap-3">
                            <input 
                                type="checkbox" 
                                id="terms" 
                                checked={agreedToTerms}
                                onChange={(e) => setAgreedToTerms(e.target.checked)}
                                className="mt-1 w-4 h-4 rounded border-border focus:ring-primary text-primary" 
                            />
                            <label htmlFor="terms" className="text-[10px] text-muted-foreground font-medium uppercase tracking-tight leading-4">
                                I understand that past performance does not guarantee future results, and I accept full responsibility for my delegated trading capital.
                            </label>
                        </div>
                    </div>

                    <div className="flex flex-col gap-3">
                        <Button 
                            variant="hero" 
                            className="h-14 rounded-2xl text-white font-black uppercase text-sm tracking-widest shadow-gold transition-all"
                            onClick={confirmCopy}
                            disabled={isProcessing === true || !agreedToTerms}
                        >
                            {isProcessing === true ? <Loader2 className="w-5 h-5 animate-spin" /> : "Authorize & Lock Funds"}
                        </Button>
                        <Button 
                            variant="ghost" 
                            className="h-10 text-[10px] font-bold text-muted-foreground uppercase"
                            onClick={() => setIsConfirming(false)}
                        >
                            Back to Profile
                        </Button>
                    </div>
                </motion.div>
            </div>
        )}
      </AnimatePresence>
    </DashboardLayout>
  );
};

export default CopyTradingPage;
