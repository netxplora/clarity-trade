import { Navigate, useLocation } from "react-router-dom";
import { useStore } from "@/store/useStore";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

interface ProtectedRouteProps {
  children: React.ReactNode;
  adminOnly?: boolean;
}

const ProtectedRoute = ({ children, adminOnly: requireAdmin = false }: ProtectedRouteProps) => {
  const { user, isAuthInitialized, hasActiveSession, isLoading } = useStore();
  const location = useLocation();

  useEffect(() => {
    // Failsafe: if the AuthListener hangs for more than 15 seconds, manually mark it initialized.
    const failsafe = setTimeout(() => {
      const state = useStore.getState();
      if (!state.isAuthInitialized) {
        console.warn("Auth initialization took too long. Forcing initialization...");
        useStore.setState({ isAuthInitialized: true, isLoading: false });
      }
    }, 15000);
    return () => clearTimeout(failsafe);
  }, []);

  // We only block the route if auth hasn't initialized its very first check 
  // This gracefully waits for the session without flashing intrusive loaders or errors.
  if (!isAuthInitialized) {
    return (
      <div className="min-h-screen w-full bg-background flex flex-col items-center justify-center">
         {/* Silent background loading state, no intrusive blocking UI */}
      </div>
    );
  }

  // If the profile is completely missing but the user has an active session,
  // do not redirect to login (it causes an infinite loop). Show an error instead.
  if (!user && hasActiveSession) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-[#0A0A0A] p-4 text-center">
        <div className="p-8 bg-red-500/10 border border-red-500/20 rounded-2xl max-w-md">
          <h2 className="text-xl font-bold text-red-500 mb-2">Profile Initialization Failed</h2>
          <p className="text-muted-foreground text-sm mb-6">
            Your account exists, but we couldn't load your profile data. This can happen if database triggers are delayed or if you lack sufficient database permissions.
          </p>
          <button 
            onClick={() => window.location.reload()}
            className="px-6 py-2 bg-primary text-white font-bold rounded-lg hover:bg-primary/90 transition-colors"
          >
            Retry Loading
          </button>
          <button 
            onClick={async () => {
              await supabase.auth.signOut();
              window.location.href = '/auth/login';
            }}
            className="px-6 py-2 mt-4 ml-4 bg-secondary text-white font-bold rounded-lg border border-border hover:bg-secondary/80 transition-colors"
          >
            Logout
          </button>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth/login" state={{ from: location }} replace />;
  }

  if (requireAdmin && user.role !== "admin") {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
