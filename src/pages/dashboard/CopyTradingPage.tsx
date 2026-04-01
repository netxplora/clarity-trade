import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { Button } from "@/components/ui/button";
import {
  Star,
  Search,
  Users,
  TrendingUp,
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
  Coins,
  AlertCircle,
  Wallet,
  Crown,
  Zap
} from "lucide-react";
import { toast } from "sonner";
import { useStore } from "@/store/useStore";
import { supabase } from "@/lib/supabase";

type RiskFilter = "all" | "low" | "medium" | "high";
type CategoryFilter = "All" | "Crypto" | "Forex" | "Commodities";
type SortOption = "default" | "roi" | "winRate" | "risk" | "followers" | "newest";



const traderAvatar = "https://images.unsplash.com/photo-1560250097-0b93528c311a?q=80&w=256&auto=format&fit=crop";

const CopyTradingPage = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [riskFilter, setRiskFilter] = useState<RiskFilter>("all");
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("All");
  type TierFilter = "All" | "Starter" | "Silver" | "Gold" | "Elite";
  const [tierFilter, setTierFilter] = useState<TierFilter>("All");
  const [sortBy, setSortBy] = useState<SortOption>("default");
  const [selectedTrader, setSelectedTrader] = useState<string | null>(null);
  const [copyAmount, setCopyAmount] = useState("");
  
  const { balance, user, formatCurrency } = useStore();
  const [traders, setTraders] = useState<any[]>([]);
  const [activeSessions, setActiveSessions] = useState<any[]>([]);
  const [closedSessions, setClosedSessions] = useState<any[]>([]);
  const [executionLogs, setExecutionLogs] = useState<any[]>([]);
  const [isConfirming, setIsConfirming] = useState(false);
  const [isProcessing, setIsProcessing] = useState<string | boolean>(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const fetchDashboardData = useCallback(async () => {
    if (!user?.id) return;
    try {
        const [tradersRes, activeRes, closedRes] = await Promise.all([
            supabase.from('copy_traders').select('*').order('followers', { ascending: false }),
            supabase.from('active_sessions').select('*, copy_traders(avatar_url, ranking_level)').eq('user_id', user.id).neq('status', 'stopped'),
            supabase.from('active_sessions').select('*, copy_traders(avatar_url, ranking_level)').eq('user_id', user.id).eq('status', 'stopped').order('updated_at', { ascending: false }).limit(20)
        ]);
            
        if (tradersRes.data) {
            setTraders(tradersRes.data);
        }

        if (activeRes.data) {
            const mapped = activeRes.data.map(dbCt => ({
               id: dbCt.id,
               userId: dbCt.user_id,
               traderId: dbCt.trader_id,
               traderName: dbCt.trader_name,
               allocated_amount: Number(dbCt.allocated_amount),
               current_value: Number(dbCt.current_value),
               pnl: Number(dbCt.pnl),
               status: dbCt.status,
               avatar_url: dbCt.copy_traders?.avatar_url,
               ranking_level: dbCt.copy_traders?.ranking_level
            }));
            setActiveSessions(mapped);
        }

        if (closedRes.data) {
            setClosedSessions(closedRes.data);
        }
    } catch (err) {
        console.error("Dashboard Sync Error:", err);
    }
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id) return;
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

    // Remote Update Loop (Database Side)
    const dbSimulation = setInterval(async () => {
        if (!user?.id) return;
        
        try {
            const { data, error } = await supabase.rpc('simulate_copy_trading_pulse', { tgt_user_id: user.id });
            if (data && Array.isArray(data)) {
                const mapped = data.map((dbCt: any) => ({
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
            console.error("Update Pulse Error:", err);
        }
    }, 15000);

    const logsSub = supabase
      .channel('copy-logs-realtime')
      .on('postgres_changes', { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'copy_trading_logs', 
          filter: `user_id=eq.${user?.id}` 
      }, (payload) => {
          setExecutionLogs(prev => [payload.new, ...prev].slice(0, 10));
          toast.success("Trade Replicated", {
              description: `Master executed ${payload.new.pair} ${payload.new.type}`,
              duration: 3000
          });
      })
      .subscribe();

    // Initial Logs Fetch
    const fetchLogs = async () => {
        if (!user?.id) return;
        const { data } = await supabase.from('copy_trading_logs').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(10);
        if (data) setExecutionLogs(data);
    }
    fetchLogs();

    const mainSub = supabase
      .channel(`copy-trading-realtime-${user.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'active_sessions', filter: `user_id=eq.${user.id}` }, () => fetchDashboardData())
      .subscribe();

    return () => {
        clearInterval(interval);
        clearInterval(visualSimulation);
        clearInterval(dbSimulation);
        supabase.removeChannel(mainSub);
        supabase.removeChannel(logsSub);
    };
  }, [fetchDashboardData, user?.id]);

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

  const trendingTraders = traders.filter(t => t.is_trending && t.status === 'Active');

  const filtered = traders.filter((t) => {
    const risk = scoreToRiskLabel(t.risk_score).toLowerCase();
    if (riskFilter !== "all" && risk !== riskFilter) return false;
    
    // Category Filter
    if (categoryFilter !== "All") {
        const traderCats = t.categories || [];
        if (!traderCats.includes(categoryFilter)) return false;
    }

    // Tier Filter
    if (tierFilter !== "All" && t.min_plan !== tierFilter) return false;

    if (search && !t.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  }).sort((a, b) => {
    switch (sortBy) {
      case 'roi': return (b.roi || 0) - (a.roi || 0);
      case 'winRate': return (b.win_rate || 0) - (a.win_rate || 0);
      case 'risk': return (a.risk_score || 0) - (b.risk_score || 0);
      case 'followers': return (b.followers || 0) - (a.followers || 0);
      case 'newest': return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
      default: return (b.ranking_score || 0) - (a.ranking_score || 0);
    }
  });

  const handleInitiate = async () => {
    const amountNum = parseFloat(copyAmount);
    const trader = traders.find(t => t.id === selectedTrader);
    const minReq = trader?.min_amount || 100;

    if (!amountNum || amountNum < minReq) {
        toast.error(`Minimum allocation for this trader is $${minReq.toLocaleString()}`);
        return;
    }
    if (amountNum > balance.copyTrading) {
        toast.error("Insufficient copy trading balance. Use the Transfer module to move funds.");
        return;
    }
    setIsConfirming(true);
  };

  const confirmCopy = async () => {
    if (user?.kyc !== 'Verified') {
        toast.error("Account verification required. Please complete your KYC to start copy trading.", {
            action: {
                label: "Verify Now",
                onClick: () => navigate('/dashboard/kyc')
            }
        });
        setIsConfirming(false);
        return;
    }

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
        toast.error("Failed to connect to trading service");
    } finally {
        setIsProcessing(false);
    }
  };

  const handleStopCopy = async (sessionId: string) => {
    try {
        setIsProcessing(sessionId);
        const session = activeSessions.find(s => s.id === sessionId);
        if (!session) return;

        // Fetch platform settings and user profile (for referral info)
        const { data: settings } = await supabase.from('platform_settings').select('commission_auto_deduct_percent').eq('id', 1).single();
        const { data: profile } = await supabase.from('profiles').select('referred_by').eq('id', user?.id).single();
        
        const commissionPercent = settings?.commission_auto_deduct_percent || 10;
        const principal = session.allocated_amount;
        const pnl = session.pnl || 0;
        let commissionDeducted = 0;
        let netReturn = principal + pnl;

        if (pnl > 0) {
            commissionDeducted = (pnl * commissionPercent) / 100;
            netReturn = principal + (pnl - commissionDeducted);

            // Log commission to fee_ledger
            await supabase.from('fee_ledger').insert({
                user_id: user?.id,
                gross_amount: pnl,
                fee_percent: commissionPercent,
                fee_amount: commissionDeducted,
                net_amount: pnl - commissionDeducted,
                asset: 'USD'
            });

            // If user has a referrer, pay out 20% of the commission to them
            if (profile?.referred_by) {
                const referralBonus = commissionDeducted * 0.20; // 20% of the platform fee
                const { data: refBal } = await supabase.from('balances').select('fiat_balance').eq('user_id', profile.referred_by).single();
                if (refBal) {
                    await supabase.from('balances').update({
                        fiat_balance: refBal.fiat_balance + referralBonus
                    }).eq('user_id', profile.referred_by);
                    
                    // Notify referrer
                    await supabase.from('notifications').insert({
                        user_id: profile.referred_by,
                        title: "Referral Commission Received",
                        message: `You earned ${formatCurrency(referralBonus)} from your referral's copy trading profit.`,
                        type: "Reward"
                    });
                }
            }
        }

        const { data: b } = await supabase.from('balances').select('*').eq('user_id', user?.id).maybeSingle();
        await supabase.from('balances').update({
            copy_trading_balance: (b?.copy_trading_balance || 0) + netReturn
        }).eq('user_id', user?.id);

        // Notify user of settlement
        await supabase.from('notifications').insert({
            user_id: user?.id,
            title: "Portfolio Settled",
            message: `Your copy session with ${session.traderName} has been settled. Net Return: ${formatCurrency(netReturn)}`,
            type: "Transaction"
        });

        const { error } = await supabase.from('active_sessions').update({ status: 'stopped' }).eq('id', sessionId);
        
        if (!error) {
            toast.success(commissionDeducted > 0 
                ? `Settled: ${formatCurrency(netReturn)} (Incl. ${formatCurrency(commissionDeducted)} Fee)` 
                : "Copy trade stopped. Capital returned.");
            fetchDashboardData();
        } else {
            toast.error(error.message);
        }
    } catch (err) {
        toast.error("Withdrawal settlement failed");
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
            <p className="text-muted-foreground mt-1 text-sm">Follow the trades of our best performing experts.</p>
          </div>
          <div className="flex flex-wrap gap-4 items-center">
             <div className="flex flex-col items-end">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest leading-none mb-1">Current Plan</span>
                <div className={`px-4 py-1.5 rounded-lg border text-[10px] font-black uppercase tracking-widest ${
                    user?.current_plan === 'Elite' ? 'bg-gradient-gold text-white border-transparent shadow-gold' :
                    user?.current_plan === 'Gold' ? 'bg-amber-500/10 text-amber-600 border-amber-500/20' :
                    user?.current_plan === 'Silver' ? 'bg-zinc-500/10 text-zinc-600 border-zinc-500/20' :
                    'bg-secondary text-muted-foreground border-border'
                }`}>
                    {user?.current_plan || 'Starter'}
                </div>
             </div>
          </div>
        </header>

        {/* Removed Account Tier Status */}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="bg-card p-4 rounded-2xl border border-border shadow-sm">
                <div className="text-[10px] font-bold text-muted-foreground uppercase mb-1">Total Profit/Loss</div>
                <div className={`text-xl font-black ${dynamicTotalReturn >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {dynamicTotalReturn >= 0 ? "+" : ""}{formatCurrency(dynamicTotalReturn)}
                </div>
            </div>
            <div className="bg-card p-4 rounded-2xl border border-border shadow-sm">
                <div className="text-[10px] font-bold text-muted-foreground uppercase mb-1">Total Return</div>
                <div className={`text-xl font-black flex items-center gap-2 ${dynamicROI >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {dynamicROI >= 0 ? "+" : ""}{dynamicROI.toFixed(2)}%
                    <TrendingUp className={`w-4 h-4 ${dynamicROI < 0 ? "rotate-180" : ""}`} />
                </div>
            </div>
            <div className="bg-card p-4 rounded-2xl border border-border shadow-sm">
                <div className="text-[10px] font-bold text-muted-foreground uppercase mb-1">Success Rate</div>
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
                    placeholder="Find a Trader..." 
                    className="w-full h-12 bg-white border border-border rounded-xl pl-11 pr-4 text-sm font-semibold outline-none focus:border-primary/50 transition-all placeholder:text-muted-foreground text-zinc-950"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </div>
            <div className="flex flex-col gap-2 w-full lg:w-auto">
                <div className="flex flex-wrap gap-2 p-1 bg-secondary rounded-xl border border-border">
                    {["All", "Crypto", "Forex", "Commodities"].map((cat) => (
                    <button
                        key={cat}
                        onClick={() => setCategoryFilter(cat as CategoryFilter)}
                        className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                        categoryFilter === cat ? "bg-card text-primary shadow-sm" : "text-muted-foreground hover:text-foreground"
                        }`}
                    >
                        {cat}
                    </button>
                    ))}
                </div>

                <div className="flex flex-wrap gap-2 p-1 bg-secondary/50 rounded-xl border border-border/50">
                    {(["all", "low", "medium", "high"] as RiskFilter[]).map((f) => (
                    <button
                        key={f}
                        onClick={() => setRiskFilter(f)}
                        className={`px-4 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-wider transition-all ${
                        riskFilter === f ? "bg-card text-primary shadow-sm" : "text-muted-foreground hover:text-foreground"
                        }`}
                    >
                        {f}
                    </button>
                    ))}
                </div>
            </div>
            <div className="ml-0 lg:ml-auto flex items-center gap-3 shrink-0">
                <select
                    value={tierFilter}
                    onChange={(e) => setTierFilter(e.target.value as TierFilter)}
                    className="h-10 px-4 pr-8 rounded-xl bg-secondary border border-border text-[10px] font-black uppercase tracking-widest text-foreground outline-none focus:border-primary/50 transition-all cursor-pointer appearance-none"
                    style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%239ca3af' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center' }}
                >
                    <option value="All">All Tiers</option>
                    <option value="Starter">Starter</option>
                    <option value="Silver">Silver</option>
                    <option value="Gold">Gold</option>
                    <option value="Elite">Elite</option>
                </select>
                <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as SortOption)}
                    className="h-10 px-4 pr-8 rounded-xl bg-secondary border border-border text-[10px] font-black uppercase tracking-widest text-foreground outline-none focus:border-primary/50 transition-all cursor-pointer appearance-none"
                    style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%239ca3af' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center' }}
                >
                    <option value="default">Sort: Rank</option>
                    <option value="roi">Sort: Highest ROI</option>
                    <option value="winRate">Sort: Win Rate</option>
                    <option value="risk">Sort: Lowest Risk</option>
                    <option value="followers">Sort: Most Copied</option>
                    <option value="newest">Sort: Newest</option>
                </select>
            </div>
        </div>
        <div className="flex flex-wrap items-center gap-6 bg-card p-4 rounded-2xl border border-border shadow-sm">
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

        {/* Active Sessions Monitoring */}
        {activeSessions.length > 0 && (
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold font-sans text-foreground flex items-center gap-2 italic">
                        <RotateCcw className="w-5 h-5 text-primary rotate-180" />
                        My Active Trades
                    </h2>
                    <span className="text-[10px] font-black text-primary bg-primary/10 px-3 py-1 rounded-full uppercase tracking-widest animate-pulse">Live Status</span>
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
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold overflow-hidden shrink-0 ${
                                        session.ranking_level === 'Elite' ? 'ring-2 ring-primary ring-offset-2 ring-offset-background bg-gradient-gold text-white shadow-gold' : 'bg-secondary text-primary border border-border'
                                    }`}>
                                        {session.avatar_url ? (
                                            <img src={session.avatar_url} alt="" className="w-full h-full object-cover" />
                                        ) : (
                                            session.traderName?.charAt(0) || 'T'
                                        )}
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
                                    <div className="text-[10px] font-bold text-muted-foreground uppercase opacity-50">Current Profit</div>
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
                                    <span className="text-muted-foreground uppercase">Current Value</span>
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
                                    <span className="text-muted-foreground uppercase">Amount Invested</span>
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

                {/* Closed Sessions / Position History */}
                {closedSessions.length > 0 && (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-sm font-black text-muted-foreground uppercase tracking-[0.2em] flex items-center gap-2">
                                <RotateCcw className="w-4 h-4 opacity-50" />
                                Past Trades History
                            </h3>
                            <div className="text-[10px] font-bold text-green-500 bg-green-500/10 px-3 py-1 rounded-full uppercase">
                                Total Earned: {formatCurrency(closedSessions.reduce((acc, s) => acc + (s.pnl || 0), 0))}
                            </div>
                        </div>
                        
                        <div className="bg-card/50 border border-border rounded-3xl overflow-hidden backdrop-blur-sm">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest border-b border-border bg-secondary/30">
                                            <th className="p-4">Strategy / Trader</th>
                                            <th className="p-4">Invested</th>
                                            <th className="p-4">Return</th>
                                            <th className="p-4">Profit/Loss</th>
                                            <th className="p-4 text-right">Closed Date</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border/50">
                                        {closedSessions.map((session) => (
                                            <tr key={session.id} className="hover:bg-secondary/20 transition-colors">
                                                <td className="p-4">
                                                    <div className="text-xs font-black text-foreground uppercase">{session.trader_name}</div>
                                                    <div className="text-[9px] text-muted-foreground font-bold tracking-tight">Manual Withdrawal</div>
                                                </td>
                                                <td className="p-4 text-xs font-bold text-foreground">{formatCurrency(session.allocated_amount)}</td>
                                                <td className="p-4">
                                                    <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md border ${
                                                        session.pnl >= 0 ? 'bg-green-500/10 text-green-600 border-green-500/20' : 'bg-red-500/10 text-red-600 border-red-500/20'
                                                    }`}>
                                                        {session.allocated_amount > 0 ? (session.pnl / session.allocated_amount * 100).toFixed(2) : "0.00"}%
                                                    </span>
                                                </td>
                                                <td className={`p-4 text-xs font-black tabular-nums ${session.pnl >= 0 ? "text-green-600" : "text-red-600"}`}>
                                                    {session.pnl >= 0 ? "+" : ""}{formatCurrency(session.pnl)}
                                                </td>
                                                <td className="p-4 text-right text-[10px] font-bold text-muted-foreground/60 tabular-nums">
                                                    {new Date(session.updated_at).toLocaleDateString()}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}
                
                {/* Execution Timeline */}
                <div className="bg-card border border-border rounded-[2rem] p-8 shadow-sm overflow-hidden relative">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-[80px] -mr-32 -mt-32" />
                    <div className="flex items-center justify-between mb-8 relative z-10">
                        <div className="flex items-center gap-3">
                            <Activity className="w-5 h-5 text-primary" />
                            <h3 className="text-sm font-black text-foreground uppercase tracking-[0.2em]">Live Trade History</h3>
                        </div>
                        <div className="flex items-center gap-2">
                             <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                             <span className="text-[10px] font-black text-muted-foreground uppercase opacity-60">Live Sync</span>
                        </div>
                    </div>

                    <div className="space-y-4 relative z-10">
                        {executionLogs.length === 0 ? (
                            <div className="py-12 text-center text-muted-foreground">
                                <Search className="w-10 h-10 mx-auto mb-3 opacity-20" />
                                <p className="text-[10px] font-black uppercase tracking-widest opacity-40">Waiting for trades...</p>
                            </div>
                        ) : executionLogs.map((log) => (
                             <motion.div 
                                initial={{ opacity: 0, x: -10 }} 
                                animate={{ opacity: 1, x: 0 }}
                                key={log.id} 
                                className="flex items-center justify-between p-4 rounded-2xl bg-secondary/30 border border-border/50 group hover:border-primary/20 transition-all hover:bg-secondary/50"
                             >
                                <div className="flex items-center gap-4">
                                    <div className={`p-2 rounded-xl border ${log.type === 'Buy' ? 'bg-green-500/10 text-green-500 border-green-500/20' : 'bg-red-500/10 text-red-500 border-red-500/20'}`}>
                                        {log.type === 'Buy' ? <TrendingUp className="w-4 h-4" /> : <TrendingUp className="w-4 h-4 transform rotate-180" />}
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs font-black text-foreground">{log.pair}</span>
                                            <span className="text-[9px] font-bold text-muted-foreground uppercase px-2 py-0.5 rounded-md bg-card border border-border">{log.type}</span>
                                        </div>
                                        <div className="text-[9px] font-bold text-muted-foreground/50 uppercase mt-0.5 tracking-tighter">
                                            {traders.find(t => t.id === log.trader_id)?.name || "Master Trader"} • {new Date(log.created_at).toLocaleTimeString()}
                                        </div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-xs font-black text-foreground tabular-nums">{formatCurrency(log.amount)}</div>
                                    <div className={`text-[10px] font-black tabular-nums ${log.pnl >= 0 ? "text-green-500" : "text-red-500"}`}>
                                        {log.pnl >= 0 ? '+' : ''}{formatCurrency(log.pnl)}
                                    </div>
                                </div>
                             </motion.div>
                        ))}
                    </div>
                    
                    <div className="mt-8 pt-6 border-t border-border flex justify-center">
                        <p className="text-[9px] font-bold text-muted-foreground/40 uppercase tracking-widest flex items-center gap-2">
                             <ShieldCheck className="w-3.5 h-3.5" /> Secure Connection • Secure Trading Signals
                        </p>
                    </div>
                </div>
            </div>
        )}

        {/* Trending Traders Section */}
        {trendingTraders.length > 0 && categoryFilter === 'All' && riskFilter === 'all' && !search && (
            <div className="space-y-4">
                <h2 className="text-xl font-bold font-sans text-foreground flex items-center gap-2">
                    <Zap className="w-5 h-5 text-amber-500 fill-amber-500" />
                    Trending Traders
                    <span className="text-[9px] font-black text-amber-600 bg-amber-500/10 px-2.5 py-1 rounded-full uppercase tracking-widest border border-amber-500/20 ml-1">🔥 Hot</span>
                </h2>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {trendingTraders.map((trader) => {
                        const riskInfo = getRiskLabel(trader.risk_score || 0);
                        const isBeingCopied = activeSessions.some(s => String(s.traderId) === String(trader.id));
                        
                        return (
                            <motion.div
                                key={`trending-${trader.id}`}
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className={`bg-card p-5 rounded-2xl border-2 transition-all duration-300 relative group shadow-sm hover:shadow-md ${
                                    isBeingCopied ? 'border-primary shadow-primary/10' : 'border-amber-500/30 hover:border-primary/30'
                                }`}
                            >
                                <div className="absolute top-3 right-3 flex flex-col items-end gap-1">
                                    <div className="bg-amber-500/10 text-amber-600 px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-widest flex items-center gap-1 border border-amber-500/20">
                                        <Zap className="w-2.5 h-2.5 fill-amber-500" /> Trending
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="w-12 h-12 rounded-xl border border-border overflow-hidden shrink-0">
                                        <img src={trader.avatar_url || traderAvatar} alt="" className="w-full h-full object-cover" />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-foreground text-sm flex items-center gap-1.5">
                                            {trader.name}
                                            <ShieldCheck className="w-3.5 h-3.5 text-primary opacity-60" />
                                        </h4>
                                        <div className="flex items-center gap-2 mt-0.5">
                                            <span className="text-[9px] font-bold text-muted-foreground uppercase">{(trader.followers || 0).toLocaleString()} copiers</span>
                                            <span className={`text-[8px] font-bold uppercase px-1.5 py-0.5 rounded ${riskInfo.bg} ${riskInfo.color} border ${riskInfo.border}`}>{riskInfo.label}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="grid grid-cols-3 gap-2 text-center">
                                    <div className="p-2 rounded-lg bg-secondary/50 border border-border">
                                        <div className="text-[8px] font-bold text-muted-foreground uppercase">ROI</div>
                                        <div className="text-sm font-black text-primary">{trader.roi || 0}%</div>
                                    </div>
                                    <div className="p-2 rounded-lg bg-secondary/50 border border-border">
                                        <div className="text-[8px] font-bold text-muted-foreground uppercase">Win Rate</div>
                                        <div className="text-sm font-black text-foreground">{trader.win_rate || 0}%</div>
                                    </div>
                                    <div className="p-2 rounded-lg bg-secondary/50 border border-border">
                                        <div className="text-[8px] font-bold text-muted-foreground uppercase">Drawdown</div>
                                        <div className="text-sm font-black text-red-500">{trader.max_drawdown || trader.drawdown || 0}%</div>
                                    </div>
                                </div>
                                <div className="mt-3 grid grid-cols-2 gap-2">
                                    <Button
                                        variant="outline"
                                        className="h-9 rounded-xl text-[9px] font-black uppercase border-border"
                                        onClick={() => navigate(`/dashboard/copy-trading/trader/${trader.id}`)}
                                    >
                                        View Profile
                                    </Button>
                                    <Button
                                        variant="hero"
                                        className="h-9 rounded-xl text-[9px] font-black uppercase text-white shadow-gold"
                                        onClick={() => { setSelectedTrader(trader.id); setCopyAmount(""); }}
                                        disabled={isBeingCopied}
                                    >
                                        {isBeingCopied ? "Managed" : "Copy"}
                                    </Button>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            </div>
        )}

        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold font-sans text-foreground flex items-center gap-2">
                    Choose a Trader
                </h2>
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{filtered.length} trader{filtered.length !== 1 ? 's' : ''}</span>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filtered.map((trader, i) => {
                    const riskInfo = getRiskLabel(trader.risk_score || 0);
                    const isBeingCopied = activeSessions.some(s => String(s.traderId) === String(trader.id));
                    
                    const totalUserBalance = (user?.fiatBalanceNum || 0) + (user?.cryptoBalanceNum || 0) + balance.invested + balance.copyTrading;
                    const requiredBalance = trader.min_amount || 0;
                    const isLocked = totalUserBalance < requiredBalance;

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


                        <div className="absolute top-4 right-4 flex gap-2">
                             {trader.is_trending && (
                                <div className="bg-primary/10 text-primary px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest flex items-center gap-1 border border-primary/20 backdrop-blur-sm">
                                    <TrendingUp className="w-3 h-3" /> Trending
                                </div>
                             )}
                             {trader.ranking_level && (
                                <div className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest flex items-center gap-1 border border-primary/20 backdrop-blur-sm ${
                                    trader.ranking_level === 'Elite' ? 'bg-gradient-gold text-white shadow-gold border-transparent' : 'bg-primary/5 text-primary border-primary/10'
                                }`}>
                                    {trader.ranking_level}
                                </div>
                             )}
                        </div>

                        {isBeingCopied && (
                        <div className="absolute top-0 right-0 p-3 bg-primary text-white rounded-bl-2xl rounded-tr-3xl shadow-sm z-20">
                            <UserCheck className="w-5 h-5" />
                        </div>
                        )}

                        <div className="flex items-start justify-between mb-6">
                        <div className="flex items-center gap-4">
                            <div className={`w-16 h-16 rounded-2xl border border-border overflow-hidden shadow-sm relative ${
                                trader.ranking_level === 'Elite' ? 'ring-2 ring-primary ring-offset-2 ring-offset-background shadow-[0_0_20px_rgba(212,175,55,0.3)]' : ''
                            }`}>
                                <img src={trader.avatar_url || traderAvatar} alt="Trader" className="w-full h-full object-cover" />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
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
                                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{(trader.followers || 0).toLocaleString()} COPIERS</span>
                            </div>
                            </div>
                        </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mb-4">
                            <div className="p-3 rounded-xl bg-secondary/50 border border-border text-center">
                                <div className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                                    Risk Score
                                </div>
                                <div className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md inline-flex ${riskInfo.bg} ${riskInfo.color} border ${riskInfo.border}`}>
                                    {riskInfo.label}
                                </div>
                            </div>
                            <div className="p-3 rounded-xl bg-secondary/50 border border-border text-center">
                                <div className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                                    {trader.ranking_level || 'Beginner'} Avg ROI
                                </div>
                                <div className="text-sm font-black text-primary">
                                    {trader.monthly_roi || 0}%
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4 mb-6 text-xs font-semibold text-muted-foreground">
                             <div className="flex flex-wrap gap-1 mb-2">
                                {(trader.categories || []).map((cat: string) => (
                                    <span key={cat} className="px-2 py-0.5 rounded-md bg-secondary text-[8px] font-black uppercase tracking-tighter text-muted-foreground border border-border">
                                        {cat}
                                    </span>
                                ))}
                             </div>
                            <div className="flex justify-between items-center px-1">
                                <span>Win Rate</span>
                                <span className="text-foreground">{trader.win_rate || 0}%</span>
                            </div>
                            <div className="flex justify-between items-center px-1">
                                <span>Max Drawdown</span>
                                <span className="text-red-500">{trader.drawdown}%</span>
                            </div>
                            <div className="flex justify-between items-center px-1">
                                <span>Total Trades</span>
                                <span className="text-foreground">{trader.total_trades || 0}</span>
                            </div>

                            {trader.dedicated_features && trader.dedicated_features.length > 0 && (
                                <div className="mt-4 pt-4 border-t border-border/50">
                                    <div className="text-[9px] font-black uppercase text-muted-foreground mb-2">Dedicated Features</div>
                                    <ul className="space-y-1.5">
                                        {trader.dedicated_features.map((feat: string, idx: number) => (
                                            <li key={idx} className="flex gap-2 items-start text-[10px] text-foreground font-medium">
                                                <Zap className="w-3 h-3 text-primary shrink-0 mt-0.5" />
                                                <span>{feat}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>

                        <div className="flex items-center justify-between pt-4 mb-4 border-t border-border">
                            <div className="flex flex-col">
                                <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Min. Requirement</span>
                                <div className="flex items-baseline gap-1.5">
                                    <span className="text-foreground font-black text-sm">{formatCurrency(trader.min_amount || 0)}</span>
                                </div>
                            </div>
                            {!isLocked && !isBeingCopied && (
                               <div className="bg-green-500/10 text-green-500 px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5 border border-green-500/20">
                                   <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" /> Eligible
                               </div>
                            )}
                        </div>

                        {/* Interaction Logic */}
                        <div className="mt-auto">
                            {selectedTrader === trader.id ? (
                            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                                <div className="relative">
                                    <input
                                        placeholder={`Min $${(trader.min_amount || 100).toLocaleString()}`}
                                        type="number"
                                        value={copyAmount}
                                        onChange={(e) => setCopyAmount(e.target.value)}
                                        className="w-full h-12 bg-white border-border rounded-xl px-4 text-sm font-bold tabular-nums pr-12 focus:border-primary/50 transition-all outline-none text-zinc-950 shadow-inner"
                                    />
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-muted-foreground uppercase tracking-widest pointer-events-none">USDT</div>
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    <Button 
                                        variant="outline" 
                                        className="h-11 rounded-xl text-[10px] font-black uppercase text-muted-foreground border-border hover:bg-secondary"
                                        onClick={() => setSelectedTrader(null)}
                                    >
                                        Cancel
                                    </Button>
                                    <Button 
                                        variant="hero" 
                                        className="h-11 rounded-xl text-[10px] font-black uppercase text-white shadow-gold"
                                        onClick={handleInitiate}
                                        disabled={isProcessing === trader.id}
                                    >
                                        {isProcessing === trader.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <>Start Copy <ArrowUpRight className="w-3.5 h-3.5 ml-2" /></>}
                                    </Button>
                                </div>
                            </motion.div>
                            ) : (
                            <div className="grid grid-cols-2 gap-2">
                                <Button 
                                    variant="outline" 
                                    className="h-12 rounded-2xl text-[10px] font-black uppercase border-border bg-card group-hover:bg-secondary transition-colors"
                                    onClick={() => navigate(`/dashboard/copy-trading/trader/${trader.id}`)}
                                >
                                    Performance
                                </Button>
                                <Button 
                                    variant="hero" 
                                    className={`h-12 rounded-2xl text-[10px] font-black uppercase text-white transition-all ${isLocked ? 'bg-destructive/50 grayscale shadow-none' : 'shadow-gold group-hover:scale-[1.02]'}`}
                                    onClick={() => { 
                                        if (isLocked) {
                                            toast.error(`Minimum Balance Required: ${formatCurrency(requiredBalance)}`);
                                            return;
                                        }
                                        setSelectedTrader(trader.id); 
                                        setCopyAmount(""); 
                                    }}
                                    disabled={isBeingCopied}
                                >
                                    {isBeingCopied ? "Managed" : isLocked ? "Locked" : "Copy"}
                                </Button>

                            </div>
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
                            <h3 className="text-xl font-bold font-sans text-foreground">Confirm Copying</h3>
                            <p className="text-xs text-muted-foreground font-medium italic">Secure Trading Connection</p>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-4 rounded-2xl bg-secondary/50 border border-border">
                                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block mb-1">Trader to Copy</span>
                                <span className="text-sm font-black text-foreground">{traders.find(t => String(t.id) === String(selectedTrader))?.name}</span>
                            </div>
                            <div className="p-4 rounded-2xl bg-secondary/50 border border-border">
                                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block mb-1">Amount to Invest</span>
                                <span className="text-sm font-black text-primary">{formatCurrency(parseFloat(copyAmount) || 0)}</span>
                            </div>
                        </div>

                        <div className="p-5 rounded-2xl bg-amber-500/5 border border-amber-500/20 flex gap-4">
                            <AlertCircle className="w-5 h-5 text-amber-500 shrink-0" />
                            <p className="text-[11px] text-amber-700 leading-relaxed font-bold uppercase">
                                Your funds will be moved to your trading wallet. All trades from the expert will be copied to your account automatically.
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
                                I understand that past performance does not guarantee future results, and I accept full responsibility for my copy trading actions.
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
                            {isProcessing === true ? <Loader2 className="w-5 h-5 animate-spin" /> : "Start Copying"}
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
