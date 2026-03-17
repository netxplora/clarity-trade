import { motion } from "framer-motion";
import { BarChart3, Users, Shield, Zap, LineChart, Smartphone } from "lucide-react";

const features = [
  {
    icon: LineChart,
    title: "Real-Time Trading",
    description: "Execute trades instantly with live market data and professional-grade charting.",
  },
  {
    icon: Users,
    title: "Copy Trading",
    description: "Follow top-performing traders and automatically replicate their strategies.",
  },
  {
    icon: Shield,
    title: "Secure Crypto Payments",
    description: "Deposit and withdraw using BTC, ETH, or USDT with enterprise-grade security.",
  },
  {
    icon: BarChart3,
    title: "Advanced Analytics",
    description: "Track ROI, win rate, drawdown, and equity curves with beautiful dashboards.",
  },
  {
    icon: Zap,
    title: "Instant Execution",
    description: "Sub-second order execution with market, limit, stop-loss, and take-profit orders.",
  },
  {
    icon: Smartphone,
    title: "Mobile Optimized",
    description: "Trade anywhere with a fully responsive platform built for every device.",
  },
];

const FeaturesSection = () => {
  return (
    <section className="py-24">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-5xl font-bold font-display mb-4">
            Platform <span className="text-gradient-primary">Features</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            Everything you need to trade confidently and grow your portfolio.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {features.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="glass-card p-6 group hover:border-primary/20 transition-all duration-300"
            >
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                <feature.icon className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold font-display mb-2">{feature.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
