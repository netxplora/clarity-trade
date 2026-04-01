import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { TrendingUp, Eye, EyeOff, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

const Login = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        // We don't know the role yet, so we'll fetch it or just go to dashboard
        supabase.from('profiles').select('role').eq('id', session.user.id).single().then(({ data: profile }) => {
          if (profile?.role === 'admin') navigate("/admin");
          else navigate("/dashboard");
        });
      }
    });
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        toast.error(error.message);
        setIsLoading(false);
        return;
      }

      const { user } = data;
      const { data: profile } = await supabase.from('profiles').select('role').eq('id', user?.id).single();

      toast.success("Successfully authenticated!");
      if (profile?.role === 'admin') {
        window.location.href = "/admin";
      } else {
        window.location.href = "/dashboard";
      }
    } catch (err: any) {
       toast.error(err.message || "An error occurred during authentication.");
       setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-background font-sans">
      {/* Left side — Decorative */}
      <div className="hidden lg:flex lg:w-[50%] relative flex-col items-center justify-center p-20 overflow-hidden bg-[#0A0A0A]">
        <div className="absolute inset-0 bg-[url('/images/hero-trading-bg.png')] bg-cover bg-center opacity-20 object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A] via-transparent to-transparent" />
        
        <div className="relative z-10 w-full max-w-lg">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1 }}
          >
            <h1 className="text-5xl font-bold font-playfair text-white mb-6 leading-tight">
               Welcome back to <br />
               <span className="text-transparent bg-clip-text bg-gradient-gold">Clarity Trade</span>
            </h1>
            <p className="text-lg text-white/50 leading-relaxed">
               Access your institutional dashboard. Monitor markets, copy elite traders, and manage your portfolio with unparalleled precision.
            </p>
          </motion.div>
        </div>
      </div>

      {/* Right side — Form */}
      <div className="flex-1 flex flex-col items-center justify-center p-8 md:p-16 relative bg-white">
        <motion.div
           initial={{ opacity: 0, x: 20 }}
           animate={{ opacity: 1, x: 0 }}
           transition={{ duration: 0.6 }}
           className="w-full max-w-md relative z-10"
        >
          <div className="flex flex-col items-center mb-10 text-center">
            <Link to="/" className="w-16 h-16 transition-transform hover:scale-105 mb-6">
                <img src="/logo.png" alt="Clarity Trade Logo" className="w-full h-full object-contain drop-shadow-gold" />
            </Link>
            <h2 className="text-3xl font-bold font-playfair text-zinc-950 mb-3">Sign in securely</h2>
            <p className="text-zinc-700 text-sm max-w-[280px] font-medium">Enter your email and password to access your account.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
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
               <div className="flex items-center justify-between">
                  <label className="text-[13px] font-bold text-zinc-900">Password</label>
                  <Link to="/forgot-password" className="text-xs font-semibold text-primary hover:text-primary/80 transition-colors">Forgot password?</Link>
               </div>
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
            </div>

            <Button variant="hero" disabled={isLoading} className="w-full h-12 rounded-xl text-white shadow-gold mt-4 font-semibold text-sm">
                {isLoading ? "Authenticating..." : "Sign In"}
                {!isLoading && <ArrowRight className="w-4 h-4 ml-2" />}
            </Button>
          </form>



          <p className="text-center text-sm text-zinc-900 mt-10 font-medium">
            Don't have an account?{" "}
            <Link to="/auth/register" className="font-bold text-primary hover:text-primary/80 transition-colors">
               Create one
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default Login;
