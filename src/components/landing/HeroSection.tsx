import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight, ShieldCheck, Zap, Globe, LayoutDashboard } from "lucide-react";
import { useStore } from "@/store/useStore";

const HeroSection = () => {
  const { user } = useStore();
  return (
    <section className="relative min-h-[90vh] flex items-center pt-20 overflow-hidden">
      <div className="absolute inset-0 z-0 bg-[#0B0F14]">
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-transform duration-2000 scale-[1.02] opacity-70"
          style={{ backgroundImage: "url('/images/hero-trading-bg.png')" }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0B0F14] via-[#0B0F14]/80 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0B0F14] via-transparent to-transparent" />
      </div>

      <div className="container mx-auto px-6 relative z-10 py-20">
        <div className="max-w-3xl">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className="heading-gold">Fast & Secure Trading Platform</span>
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold text-white leading-tight mb-8">
              Grow Your Wealth with <br />
              <span className="text-[#D4AF37]">Smart Investments</span>
            </h1>
            <p className="text-lg md:text-xl text-gray-300 mb-10 leading-relaxed max-w-2xl">
              Clarity Trade provides institutional-grade access to global markets. 
              Trade crypto, forex, and commodities with lightning-fast execution 
              and copying the world's most successful traders.
            </p>

            <div className="flex flex-wrap gap-5">
              {user ? (
                <Link to={user.role === 'admin' ? '/admin' : '/dashboard'} className="btn-gold flex items-center gap-3 group">
                  <LayoutDashboard className="w-5 h-5 group-hover:scale-110 transition-transform" /> Go to Dashboard <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
              ) : (
                <Link to="/auth/register" className="btn-gold flex items-center gap-2 group">
                  Get Started Now <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
              )}
              <Link to="/about-us" className="btn-gold-outline">
                Learn More
              </Link>
            </div>

            {/* Trust Badges */}
            <div className="flex flex-wrap items-center gap-8 mt-16 pt-10 border-t border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#D4AF37]/10 flex items-center justify-center">
                  <ShieldCheck className="w-5 h-5 text-[#D4AF37]" />
                </div>
                <span className="text-sm font-medium text-gray-400">Secure Assets</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#D4AF37]/10 flex items-center justify-center">
                  <Zap className="w-5 h-5 text-[#D4AF37]" />
                </div>
                <span className="text-sm font-medium text-gray-400">Instant Execution</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#D4AF37]/10 flex items-center justify-center">
                  <Globe className="w-5 h-5 text-[#D4AF37]" />
                </div>
                <span className="text-sm font-medium text-gray-400">Global Reach</span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
