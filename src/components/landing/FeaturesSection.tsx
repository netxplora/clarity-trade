import { motion } from "framer-motion";
import { BarChart3, Shield, Zap, Globe, Lock, Cpu } from "lucide-react";

const features = [
  {
    icon: Zap,
    title: "Instant Trading",
    description: "Experience lightning-fast execution on all trades across crypto and forex markets.",
  },
  {
    icon: Globe,
    title: "Global Reach",
    description: "Access over 150+ global markets and trade on the world's most popular assets.",
  },
  {
    icon: Shield,
    title: "Maximum Security",
    description: "Your assets are protected with industry-leading security protocols and encryption.",
  },
  {
    icon: BarChart3,
    title: "Expert Copying",
    description: "Follow top-performing traders and mirror their success with a single click.",
  },
  {
    icon: Lock,
    title: "Safe Custody",
    description: "We use air-gapped cold storage to keep your digital assets safe from online threats.",
  },
  {
    icon: Cpu,
    title: "AI Optimization",
    description: "Get smart insights and trade optimizations powered by our intelligent systems.",
  },
];

const FeaturesSection = () => {
  return (
    <section className="section-bg-light" id="features">
      <div className="container mx-auto px-6">
        <div className="flex flex-col items-center mb-16 lg:mb-24">
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-8"
          >
            <img 
              src="/images/3d-chart.png" 
              alt="Trading Chart" 
              className="w-48 h-48 lg:w-64 lg:h-64 object-contain animate-float"
            />
          </motion.div>
          
          <div className="text-center max-w-3xl mx-auto px-6">
            <span className="heading-gold">Our Key Features</span>
            <h2 className="title-hyip text-gray-900 leading-tight">
              Why Choose Clarity Trade for Your <br className="hidden md:block" />
              <span className="text-[#D4AF37]">Wealth Management?</span>
            </h2>
            <p className="p-hyip text-lg">
              We provide the tools and support you need to succeed in the fast-paced 
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
              className="hyip-card flex flex-col items-center text-center group"
            >
              <div className="w-16 h-16 rounded-full bg-[#D4AF37]/10 flex items-center justify-center mb-6 group-hover:bg-[#D4AF37] group-hover:scale-110 transition-all duration-300">
                <feature.icon className="w-8 h-8 text-[#D4AF37] group-hover:text-white transition-colors" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">{feature.title}</h3>
              <p className="p-hyip text-sm">
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
