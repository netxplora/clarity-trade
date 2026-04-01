import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowUpRight, Rocket, LayoutDashboard } from "lucide-react";
import { useStore } from "@/store/useStore";

const CTASection = () => {
  const { user } = useStore();
  return (
    <section className="bg-[#0B0F14] relative overflow-hidden text-center py-20 lg:py-32" id="cta">
      {/* Background Hero */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-20 scale-[1.02]"
          style={{ backgroundImage: "url('/images/hero-trading-bg.png')" }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0B0F14] via-[#0B0F14]/80 to-[#0B0F14]" />
      </div>
      <div className="container mx-auto px-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="max-w-4xl mx-auto"
        >
          <div className="w-20 h-20 rounded-full bg-[#D4AF37]/10 flex items-center justify-center mx-auto mb-10 border border-[#D4AF37]/20 shadow-xl">
             <Rocket className="w-10 h-10 text-[#D4AF37]" />
          </div>
          
          <span className="heading-gold">Ready to Start?</span>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-white leading-tight mb-8 drop-shadow-lg">
             Begin Your Journey to <br className="hidden md:block" />
             <span className="text-[#D4AF37]">Wealth and Success</span>
          </h2>
          
          <p className="p-hyip-dark mb-12 max-w-2xl mx-auto">
            Join thousands of traders who are already earning profit passively. 
            Create your account today and start trading global markets with ease.
          </p>

          {user ? (
             <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
                <Link to={user.role === 'admin' ? '/admin' : '/dashboard'} className="btn-gold !h-16 px-16 text-lg flex items-center justify-center gap-4 w-full sm:w-auto hover:shadow-gold transition-all hover:scale-105 active:scale-95 group">
                   <LayoutDashboard className="w-6 h-6 group-hover:rotate-12 transition-transform" /> Go to My Dashboard <ArrowUpRight className="w-6 h-6" />
                </Link>
             </div>
          ) : (
             <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
                <Link to="/auth/register" className="btn-gold !h-14 px-12 text-base flex items-center justify-center gap-3 w-full sm:w-auto hover:shadow-gold transition-shadow">
                   Register Free Account <ArrowUpRight className="w-5 h-5" />
                </Link>
                <Link to="/auth/login" className="btn-gold-outline !h-14 px-12 text-base w-full sm:w-auto flex items-center justify-center">
                   Sign In Now
                </Link>
             </div>
          )}
          
          <div className="mt-16 text-gray-400 text-xs font-bold uppercase tracking-widest flex flex-wrap items-center justify-center gap-10">
             <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-500" /> Instant Registration
             </div>
             <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-500" /> Secure Encryption
             </div>
             <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-500" /> 24/7 Live Support
             </div>
          </div>
        </motion.div>
      </div>

      {/* Decorative patterns */}
      <div className="absolute top-[-50%] left-[-20%] w-[100%] h-[150%] bg-[#D4AF37]/[0.02] blur-[150px] pointer-events-none rounded-full" />
      <div className="absolute bottom-[-50%] right-[-20%] w-[100%] h-[150%] bg-[#D4AF37]/[0.02] blur-[150px] pointer-events-none rounded-full" />
    </section>
  );
};

export default CTASection;
