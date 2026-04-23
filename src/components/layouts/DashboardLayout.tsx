import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, Wallet, LineChart, Users, BarChart3, Settings,
  LogOut, TrendingUp, Menu, X, Bell, ChevronDown, ShieldCheck, Zap,
  Search, MessageSquare, Globe, Activity, UserCheck, Gift, ShieldAlert, Clock
} from "lucide-react";
import PageTransition from "@/components/PageTransition";
import { useStore } from "@/store/useStore";
import { supabase } from "@/lib/supabase";
import { motion, AnimatePresence } from "framer-motion";
import { CurrencySelector } from "@/components/CurrencySelector";
import { useTheme } from "@/components/ThemeProvider";
import { ThemeToggle } from "@/components/ThemeToggle";
import LiveChatWidget from "@/components/dashboard/LiveChatWidget";

import { SoundToggle } from "@/components/SoundToggle";
import { playAppOpenSound } from "@/lib/sound";

const navItems = [
  { icon: LayoutDashboard, label: "Overview", path: "/dashboard", description: "Account Summary" },
  { icon: Wallet, label: "Wallet", path: "/dashboard/wallet", description: "Funds & Assets" },
  { icon: TrendingUp, label: "Investment", path: "/dashboard/investments", description: "Growth Plans" },

  { icon: BarChart3, label: "Trading", path: "/dashboard/trading", description: "Markets & Orders" },
  { icon: LineChart, label: "Analysis", path: "/dashboard/analysis", description: "Performance" },
  { icon: ShieldCheck, label: "Verification", path: "/dashboard/kyc", description: "Identity & KYC" },
  { icon: Gift, label: "Referrals", path: "/dashboard/referrals", description: "Earn Rewards" },
  { icon: Settings, label: "Settings", path: "/dashboard/settings", description: "Preferences" },
];

