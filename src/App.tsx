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
import { useStore } from "@/store/useStore";
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
import CopyTradingPublic from "./pages/public/CopyTrading";
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
const CopyTradingPage = lazy(() => import("./pages/dashboard/CopyTradingPage"));
const AnalysisPage = lazy(() => import("./pages/dashboard/AnalysisPage"));
const ReferralPage = lazy(() => import("./pages/dashboard/ReferralPage"));
const SettingsPage = lazy(() => import("./pages/dashboard/SettingsPage"));
const KYCPage = lazy(() => import("./pages/dashboard/KYCPage"));
const SubscriptionPage = lazy(() => import("./pages/dashboard/SubscriptionPage"));
const TraderProfilePage = lazy(() => import("./pages/dashboard/TraderProfilePage"));
const InvestmentsPage = lazy(() => import("./pages/dashboard/InvestmentsPage"));
const HelpCenter = lazy(() => import("./pages/dashboard/HelpCenter"));
const StatusPage = lazy(() => import("./pages/dashboard/StatusPage"));

// Admin
const AdminOverview = lazy(() => import("./pages/admin/AdminOverview"));
const UserManagement = lazy(() => import("./pages/admin/UserManagement"));
const FinancialManagement = lazy(() => import("./pages/admin/FinancialManagement"));
const AdminTradingControl = lazy(() => import("./pages/admin/AdminTradingControl"));
const AdminCopyTrading = lazy(() => import("./pages/admin/AdminCopyTrading"));
const ReferralManagement = lazy(() => import("./pages/admin/ReferralManagement"));
const ContentManagement = lazy(() => import("./pages/admin/ContentManagement"));
const AdminSettings = lazy(() => import("./pages/admin/AdminSettings"));
const CryptoProviderManagement = lazy(() => import("./pages/admin/CryptoProviderManagement"));
const SetupAdmin = lazy(() => import("./pages/admin/SetupAdmin"));
const AdminLogin = lazy(() => import("./pages/admin/AdminLogin"));
const AdminSupportHub = lazy(() => import("./pages/admin/AdminSupportHub"));
const AdminKYC = lazy(() => import("./pages/admin/AdminKYC"));
const AdminInvestments = lazy(() => import("./pages/admin/AdminInvestments"));

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
        <Route path="/copy-trading" element={<CopyTradingPublic />} />
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
        <Route path="/dashboard/copy-trading" element={<ProtectedRoute><CopyTradingPage /></ProtectedRoute>} />
        <Route path="/dashboard/copy-trading/trader/:id" element={<ProtectedRoute><TraderProfilePage /></ProtectedRoute>} />
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
        <Route path="/admin/copy-trading" element={<ProtectedRoute adminOnly><AdminCopyTrading /></ProtectedRoute>} />
        <Route path="/admin/referrals" element={<ProtectedRoute adminOnly><ReferralManagement /></ProtectedRoute>} />
        <Route path="/admin/content" element={<ProtectedRoute adminOnly><ContentManagement /></ProtectedRoute>} />
        <Route path="/admin/settings" element={<ProtectedRoute adminOnly><AdminSettings /></ProtectedRoute>} />
        <Route path="/admin/crypto-providers" element={<ProtectedRoute adminOnly><CryptoProviderManagement /></ProtectedRoute>} />
        <Route path="/admin/support" element={<ProtectedRoute adminOnly><AdminSupportHub /></ProtectedRoute>} />
        <Route path="/admin/kyc" element={<ProtectedRoute adminOnly><AdminKYC /></ProtectedRoute>} />
        <Route path="/admin/investments" element={<ProtectedRoute adminOnly><AdminInvestments /></ProtectedRoute>} />

        {/* Catch-all */}
        <Route path="*" element={<NotFound />} />
      </Routes>
      <LiveChatWidget />
      </>
    </Suspense>
  );
};

const AuthListener = () => {
    const { setUser, fetchAppData } = useStore();
    const isMounted = useRef(true);
    const currentSub = useRef<any>(null);
    const syncInProgress = useRef(false);
    const initialSyncDone = useRef(false);

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

        const setupSubscriptions = (userId: string) => {
            if (currentSub.current) supabase.removeChannel(currentSub.current);

            currentSub.current = supabase
                .channel(`user-${userId}-sync`)
                .on('postgres_changes', { event: '*', schema: 'public', table: 'balances', filter: `user_id=eq.${userId}` }, () => syncData(userId))
                .on('postgres_changes', { event: '*', schema: 'public', table: 'active_sessions', filter: `user_id=eq.${userId}` }, () => syncData(userId))
                .on('postgres_changes', { event: '*', schema: 'public', table: 'trades', filter: `user_id=eq.${userId}` }, () => syncData(userId))
                .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles', filter: `id=eq.${userId}` }, () => syncData(userId))
                .on('postgres_changes', { event: '*', schema: 'public', table: 'transactions', filter: `user_id=eq.${userId}` }, () => syncData(userId))
                .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications' }, () => syncData(userId))
                .on('postgres_changes', { event: '*', schema: 'public', table: 'referrals', filter: `referrer_id=eq.${userId}` }, () => syncData(userId))
                .subscribe();
        };

        const initAuth = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession();
                if (session?.user && isMounted.current) {
                    useStore.setState({ hasActiveSession: true });
                    // AWAIT syncData so user data is loaded BEFORE we mark initialization complete
                    await syncData(session.user.id, true);
                    initialSyncDone.current = true;
                    setupSubscriptions(session.user.id);
                } else if (isMounted.current) {
                    useStore.setState({ hasActiveSession: false, isLoading: false, user: null });
                }
            } catch (err) {
                console.error("Auth initialization failed:", err);
                useStore.setState({ hasActiveSession: false, isLoading: false });
            } finally {
                if (isMounted.current) {
                    useStore.setState({ isAuthInitialized: true });
                }
            }
        };

        initAuth();

        const { data: { subscription: authSub } } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (event === 'SIGNED_OUT' || !session) {
                useStore.getState().reset();
                initialSyncDone.current = false;
                
                if (currentSub.current) {
                    supabase.removeChannel(currentSub.current);
                    currentSub.current = null;
                }
            } else if (session?.user && isMounted.current) {
                useStore.setState({ hasActiveSession: true });
                // Skip if the initial sync already loaded this user's data
                if (!initialSyncDone.current) {
                    syncData(session.user.id, true);
                    setupSubscriptions(session.user.id);
                }
                // Mark initial sync as consumed so future auth events re-sync normally
                initialSyncDone.current = false;
            }
        });

        return () => {
            isMounted.current = false;
            authSub.unsubscribe();
            if (currentSub.current) {
                try { 
                    supabase.removeChannel(currentSub.current); 
                    currentSub.current = null;
                } catch(e) {}
            }
        };
    }, [setUser, fetchAppData]);

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
          <BrowserRouter>
            <AnimatedRoutes />
          </BrowserRouter>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default App;
