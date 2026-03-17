import { motion } from "framer-motion";
import AdminLayout from "@/components/layouts/AdminLayout";
import {
  Users,
  DollarSign,
  Activity,
  TrendingUp,
  ArrowUpRight,
} from "lucide-react";

const stats = [
  { label: "Total Users", value: "12,483", change: "+124 today", icon: Users },
  { label: "Total Revenue", value: "$89,241", change: "+12.3%", icon: DollarSign },
  { label: "Active Trades", value: "3,421", change: "+8.7%", icon: Activity },
  { label: "Total Volume", value: "$2.1M", change: "+15.2%", icon: TrendingUp },
];

const recentUsers = [
  { name: "Alice Johnson", email: "alice@email.com", status: "Verified", balance: "$12,400" },
  { name: "Bob Smith", email: "bob@email.com", status: "Pending KYC", balance: "$3,200" },
  { name: "Carol White", email: "carol@email.com", status: "Verified", balance: "$45,600" },
  { name: "Dan Brown", email: "dan@email.com", status: "Suspended", balance: "$0" },
];

const pendingWithdrawals = [
  { user: "Alice Johnson", amount: "$2,500", coin: "BTC", date: "Mar 17" },
  { user: "Carol White", amount: "$10,000", coin: "USDT", date: "Mar 17" },
  { user: "Eve Davis", amount: "$750", coin: "ETH", date: "Mar 16" },
];

const AdminOverview = () => {
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold font-display">Admin Dashboard</h1>
          <p className="text-muted-foreground text-sm">Platform overview and key metrics</p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
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
              <div className="flex items-center gap-1 text-sm text-profit mt-1">
                <ArrowUpRight className="w-4 h-4" /> {stat.change}
              </div>
            </motion.div>
          ))}
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          <div className="glass-card p-6">
            <h2 className="text-lg font-semibold font-display mb-4">Recent Users</h2>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-muted-foreground border-b border-border">
                  <th className="text-left pb-3 font-medium">Name</th>
                  <th className="text-left pb-3 font-medium">Status</th>
                  <th className="text-right pb-3 font-medium">Balance</th>
                </tr>
              </thead>
              <tbody>
                {recentUsers.map((u) => (
                  <tr key={u.email} className="border-b border-border/50 last:border-0">
                    <td className="py-3">
                      <div className="font-medium font-display">{u.name}</div>
                      <div className="text-xs text-muted-foreground">{u.email}</div>
                    </td>
                    <td className="py-3">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                        u.status === "Verified" ? "bg-profit/10 text-profit" :
                        u.status === "Suspended" ? "bg-loss/10 text-loss" :
                        "bg-warning/10 text-warning"
                      }`}>{u.status}</span>
                    </td>
                    <td className="py-3 text-right font-medium font-display">{u.balance}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="glass-card p-6">
            <h2 className="text-lg font-semibold font-display mb-4">Pending Withdrawals</h2>
            <div className="space-y-3">
              {pendingWithdrawals.map((w, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
                  <div>
                    <div className="font-medium font-display text-sm">{w.user}</div>
                    <div className="text-xs text-muted-foreground">{w.coin} · {w.date}</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-bold font-display">{w.amount}</span>
                    <div className="flex gap-1">
                      <button className="px-3 py-1 rounded bg-profit/10 text-profit text-xs font-medium hover:bg-profit/20">Approve</button>
                      <button className="px-3 py-1 rounded bg-loss/10 text-loss text-xs font-medium hover:bg-loss/20">Reject</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminOverview;
