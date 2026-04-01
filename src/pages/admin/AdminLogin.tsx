import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ShieldCheck, Eye, EyeOff, Lock, User, ArrowRight, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { useStore } from "@/store/useStore";

const AdminLogin = () => {
  const navigate = useNavigate();
  const { setUser } = useStore();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleAdminLogin = async (e: React.FormEvent) => {
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

      // Verify Admin Role
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .single();

      if (profileError || !profile || profile.role !== 'admin') {
        await supabase.auth.signOut();
        toast.error("Unauthorized Access", { description: "This portal is reserved for platform administrators only." });
        setIsLoading(false);
        return;
      }

      toast.success("Login Successful", { description: `Welcome back, Admin ${profile.name.split(' ')[0]}.` });
      
      // Update global state
      setUser({
        ...profile,
        id: profile.id,
        balanceNum: 0, // Admin doesn't need personal balance in store root usually
        fiatBalanceNum: 0
      } as any);

      navigate("/admin");
    } catch (err: any) {
      toast.error(err.message || "An error occurred during authentication.");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0A0A0B] p-6 font-sans">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,_rgba(212,175,55,0.05)_0%,_rgba(10,10,11,0)_50%)]" />
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="bg-secondary/10 border border-white/5 rounded-[2.5rem] p-10 backdrop-blur-3xl shadow-huge overflow-hidden group">
          <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
            <ShieldCheck className="w-24 h-24 rotate-12" />
          </div>

          <div className="flex flex-col items-center mb-10">
            <div className="w-16 h-16 rounded-2xl bg-gradient-gold flex items-center justify-center shadow-gold mb-6 group-hover:scale-110 transition-transform duration-500">
               <Lock className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-black text-white tracking-tighter uppercase mb-2">Admin Login</h1>
            <p className="text-muted-foreground text-xs font-bold tracking-[0.2em] uppercase">Administrator Authentication</p>
          </div>

          <form onSubmit={handleAdminLogin} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Email Address</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/30" />
                <input 
                  type="email" 
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full h-14 bg-black/40 border border-white/5 rounded-2xl px-12 outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all text-sm font-medium text-white" 
                  placeholder="admin@clarity.trade"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/30" />
                <input 
                  type={showPassword ? "text" : "password"} 
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full h-14 bg-black/40 border border-white/5 rounded-2xl px-12 pr-12 outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all text-sm font-medium text-white tracking-[0.3em]" 
                  placeholder="••••••••"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground/30 hover:text-white transition-colors">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <Button 
              type="submit" 
              disabled={isLoading} 
              variant="hero" 
              className="w-full h-14 rounded-2xl text-white font-black uppercase tracking-widest text-xs shadow-gold mt-4 group"
            >
              {isLoading ? "Logging in..." : "Login"}
              {!isLoading && <Zap className="w-3.5 h-3.5 ml-2 group-hover:animate-pulse" />}
            </Button>
          </form>

          <div className="mt-10 pt-6 border-t border-white/5 text-center">
             <Link to="/login" className="text-[10px] font-bold text-muted-foreground/40 hover:text-primary uppercase tracking-widest transition-colors">
                Switch to User Login
             </Link>
          </div>
        </div>

        <div className="mt-8 flex items-center justify-center gap-6">
           <div className="flex items-center gap-2">
              <ShieldCheck className="w-3.5 h-3.5 text-muted-foreground/20" />
              <span className="text-[9px] font-bold text-muted-foreground/40 uppercase tracking-widest">Secure Connection</span>
           </div>
        </div>
      </motion.div>
    </div>
  );
};

export default AdminLogin;