const DashboardLayout = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const user = useStore(state => state.user);
  const logout = useStore(state => state.logout);
  const notificationsOrEmpty = useStore(state => state.notifications) || [];

  const handleLogout = async () => {
    await supabase.auth.signOut();
    logout();
    navigate("/auth/login");
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) navigate("/auth/login");
    });

    playAppOpenSound();

    document.documentElement.classList.add("dashboard-scale");
    return () => {
      document.documentElement.classList.remove("dashboard-scale");
    };
  }, [navigate]);

  const SidebarContent = ({ onNavigate }: { onNavigate?: () => void }) => (
    <div className="flex flex-col h-full bg-sidebar border-r border-border relative overflow-hidden">
      <div className="p-8 pb-10 flex flex-col items-center gap-5 relative z-10 border-b border-sidebar-border bg-sidebar-accent/30">
        <Link to="/" className="flex flex-col items-center gap-3 group" onClick={onNavigate}>
          <img src="/logo.png" alt="Clarity Trade Logo" className="w-14 h-14 object-contain drop-shadow-gold transition-all duration-500 group-hover:scale-110 group-hover:rotate-3" />
          <div className="flex flex-col items-center">
            <span className="text-xl font-bold tracking-tight text-sidebar-foreground leading-none">Clarity <span className="text-gradient-gold">Trade</span></span>
            <span className="text-[9px] font-medium text-sidebar-foreground/30 tracking-[0.2em] uppercase mt-1.5">Trading Platform</span>
          </div>
        </Link>
      </div>

      <div className="flex-1 px-5 py-8 space-y-2 overflow-y-auto relative z-10">
        <div className="px-4 mb-5">
          <span className="text-[10px] font-semibold text-sidebar-foreground/20 uppercase tracking-[0.2em]">Navigation</span>
        </div>

        {navItems.map((item) => {
          const active = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={onNavigate}
              className={`group flex items-center gap-4 px-5 py-3.5 rounded-xl transition-all duration-300 relative ${active
                ? "bg-primary/15 text-primary"
                : "text-sidebar-foreground/50 hover:text-sidebar-foreground hover:bg-sidebar-accent"
                }`}
            >
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all duration-300 ${active ? "bg-gradient-gold shadow-gold text-white" : "bg-sidebar-accent"}`}>
                <item.icon className="w-4.5 h-4.5" />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-semibold">{item.label}</span>
                <span className={`text-[10px] font-medium mt-0.5 ${active ? "text-primary/60" : "text-sidebar-foreground/20"}`}>{item.description}</span>
              </div>
              {active && (
                <motion.div
                  layoutId="active-nav"
                  className="absolute right-4 w-1.5 h-1.5 bg-primary rounded-full"
                />
              )}
            </Link>
          );
        })}

        <div className="pt-8 px-4 mb-5">
          <span className="text-[10px] font-semibold text-muted-foreground/50 uppercase tracking-[0.2em]">Support</span>
        </div>

        <Link to="/dashboard/help" onClick={onNavigate} className="w-full group flex items-center gap-4 px-5 py-3.5 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-all text-left">
          <div className="w-8 h-8 rounded-lg bg-secondary/50 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
            <MessageSquare className="w-4 h-4" />
          </div>
          <span>Help Center</span>
        </Link>
        <Link to="/dashboard/status" onClick={onNavigate} className="w-full group flex items-center gap-4 px-5 py-3.5 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-all text-left">
          <div className="w-8 h-8 rounded-lg bg-secondary/50 flex items-center justify-center group-hover:bg-blue-500/20 transition-colors">
            <Globe className="w-4 h-4" />
          </div>
          <span>Status Page</span>
        </Link>
      </div>

      <div className="p-6 mt-auto border-t border-border relative z-10">


        <button
          onClick={() => { onNavigate?.(); handleLogout(); }}
          className="w-full group flex items-center justify-center gap-2 px-5 py-4 rounded-xl text-xs font-bold uppercase tracking-widest text-muted-foreground hover:text-red-600 hover:bg-red-500/5 hover:border-red-500/20 transition-all border border-border"
        >
          <LogOut className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          Sign Out
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex bg-background text-foreground">
      <aside className="hidden lg:block w-64 h-screen sticky top-0 border-r border-border bg-card overflow-hidden">
        <SidebarContent />
      </aside>

      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="lg:hidden fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
              onClick={() => setSidebarOpen(false)}
            />
            <motion.aside
              initial={{ x: -256 }}
              animate={{ x: 0 }}
              exit={{ x: -256 }}
              transition={{ type: "spring", damping: 30, stiffness: 200 }}
              className="lg:hidden fixed inset-y-0 left-0 w-64 z-50 overflow-hidden shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <SidebarContent onNavigate={() => setSidebarOpen(false)} />
              <button
                onClick={() => setSidebarOpen(false)}
                className="absolute top-8 right-6 w-9 h-9 rounded-lg bg-background/20 flex items-center justify-center hover:bg-background/40 transition-all border border-border"
              >
                <X className="w-4 h-4 text-foreground" />
              </button>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-30 h-16 border-b border-border bg-background/80 backdrop-blur-xl px-4 lg:px-8 flex items-center justify-between">
          <div className="flex items-center gap-6 flex-1">
            <button className="lg:hidden w-10 h-10 rounded-lg bg-secondary flex items-center justify-center hover:bg-secondary/80 transition-all" onClick={() => setSidebarOpen(true)}>
              <Menu className="w-5 h-5 text-foreground" />
            </button>

            <div className="hidden md:flex items-center gap-3 px-5 py-3 rounded-xl bg-secondary border border-border w-[300px] lg:w-[400px] relative group focus-within:border-primary/50 transition-all">
              <Search className="w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
              <input
                placeholder="Search assets..."
                className="bg-transparent border-none outline-none text-sm w-full placeholder:text-muted-foreground/50"
              />
              <kbd className="text-[10px] font-medium text-muted-foreground bg-background px-2 py-0.5 rounded border border-border hidden lg:block">⌘K</kbd>
            </div>
          </div>

          <div className="flex items-center gap-3 lg:gap-4">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-green-500/10 border border-green-500/20">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              <span className="text-[10px] lg:text-xs font-semibold text-green-600">Markets Open</span>
            </div>

            <SoundToggle />
            <ThemeToggle />
            <CurrencySelector />

            <div className="relative">
              <button
                onClick={() => {
                  setNotificationsOpen(!notificationsOpen);
                  setProfileOpen(false);
                }}
                className={`w-10 h-10 rounded-lg border flex items-center justify-center relative transition-all group ${notificationsOpen ? "bg-primary/20 border-primary shadow-glow" : "bg-secondary border-border hover:bg-secondary/80"
                  }`}
              >
                <Bell className={`w-4.5 h-4.5 transition-colors ${notificationsOpen ? "text-primary" : "text-muted-foreground group-hover:text-foreground"}`} />
                {notificationsOrEmpty.some(n => !n.is_read) && (
                   <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-primary shadow-glow animate-pulse" />
                )}
              </button>

              <AnimatePresence>
                {notificationsOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setNotificationsOpen(false)} />
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute right-0 mt-4 w-[calc(100vw-2rem)] sm:w-96 max-w-[24rem] z-50 bg-card border border-border shadow-huge rounded-2xl overflow-hidden"
                    >
                      <div className="p-6 border-b border-border bg-secondary/30 flex items-center justify-between">
                        <h3 className="text-lg font-bold text-foreground font-sans">Notifications</h3>
                        <div className="flex items-center gap-2">
                          {notificationsOrEmpty.filter((n: any) => !n.is_read).length > 0 && (
                            <span className="text-[10px] font-bold text-primary uppercase tracking-widest bg-primary/10 px-2 py-0.5 rounded-full">
                              {notificationsOrEmpty.filter((n: any) => !n.is_read).length} New
                            </span>
                          )}
                          <button 
                            onClick={() => setNotificationsOpen(false)}
                            className="p-2 rounded-lg hover:bg-foreground/10 transition-colors text-muted-foreground hover:text-foreground"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      <div className="max-h-[400px] overflow-y-auto">
                        {notificationsOrEmpty.length > 0 ? (
                          notificationsOrEmpty.map((n: any) => {
                            const Icon = n.type === 'SYSTEM' ? ShieldAlert : n.type === 'DEPOSIT' || n.type === 'WITHDRAWAL' ? Wallet : n.type === 'TRADING' ? TrendingUp : MessageSquare;
                            const colorClass = n.type === 'DEPOSIT' ? 'text-green-500' : n.type === 'WITHDRAWAL' ? 'text-amber-500' : n.type === 'SYSTEM' ? 'text-red-500' : 'text-blue-500';
                            const bgClass = n.type === 'DEPOSIT' ? 'bg-green-500/10' : n.type === 'WITHDRAWAL' ? 'bg-amber-500/10' : n.type === 'SYSTEM' ? 'bg-red-500/10' : 'bg-blue-500/10';
                            
                            return (
                              <div key={n.id} onClick={() => useStore.getState().markNotificationAsRead(n.id)} className={`relative p-5 border-b border-border hover:bg-secondary/50 transition-colors cursor-pointer group ${!n.is_read ? 'bg-secondary/20' : ''}`}>
                                <button onClick={(e) => { e.stopPropagation(); useStore.getState().dismissNotification(n.id, n.user_id === null || n.type === 'GLOBAL'); }} className="absolute top-3 right-3 p-1.5 rounded-md opacity-0 group-hover:opacity-100 hover:bg-foreground/10 transition-all text-muted-foreground hover:text-foreground">
                                  <X className="w-3.5 h-3.5" />
                                </button>
                                <div className="flex gap-4">
                                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${!n.is_read ? bgClass : 'bg-secondary'}`}>
                                    <Icon className={`w-5 h-5 ${!n.is_read ? colorClass : 'text-muted-foreground'}`} />
                                  </div>
                                  <div className="flex flex-col pr-6">
                                    <span className={`text-sm font-bold transition-colors ${!n.is_read ? 'text-foreground' : 'text-muted-foreground group-hover:text-foreground'}`}>{n.title || 'Notification'}</span>
                                    <span className="text-xs text-muted-foreground mt-1 line-clamp-2">{n.message || ''}</span>
                                    <span className="text-[10px] font-medium text-muted-foreground/40 mt-2 uppercase tracking-widest">{n.created_at ? new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}</span>
                                  </div>
                                </div>
                              </div>
                            );
                          })
                        ) : (
                          <div className="p-8 text-center text-muted-foreground">
                             <Bell className="w-8 h-8 opacity-20 mx-auto mb-3" />
                             <p className="text-sm font-bold">No notifications</p>
                             <p className="text-xs mt-1">You're all caught up!</p>
                          </div>
                        )}
                      </div>
                      <div className="p-4 bg-secondary/30 text-center border-t border-border">
                        <button onClick={() => useStore.getState().markNotificationAsRead('all')} className="text-xs font-bold text-primary uppercase tracking-[0.2em] hover:opacity-80 transition-opacity">Mark All as Read</button>
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

            <div className="h-8 w-px bg-border mx-1" />

            <div className="relative">
              <div
                className={`flex items-center gap-3 pl-1 group cursor-pointer transition-all ${profileOpen ? "opacity-70" : "hover:opacity-80"}`}
                onClick={() => {
                  setProfileOpen(!profileOpen);
                  setNotificationsOpen(false);
                }}
              >
                <div className="text-right hidden sm:block">
                  <div className="text-sm font-semibold text-foreground leading-none mb-0.5">{user?.name || "Trader"}</div>
                </div>
                <div className="relative w-10 h-10 rounded-xl bg-gradient-gold flex items-center justify-center text-sm font-bold text-white shadow-sm transition-transform duration-500 group-hover:rotate-6 overflow-hidden">
                  {user?.avatar_url ? (
                    <img src={user.avatar_url} className="w-full h-full object-cover" />
                  ) : (
                    user?.name?.substring(0, 1) || "T"
                  )}
                </div>
                <ChevronDown className={`w-3.5 h-3.5 text-muted-foreground transition-transform duration-300 ${profileOpen ? "rotate-180" : ""}`} />
              </div>

              <AnimatePresence>
                {profileOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setProfileOpen(false)} />
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute right-0 mt-4 w-[calc(100vw-2rem)] sm:w-64 max-w-[16rem] z-50 bg-card border border-border shadow-huge rounded-2xl overflow-hidden p-2"
                    >
                      <div className="p-4 border-b border-border bg-secondary/10 mb-2 rounded-xl">
                        <div className="text-xs font-bold text-foreground truncate">{user?.email || "trader@example.com"}</div>
                        <div className="text-[10px] text-muted-foreground mt-1 uppercase tracking-widest font-bold">Standard Account</div>
                      </div>
                      <Link to="/dashboard/settings" onClick={() => setProfileOpen(false)} className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all">
                        <Settings className="w-4 h-4" /> Account Settings
                      </Link>
                      <Link to="/dashboard/wallet" onClick={() => setProfileOpen(false)} className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all">
                        <Wallet className="w-4 h-4" /> Deposit Funds
                      </Link>
                      <div className="h-px bg-border my-2 mx-2" />
                      <button
                        onClick={() => { setProfileOpen(false); handleLogout(); }}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-red-500 hover:bg-red-500/10 transition-all"
                      >
                        <LogOut className="w-4 h-4" /> Sign Out
                      </button>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 lg:p-8 relative overflow-x-hidden">
          <div className="relative z-10 max-w-[1440px] mx-auto w-full">
            <PageTransition>{children}</PageTransition>
          </div>
       </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
