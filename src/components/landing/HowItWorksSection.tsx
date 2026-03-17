import { motion } from "framer-motion";
import { Wallet, Users, TrendingUp } from "lucide-react";

const steps = [
  {
    icon: Wallet,
    title: "Fund Your Account",
    description: "Deposit crypto instantly — BTC, ETH, or USDT. No bank transfers, no waiting.",
    step: "01",
  },
  {
    icon: Users,
    title: "Choose Your Strategy",
    description: "Trade manually or browse top traders and copy their moves with one click.",
    step: "02",
  },
  {
    icon: TrendingUp,
    title: "Earn Profits",
    description: "Watch your portfolio grow in real-time with transparent performance tracking.",
    step: "03",
  },
];

const HowItWorksSection = () => {
  return (
    <section className="py-24 relative">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-5xl font-bold font-display mb-4">
            How It <span className="text-gradient-primary">Works</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            Start earning in three simple steps. No trading experience required.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {steps.map((step, i) => (
            <motion.div
              key={step.step}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15 }}
              className="glass-card glass-glow p-8 text-center group hover:border-primary/30 transition-all duration-300"
            >
              <div className="text-5xl font-bold font-display text-primary/20 mb-4">{step.step}</div>
              <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-5 group-hover:bg-primary/20 transition-colors">
                <step.icon className="w-7 h-7 text-primary" />
              </div>
              <h3 className="text-xl font-semibold font-display mb-3">{step.title}</h3>
              <p className="text-muted-foreground leading-relaxed">{step.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
