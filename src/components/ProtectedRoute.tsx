import { Navigate, useLocation } from "react-router-dom";
import { useStore } from "@/store/useStore";
import { Loader2 } from "lucide-react";
import { useEffect } from "react";

interface ProtectedRouteProps {
  children: React.ReactNode;
  adminOnly?: boolean;
}

const ProtectedRoute = ({ children, adminOnly: requireAdmin = false }: ProtectedRouteProps) => {
  const { user, isAuthInitialized, isLoading } = useStore();
  const location = useLocation();

  // Failsafe: if auth hangs for more than 20 seconds, force-initialize so
  // the user at least gets redirected to login instead of staring at a spinner forever.
  useEffect(() => {
    const failsafe = setTimeout(() => {
      const state = useStore.getState();
      if (!state.isAuthInitialized) {
        console.warn("[ProtectedRoute] Auth initialization timed out after 20s. Force-initializing.");
        useStore.setState({ isAuthInitialized: true, isLoading: false });
      }
    }, 20000);
    return () => clearTimeout(failsafe);
  }, []);

  // While auth is initializing or profile data is loading, show a spinner.
  // This is the ONLY blocking state — everything else resolves to a redirect or render.
  if (!isAuthInitialized || isLoading) {
    return (
      <div className="min-h-screen w-full bg-background flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-8 h-8 text-primary/50 animate-spin" />
        <p className="text-xs text-muted-foreground font-medium animate-pulse">Loading your account...</p>
      </div>
    );
  }

  // No user in store after initialization → redirect to login.
  // This covers both "no session" AND "session exists but profile failed to load".
  // The previous version showed a permanent error screen here which deadlocked users.
  // Now they simply get redirected to login, which will re-trigger the auth flow cleanly.
  if (!user) {
    return <Navigate to="/auth/login" state={{ from: location }} replace />;
  }

  if (requireAdmin && user.role !== "admin") {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
