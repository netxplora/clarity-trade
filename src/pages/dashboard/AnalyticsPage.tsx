import { useMemo } from "react";
import { motion } from "framer-motion";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import {
  ArrowUpRight, ArrowDownRight, TrendingUp, Target, BarChart3, Activity,
} from "lucide-react";

const metrics = [
  { label: "Total ROI", value: "+34.7%", up: true, icon: TrendingUp },
  { label: "Win Rate", value: "76%", up: true, icon: Target },
  { label: "Max Drawdown", value: "-8.2%", up: false, icon: BarChart3 },
  { label: "Total Trades", value: "142", up: true, icon: Activity },
];

const monthlyPerformance = [
  { month: "Oct", pnl: 1240, up: true },
  { month: "Nov", pnl: -320, up: false },
  { month: "Dec", pnl: 2100, up: true },
  { month: "Jan", pnl: 870, up: true },
  { month: "Feb", pnl: 1560, up: true },
  { month: "Mar", pnl: 940, up: true },
];

const tradeHistory = [
  { pair: "BTC/USDT", type: "Buy", entry: "$64,200", exit: "$67,432", pnl: "+$3,232", pnlUp: true, date: "Mar 15" },
  { pair: "ETH/USDT", type: "Sell", entry: "$3,600", exit: "$3,521", pnl: "+$79", pnlUp: true, date: "Mar 14" },
  { pair: "SOL/USDT", type: "Buy", entry: "$182", exit: "$178", pnl: "-$4", pnlUp: false, date: "Mar 13" },
  { pair: "BNB/USDT", type: "Buy", entry: "$580", exit: "$612", pnl: "+$32", pnlUp: true, date: "Mar 12" },
  { pair: "BTC/USDT", type: "Sell", entry: "$66,800", exit: "$65,100", pnl: "+$1,700", pnlUp: true, date: "Mar 10" },
  { pair: "XRP/USDT", type: "Buy", entry: "$0.58", exit: "$0.62", pnl: "+$0.04", pnlUp: true, date: "Mar 9" },
];

const EquityCurve = () => {
  const data = useMemo(() => {
    const points: number[] = [];
    let value = 10000;
    for (let i = 0; i < 90; i++) {
      value += (Math.random() - 0.38) * 200;
      points.push(value);
    }
    return points;
  }, []);

  const min = Math.min(...data);
  const max = Math.max(...data);
  const path = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * 600;
      const y = 150 - ((v - min) / (max - min)) * 140;
      return `${i === 0 ? "M" : "L"} ${x} ${y}`;
    })
    .join(" ");

  return (
    <svg viewBox="0 0 600 160" className="w-full h-40">
      <defs>
        <linearGradient id="eq-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.3" />
          <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={path + " L 600 160 L 0 160 Z"} fill="url(#eq-grad)" />
      <path d={path} fill="none" stroke="hsl(var(--primary))" strokeWidth="2" />
    </svg>
  );
};

const AnalyticsPage = () => {
  const maxPnl = Math.max(...monthlyPerformance.map((m) => Math.abs(m.pnl)));

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold font-display">Analytics</h1>
          <p className="text-muted-foreground text-sm">Your trading performance at a glance</p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {metrics.map((m, i) => (
            <motion.div
              key={m.label}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className="glass-card p-4 sm:p-5"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs sm:text-sm text-muted-foreground">{m.label}</span>
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                  <m.icon className="w-4 h-4 text-primary" />
                </div>
              </div>
              <div className="text-xl sm:text-2xl font-bold font-display">{m.value}</div>
            </motion.div>
          ))}
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          <div className="glass-card p-6">
            <h2 className="text-lg font-semibold font-display mb-4">Equity Curve</h2>
            <EquityCurve />
          </div>

          <div className="glass-card p-6">
            <h2 className="text-lg font-semibold font-display mb-4">Monthly P&L</h2>
            <div className="space-y-3">
              {monthlyPerformance.map((m) => (
                <div key={m.month} className="flex items-center gap-3">
                  <span className="text-sm text-muted-foreground w-8">{m.month}</span>
                  <div className="flex-1 h-8 bg-secondary/50 rounded-lg overflow-hidden relative">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(Math.abs(m.pnl) / maxPnl) * 100}%` }}
                      transition={{ duration: 0.6, delay: 0.1 }}
                      className={`h-full rounded-lg ${m.up ? "bg-profit/20" : "bg-loss/20"}`}
                    />
                  </div>
                  <span className={`text-sm font-medium font-display w-20 text-right ${m.up ? "text-profit" : "text-loss"}`}>
                    {m.up ? "+" : ""}${Math.abs(m.pnl).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="glass-card p-6">
          <h2 className="text-lg font-semibold font-display mb-4">Trade History</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-muted-foreground border-b border-border">
                  <th className="text-left pb-3 font-medium">Pair</th>
                  <th className="text-left pb-3 font-medium">Type</th>
                  <th className="text-left pb-3 font-medium hidden sm:table-cell">Entry</th>
                  <th className="text-left pb-3 font-medium hidden sm:table-cell">Exit</th>
                  <th className="text-left pb-3 font-medium">P&L</th>
                  <th className="text-right pb-3 font-medium">Date</th>
                </tr>
              </thead>
              <tbody>
                {tradeHistory.map((t, i) => (
                  <tr key={i} className="border-b border-border/50 last:border-0">
                    <td className="py-3 font-medium font-display">{t.pair}</td>
                    <td className="py-3">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${t.type === "Buy" ? "bg-profit/10 text-profit" : "bg-loss/10 text-loss"}`}>
                        {t.type}
                      </span>
                    </td>
                    <td className="py-3 hidden sm:table-cell">{t.entry}</td>
                    <td className="py-3 hidden sm:table-cell">{t.exit}</td>
                    <td className={`py-3 font-medium ${t.pnlUp ? "text-profit" : "text-loss"}`}>{t.pnl}</td>
                    <td className="py-3 text-right text-muted-foreground">{t.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AnalyticsPage;
