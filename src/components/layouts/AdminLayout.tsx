import { useState, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, Users, Wallet, LineChart, Copy, FileText,
  Settings, LogOut, TrendingUp, Menu, X, Bell, ChevronDown, Shield,
  Activity, Zap, ShieldCheck, Database, Globe, Lock, Radio, Gift
} from "lucide-react";
import PageTransition from "@/components/PageTransition";
import { motion, AnimatePresence } from "framer-motion";
import { useStore } from "@/store/useStore";
import { useTheme } from "@/components/ThemeProvider";
import { useEffect } from "react";
import { supabase } from "@/lib/supabase";
import LanguageSwitcher from "@/components/ui/LanguageSwitcher";

const navItems = [
  { icon: LayoutDashboard, label: "Overview", path: "/admin", description: "Dashboard" },
  { icon: Users, label: "Users", path: "/admin/users", description: "Manage Accounts" },
  { icon: Wallet, label: "Finances", path: "/admin/finances", description: "Money & Balance" },
  { icon: LineChart, label: "Trading", path: "/admin/trading", description: "Market Control" },
  { icon: Copy, label: "Copy Trading", path: "/admin/copy-trading", description: "Top Traders" },
  { icon: Gift, label: "Referrals", path: "/admin/referrals", description: "User Program" },
  { icon: FileText, label: "Content", path: "/admin/content", description: "Blog & Pages" },
  { icon: Settings, label: "Settings", path: "/admin/settings", description: "System Config" },
];

