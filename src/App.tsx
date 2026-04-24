import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, useLocation } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/ThemeProvider";
import { AnimatePresence } from "framer-motion";
import { useCurrencyDetection } from "./hooks/useCurrencyDetection";
import { useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { useStore, debouncedSync } from "@/store/useStore";
import LiveChatWidget from "./components/dashboard/LiveChatWidget";

import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import ProtectedRoute from "./components/ProtectedRoute";

// Auth
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import ForgotPassword from "./pages/auth/ForgotPassword";

// Public Pages
import Trading from "./pages/public/Trading";

import WalletPublic from "./pages/public/Wallet";
import AnalyticsPublic from "./pages/public/Analytics";
import Crypto from "./pages/public/Crypto";
import Forex from "./pages/public/Forex";
import Commodities from "./pages/public/Commodities";
import MarketData from "./pages/public/MarketData";
import AboutUs from "./pages/public/AboutUs";
import Careers from "./pages/public/Careers";
import Security from "./pages/public/Security";
import Contact from "./pages/public/Contact";
import TermsOfService from "./pages/public/TermsOfService";
import PrivacyPolicy from "./pages/public/PrivacyPolicy";
import CookiePolicy from "./pages/public/CookiePolicy";
import RiskDisclosure from "./pages/public/RiskDisclosure";
import FAQ from "./pages/public/FAQ";
import Help from "./pages/public/Help";

// Lazy Pages for Performance and Stability
import { lazy, Suspense } from "react";
const Overview = lazy(() => import("./pages/dashboard/Overview"));
const WalletPage = lazy(() => import("./pages/dashboard/WalletPage"));
const TradingPage = lazy(() => import("./pages/dashboard/TradingPage"));

const AnalysisPage = lazy(() => import("./pages/dashboard/AnalysisPage"));
const ReferralPage = lazy(() => import("./pages/dashboard/ReferralPage"));
const SettingsPage = lazy(() => import("./pages/dashboard/SettingsPage"));
const KYCPage = lazy(() => import("./pages/dashboard/KYCPage"));
const SubscriptionPage = lazy(() => import("./pages/dashboard/SubscriptionPage"));

const InvestmentsPage = lazy(() => import("./pages/dashboard/InvestmentsPage"));
const HelpCenter = lazy(() => import("./pages/dashboard/HelpCenter"));
const StatusPage = lazy(() => import("./pages/dashboard/StatusPage"));

// Admin
const AdminOverview = lazy(() => import("./pages/admin/AdminOverview"));
const UserManagement = lazy(() => import("./pages/admin/UserManagement"));
const FinancialManagement = lazy(() => import("./pages/admin/FinancialManagement"));
const AdminTradingControl = lazy(() => import("./pages/admin/AdminTradingControl"));

const ReferralManagement = lazy(() => import("./pages/admin/ReferralManagement"));
const ContentManagement = lazy(() => import("./pages/admin/ContentManagement"));
const AdminSettings = lazy(() => import("./pages/admin/AdminSettings"));
const CryptoProviderManagement = lazy(() => import("./pages/admin/CryptoProviderManagement"));
const SetupAdmin = lazy(() => import("./pages/admin/SetupAdmin"));
const AdminLogin = lazy(() => import("./pages/admin/AdminLogin"));
const AdminSupportHub = lazy(() => import("./pages/admin/AdminSupportHub"));
const AdminKYC = lazy(() => import("./pages/admin/AdminKYC"));
const AdminInvestments = lazy(() => import("./pages/admin/AdminInvestments"));
const AdminDeposits = lazy(() => import("./pages/admin/AdminDeposits"));
const AdminWallets = lazy(() => import("./pages/admin/AdminWallets"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 2,    // Data stays fresh for 2 minutes
      gcTime: 1000 * 60 * 10,      // Unused data garbage collected after 10 minutes
      retry: 1,                     // Only 1 retry on failure
      refetchOnWindowFocus: false,  // Prevent refetch storms when switching tabs
    },
  },
});

