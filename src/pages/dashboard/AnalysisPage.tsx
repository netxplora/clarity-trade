import { useMemo, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import {
  TrendingUp, BarChart3, Activity, ArrowUpRight, ArrowDownRight, Search, Download, Filter, Target as TargetIcon,
  PieChart, Clock, Calendar, ChevronRight, Zap
} from "lucide-react";
import { useStore } from "@/store/useStore";
import { createChart, ColorType, AreaSeries } from "lightweight-charts";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const EquityCurve = () => {
  const chartContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: 'transparent' },
        textColor: '#94a3b8',
        fontFamily: 'Inter, sans-serif',
      },
      grid: {
        vertLines: { color: 'rgba(148, 163, 184, 0.05)' },
        horzLines: { color: 'rgba(148, 163, 184, 0.05)' },
      },
      rightPriceScale: {
        borderVisible: false,
        scaleMargins: { top: 0.1, bottom: 0.1 },
      },
      timeScale: {
        borderVisible: false,
        fixLeftEdge: true,
        fixRightEdge: true,
      },
      crosshair: {
        vertLine: { color: '#D4AF37', labelBackgroundColor: '#D4AF37', style: 0 },
        horzLine: { color: '#D4AF37', labelBackgroundColor: '#D4AF37', style: 0 },
      },
      handleScroll: false,
      handleScale: false,
    });

    const areaSeries = chart.addSeries(AreaSeries, {
      lineColor: '#D4AF37',
      topColor: 'rgba(212, 175, 55, 0.3)',
      bottomColor: 'rgba(212, 175, 55, 0)',
      lineWidth: 3,
      priceFormat: { type: 'price', precision: 2, minMove: 0.01 },
    });

    const data: { time: string; value: number }[] = [];
    let value = 14500;
    const now = new Date();
    for (let i = 0; i < 90; i++) {
        const time = new Date(now.getTime() - (90 - i) * 24 * 60 * 60 * 1000);
        const change = (Math.random() - 0.3) * 350;
        value += change;
        data.push({ time: time.toISOString().split('T')[0], value });
    }
    
    areaSeries.setData(data);
    chart.timeScale().fitContent();

    const handleResize = () => {
      if (chartContainerRef.current) {
        chart.applyOptions({ width: chartContainerRef.current.clientWidth });
      }
    };

    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
    };
  }, []);

  return <div ref={chartContainerRef} className="w-full h-[400px]" />;
};

