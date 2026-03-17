import { useState } from "react";
import { motion } from "framer-motion";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ArrowUpRight,
  ArrowDownRight,
  Copy,
  QrCode,
  Send,
  Download,
  Bitcoin,
} from "lucide-react";

const balances = [
  { coin: "Bitcoin", symbol: "BTC", amount: "0.4521", usd: "$30,482.12", icon: "₿", change: "+2.3%" },
  { coin: "Ethereum", symbol: "ETH", amount: "4.2100", usd: "$14,821.62", icon: "Ξ", change: "+1.1%" },
  { coin: "Tether", symbol: "USDT", amount: "5,241.00", usd: "$5,241.00", icon: "₮", change: "0.0%" },
];

const transactions = [
  { type: "Deposit", coin: "BTC", amount: "+0.0500 BTC", usd: "$3,371.62", status: "Confirmed", date: "Mar 15, 2026" },
  { type: "Withdrawal", coin: "USDT", amount: "-500.00 USDT", usd: "$500.00", status: "Completed", date: "Mar 14, 2026" },
  { type: "Deposit", coin: "ETH", amount: "+1.2000 ETH", usd: "$4,226.16", status: "Confirmed", date: "Mar 12, 2026" },
  { type: "Withdrawal", coin: "BTC", amount: "-0.0200 BTC", usd: "$1,348.65", status: "Pending", date: "Mar 10, 2026" },
  { type: "Deposit", coin: "USDT", amount: "+2,000.00 USDT", usd: "$2,000.00", status: "Confirmed", date: "Mar 8, 2026" },
];

type Tab = "deposit" | "withdraw" | "history";

const WalletPage = () => {
  const [tab, setTab] = useState<Tab>("deposit");
  const [selectedCoin, setSelectedCoin] = useState("BTC");

  const mockAddress = "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh";

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold font-display">Wallet</h1>
          <p className="text-muted-foreground text-sm">Manage your crypto balances</p>
        </div>

        {/* Total balance */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card glass-glow p-6"
        >
          <div className="text-sm text-muted-foreground mb-1">Total Balance</div>
          <div className="text-4xl font-bold font-display">$50,544.74</div>
          <div className="flex items-center gap-1 text-profit text-sm mt-1">
            <ArrowUpRight className="w-4 h-4" /> +$1,234.50 (2.5%) today
          </div>
        </motion.div>

        {/* Coin balances */}
        <div className="grid sm:grid-cols-3 gap-4">
          {balances.map((b, i) => (
            <motion.div
              key={b.symbol}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className="glass-card p-5"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-lg font-bold text-primary">
                  {b.icon}
                </div>
                <div>
                  <div className="font-medium font-display">{b.coin}</div>
                  <div className="text-xs text-muted-foreground">{b.symbol}</div>
                </div>
              </div>
              <div className="text-lg font-bold font-display">{b.usd}</div>
              <div className="text-sm text-muted-foreground">{b.amount} {b.symbol}</div>
            </motion.div>
          ))}
        </div>

        {/* Tabs */}
        <div className="glass-card">
          <div className="flex border-b border-border">
            {(["deposit", "withdraw", "history"] as Tab[]).map((t) => (
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

          <div className="p-6">
            {tab === "deposit" && (
              <div className="max-w-md space-y-5">
                <div>
                  <label className="text-sm text-muted-foreground mb-2 block">Select Cryptocurrency</label>
                  <div className="flex gap-2">
                    {["BTC", "ETH", "USDT"].map((c) => (
                      <button
                        key={c}
                        onClick={() => setSelectedCoin(c)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                          selectedCoin === c ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-sm text-muted-foreground mb-2 block">Your {selectedCoin} Deposit Address</label>
                  <div className="flex items-center gap-2">
                    <Input value={mockAddress} readOnly className="bg-secondary border-border font-mono text-xs" />
                    <Button variant="outline" size="icon">
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div className="w-48 h-48 bg-secondary rounded-xl flex items-center justify-center mx-auto">
                  <QrCode className="w-24 h-24 text-muted-foreground" />
                </div>

                <p className="text-xs text-muted-foreground text-center">
                  Send only {selectedCoin} to this address. Deposits require 3 network confirmations.
                </p>
              </div>
            )}

            {tab === "withdraw" && (
              <div className="max-w-md space-y-5">
                <div>
                  <label className="text-sm text-muted-foreground mb-2 block">Cryptocurrency</label>
                  <div className="flex gap-2">
                    {["BTC", "ETH", "USDT"].map((c) => (
                      <button
                        key={c}
                        onClick={() => setSelectedCoin(c)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                          selectedCoin === c ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground mb-2 block">Recipient Address</label>
                  <Input placeholder="Enter wallet address" className="bg-secondary border-border" />
                </div>
                <div>
                  <label className="text-sm text-muted-foreground mb-2 block">Amount</label>
                  <Input placeholder="0.00" type="number" className="bg-secondary border-border" />
                </div>
                <Button variant="hero" className="w-full h-12">
                  <Send className="w-4 h-4 mr-2" /> Submit Withdrawal
                </Button>
                <p className="text-xs text-muted-foreground">
                  Withdrawals require admin approval and may take up to 24 hours.
                </p>
              </div>
            )}

            {tab === "history" && (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-muted-foreground border-b border-border">
                      <th className="text-left pb-3 font-medium">Type</th>
                      <th className="text-left pb-3 font-medium">Amount</th>
                      <th className="text-left pb-3 font-medium">USD Value</th>
                      <th className="text-left pb-3 font-medium">Status</th>
                      <th className="text-right pb-3 font-medium">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((tx, i) => (
                      <tr key={i} className="border-b border-border/50 last:border-0">
                        <td className="py-3">
                          <div className="flex items-center gap-2">
                            {tx.type === "Deposit" ? (
                              <Download className="w-4 h-4 text-profit" />
                            ) : (
                              <Send className="w-4 h-4 text-loss" />
                            )}
                            {tx.type}
                          </div>
                        </td>
                        <td className={`py-3 font-medium font-display ${tx.type === "Deposit" ? "text-profit" : "text-loss"}`}>
                          {tx.amount}
                        </td>
                        <td className="py-3">{tx.usd}</td>
                        <td className="py-3">
                          <span
                            className={`px-2 py-0.5 rounded text-xs font-medium ${
                              tx.status === "Confirmed"
                                ? "bg-profit/10 text-profit"
                                : tx.status === "Pending"
                                ? "bg-warning/10 text-warning"
                                : "bg-primary/10 text-primary"
                            }`}
                          >
                            {tx.status}
                          </span>
                        </td>
                        <td className="py-3 text-right text-muted-foreground">{tx.date}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default WalletPage;
