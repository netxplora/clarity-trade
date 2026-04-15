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
  Zap,
  X,
  Clock,
  DollarSign,
  Eye,
  StopCircle,
  Info
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
  const [viewingTrader, setViewingTrader] = useState<any>(null);
  const [copyAmount, setCopyAmount] = useState("");
  const [stoppingSession, setStoppingSession] = useState<any>(null);
  
  const { balance, user, formatCurrency, activeSessions, fetchAppData } = useStore();
  const [traders, setTraders] = useState<any[]>([]);
  const [closedSessions, setClosedSessions] = useState<any[]>([]);
  const [executionLogs, setExecutionLogs] = useState<any[]>([]);
  const [isConfirming, setIsConfirming] = useState(false);
  const [isProcessing, setIsProcessing] = useState<string | boolean>(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const fetchDashboardData = useCallback(async () => {
    if (!user?.id) return;
    try {
        const [tradersRes, closedRes] = await Promise.all([
            supabase.from('copy_traders').select('*').order('followers', { ascending: false }),
            supabase.from('active_sessions').select('*').eq('user_id', user.id).in('status', ['stopped', 'settled']).order('updated_at', { ascending: false }).limit(20)
        ]);
            
        if (tradersRes.data) {
            setTraders(tradersRes.data);
        }

        if (closedRes.data) {
            setClosedSessions(closedRes.data.map(session => {
                const trader = tradersRes.data?.find(t => t.id === session.trader_id);
                return {
                    ...session,
                    avatar_url: trader?.avatar_url,
                    ranking_level: trader?.ranking_level
                };
            }));
        }
    } catch (err) {
        console.error("Dashboard Sync Error:", err);
    }
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id) return;
    fetchDashboardData();

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
      .on('postgres_changes', { event: '*', schema: 'public', table: 'copy_traders' }, () => fetchDashboardData())
      .on('postgres_changes', { 
          event: '*', 
          schema: 'public', 
          table: 'active_sessions', 
          filter: `user_id=eq.${user?.id}` 
      }, () => {
          fetchDashboardData();
          fetchAppData();
      })
      .subscribe();

    // Initial Logs Fetch
    const fetchLogs = async () => {
        if (!user?.id) return;
        const { data } = await supabase.from('copy_trading_logs').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(10);
        if (data) setExecutionLogs(data);
    }
    fetchLogs();

    return () => {
        supabase.removeChannel(logsSub);
    };
  }, [fetchDashboardData, user?.id]);

  const getRiskLabel = (score: number) => {
    if (score < 3) return { label: "LOW RISK", color: "text-green-600", bg: "bg-green-500/10", border: "border-green-500/20" };
    if (score < 7) return { label: "MEDIUM RISK", color: "text-orange-600", bg: "bg-orange-500/10", border: "border-orange-500/20" };
    return { label: "HIGH RISK", color: "text-red-600", bg: "bg-red-500/10", border: "border-red-500/20" };
  };

  const scoreToRiskLabel = (score: number) => {
     if (score < 3) return "Low";
     if (score < 7) return "Medium";
     return "High";
  };

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
            fetchAppData();
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

        const { error } = await supabase.from('active_sessions').update({ status: 'settled' }).eq('id', sessionId);
        
        if (!error) {
            toast.success(commissionDeducted > 0 
                ? `Settled: ${formatCurrency(netReturn)} (Incl. ${formatCurrency(commissionDeducted)} Fee)` 
                : "Copy trade stopped. Capital returned.");
            fetchDashboardData();
            fetchAppData();
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
        const session = activeSessions.find(s => s.id === sessionId);
        const { error } = await supabase.from('active_sessions').update({ status: newStatus }).eq('id', sessionId);
        
        if (!error) {
            // Log the action
            await supabase.from('notifications').insert({
                user_id: user?.id,
                title: newStatus === 'paused' ? 'Session Paused' : 'Session Resumed',
                message: `Your copy session with ${session?.trader_name || 'trader'} has been ${newStatus === 'paused' ? 'paused' : 'resumed'}.`,
                type: 'System'
            });
            toast.success(`Session ${newStatus === 'active' ? 'resumed' : 'paused'} successfully.`);
            fetchDashboardData();
            fetchAppData();
        } else {
            toast.error(error.message);
        }
    } catch (err) {
        toast.error("Failed to update session");
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

  const totalUserBalance = (user?.fiatBalanceNum || 0) + (user?.cryptoBalanceNum || 0) + balance.invested + balance.copyTrading;

  return (
    <DashboardLayout>
      <div className="space-y-8">

        {/* â”€â”€â”€ HEADER â”€â”€â”€ */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-border">
          <div>
            <h1 className="text-3xl font-bold font-sans text-foreground">Copy Trading</h1>
            <p className="text-muted-foreground mt-1 text-sm">Browse traders, review performance, and start copying.</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block">Available Balance</span>
              <span className="text-xl font-black text-foreground tabular-nums tracking-tight">{formatCurrency(balance.copyTrading)}</span>
            </div>
            <div className="w-px h-10 bg-border" />
            <div className="text-right">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block">Active Positions</span>
              <span className="text-xl font-black text-primary tabular-nums tracking-tight">{activeSessions.length}</span>
            </div>
          </div>
        </header>

        {/* â”€â”€â”€ PORTFOLIO SUMMARY â”€â”€â”€ */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-card p-5 rounded-2xl border border-border">
            <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">Total P&L</div>
            <div className={`text-2xl font-black tabular-nums tracking-tight ${dynamicTotalReturn >= 0 ? 'text-green-600' : 'text-red-500'}`}>
              {dynamicTotalReturn >= 0 ? "+" : ""}{formatCurrency(dynamicTotalReturn)}
            </div>
          </div>
          <div className="bg-card p-5 rounded-2xl border border-border">
            <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">ROI</div>
            <div className={`text-2xl font-black tabular-nums tracking-tight ${dynamicROI >= 0 ? 'text-green-600' : 'text-red-500'}`}>
              {dynamicROI >= 0 ? "+" : ""}{dynamicROI.toFixed(2)}%
            </div>
          </div>
          <div className="bg-card p-5 rounded-2xl border border-border">
            <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">Avg Win Rate</div>
            <div className="text-2xl font-black tabular-nums tracking-tight text-foreground">{avgWinRate}%</div>
          </div>
          <div className="bg-card p-5 rounded-2xl border border-border">
            <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">Allocated</div>
            <div className="text-2xl font-black tabular-nums tracking-tight text-foreground">{formatCurrency(totalAllocated)}</div>
          </div>
        </div>

        {/* ═══ ACTIVE SESSIONS ═══ */}
        {activeSessions.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                <Activity className="w-5 h-5 text-primary" /> Active Sessions
                <span className="text-xs font-bold text-muted-foreground ml-1">({activeSessions.length})</span>
              </h2>
              <span className="text-[10px] font-black text-green-600 bg-green-500/10 px-3 py-1 rounded-full uppercase tracking-widest border border-green-500/20 animate-pulse">Live</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {activeSessions.map((session) => {
                const traderMatch = traders.find(t => String(t.id) === String(session.trader_id));
                const sessionName = session.trader_name || session.traderName || traderMatch?.name || 'Trader';
                const sessionAvatar = session.avatar_url || traderMatch?.avatar_url || traderAvatar;
                const startedAt = session.created_at ? new Date(session.created_at) : null;
                const duration = startedAt ? Math.floor((Date.now() - startedAt.getTime()) / (1000 * 60 * 60)) : 0;
                const durationLabel = duration >= 24 ? `${Math.floor(duration / 24)}d ${duration % 24}h` : `${duration}h`;
                const currentValue = (session.allocated_amount || 0) + (session.pnl || 0);
                const roiPercent = session.allocated_amount > 0 ? ((session.pnl || 0) / session.allocated_amount * 100) : 0;
                const statusColor = session.status === 'active' ? 'text-green-600' : session.status === 'paused' ? 'text-amber-500' : 'text-muted-foreground';
                const statusBg = session.status === 'active' ? 'bg-green-500/10 border-green-500/20' : session.status === 'paused' ? 'bg-amber-500/10 border-amber-500/20' : 'bg-secondary border-border';
                const statusDot = session.status === 'active' ? 'bg-green-500' : session.status === 'paused' ? 'bg-amber-500' : 'bg-gray-400';

                return (
                  <motion.div key={session.id} layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-card border border-border rounded-2xl overflow-hidden group hover:shadow-md transition-shadow">
                    <div className="p-5 pb-4">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-11 h-11 rounded-xl bg-secondary border border-border flex items-center justify-center overflow-hidden font-bold text-primary shrink-0">
                            {sessionAvatar ? <img src={sessionAvatar} alt="" className="w-full h-full object-cover" /> : sessionName.charAt(0)}
                          </div>
                          <div>
                            <div className="text-sm font-bold text-foreground">{sessionName}</div>
                            <div className={`text-[9px] font-bold uppercase flex items-center gap-1.5 mt-0.5 ${statusColor}`}>
                              <div className={`w-1.5 h-1.5 rounded-full ${statusDot} ${session.status === 'active' ? 'animate-pulse' : ''}`} />
                              {session.status === 'active' ? 'Actively Copying' : session.status === 'paused' ? 'Paused' : session.status}
                            </div>
                          </div>
                        </div>
                        <span className={`text-[9px] font-bold uppercase px-2 py-1 rounded-lg border ${statusBg}`}>{session.status}</span>
                      </div>

                      <div className="grid grid-cols-2 gap-3 mb-4">
                        <div className="bg-secondary/50 rounded-xl p-3 border border-border/50">
                          <div className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider mb-1">P&L</div>
                          <div className={`text-lg font-black tabular-nums ${(session.pnl || 0) >= 0 ? "text-green-600" : "text-red-500"}`}>
                            {(session.pnl || 0) >= 0 ? "+" : ""}{formatCurrency(session.pnl || 0)}
                          </div>
                          <div className={`text-[10px] font-bold ${roiPercent >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                            {roiPercent >= 0 ? '+' : ''}{roiPercent.toFixed(2)}%
                          </div>
                        </div>
                        <div className="bg-secondary/50 rounded-xl p-3 border border-border/50">
                          <div className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Current Value</div>
                          <div className="text-lg font-black tabular-nums text-foreground">{formatCurrency(currentValue)}</div>
                          <div className="text-[10px] font-bold text-muted-foreground">of {formatCurrency(session.allocated_amount || 0)}</div>
                        </div>
                      </div>

                      <div className="h-1.5 bg-secondary rounded-full overflow-hidden mb-4">
                        <motion.div initial={{ width: 0 }} animate={{ width: `${Math.min(100, Math.max(5, (currentValue / (session.allocated_amount || 1)) * 100))}%` }} transition={{ duration: 1, ease: "easeOut" }} className={`h-full rounded-full ${(session.pnl || 0) >= 0 ? 'bg-green-500' : 'bg-red-500'}`} />
                      </div>

                      <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                        <span className="flex items-center gap-1 font-medium"><Clock className="w-3 h-3" /> {durationLabel} active</span>
                        <span className="flex items-center gap-1 font-medium"><DollarSign className="w-3 h-3" /> {formatCurrency(session.allocated_amount || 0)} allocated</span>
                      </div>
                    </div>

                    <div className="border-t border-border bg-secondary/20 p-3 grid grid-cols-2 gap-2">
                      <Button variant="outline" className="h-10 text-[10px] font-bold uppercase rounded-xl transition-all" onClick={() => handleTogglePause(session.id, session.status)} disabled={isProcessing === session.id || session.status === 'stopped'}>
                        {isProcessing === session.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : session.status === 'active' ? <><Pause className="w-3.5 h-3.5 mr-1.5" /> Pause</> : <><Play className="w-3.5 h-3.5 mr-1.5" /> Resume</>}
                      </Button>
                      <Button variant="outline" className="h-10 text-[10px] font-bold uppercase rounded-xl border-red-500/20 text-red-600 hover:bg-red-500/10 transition-all" onClick={() => setStoppingSession(session)} disabled={isProcessing === session.id}>
                        {isProcessing === session.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <><StopCircle className="w-3.5 h-3.5 mr-1.5" /> Stop & Settle</>}
                      </Button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}

        {/* ═══ STOP SESSION CONFIRMATION DIALOG ═══ */}
        {stoppingSession && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setStoppingSession(null)} />
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-card w-full max-w-md rounded-2xl shadow-xl relative z-10 border border-border overflow-hidden">
              <div className="p-6 space-y-5">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center border border-red-500/20">
                    <StopCircle className="w-6 h-6 text-red-500" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-foreground">Stop Copy Session</h3>
                    <p className="text-xs text-muted-foreground">This action will settle your position</p>
                  </div>
                </div>

                <div className="bg-secondary/50 rounded-xl p-4 border border-border space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase">Trader</span>
                    <span className="text-sm font-bold text-foreground">{stoppingSession.trader_name || stoppingSession.traderName || 'Trader'}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase">Invested</span>
                    <span className="text-sm font-bold text-foreground">{formatCurrency(stoppingSession.allocated_amount || 0)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase">Current P&L</span>
                    <span className={`text-sm font-black ${(stoppingSession.pnl || 0) >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                      {(stoppingSession.pnl || 0) >= 0 ? '+' : ''}{formatCurrency(stoppingSession.pnl || 0)}
                    </span>
                  </div>
                  <div className="border-t border-border pt-2 flex justify-between items-center">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase">Estimated Return</span>
                    <span className="text-sm font-black text-foreground">{formatCurrency((stoppingSession.allocated_amount || 0) + (stoppingSession.pnl || 0))}</span>
                  </div>
                </div>

                <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 flex gap-2.5">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <p className="text-[11px] text-amber-600 font-medium leading-relaxed">
                    Are you sure you want to stop this session? Your capital and any profit (minus platform fees) will be returned to your copy trading balance.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <Button variant="outline" className="h-12 rounded-xl text-xs font-bold uppercase" onClick={() => setStoppingSession(null)}>Cancel</Button>
                  <Button variant="outline" className="h-12 rounded-xl text-xs font-bold uppercase border-red-500/20 text-red-600 hover:bg-red-500/10" onClick={async () => {
                    const sessionId = stoppingSession.id;
                    setStoppingSession(null);
                    await handleStopCopy(sessionId);
                  }} disabled={isProcessing === stoppingSession.id}>
                    {isProcessing === stoppingSession.id ? <Loader2 className="w-4 h-4 animate-spin" /> : "Confirm & Stop"}
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {/* â”€â”€â”€ CLOSED SESSIONS HISTORY â”€â”€â”€ */}
        {closedSessions.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
              <RotateCcw className="w-4 h-4 opacity-50" /> Past Trades
              <span className="ml-auto text-[10px] font-bold text-green-600 bg-green-500/10 px-2 py-0.5 rounded-full border border-green-500/20">
                Total: {formatCurrency(closedSessions.reduce((a, s) => a + (s.pnl || 0), 0))}
              </span>
            </h3>
            <div className="bg-card border border-border rounded-2xl overflow-hidden">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest border-b border-border bg-secondary/30">
                    <th className="p-3">Trader</th><th className="p-3">Invested</th><th className="p-3">P&L</th><th className="p-3 text-right">Closed</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {closedSessions.slice(0, 10).map((s) => (
                    <tr key={s.id} className="text-xs font-medium">
                      <td className="p-3 font-bold text-foreground">{s.traderName || s.trader_name}</td>
                      <td className="p-3 text-muted-foreground">{formatCurrency(s.allocated_amount)}</td>
                      <td className={`p-3 font-bold ${(s.pnl || 0) >= 0 ? 'text-green-600' : 'text-red-500'}`}>{(s.pnl || 0) >= 0 ? '+' : ''}{formatCurrency(s.pnl || 0)}</td>
                      <td className="p-3 text-right text-muted-foreground">{new Date(s.updated_at).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* â”€â”€â”€ LIVE EXECUTION LOG â”€â”€â”€ */}
        {executionLogs.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary" /> Live Trade Feed
            </h3>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {executionLogs.map((log) => (
                <div key={log.id} className="flex items-center justify-between p-3 rounded-xl bg-secondary/30 border border-border/50 text-xs">
                  <div className="flex items-center gap-3">
                    <div className={`p-1.5 rounded-lg ${log.type === 'Buy' ? 'bg-green-500/10 text-green-600' : 'bg-red-500/10 text-red-500'}`}>
                      <TrendingUp className={`w-3 h-3 ${log.type !== 'Buy' ? 'rotate-180' : ''}`} />
                    </div>
                    <div>
                      <span className="font-bold text-foreground">{log.pair}</span>
                      <span className="text-muted-foreground ml-2">{log.type}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-foreground">{formatCurrency(log.amount)}</div>
                    <div className={`font-bold ${log.pnl >= 0 ? 'text-green-600' : 'text-red-500'}`}>{log.pnl >= 0 ? '+' : ''}{formatCurrency(log.pnl)}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* â”€â”€â”€ BROWSE TRADERS â”€â”€â”€ */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-foreground">Browse Traders</h2>
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{filtered.length} available</span>
          </div>

          {/* Filter Toolbar */}
          <div className="flex flex-col lg:flex-row gap-4 items-stretch bg-card p-4 rounded-2xl border border-border">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                placeholder="Search traders..."
                className="w-full h-11 bg-secondary border border-border rounded-xl pl-10 pr-4 text-sm font-medium outline-none focus:border-primary/50 transition-all placeholder:text-muted-foreground/50 text-foreground"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {(["All", "Crypto", "Forex", "Commodities"] as CategoryFilter[]).map((cat) => (
                <button key={cat} onClick={() => setCategoryFilter(cat)} className={`px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all border ${categoryFilter === cat ? "bg-primary/10 text-primary border-primary/30" : "bg-secondary text-muted-foreground border-border hover:text-foreground"}`}>
                  {cat}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <select value={tierFilter} onChange={(e) => setTierFilter(e.target.value as TierFilter)} className="h-11 px-3 rounded-xl bg-secondary border border-border text-[10px] font-bold uppercase text-foreground outline-none cursor-pointer">
                <option value="All">All Tiers</option>
                <option value="Starter">Starter</option>
                <option value="Silver">Silver</option>
                <option value="Gold">Gold</option>
                <option value="Elite">Elite</option>
              </select>
              <select value={riskFilter} onChange={(e) => setRiskFilter(e.target.value as RiskFilter)} className="h-11 px-3 rounded-xl bg-secondary border border-border text-[10px] font-bold uppercase text-foreground outline-none cursor-pointer">
                <option value="all">All Risk</option>
                <option value="low">Low Risk</option>
                <option value="medium">Medium Risk</option>
                <option value="high">High Risk</option>
              </select>
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value as SortOption)} className="h-11 px-3 rounded-xl bg-secondary border border-border text-[10px] font-bold uppercase text-foreground outline-none cursor-pointer">
                <option value="default">Sort: Rank</option>
                <option value="roi">Highest ROI</option>
                <option value="winRate">Win Rate</option>
                <option value="risk">Lowest Risk</option>
                <option value="followers">Most Copied</option>
                <option value="newest">Newest</option>
              </select>
            </div>
          </div>

          {/* Trader Cards Grid */}
          {filtered.length === 0 ? (
            <div className="text-center py-16 bg-card rounded-2xl border border-border">
              <Search className="w-10 h-10 text-muted-foreground/30 mx-auto mb-4" />
              <p className="text-sm font-bold text-muted-foreground">No traders match your filters.</p>
              <p className="text-xs text-muted-foreground/60 mt-1">Try adjusting your search or category selection.</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map((trader, i) => {
                const riskInfo = getRiskLabel(trader.risk_score || 0);
                const isBeingCopied = activeSessions.some(s => String(s.traderId) === String(trader.id));
                const requiredBalance = trader.min_amount || 0;
                const isLocked = totalUserBalance < requiredBalance;

                return (
                  <motion.div
                    key={trader.id}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className={`bg-card rounded-2xl border overflow-hidden flex flex-col transition-all group ${isBeingCopied ? 'border-primary/40 ring-1 ring-primary/10' : 'border-border hover:border-primary/20'}`}
                  >
                    {/* Trader Header */}
                    <div className="p-6 pb-4">
                      <div className="flex items-start gap-4 mb-4">
                        <div className={`w-14 h-14 rounded-xl border overflow-hidden shrink-0 ${trader.ranking_level === 'Elite' ? 'ring-2 ring-primary ring-offset-2 ring-offset-background' : 'border-border'}`}>
                          <img src={trader.avatar_url || traderAvatar} alt="" className="w-full h-full object-cover" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-foreground truncate">{trader.name}</h4>
                            <ShieldCheck className="w-4 h-4 text-primary shrink-0" />
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <div className="flex text-amber-400">{[1,2,3,4,5].map((s) => <Star key={s} className="w-3 h-3 fill-current" />)}</div>
                            <span className="text-[9px] font-bold text-muted-foreground uppercase">{(trader.followers || 0).toLocaleString()} copiers</span>
                          </div>
                          <div className="flex flex-wrap gap-1 mt-2">
                            {(trader.categories || []).map((cat: string) => (
                              <span key={cat} className="px-2 py-0.5 rounded bg-secondary text-[8px] font-bold uppercase text-muted-foreground border border-border">{cat}</span>
                            ))}
                            {trader.ranking_level && (
                              <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase ${trader.ranking_level === 'Elite' ? 'bg-primary/10 text-primary' : 'bg-secondary text-muted-foreground'} border border-border`}>{trader.ranking_level}</span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Badges */}
                      {isBeingCopied && (
                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-primary bg-primary/5 px-3 py-1.5 rounded-lg border border-primary/20 mb-3">
                          <UserCheck className="w-3.5 h-3.5" /> You are currently copying this trader
                        </div>
                      )}

                      {/* Stats Grid */}
                      <div className="grid grid-cols-3 gap-2 mt-2">
                        <div className="p-2.5 rounded-lg bg-secondary/50 text-center">
                          <div className="text-[9px] font-bold text-muted-foreground uppercase mb-0.5">ROI</div>
                          <div className="text-sm font-black text-green-600">+{trader.roi || 0}%</div>
                        </div>
                        <div className="p-2.5 rounded-lg bg-secondary/50 text-center">
                          <div className="text-[9px] font-bold text-muted-foreground uppercase mb-0.5">Win Rate</div>
                          <div className="text-sm font-black text-foreground">{trader.win_rate || 0}%</div>
                        </div>
                        <div className="p-2.5 rounded-lg bg-secondary/50 text-center">
                          <div className="text-[9px] font-bold text-muted-foreground uppercase mb-0.5">Risk</div>
                          <div className={`text-[10px] font-bold ${riskInfo.color}`}>{riskInfo.label}</div>
                        </div>
                      </div>

                      {/* Extended Stats */}
                      <div className="mt-3 space-y-1.5 text-xs text-muted-foreground">
                        <div className="flex justify-between"><span>Max Drawdown</span><span className="text-red-500 font-bold">{trader.drawdown || 0}%</span></div>
                        <div className="flex justify-between"><span>Total Trades</span><span className="text-foreground font-bold">{trader.total_trades || 0}</span></div>
                      </div>

                      {/* Dedicated Features */}
                      {trader.dedicated_features && trader.dedicated_features.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-border/50">
                          <div className="text-[9px] font-bold uppercase text-muted-foreground mb-1.5">Features</div>
                          <div className="space-y-1">
                            {trader.dedicated_features.map((feat: string, idx: number) => (
                              <div key={idx} className="flex gap-1.5 items-center text-[10px] text-foreground">
                                <Zap className="w-3 h-3 text-primary shrink-0" /> {feat}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Minimum Balance & Action */}
                    <div className="mt-auto border-t border-border bg-secondary/20 p-4 space-y-3">
                      {/* Min Balance Display */}
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Min. Balance Required</div>
                          <div className="text-base font-black text-foreground">{formatCurrency(requiredBalance)}</div>
                        </div>
                        {isLocked ? (
                          <div className="bg-red-500/10 text-red-600 px-3 py-1.5 rounded-lg text-[9px] font-bold uppercase border border-red-500/20 flex items-center gap-1.5">
                            <AlertCircle className="w-3 h-3" /> Insufficient
                          </div>
                        ) : !isBeingCopied ? (
                          <div className="bg-green-500/10 text-green-600 px-3 py-1.5 rounded-lg text-[9px] font-bold uppercase border border-green-500/20 flex items-center gap-1.5">
                            <ShieldCheck className="w-3 h-3" /> Eligible
                          </div>
                        ) : null}
                      </div>

                      {/* Locked Message */}
                      {isLocked && (
                        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-[10px] text-red-600 font-medium">
                          Your account balance ({formatCurrency(totalUserBalance)}) is below the minimum required ({formatCurrency(requiredBalance)}). Please deposit or transfer funds to start copying.
                        </div>
                      )}

                      {/* Copy Action */}
                      {selectedTrader === trader.id ? (
                        <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
                          <div className="relative">
                            <Wallet className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <input
                              placeholder={`Min ${formatCurrency(trader.min_amount || 100)}`}
                              type="number"
                              value={copyAmount}
                              onChange={(e) => setCopyAmount(e.target.value)}
                              className="w-full h-11 bg-secondary/50 border border-border rounded-xl pl-10 pr-16 text-sm font-bold tabular-nums outline-none focus:border-primary/50 text-foreground"
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-muted-foreground">USDT</span>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <Button variant="outline" className="h-10 rounded-xl text-[10px] font-bold uppercase" onClick={() => setSelectedTrader(null)}>Cancel</Button>
                            <Button variant="hero" className="h-10 rounded-xl text-[10px] font-bold uppercase text-white shadow-gold" onClick={handleInitiate} disabled={isProcessing === trader.id}>
                              {isProcessing === trader.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <>Copy Trader <ArrowUpRight className="w-3.5 h-3.5 ml-1" /></>}
                            </Button>
                          </div>
                        </motion.div>
                      ) : (
                        <div className="grid grid-cols-2 gap-2">
                          <Button 
                            variant="outline" 
                            className="h-11 rounded-xl text-[10px] font-bold uppercase border-border hover:bg-secondary transition-colors"
                            onClick={() => setViewingTrader(trader)}
                          >
                            Review Profile
                          </Button>
                          <Button
                            variant={isLocked ? "outline" : "hero"}
                            className={`h-11 rounded-xl text-[10px] font-bold uppercase tracking-wider ${isLocked ? 'border-red-500/20 text-red-500 hover:bg-red-500/10' : isBeingCopied ? 'bg-secondary text-muted-foreground border border-border cursor-default' : 'text-white shadow-gold'}`}
                            onClick={() => {
                              if (isLocked) {
                                toast.error(`Your balance is below the minimum requirement of ${formatCurrency(requiredBalance)}. Please deposit funds.`);
                                return;
                              }
                              if (!isBeingCopied) {
                                setSelectedTrader(trader.id);
                                setCopyAmount("");
                              }
                            }}
                            disabled={isBeingCopied}
                          >
                            {isBeingCopied ? <><UserCheck className="w-3.5 h-3.5 mr-1.5" /> Copying</> : isLocked ? <><AlertCircle className="w-3.5 h-3.5 mr-1.5" /> Locked</> : <>Copy <ArrowUpRight className="w-3.5 h-3.5 ml-1.5" /></>}
                          </Button>
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>

        {/* â”€â”€â”€ HOW IT WORKS â”€â”€â”€ */}
        <div className="grid md:grid-cols-3 gap-6 pt-4">
          <div className="bg-card border border-border p-6 rounded-2xl">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-4"><Target className="w-5 h-5 text-primary" /></div>
            <h3 className="text-sm font-bold text-foreground mb-2">1. Choose a Trader</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">Browse verified traders by performance, risk level, and asset category.</p>
          </div>
          <div className="bg-card border border-border p-6 rounded-2xl">
            <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center mb-4"><Wallet className="w-5 h-5 text-green-600" /></div>
            <h3 className="text-sm font-bold text-foreground mb-2">2. Set Your Budget</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">Allocate capital from your copy trading balance. You control the amount.</p>
          </div>
          <div className="bg-card border border-border p-6 rounded-2xl">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center mb-4"><Activity className="w-5 h-5 text-amber-600" /></div>
            <h3 className="text-sm font-bold text-foreground mb-2">3. Auto-Copy Trades</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">Trades are mirrored automatically. Pause or stop anytime you want.</p>
          </div>
        </div>
      </div>

      {/* â”€â”€â”€ CONFIRMATION MODAL â”€â”€â”€ */}
      <AnimatePresence>
        {isConfirming && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-card border border-border w-full max-w-md rounded-2xl p-6 space-y-6 shadow-xl">
              <div className="flex items-center gap-3 pb-4 border-b border-border">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center"><TrendingUp className="w-6 h-6 text-primary" /></div>
                <div>
                  <h3 className="text-lg font-bold text-foreground">Confirm Copy Trading</h3>
                  <p className="text-xs text-muted-foreground">Review the details below before proceeding.</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-4 rounded-xl bg-secondary/50 border border-border">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase block mb-1">Trader</span>
                  <span className="text-sm font-bold text-foreground">{traders.find(t => String(t.id) === String(selectedTrader))?.name}</span>
                </div>
                <div className="p-4 rounded-xl bg-secondary/50 border border-border">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase block mb-1">Amount</span>
                  <span className="text-sm font-bold text-primary">{formatCurrency(parseFloat(copyAmount) || 0)}</span>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 flex gap-3">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <p className="text-[11px] text-amber-600 font-medium leading-relaxed">
                  Your funds will be allocated to mirror trades from this expert. You can stop the session at any time.
                </p>
              </div>

              <div className="flex items-start gap-3">
                <input type="checkbox" id="terms-modal" checked={agreedToTerms} onChange={(e) => setAgreedToTerms(e.target.checked)} className="mt-1 w-4 h-4 rounded border-border text-primary" />
                <label htmlFor="terms-modal" className="text-[10px] text-muted-foreground leading-relaxed">
                  I understand that past performance does not guarantee future results, and I accept full responsibility for my copy trading decisions.
                </label>
              </div>

              <div className="flex flex-col gap-2">
                <Button variant="hero" className="h-12 rounded-xl text-white font-bold uppercase text-sm shadow-gold" onClick={confirmCopy} disabled={isProcessing === true || !agreedToTerms}>
                  {isProcessing === true ? <Loader2 className="w-5 h-5 animate-spin" /> : "Start Copying"}
                </Button>
                <Button variant="ghost" className="h-9 text-xs text-muted-foreground uppercase" onClick={() => setIsConfirming(false)}>Cancel</Button>
              </div>
            </motion.div>
          </div>
        )}

        {/* â”€â”€â”€ TRADER PROFILE MODAL â”€â”€â”€ */}
        {viewingTrader && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setViewingTrader(null)} />
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-card w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl shadow-xl relative z-10 hidden-scrollbar border border-border">
              <div className="sticky top-0 bg-card/90 backdrop-blur-md z-20 flex items-center justify-between p-4 px-6 border-b border-border">
                <h3 className="font-bold text-foreground flex items-center gap-2"><UserCheck className="w-4 h-4 text-primary" /> Trader Profile</h3>
                <button onClick={() => setViewingTrader(null)} className="p-2 hover:bg-secondary rounded-full transition-colors"><X className="w-5 h-5 text-muted-foreground" /></button>
              </div>

              <div className="p-6 space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row gap-5 items-start sm:items-center">
                  <div className={`w-20 h-20 rounded-xl overflow-hidden shrink-0 border-2 ${viewingTrader.ranking_level === 'Elite' ? 'border-primary ring-2 ring-primary/20 ring-offset-2 ring-offset-background' : 'border-border'}`}>
                    <img src={viewingTrader.avatar_url || traderAvatar} alt="" className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h2 className="text-2xl font-black text-foreground">{viewingTrader.name}</h2>
                      <ShieldCheck className="w-5 h-5 text-green-500" />
                    </div>
                    <div className="flex flex-wrap gap-2 text-[10px] font-bold uppercase">
                      {(viewingTrader.categories || ['General']).map((c: string) => (
                        <span key={c} className="px-2 py-1 bg-secondary text-muted-foreground rounded-lg border border-border">{c}</span>
                      ))}
                      <span className="px-2 py-1 bg-primary/10 text-primary rounded-lg border border-primary/20">{viewingTrader.followers || 0} Followers</span>
                    </div>
                  </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="bg-secondary/50 p-4 rounded-xl border border-border text-center">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase text-center block mb-1">Total ROI</span>
                    <span className="text-xl font-black text-green-600">+{viewingTrader.roi || 0}%</span>
                  </div>
                  <div className="bg-secondary/50 p-4 rounded-xl border border-border text-center">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase text-center block mb-1">Win Rate</span>
                    <span className="text-xl font-black text-foreground">{viewingTrader.win_rate || 0}%</span>
                  </div>
                  <div className="bg-secondary/50 p-4 rounded-xl border border-border text-center">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase text-center block mb-1">Max Drawdown</span>
                    <span className="text-xl font-black text-red-500">{viewingTrader.drawdown || 0}%</span>
                  </div>
                  <div className="bg-secondary/50 p-4 rounded-xl border border-border text-center">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase text-center block mb-1">Total Trades</span>
                    <span className="text-xl font-black text-foreground">{viewingTrader.total_trades || 0}</span>
                  </div>
                </div>

                {/* Strategy Info */}
                <div className="bg-secondary/20 p-5 rounded-xl border border-border">
                  <h4 className="text-[11px] font-black uppercase tracking-wider text-foreground mb-2 flex items-center gap-1.5"><Activity className="w-4 h-4 text-primary" /> Trading Strategy</h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    This verified master trader employs a {scoreToRiskLabel(viewingTrader.risk_score || 0).toLowerCase()}-risk methodology across multiple asset classes to ensure steady, long-term capital appreciation. Drawdowns are strictly monitored to preserve capital during extreme market volatility.
                  </p>
                </div>

                {/* Features */}
                {viewingTrader.dedicated_features?.length > 0 && (
                  <div>
                    <h4 className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider mb-3">Dedicated Features</h4>
                    <div className="grid sm:grid-cols-2 gap-2 text-sm text-foreground">
                      {viewingTrader.dedicated_features.map((f: string, i: number) => (
                        <div key={i} className="flex items-center gap-2 bg-secondary/50 px-3 py-2 rounded-lg border border-border">
                          <Zap className="w-3.5 h-3.5 text-primary shrink-0" /> {f}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Min Amount & Actions */}
                <div className="bg-card border-t border-border mt-4 -mx-6 -mb-6 p-6 space-y-4">
                  <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                    <div>
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block mb-1">Min. Requirement</span>
                      <div className="text-base font-black text-foreground">{formatCurrency(viewingTrader.min_amount || 100)}</div>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block mb-1">Your Total Balance</span>
                      <div className={`text-base font-black ${balance.total < (viewingTrader.min_amount || 100) ? 'text-red-500' : 'text-green-500'}`}>
                        {formatCurrency(balance.total)}
                      </div>
                    </div>
                  </div>

                  {balance.total < (viewingTrader.min_amount || 0) && (
                    <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-[10px] text-red-600 font-medium flex items-center gap-2">
                       <AlertCircle className="w-3.5 h-3.5 shrink-0" /> Balance insufficient to copy this trader. Please deposit funds.
                    </div>
                  )}

                  {!activeSessions.some(s => String(s.trader_id) === String(viewingTrader.id) || String(s.traderId) === String(viewingTrader.id)) && balance.total >= (viewingTrader.min_amount || 0) && (
                    <div className="relative">
                      <Wallet className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <input
                        type="number"
                        placeholder={`Provide allocation (Min ${formatCurrency(viewingTrader.min_amount || 100)})`}
                        value={copyAmount}
                        onChange={(e) => setCopyAmount(e.target.value)}
                        className="w-full h-12 bg-secondary/50 border border-border rounded-xl pl-9 pr-16 text-sm font-bold tabular-nums outline-none focus:border-primary/50 text-foreground"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-muted-foreground">USDT</span>
                    </div>
                  )}

                  <div className="flex gap-2 pt-2">
                    <Button variant="outline" className="flex-1 h-12 rounded-xl text-xs font-bold uppercase transition-colors" onClick={() => setViewingTrader(null)}>Cancel</Button>
                    <Button variant="hero" className="flex-1 h-12 rounded-xl text-xs font-bold uppercase text-white shadow-gold" onClick={() => {
                        const requiredBalance = viewingTrader.min_amount || 0;
                        const isLocked = balance.total < requiredBalance;
                        const isBeingCopied = activeSessions.some(s => String(s.trader_id) === String(viewingTrader.id) || String(s.traderId) === String(viewingTrader.id));

                        if (isLocked) {
                          toast.error(`Your balance is below the minimum requirement of ${formatCurrency(requiredBalance)}`);
                          return;
                        }
                        if (isBeingCopied) {
                          toast.error("You are already active and copying this trader.");
                          return;
                        }

                        const amountNum = parseFloat(copyAmount);
                        if (!amountNum || amountNum < requiredBalance) {
                            toast.error(`Minimum allocation for this trader is ${formatCurrency(requiredBalance)}`);
                            return;
                        }
                        if (amountNum > balance.copyTrading) {
                            toast.error("Insufficient copy trading balance. Use the Transfer module to move funds.");
                            return;
                        }
                        
                        setSelectedTrader(viewingTrader.id);
                        setViewingTrader(null);
                        setIsConfirming(true);
                    }}
                    disabled={balance.total < (viewingTrader.min_amount || 0) || activeSessions.some(s => String(s.trader_id) === String(viewingTrader.id) || String(s.traderId) === String(viewingTrader.id))}
                    >
                      {activeSessions.some(s => String(s.trader_id) === String(viewingTrader.id) || String(s.traderId) === String(viewingTrader.id)) ? "Already Copying" : "Proceed to Confirm"}
                    </Button>
                  </div>
                </div>

              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </DashboardLayout>
  );
};

export default CopyTradingPage;
