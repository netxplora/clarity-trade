import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  TrendingUp, Users, Star, ShieldCheck, Target, 
  Activity, Zap, ArrowUpRight, 
  BarChart3, PieChart, Globe, Coins, Lock, CheckCircle2,
  Clock, History as HistoryIcon, LayoutDashboard, Database, 
  ChevronLeft, AlertCircle, ShieldAlert, Loader2, Info, Calendar
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { createChart, ColorType, AreaSeries, IChartApi } from "lightweight-charts";
import { useStore } from "@/store/useStore";
import { supabase } from "@/lib/supabase";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { toast } from "sonner";

const TraderProfilePage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const chartContainerRef = useRef<HTMLDivElement>(null);
    const chartRef = useRef<IChartApi | null>(null);
    const { formatCurrency, user } = useStore();
    
    const [trader, setTrader] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'performance' | 'history' | 'stats'>('performance');
    const [isProcessing, setIsProcessing] = useState(false);

    const [balance, setBalance] = useState({ trading: 0, copyTrading: 0 });

    const fetchTrader = async () => {
        try {
            const { data, error } = await supabase
                .from('copy_traders')
                .select('*')
                .eq('id', id)
                .single();
            
            if (error) throw error;
            setTrader(data);

            const { data: bData } = await supabase.from('balances').select('*').eq('user_id', user?.id).maybeSingle();
            if (bData) {
                setBalance({ trading: bData.trading_balance || 0, copyTrading: bData.copy_trading_balance || 0 });
            }
        } catch (err) {
            console.error("Error fetching trader:", err);
            toast.error("Failed to load trader profile");
            navigate('/dashboard/copy-trading');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTrader();
    }, [id]);

    useEffect(() => {
        if (!trader || !chartContainerRef.current || activeTab !== 'performance') return;

        const container = chartContainerRef.current;
        
        const chart = createChart(container, {
            layout: {
                background: { type: ColorType.Solid, color: 'transparent' },
                textColor: '#64748b',
                fontFamily: 'Inter, sans-serif',
            },
            grid: {
                vertLines: { color: 'rgba(148, 163, 184, 0.05)' },
                horzLines: { color: 'rgba(148, 163, 184, 0.05)' },
            },
            width: container.clientWidth || 800,
            height: 320,
            rightPriceScale: {
                borderVisible: false,
                scaleMargins: { top: 0.1, bottom: 0.1 },
            },
            timeScale: {
                borderVisible: false,
            },
            crosshair: {
                vertLine: { color: '#D4AF37', labelBackgroundColor: '#D4AF37' },
                horzLine: { color: '#D4AF37', labelBackgroundColor: '#D4AF37' },
            },
        });

        const areaSeries = chart.addSeries(AreaSeries, {
            lineColor: '#D4AF37',
            topColor: 'rgba(212, 175, 55, 0.2)',
            bottomColor: 'rgba(212, 175, 55, 0)',
            lineWidth: 3,
            priceLineVisible: false,
        });

        // Generate deterministic data based on trader ROI
        const data: any[] = [];
        let baseValue = 1000;
        const now = new Date();
        const roiFactor = (trader.roi || 50) / 100;
        
        for (let i = 0; i < 180; i++) {
            const time = new Date(now.getTime() - (180 - i) * 24 * 60 * 60 * 1000);
            const dailyBias = (roiFactor / 180) * (Math.random() * 2);
            const volatility = (trader.risk_score || 5) / 100;
            const change = (Math.random() - 0.45 + dailyBias) * baseValue * volatility;
            baseValue += change;
            data.push({ time: time.toISOString().split('T')[0], value: baseValue });
        }

        areaSeries.setData(data);
        chart.timeScale().fitContent();
        chartRef.current = chart;

        const handleResize = () => {
            if (container && chartRef.current) {
                chartRef.current.applyOptions({ width: container.clientWidth });
            }
        };

        window.addEventListener('resize', handleResize);
        return () => {
            window.removeEventListener('resize', handleResize);
            chart.remove();
        };
    }, [trader, activeTab]);

    const riskLabel = (score: number) => {
        if (score <= 3) return { label: 'Conservative', color: 'text-green-500', bg: 'bg-green-500/10' };
        if (score <= 6) return { label: 'Moderate', color: 'text-amber-500', bg: 'bg-amber-500/10' };
        return { label: 'Aggressive', color: 'text-red-500', bg: 'bg-red-500/10' };
    };

    if (loading) {
        return (
            <DashboardLayout>
                <div className="flex items-center justify-center min-h-[60vh]">
                    <div className="flex flex-col items-center gap-4">
                        <Loader2 className="w-10 h-10 text-primary animate-spin" />
                        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Loading Trader Profile...</p>
                    </div>
                </div>
            </DashboardLayout>
        );
    }

    if (!trader) {
        return (
            <DashboardLayout>
                <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6">
                    <div className="w-20 h-20 rounded-[2rem] bg-secondary flex items-center justify-center border border-border">
                        <ShieldAlert className="w-10 h-10 text-muted-foreground" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-black text-foreground uppercase tracking-tight">Trader Not Found</h2>
                        <p className="text-sm text-muted-foreground font-medium mt-2">The requested trader profile could not be loaded.</p>
                    </div>
                    <Button 
                        variant="outline" 
                        onClick={() => navigate('/dashboard/copy-trading')}
                        className="h-12 px-8 uppercase text-[10px] font-black tracking-widest border-border"
                    >
                        Return to Traders
                    </Button>
                </div>
            </DashboardLayout>
        );
    }

    const risk = riskLabel(trader.risk_score || 5);
    const totalUserBalance = (user?.fiatBalanceNum || 0) + (user?.cryptoBalanceNum || 0) + balance.trading + balance.copyTrading;
    const isLocked = totalUserBalance < (trader.min_amount || 0);

    return (
        <DashboardLayout>
            <div className="max-w-6xl mx-auto space-y-6 pb-20">
                {/* 🧭 Breadcrumb & Back */}
                <button 
                    onClick={() => navigate('/dashboard/copy-trading')}
                    className="flex items-center gap-2 text-[10px] font-black uppercase text-muted-foreground hover:text-primary transition-colors group"
                >
                    <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                    Back to Traders
                </button>

                {/* 🏛️ Profile Hero Section - Full Width */}
                <div className="relative rounded-[3rem] overflow-hidden border border-[#D4AF37]/20 bg-[#0B0F14] shadow-huge">
                    <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-[#D4AF37]/10 via-transparent to-transparent pointer-events-none" />
                    <div className="absolute top-0 right-0 w-[40%] h-full bg-gradient-to-l from-black/40 to-transparent z-0" />
                    
                    <div className="relative z-10 pt-6 md:pt-10 pb-4 md:pb-6 px-6 md:px-10 flex flex-col md:flex-row items-center md:items-start gap-6 md:gap-x-10">
                        <div className="relative shrink-0">
                            <div className="w-24 h-24 md:w-32 md:h-32 rounded-[2rem] bg-gradient-to-br from-[#D4AF37] via-[#FFD700] to-[#B8860B] p-[1.5px] shadow-[0_0_40px_rgba(212,175,55,0.15)]">
                                <div className="w-full h-full rounded-[1.8rem] overflow-hidden bg-[#12161C]">
                                    <img 
                                        src={trader.avatar_url || "https://images.unsplash.com/photo-1560250097-0b93528c311a?q=80&w=256&auto=format&fit=crop"} 
                                        alt={trader.name} 
                                        className="w-full h-full object-cover scale-105"
                                    />
                                </div>
                            </div>
                            <div className="absolute -bottom-2 -right-2 bg-green-500 text-gray-950 p-2 rounded-2xl shadow-lg border-4 border-[#0B0F14]">
                                <CheckCircle2 className="w-5 h-5" />
                            </div>
                        </div>

                        <div className="flex-1 text-center md:text-left space-y-3">
                            <div className="flex flex-col md:flex-row md:items-center gap-3">
                                <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">{trader.name}</h1>
                                <span className={`px-4 py-1.5 rounded-full text-[11px] font-black uppercase tracking-widest border shadow-sm ${risk.bg} ${risk.color} border-current/20 w-fit mx-auto md:mx-0`}>
                                    {risk.label} Risk Profile
                                </span>
                            </div>

                            <div className="flex flex-wrap justify-center md:justify-start items-center gap-6 text-[11px] font-black text-muted-foreground/60 uppercase tracking-widest">
                                <div className="flex items-center gap-2">
                                    <Database className="w-4 h-4 text-[#D4AF37]" />
                                    <span>TRADER ID: <span className="text-white">CL-{String(trader.id || 'ELITEPR').substring(0, 8).toUpperCase()}</span></span>
                                </div>
                                <div className="w-1.5 h-1.5 rounded-full bg-white/10" />
                                <div className="flex items-center gap-2">
                                    <Calendar className="w-4 h-4 text-[#D4AF37]" />
                                    <span>INSTITUTIONAL TENURE: <span className="text-[#D4AF37]">SINCE {trader.joined_date || "JAN 2023"}</span></span>
                                </div>
                            </div>

                            <p className="text-xs md:text-sm font-medium text-gray-400 max-w-xl leading-relaxed">
                                Professional trader specializing in {trader.categories?.join(" & ") || "Quantitative Analysis"} with a focus on consistent returns.
                            </p>

                            <div className="pt-5 flex flex-wrap md:flex-nowrap items-center justify-center md:justify-start gap-6 md:gap-10 border-t border-white/5">
                                <div className="text-center md:text-left">
                                    <span className="text-[9px] font-black text-muted-foreground/50 uppercase tracking-[0.2em] block mb-1">Followers</span>
                                    <div className="flex items-center justify-center md:justify-start gap-2.5">
                                        <Users className="w-4 h-4 text-[#D4AF37]" />
                                        <span className="text-xl font-black text-white">{trader.followers?.toLocaleString() || 1240}</span>
                                    </div>
                                </div>
                                <div className="w-px h-8 bg-white/5 hidden md:block" />
                                <div className="text-center md:text-left">
                                    <span className="text-[9px] font-black text-muted-foreground/50 uppercase tracking-[0.2em] block mb-1">Consistency</span>
                                    <div className="flex items-center justify-center md:justify-start gap-2.5">
                                        <Activity className="w-4 h-4 text-green-500" />
                                        <span className="text-xl font-black text-green-500">92.4%</span>
                                    </div>
                                </div>
                                <div className="w-px h-8 bg-white/5 hidden md:block" />
                                <div className="text-center md:text-left">
                                    <span className="text-[9px] font-black text-muted-foreground/50 uppercase tracking-[0.2em] block mb-1">Rating</span>
                                    <div className="flex items-center justify-center md:justify-start gap-2 text-[#D4AF37]">
                                        {[1,2,3,4,5].map(i => <Star key={i} className="fill-current w-3 h-3" />)}
                                        <span className="text-xl font-black text-white ml-1">5.0</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Control Panel in Hero */}
                        <div className="w-full md:w-56 p-4 rounded-[1.2rem] bg-white/[0.03] border border-white/10 backdrop-blur-md flex flex-col gap-3 self-start shadow-xl">
                            <div className="flex flex-col gap-0.5">
                                <span className="text-[8.5px] font-black text-muted-foreground/60 uppercase tracking-widest">Requirements</span>
                                <div className="text-base font-black text-white">{trader.min_amount || "$500"} Min</div>
                            </div>
                            
                            <hr className="border-white/5" />
                            
                            <div className="space-y-2.5">
                                <div className="flex items-center justify-between">
                                    <span className="text-[8.5px] font-black text-muted-foreground/40 uppercase tracking-tight">Fee</span>
                                    <span className="text-[8.5px] font-black text-[#D4AF37] uppercase">10% PNL</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-[8.5px] font-black text-muted-foreground/40 uppercase tracking-tight">Status</span>
                                    <span className={`text-[8.5px] font-black uppercase ${isLocked ? 'text-destructive' : 'text-green-500'}`}>{isLocked ? 'Insufficient Funds' : 'Eligible'}</span>
                                </div>
                            </div>

                            {isLocked ? (
                                <Button 
                                    className="w-full h-10 rounded-lg bg-destructive text-white font-black uppercase text-[9px] shadow-glow-loss group mt-1"
                                    onClick={() => navigate('/dashboard/wallet?tab=deposit')}
                                >
                                    <Lock className="w-3 h-3 mr-2 group-hover:scale-110 transition-transform" /> Deposit Funds
                                </Button>
                            ) : (
                                <Button 
                                    className="w-full h-10 rounded-lg bg-gradient-gold text-white font-black uppercase text-[8.5px] shadow-gold hover:scale-105 transition-all duration-500 group"
                                    onClick={() => {
                                        toast.info("Opening confirmation panel...");
                                        navigate('/dashboard/copy-trading');
                                    }}
                                >
                                    Start Copying
                                    <ArrowUpRight className="w-3.5 h-3.5 ml-1.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                                </Button>
                            )}
                            
                            <div className="flex flex-col items-center pt-1">
                                <div className="flex items-center gap-1.5 text-[8px] font-black text-muted-foreground/20 uppercase tracking-[0.2em]">
                                    <ShieldCheck className="w-2.5 h-2.5" /> VERIFIED
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 🧭 Strategic Content Layer */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Left: Deep Analytics & Visualization */}
                    <div className="lg:col-span-8 space-y-8">
                        {/* Tab Controls */}
                        <div className="flex items-center gap-2 p-2 bg-secondary/50 rounded-2xl border border-border w-fit">
                            {[
                                { id: 'performance', label: 'Performance', icon: BarChart3 },
                                { id: 'stats', label: 'Trading Stats', icon: Activity },
                                { id: 'history', label: 'Trade History', icon: HistoryIcon },
                            ].map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id as any)}
                                    className={`flex items-center gap-2.5 px-8 py-3 rounded-xl text-[11px] font-black uppercase tracking-[0.1em] transition-all border duration-300 ${
                                        activeTab === tab.id 
                                        ? "bg-[#D4AF37] text-gray-950 border-[#D4AF37] shadow-[0_0_20px_rgba(212,175,55,0.2)]" 
                                        : "bg-transparent text-muted-foreground border-transparent hover:text-white"
                                    }`}
                                >
                                    <tab.icon className="w-4 h-4" />
                                    <span>{tab.label}</span>
                                </button>
                            ))}
                        </div>

                        <AnimatePresence mode="wait">
                            {activeTab === 'performance' && (
                                <motion.div 
                                    key="performance"
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.98 }}
                                    className="space-y-8"
                                >
                                    {/* 📈 Large Performance Chart */}
                                    <div className="p-8 md:p-10 rounded-[3rem] bg-card border border-border shadow-huge relative overflow-hidden">
                                        <div className="flex items-center justify-between mb-8 relative z-10">
                                            <div>
                                                <h3 className="text-xl font-black text-foreground uppercase tracking-tight">Performance Chart</h3>
                                            </div>
                                            <div className="flex gap-2 p-1.5 bg-secondary rounded-xl border border-border">
                                                {['7D', '30D', '90D', '180D', 'ALL'].map(p => (
                                                    <button key={p} className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase ${p === '180D' ? 'bg-[#D4AF37] text-gray-950' : 'text-muted-foreground hover:text-white'}`}>{p}</button>
                                                ))}
                                            </div>
                                        </div>
                                        <div ref={chartContainerRef} className="w-full relative z-10" />
                                    </div>

                                    {/* Core Metrics Grid */}
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                                        {[
                                            { label: 'Cumulative ROI', value: `+${trader.roi}%`, color: 'text-[#D4AF37]', icon: TrendingUp, detail: 'Net Profit Distribution' },
                                            { label: 'Win Ratio', value: `${trader.win_rate || 78}%`, color: 'text-white', icon: Target, detail: 'Signal Accuracy' },
                                            { label: 'Max Drawdown', value: `-${trader.drawdown || 4.2}%`, color: 'text-red-500', icon: BarChart3, detail: 'Risk Mitigation' },
                                            { label: 'Profit Factor', value: '2.84', color: 'text-green-500', icon: Zap, detail: 'Yield Efficiency' }
                                        ].map((stat) => (
                                            <div key={stat.label} className="p-6 rounded-[2rem] bg-[#12161C] border border-white/5 hover:border-[#D4AF37]/30 transition-all duration-500 group">
                                                <div className="p-2.5 rounded-xl bg-white/5 w-fit mb-4 group-hover:bg-[#D4AF37]/10 transition-colors">
                                                    <stat.icon className={`w-4 h-4 ${stat.color}`} />
                                                </div>
                                                <span className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.2em] block mb-1">{stat.label}</span>
                                                <h4 className={`text-2xl font-black ${stat.color} tabular-nums mb-1`}>{stat.value}</h4>
                                                <p className="text-[7px] font-bold text-muted-foreground/30 uppercase tracking-tighter">{stat.detail}</p>
                                            </div>
                                        ))}
                                    </div>
                                </motion.div>
                            )}

                            {activeTab === 'stats' && (
                                <motion.div 
                                    key="stats"
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="grid grid-cols-1 md:grid-cols-2 gap-8"
                                >
                                    <div className="p-10 rounded-[3rem] bg-card border border-border shadow-huge space-y-12">
                                        <div className="flex items-center justify-between">
                                            <h3 className="text-sm font-black text-foreground uppercase tracking-[0.2em]">Strategy Yield Heatmap</h3>
                                            <PieChart className="w-5 h-5 text-[#D4AF37]" />
                                        </div>
                                        <div className="flex items-end justify-between h-64 gap-2">
                                            {[45, 65, 35, 85, 25, 95, 65, 45, 75, 55, 85, 95, 65, 75, 85, 95].map((h, i) => (
                                                <div key={i} className="flex-1 flex flex-col gap-3 items-center group/bar">
                                                    <div className="w-full bg-secondary rounded-full overflow-hidden flex flex-col justify-end h-full border border-border/50">
                                                        <motion.div 
                                                            initial={{ height: 0 }} 
                                                            whileInView={{ height: `${h}%` }} 
                                                            className={`w-full ${h > 70 ? 'bg-[#D4AF37]' : 'bg-[#D4AF37]/30'} group-hover/bar:bg-[#D4AF37] transition-all duration-700`} 
                                                        />
                                                    </div>
                                                    <span className="text-[7px] font-black text-muted-foreground/30 group-hover/bar:text-[#D4AF37]">W{i+1}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="p-10 rounded-[3rem] bg-secondary/10 border border-border shadow-inner space-y-10">
                                        <h3 className="text-sm font-black text-foreground uppercase tracking-[0.2em]">Capital Concentration</h3>
                                        <div className="space-y-8">
                                            {[
                                                { asset: 'BTC Core Trading', val: '42%', color: 'bg-orange-500' },
                                                { asset: 'Stablecoin Liquidity', val: '28%', color: 'bg-green-500' },
                                                { asset: 'DeFi Alpha Strategies', val: '18%', color: 'bg-purple-500' },
                                                { asset: 'Fiat Arbitrage', val: '12%', color: 'bg-indigo-500' }
                                            ].map(a => (
                                                <div key={a.asset} className="space-y-4 group">
                                                    <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                                                        <span className="group-hover:text-[#D4AF37] transition-colors">{a.asset}</span>
                                                        <span className="text-white">{a.val}</span>
                                                    </div>
                                                    <div className="h-2.5 bg-secondary rounded-full overflow-hidden border border-border/50 p-0.5">
                                                        <motion.div initial={{ width: 0 }} whileInView={{ width: a.val }} className={`h-full ${a.color} rounded-full shadow-lg`} />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                            {activeTab === 'history' && (
                                <motion.div 
                                    key="history"
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="bg-card border border-border rounded-[3rem] overflow-hidden shadow-huge"
                                >
                                    <div className="p-10 border-b border-border flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-2xl bg-[#D4AF37]/10 flex items-center justify-center">
                                                <HistoryIcon className="w-6 h-6 text-[#D4AF37]" />
                                            </div>
                                            <div>
                                                <h3 className="text-xl font-black text-foreground uppercase tracking-tight">Recent Trades</h3>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left">
                                            <thead>
                                                <tr className="bg-secondary/40 text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] border-b border-border">
                                                    <th className="p-8">Asset</th>
                                                    <th className="p-8">Side</th>
                                                    <th className="p-8">Entry/Exit</th>
                                                    <th className="p-8">Profit/Loss</th>
                                                    <th className="p-8 text-right">Time</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-border/50">
                                                {[
                                                    { pair: 'BTC/USDT', type: 'LONG', entry: '64,210.45', exit: '68,421.30', pnl: '+6.52%', date: '2h 14m ago' },
                                                    { pair: 'ETH/USDT', type: 'SHORT', entry: '3,421.20', exit: '3,211.55', pnl: '+6.12%', date: '5h 42m ago' },
                                                    { pair: 'SOL/USDT', type: 'LONG', entry: '142.50', exit: '138.21', pnl: '-2.84%', date: '1d 04h ago' },
                                                    { pair: 'BNB/USDT', type: 'LONG', entry: '584.22', exit: '612.45', pnl: '+4.81%', date: '2d 12h ago' },
                                                    { pair: 'BTC/USDT', type: 'SHORT', entry: '69,121.00', exit: '67,502.40', pnl: '+2.34%', date: '3d 18h ago' },
                                                ].map((trade, i) => (
                                                    <tr key={i} className="hover:bg-secondary/30 transition-colors group">
                                                        <td className="p-8">
                                                            <div className="text-sm font-black text-foreground group-hover:text-[#D4AF37] transition-colors">{trade.pair}</div>
                                                        </td>
                                                        <td className="p-8">
                                                            <span className={`px-2.5 py-1 rounded-xl text-[9px] font-black uppercase tracking-widest border ${
                                                                trade.type.includes('LONG') ? 'bg-green-500/10 text-green-500 border-green-500/20' : 'bg-red-500/10 text-red-600 border-red-500/20'
                                                            }`}>
                                                                {trade.type}
                                                            </span>
                                                        </td>
                                                        <td className="p-8 font-mono text-xs text-foreground/80 tabular-nums">
                                                            <div className="flex items-center gap-3">
                                                                <span>{trade.entry}</span>
                                                                <ArrowUpRight className="w-4 h-4 opacity-20" />
                                                                <span>{trade.exit}</span>
                                                            </div>
                                                        </td>
                                                        <td className={`p-8 text-sm font-black tabular-nums ${trade.pnl.startsWith('+') ? 'text-green-500' : 'text-red-500'}`}>
                                                            {trade.pnl}
                                                        </td>
                                                        <td className="p-8 text-right">
                                                            <div className="text-[10px] font-black text-muted-foreground/50 uppercase tracking-tighter">{trade.date}</div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Right: Strategy Insights & Disclosures */}
                    <div className="lg:col-span-4 space-y-8">
                        {/* Strategy Architecture Card */}
                        <div className="p-10 rounded-[3rem] bg-card border border-border space-y-8 relative overflow-hidden group">
                            <div className="absolute -top-10 -right-10 opacity-[0.05] group-hover:rotate-12 transition-transform duration-1000">
                                <ShieldCheck className="w-64 h-64 text-primary" />
                            </div>
                            
                            <div className="flex items-center gap-4 relative z-10">
                                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                                    <ShieldAlert className="w-6 h-6 text-primary" />
                                </div>
                                <h3 className="text-xl font-black text-foreground uppercase tracking-tight">Strategy Details</h3>
                            </div>

                            <p className="text-sm text-muted-foreground leading-relaxed relative z-10 font-medium">
                                This strategy implements dynamic position sizes. Past performance does not guarantee future results.
                            </p>

                            <div className="space-y-4 pt-4 relative z-10">
                                {[
                                    { label: 'Security Grade', val: 'Secure', icon: Lock },
                                    { label: 'Fast Execution', val: 'Verified', icon: Zap },
                                    { label: 'Liquidity Depth', val: 'Tier 1 Access', icon: Globe }
                                ].map(item => (
                                    <div key={item.label} className="flex items-center justify-between p-4 rounded-2xl bg-secondary/50 border border-border/50 group/item hover:border-primary/30 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <item.icon className="w-4 h-4 text-primary/60 group-hover/item:text-primary" />
                                            <span className="text-[10px] font-black text-muted-foreground uppercase tracking-wider">{item.label}</span>
                                        </div>
                                        <span className="text-[11px] font-black text-white">{item.val}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="p-8 rounded-[2.5rem] bg-amber-500/5 border border-amber-500/10 space-y-6">
                            <div className="flex items-center gap-3">
                                <AlertCircle className="w-5 h-5 text-amber-500" />
                                <h4 className="text-[11px] font-black text-amber-500 uppercase tracking-widest">Client Disclosure</h4>
                            </div>
                            <p className="text-[11px] font-bold text-muted-foreground/80 uppercase leading-relaxed tracking-tight">
                                COPY TRADING INVOLVES SIGNIFICANT RISK. PAST PERFORMANCE IS NOT INDICATIVE OF FUTURE RESULTS.
                            </p>
                        </div>

                        {/* Social Proof Sidebar */}
                        <div className="grid grid-cols-2 gap-4">
                             <div className="p-6 rounded-[2.5rem] bg-secondary/30 border border-border flex flex-col items-center text-center gap-2">
                                <Users className="w-6 h-6 text-[#D4AF37] mb-2" />
                                <span className="text-xl font-black text-white">4.2K</span>
                                <span className="text-[9px] font-black text-muted-foreground uppercase opacity-40">Active Copiers</span>
                             </div>
                             <div className="p-6 rounded-[2.5rem] bg-secondary/30 border border-border flex flex-col items-center text-center gap-2">
                                <Target className="w-6 h-6 text-green-500 mb-2" />
                                <span className="text-xl font-black text-white">12.8M</span>
                                <span className="text-[9px] font-black text-muted-foreground uppercase opacity-40">AUM Managed</span>
                             </div>
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default TraderProfilePage;
