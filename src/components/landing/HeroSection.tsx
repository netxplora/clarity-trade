import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight, ShieldCheck, Zap, Globe, LayoutDashboard, TrendingUp } from "lucide-react";
import { useStore } from "@/store/useStore";

const HeroSection = () => {
  const { user } = useStore();
  
  return (
    <section className="relative min-h-[90vh] flex items-center pt-24 pb-12 overflow-hidden bg-[#0a0a0a]">
      <div className="absolute inset-0 z-0">
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-20"
          style={{ backgroundImage: "url('/images/hero-trading-bg.png')" }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0a0a0a] via-[#0a0a0a]/90 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-transparent to-transparent" />
      </div>

      <div className="container mx-auto px-6 relative z-10 py-10">
        <div className="flex flex-col lg:flex-row items-center gap-12">
          
          <div className="lg:w-1/2">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#1A1A1A] border border-[#333] mb-6">
                <ShieldCheck className="w-4 h-4 text-[#D4AF37]" />
                <span className="text-sm font-medium text-gray-300">Fast & Secure Trading Platform</span>
              </div>
              
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-semibold text-white leading-tight mb-6" style={{ fontFamily: "Inter, sans-serif" }}>
                Professional Asset Management & <span className="text-[#D4AF37]">Copy Trading Platform</span>
              </h1>
              
              <p className="text-lg md:text-xl text-gray-400 mb-10 leading-relaxed max-w-xl" style={{ fontFamily: "Inter, sans-serif" }}>
                Invest in Forex, Crypto, Gold, and Oil while copying professional traders automatically. Secure, real-time, and compliant.
              </p>

              <div className="flex flex-wrap gap-4">
                {user ? (
                  <Link to={user.role === 'admin' ? '/admin' : '/dashboard'} className="bg-[#D4AF37] text-[#0a0a0a] hover:bg-[#b0902a] rounded font-bold text-sm uppercase tracking-widest shadow-lg flex items-center gap-2 group px-8 py-4 transition-colors">
                    <LayoutDashboard className="w-5 h-5 group-hover:scale-110 transition-transform" /> Go to Dashboard <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </Link>
                ) : (
                  <>
                    <Link to="/auth/register" className="bg-[#D4AF37] text-[#0a0a0a] hover:bg-[#b0902a] rounded font-bold text-sm uppercase tracking-widest shadow-lg flex items-center gap-2 group px-8 py-4 transition-colors">
                      Start Investing <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </Link>
                    <Link to="/copy-trading" className="flex items-center gap-2 px-8 py-4 bg-transparent text-white border border-[#333] hover:border-[#D4AF37] hover:text-[#D4AF37] transition-colors rounded font-bold text-sm uppercase tracking-widest">
                      Explore Copy Trading
                    </Link>
                  </>
                )}
              </div>

              {/* Trust Badges */}
              <div className="flex flex-wrap items-center gap-6 mt-12 pt-8 border-t border-[#333]/50">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-[#D4AF37]" />
                  <span className="text-sm font-medium text-gray-400">Secure Assets</span>
                </div>
                <div className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-[#D4AF37]" />
                  <span className="text-sm font-medium text-gray-400">Instant Execution</span>
                </div>
                <div className="flex items-center gap-2">
                  <Globe className="w-5 h-5 text-[#D4AF37]" />
                  <span className="text-sm font-medium text-gray-400">Global Reach</span>
                </div>
              </div>
            </motion.div>
          </div>
          
          <div className="lg:w-1/2 relative">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, x: 20 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="relative z-10 rounded-2xl overflow-hidden border border-[#333] shadow-2xl shadow-[#D4AF37]/5"
            >
              <img src="/images/dashboard-mock.png" alt="Trading Dashboard" className="w-full h-auto object-cover rounded-2xl" />
              <div className="absolute inset-0 bg-gradient-to-tr from-[#0a0a0a]/40 to-transparent" />
            </motion.div>
            
            {/* Floating widget 1 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="absolute -bottom-6 -left-6 z-20 bg-[#1A1A1A] border border-[#333] p-4 rounded-xl shadow-xl flex items-center gap-4"
            >
              <div className="w-12 h-12 rounded-full bg-[#D4AF37]/10 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-[#D4AF37]" />
              </div>
              <div>
                <p className="text-sm text-gray-400 font-medium">Monthly Return</p>
                <p className="text-xl font-bold text-white">+14.2%</p>
              </div>
            </motion.div>
          </div>
          
        </div>
      </div>
    </section>
  );
};

export default HeroSection;

