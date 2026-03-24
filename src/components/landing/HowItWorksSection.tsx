import { motion } from "framer-motion";
import { UserPlus, Wallet, BarChart3, ArrowRight } from "lucide-react";

const steps = [
  {
    number: "01",
    title: "Create Account",
    description: "Sign up and create your free Clarity Trade account in minutes.",
    icon: UserPlus,
  },
  {
    number: "02",
    title: "Deposit Funds",
    description: "Fund your wallet with world-leading crypto assets safely and quickly.",
    icon: Wallet,
  },
  {
    number: "03",
    title: "Start Earning",
    description: "Begin trading yourself or copy top experts to build your portfolio.",
    icon: BarChart3,
  },
];

const HowItWorksSection = () => {
  return (
    <section className="section-bg-white" id="how-it-works">
      <div className="container mx-auto px-6">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-16 px-4">
          <span className="heading-gold">How to Begin</span>
          <h2 className="title-hyip text-gray-900">
            Three Simple Steps to <span className="text-[#D4AF37]">Start Trading</span>
          </h2>
          <p className="p-hyip">
            Getting started with Clarity Trade is easy. Follow these steps to 
            join the leading trading community today.
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
              className="relative p-8 rounded-xl bg-white border border-gray-100 shadow-sm hover:shadow-md transition-shadow group h-full flex flex-col items-center text-center"
            >
              {/* Connector line for desktop */}
              {i < steps.length - 1 && (
                <div className="hidden lg:block absolute top-[2.5rem] left-[65%] w-[70%] h-[2px] bg-gray-100 z-0">
                  <div className="w-[10px] h-[10px] rounded-full bg-[#D4AF37] absolute top-[-4px] left-[50%]" />
                </div>
              )}

              <div className="w-20 h-20 rounded-full bg-[#D4AF37]/5 flex items-center justify-center mb-8 relative z-10 group-hover:bg-[#D4AF37]/10 group-hover:scale-105 transition-all outline outline-gray-50 outline-offset-4">
                <step.icon className="w-10 h-10 text-[#D4AF37]" />
                <span className="absolute -top-3 -right-3 w-10 h-10 rounded-full bg-white border-2 border-[#D4AF37] text-gray-900 font-bold flex items-center justify-center text-sm shadow-sm group-hover:scale-110 transition-transform">
                   {step.number}
                </span>
              </div>
              
              <h3 className="text-xl font-bold text-gray-900 mb-4 group-hover:text-[#D4AF37] transition-colors">
                {step.title}
              </h3>
              <p className="p-hyip text-sm">
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
