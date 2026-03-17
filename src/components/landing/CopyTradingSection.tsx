import { motion } from "framer-motion";
import { Star, TrendingUp, Shield, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";

const traders = [
  {
    name: "Alex Morgan",
    avatar: "AM",
    roi: "+127.4%",
    risk: "Medium",
    riskColor: "text-warning",
    followers: "3.2K",
    winRate: "78%",
    rating: 4.9,
  },
  {
    name: "Sarah Chen",
    avatar: "SC",
    roi: "+89.6%",
    risk: "Low",
    riskColor: "text-profit",
    followers: "5.8K",
    winRate: "82%",
    rating: 4.8,
  },
  {
    name: "Marcus Rivera",
    avatar: "MR",
    roi: "+203.1%",
    risk: "High",
    riskColor: "text-loss",
    followers: "2.1K",
    winRate: "71%",
    rating: 4.7,
  },
];

const CopyTradingSection = () => {
  return (
    <section className="py-24 relative">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/[0.02] to-transparent" />
      <div className="container relative mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-5xl font-bold font-display mb-4">
            Copy <span className="text-gradient-primary">Top Traders</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            Browse proven traders, copy their strategies with one click, and earn together.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {traders.map((trader, i) => (
            <motion.div
              key={trader.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.12 }}
              className="glass-card glass-glow p-6 hover:border-primary/30 transition-all duration-300"
            >
              <div className="flex items-center gap-4 mb-5">
                <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center font-display font-bold text-primary">
                  {trader.avatar}
                </div>
                <div>
                  <h4 className="font-semibold font-display">{trader.name}</h4>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Star className="w-3.5 h-3.5 text-warning fill-warning" />
                    {trader.rating} · {trader.followers} followers
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 mb-5">
                <div className="text-center p-3 rounded-lg bg-secondary/50">
                  <div className="text-lg font-bold text-profit font-display">{trader.roi}</div>
                  <div className="text-xs text-muted-foreground">ROI</div>
                </div>
                <div className="text-center p-3 rounded-lg bg-secondary/50">
                  <div className="text-lg font-bold font-display">{trader.winRate}</div>
                  <div className="text-xs text-muted-foreground">Win Rate</div>
                </div>
                <div className="text-center p-3 rounded-lg bg-secondary/50">
                  <div className={`text-lg font-bold font-display ${trader.riskColor}`}>{trader.risk}</div>
                  <div className="text-xs text-muted-foreground">Risk</div>
                </div>
              </div>

              <Button variant="hero" size="sm" className="w-full">
                <Copy className="w-4 h-4 mr-1" /> Copy Trader
              </Button>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CopyTradingSection;
