import { useState } from "react";
import { motion } from "framer-motion";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Star,
  Copy,
  Search,
  TrendingUp,
  Shield,
  Users,
  SlidersHorizontal,
} from "lucide-react";

const traders = [
  { name: "Alex Morgan", avatar: "AM", roi: "+127.4%", risk: "Medium", riskColor: "text-warning", winRate: "78%", followers: "3.2K", trades: 1243, rating: 4.9, drawdown: "12.3%", invested: null },
  { name: "Sarah Chen", avatar: "SC", roi: "+89.6%", risk: "Low", riskColor: "text-profit", winRate: "82%", followers: "5.8K", trades: 892, rating: 4.8, drawdown: "6.1%", invested: null },
  { name: "Marcus Rivera", avatar: "MR", roi: "+203.1%", risk: "High", riskColor: "text-loss", winRate: "71%", followers: "2.1K", trades: 2341, rating: 4.7, drawdown: "24.7%", invested: null },
  { name: "Yuki Tanaka", avatar: "YT", roi: "+56.2%", risk: "Low", riskColor: "text-profit", winRate: "85%", followers: "7.3K", trades: 567, rating: 4.9, drawdown: "4.2%", invested: null },
  { name: "James Wilson", avatar: "JW", roi: "+145.8%", risk: "Medium", riskColor: "text-warning", winRate: "74%", followers: "1.9K", trades: 1876, rating: 4.6, drawdown: "15.8%", invested: null },
  { name: "Lena Dubois", avatar: "LD", roi: "+92.3%", risk: "Low", riskColor: "text-profit", winRate: "80%", followers: "4.5K", trades: 723, rating: 4.8, drawdown: "7.5%", invested: null },
];

type Filter = "all" | "low" | "medium" | "high";

const CopyTradingPage = () => {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [selectedTrader, setSelectedTrader] = useState<string | null>(null);
  const [copyAmount, setCopyAmount] = useState("");

  const filtered = traders.filter((t) => {
    if (filter !== "all" && t.risk.toLowerCase() !== filter) return false;
    if (search && !t.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold font-display">Copy Trading</h1>
          <p className="text-muted-foreground text-sm">Browse and copy top-performing traders</p>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search traders..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 bg-secondary border-border"
            />
          </div>
          <div className="flex gap-2">
            {(["all", "low", "medium", "high"] as Filter[]).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-all ${
                  filter === f ? "bg-primary/10 text-primary" : "bg-secondary text-muted-foreground hover:text-foreground"
                }`}
              >
                {f === "all" ? "All Risk" : f}
              </button>
            ))}
          </div>
        </div>

        {/* Trader grid */}
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((trader, i) => (
            <motion.div
              key={trader.name}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="glass-card p-5 hover:border-primary/20 transition-all duration-300"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-full bg-primary/20 flex items-center justify-center font-display font-bold text-primary text-sm">
                    {trader.avatar}
                  </div>
                  <div>
                    <h4 className="font-semibold font-display">{trader.name}</h4>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Star className="w-3 h-3 text-warning fill-warning" />
                      {trader.rating} · <Users className="w-3 h-3" /> {trader.followers}
                    </div>
                  </div>
                </div>
                <span className={`text-xs font-medium px-2 py-1 rounded ${
                  trader.risk === "Low" ? "bg-profit/10 text-profit" :
                  trader.risk === "Medium" ? "bg-warning/10 text-warning" :
                  "bg-loss/10 text-loss"
                }`}>
                  {trader.risk} Risk
                </span>
              </div>

              <div className="grid grid-cols-4 gap-2 mb-4">
                <div className="text-center p-2 rounded-lg bg-secondary/50">
                  <div className="text-sm font-bold text-profit font-display">{trader.roi}</div>
                  <div className="text-[10px] text-muted-foreground">ROI</div>
                </div>
                <div className="text-center p-2 rounded-lg bg-secondary/50">
                  <div className="text-sm font-bold font-display">{trader.winRate}</div>
                  <div className="text-[10px] text-muted-foreground">Win Rate</div>
                </div>
                <div className="text-center p-2 rounded-lg bg-secondary/50">
                  <div className="text-sm font-bold font-display">{trader.trades}</div>
                  <div className="text-[10px] text-muted-foreground">Trades</div>
                </div>
                <div className="text-center p-2 rounded-lg bg-secondary/50">
                  <div className="text-sm font-bold text-loss font-display">{trader.drawdown}</div>
                  <div className="text-[10px] text-muted-foreground">Drawdown</div>
                </div>
              </div>

              {selectedTrader === trader.name ? (
                <div className="space-y-3">
                  <Input
                    placeholder="Investment amount (USDT)"
                    type="number"
                    value={copyAmount}
                    onChange={(e) => setCopyAmount(e.target.value)}
                    className="bg-secondary border-border h-9 text-sm"
                  />
                  <div className="flex gap-2">
                    <Button variant="hero" size="sm" className="flex-1">
                      Confirm Copy
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setSelectedTrader(null)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <Button
                  variant="hero"
                  size="sm"
                  className="w-full"
                  onClick={() => { setSelectedTrader(trader.name); setCopyAmount(""); }}
                >
                  <Copy className="w-4 h-4 mr-1" /> Copy Trader
                </Button>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default CopyTradingPage;
