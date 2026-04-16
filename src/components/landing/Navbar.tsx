import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, ArrowUpRight, ChevronDown, User, LogIn, LayoutDashboard } from "lucide-react";

import { useStore } from "@/store/useStore";
import { ThemeToggle } from "@/components/ThemeToggle";

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const { user } = useStore();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const navLinks = [
    { name: "Investment Plans", href: "/#investment-plans" },
    { name: "Copy Trading", href: "/#testimonials" },
    { name: "Platform", href: "/#features" },
    { name: "Security", href: "/#security" },
    { name: "FAQ", href: "/#faq" },
  ];

  const isHome = location.pathname === "/";

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-[100] transition-all duration-300 ${
        scrolled 
        ? "py-3 bg-[#0a0a0a]/90 backdrop-blur-md shadow-[0_4px_30px_rgba(0,0,0,0.5)] border-b border-[#333]/50" 
        : `py-6 bg-transparent border-b border-transparent`
      }`}
    >
      <div className="container mx-auto px-6 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-3 transition-transform hover:scale-105" onClick={() => window.scrollTo(0,0)}>
          <img src="/logo.png" alt="Clarity Trade Logo" className="w-10 h-10 object-contain drop-shadow-md" />
          <span className="text-xl font-extrabold tracking-tighter text-white" style={{ fontFamily: "Inter, sans-serif" }}>
            CLARITY<span className="text-[#D4AF37]">TRADE</span>
          </span>
        </Link>

        {/* Desktop Links */}
        <div className="hidden lg:flex items-center gap-8">
          {navLinks.map((link) => (
            <a 
              key={link.name} 
              href={link.href} 
              className="text-xs font-bold uppercase tracking-widest text-gray-300 hover:text-[#D4AF37] transition-colors"
            >
              {link.name}
            </a>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-4">
          <div className="transition-colors hidden sm:flex items-center gap-2">
             <ThemeToggle />
          </div>

          <div className="hidden md:flex items-center gap-4">
             {user ? (
               <Link 
                 to={user.role === 'admin' ? '/admin' : '/dashboard'} 
                 className="bg-[#D4AF37] text-[#0a0a0a] hover:bg-[#b0902a] px-6 py-2.5 rounded font-bold text-[10px] uppercase tracking-[0.2em] shadow-lg flex items-center gap-2 group transition-colors"
               >
                  <LayoutDashboard className="w-4 h-4 group-hover:scale-110 transition-transform" /> 
                  <span className="truncate max-w-[150px]">DASHBOARD</span>
               </Link>
             ) : (
               <>
                 <Link to="/auth/login" className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest px-4 py-2 text-white hover:text-[#D4AF37] transition-all">
                    <LogIn className="w-4 h-4" /> Sign In
                 </Link>
                 <Link to="/auth/register" className="bg-[#D4AF37] text-[#0a0a0a] hover:bg-[#b0902a] px-6 py-2.5 rounded font-bold text-xs uppercase tracking-widest shadow-lg transition-colors">
                    Get Started
                 </Link>
               </>
             )}
          </div>

          {/* Mobile Menu Toggle */}
          <button 
            className="lg:hidden p-2 rounded transition-colors text-white"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden bg-[#0A0A0A] border-t border-[#333] overflow-hidden shadow-xl"
          >
            <div className="p-6 flex flex-col gap-4">
              {navLinks.map((link) => (
                <a 
                  key={link.name} 
                  href={link.href} 
                  className="text-sm font-bold text-gray-200 uppercase tracking-widest py-3 border-b border-[#333] flex items-center justify-between group"
                  onClick={() => setMobileOpen(false)}
                >
                  {link.name}
                  <ArrowUpRight className="w-4 h-4 text-gray-500 group-hover:text-[#D4AF37] transition-colors" />
                </a>
              ))}
              
              <div className="pt-4">
                 {user ? (
                    <Link 
                      to={user.role === 'admin' ? '/admin' : '/dashboard'} 
                      className="bg-[#D4AF37] text-[#0a0a0a] flex items-center justify-center gap-3 font-bold uppercase tracking-widest text-xs py-5 rounded shadow-lg group" 
                      onClick={() => setMobileOpen(false)}
                    >
                       <LayoutDashboard className="w-4 h-4" /> Go to Dashboard
                    </Link>
                 ) : (
                    <div className="grid grid-cols-2 gap-4">
                       <Link to="/auth/login" className="flex items-center justify-center gap-2 border border-[#333] text-gray-300 font-bold uppercase tracking-widest text-xs py-4 rounded" onClick={() => setMobileOpen(false)}>
                          Sign In
                       </Link>
                       <Link to="/auth/register" className="bg-[#D4AF37] text-[#0a0a0a] flex items-center justify-center gap-2 font-bold uppercase tracking-widest text-xs py-4 rounded shadow-lg" onClick={() => setMobileOpen(false)}>
                          Get Started
                       </Link>
                    </div>
                 )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;
