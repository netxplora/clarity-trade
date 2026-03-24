import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Users, TrendingUp, Shield, Copy, ArrowRight } from "lucide-react";

const traders = [
  { name: "Alex M.", roi: "+125%", risk: "Moderate", followers: "1,220", avatar: "AM", specialty: "Crypto" },
  { name: "Sarah L.", roi: "+98%", risk: "Low", followers: "2,350", avatar: "SL", specialty: "Forex" },
  { name: "Daniel W.", roi: "+150%", risk: "High", followers: "5,670", avatar: "DW", specialty: "Commodities" },
];

const CopyTradingSection = () => {
  return (
    <section className="section-bg-dark border-t border-white/5 relative overflow-hidden" id="copy-trading">
      {/* Background Hero */}
      <div className="absolute top-0 inset-x-0 h-[600px] z-0 overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-30 scale-[1.02]"
          style={{ backgroundImage: "url('/images/hero-trading-bg.png')" }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0B0F14] via-[#0B0F14]/60 to-[#0B0F14]" />
      </div>

      <div className="container mx-auto px-6 relative z-10">
        {/* Header */}
        <div className="flex flex-col items-center max-w-4xl mx-auto mb-20 lg:mb-24 pt-20 text-center">
          <span className="heading-gold text-center">Expert Trading Strategies</span>
          <h2 className="title-hyip text-center text-white leading-tight mt-2 mb-6">
            Copy the <span className="text-[#D4AF37]">Best Traders</span> and <br className="hidden md:block" />
            Grow Your Portfolio
          </h2>
          <p className="p-hyip-dark mx-auto text-lg">
            Our copy trading feature allows you to mirror the trades of professional experts 
            automatically, so you can earn passively while the pros work.
          </p>
        </div>

        {/* Trader Cards Grid */}
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {traders.map((trader, i) => (
            <motion.div
              key={trader.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="hyip-card-dark group"
            >
              <div className="flex items-center gap-5 mb-8 border-b border-white/5 pb-6">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#D4AF37]/50 to-[#D4AF37]/20 flex items-center justify-center text-white font-extrabold text-2xl group-hover:scale-110 transition-transform shadow-lg border-2 border-white/10">
                  {trader.avatar}
                </div>
                <div>
                  <h4 className="font-bold text-white text-xl tracking-tight">{trader.name}</h4>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-[#D4AF37] px-2 py-0.5 rounded bg-[#D4AF37]/10">
                      ROI: {trader.roi}
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="p-4 rounded-lg bg-white/5 border border-white/5 flex flex-col items-center justify-center text-center">
                   <div className="text-gray-400 text-[10px] uppercase font-bold tracking-widest mb-1">Followers</div>
                   <div className="text-white font-bold text-lg">{trader.followers}</div>
                </div>
                <div className="p-4 rounded-lg bg-white/5 border border-white/5 flex flex-col items-center justify-center text-center">
                   <div className="text-gray-400 text-[10px] uppercase font-bold tracking-widest mb-1">Risk Level</div>
                   <div className={`font-bold text-lg ${
                     trader.risk === 'Low' ? 'text-green-400' :
                     trader.risk === 'Moderate' ? 'text-[#D4AF37]' :
                     'text-red-400'
                   }`}>{trader.risk}</div>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs font-bold uppercase tracking-widest text-gray-500 mb-8 px-2">
                 <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-green-400" />
                    <span className="text-white">{trader.roi}</span>
                 </div>
                 <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-[#D4AF37]" />
                    <span className="text-white">{trader.followers}</span>
                 </div>
              </div>

              <Link to="/register" className="w-full btn-gold !h-12 !px-0 flex items-center justify-center gap-2 group/btn">
                 <Copy className="w-4 h-4" /> Start Copying <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CopyTradingSection;
