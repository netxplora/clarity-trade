import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, useLocation } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/ThemeProvider";
import { AnimatePresence } from "framer-motion";

import Index from "./pages/Index.tsx";
import NotFound from "./pages/NotFound.tsx";

// Auth
import Login from "./pages/auth/Login.tsx";
import Register from "./pages/auth/Register.tsx";
import ForgotPassword from "./pages/auth/ForgotPassword.tsx";

// Dashboard
import Overview from "./pages/dashboard/Overview.tsx";
import WalletPage from "./pages/dashboard/WalletPage.tsx";
import TradingPage from "./pages/dashboard/TradingPage.tsx";
import CopyTradingPage from "./pages/dashboard/CopyTradingPage.tsx";
import AnalyticsPage from "./pages/dashboard/AnalyticsPage.tsx";
import SettingsPage from "./pages/dashboard/SettingsPage.tsx";

// Admin
import AdminOverview from "./pages/admin/AdminOverview.tsx";
import UserManagement from "./pages/admin/UserManagement.tsx";
import FinancialManagement from "./pages/admin/FinancialManagement.tsx";
import AdminTradingControl from "./pages/admin/AdminTradingControl.tsx";
import AdminCopyTrading from "./pages/admin/AdminCopyTrading.tsx";
import ContentManagement from "./pages/admin/ContentManagement.tsx";
import AdminSettings from "./pages/admin/AdminSettings.tsx";

const queryClient = new QueryClient();

const AnimatedRoutes = () => {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        {/* Public */}
        <Route path="/" element={<Index />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />

        {/* User Dashboard */}
        <Route path="/dashboard" element={<Overview />} />
        <Route path="/dashboard/wallet" element={<WalletPage />} />
        <Route path="/dashboard/trading" element={<TradingPage />} />
        <Route path="/dashboard/copy-trading" element={<CopyTradingPage />} />
        <Route path="/dashboard/analytics" element={<AnalyticsPage />} />
        <Route path="/dashboard/settings" element={<SettingsPage />} />

        {/* Admin */}
        <Route path="/admin" element={<AdminOverview />} />
        <Route path="/admin/users" element={<UserManagement />} />
        <Route path="/admin/finances" element={<FinancialManagement />} />
        <Route path="/admin/trading" element={<AdminTradingControl />} />
        <Route path="/admin/copy-trading" element={<AdminCopyTrading />} />
        <Route path="/admin/content" element={<ContentManagement />} />
        <Route path="/admin/settings" element={<AdminSettings />} />

        {/* Catch-all */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </AnimatePresence>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AnimatedRoutes />
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
