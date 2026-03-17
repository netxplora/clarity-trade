import { motion } from "framer-motion";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import {
  ArrowUpRight,
  ArrowDownRight,
  Wallet,
  TrendingUp,
  Users,
  Activity,
} from "lucide-react";

const stats = [
  { label: "Total Balance", value: "$24,563.00", change: "+12.5%", up: true, icon: Wallet },
  { label: "Total Profit", value: "$3,241.50", change: "+8.2%", up: true, icon: TrendingUp },
  { label: "Active Trades", value: "12", change: "+3", up: true, icon: Activity },
  { label: "Copied Traders", value: "4", change: "0", up: true, icon: Users },
];

const recentTrades = [
  { pair: "BTC/USDT", type: "Buy", amount: "$2,500", pnl: "+$340.00", pnlUp: true, time: "2 min ago" },
  { pair: "ETH/USDT", type: "Sell", amount: "$1,200", pnl: "-$45.20", pnlUp: false, time: "15 min ago" },
  { pair: "SOL/USDT", type: "Buy", amount: "$800", pnl: "+$122.80", pnlUp: true, time: "1 hr ago" },
  { pair: "BNB/USDT", type: "Buy", amount: "$600", pnl: "+$78.50", pnlUp: true, time: "3 hr ago" },
  { pair: "XRP/USDT", type: "Sell", amount: "$450", pnl: "-$12.30", pnlUp: false, time: "5 hr ago" },
];

const copiedTraders = [
  { name: "Alex Morgan", roi: "+127.4%", status: "Active", invested: "$5,000" },
  { name: "Sarah Chen", roi: "+89.6%", status: "Active", invested: "$3,000" },
  { name: "Marcus Rivera", roi: "+203.1%", status: "Paused", invested: "$2,000" },
];

const Overview = () => {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold font-display">Dashboard</h1>
          <p className="text-muted-foreground text-sm">Welcome back, John. Here's your portfolio overview.</p>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className="glass-card p-5"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-muted-foreground">{stat.label}</span>
                <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                  <stat.icon className="w-4 h-4 text-primary" />
                </div>
              </div>
              <div className="text-2xl font-bold font-display">{stat.value}</div>
              <div className={`flex items-center gap-1 text-sm mt-1 ${stat.up ? "text-profit" : "text-loss"}`}>
                {stat.up ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                {stat.change}
              </div>
            </motion.div>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Recent trades */}
          <div className="lg:col-span-2 glass-card p-6">
            <h2 className="text-lg font-semibold font-display mb-4">Recent Trades</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-muted-foreground border-b border-border">
                    <th className="text-left pb-3 font-medium">Pair</th>
                    <th className="text-left pb-3 font-medium">Type</th>
                    <th className="text-left pb-3 font-medium">Amount</th>
                    <th className="text-left pb-3 font-medium">P&L</th>
                    <th className="text-right pb-3 font-medium">Time</th>
                  </tr>
                </thead>
                <tbody>
                  {recentTrades.map((trade, i) => (
                    <tr key={i} className="border-b border-border/50 last:border-0">
                      <td className="py-3 font-medium font-display">{trade.pair}</td>
                      <td className="py-3">
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${trade.type === "Buy" ? "bg-profit/10 text-profit" : "bg-loss/10 text-loss"}`}>
                          {trade.type}
                        </span>
                      </td>
                      <td className="py-3">{trade.amount}</td>
                      <td className={`py-3 font-medium ${trade.pnlUp ? "text-profit" : "text-loss"}`}>{trade.pnl}</td>
                      <td className="py-3 text-right text-muted-foreground">{trade.time}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Copied traders */}
          <div className="glass-card p-6">
            <h2 className="text-lg font-semibold font-display mb-4">Copied Traders</h2>
            <div className="space-y-4">
              {copiedTraders.map((trader) => (
                <div key={trader.name} className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
                  <div>
                    <div className="font-medium font-display text-sm">{trader.name}</div>
                    <div className="text-xs text-muted-foreground">{trader.invested} invested</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-profit">{trader.roi}</div>
                    <span className={`text-xs ${trader.status === "Active" ? "text-profit" : "text-warning"}`}>
                      {trader.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Overview;
