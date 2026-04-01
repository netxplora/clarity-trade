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

import Index from "./pages/Index";
import NotFound from "./pages/NotFound";

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

// Dashboard
import Overview from "./pages/dashboard/Overview";
import WalletPage from "./pages/dashboard/WalletPage";
import TradingPage from "./pages/dashboard/TradingPage";
import CopyTradingPage from "./pages/dashboard/CopyTradingPage";
import AnalyticsPage from "./pages/dashboard/AnalyticsPage";
import ReferralPage from "./pages/dashboard/ReferralPage";
import SettingsPage from "./pages/dashboard/SettingsPage";
import KYCPage from "./pages/dashboard/KYCPage";
import SubscriptionPage from "./pages/dashboard/SubscriptionPage";
import TraderProfilePage from "./pages/dashboard/TraderProfilePage";

// Admin
import AdminOverview from "./pages/admin/AdminOverview";
import UserManagement from "./pages/admin/UserManagement";
import FinancialManagement from "./pages/admin/FinancialManagement";
import AdminTradingControl from "./pages/admin/AdminTradingControl";
import AdminCopyTrading from "./pages/admin/AdminCopyTrading";
import ReferralManagement from "./pages/admin/ReferralManagement";
import ContentManagement from "./pages/admin/ContentManagement";
import AdminSettings from "./pages/admin/AdminSettings";
import AdminLogin from "./pages/admin/AdminLogin";
import SetupAdmin from "./pages/admin/SetupAdmin";

const queryClient = new QueryClient();

const AnimatedRoutes = () => {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
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
        <Route path="/dashboard" element={<Overview />} />
        <Route path="/dashboard/wallet" element={<WalletPage />} />
        <Route path="/dashboard/trading" element={<TradingPage />} />
        <Route path="/dashboard/copy-trading" element={<CopyTradingPage />} />
        <Route path="/dashboard/copy-trading/trader/:id" element={<TraderProfilePage />} />
        <Route path="/dashboard/analytics" element={<AnalyticsPage />} />
        <Route path="/dashboard/referrals" element={<ReferralPage />} />
        <Route path="/dashboard/settings" element={<SettingsPage />} />
        <Route path="/dashboard/kyc" element={<KYCPage />} />
        <Route path="/dashboard/subscription" element={<SubscriptionPage />} />

        {/* Admin */}
        <Route path="/setup-admin" element={<SetupAdmin />} />
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin" element={<AdminOverview />} />
        <Route path="/admin/users" element={<UserManagement />} />
        <Route path="/admin/finances" element={<FinancialManagement />} />
        <Route path="/admin/trading" element={<AdminTradingControl />} />
        <Route path="/admin/copy-trading" element={<AdminCopyTrading />} />
        <Route path="/admin/referrals" element={<ReferralManagement />} />
        <Route path="/admin/content" element={<ContentManagement />} />
        <Route path="/admin/settings" element={<AdminSettings />} />

        {/* Catch-all */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </AnimatePresence>
  );
};

