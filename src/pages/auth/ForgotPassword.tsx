import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Mail, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage("");

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });

      if (error) {
        setErrorMessage(error.message);
        toast.error("Failed to send reset link", { description: error.message });
        return;
      }

      setIsSent(true);
      toast.success("Reset link sent", { description: "Check your email inbox." });
    } catch (err: any) {
      setErrorMessage(err.message || "An unexpected error occurred.");
      toast.error("Something went wrong.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-secondary/30 font-sans p-6">
      <motion.div
         initial={{ opacity: 0, scale: 0.95 }}
         animate={{ opacity: 1, scale: 1 }}
         transition={{ duration: 0.5 }}
         className="w-full max-w-md bg-card rounded-3xl p-8 md:p-12 shadow-huge border border-border"
      >
        <div className="flex justify-center mb-8">
            <Link to="/" className="w-14 h-14 transition-transform hover:scale-105">
                <img src="/logo.png" alt="Clarity Trade Logo" className="w-full h-full object-contain drop-shadow-gold" />
            </Link>
        </div>

        <div className="text-center mb-10">
            <h1 className="text-2xl font-bold font-playfair text-foreground mb-3">Reset your password</h1>
            <p className="text-muted-foreground text-sm">
                {!isSent ? "Enter your email address and we'll send you a link to reset your password." : "We've sent a password reset link to your email address."}
            </p>
        </div>

        {!isSent ? (
            <form onSubmit={handleSubmit} className="space-y-6">
               <div className="space-y-2">
                 <label className="text-sm font-semibold text-foreground">Email address</label>
                 <input 
                    type="email" 
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@company.com" 
                    className="w-full h-12 bg-secondary border border-border rounded-xl px-4 outline-none focus:border-primary/40 focus:ring-1 focus:ring-primary/40 transition-all text-foreground text-sm" 
                 />
               </div>

               {errorMessage && (
                 <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs font-medium">
                   <AlertCircle className="w-4 h-4 shrink-0" />
                   {errorMessage}
                 </div>
               )}

               <Button variant="hero" disabled={isLoading} className="w-full h-12 rounded-xl text-white shadow-gold mt-4 font-semibold text-sm">
                 {isLoading ? "Sending Link..." : "Send Reset Link"}
                 {!isLoading && <Mail className="w-4 h-4 ml-2" />}
               </Button>
            </form>
        ) : (
            <div className="flex flex-col items-center gap-6">
                <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center text-green-600 mb-2">
                    <Mail className="w-8 h-8" />
                </div>
                <p className="text-sm text-muted-foreground text-center">
                  If an account exists with <span className="font-semibold text-foreground">{email}</span>, you'll receive a password reset link shortly.
                </p>
                <Button variant="outline" className="w-full h-12 rounded-xl border-border hover:bg-secondary text-sm font-semibold" onClick={() => { setIsSent(false); setEmail(""); }}>
                    Try another email
                </Button>
            </div>
        )}

        <div className="mt-10 text-center">
            <Link to="/auth/login" className="inline-flex items-center text-sm font-semibold text-muted-foreground hover:text-primary transition-colors">
                <ArrowLeft className="w-4 h-4 mr-2" /> Back to Sign In
            </Link>
        </div>
      </motion.div>
    </div>
  );
};

export default ForgotPassword;
