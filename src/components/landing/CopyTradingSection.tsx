import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Users, TrendingUp, Shield, Copy, ArrowRight, Activity } from "lucide-react";

const traders = [
  { name: "Alex M.", roi: "+125%", risk: "Moderate", followers: "1,220", avatar: "AM", specialty: "Crypto" },
  { name: "Sarah L.", roi: "+98%", risk: "Low", followers: "2,350", avatar: "SL", specialty: "Forex" },
  { name: "Daniel W.", roi: "+150%", risk: "High", followers: "5,670", avatar: "DW", specialty: "Commodities" },
];

const CopyTradingSection = () => {
  return (
    <section className="py-24 bg-[#0a0a0a] border-t border-[#333]/50 relative overflow-hidden" id="copy-trading">
      <div className="container mx-auto px-6 relative z-10">
        
        <div className="flex flex-col lg:flex-row items-center gap-12 max-w-7xl mx-auto">
          {/* Content Left */}
          <div className="lg:w-1/3">
            <span className="text-[#D4AF37] font-semibold tracking-wider text-sm uppercase">Expert Strategies</span>
            <h2 className="text-3xl md:text-4xl font-bold text-white mt-2 mb-6" style={{ fontFamily: "Inter, sans-serif" }}>
              Copy the Best Traders Automatically
            </h2>
            <p className="text-gray-400 mb-8">
              Our copy trading platform allows you to mirror the trades of professional experts in real-time. 
              Earn passive returns while maintaining full control over your risk and capital.
            </p>
            
            <ul className="space-y-4 mb-8">
              <li className="flex items-center gap-3 text-gray-300">
                <Activity className="w-5 h-5 text-[#D4AF37]" /> Real-time profit tracking
              </li>
              <li className="flex items-center gap-3 text-gray-300">
                <Shield className="w-5 h-5 text-[#D4AF37]" /> Advanced risk control settings
              </li>
              <li className="flex items-center gap-3 text-gray-300">
                <TrendingUp className="w-5 h-5 text-[#D4AF37]" /> Verified historical performance
              </li>
            </ul>

            <Link to="/auth/register" className="btn-gold inline-flex items-center gap-2 group px-8 py-4">
              Explore Copy Trading <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          {/* Trader Cards Right */}
          <div className="lg:w-2/3">
            <div className="grid md:grid-cols-2 gap-6 w-full">
              {traders.slice(0, 2).map((trader, i) => (
                <motion.div
                  key={trader.name}
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="bg-[#1A1A1A] border border-[#333] rounded-xl p-6 hover:border-[#D4AF37]/50 transition-colors"
                >
                  <div className="flex items-center gap-4 mb-6 pb-6 border-b border-[#333]/50">
                    <div className="w-14 h-14 rounded-full bg-[#111] border border-[#333] flex items-center justify-center text-white font-bold text-xl group-hover:border-[#D4AF37] transition-all">
                      {trader.avatar}
                    </div>
                    <div>
                      <h4 className="font-bold text-white text-lg tracking-tight" style={{ fontFamily: "Inter, sans-serif" }}>{trader.name}</h4>
                      <span className="text-xs text-gray-400">{trader.specialty} Trader</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div>
                       <div className="text-gray-500 text-xs font-semibold uppercase mb-1">Return (12M)</div>
                       <div className="text-green-500 font-bold">{trader.roi}</div>
                    </div>
                    <div>
                       <div className="text-gray-500 text-xs font-semibold uppercase mb-1">Risk Level</div>
                       <div className="text-white font-medium">{trader.risk}</div>
                    </div>
                  </div>

                  <Link to="/auth/register" className="w-full btn-gold-outline !h-10 flex items-center justify-center gap-2 group border border-[#333] text-gray-300 hover:text-[#D4AF37] hover:border-[#D4AF37] bg-transparent rounded transition-all">
                     <Copy className="w-4 h-4" /> Copy Trader
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </section>
  );
};

export default CopyTradingSection;
