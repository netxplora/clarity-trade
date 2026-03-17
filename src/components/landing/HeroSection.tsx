import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { TrendingUp, ArrowRight } from "lucide-react";

const HeroSection = () => {
  return (
    <section className="relative min-h-screen flex items-center overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 grid-pattern opacity-40" />
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-primary/10 rounded-full blur-[120px]" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-primary/5 rounded-full blur-[120px]" />

      <div className="container relative z-10 mx-auto px-6 pt-32 pb-20">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-primary/30 bg-primary/5 mb-8"
          >
            <TrendingUp className="w-4 h-4 text-primary" />
            <span className="text-sm text-primary font-medium">Live Trading · Copy Top Traders · Earn</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="text-5xl md:text-7xl font-bold font-display leading-tight mb-6"
          >
            Trade Smarter.{" "}
            <span className="text-gradient-primary">Copy the Best.</span>
            <br />
            Grow Your Wealth.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10"
          >
            Join thousands of traders earning profits through copy trading.
            Fund with crypto, follow expert traders, and watch your portfolio grow — all in one platform.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Button variant="hero" size="lg" className="text-base px-8 py-6">
              Start Trading <ArrowRight className="w-5 h-5 ml-1" />
            </Button>
            <Button variant="hero-outline" size="lg" className="text-base px-8 py-6">
              Copy Traders
            </Button>
          </motion.div>

          {/* Stats bar */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="mt-20 glass-card glass-glow p-6 grid grid-cols-2 md:grid-cols-4 gap-6"
          >
            {[
              { label: "Active Traders", value: "12,400+" },
              { label: "Total Volume", value: "$2.1B+" },
              { label: "Avg. ROI (Copy)", value: "+34.7%" },
              { label: "Countries", value: "180+" },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-2xl md:text-3xl font-bold font-display text-foreground">{stat.value}</div>
                <div className="text-sm text-muted-foreground mt-1">{stat.label}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