const AnimatedRoutes = () => {
  const location = useLocation();
  return (
    <Suspense fallback={
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-[#0A0A0A]">
        <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
      </div>
    }>
      <>
        <Routes location={location} key={location.pathname}>
          {/* Landing */}
          <Route path="/" element={<Index />} />

          {/* Auth */}
          <Route path="/auth/login" element={<Login />} />
          <Route path="/auth/register" element={<Register />} />
          <Route path="/auth/forgot-password" element={<ForgotPassword />} />

          {/* Public Informational Pages */}
          <Route path="/trading" element={<Trading />} />

          <Route path="/wallet" element={<WalletPublic />} />
          <Route path="/analytics" element={<AnalyticsPublic />} />
          <Route path="/crypto" element={<Crypto />} />
          <Route path="/forex" element={<Forex />} />
          <Route path="/commodities" element={<Commodities />} />
          <Route path="/market-data" element={<MarketData />} />
          <Route path="/about-us" element={<AboutUs />} />
          <Route path="/careers" element={<Careers />} />
          <Route path="/security" element={<Security />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/terms-of-service" element={<TermsOfService />} />
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          <Route path="/cookie-policy" element={<CookiePolicy />} />
          <Route path="/risk-disclosure" element={<RiskDisclosure />} />
          <Route path="/faq" element={<FAQ />} />
          <Route path="/help" element={<Help />} />
          <Route path="/support" element={<Help />} />

          {/* User Dashboard */}
          <Route path="/dashboard" element={<ProtectedRoute><Overview /></ProtectedRoute>} />
          <Route path="/dashboard/wallet" element={<ProtectedRoute><WalletPage /></ProtectedRoute>} />
          <Route path="/dashboard/trading" element={<ProtectedRoute><TradingPage /></ProtectedRoute>} />

          <Route path="/dashboard/analysis" element={<ProtectedRoute><AnalysisPage /></ProtectedRoute>} />
          <Route path="/dashboard/referrals" element={<ProtectedRoute><ReferralPage /></ProtectedRoute>} />
          <Route path="/dashboard/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
          <Route path="/dashboard/kyc" element={<ProtectedRoute><KYCPage /></ProtectedRoute>} />
          <Route path="/dashboard/subscription" element={<ProtectedRoute><SubscriptionPage /></ProtectedRoute>} />
          <Route path="/dashboard/investments" element={<ProtectedRoute><InvestmentsPage /></ProtectedRoute>} />
          <Route path="/dashboard/help" element={<ProtectedRoute><HelpCenter /></ProtectedRoute>} />
          <Route path="/dashboard/status" element={<ProtectedRoute><StatusPage /></ProtectedRoute>} />

          {/* Admin */}
          <Route path="/setup-admin" element={<SetupAdmin />} />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin" element={<ProtectedRoute adminOnly><AdminOverview /></ProtectedRoute>} />
          <Route path="/admin/users" element={<ProtectedRoute adminOnly><UserManagement /></ProtectedRoute>} />
          <Route path="/admin/finances" element={<ProtectedRoute adminOnly><FinancialManagement /></ProtectedRoute>} />
          <Route path="/admin/trading" element={<ProtectedRoute adminOnly><AdminTradingControl /></ProtectedRoute>} />

          <Route path="/admin/referrals" element={<ProtectedRoute adminOnly><ReferralManagement /></ProtectedRoute>} />
          <Route path="/admin/content" element={<ProtectedRoute adminOnly><ContentManagement /></ProtectedRoute>} />
          <Route path="/admin/settings" element={<ProtectedRoute adminOnly><AdminSettings /></ProtectedRoute>} />
          <Route path="/admin/wallets" element={<ProtectedRoute adminOnly><AdminWallets /></ProtectedRoute>} />
          <Route path="/admin/crypto-providers" element={<ProtectedRoute adminOnly><CryptoProviderManagement /></ProtectedRoute>} />
          <Route path="/admin/support" element={<ProtectedRoute adminOnly><AdminSupportHub /></ProtectedRoute>} />
          <Route path="/admin/kyc" element={<ProtectedRoute adminOnly><AdminKYC /></ProtectedRoute>} />
          <Route path="/admin/investments" element={<ProtectedRoute adminOnly><AdminInvestments /></ProtectedRoute>} />
          <Route path="/admin/deposits" element={<ProtectedRoute adminOnly><AdminDeposits /></ProtectedRoute>} />

          {/* Catch-all */}
          <Route path="*" element={<NotFound />} />
        </Routes>
        <LiveChatWidget />
      </>
    </Suspense>
  );
};

const AuthListener = () => {
  const setUser = useStore(s => s.setUser);
  const fetchAppData = useStore(s => s.fetchAppData);
  const isMounted = useRef(true);
  const currentSub = useRef<any>(null);
  const syncInProgress = useRef(false);

  useEffect(() => {
    isMounted.current = true;

    const syncData = async (userId: string, isInitial = false) => {
      if (!isMounted.current) return;
      // Prevent concurrent syncs from stomping on each other
      if (syncInProgress.current && !isInitial) return;
      syncInProgress.current = true;
      try {
        await fetchAppData(userId);
      } finally {
        syncInProgress.current = false;
      }
    };

    const setupSubscriptions = (userId: string, role: string) => {
      if (currentSub.current) supabase.removeChannel(currentSub.current);
      const isAdmin = role === 'admin';

      console.log(`[Sync] Establishing ${isAdmin ? 'Admin' : 'User'} real-time channel for: ${userId}`);

      currentSub.current = supabase
        .channel(`platform-sync-${userId}`)
        // Users get filtered updates, Admins get global updates for critical tables
        .on('postgres_changes', { event: '*', schema: 'public', table: 'balances', filter: isAdmin ? undefined : `user_id=eq.${userId}` }, () => debouncedSync(userId))
        .on('postgres_changes', { event: '*', schema: 'public', table: 'trades', filter: isAdmin ? undefined : `user_id=eq.${userId}` }, (payload) => useStore.getState().handleRealtimeEvent('trades', payload))
        .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles', filter: isAdmin ? undefined : `id=eq.${userId}` }, () => debouncedSync(userId))
        .on('postgres_changes', { event: '*', schema: 'public', table: 'transactions', filter: isAdmin ? undefined : `user_id=eq.${userId}` }, (payload) => useStore.getState().handleRealtimeEvent('transactions', payload))
        .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications' }, (payload) => useStore.getState().handleRealtimeEvent('notifications', payload))
        .on('postgres_changes', { event: '*', schema: 'public', table: 'referrals', filter: isAdmin ? undefined : `referrer_id=eq.${userId}` }, (payload) => useStore.getState().handleRealtimeEvent('referrals', payload))
        .on('postgres_changes', { event: '*', schema: 'public', table: 'crypto_deposits', filter: isAdmin ? undefined : `user_id=eq.${userId}` }, (payload) => useStore.getState().handleRealtimeEvent('crypto_deposits', payload))
        .subscribe();
    };

    const initAuth = async () => {
      console.log("[Auth] Initializing authentication...");
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user && isMounted.current) {
          console.log(`[Auth] Active session found: ${session.user.id}`);
          useStore.setState({ hasActiveSession: true });

          await syncData(session.user.id, true);

          // After initial sync, we have the user role in the store
          const role = useStore.getState().user?.role || 'user';
          setupSubscriptions(session.user.id, role);
          useStore.getState().startPolling(session.user.id);
        } else if (isMounted.current) {
          console.log("[Auth] No active session found.");
          useStore.setState({ hasActiveSession: false, isLoading: false, user: null });
        }
      } catch (err) {
        console.error("[Auth] Initialization failed:", err);
        useStore.setState({ hasActiveSession: false, isLoading: false });
      } finally {
        if (isMounted.current) {
          useStore.setState({ isAuthInitialized: true });
        }
      }
    };

    // Window Focus / Visibility Sync
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        const state = useStore.getState();
        if (state.user?.id) {
          console.log("[Sync] App became visible, refreshing data...");
          state.fetchAppData(state.user.id, false);
        }
      }
    };

    window.addEventListener('focus', handleVisibilityChange);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    initAuth();

    const { data: { subscription: authSub } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log(`[Auth] Event: ${event}`);

      if (event === 'SIGNED_OUT' || !session) {
        useStore.getState().reset();
        useStore.getState().stopPolling();
        if (currentSub.current) {
          supabase.removeChannel(currentSub.current);
          currentSub.current = null;
        }
      } else if (session?.user && isMounted.current) {
        useStore.setState({ hasActiveSession: true });

        // Trigger sync if we don't have a user or if it's a critical auth event
        const state = useStore.getState();
        if (!state.user || event === 'SIGNED_IN') {
          await syncData(session.user.id, true);
          const role = useStore.getState().user?.role || 'user';
          setupSubscriptions(session.user.id, role);
          useStore.getState().startPolling(session.user.id);
        }
      }
    });

    return () => {
      isMounted.current = false;
      authSub.unsubscribe();
      window.removeEventListener('focus', handleVisibilityChange);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      useStore.getState().stopPolling();
      if (currentSub.current) {
        try {
          supabase.removeChannel(currentSub.current);
          currentSub.current = null;
        } catch (e) { }
      }
    };
  }, []); // Effect only runs once on mount

  return null;
};

const App = () => {
  useCurrencyDetection();
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="dark">
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <AuthListener />
          <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            <AnimatedRoutes />
          </BrowserRouter>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default App;
