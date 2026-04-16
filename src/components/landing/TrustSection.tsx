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
    <section className="py-24 bg-background border-t border-border/50 relative overflow-hidden" id="security">
      <div className="container mx-auto px-6 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-16 lg:mb-24">
          <span className="text-[#D4AF37] font-semibold tracking-wider text-sm uppercase">Your Capital is Protected</span>
          <h2 className="text-3xl md:text-5xl font-bold text-foreground mt-4 mb-6 leading-tight" style={{ fontFamily: "Inter, sans-serif" }}>
            Institutional-Grade <span className="italic text-[#D4AF37]">Security</span> & <br className="hidden md:block" />
            Advanced Compliance
          </h2>
          <p className="text-muted-foreground text-lg">
            We employ world-class security protocols and multi-layered protection systems 
            to ensure your assets are always safe and your trading environment is secure.
          </p>
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
              className="bg-card border border-border rounded-xl p-8 flex flex-col items-center text-center group h-full hover:border-[#D4AF37]/50 transition-all"
            >
              <div className="w-14 h-14 rounded-full bg-secondary border border-border flex items-center justify-center mb-6 group-hover:border-[#D4AF37] transition-colors">
                <point.icon className="w-6 h-6 text-[#D4AF37]" />
              </div>
              <h3 className="text-lg font-bold text-foreground mb-3 tracking-tight" style={{ fontFamily: "Inter, sans-serif" }}>{point.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{point.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TrustSection;
