import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Coins, Globe, Gem, Droplet, ArrowRight } from "lucide-react";

const assets = [
  {
    category: "Forex",
    icon: Globe,
    description: "Trade major, minor, and exotic currency pairs with tight spreads and high liquidity.",
    roi: "Up to 15% Monthly",
    link: "/about-us",
  },
  {
    category: "Crypto",
    icon: Coins,
    description: "Invest in top-performing digital assets including Bitcoin, Ethereum, and major altcoins.",
    roi: "Up to 25% Monthly",
    link: "/crypto",
  },
  {
    category: "Gold",
    icon: Gem,
    description: "Hedge against inflation with physical and synthetic gold investments.",
    roi: "Up to 10% Monthly",
    link: "/about-us",
  },
  {
    category: "Oil",
    icon: Droplet,
    description: "Capitalize on global energy demands with continuous oil market trading.",
    roi: "Up to 12% Monthly",
    link: "/about-us",
  },
];

const MarketPreviewSection = () => {
  return (
    <section className="py-24 bg-background border-t border-border/50" id="markets">
      <div className="container mx-auto px-6">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-16 px-4">
          <span className="text-[#D4AF37] font-semibold tracking-wider text-sm uppercase">Investment Instruments</span>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mt-2 mb-4" style={{ fontFamily: "Inter, sans-serif" }}>
            Supported Assets
          </h2>
          <p className="text-muted-foreground">
            Build a diversified portfolio across multiple asset classes with our professional-grade trading infrastructure.
          </p>
        </div>

        {/* Assets Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto items-start">
          {assets.map((asset, i) => (
            <motion.div
              key={asset.category}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="bg-card border border-border rounded-xl p-6 hover:border-[#D4AF37]/50 transition-colors group flex flex-col h-full"
            >
              <div className="w-12 h-12 rounded-full bg-secondary border border-border flex items-center justify-center mb-6 group-hover:border-[#D4AF37] transition-all">
                <asset.icon className="w-6 h-6 text-[#D4AF37]" />
              </div>
              
              <h3 className="text-xl font-bold text-foreground mb-3" style={{ fontFamily: "Inter, sans-serif" }}>
                {asset.category}
              </h3>
              
              <p className="text-muted-foreground text-sm mb-6 flex-grow">
                {asset.description}
              </p>

              <div className="flex items-center justify-between mt-auto pt-6 border-t border-border/50">
                <div className="flex flex-col">
                  <span className="text-[10px] text-muted-foreground uppercase font-semibold">Target ROI</span>
                  <span className="text-sm font-bold text-[#D4AF37]">{asset.roi}</span>
                </div>
                <Link to={asset.link} className="w-8 h-8 rounded-full bg-secondary text-foreground flex items-center justify-center group-hover:bg-[#D4AF37] transition-colors">
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default MarketPreviewSection;
