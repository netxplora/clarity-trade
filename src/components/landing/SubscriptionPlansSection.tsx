import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight, Globe, Coins, Gem, Droplet } from "lucide-react";

const plans = [
  {
    name: "Forex Yield",
    icon: Globe,
    roi: "8-15%",
    duration: "30 Days",
    minInvestment: "$500",
    description: "Automated forex trading strategies focusing on major pairs.",
    color: "from-blue-500/20 to-transparent",
    borderColor: "border-border"
  },
  {
    name: "Crypto Growth",
    icon: Coins,
    roi: "15-25%",
    duration: "60 Days",
    minInvestment: "$1,000",
    description: "High-yield crypto accumulation focusing on top 20 altcoins.",
    color: "from-[#D4AF37]/20 to-transparent",
    borderColor: "border-[#D4AF37]/50",
    popular: true
  },
  {
    name: "Gold Reserve",
    icon: Gem,
    roi: "5-10%",
    duration: "90 Days",
    minInvestment: "$5,000",
    description: "Conservative growth backed by institutional gold trading.",
    color: "from-yellow-700/20 to-transparent",
    borderColor: "border-border"
  },
  {
    name: "Oil Commodities",
    icon: Droplet,
    roi: "10-18%",
    duration: "45 Days",
    minInvestment: "$2,500",
    description: "Capitalize on crude oil volatility and global energy shifts.",
    color: "from-gray-500/20 to-transparent",
    borderColor: "border-border"
  }
];

const SubscriptionPlansSection = () => {
  return (
    <section className="py-24 bg-background border-t border-border/50" id="investment-plans">
      <div className="container mx-auto px-6">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-[#D4AF37] font-semibold tracking-wider text-sm uppercase">Investment Portfolios</span>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mt-2 mb-4" style={{ fontFamily: "Inter, sans-serif" }}>
            Managed Performance Plans
          </h2>
          <p className="text-muted-foreground">
            Choose from carefully curated investment plans managed by our algorithmic trading systems and human experts.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
          {plans.map((plan, i) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className={`relative bg-card border ${plan.borderColor} rounded-xl p-8 hover:transform hover:-translate-y-2 transition-all duration-300 flex flex-col`}
            >
              <div className={`absolute top-0 left-0 w-full h-32 bg-gradient-to-b ${plan.color} rounded-t-xl opacity-50 pointer-events-none`} />
              
              {plan.popular && (
                <div className="absolute top-0 right-1/2 translate-x-1/2 -translate-y-1/2 bg-[#D4AF37] text-white text-xs font-bold uppercase py-1 px-3 rounded-full shadow-lg">
                  Most Popular
                </div>
              )}

              <div className="relative z-10 flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-foreground" style={{ fontFamily: "Inter, sans-serif" }}>{plan.name}</h3>
                <div className="w-10 h-10 rounded-full bg-secondary border border-border flex items-center justify-center">
                  <plan.icon className="w-5 h-5 text-[#D4AF37]" />
                </div>
              </div>

              <div className="relative z-10 flex gap-4 mb-6 pb-6 border-b border-border/50">
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground uppercase font-semibold mb-1">Target ROI</p>
                  <p className="text-2xl font-bold text-profit">{plan.roi}</p>
                </div>
              </div>

              <div className="relative z-10 flex gap-4 mb-6 space-y-4 flex-col flex-1">
                <div className="flex justify-between items-center">
                  <p className="text-sm text-muted-foreground">Duration</p>
                  <p className="text-sm font-semibold text-foreground">{plan.duration}</p>
                </div>
                <div className="flex justify-between items-center">
                  <p className="text-sm text-muted-foreground">Min Investment</p>
                  <p className="text-sm font-semibold text-foreground">{plan.minInvestment}</p>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed mt-4">
                  {plan.description}
                </p>
              </div>

              <div className="relative z-10 mt-auto pt-6">
                <Link to="/auth/register" className={`w-full flex items-center justify-center gap-2 py-4 rounded font-semibold transition-colors ${plan.popular ? 'bg-[#D4AF37] text-white hover:bg-[#b0902a]' : 'bg-transparent border border-border text-foreground hover:border-[#D4AF37] hover:text-[#D4AF37]'}`}>
                  Start Investing <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default SubscriptionPlansSection;
