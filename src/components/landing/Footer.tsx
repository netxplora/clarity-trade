import { Link } from "react-router-dom";
import { Twitter, Youtube, Linkedin, Mail, MapPin, Phone } from "lucide-react";

const Footer = () => {
  const footerLinks = {
    "Quick Links": [
      { name: "Trading Plan", href: "/trading" },
      { name: "About Us", href: "/about-us" },
      { name: "Contact Us", href: "/contact" },
      { name: "Expert Traders", href: "/copy-trading" },
    ],
    "Legal & Privacy": [
      { name: "Terms of Service", href: "/terms-of-service" },
      { name: "Privacy Policy", href: "/privacy-policy" },
      { name: "Cookie Policy", href: "/cookie-policy" },
      { name: "Risk Disclosure", href: "/risk-disclosure" },
    ],
    "Support": [
      { name: "Help Center", href: "/help" },
      { name: "FAQs", href: "/faq" },
      { name: "Security Center", href: "/security" },
      { name: "Feedback", href: "/contact" },
    ],
  };

  return (
    <footer className="bg-background pt-24 pb-12 border-t border-border/50">
      <div className="container mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-16 mb-20 lg:mb-24">
          
          {/* Brand & Reach */}
          <div className="lg:col-span-2 space-y-8">
            <Link to="/" className="flex items-center gap-4 group" onClick={() => window.scrollTo(0,0)}>
              <div className="w-12 h-12 transition-all duration-300 group-hover:scale-110">
                <img src="/logo.png" alt="Clarity Trade Logo" className="w-full h-full object-contain drop-shadow-md" />
              </div>
              <span className="text-2xl font-black text-foreground tracking-tighter leading-none" style={{ fontFamily: "Inter, sans-serif" }}>Clarity<span className="text-[#D4AF37] font-medium">Trade</span></span>
            </Link>
            
            <p className="text-muted-foreground text-sm max-w-sm leading-relaxed">
               Clarity Trade is a secure and powerful trading platform offering 
               institutional-grade market access to retail traders globally 
               with built-in smart copying.
            </p>

            <div className="flex flex-col gap-4">
               <div className="flex items-center gap-3 text-muted-foreground text-sm">
                  <Mail className="w-5 h-5 text-[#D4AF37]" /> support@claritytrade.com
               </div>
               <div className="flex items-center gap-3 text-muted-foreground text-sm">
                  <MapPin className="w-5 h-5 text-[#D4AF37]" /> 22 Global Finance Plaza, NYC
               </div>
               <div className="flex items-center gap-3 text-muted-foreground text-sm">
                  <Phone className="w-5 h-5 text-[#D4AF37]" /> +1 (800) 123-4567
               </div>
            </div>

            <div className="flex items-center gap-4 hidden">
              {[Twitter, Youtube, Linkedin].map((Icon, i) => (
                <a key={i} href="#" className="w-10 h-10 rounded bg-secondary border border-border flex items-center justify-center text-muted-foreground hover:text-[#D4AF37] hover:border-[#D4AF37]/50 transition-all">
                  <Icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Links Grid */}
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category} className="lg:col-span-1">
              <h4 className="font-extrabold text-[#D4AF37] mb-8 text-xs tracking-widest uppercase pb-3 border-b border-border">
                 {category}
              </h4>
              <ul className="space-y-4">
                {links.map((link) => (
                  <li key={link.name}>
                    <Link to={link.href} onClick={() => window.scrollTo(0,0)} className="text-sm text-muted-foreground hover:text-[#D4AF37] transition-all flex items-center gap-2 group">
                       <span className="w-4 h-[1px] bg-border group-hover:w-6 transition-all group-hover:bg-[#D4AF37]" /> {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom Banner */}
        <div className="pt-10 border-t border-border/50 flex flex-col md:flex-row items-center justify-between gap-8">
          <p className="text-muted-foreground/40 text-[10px] uppercase font-bold tracking-widest text-center md:text-left">
            © {new Date().getFullYear()} Clarity Trade Technology. All rights reserved.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-10 opacity-30 grayscale hover:grayscale-0 transition-opacity">
             <div className="text-foreground font-black text-lg tracking-tighter" style={{ fontFamily: "Inter, sans-serif" }}>FINRA REGULATED</div>
             <div className="text-foreground font-black text-lg tracking-tighter" style={{ fontFamily: "Inter, sans-serif" }}>SEC COMPLIANCE</div>
             <div className="text-foreground font-black text-lg tracking-tighter" style={{ fontFamily: "Inter, sans-serif" }}>PCI DSS 1.0</div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
