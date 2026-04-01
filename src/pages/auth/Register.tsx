import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { TrendingUp, Eye, EyeOff, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

const Register = () => {
  const location = useLocation();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [password, setPassword] = useState("");
  const [referralCode, setReferralCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) navigate("/dashboard");
    });
  }, [navigate]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const ref = params.get("ref");
    if (ref) setReferralCode(ref);
  }, [location]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: `${firstName} ${lastName}`.trim(),
            referral_code: referralCode,
          }
        }
      });

      if (error) {
        toast.error(error.message);
        setIsLoading(false);
        return;
      }

      toast.success("Account created securely. Dashboard initialized.");
      window.location.href = "/dashboard";
    } catch (err: any) {
      toast.error(err.message || "An error occurred during registration.");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-row-reverse bg-background font-sans">
      {/* Right side — Decorative */}
      <div className="hidden lg:flex lg:w-[50%] relative flex-col items-center justify-center p-20 overflow-hidden bg-[#0A0A0A]">
        <div className="absolute inset-0 bg-[url('/images/hero-trading-bg.png')] bg-cover bg-center opacity-20 object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A] via-[#0A0A0A]/80 to-transparent" />
        
        <div className="relative z-10 w-full max-w-lg">
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 1 }}
          >
            <h1 className="text-5xl font-bold font-playfair text-white mb-6 leading-tight">
               Built for the <br />
               <span className="text-transparent bg-clip-text bg-gradient-gold">Next Generation</span>
            </h1>
            <p className="text-lg text-white/50 leading-relaxed">
               Open an institutional-grade account in minutes. Securely deposit fiat or crypto and trade across 150+ global markets.
            </p>
          </motion.div>
        </div>
      </div>

      {/* Left side — Form */}
      <div className="flex-1 flex flex-col items-center justify-center p-8 md:p-16 relative bg-white">
        <motion.div
           initial={{ opacity: 0, x: -20 }}
           animate={{ opacity: 1, x: 0 }}
           transition={{ duration: 0.6 }}
           className="w-full max-w-md relative z-10"
        >
          <div className="flex flex-col items-center mb-10 text-center">
            <Link to="/" className="w-16 h-16 transition-transform hover:scale-105 mb-6">
                <img src="/logo.png" alt="Clarity Trade Logo" className="w-full h-full object-contain drop-shadow-gold" />
            </Link>
            <h2 className="text-3xl font-bold font-playfair text-zinc-950 mb-3">Create an account</h2>
            <p className="text-zinc-700 text-sm max-w-[280px] font-medium">Fill in your details to start trading immediately.</p>

          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
               <div className="space-y-2.5">
                  <label className="text-[13px] font-bold text-zinc-900">First Name</label>
                  <input 
                     type="text" 
                     required
                     value={firstName}
                     onChange={(e) => setFirstName(e.target.value)}
                     placeholder="John" 
                     className="w-full h-12 bg-secondary/30 border border-border/80 rounded-xl px-4 outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/60 transition-all text-sm text-zinc-950 placeholder:text-muted-foreground/30 shadow-sm" 
                  />
               </div>
               <div className="space-y-2.5">
                  <label className="text-[13px] font-bold text-zinc-900">Last Name</label>
                  <input 
                     type="text" 
                     required
                     value={lastName}
                     onChange={(e) => setLastName(e.target.value)}
                     placeholder="Doe" 
                      className="w-full h-12 bg-secondary/30 border border-border/80 rounded-xl px-4 outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/60 transition-all text-sm text-zinc-950 placeholder:text-muted-foreground/30 shadow-sm" 
                   />
                </div>
             </div>

             <div className="space-y-2.5">
                <label className="text-[13px] font-bold text-zinc-900">Email address</label>
                <input 
                   type="email" 
                   required
                   value={email}
                   onChange={(e) => setEmail(e.target.value)}
                   placeholder="name@company.com" 
                   className="w-full h-12 bg-secondary/30 border border-border/80 rounded-xl px-4 outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/60 transition-all text-sm text-zinc-950 placeholder:text-muted-foreground/30 shadow-sm" 
                />
             </div>

             <div className="space-y-2.5">
                <label className="text-[13px] font-bold text-zinc-900">Password</label>
                <div className="relative">
                  <input 
                     type={showPassword ? "text" : "password"} 
                     required
                     value={password}
                     onChange={(e) => setPassword(e.target.value)}
                     placeholder="••••••••" 
                     className="w-full h-12 bg-secondary/30 border border-border/80 rounded-xl px-4 pr-12 outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/60 transition-all text-sm tracking-widest text-zinc-950 placeholder:text-muted-foreground/30 shadow-sm" 
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground/60 hover:text-foreground transition-colors">
                     {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-[11px] text-zinc-500 mt-1.5 ml-1 font-medium">Must be at least 8 characters.</p>
             </div>

             <div className="space-y-2.5">
                <label className="text-[13px] font-bold text-zinc-900">Referral Code (Optional)</label>
                <input 
                   type="text" 
                   value={referralCode}
                   onChange={(e) => setReferralCode(e.target.value)}
                   placeholder="E.g. JD777" 
                   className="w-full h-12 bg-secondary/30 border border-border/80 rounded-xl px-4 outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/60 transition-all text-sm uppercase font-bold text-zinc-950 placeholder:text-muted-foreground/30 shadow-sm" 
                />
            </div>

            <div className="flex items-start gap-3 mt-4">
               <input type="checkbox" className="mt-1 h-4 w-4 rounded border-border text-primary focus:ring-primary/40 bg-secondary" required />
               <p className="text-xs text-zinc-900 font-bold whitespace-normal leading-relaxed">
   By joining, you agree to our <Link to="/terms-of-service" className="text-primary hover:underline font-black">Terms of Service</Link> and <Link to="/privacy-policy" className="text-primary hover:underline font-black">Privacy Policy</Link>.
</p>
            </div>

            <Button variant="hero" disabled={isLoading} className="w-full h-12 rounded-xl text-white shadow-gold mt-4 font-semibold text-sm">
                {isLoading ? "Creating Account..." : "Sign Up"}
                {!isLoading && <ArrowRight className="w-4 h-4 ml-2" />}
            </Button>
          </form>



          <p className="text-center text-sm text-zinc-600 mt-10">
            Already have an account?{" "}
            <Link to="/auth/login" className="font-semibold text-primary hover:text-primary/80 transition-colors">
               Sign In
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default Register;
