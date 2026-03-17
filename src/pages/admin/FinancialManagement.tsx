import { useState } from "react";
import AdminLayout from "@/components/layouts/AdminLayout";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import {
  ArrowUpRight,
  ArrowDownRight,
  Download,
  Send,
  DollarSign,
  Wallet,
} from "lucide-react";

const stats = [
  { label: "Total Deposits", value: "$1.2M", change: "+18.3%", up: true, icon: Download },
  { label: "Total Withdrawals", value: "$840K", change: "+9.1%", up: true, icon: Send },
  { label: "Platform Fees", value: "$89,241", change: "+12.5%", up: true, icon: DollarSign },
  { label: "Net Balance", value: "$360K", change: "+24.7%", up: true, icon: Wallet },
];

type Tab = "deposits" | "withdrawals" | "fees";

const deposits = [
  { user: "Alice Johnson", amount: "+0.5000 BTC", usd: "$33,716", status: "Confirmed", date: "Mar 17, 2026" },
  { user: "Carol White", amount: "+10,000 USDT", usd: "$10,000", status: "Confirmed", date: "Mar 17, 2026" },
  { user: "Frank Miller", amount: "+2.0000 ETH", usd: "$7,043", status: "Pending", date: "Mar 16, 2026" },
];

const withdrawals = [
  { user: "Alice Johnson", amount: "-0.0370 BTC", usd: "$2,500", status: "Pending Approval", date: "Mar 17, 2026" },
  { user: "Carol White", amount: "-10,000 USDT", usd: "$10,000", status: "Pending Approval", date: "Mar 17, 2026" },
  { user: "Eve Davis", amount: "-0.2130 ETH", usd: "$750", status: "Approved", date: "Mar 16, 2026" },
  { user: "Bob Smith", amount: "-500 USDT", usd: "$500", status: "Completed", date: "Mar 15, 2026" },
];

const FinancialManagement = () => {
  const [tab, setTab] = useState<Tab>("withdrawals");

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold font-display">Financial Management</h1>
          <p className="text-muted-foreground text-sm">Monitor deposits, withdrawals, and platform revenue</p>
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

        <div className="glass-card">
          <div className="flex border-b border-border">
            {(["withdrawals", "deposits", "fees"] as Tab[]).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-6 py-4 text-sm font-medium capitalize transition-colors ${
                  tab === t ? "text-primary border-b-2 border-primary" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          <div className="p-6 overflow-x-auto">
            {tab === "withdrawals" && (
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-muted-foreground border-b border-border">
                    <th className="text-left pb-3 font-medium">User</th>
                    <th className="text-left pb-3 font-medium">Amount</th>
                    <th className="text-left pb-3 font-medium">USD</th>
                    <th className="text-left pb-3 font-medium">Status</th>
                    <th className="text-left pb-3 font-medium">Date</th>
                    <th className="text-right pb-3 font-medium">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {withdrawals.map((w, i) => (
                    <tr key={i} className="border-b border-border/50 last:border-0">
                      <td className="py-3 font-medium font-display">{w.user}</td>
                      <td className="py-3 text-loss">{w.amount}</td>
                      <td className="py-3">{w.usd}</td>
                      <td className="py-3">
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                          w.status === "Pending Approval" ? "bg-warning/10 text-warning" :
                          w.status === "Approved" ? "bg-primary/10 text-primary" :
                          "bg-profit/10 text-profit"
                        }`}>{w.status}</span>
                      </td>
                      <td className="py-3 text-muted-foreground">{w.date}</td>
                      <td className="py-3 text-right">
                        {w.status === "Pending Approval" && (
                          <div className="flex justify-end gap-1">
                            <button className="px-3 py-1 rounded bg-profit/10 text-profit text-xs font-medium hover:bg-profit/20">Approve</button>
                            <button className="px-3 py-1 rounded bg-loss/10 text-loss text-xs font-medium hover:bg-loss/20">Reject</button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {tab === "deposits" && (
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-muted-foreground border-b border-border">
                    <th className="text-left pb-3 font-medium">User</th>
                    <th className="text-left pb-3 font-medium">Amount</th>
                    <th className="text-left pb-3 font-medium">USD</th>
                    <th className="text-left pb-3 font-medium">Status</th>
                    <th className="text-right pb-3 font-medium">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {deposits.map((d, i) => (
                    <tr key={i} className="border-b border-border/50 last:border-0">
                      <td className="py-3 font-medium font-display">{d.user}</td>
                      <td className="py-3 text-profit">{d.amount}</td>
                      <td className="py-3">{d.usd}</td>
                      <td className="py-3">
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                          d.status === "Confirmed" ? "bg-profit/10 text-profit" : "bg-warning/10 text-warning"
                        }`}>{d.status}</span>
                      </td>
                      <td className="py-3 text-right text-muted-foreground">{d.date}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {tab === "fees" && (
              <div className="text-center py-12 text-muted-foreground">
                <DollarSign className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>Fee breakdown and revenue analytics coming soon.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default FinancialManagement;
