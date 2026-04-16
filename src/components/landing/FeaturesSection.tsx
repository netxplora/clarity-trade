import { motion } from "framer-motion";
import { Users, Cpu, Briefcase, ShieldAlert, Lock, Activity } from "lucide-react";

const features = [
  {
    icon: Users,
    title: "Copy Trading",
    description: "Mirror the trades of verified, top-performing professionals perfectly synchronized with your account in real-time.",
  },
  {
    icon: Cpu,
    title: "Automated Investments",
    description: "Utilize institutional algorithmic strategies to generate passive returns without manual intervention.",
  },
  {
    icon: Briefcase,
    title: "Multi Asset Portfolio",
    description: "Diversify across Forex, Crypto, Commodities, and indices within a single intuitive dashboard.",
  },
  {
    icon: ShieldAlert,
    title: "Risk Management",
    description: "Set hard limits, trailing stops, and draw-down protection to safeguard your capital at all times.",
  },
  {
    icon: Lock,
    title: "Secure Transactions",
    description: "Bank-grade encryption, cold storage, and comprehensive audits ensure your funds are always secure.",
  },
  {
    icon: Activity,
    title: "Real Time Analytics",
    description: "Track performance with professional-grade charting, detailed statistics, and transparent reporting.",
  },
];

const FeaturesSection = () => {
  return (
    <section className="py-24 bg-background border-t border-border/50" id="features">
      <div className="container mx-auto px-6">
        <div className="flex flex-col items-center mb-16 lg:mb-24">
          <div className="text-center max-w-3xl mx-auto px-6">
            <span className="text-[#D4AF37] font-semibold tracking-wider text-sm uppercase">Platform Capabilities</span>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mt-2 mb-4" style={{ fontFamily: "Inter, sans-serif" }}>
              Why Choose Clarity Trade
            </h2>
            <p className="text-muted-foreground text-lg">
              We provide the institutional tools and support you need to succeed in the fast-paced 
              world of digital asset and forex trading.
            </p>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {features.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="bg-card border border-border rounded-xl p-8 hover:border-[#D4AF37]/50 transition-colors group h-full flex flex-col items-start text-left"
            >
              <div className="w-12 h-12 rounded-full bg-secondary border border-border flex items-center justify-center mb-6 group-hover:border-[#D4AF37] transition-all">
                <feature.icon className="w-6 h-6 text-[#D4AF37]" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-4" style={{ fontFamily: "Inter, sans-serif" }}>{feature.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