const AdminLayout = ({ children }: { children: React.ReactNode }) => {
  const { user, logout } = useStore();
  const notificationsOrEmpty = useStore(state => state.notifications) || [];
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const [prevUnreadCount, setPrevUnreadCount] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const systemNotifications = notificationsOrEmpty.filter((n: any) => !n.user_id && (n.type === 'SYSTEM' || n.type === 'WITHDRAWAL'));
  const unreadSystemNotifs = systemNotifications.filter((n: any) => !n.is_read);

  useEffect(() => {
    if (unreadSystemNotifs.length > prevUnreadCount) {
        if (audioRef.current) {
            audioRef.current.play().catch(e => console.log("Audio play failed:", e));
        }
    }
    if (unreadSystemNotifs.length !== prevUnreadCount) {
        setPrevUnreadCount(unreadSystemNotifs.length);
    }
  }, [unreadSystemNotifs.length, prevUnreadCount]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) navigate("/login");
    });

    document.documentElement.classList.add("dashboard-scale");
    return () => {
      document.documentElement.classList.remove("dashboard-scale");
    };
  }, [navigate]);


  const handleLogout = async () => {
    await supabase.auth.signOut();
    logout();
    navigate("/login");
  };

  const SidebarContent = ({ onNavigate }: { onNavigate?: () => void }) => (
    <div className="flex flex-col h-full bg-sidebar border-r border-sidebar-border relative overflow-hidden">
      <div className="p-8 pb-10 flex flex-col items-center gap-5 relative z-10 border-b border-sidebar-border bg-sidebar-accent/30">
        <Link to="/admin" className="flex flex-col items-center gap-3 group" onClick={onNavigate}>
          <img src="/logo.png" alt="Clarity Trade Logo" className="w-14 h-14 object-contain drop-shadow-gold transition-all duration-500 group-hover:scale-110 group-hover:-rotate-3" />
          <div className="flex flex-col items-center">
            <span className="text-xl font-bold tracking-tight text-sidebar-foreground leading-none">Admin <span className="text-gradient-gold">Dashboard</span></span>
            <span className="text-[9px] font-medium text-sidebar-foreground/30 tracking-[0.2em] uppercase mt-1.5">Clarity Trade</span>
          </div>
        </Link>
      </div>

      <div className="flex-1 px-5 py-8 space-y-2 overflow-y-auto relative z-10">
        <div className="px-4 mb-5">
           <span className="text-[10px] font-semibold text-sidebar-foreground/20 uppercase tracking-[0.2em]">Menu</span>
        </div>
        
        {navItems.map((item) => {
          const active = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={onNavigate}
              className={`group flex items-center gap-4 px-5 py-3.5 rounded-xl transition-all duration-300 relative ${
                active
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
                   layoutId="active-admin-nav"
                   className="absolute right-4 w-1.5 h-1.5 bg-primary rounded-full"
                />
              )}
            </Link>
          );
        })}

        <div className="pt-8 px-4 mb-5">
           <span className="text-[10px] font-semibold text-sidebar-foreground/50 uppercase tracking-[0.2em]">Quick Links</span>
        </div>
        
        <Link to="/dashboard" onClick={onNavigate} className="w-full group flex items-center gap-4 px-5 py-3.5 rounded-xl text-sm font-medium text-sidebar-foreground/50 hover:text-sidebar-foreground hover:bg-sidebar-accent transition-all">
           <div className="w-8 h-8 rounded-lg bg-sidebar-accent flex items-center justify-center group-hover:bg-primary/20 transition-colors">
              <TrendingUp className="w-4 h-4" />
           </div>
           <span>User Dashboard</span>
        </Link>
        <Link to="/" onClick={onNavigate} className="w-full group flex items-center gap-4 px-5 py-3.5 rounded-xl text-sm font-medium text-sidebar-foreground/50 hover:text-sidebar-foreground hover:bg-sidebar-accent transition-all">
           <div className="w-8 h-8 rounded-lg bg-sidebar-accent flex items-center justify-center group-hover:bg-red-500/20 transition-colors">
              <LogOut className="w-4 h-4" />
           </div>
           <span>Back to Site</span>
        </Link>
      </div>

      <div className="p-6 mt-auto border-t border-sidebar-border relative z-10">
        <div className="p-4 rounded-xl bg-primary/5 border border-primary/10 flex items-center gap-3">
            <Database className="w-4 h-4 text-primary shrink-0" />
            <span className="text-[10px] font-medium text-sidebar-foreground/60">System Healthy · v4.8.2</span>
        </div>
      </div>
    </div>

  );

  return (
    <div className="min-h-screen flex bg-background text-foreground">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:block w-64 h-screen sticky top-0 z-40">
        <SidebarContent />
      </aside>

      {/* Mobile overlay */}
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
                 className="absolute top-8 right-6 w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center hover:bg-white/20 transition-all"
              >
                <X className="w-4 h-4 text-white" />
              </button>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-30 h-16 border-b border-border bg-background/80 backdrop-blur-xl px-4 lg:px-8 flex items-center justify-between">
          <div className="flex items-center gap-6 flex-1">
            <button className="lg:hidden w-10 h-10 rounded-lg bg-secondary flex items-center justify-center hover:bg-secondary/80 transition-all" onClick={() => setSidebarOpen(true)}>
              <Menu className="w-5 h-5 text-foreground" />
            </button>
            
            <div className="hidden sm:flex items-center gap-3 px-4 py-2 rounded-lg bg-green-500/10 border border-green-500/20">
               <Radio className="w-4 h-4 text-green-500 animate-pulse" />
               <span className="text-xs font-medium text-green-600">All Systems Operational</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden lg:flex items-center gap-6 pr-4 border-r border-border mr-2">
               <div className="text-right">
                  <div className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold mb-0.5">Server Load</div>
                  <div className="text-xs font-bold text-foreground">12.4% CPU</div>
               </div>
               <div className="text-right">
                  <div className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold mb-0.5">Requests</div>
                  <div className="text-xs font-bold text-primary">1,240/s</div>
               </div>
            </div>

            <LanguageSwitcher />
            
              <button 
                onClick={() => {
                  setNotificationsOpen(!notificationsOpen);
                  setProfileOpen(false);
                }}
                className={`w-10 h-10 rounded-lg border flex items-center justify-center relative transition-all group ${
                  notificationsOpen ? "bg-primary/20 border-primary shadow-glow" : "bg-secondary border-border hover:bg-secondary/80"
                }`}
              >
                <Bell className={`w-4.5 h-4.5 transition-colors ${notificationsOpen ? "text-primary" : "text-muted-foreground group-hover:text-foreground"}`} />
                {unreadSystemNotifs.length > 0 && (
                   <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-primary shadow-glow animate-pulse" />
                )}
                <audio ref={audioRef} src="https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3" preload="auto" />
              </button>

              <AnimatePresence>
                {notificationsOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setNotificationsOpen(false)} />
                    <motion.div 
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute right-0 mt-4 w-80 sm:w-96 z-50 bg-card border border-border shadow-huge rounded-2xl overflow-hidden"
                    >                       <div className="p-6 border-b border-border bg-secondary/30 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                           <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                              <Bell className="w-5 h-5 text-primary" />
                           </div>
                           <h3 className="text-lg font-bold text-foreground font-sans">System Alerts</h3>
                        </div>
                        {unreadSystemNotifs.length > 0 && (
                          <span className="text-[10px] font-bold text-primary uppercase tracking-widest bg-primary/10 px-2 py-0.5 rounded-full">
                            {unreadSystemNotifs.length} New
                          </span>
                        )}
                      </div>
                       <div className="max-h-[400px] overflow-y-auto">
                        {systemNotifications.length > 0 ? (
                          systemNotifications.map((n: any) => {
                            const isDeposit = n.title?.toLowerCase()?.includes('deposit');
                            const isWithdrawal = n.type === 'WITHDRAWAL' || n.title?.toLowerCase()?.includes('withdrawal');
                            const Icon = isDeposit ? Wallet : isWithdrawal ? AlertTriangle : ShieldCheck;
                            const colorClass = isDeposit ? 'text-green-500' : isWithdrawal ? 'text-red-500' : 'text-blue-500';
                            const bgClass = isDeposit ? 'bg-green-500/10' : isWithdrawal ? 'bg-red-500/10' : 'bg-blue-500/10';
                            
                            return (
                              <div 
                                key={n.id} 
                                onClick={() => {
                                  useStore.getState().markNotificationAsRead(n.id);
                                  if (isWithdrawal) navigate('/admin/finances');
                                }} 
                                className={`p-5 border-b border-border hover:bg-secondary/50 transition-colors cursor-pointer group ${!n.is_read ? 'bg-secondary/20' : ''}`}
                              >
                                <div className="flex gap-4">
                                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${!n.is_read ? bgClass : 'bg-secondary'} ${isWithdrawal && !n.is_read ? 'animate-pulse' : ''}`}>
                                    <Icon className={`w-5 h-5 ${!n.is_read ? colorClass : 'text-muted-foreground'}`} />
                                  </div>
                                  <div className="flex flex-col flex-1">
                                    <div className="flex items-center justify-between gap-2">
                                      <span className={`text-sm font-bold transition-colors ${!n.is_read ? 'text-foreground' : 'text-muted-foreground group-hover:text-foreground'}`}>
                                        {n.title || 'Notification'}
                                      </span>
                                      {isWithdrawal && !n.is_read && (
                                        <span className="text-[8px] font-black bg-red-500 text-white px-1.5 py-0.5 rounded uppercase tracking-tighter shadow-glow-loss">High Priority</span>
                                      )}
                                    </div>
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
                             <p className="text-sm font-bold">No Alerts</p>
                             <p className="text-xs mt-1 font-medium">System is running smoothly.</p>
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
                   <div className="text-sm font-bold text-foreground leading-none mb-1">{user?.name || "Administrator"}</div>
                   <div className="text-[10px] text-muted-foreground font-black uppercase tracking-widest flex items-center justify-end gap-1.5 opacity-60">
                      <ShieldCheck className="w-3 h-3 text-primary" /> Admin Support
                   </div>
                </div>
                <div className="relative w-10 h-10 rounded-xl bg-gradient-gold flex items-center justify-center text-sm font-black text-white shadow-sm transition-transform duration-500 group-hover:rotate-6 overflow-hidden border border-white/10">
                   {user?.avatar_url ? (
                     <img src={user.avatar_url} className="w-full h-full object-cover" />
                   ) : (
                     <Lock className="w-4 h-4" />
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
                      className="absolute right-0 mt-4 w-64 z-50 bg-card border border-border shadow-huge rounded-2xl overflow-hidden p-2"
                    >
                      <div className="p-4 border-b border-border bg-secondary/10 mb-2 rounded-xl">
                         <div className="text-xs font-bold text-foreground truncate">{user?.email || "admin@claritytrade.com"}</div>
                         <div className="text-[10px] text-muted-foreground mt-1 font-black uppercase tracking-widest opacity-60">System Administrator</div>
                      </div>
                      <Link to="/admin/settings" onClick={() => setProfileOpen(false)} className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all">
                        <Settings className="w-4 h-4" /> System Settings
                      </Link>
                      <Link to="/dashboard" onClick={() => setProfileOpen(false)} className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all">
                        <TrendingUp className="w-4 h-4" /> User Dashboard
                      </Link>
                      <div className="h-px bg-border my-2 mx-2" />
                      <button 
                        onClick={() => handleLogout()}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-red-500 hover:bg-red-500/10 transition-all text-left"
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

        <main className="flex-1 p-4 lg:p-8 relative overflow-x-hidden overflow-y-auto">
          <div className="relative z-10 max-w-[1440px] mx-auto w-full">
            <PageTransition>{children}</PageTransition>
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
