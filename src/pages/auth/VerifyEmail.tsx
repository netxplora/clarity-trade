import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Mail, RefreshCw, ArrowLeft, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

const VerifyEmail = () => {
  const [isResending, setIsResending] = useState(false);
  const [resent, setResent] = useState(false);

  const handleResend = async () => {
    setIsResending(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user?.email) {
        toast.error("No email found. Please log in again.");
        return;
      }

      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: session.user.email,
      });

      if (error) {
        toast.error(error.message);
      } else {
        setResent(true);
        toast.success("Verification email sent", {
          description: `Check your inbox at ${session.user.email}`
        });
      }
    } catch (err: any) {
      toast.error("Failed to resend verification email.");
    } finally {
      setIsResending(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/auth/login";
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background font-sans p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md text-center space-y-8"
      >
        {/* Icon */}
        <div className="mx-auto w-20 h-20 bg-primary/10 border border-primary/20 rounded-2xl flex items-center justify-center">
          <Mail className="w-10 h-10 text-primary" />
        </div>

        {/* Content */}
        <div className="space-y-3">
          <h1 className="text-2xl font-bold text-foreground font-playfair">
            Verify Your Email
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed max-w-sm mx-auto">
            We sent a verification link to your email address. Please check your inbox and click the link to activate your account.
          </p>
        </div>

        {/* Status */}
        {resent && (
          <div className="flex items-center justify-center gap-2 text-green-500 text-xs font-medium">
            <CheckCircle2 className="w-4 h-4" />
            Verification email resent successfully
          </div>
        )}

        {/* Actions */}
        <div className="space-y-3">
          <Button
            onClick={handleResend}
            disabled={isResending}
            className="w-full h-12 rounded-xl text-sm font-semibold"
          >
            {isResending ? (
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Mail className="w-4 h-4 mr-2" />
            )}
            {isResending ? "Sending..." : "Resend Verification Email"}
          </Button>

          <Button
            variant="outline"
            onClick={handleLogout}
            className="w-full h-12 rounded-xl text-sm font-semibold"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Login
          </Button>
        </div>

        {/* Help text */}
        <div className="pt-4 border-t border-border space-y-2">
          <p className="text-xs text-muted-foreground">
            Did not receive the email? Check your spam or junk folder.
          </p>
          <p className="text-xs text-muted-foreground">
            Wrong email?{" "}
            <button onClick={handleLogout} className="text-primary hover:underline font-semibold">
              Sign up with a different email
            </button>
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default VerifyEmail;
