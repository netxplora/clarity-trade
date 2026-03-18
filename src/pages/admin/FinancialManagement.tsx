import { useState } from "react";
import AdminLayout from "@/components/layouts/AdminLayout";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import {
  ArrowUpRight, Download, Send, DollarSign, Wallet,
  AlertTriangle, CheckCircle2, XCircle,
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

const stats = [
  { label: "Total Deposits", value: "$1.2M", change: "+18.3%", up: true, icon: Download },
  { label: "Total Withdrawals", value: "$840K", change: "+9.1%", up: true, icon: Send },
  { label: "Platform Fees", value: "$89,241", change: "+12.5%", up: true, icon: DollarSign },
  { label: "Net Balance", value: "$360K", change: "+24.7%", up: true, icon: Wallet },
];

type Tab = "deposits" | "withdrawals" | "fees" | "suspicious";

const deposits = [
  { user: "Alice Johnson", amount: "+0.5000 BTC", usd: "$33,716", status: "Confirmed", date: "Mar 17, 2026" },
  { user: "Carol White", amount: "+10,000 USDT", usd: "$10,000", status: "Confirmed", date: "Mar 17, 2026" },
  { user: "Frank Miller", amount: "+2.0000 ETH", usd: "$7,043", status: "Pending", date: "Mar 16, 2026" },
];

interface Withdrawal {
  user: string;
  amount: string;
  usd: string;
  status: string;
  date: string;
}

const initialWithdrawals: Withdrawal[] = [
  { user: "Alice Johnson", amount: "-0.0370 BTC", usd: "$2,500", status: "Pending Approval", date: "Mar 17, 2026" },
  { user: "Carol White", amount: "-10,000 USDT", usd: "$10,000", status: "Pending Approval", date: "Mar 17, 2026" },
  { user: "Eve Davis", amount: "-0.2130 ETH", usd: "$750", status: "Approved", date: "Mar 16, 2026" },
  { user: "Bob Smith", amount: "-500 USDT", usd: "$500", status: "Completed", date: "Mar 15, 2026" },
];

const suspiciousActivity = [
  { user: "Unknown IP", detail: "Multiple failed login attempts from 3 different IPs", severity: "High", time: "2 min ago" },
  { user: "Bob Smith", detail: "Withdrawal request exceeds daily limit", severity: "Medium", time: "15 min ago" },
  { user: "New Account", detail: "Large deposit immediately followed by withdrawal request", severity: "High", time: "1 hr ago" },
];

const FinancialManagement = () => {
  const [tab, setTab] = useState<Tab>("withdrawals");
  const [withdrawals, setWithdrawals] = useState(initialWithdrawals);

  const handleWithdrawalAction = (index: number, action: "Approved" | "Rejected") => {
    setWithdrawals(withdrawals.map((w, i) => i === index ? { ...w, status: action } : w));
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold font-display">Financial Management</h1>
          <p className="text-muted-foreground text-sm">Full transaction oversight and approval workflows</p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className="glass-card p-4 sm:p-5"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs sm:text-sm text-muted-foreground">{stat.label}</span>
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                  <stat.icon className="w-4 h-4 text-primary" />
                </div>
              </div>
              <div className="text-xl sm:text-2xl font-bold font-display">{stat.value}</div>
              <div className="flex items-center gap-1 text-sm text-profit mt-1">
                <ArrowUpRight className="w-4 h-4" /> {stat.change}
              </div>
            </motion.div>
          ))}
        </div>

        <div className="glass-card">
          <div className="flex border-b border-border overflow-x-auto">
            {(["withdrawals", "deposits", "fees", "suspicious"] as Tab[]).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-4 sm:px-6 py-4 text-sm font-medium capitalize transition-colors whitespace-nowrap ${
                  tab === t ? "text-primary border-b-2 border-primary" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {t === "suspicious" ? "⚠️ Activity" : t}
              </button>
            ))}
          </div>

          <div className="p-4 sm:p-6 overflow-x-auto">
            {tab === "withdrawals" && (
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-muted-foreground border-b border-border">
                    <th className="text-left pb-3 font-medium">User</th>
                    <th className="text-left pb-3 font-medium hidden sm:table-cell">Amount</th>
                    <th className="text-left pb-3 font-medium">USD</th>
                    <th className="text-left pb-3 font-medium">Status</th>
                    <th className="text-right pb-3 font-medium">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {withdrawals.map((w, i) => (
                    <tr key={i} className="border-b border-border/50 last:border-0">
                      <td className="py-3 font-medium font-display">{w.user}</td>
                      <td className="py-3 text-loss hidden sm:table-cell">{w.amount}</td>
                      <td className="py-3">{w.usd}</td>
                      <td className="py-3">
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                          w.status === "Pending Approval" ? "bg-warning/10 text-warning" :
                          w.status === "Approved" ? "bg-primary/10 text-primary" :
                          w.status === "Rejected" ? "bg-loss/10 text-loss" :
                          "bg-profit/10 text-profit"
                        }`}>{w.status}</span>
                      </td>
                      <td className="py-3 text-right">
                        {w.status === "Pending Approval" && (
                          <div className="flex justify-end gap-1">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <button onClick={() => handleWithdrawalAction(i, "Approved")} className="p-1.5 rounded bg-profit/10 text-profit hover:bg-profit/20">
                                  <CheckCircle2 className="w-4 h-4" />
                                </button>
                              </TooltipTrigger>
                              <TooltipContent>Approve</TooltipContent>
                            </Tooltip>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <button onClick={() => handleWithdrawalAction(i, "Rejected")} className="p-1.5 rounded bg-loss/10 text-loss hover:bg-loss/20">
                                  <XCircle className="w-4 h-4" />
                                </button>
                              </TooltipTrigger>
                              <TooltipContent>Reject</TooltipContent>
                            </Tooltip>
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
                    <th className="text-left pb-3 font-medium hidden sm:table-cell">Amount</th>
                    <th className="text-left pb-3 font-medium">USD</th>
                    <th className="text-left pb-3 font-medium">Status</th>
                    <th className="text-right pb-3 font-medium">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {deposits.map((d, i) => (
                    <tr key={i} className="border-b border-border/50 last:border-0">
                      <td className="py-3 font-medium font-display">{d.user}</td>
                      <td className="py-3 text-profit hidden sm:table-cell">{d.amount}</td>
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
              <div className="space-y-4">
                <div className="grid sm:grid-cols-3 gap-4">
                  <div className="p-4 rounded-lg bg-secondary/50 text-center">
                    <div className="text-2xl font-bold font-display text-primary">$54,200</div>
                    <div className="text-xs text-muted-foreground mt-1">Trading Fees (MTD)</div>
                  </div>
                  <div className="p-4 rounded-lg bg-secondary/50 text-center">
                    <div className="text-2xl font-bold font-display text-primary">$22,840</div>
                    <div className="text-xs text-muted-foreground mt-1">Copy Trading Commissions</div>
                  </div>
                  <div className="p-4 rounded-lg bg-secondary/50 text-center">
                    <div className="text-2xl font-bold font-display text-primary">$12,201</div>
                    <div className="text-xs text-muted-foreground mt-1">Withdrawal Fees</div>
                  </div>
                </div>
              </div>
            )}

            {tab === "suspicious" && (
              <div className="space-y-3">
                {suspiciousActivity.map((a, i) => (
                  <div key={i} className={`p-4 rounded-lg border ${a.severity === "High" ? "border-loss/30 bg-loss/5" : "border-warning/30 bg-warning/5"}`}>
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <AlertTriangle className={`w-5 h-5 mt-0.5 ${a.severity === "High" ? "text-loss" : "text-warning"}`} />
                        <div>
                          <div className="font-medium font-display text-sm">{a.user}</div>
                          <div className="text-xs text-muted-foreground mt-0.5">{a.detail}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className={`text-xs font-medium px-2 py-0.5 rounded ${a.severity === "High" ? "bg-loss/10 text-loss" : "bg-warning/10 text-warning"}`}>{a.severity}</span>
                        <div className="text-xs text-muted-foreground mt-1">{a.time}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default FinancialManagement;