const AuthListener = () => {
  const { setUser } = useStore();

  const isMounted = useRef(true);
  const isFetching = useRef(false);
  const currentSub = useRef<any>(null);

  useEffect(() => {
    isMounted.current = true;
    
    const fetchSession = async () => {
      if (isFetching.current) return;
      isFetching.current = true;
      
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user && isMounted.current) {
            const { data: profile } = await supabase.from('profiles').select('*, balances(*)').eq('id', session.user.id).single();
            if (profile && isMounted.current) {
                const b = Array.isArray(profile.balances) ? profile.balances[0] : profile.balances;
                const crypto = b?.crypto_balances || {};
                const cryptoPrices: Record<string, number> = { btc: 65000, eth: 3500, usdt: 1, sol: 145, usdc: 1, xrp: 0.62, bnb: 580, matic: 0.9, dot: 8.2 };
                const cryptoTotal = Object.entries(crypto).reduce((acc, [coin, amount]) => {
                  return acc + (Number(amount) * (cryptoPrices[coin.toLowerCase()] || 0));
                }, 0);

                const [{ data: sessions }, { data: trades }, { data: notifs }] = await Promise.all([
                    supabase.from('active_sessions').select('*').eq('user_id', profile.id),
                    supabase.from('trades').select('*').eq('user_id', profile.id).order('created_at', { ascending: false }),
                    supabase.from('notifications').select('*').or(profile.role === 'admin' ? `user_id.eq.${profile.id},user_id.is.null` : `user_id.eq.${profile.id},type.eq.GLOBAL`).order('created_at', { ascending: false }).limit(50)
                ]);

                if (!isMounted.current) return;

                const manualOpen = trades?.filter(t => t.status === 'Open') || [];
                const activePnL = sessions?.reduce((acc, s) => acc + (Number(s.pnl) || 0), 0) || 0;
                const manualPnL = manualOpen?.reduce((acc, t) => acc + (Number(t.pnl) || 0), 0) || 0;
                const closedTrades = trades?.filter(t => t.status === 'Closed') || [];
                const closedPnL = closedTrades.reduce((acc, t) => acc + (Number(t.pnl) || 0), 0);
                const winRateVal = closedTrades.length > 0 ? (closedTrades.filter(t => (Number(t.pnl) || 0) > 0).length / closedTrades.length * 100) : 0;

                const userData = {
                    id: profile.id,
                    name: profile.name,
                    email: profile.email,
                    phone: profile.phone || '',
                    role: profile.role,
                    status: profile.status,
                    kyc: profile.kyc,
                    frozen: profile.frozen,
                    joined: profile.created_at,
                    fiatBalanceNum: Number(b?.fiat_balance || 0),
                    tradingBalance: Number(b?.trading_balance || 0),
                    copyTradingBalance: Number(b?.copy_trading_balance || 0),
                    cryptoBalanceNum: cryptoTotal,
                    balances: crypto,
                    referralCode: profile.referral_code,
                    default_currency: profile.default_currency,
                    preferred_currency: profile.preferred_currency,
                    theme_preference: profile.theme_preference,
                    admin_theme_preference: profile.admin_theme_preference,
                    avatar_url: profile.avatar_url,
                    current_plan: profile.current_plan
                };

                setUser(userData as any);
                
                const { setBalanceStats, setTradeHistory, setActiveTrades, setNotifications } = useStore.getState();
                setTradeHistory(trades || []);
                setActiveTrades(manualOpen || []);
                setNotifications(notifs || []);
                
                setBalanceStats({
                    totalProfit: activePnL + manualPnL + closedPnL,
                    copySessions: sessions?.length || 0,
                    totalTrades: (trades?.length || 0) + (sessions?.length || 0),
                    winRate: Math.round(winRateVal),
                    maxDrawdown: closedTrades.length > 5 ? 4.2 : 0 
                });
            }
        } else if (isMounted.current) {
            setUser(null);
        }
      } catch (err) {
        console.error("Auth fetch error:", err);
      } finally {
        isFetching.current = false;
      }
    };

    const setupSubscriptions = async (userId: string) => {
      if (currentSub.current) {
        supabase.removeChannel(currentSub.current);
      }

      currentSub.current = supabase
        .channel(`user-${userId}-sync`)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'balances', filter: `user_id=eq.${userId}` }, () => fetchSession())
        .on('postgres_changes', { event: '*', schema: 'public', table: 'active_sessions', filter: `user_id=eq.${userId}` }, () => fetchSession())
        .on('postgres_changes', { event: '*', schema: 'public', table: 'trades', filter: `user_id=eq.${userId}` }, () => fetchSession())
        .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications' }, () => fetchSession())
        .subscribe();
    };

    const { data: { subscription: authSub } } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (event === 'SIGNED_OUT' || !session) {
            setUser(null);
            if (currentSub.current) supabase.removeChannel(currentSub.current);
            currentSub.current = null;
        } else if (session?.user) {
            await fetchSession();
            setupSubscriptions(session.user.id);
        }
    });

    return () => {
      isMounted.current = false;
      authSub.unsubscribe();
      if (currentSub.current) supabase.removeChannel(currentSub.current);
    };
  }, [setUser]);

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
