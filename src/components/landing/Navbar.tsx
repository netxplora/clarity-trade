import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, ArrowUpRight, ChevronDown, User, LogIn, LayoutDashboard } from "lucide-react";
import { Button } from "@/components/ui/button";
import LanguageSwitcher from "@/components/ui/LanguageSwitcher";
import { useStore } from "@/store/useStore";

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
    { name: "Crypto", href: "/crypto" },
    { name: "Forex", href: "/forex" },
    { name: "Commodities", href: "/commodities" },
    { name: "About Us", href: "/about-us" },
    { name: "Contact", href: "/contact" },
  ];

  const isHome = location.pathname === "/";

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-[100] transition-all duration-300 ${
        scrolled 
        ? "py-3 bg-white shadow-md border-b border-gray-100" 
        : `py-6 ${isHome ? "bg-transparent" : "bg-white border-b border-gray-100"}`
      }`}
    >
      <div className="container mx-auto px-6 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-3 transition-transform hover:scale-105" onClick={() => window.scrollTo(0,0)}>
          <img src="/logo.png" alt="Clarity Trade Logo" className="w-10 h-10 object-contain drop-shadow-md" />
          <span className={`text-xl font-extrabold tracking-tighter ${(!scrolled && isHome) ? 'text-white' : 'text-gray-900'}`}>
            CLARITY<span className="text-[#D4AF37]">TRADE</span>
          </span>
        </Link>

        {/* Desktop Links */}
        <div className="hidden lg:flex items-center gap-8">
          {navLinks.map((link) => (
            <Link 
              key={link.name} 
              to={link.href} 
              className={`text-sm font-bold uppercase tracking-widest transition-colors ${
                (!scrolled && isHome) ? 'text-gray-200 hover:text-[#D4AF37]' : 'text-gray-600 hover:text-[#D4AF37]'
              }`}
            >
              {link.name}
            </Link>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-4">
          <div className="transition-colors hidden sm:flex items-center">
             <LanguageSwitcher variant={(!scrolled && isHome) ? "transparent" : "default"} />
          </div>

          <div className="hidden md:flex items-center gap-3">
             {user ? (
               <Link 
                 to={user.role === 'admin' ? '/admin' : '/dashboard'} 
                 className="btn-gold !py-2.5 !px-6 text-[10px] uppercase tracking-[0.2em] shadow-lg flex items-center gap-2 group"
               >
                  <LayoutDashboard className="w-4 h-4 group-hover:scale-110 transition-transform" /> 
                  <span className="font-black truncate max-w-[150px]">{user.name.split(' ')[0]} PORTAL</span>
               </Link>
             ) : (
               <>
                 <Link to="/auth/login" className={`flex items-center gap-2 text-sm font-bold uppercase tracking-widest px-4 py-2 rounded transition-all ${
                   (!scrolled && isHome) ? 'text-white hover:text-[#D4AF37]' : 'text-gray-700 hover:text-[#D4AF37]'
                 }`}>
                    <LogIn className="w-4 h-4" /> Sign In
                 </Link>
                 <Link to="/auth/register" className="btn-gold !py-2.5 !px-6 text-xs uppercase tracking-widest shadow-lg">
                    Get Started
                 </Link>
               </>
             )}
          </div>

          {/* Mobile Menu Toggle */}
          <button 
            className={`lg:hidden p-2 rounded transition-colors ${
              (!scrolled && isHome) ? 'text-white' : 'text-gray-900'
            }`}
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
            className="lg:hidden bg-white border-t border-gray-100 overflow-hidden shadow-xl"
          >
            <div className="p-6 flex flex-col gap-4">
              {navLinks.map((link) => (
                <Link 
                  key={link.name} 
                  to={link.href} 
                  className="text-base font-bold text-gray-800 uppercase tracking-widest py-3 border-b border-gray-50 flex items-center justify-between group"
                  onClick={() => setMobileOpen(false)}
                >
                  {link.name}
                  <ArrowUpRight className="w-4 h-4 text-gray-300 group-hover:text-[#D4AF37] transition-colors" />
                </Link>
              ))}
              
              {/* Mobile Translation Widget */}
              <div className="flex items-center py-3 border-b border-gray-50 text-gray-800">
                <LanguageSwitcher />
              </div>

              <div className="pt-4">
                 {user ? (
                    <Link 
                      to={user.role === 'admin' ? '/admin' : '/dashboard'} 
                      className="bg-[#D4AF37] text-white flex items-center justify-center gap-3 font-bold uppercase tracking-widest text-xs py-5 rounded shadow-lg group" 
                      onClick={() => setMobileOpen(false)}
                    >
                       <LayoutDashboard className="w-4 h-4" /> Go to Dashboard
                    </Link>
                 ) : (
                    <div className="grid grid-cols-2 gap-4">
                       <Link to="/auth/login" className="flex items-center justify-center gap-2 border border-gray-200 text-gray-700 font-bold uppercase tracking-widest text-xs py-4 rounded" onClick={() => setMobileOpen(false)}>
                          Sign In
                       </Link>
                       <Link to="/auth/register" className="bg-[#D4AF37] text-white flex items-center justify-center gap-2 font-bold uppercase tracking-widest text-xs py-4 rounded shadow-lg" onClick={() => setMobileOpen(false)}>
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
