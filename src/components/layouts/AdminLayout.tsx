import { useState, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, Users, Wallet, LineChart, Copy, FileText,
  Settings, LogOut, TrendingUp, Menu, X, Bell, ChevronDown, Shield,
  Activity, Zap, ShieldCheck, Database, Globe, Lock, Radio, Gift, AlertTriangle,
  CreditCard, MessageSquare, ShieldAlert, Download
} from "lucide-react";
import { toast } from "sonner";
import PageTransition from "@/components/PageTransition";
import { motion, AnimatePresence } from "framer-motion";
import { useStore } from "@/store/useStore";
import { useTheme } from "@/components/ThemeProvider";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { SoundToggle } from "@/components/SoundToggle";
import { playAppOpenSound } from "@/lib/sound";

const navItems = [
  { icon: LayoutDashboard, label: "Overview", path: "/admin", description: "Dashboard" },
  { icon: Users, label: "Users", path: "/admin/users", description: "Manage Accounts" },
  { icon: ShieldCheck, label: "KYC Management", path: "/admin/kyc", description: "Verify Identities" },
  { icon: Wallet, label: "Finances", path: "/admin/finances", description: "Money & Balance" },
  { icon: Download, label: "Deposits", path: "/admin/deposits", description: "Verify Crypto" },
  { icon: Shield, label: "Deposit Wallets", path: "/admin/wallets", description: "Manage Destinations" },
  { icon: LineChart, label: "Trading", path: "/admin/trading", description: "Market Control" },

  { icon: Gift, label: "Referrals", path: "/admin/referrals", description: "User Program" },
  { icon: FileText, label: "Content", path: "/admin/content", description: "Blog & Pages" },
  { icon: MessageSquare, label: "Support Hub", path: "/admin/support", description: "Live Chat" },
  { icon: LineChart, label: "Investments", path: "/admin/investments", description: "Plans & Portfolios" },
  { icon: CreditCard, label: "Crypto Providers", path: "/admin/crypto-providers", description: "Purchase Gateways" },
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

  const unreadCount = notificationsOrEmpty.filter((n: any) => !n.is_read).length;

  useEffect(() => {
    if (unreadCount > prevUnreadCount) {
        if (audioRef.current) {
            audioRef.current.play().catch(e => console.log("Audio play failed:", e));
        }
    }
    if (unreadCount !== prevUnreadCount) {
        setPrevUnreadCount(unreadCount);
    }
  }, [unreadCount, prevUnreadCount]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/auth/login");
        return;
      }
      
      // Check for admin role
      if (user && user.role !== 'admin') {
        toast.error("Access Denied", {
          description: "You do not have permission to access the administrative dashboard."
        });
        navigate("/dashboard");
      }
    });

    playAppOpenSound();

    document.documentElement.classList.add("dashboard-scale");
    return () => {
      document.documentElement.classList.remove("dashboard-scale");
    };
  }, [navigate, user]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    logout();
    navigate("/auth/login");
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
                 <item.icon className="w-5 h-5" />
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

            <SoundToggle />
            <ThemeToggle />
            
            <div className="relative">
              <button 
                onClick={() => {
                  setNotificationsOpen(!notificationsOpen);
                  setProfileOpen(false);
                }}
                className={`w-10 h-10 rounded-lg border flex items-center justify-center relative transition-all group ${
                  notificationsOpen ? "bg-primary/20 border-primary shadow-glow" : "bg-secondary border-border hover:bg-secondary/80"
                }`}
              >
                <Bell className={`w-5 h-5 transition-colors ${notificationsOpen ? "text-primary" : "text-muted-foreground group-hover:text-foreground"}`} />
                {unreadCount > 0 && (
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
                      className="absolute right-0 mt-4 w-80 sm:w-[420px] z-50 bg-card border border-border shadow-huge rounded-[2rem] overflow-hidden"
                    >
                      <div className="p-7 border-b border-border bg-secondary/30 flex items-center justify-between">
                        <div>
                          <h3 className="text-lg font-black text-foreground tracking-tight">System Alerts</h3>
                          <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest opacity-40 mt-0.5">Real-time administration feed</p>
                        </div>
                        <div className="flex items-center gap-3">
                          {unreadCount > 0 && (
                            <span className="text-[9px] font-black text-primary uppercase tracking-widest bg-primary/10 px-2.5 py-1 rounded-full border border-primary/20">
                              {unreadCount} Unread
                            </span>
                          )}
                          <button 
                            onClick={() => setNotificationsOpen(false)}
                            className="w-8 h-8 rounded-xl bg-background border border-border flex items-center justify-center hover:bg-secondary transition-all"
                          >
                            <X className="w-4 h-4 text-muted-foreground" />
                          </button>
                        </div>
                      </div>

                      <div className="max-h-[480px] overflow-y-auto custom-scrollbar">
                        {notificationsOrEmpty.length > 0 ? (
                          <div className="divide-y divide-border/50">
                            {notificationsOrEmpty.map((n: any) => {
                              const isDeposit = n.type === 'DEPOSIT' || n.title?.toLowerCase()?.includes('deposit');
                              const isWithdrawal = n.type === 'WITHDRAWAL' || n.title?.toLowerCase()?.includes('withdrawal');
                              const Icon = isDeposit ? Wallet : isWithdrawal ? AlertTriangle : n.type === 'SYSTEM' ? ShieldAlert : MessageSquare;
                              const colorClass = isDeposit ? 'text-green-500' : isWithdrawal ? 'text-red-500' : 'text-blue-500';
                              const bgClass = isDeposit ? 'bg-green-500/10' : isWithdrawal ? 'bg-red-500/10' : 'bg-blue-500/10';
                              
                              return (
                                <div 
                                  key={n.id} 
                                  onClick={() => {
                                    useStore.getState().markNotificationAsRead(n.id);
                                    if (isWithdrawal) navigate('/admin/finances');
                                  }} 
                                  className={`relative p-6 hover:bg-secondary/50 transition-all cursor-pointer group ${!n.is_read ? 'bg-primary/[0.02]' : ''}`}
                                >
                                  {!n.is_read && (
                                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary" />
                                  )}

                                  <button 
                                    onClick={(e) => { 
                                      e.stopPropagation(); 
                                      useStore.getState().dismissNotification(n.id, n.user_id === null || n.type === 'GLOBAL'); 
                                    }} 
                                    className="absolute top-4 right-4 w-7 h-7 rounded-lg opacity-0 group-hover:opacity-100 bg-background border border-border flex items-center justify-center hover:bg-red-500/10 hover:text-red-500 transition-all text-muted-foreground"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                  </button>

                                  <div className="flex gap-5">
                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border border-border/50 ${!n.is_read ? bgClass : 'bg-secondary'} ${isWithdrawal && !n.is_read ? 'animate-pulse' : ''}`}>
                                      <Icon className={`w-5 h-5 ${!n.is_read ? colorClass : 'text-muted-foreground/40'}`} />
                                    </div>
                                    <div className="flex flex-col flex-1 pr-6">
                                      <div className="flex items-center gap-2 mb-1">
                                        <span className={`text-xs font-black uppercase tracking-wide transition-colors ${!n.is_read ? 'text-foreground' : 'text-muted-foreground group-hover:text-foreground'}`}>
                                          {n.title || 'Notification'}
                                        </span>
                                        {isWithdrawal && !n.is_read && (
                                          <span className="text-[7px] font-black bg-red-500 text-white px-1.5 py-0.5 rounded shadow-glow-loss uppercase tracking-tighter">Urgent</span>
                                        )}
                                      </div>
                                      <span className="text-[11px] font-medium text-muted-foreground leading-relaxed line-clamp-2">{n.message || ''}</span>
                                      <div className="flex items-center gap-3 mt-3">
                                        <span className="text-[9px] font-black text-muted-foreground/30 uppercase tracking-widest">{n.created_at ? new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}</span>
                                        <span className="w-1 h-1 rounded-full bg-border" />
                                        <span className="text-[9px] font-black text-primary/40 uppercase tracking-widest">{n.type || 'SYSTEM'}</span>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="py-20 text-center px-8">
                             <div className="w-16 h-16 rounded-[1.5rem] bg-secondary/30 flex items-center justify-center mx-auto mb-5 border border-border/50">
                                <Bell className="w-8 h-8 opacity-10 text-muted-foreground" />
                             </div>
                             <p className="text-sm font-black text-foreground uppercase tracking-tight">Zero Pending Alerts</p>
                             <p className="text-[10px] mt-1.5 font-bold text-muted-foreground uppercase tracking-widest opacity-40">System is performing optimally</p>
                          </div>
                        )}
                      </div>
                      
                      <div className="p-5 bg-secondary/30 text-center border-t border-border flex items-center justify-center">
                        <button 
                          onClick={() => useStore.getState().markNotificationAsRead('all')} 
                          className="text-[10px] font-black text-primary uppercase tracking-[0.2em] hover:tracking-[0.25em] transition-all"
                        >
                          Mark all as processed
                        </button>
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

        <main className="flex-1 p-4 lg:p-8 relative overflow-x-hidden">
          <div className="relative z-10 max-w-[1440px] mx-auto w-full">
            <PageTransition>{children}</PageTransition>
          </div>
       </main>
      </div>
    </div>
  );
};

export default AdminLayout;
