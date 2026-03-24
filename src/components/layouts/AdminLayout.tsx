import { useState } from "react";
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
import GoogleTranslate from "@/components/ui/GoogleTranslate";

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/admin", description: "Overview" },
  { icon: Users, label: "Users", path: "/admin/users", description: "Management" },
  { icon: Wallet, label: "Finances", path: "/admin/finances", description: "Treasury" },
  { icon: LineChart, label: "Trading", path: "/admin/trading", description: "Controls" },
  { icon: Copy, label: "Copy Trading", path: "/admin/copy-trading", description: "Pro Traders" },
  { icon: Gift, label: "Referrals", path: "/admin/referrals", description: "Network" },
  { icon: FileText, label: "Content", path: "/admin/content", description: "Publishing" },
  { icon: Settings, label: "Settings", path: "/admin/settings", description: "Configuration" },
];

const AdminLayout = ({ children }: { children: React.ReactNode }) => {
  const { user, logout } = useStore();
  const notificationsOrEmpty = useStore(state => state.notifications) || [];
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) navigate("/login");
    });
  }, [navigate]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    logout();
    navigate("/login");
  };

  const SidebarContent = ({ onNavigate }: { onNavigate?: () => void }) => (
    <div className="flex flex-col h-full bg-sidebar border-r border-border relative overflow-hidden">
      <div className="p-8 pb-10 flex flex-col items-center gap-5 relative z-10 border-b border-border bg-primary/[0.03]">
        <Link to="/admin" className="flex flex-col items-center gap-3 group" onClick={onNavigate}>
          <img src="/logo.png" alt="Clarity Trade Logo" className="w-14 h-14 object-contain drop-shadow-gold transition-all duration-500 group-hover:scale-110 group-hover:-rotate-3" />
          <div className="flex flex-col items-center">
            <span className="text-xl font-bold tracking-tight text-white leading-none">Admin <span className="text-gradient-gold">Panel</span></span>
            <span className="text-[9px] font-medium text-white/30 tracking-[0.2em] uppercase mt-1.5">Clarity Trade</span>
          </div>
        </Link>
      </div>

      <div className="flex-1 px-5 py-8 space-y-2 overflow-y-auto relative z-10">
        <div className="px-4 mb-5">
           <span className="text-[10px] font-semibold text-white/20 uppercase tracking-[0.2em]">Administration</span>
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
                  : "text-white/50 hover:text-white hover:bg-white/5"
              }`}
            >
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all duration-300 ${active ? "bg-gradient-gold shadow-gold text-white" : "bg-white/5"}`}>
                 <item.icon className="w-4.5 h-4.5" />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-semibold">{item.label}</span>
                <span className={`text-[10px] font-medium mt-0.5 ${active ? "text-primary/60" : "text-white/20"}`}>{item.description}</span>
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
           <span className="text-[10px] font-semibold text-muted-foreground/50 uppercase tracking-[0.2em]">Quick Links</span>
        </div>
        
        <Link to="/dashboard" onClick={onNavigate} className="w-full group flex items-center gap-4 px-5 py-3.5 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-all">
           <div className="w-8 h-8 rounded-lg bg-secondary/50 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
              <TrendingUp className="w-4 h-4" />
           </div>
           <span>User Dashboard</span>
        </Link>
        <Link to="/" onClick={onNavigate} className="w-full group flex items-center gap-4 px-5 py-3.5 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-all">
           <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center group-hover:bg-red-500/20 transition-colors">
              <LogOut className="w-4 h-4" />
           </div>
           <span>Back to Site</span>
        </Link>
      </div>

      <div className="p-6 mt-auto border-t border-border relative z-10">
        <div className="p-4 rounded-xl bg-primary/5 border border-primary/10 flex items-center gap-3">
            <Database className="w-4 h-4 text-primary shrink-0" />
            <span className="text-[10px] font-medium text-muted-foreground">System Healthy · v4.8.2</span>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex bg-background text-foreground">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:block w-72 h-screen sticky top-0 z-40">
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
               initial={{ x: -300 }}
               animate={{ x: 0 }}
               exit={{ x: -300 }}
               transition={{ type: "spring", damping: 30, stiffness: 200 }}
               className="lg:hidden fixed inset-y-0 left-0 w-72 z-50 overflow-hidden shadow-2xl" 
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
        <header className="sticky top-0 z-30 h-20 border-b border-border bg-background/80 backdrop-blur-xl px-8 flex items-center justify-between">
          <div className="flex items-center gap-6 flex-1">
            <button className="lg:hidden w-10 h-10 rounded-lg bg-secondary flex items-center justify-center hover:bg-secondary/80 transition-all" onClick={() => setSidebarOpen(true)}>
              <Menu className="w-5 h-5 text-foreground" />
            </button>
            
            <div className="flex items-center gap-3 px-4 py-2 rounded-lg bg-green-50 border border-green-200">
               <Radio className="w-4 h-4 text-green-600 animate-pulse" />
               <span className="text-xs font-medium text-green-700">All Systems Operational</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden lg:flex items-center gap-6 pr-4">
               <div className="text-right">
                  <div className="text-[10px] text-muted-foreground mb-0.5">Server Load</div>
                  <div className="text-xs font-semibold text-foreground">12.4% CPU</div>
               </div>
               <div className="bg-border w-px h-6" />
               <div className="text-right">
                  <div className="text-[10px] text-muted-foreground mb-0.5">Requests</div>
                  <div className="text-xs font-semibold text-primary">1,240/s</div>
               </div>
            </div>

            <GoogleTranslate />
            
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
                <Bell className={`w-4.5 h-4.5 transition-colors ${notificationsOpen ? "text-primary" : "text-muted-foreground group-hover:text-foreground"}`} />
                {notificationsOrEmpty.some((n: any) => (!n.user_id && n.type === 'SYSTEM') && !n.is_read) && (
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
                      className="absolute right-0 mt-4 w-96 z-50 bg-card border border-border shadow-huge rounded-2xl overflow-hidden"
                    >
                      <div className="p-6 border-b border-border bg-secondary/30 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                           <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                              <Bell className="w-5 h-5 text-primary" />
                           </div>
                           <h3 className="text-lg font-bold text-foreground">System Alerts</h3>
                        </div>
                        {notificationsOrEmpty.filter((n: any) => (!n.user_id && n.type === 'SYSTEM') && !n.is_read).length > 0 && (
                          <span className="text-[10px] font-bold text-primary uppercase tracking-widest bg-primary/10 px-2 py-0.5 rounded-full">
                            {notificationsOrEmpty.filter((n: any) => (!n.user_id && n.type === 'SYSTEM') && !n.is_read).length} New
                          </span>
                        )}
                      </div>
                      <div className="max-h-[400px] overflow-y-auto">
                        {notificationsOrEmpty.filter((n: any) => !n.user_id && n.type === 'SYSTEM').length > 0 ? (
                          notificationsOrEmpty.filter((n: any) => !n.user_id && n.type === 'SYSTEM').map((n: any) => {
                            const isDeposit = n.title?.toLowerCase()?.includes('deposit');
                            const isWithdrawal = n.title?.toLowerCase()?.includes('withdrawal');
                            const Icon = isDeposit ? Wallet : isWithdrawal ? Zap : ShieldCheck;
                            const colorClass = isDeposit ? 'text-green-500' : isWithdrawal ? 'text-amber-500' : 'text-blue-500';
                            const bgClass = isDeposit ? 'bg-green-50' : isWithdrawal ? 'bg-amber-50' : 'bg-blue-50';
                            return (
                              <div key={n.id} onClick={() => useStore.getState().markNotificationAsRead(n.id)} className={`p-5 border-b border-border hover:bg-secondary/50 transition-colors cursor-pointer group ${!n.is_read ? 'bg-secondary/20' : ''}`}>
                                <div className="flex gap-4">
                                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${!n.is_read ? bgClass : 'bg-secondary'}`}>
                                    <Icon className={`w-5 h-5 ${!n.is_read ? colorClass : 'text-muted-foreground'}`} />
                                  </div>
                                  <div className="flex flex-col">
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
                             <p className="text-sm font-bold">No Alerts</p>
                             <p className="text-xs mt-1">System is running smoothly.</p>
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
                   <div className="text-sm font-semibold text-foreground leading-none mb-0.5">{user?.name || "Administrator"}</div>
                   <div className="text-[10px] text-muted-foreground flex items-center justify-end gap-1">
                      <ShieldCheck className="w-3 h-3 text-primary" /> Admin Access
                   </div>
                </div>
                <div className="relative w-10 h-10 rounded-xl bg-gradient-gold flex items-center justify-center text-sm font-bold text-white shadow-sm transition-transform duration-500 group-hover:rotate-6 overflow-hidden">
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
                         <div className="text-xs font-bold text-foreground">admin@claritytrade.com</div>
                         <div className="text-[10px] text-muted-foreground mt-1">Super Admin Account</div>
                      </div>
                      <Link to="/admin/settings" onClick={() => setProfileOpen(false)} className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all">
                        <Settings className="w-4 h-4" /> Settings
                      </Link>
                      <Link to="/dashboard" onClick={() => setProfileOpen(false)} className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all">
                        <TrendingUp className="w-4 h-4" /> My Portfolio
                      </Link>
                      <div className="h-px bg-border my-2 mx-2" />
                      <button 
                        onClick={() => handleLogout()}
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

        <main className="flex-1 p-6 lg:p-10 relative overflow-x-hidden overflow-y-auto">
          <div className="relative z-10">
            <PageTransition>{children}</PageTransition>
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
