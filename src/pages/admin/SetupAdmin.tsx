import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ShieldCheck, Loader2, Lock, Terminal, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

type SetupPhase = "checking" | "locked" | "ready" | "creating" | "done";

const SetupAdmin = () => {
  const navigate = useNavigate();
  const [phase, setPhase] = useState<SetupPhase>("checking");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");

  useEffect(() => {
    const checkForAdmins = async () => {
      const { count } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .eq("role", "admin");
      if (count && count > 0) {
        setPhase("locked");
      } else {
        setPhase("ready");
      }
    };
    checkForAdmins();
  }, []);

  const handleCreateAdmin = async () => {
    if (!email || !password || !fullName) {
      toast.error("All fields are required.");
      return;
    }
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters.");
      return;
    }
    setPhase("creating");
    try {
      // Step 1: Create the auth account
      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: fullName } },
      });
      if (signUpError) throw signUpError;

      // Step 2: Sign in immediately to establish session (needed for RPC auth)
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (signInError) throw signInError;

      // Step 3: Use the secure RPC function to promote to admin (bypasses RLS)
      const { error: rpcError } = await supabase.rpc("initialize_first_admin", {
        admin_name: fullName,
        admin_email: email,
      });
      if (rpcError) throw rpcError;

      setPhase("done");
      toast.success("Super Admin created successfully!");
      setTimeout(() => navigate("/admin/login"), 2500);
    } catch (err: any) {
      toast.error(err.message || "Setup failed.");
      setPhase("ready");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0a0a0f] via-[#0d0d1a] to-[#0a0a0f] relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-600/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-600/5 rounded-full blur-[120px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 w-full max-w-md mx-4"
      >
        <div className="rounded-2xl border border-white/[0.06] bg-[#111118]/80 backdrop-blur-xl shadow-2xl p-8">
          {/* Header */}
          <div className="flex flex-col items-center gap-3 mb-8">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-purple-500/20 to-blue-500/20 border border-purple-500/20 flex items-center justify-center">
              {phase === "locked" ? (
                <Lock className="w-7 h-7 text-red-400" />
              ) : phase === "done" ? (
                <ShieldCheck className="w-7 h-7 text-emerald-400" />
              ) : (
                <Terminal className="w-7 h-7 text-purple-400" />
              )}
            </div>
            <h1 className="text-xl font-bold text-white tracking-tight">
              {phase === "locked" ? "Setup Locked" : phase === "done" ? "Setup Complete" : "Admin Initialization"}
            </h1>
            <p className="text-sm text-white/40 text-center">
              {phase === "locked"
                ? "An administrator already exists. This setup is no longer available."
                : phase === "done"
                ? "Redirecting to Admin Login..."
                : "One-time setup to create the first Super Admin account."}
            </p>
          </div>

          {/* Content */}
          {phase === "checking" && (
            <div className="flex flex-col items-center gap-4 py-8">
              <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
              <p className="text-sm text-white/50">Scanning system for existing administrators...</p>
            </div>
          )}

          {phase === "locked" && (
            <div className="flex flex-col items-center gap-4 py-4">
              <div className="flex items-center gap-2 text-amber-400/80 bg-amber-500/10 border border-amber-500/20 rounded-lg px-4 py-3 w-full">
                <AlertTriangle className="w-5 h-5 shrink-0" />
                <p className="text-xs">This page is permanently disabled. Please use the standard Admin Login portal.</p>
              </div>
              <Button
                onClick={() => navigate("/admin/login")}
                className="w-full mt-2 bg-white/10 hover:bg-white/15 text-white border border-white/10"
              >
                Go to Admin Login
              </Button>
            </div>
          )}

          {phase === "ready" && (
            <div className="space-y-5">
              <div className="flex items-center gap-2 text-blue-400/80 bg-blue-500/10 border border-blue-500/20 rounded-lg px-4 py-3">
                <ShieldCheck className="w-5 h-5 shrink-0" />
                <p className="text-xs">No administrators found. Create your Super Admin account below.</p>
              </div>
              <div className="space-y-2">
                <Label className="text-white/60 text-xs uppercase tracking-wider">Full Name</Label>
                <Input
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Platform Administrator"
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/20 focus:border-purple-500/50"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-white/60 text-xs uppercase tracking-wider">Email Address</Label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@clarity-trade.com"
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/20 focus:border-purple-500/50"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-white/60 text-xs uppercase tracking-wider">Password</Label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/20 focus:border-purple-500/50"
                />
              </div>
              <Button
                onClick={handleCreateAdmin}
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-semibold py-5 text-sm mt-2"
              >
                <ShieldCheck className="w-4 h-4 mr-2" />
                Initialize Super Admin
              </Button>
            </div>
          )}

          {phase === "creating" && (
            <div className="flex flex-col items-center gap-4 py-8">
              <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
              <p className="text-sm text-white/50">Creating Super Admin account...</p>
            </div>
          )}

          {phase === "done" && (
            <div className="flex flex-col items-center gap-4 py-4">
              <div className="flex items-center gap-2 text-emerald-400/80 bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-4 py-3 w-full">
                <ShieldCheck className="w-5 h-5 shrink-0" />
                <p className="text-xs">Super Admin account created. Redirecting to login...</p>
              </div>
              <Loader2 className="w-5 h-5 text-emerald-400 animate-spin" />
            </div>
          )}

          {/* Footer */}
          <div className="mt-8 pt-4 border-t border-white/[0.06] text-center">
            <p className="text-[10px] text-white/20 uppercase tracking-widest">
              Clarity Trade • System Configuration • v1.0
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default SetupAdmin;
