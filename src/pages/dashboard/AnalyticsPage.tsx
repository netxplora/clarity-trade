import { useMemo, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import {
  TrendingUp, BarChart3, Activity, ArrowUpRight, ArrowDownRight, Search, Download, Filter, Target as TargetIcon,
} from "lucide-react";
import { useStore } from "@/store/useStore";
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { createChart, ColorType, AreaSeries } from "lightweight-charts";
import { Button } from "@/components/ui/button";



const EquityCurve = () => {
  const chartContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: 'transparent' },
        textColor: '#64748b',
        fontFamily: 'Inter, sans-serif',
      },
      grid: {
        vertLines: { color: '#e2e8f0' },
        horzLines: { color: '#e2e8f0' },
      },
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
      priceFormat: { type: 'price', precision: 2, minMove: 0.01 },
    });

    const data: { time: string; value: number }[] = [];
    let value = 10000;
    const now = new Date();
    for (let i = 0; i < 120; i++) {
        const time = new Date(now.getTime() - (120 - i) * 24 * 60 * 60 * 1000);
        const change = (Math.random() - 0.35) * 220;
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

  return <div ref={chartContainerRef} className="w-full h-[320px]" />;
};

const AnalyticsPage = () => {
  const { user, balance, tradeHistory, formatCurrency } = useStore();
  
  const metrics = [
    { label: "Total Return", value: balance.totalTrades > 0 ? `${balance.totalProfit > 0 ? '+' : ''}${balance.totalProfit.toFixed(2)}` : "0.00", unit: "USDT", up: balance.totalProfit >= 0, icon: TrendingUp },
    { label: "Win Rate", value: balance.winRate.toString(), unit: "%", up: balance.winRate >= 50, icon: TargetIcon },
    { label: "Max Drawdown", value: `-${balance.maxDrawdown}`, unit: "%", up: false, icon: BarChart3 },
    { label: "Total Trades", value: balance.totalTrades.toString(), unit: "Trades", up: true, icon: Activity },
  ];



  return (
    <DashboardLayout>
      <div className="space-y-8">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-border">
          <div>
            <h1 className="text-3xl font-bold font-sans text-foreground">Analytics</h1>
            <p className="text-muted-foreground mt-1 text-sm">Track your trading performance, returns, and activity history.</p>
          </div>
          <div className="flex gap-3">
             <Button variant="outline" className="h-11 border-border bg-card text-sm font-medium px-6 shadow-sm hover:bg-secondary">
               <Download className="w-4 h-4 mr-2" /> Export Report
             </Button>
          </div>
        </header>

        {/* Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {metrics.map((m, i) => (
            <motion.div
              key={m.label}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.1 }}
              className="bg-card p-6 rounded-2xl border border-border shadow-sm hover:border-primary/30 transition-all hover:shadow-md relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full blur-3xl -mr-10 -mt-10" />
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-medium text-muted-foreground">{m.label}</span>
                <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center border border-border">
                  <m.icon className="w-4 h-4 text-primary" />
                </div>
              </div>
              <div className="flex items-baseline gap-1.5">
                <div className="text-3xl font-bold text-foreground tabular-nums">{m.value}</div>
                <div className="text-xs font-medium text-muted-foreground">{m.unit}</div>
              </div>
              <div className={`mt-4 flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full w-fit ${
                m.up ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-600 border border-red-200"
              }`}>
                {m.up ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                {m.up ? "Trending up" : "Trending down"}
              </div>
            </motion.div>
          ))}
        </div>

        <div className="space-y-8">
          <div className="space-y-8">
             {/* Equity Curve */}
             <div className="bg-card p-6 rounded-2xl border border-border shadow-sm">
               <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-bold font-sans text-foreground">Portfolio Growth</h2>
                  <div className="flex gap-2">
                     <button className="px-4 py-1.5 rounded-lg bg-primary/10 text-primary text-xs font-semibold border border-primary/20">All Time</button>
                     <button className="px-4 py-1.5 rounded-lg bg-secondary text-muted-foreground text-xs font-semibold border border-border hover:bg-card transition-colors">YTD</button>
                  </div>
               </div>
               <div className="rounded-xl bg-card border border-border overflow-hidden">
                 <EquityCurve />
               </div>
             </div>

             {/* Trade History */}
             <div className="bg-card p-6 rounded-2xl border border-border shadow-sm">
               <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-bold font-sans text-foreground">Trade History</h2>
                  <div className="flex gap-2">
                     <div className="relative">
                       <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                       <input className="h-10 pl-9 pr-4 bg-secondary border border-border rounded-xl text-sm w-56 focus:border-primary/50 transition-all outline-none" placeholder="Search trades..." />
                     </div>
                     <Button variant="outline" size="icon" className="h-10 w-10 border-border bg-card shadow-sm hover:bg-secondary"><Filter className="w-4 h-4 text-muted-foreground" /></Button>
                  </div>
               </div>
               <div className="overflow-x-auto">
                 <table className="w-full text-sm">
                   <thead>
                     <tr className="text-muted-foreground border-b border-border">
                       <th className="text-left pb-4 font-medium text-xs pl-2">Asset</th>
                       <th className="text-left pb-4 font-medium text-xs">Type</th>
                       <th className="text-left pb-4 font-medium text-xs">Amount</th>
                       <th className="text-left pb-4 font-medium text-xs">Status</th>
                       <th className="text-right pb-4 font-medium text-xs pr-2">P&L</th>
                     </tr>
                   </thead>
                   <tbody className="divide-y divide-border">
                     {tradeHistory.length > 0 ? tradeHistory.map((t, i) => (
                       <tr key={t.id || i} className="group/row hover:bg-secondary/50 transition-colors">
                         <td className="py-4 pl-2">
                           <div className="font-semibold text-foreground group-hover/row:text-primary transition-colors">{t.pair}</div>
                           <div className="text-xs text-muted-foreground mt-0.5">ID: {t.id?.substring(0,8) || 'A9X2..4'}{i}</div>
                         </td>
                         <td className="py-4">
                            <div className={`w-fit px-2.5 py-1 rounded-lg text-xs font-medium border ${
                              t.type?.toLowerCase() === "buy" ? "bg-green-50 text-green-700 border-green-200" : "bg-red-50 text-red-600 border-red-200"
                            }`}>
                              {t.type}
                            </div>
                         </td>
                         <td className="py-4 font-semibold text-foreground">${t.amount?.toLocaleString()}</td>
                         <td className="py-4">
                           <div className="flex items-center gap-1.5">
                             <span className={`w-1.5 h-1.5 rounded-full ${t.status === 'Open' ? 'bg-amber-500' : 'bg-green-500'}`} />
                             <span className="text-xs font-medium text-foreground">{t.status}</span>
                           </div>
                         </td>
                         <td className={`py-4 pr-2 text-right font-bold text-sm ${t.pnl && t.pnl >= 0 ? "text-green-600" : "text-red-600"}`}>
                           {t.pnl != null ? `${t.pnl >= 0 ? "+" : "-"}${Math.abs(t.pnl).toFixed(2)}` : "0.00"}
                         </td>
                       </tr>
                     )) : (
                       <tr>
                         <td colSpan={5} className="py-16 text-center text-muted-foreground font-medium">No trade history yet. Start trading to see your results here.</td>
                       </tr>
                     )}
                   </tbody>
                 </table>
               </div>
             </div>

          </div>
        </div>
        

      </div>
    </DashboardLayout>
  );
};

export default AnalyticsPage;
