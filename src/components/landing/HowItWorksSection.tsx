import { motion } from "framer-motion";
import { UserPlus, Compass, TrendingUp } from "lucide-react";

const steps = [
  {
    number: "01",
    title: "Create Account",
    description: "Sign up and verify your identity in minutes.",
    icon: UserPlus,
  },
  {
    number: "02",
    title: "Choose Trader or Investment",
    description: "Select professional traders to copy or choose investment plans.",
    icon: Compass,
  },
  {
    number: "03",
    title: "Earn Returns Automatically",
    description: "Watch your portfolio grow with automated real-time execution.",
    icon: TrendingUp,
  },
];

const HowItWorksSection = () => {
  return (
    <section className="py-24 bg-[#0a0a0a]" id="how-it-works">
      <div className="container mx-auto px-6">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-16 px-4">
          <span className="text-[#D4AF37] font-semibold tracking-wider text-sm uppercase">How to Begin</span>
          <h2 className="text-3xl md:text-4xl font-bold text-white mt-2 mb-4" style={{ fontFamily: "Inter, sans-serif" }}>
            Simple Steps to Start Investing
          </h2>
          <p className="text-gray-400">
            Get started with Clarity Trade in three easy steps and let your capital work for you.
          </p>
        </div>

        {/* Steps Grid */}
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto items-start">
          {steps.map((step, i) => (
            <motion.div
              key={step.number}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15 }}
              className="relative p-8 rounded-xl bg-[#1A1A1A] border border-[#333] hover:border-[#D4AF37]/50 transition-colors group h-full flex flex-col items-center text-center"
            >
              {/* Connector line for desktop */}
              {i < steps.length - 1 && (
                <div className="hidden md:block absolute top-16 -right-1/2 w-full h-[1px] bg-gradient-to-r from-[#D4AF37]/50 to-transparent z-0" />
              )}

              <div className="w-16 h-16 rounded-full bg-[#111] border border-[#333] flex items-center justify-center mb-6 relative z-10 group-hover:border-[#D4AF37] transition-all">
                <step.icon className="w-6 h-6 text-[#D4AF37]" />
                <span className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-[#D4AF37] text-white font-bold flex items-center justify-center text-xs shadow-sm">
                   {step.number}
                </span>
              </div>
              
              <h3 className="text-xl font-bold text-white mb-3" style={{ fontFamily: "Inter, sans-serif" }}>
                {step.title}
              </h3>
              <p className="text-gray-400 text-sm">
                {step.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
