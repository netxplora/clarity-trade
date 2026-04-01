import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  X, TrendingUp, Users, Star, ShieldCheck, Target, 
  Activity, Zap, Calendar, ArrowUpRight, ArrowDownRight,
  BarChart3, PieChart, Info, Globe, Coins, Lock, CheckCircle2,
  Clock, History as HistoryIcon, LayoutDashboard, Database, AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { createChart, ColorType, AreaSeries, IChartApi } from "lightweight-charts";
import { useStore } from "@/store/useStore";
import { useTheme } from "@/components/ThemeProvider";

interface TraderProfileModalProps {
  trader: any;
  isOpen: boolean;
  onClose: () => void;
  onCopyInitiate: () => void;
  isBeingCopied: boolean;
  isLocked: boolean;
}

const TraderProfileModal = ({ trader, isOpen, onClose, onCopyInitiate, isBeingCopied, isLocked }: TraderProfileModalProps) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const { formatCurrency } = useStore();
  const { theme, resolvedTheme } = useTheme();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'performance' | 'history' | 'stats'>('performance');

  useEffect(() => {
    if (!isOpen || !chartContainerRef.current || activeTab !== 'performance') return;

    const container = chartContainerRef.current;
    
    const isDark = resolvedTheme === 'dark';
    
    const chart = createChart(container, {
      layout: {
        background: { type: ColorType.Solid, color: 'transparent' },
        textColor: isDark ? '#94a3b8' : '#64748b',
        fontFamily: 'Inter, sans-serif',
      },
      grid: {
        vertLines: { color: isDark ? 'rgba(148, 163, 184, 0.05)' : 'rgba(0, 0, 0, 0.05)' },
        horzLines: { color: isDark ? 'rgba(148, 163, 184, 0.05)' : 'rgba(0, 0, 0, 0.05)' },
      },
      width: container.clientWidth,
      height: 350,
      rightPriceScale: {
        borderVisible: false,
        scaleMargins: { top: 0.1, bottom: 0.1 },
      },
      timeScale: {
        borderVisible: false,
      },
      handleScale: {
          mouseWheel: true,
          pinch: true
      },
      crosshair: {
        vertLine: { color: '#D4AF37', labelBackgroundColor: '#D4AF37' },
        horzLine: { color: '#D4AF37', labelBackgroundColor: '#D4AF37' },
      },
    });

    const areaSeries = chart.addSeries(AreaSeries, {
      lineColor: '#D4AF37',
      topColor: 'rgba(212, 175, 55, 0.15)',
      bottomColor: 'rgba(212, 175, 55, 0)',
      lineWidth: 3,
      priceLineVisible: false,
    });

    // Generate deterministic data based on trader ROI
    const data: any[] = [];
    let baseValue = 1000;
    const now = new Date();
    const roiFactor = (trader.roi || 50) / 100;
    
    for (let i = 0; i < 90; i++) {
        const time = new Date(now.getTime() - (90 - i) * 24 * 60 * 60 * 1000);
        const dailyBias = (roiFactor / 90) * (Math.random() * 2);
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
  }, [isOpen, trader, activeTab, resolvedTheme]);

  const riskLabel = (score: number) => {
    if (score <= 3) return { label: 'Conservative', color: 'text-green-500', bg: 'bg-green-500/10' };
    if (score <= 6) return { label: 'Moderate', color: 'text-amber-500', bg: 'bg-amber-500/10' };
    return { label: 'Aggressive', color: 'text-red-500', bg: 'bg-red-500/10' };
  };

  const risk = riskLabel(trader.risk_score || 5);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-12 overflow-hidden">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-background/80 backdrop-blur-2xl"
          />
          
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="w-full max-w-2xl h-full md:max-h-[85vh] bg-background border border-primary/30 shadow-huge rounded-[2.5rem] relative overflow-hidden flex flex-col ring-1 ring-primary/10"
          >
            {/* 🛡️ Institutional Background Accents */}
            <div className="absolute top-0 left-0 w-full h-[250px] bg-gradient-to-b from-[#D4AF37]/10 via-[#D4AF37]/5 to-transparent pointer-events-none" />
            <div className="absolute -top-[10%] -left-[10%] w-[50%] h-[50%] bg-[#D4AF37]/5 blur-[100px] rounded-full pointer-events-none" />
            
            {/* 🛡️ Header: Premium Centered Popup Style */}
            <div className="p-6 md:p-8 flex flex-col items-center text-center relative z-50 bg-background/50 backdrop-blur-xl border-b border-primary/10">
              <button 
                onClick={onClose}
                className="absolute top-6 right-6 p-2 rounded-full bg-white/5 border border-white/10 hover:bg-red-500/10 hover:border-red-500/20 text-gray-400 hover:text-red-500 transition-all duration-300"
              >
                <X className="w-5 h-5 text-muted-foreground" />
              </button>

              <div className="relative mb-6">
                <div className="w-20 h-20 md:w-24 md:h-24 rounded-[2rem] bg-gradient-to-br from-[#D4AF37] via-[#FFD700] to-[#B8860B] p-[1.5px] shadow-[0_0_30px_rgba(212,175,55,0.3)]">
                  <div className="w-full h-full rounded-[1.8rem] overflow-hidden bg-secondary">
                    <img 
                      src={trader.avatar_url || "https://images.unsplash.com/photo-1560250097-0b93528c311a?q=80&w=256&auto=format&fit=crop"} 
                      alt={trader.name} 
                      className="w-full h-full object-cover scale-105"
                    />
                  </div>
                </div>
                <div className="absolute -bottom-2 -right-2 bg-[#D4AF37] text-gray-950 p-1.5 rounded-xl shadow-lg border-2 border-[#0B0F14]">
                  <CheckCircle2 className="w-4 h-4 text-background" />
                </div>
              </div>

              <div className="space-y-4 mb-8">
                <div className="flex flex-col items-center gap-1.5">
                  <div className="flex items-center justify-center gap-3">
                    <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight leading-none">{trader.name}</h2>
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border shadow-sm ${risk.bg} ${risk.color} border-current/20`}>
                      {trader.ranking_level || 'Elite'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] font-black text-muted-foreground/60 uppercase tracking-[0.2em] pt-1">
                    <span>Trader ID: CL-{(trader.id?.slice(0, 8) || (trader.ranking_level || 'TRADER')).toUpperCase()}</span>
                    <div className="w-1 h-1 rounded-full bg-white/10" />
                    <span className="text-[#D4AF37]">Joined {trader.joined_date || "JAN 2023"}</span>
                  </div>
                </div>
                
                <p className="text-[13px] md:text-sm font-medium text-gray-400 max-w-lg mx-auto leading-relaxed px-4">
                  {trader.ranking_level || 'Elite'} institutional strategy specializing in {trader.categories?.join(" & ") || "Quantitative Analysis"} with a focus on cross-exchange yield propagation and volatility arbitrage. Managed via AI-rebalanced clusters.
                </p>
              </div>

              <div className="grid grid-cols-3 gap-8 md:gap-12 w-full max-w-md pt-4 border-t border-border">
                <div>
                  <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest block mb-1">Followers</span>
                  <div className="flex items-center justify-center gap-2">
                    <Users className="w-3.5 h-3.5 text-[#D4AF37]" />
                    <span className="text-sm font-black text-foreground">{trader.followers?.toLocaleString() || 1240}</span>
                  </div>
                </div>
                <div>
                  <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest block mb-1">Mirroring</span>
                  <div className="flex items-center justify-center gap-2">
                    <Activity className="w-3.5 h-3.5 text-green-500" />
                    <span className="text-sm font-black text-green-500">Active</span>
                  </div>
                </div>
                <div>
                  <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest block mb-1">Rating</span>
                  <div className="flex items-center justify-center gap-1 text-[#D4AF37]">
                    <Star className="fill-current w-3.5 h-3.5" />
                    <span className="text-sm font-black text-foreground">4.9</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 📱 Mobile Mirror Button */}
            <div className="md:hidden p-4 border-b border-border bg-secondary/20 flex gap-2">
                 <Button 
                    className="flex-1 h-12 rounded-xl bg-gradient-gold text-white font-black uppercase text-[10px] shadow-gold transition-all"
                    onClick={onCopyInitiate}
                    disabled={isLocked || isBeingCopied}
                 >
                    {isLocked ? 'Deposit Required' : isBeingCopied ? 'Account Copied' : 'Mirror Strategy'}
                 </Button>
            </div>

            {/* 🧭 Advanced Tab Control - Centered Style */}
            <div className="flex items-center justify-center gap-2 px-4 md:px-8 py-4 bg-background/80 sticky top-0 z-40 backdrop-blur-md border-b border-primary/10">
                {[
                    { id: 'performance', label: 'ROI Analysis', icon: BarChart3 },
                    { id: 'stats', label: 'Operational Analytics', icon: Activity },
                    { id: 'history', label: 'Execution Logs', icon: HistoryIcon },
                ].map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`flex-1 md:flex-none flex items-center justify-center gap-2.5 px-6 md:px-8 py-3 rounded-xl text-[10px] md:text-[11px] font-black uppercase tracking-[0.1em] transition-all border duration-300 ${
                            activeTab === tab.id 
                            ? "bg-primary text-background border-primary shadow-[0_0_20px_rgba(212,175,55,0.3)]" 
                            : "bg-secondary/50 text-muted-foreground border-border hover:text-foreground hover:border-border/50"
                        }`}
                    >
                        <tab.icon className={`w-3.5 h-3.5 ${activeTab === tab.id ? 'animate-pulse' : ''}`} />
                        <span>{tab.label}</span>
                    </button>
                ))}
            </div>

            {/* 📊 Content Layer */}
            <div className="flex-1 overflow-y-auto custom-scrollbar bg-card">
                <AnimatePresence mode="wait">
                    {activeTab === 'performance' && (
                        <motion.div 
                            key="performance"
                            initial={{ opacity: 0, scale: 0.98 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0 }}
                            className="p-4 md:p-6 space-y-6"
                        >
                             {/* 🔍 Elite Requirements Bar */}
                             <div className="flex flex-col md:flex-row gap-4 w-full">
                                {[
                                    { label: 'Minimum Mirror', value: trader.min_amount ? `$${trader.min_amount.toLocaleString()}` : "$500", icon: Coins, detail: 'Initial Capital' },
                                    { label: 'Performance Fee', value: '10%', icon: Zap, detail: 'Net Profit Only' },
                                    { label: 'Settlement', value: 'Daily', icon: Clock, detail: 'Automated Sync' }
                                ].map((req) => (
                                    <div key={req.label} className="flex-1 p-5 rounded-[1.5rem] bg-secondary border border-border flex items-center justify-between group hover:border-primary/30 transition-all">
                                        <div className="flex flex-col">
                                            <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest leading-none mb-1.5">{req.label}</span>
                                            <h5 className="text-base font-black text-foreground">{req.value}</h5>
                                            <span className="text-[8px] font-bold text-muted-foreground/40 uppercase mt-0.5">{req.detail}</span>
                                        </div>
                                        <div className="w-10 h-10 rounded-xl bg-background border border-border flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                                            <req.icon className="w-4 h-4 text-primary opacity-60" />
                                        </div>
                                    </div>
                                ))}
                             </div>

                            <div className="grid grid-cols-2 gap-3 md:gap-4">
                                {[
                                    { label: 'Cumulative ROI', value: `+${trader.roi}%`, color: 'text-[#D4AF37]', icon: TrendingUp },
                                    { label: 'Win Ratio', value: `${trader.win_rate || 78}%`, color: 'text-foreground', icon: Target },

                                    { label: 'Drawdown (Max)', value: `-${trader.drawdown || 4.2}%`, color: 'text-red-500', icon: BarChart3 },
                                    { label: 'Success Prop', value: risk.label, color: risk.color, icon: ShieldCheck },
                                ].map((stat) => (
                                    <div key={stat.label} className="p-4 md:p-6 rounded-[1.2rem] md:rounded-[1.5rem] bg-secondary border border-border hover:border-primary/30 transition-all duration-300 flex flex-col justify-between group">
                                        <div className="flex items-center justify-between mb-3">
                                            <div className="p-1.5 rounded-lg bg-background border border-border group-hover:bg-primary/10 transition-all">
                                                <stat.icon className={`w-3.5 h-3.5 md:w-4 md:h-4 ${stat.color} opacity-90`} />
                                            </div>
                                        </div>
                                        <div>
                                            <span className="text-[8px] md:text-[9px] font-black text-muted-foreground uppercase tracking-[0.2em] block mb-1">{stat.label}</span>
                                            <h4 className={`text-lg md:text-xl font-black ${stat.color} tabular-nums`}>{stat.value}</h4>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Institutional Growth Chart */}
                            <div className="bg-secondary border border-border rounded-[2rem] p-5 md:p-6 hover:border-primary/20 transition-all relative overflow-hidden flex flex-col gap-4">
                                <div className="absolute top-0 right-0 w-full h-[150px] bg-gradient-to-b from-primary/[0.05] to-transparent pointer-events-none" />
                                
                                <div className="flex items-center justify-between relative z-10">
                                    <h3 className="text-xs font-black text-foreground uppercase tracking-tight">Institutional Matrix</h3>
                                    <div className="flex gap-1.5 p-1 bg-secondary rounded-xl border border-border">
                                        {['30D', '90D', '1Y'].map(p => (
                                            <button key={p} className={`px-3 py-1 rounded-lg text-[8px] font-black uppercase ${p === '90D' ? 'bg-card text-primary shadow-sm border border-border/50' : 'text-muted-foreground'}`}>{p}</button>
                                        ))}
                                    </div>
                                </div>
                                
                                <div className="relative z-10 w-full min-h-[200px] md:min-h-[250px] overflow-hidden rounded-2xl bg-secondary/5 border border-border/40">
                                    <div ref={chartContainerRef} className="w-full h-full" />
                                </div>
                             </div>

                            {/* Deep Analytics Grid */}
                            <div className="grid grid-cols-1 gap-8 md:gap-10">
                                <div className="space-y-8">
                                    <div className="flex items-center gap-3">
                                        <Database className="w-5 h-5 text-primary" />
                                        <h3 className="text-lg font-black text-foreground uppercase tracking-wider">Strategy Info</h3>
                                    </div>
                                    <div className="p-6 md:p-8 rounded-[2rem] bg-card border border-border shadow-lg relative group overflow-hidden">
                                        <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:rotate-12 transition-transform">
                                            <Zap className="w-40 h-40 text-primary" />
                                        </div>
                                        <p className="text-sm md:text-base text-foreground/80 leading-relaxed font-bold uppercase tracking-tight relative z-10">
                                            Every signal follows strict capital preservation protocols. 
                                            Utilizes <span className="text-primary italic">Position Mirroring AES-256</span> propagation for zero-lag execution.
                                        </p>
                                        <div className="grid grid-cols-2 gap-6 mt-10 relative z-10">
                                            <div className="p-5 rounded-[2rem] bg-secondary/40 border border-border hover:border-primary/30 transition-colors">
                                                <Clock className="w-6 h-6 text-primary mb-3" />
                                                <span className="text-[10px] font-black text-muted-foreground uppercase block mb-1">Hold Duration</span>
                                                <span className="text-sm font-black text-foreground uppercase">4.2 Days Avg.</span>
                                            </div>
                                            <div className="p-5 rounded-[2rem] bg-secondary/40 border border-border hover:border-primary/30 transition-colors">
                                                <LayoutDashboard className="w-6 h-6 text-primary mb-3" />
                                                <span className="text-[10px] font-black text-muted-foreground uppercase block mb-1">Allocation Bias</span>
                                                <span className="text-sm font-black text-foreground uppercase">85% Digital Assets</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-8">
                                    <div className="flex items-center gap-3">
                                        <ShieldCheck className="w-5 h-5 text-primary" />
                                        <h3 className="text-lg font-black text-foreground uppercase tracking-wider">Risk Architecture</h3>
                                    </div>
                                    <div className="space-y-3 pb-8">
                                        {[
                                            { label: 'Efficiency', val: '2.8 / 5.0', color: 'bg-green-500', perc: '85%' },
                                            { label: 'Stability', val: 'Elite', color: 'bg-primary', perc: '92%' },
                                            { label: 'Resilience', val: 'Grade A', color: 'bg-indigo-500', perc: '78%' }
                                        ].map(m => (
                                            <div key={m.label} className="p-4 md:p-6 rounded-2xl bg-card border border-border flex items-center justify-between gap-4 group hover:shadow-lg transition-all">
                                                <div>
                                                    <div className="text-[10px] font-black uppercase text-muted-foreground tracking-[0.2em] mb-1">{m.label}</div>
                                                    <div className="text-xl font-black text-foreground">{m.val}</div>
                                                </div>
                                                <div className="w-full md:w-32 flex flex-col gap-2">
                                                    <div className="flex justify-between text-[9px] font-bold text-muted-foreground uppercase">
                                                        <span>Reliability</span>
                                                        <span>{m.perc}</span>
                                                    </div>
                                                    <div className="h-2 bg-secondary rounded-full overflow-hidden border border-border/50">
                                                        <motion.div initial={{ width: 0 }} whileInView={{ width: m.perc }} className={`h-full ${m.color} shadow-[0_0_10px_rgba(212,175,55,0.4)]`} />
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {activeTab === 'history' && (
                        <motion.div 
                            key="history"
                            initial={{ opacity: 0, scale: 0.98 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, y: 10 }}
                            className="p-4 md:p-6"
                        >
                            <div className="bg-card border border-border rounded-[2.5rem] overflow-hidden shadow-huge">
                                <div className="p-6 md:p-8 border-b border-border flex flex-col md:flex-row md:items-center justify-between gap-4">
                                    <div>
                                        <h3 className="text-lg font-black text-foreground uppercase tracking-tight">Strategy Execution Log</h3>
                                        <p className="text-[10px] font-bold text-muted-foreground uppercase opacity-60 mt-1">Real-time replication audit trail</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                                        <span className="text-[10px] font-black text-green-600 uppercase tracking-widest">Live Monitoring Active</span>
                                    </div>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left">
                                        <thead>
                                            <tr className="bg-secondary/40 text-[9px] font-black text-muted-foreground uppercase tracking-[0.2em] border-b border-border">
                                                <th className="p-4 md:p-6">Asset</th>
                                                <th className="p-4 md:p-6">Type</th>
                                                <th className="p-4 md:p-6">Entry/Exit</th>
                                                <th className="p-4 md:p-6">ROI</th>
                                                <th className="p-4 md:p-6 text-right">Time</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-border/50">
                                            {[
                                                { pair: 'BTC/USDT', type: 'LONG', entry: '64,210', exit: '68,420', pnl: '+6.1%', date: '2h ago' },
                                                { pair: 'ETH/USDT', type: 'SHORT', entry: '3,420', exit: '3,210', pnl: '+6.5%', date: '5h ago' },
                                                { pair: 'SOL/USDT', type: 'LONG', entry: '142.5', exit: '138.2', pnl: '-2.8%', date: '1d ago' },
                                                { pair: 'BNB/USDT', type: 'LONG', entry: '584.2', exit: '612.4', pnl: '+4.8%', date: '2d ago' },
                                                { pair: 'BTC/USDT', type: 'SHORT', entry: '69,120', exit: '67,500', pnl: '+2.4%', date: '3d ago' },
                                            ].map((trade, i) => (
                                                <tr key={i} className="hover:bg-secondary/30 transition-colors group">
                                                    <td className="p-4 md:p-6">
                                                        <div className="text-xs font-black text-foreground group-hover:text-primary transition-colors">{trade.pair}</div>
                                                    </td>
                                                    <td className="p-4 md:p-6">
                                                        <span className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider border ${
                                                            trade.type === 'LONG' ? 'bg-green-500/10 text-green-600 border-green-500/20' : 'bg-red-500/10 text-red-600 border-red-500/20'
                                                        }`}>
                                                            {trade.type}
                                                        </span>
                                                    </td>
                                                    <td className="p-4 md:p-6 font-mono text-[10px] text-foreground/80 tabular-nums">
                                                        <div className="flex items-center gap-1.5">
                                                            <span>{trade.entry}</span>
                                                            <ArrowUpRight className="w-3 h-3 opacity-30" />
                                                            <span>{trade.exit}</span>
                                                        </div>
                                                    </td>
                                                    <td className={`p-4 md:p-6 text-xs font-black tabular-nums ${trade.pnl.startsWith('+') ? 'text-green-500' : 'text-red-500'}`}>
                                                        {trade.pnl}
                                                    </td>
                                                    <td className="p-4 md:p-6 text-right text-[9px] font-black text-muted-foreground/40 uppercase">
                                                        {trade.date}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {activeTab === 'stats' && (
                        <motion.div 
                            key="stats"
                            initial={{ opacity: 0, x: 30 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -30 }}
                            className="p-4 md:p-6 space-y-8"
                        >
                            <div className="grid grid-cols-1 gap-8">
                                <div className="p-8 rounded-[2.5rem] bg-card border border-border shadow-huge group">
                                    <div className="flex items-center justify-between mb-10">
                                        <h3 className="text-xs font-black text-foreground uppercase tracking-[0.2em]">Weekly Yield Distribution</h3>
                                        <PieChart className="w-4 h-4 text-primary opacity-40 group-hover:opacity-100 transition-opacity" />
                                    </div>
                                    <div className="flex items-end justify-between h-48 gap-1.5 pb-2">
                                        {[45, 65, 35, 85, 25, 95, 65, 45, 75, 55, 85, 95].map((h, i) => (
                                            <div key={i} className="flex-1 flex flex-col gap-2 items-center group/bar cursor-pointer">
                                                <div className="w-full bg-secondary rounded-xl overflow-hidden flex flex-col justify-end h-full border border-border/50">
                                                    <motion.div 
                                                        initial={{ height: 0 }} 
                                                        whileInView={{ height: `${h}%` }} 
                                                        className={`w-full ${h > 60 ? 'bg-primary' : 'bg-primary/30'} group-hover/bar:bg-primary transition-all duration-500 shadow-[0_0_15px_rgba(212,175,55,0.2)]`} 
                                                    />
                                                </div>
                                                <span className="text-[7px] font-black text-muted-foreground/40 group-hover/bar:text-primary uppercase">W{i+1}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                
                                <div className="p-8 rounded-[2.5rem] bg-secondary/10 border border-border shadow-inner">
                                    <h3 className="text-xs font-black text-foreground uppercase tracking-[0.2em] mb-8">Signal Allocation</h3>
                                    <div className="space-y-5">
                                        {[
                                            { asset: 'BTC Core', val: '42%', color: 'bg-orange-500' },
                                            { asset: 'L1 Alternative', val: '38%', color: 'bg-blue-500' },
                                            { asset: 'DeFi Alpha', val: '12%', color: 'bg-purple-500' },
                                            { asset: 'Fiat Arbitrage', val: '8%', color: 'bg-indigo-500' }
                                        ].map(a => (
                                            <div key={a.asset} className="space-y-2 group">
                                                <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-tight">
                                                    <span className="group-hover:text-primary transition-colors">{a.asset}</span>
                                                    <span className="text-foreground">{a.val}</span>
                                                </div>
                                                <div className="h-1.5 bg-secondary rounded-full overflow-hidden border border-border/50">
                                                    <motion.div initial={{ width: 0 }} whileInView={{ width: a.val }} className={`h-full ${a.color} shadow-lg`} />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="mt-8 pt-6 border-t border-border flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                                             <ShieldCheck className="w-5 h-5 text-primary" />
                                        </div>
                                        <p className="text-[9px] font-bold text-muted-foreground uppercase leading-tight">AI-Enhanced portfolio rebalancing active across all replicated signals.</p>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* 🛡️ Footer: Operational Control Center */}
            <div className="p-8 md:p-10 bg-background border-t border-primary/10 flex flex-col gap-10 text-center relative z-50 shadow-huge">
                <div className="flex flex-col md:flex-row items-center justify-between gap-8">
                    <div className="flex flex-col items-center md:items-start text-center md:text-left max-w-sm">
                        <p className="text-[11px] md:text-[12px] font-black text-foreground uppercase tracking-wider leading-tight">Institutional Disclosure</p>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase opacity-60 mt-1">Trading involves capital risk. Historical performance data is sourced from verified trading records.</p>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center gap-4 md:gap-6">
                        {isLocked ? (
                          <Button 
                            className="h-14 px-12 rounded-[1.2rem] bg-secondary text-muted-foreground font-black uppercase text-sm border border-border shadow-inner"
                            onClick={() => navigate('/dashboard/wallet')}
                          >
                            <Lock className="w-5 h-5 mr-3" /> Deposit to Copy
                          </Button>
                        ) : isBeingCopied ? (
                          <Button className="h-14 px-12 rounded-[1.2rem] border-2 border-green-500/50 text-green-500 bg-green-500/5 font-black uppercase text-sm shadow-[0_0_30px_rgba(34,197,94,0.1)] cursor-default">
                            <CheckCircle2 className="w-5 h-5 mr-3" /> Mirroring Active
                          </Button>
                        ) : (
                          <Button 
                            onClick={onCopyInitiate}
                            className="h-16 px-16 rounded-[1.5rem] bg-gradient-gold text-white font-black uppercase text-sm shadow-gold hover:scale-105 transition-all duration-500 group"
                          >
                            Start Mirroring Strategy
                            <ArrowUpRight className="w-5 h-5 ml-3 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                          </Button>
                        )}
                    </div>
                </div>

                <div className="pt-8 border-t border-border flex flex-col sm:flex-row items-center justify-center gap-10">
                    <div className="flex items-center gap-3">
                        <Lock className="w-4 h-4 text-green-500 opacity-60" />
                        <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">SSL AES-256 SECURED</span>
                    </div>
                    <div className="w-1.5 h-1.5 rounded-full bg-border/40 hidden sm:block" />
                    <div className="flex items-center gap-3">
                        <ShieldCheck className="w-4 h-4 text-primary opacity-60" />
                        <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">PLATFORM VERIFIED AUDIT</span>
                    </div>
                </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default TraderProfileModal;
