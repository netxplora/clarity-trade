import { motion } from "framer-motion";
import { Shield, Lock, Eye, Server, Award, FileCheck } from "lucide-react";

const trustPoints = [
  { icon: Lock, title: "256-Bit Encryption", description: "All data transmitted and stored with military-grade encryption standards." },
  { icon: Server, title: "Cold Storage Custody", description: "98% of digital assets held in air-gapped cold storage wallets." },
  { icon: Eye, title: "Real-Time Monitoring", description: "24/7 automated fraud detection and suspicious activity monitoring." },
  { icon: Award, title: "Fully Regulated", description: "Licensed and compliant with international financial regulations." },
  { icon: FileCheck, title: "Audited Reserves", description: "Quarterly third-party proof-of-reserves audits published transparently." },
  { icon: Shield, title: "Insurance Coverage", description: "Assets protected by comprehensive insurance against security breaches." },
];

const TrustSection = () => {
  return (
    <section className="section-bg-dark border-t border-white/5 relative overflow-hidden" id="security">
      {/* Background Hero */}
      <div className="absolute top-0 inset-x-0 h-[600px] z-0 overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-30 scale-[1.02]"
          style={{ backgroundImage: "url('/images/hero-trading-bg.png')" }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0B0F14] via-[#0B0F14]/60 to-[#0B0F14]" />
      </div>

      <div className="container mx-auto px-6 relative z-10">
        {/* Header with 3D Visual */}
        <div className="flex flex-col lg:flex-row items-center gap-12 max-w-6xl mx-auto mb-20 lg:mb-24 pt-20">
          <div className="lg:w-2/3 text-center lg:text-left">
            <span className="heading-gold lg:text-left text-center">Your Capital is Protected</span>
            <h2 className="title-hyip lg:text-left text-center text-white leading-tight">
              Institutional-Grade <span className="text-[#D4AF37]">Security</span> & <br className="hidden md:block" />
              Advanced Compliance
            </h2>
            <p className="p-hyip-dark lg:mx-0 mx-auto text-lg">
              We employ world-class security protocols and multi-layered protection systems 
              to ensure your assets are always safe and your trading environment is secure.
            </p>
          </div>
          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="lg:w-1/3 flex justify-center"
          >
            <img 
              src="/images/3d-security.png" 
              alt="Security Shield" 
              className="w-48 h-48 lg:w-64 lg:h-64 object-contain animate-float"
            />
          </motion.div>
        </div>

        {/* Trust Points Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {trustPoints.map((point, i) => (
            <motion.div
              key={point.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="hyip-card-dark flex flex-col items-center text-center group h-full"
            >
              <div className="w-14 h-14 rounded-full bg-[#D4AF37]/10 flex items-center justify-center mb-6 group-hover:bg-[#D4AF37] group-hover:scale-110 transition-all duration-300">
                <point.icon className="w-6 h-6 text-[#D4AF37] group-hover:text-white transition-colors" />
              </div>
              <h3 className="text-lg font-bold text-white mb-3 tracking-tight group-hover:text-[#D4AF37] transition-colors">{point.title}</h3>
              <p className="text-gray-400 text-sm leading-relaxed">{point.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TrustSection;