const AnalysisPage = () => {
  const { balance, tradeHistory, formatCurrency } = useStore();
  const [activeTab, setActiveTab] = useState("all");
  
  const metrics = [
    { label: "Net Performance", value: "+12.4%", subValue: "+$4,250.00", up: true, icon: TrendingUp, color: "text-primary" },
    { label: "Profit Factor", value: "2.84", subValue: "Risk: 0.45", up: true, icon: TargetIcon, color: "text-indigo-500" },
    { label: "Average Pnl", value: "$142.50", subValue: "Per Trade", up: true, icon: BarChart3, color: "text-blue-500" },
    { label: "Trading Streak", value: "5 Days", subValue: "Personal Best", up: true, icon: Activity, color: "text-orange-500" },
  ];

  const distribution = [
    { name: "Forex", value: 45, color: "bg-primary" },
    { name: "Crypto", value: 30, color: "bg-indigo-500" },
    { name: "Stocks", value: 15, color: "bg-blue-500" },
    { name: "Indices", value: 10, color: "bg-orange-500" },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-10 pb-20">
        <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-1.5 h-6 bg-primary rounded-full transition-all duration-1000 group-hover:h-8" />
              <h1 className="text-4xl font-black text-foreground tracking-tight">Market Analysis</h1>
            </div>
            <p className="text-muted-foreground font-semibold">Deep dive into your trading performance and portfolio distribution.</p>
          </div>
          <div className="flex items-center gap-3">
             <div className="flex bg-secondary p-1 rounded-xl border border-border">
               {['all', 'ytd', 'month'].map(t => (
                 <button 
                  key={t}
                  onClick={() => setActiveTab(t)}
                  className={`px-6 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${activeTab === t ? 'bg-background text-primary shadow-sm border border-border' : 'text-muted-foreground hover:text-foreground'}`}
                 >
                   {t}
                 </button>
               ))}
             </div>
             <Button variant="outline" className="h-12 border-border shadow-huge px-6 font-black bg-card group">
                <Download className="w-4 h-4 mr-2 group-hover:translate-y-0.5 transition-transform" /> 
                Download CSV
             </Button>
          </div>
        </header>

        {/* Premium Metrics Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {metrics.map((m, i) => (
            <motion.div
              key={m.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-card p-8 rounded-[2rem] border border-border shadow-huge hover:border-primary/20 transition-all group relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-[60px] -mr-16 -mt-16 group-hover:bg-primary/10 transition-colors" />
              <div className="flex items-center justify-between mb-6">
                <div className={`w-12 h-12 rounded-xl bg-secondary flex items-center justify-center border border-border group-hover:scale-110 transition-transform`}>
                  <m.icon className={`w-6 h-6 ${m.color}`} />
                </div>
                <Badge variant="outline" className="border-border text-[9px] font-black uppercase tracking-widest bg-secondary/30">Stable</Badge>
              </div>
              <div>
                 <span className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.15em] mb-1 block">{m.label}</span>
                 <div className="text-3xl font-black text-foreground mb-1">{m.value}</div>
                 <div className="text-[11px] font-bold text-muted-foreground uppercase flex items-center gap-2">
                    <span className={m.up ? "text-green-500" : "text-red-500"}>{m.subValue}</span>
                    <span className="opacity-30">•</span>
                    <span>Vs Peak</span>
                 </div>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="grid lg:grid-cols-12 gap-8">
          {/* Portfolio Growth */}
          <div className="lg:col-span-8 space-y-8">
             <div className="bg-card p-10 rounded-[2.5rem] border border-border shadow-huge relative overflow-hidden">
                <div className="flex items-center justify-between mb-10 relative z-10">
                   <div>
                      <h2 className="text-2xl font-black text-foreground tracking-tight">Equity Curve</h2>
                      <p className="text-xs text-muted-foreground font-bold mt-1">Real-time portfolio valuation history</p>
                   </div>
                   <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-green-500/10 border border-green-500/20">
                      <TrendingUp className="w-4 h-4 text-green-500" />
                      <span className="text-[10px] font-black text-green-500 uppercase">Up 14.2% This Quarter</span>
                   </div>
                </div>
                <div className="relative z-10">
                   <EquityCurve />
                </div>
                <div className="absolute bottom-0 left-0 w-full h-[100px] bg-gradient-to-t from-primary/[0.02] to-transparent pointer-events-none" />
             </div>

             {/* Distribution & Activity */}
             <div className="grid md:grid-cols-2 gap-8">
                <div className="bg-card p-8 rounded-[2rem] border border-border shadow-huge">
                   <div className="flex items-center gap-3 mb-8">
                      <PieChart className="w-5 h-5 text-primary" />
                      <h3 className="text-lg font-black text-foreground">Asset Allocation</h3>
                   </div>
                   <div className="space-y-6">
                      {distribution.map(item => (
                        <div key={item.name} className="space-y-2">
                           <div className="flex justify-between text-[11px] font-black uppercase tracking-wider">
                              <span className="text-muted-foreground">{item.name}</span>
                              <span className="text-foreground">{item.value}%</span>
                           </div>
                           <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                              <motion.div 
                                initial={{ width: 0 }}
                                animate={{ width: `${item.value}%` }}
                                transition={{ duration: 1.5, delay: 0.5 }}
                                className={`h-full ${item.color} rounded-full`}
                              />
                           </div>
                        </div>
                      ))}
                   </div>
                </div>

                <div className="bg-card p-8 rounded-[2rem] border border-border shadow-huge flex flex-col items-center justify-center text-center group">
                   <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500">
                      <TrendingUp className="w-10 h-10 text-primary" />
                   </div>
                   <h3 className="text-xl font-black text-foreground mb-3">Profit Target: 84%</h3>
                   <p className="text-xs text-muted-foreground font-bold leading-relaxed mb-8 px-4">You are currently on track to reach your quarterly profit goals. Keep maintaining your risk-to-reward ratio.</p>
                   <Button className="w-full h-12 rounded-xl bg-primary shadow-gold font-black transition-all hover:translate-y-[-2px]">
                      View Goal Details
                   </Button>
                </div>
             </div>
          </div>

          {/* Performance Summary Sidebar */}
          <div className="lg:col-span-4 space-y-8">
             <div className="bg-card p-10 rounded-[2.5rem] border border-border shadow-huge space-y-8">
                <h3 className="text-xl font-black text-foreground tracking-tight">Session Summary</h3>
                <div className="space-y-6">
                   {[
                     { label: "Longest Winning Streak", value: "8 Wins", icon: Zap, color: "text-amber-500", bg: "bg-amber-500/10" },
                     { label: "Avg Trade Duration", value: "4h 12m", icon: Clock, color: "text-blue-500", bg: "bg-blue-500/10" },
                     { label: "Best Trading Day", value: "Tuesdays", icon: Calendar, color: "text-indigo-500", bg: "bg-indigo-500/10" },
                   ].map((item, idx) => (
                     <div key={idx} className="flex items-center gap-4 group">
                        <div className={`w-12 h-12 rounded-xl ${item.bg} flex items-center justify-center shrink-0 group-hover:rotate-12 transition-transform`}>
                           <item.icon className={`w-5 h-5 ${item.color}`} />
                        </div>
                        <div>
                           <div className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{item.label}</div>
                           <div className="text-sm font-black text-foreground">{item.value}</div>
                        </div>
                     </div>
                   ))}
                </div>

                <div className="pt-8 border-t border-border space-y-4">
                   <div className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-4">Top Traded Pairs</div>
                   {['BTC/USDT', 'ETH/USDT', 'XRP/USDT'].map((pair, i) => (
                     <div key={pair} className="flex items-center justify-between p-4 rounded-xl hover:bg-secondary/50 transition-colors border border-transparent hover:border-border cursor-pointer group">
                        <div className="flex items-center gap-3">
                           <div className="w-2 h-2 rounded-full bg-primary" />
                           <span className="text-xs font-black text-foreground">{pair}</span>
                        </div>
                        <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                     </div>
                   ))}
                </div>

                <div className="p-6 rounded-2xl bg-primary/10 border border-primary/20 relative overflow-hidden mt-8">
                   <div className="relative z-10">
                      <h4 className="text-sm font-black text-primary mb-2 italic">Pro Insights</h4>
                      <p className="text-[10px] text-muted-foreground/80 font-bold leading-relaxed">Your win rate on Tuesdays is 15% higher than your weekly average. Consider increasing exposure during these sessions.</p>
                   </div>
                   <div className="absolute -right-4 -bottom-4 opacity-[0.05] rotate-12">
                      <TrendingUp className="w-24 h-24 text-primary" />
                   </div>
                </div>
             </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AnalysisPage;
