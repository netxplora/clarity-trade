import { motion, AnimatePresence } from "framer-motion";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { 
  Shield, 
  Bell, 
  User, 
  Lock, 
  Smartphone, 
  Globe, 
  Fingerprint,
  ShieldCheck,
  ShieldAlert,
  Clock,
  ChevronRight,
  Settings,
  CreditCard,
  Mail,
  History,
  Eye,
  EyeOff,
  Briefcase,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Upload,
  RefreshCw,
  Trash2, 
  UserCog, 
  UserCheck, 
  TrendingUp,
  X
} from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { useStore } from "@/store/useStore";
import { CurrencySelector } from "@/components/CurrencySelector";
import { useTheme } from "@/components/ThemeProvider";

const SettingsPage = () => {
  const navigate = useNavigate();
  const { user, setRoleTheme, fetchAppData } = useStore();
  const { setTheme } = useTheme();
  const [activeTab, setActiveTab] = useState("profile");
  const [showPassword, setShowPassword] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [activityData, setActivityData] = useState<{
    transactions: any[],
    copyTrades: any[],
    lastLogin: string,
    securityAlerts: any[]
  }>({
    transactions: [],
    copyTrades: [],
    lastLogin: new Date().toISOString(),
    securityAlerts: []
  });

  const fetchActivity = async () => {
    try {
        const { data: txs } = await supabase.from('transactions').select('*').eq('user_id', user?.id).order('created_at', { ascending: false });
        const { data: sessions } = await supabase.from('active_sessions').select('*').eq('user_id', user?.id);
        
        setActivityData({
            transactions: txs || [],
            copyTrades: sessions || [],
            lastLogin: new Date().toISOString(),
            securityAlerts: []
        });
    } catch (err) {
        console.error("Failed to fetch activity", err);
    }
  };

  useEffect(() => {
    import("@/lib/supabase").then(m => {
        // Just making sure supabase is imported
    });
  }, []);

  useEffect(() => {
    if (activeTab === "activity") {
        fetchActivity();
    }
  }, [activeTab]);

  const combinedLogs = [
    ...activityData.transactions.map(t => ({
        type: 'Transaction',
        action: `${t.type}: ${t.asset} ${t.amount || t.crypto_amount}`,
        device: t.status,
        time: new Date(t.date || t.created_at).toLocaleString(),
        status: t.status === 'Completed' ? 'Verified' : 'Pending'
    })),
    ...activityData.copyTrades.map(ct => ({
        type: 'Trading',
        action: `Copy Trade: ${ct.traderName}`,
        device: `Allocated: ${ct.allocated_amount}`,
        time: new Date(ct.created_at).toLocaleString(),
        status: ct.status === 'active' ? 'Verified' : 'History'
    }))
  ].sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());

  const [profileData, setProfileData] = useState({
    name: user?.name,
    email: user?.email,
    phone: user?.phone
  });

  useEffect(() => {
    if (user) {
        setProfileData({
            name: user.name,
            email: user.email,
            phone: user.phone
        });
    }
  }, [user]);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setUploading(true);
    try {
        const fileExt = file.name.split('.').pop();
        const fileName = `${user.id}-${Math.random()}.${fileExt}`;
        const filePath = `${fileName}`;

        // Standard bucket check (avatars)
        const { error: uploadError } = await supabase.storage
            .from('avatars')
            .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
            .from('avatars')
            .getPublicUrl(filePath);

        const { error: updateError } = await supabase
            .from('profiles')
            .update({ avatar_url: publicUrl })
            .eq('id', user.id);

        if (updateError) throw updateError;
        
        toast.success("Profile photo updated", {
            description: "Your new avatar has been synced platform-wide."
        });
        
        // Refresh app data in store
        await fetchAppData();
    } catch (error: any) {
        console.error("Upload error:", error);
        toast.error("Upload failed", {
            description: "Please check your storage bucket setup (ensure 'avatars' exists)."
        });
    } finally {
        setUploading(false);
    }
  };

  const handleSave = async (section: string) => {
    if (section === "Profile") {
        try {
            if (!user) return;
            const { error } = await supabase.from('profiles').update({
                name: profileData.name,
                phone: profileData.phone
            }).eq('id', user.id);
            
            if (!error) {
                toast.success(`${section} saved successfully.`, {
                    description: "Changes have been persisted globally."
                });
            } else {
                throw error;
            }
        } catch (err) {
            toast.error("Process Failed", { description: "Unable to sync with master nodes." });
        }
    } else {
        toast.success(`${section} updated successfully.`, {
            description: "Your changes have been saved."
        });
    }
  };

  const menuItems = [
    { id: "profile", icon: User, label: "Profile" },
    { id: "security", icon: Shield, label: "Security & 2FA" },
    { id: "notifications", icon: Bell, label: "Alerts" },
    { id: "preferences", icon: Globe, label: "Local Preferences" },
    { id: "activity", icon: Clock, label: "History" },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-8 max-w-6xl mx-auto">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-border">
          <div>
            <h1 className="text-3xl font-black font-sans text-foreground">Account Hub</h1>
            <p className="text-muted-foreground mt-1 text-sm font-medium">Manage your personal identity, security vaults, and local experiences.</p>
          </div>
          <div className="flex gap-3">
             <div className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-secondary border border-border text-foreground text-[10px] font-black uppercase tracking-widest shadow-sm">
               <ShieldCheck className="w-4 h-4 text-primary" /> Active Encryption
             </div>
          </div>
        </header>

        <div className="grid lg:grid-cols-[280px_1fr] gap-12">
            {/* Navigation */}
            <aside className="space-y-2">
                {menuItems.map((item) => (
                    <button 
                        key={item.id}
                        onClick={() => setActiveTab(item.id)}
                        className={`w-full flex items-center gap-3 px-5 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border ${
                            activeTab === item.id 
                            ? "bg-card border-primary/20 text-primary shadow-gold" 
                            : "text-muted-foreground hover:text-foreground hover:bg-secondary border-transparent"
                        }`}
                    >
                        <item.icon className={`w-4 h-4 ${activeTab === item.id ? "text-primary" : "text-muted-foreground"}`} />
                        {item.label}
                        {activeTab === item.id && <ChevronRight className="w-3 h-3 ml-auto" />}
                    </button>
                ))}
            </aside>

            {/* Content Area */}
            <main className="space-y-6">
               <AnimatePresence mode="wait">
                 {activeTab === "profile" && (
                    <motion.div 
                        key="profile"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="space-y-8"
                    >
                        <div className="bg-card p-8 md:p-10 rounded-[2.5rem] border border-border shadow-sm relative overflow-hidden group">
                           <div className="flex items-center gap-6 mb-10 pb-6 border-b border-border">
                              <div className="relative group/avatar cursor-pointer" onClick={() => document.getElementById('avatarInput')?.click()}>
                                 <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center border border-primary/20 text-primary shadow-xl overflow-hidden backdrop-blur-sm transition-all group-hover/avatar:border-primary">
                                    {user?.avatar_url ? (
                                      <img src={user.avatar_url} className="w-full h-full object-cover" />
                                    ) : (
                                      <User className="w-10 h-10" />
                                    )}
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/avatar:opacity-100 transition-opacity flex items-center justify-center">
                                       <Upload className="w-6 h-6 text-white" />
                                    </div>
                                 </div>
                                 {uploading && (
                                   <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-2xl z-20">
                                      <RefreshCw className="w-8 h-8 text-white animate-spin" />
                                   </div>
                                 )}
                                 <input 
                                   id="avatarInput" 
                                   type="file" 
                                   accept="image/*" 
                                   className="hidden" 
                                   onChange={handleAvatarUpload} 
                                   disabled={uploading}
                                 />
                              </div>
                              <div>
                                 <h2 className="text-2xl font-black text-foreground">Legal Profile</h2>
                                 <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mt-1 italic">Verified Account: {user?.id}</p>
                              </div>
                           </div>

                           <div className="grid md:grid-cols-2 gap-8">
                              <div className="space-y-3">
                                 <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-[0.2em] px-1">Full Legal Name</Label>
                                 <Input 
                                    value={profileData.name} 
                                    onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                                    className="h-14 bg-secondary border-border rounded-xl font-bold focus:ring-1 ring-primary" 
                                 />
                              </div>
                              <div className="space-y-3">
                                 <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-[0.2em] px-1">Primary Email</Label>
                                 <Input 
                                    value={profileData.email} 
                                    onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                                    className="h-14 bg-secondary border-border rounded-xl font-bold" 
                                 />
                              </div>
                              <div className="space-y-3">
                                 <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-[0.2em] px-1">Mobile Contact</Label>
                                 <Input 
                                    value={profileData.phone} 
                                    onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                                    className="h-14 bg-secondary border-border rounded-xl font-bold" 
                                 />
                              </div>
                              <div className="space-y-3">
                                 <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-[0.2em] px-1">Residency</Label>
                                 <div className="h-14 bg-secondary border-border rounded-xl px-5 flex items-center justify-between group/loc cursor-pointer hover:bg-secondary/40 transition-colors">
                                    <span className="text-sm font-bold text-foreground">New York, USA</span>
                                    <Globe className="w-4 h-4 text-muted-foreground group-hover/loc:text-primary transition-colors" />
                                 </div>
                              </div>
                           </div>

                           <div className="mt-10 flex justify-end">
                              <Button variant="hero" className="h-14 px-12 rounded-xl text-xs font-black uppercase tracking-[0.2em] text-white shadow-gold" onClick={() => handleSave("Profile")}>
                                Save Profile
                              </Button>
                           </div>
                        </div>

                        {/* KYC Verification Mini-Card */}
                        <div className={`p-1 border rounded-[2rem] overflow-hidden group shadow-sm transition-all ${
                            user?.kyc === 'Verified' ? 'bg-gradient-to-br from-green-500/10 to-green-500/5 border-green-500/20' :
                            user?.kyc === 'Pending' ? 'bg-gradient-to-br from-amber-500/10 to-amber-500/5 border-amber-500/20' :
                            user?.kyc === 'Rejected' ? 'bg-gradient-to-br from-red-500/10 to-red-500/5 border-red-500/20' :
                            'bg-gradient-to-br from-secondary to-card border-border'
                        }`}>
                           <div className="p-8 flex flex-col md:flex-row items-center justify-between gap-8">
                              <div className="flex gap-6 items-center">
                                 <div className={`w-14 h-14 rounded-2xl border flex items-center justify-center shadow-sm transition-all ${
                                    user?.kyc === 'Verified' ? 'bg-green-500/20 border-green-500/30 text-green-600' :
                                    user?.kyc === 'Pending' ? 'bg-amber-500/20 border-amber-500/30 text-amber-600' :
                                    user?.kyc === 'Rejected' ? 'bg-red-500/20 border-red-500/30 text-red-600' :
                                    'bg-secondary border-border text-muted-foreground'
                                 }`}>
                                    {user?.kyc === 'Verified' ? <ShieldCheck className="w-7 h-7" /> : <Shield className="w-7 h-7" />}
                                 </div>
                                 <div className="space-y-1">
                                    <h3 className="text-lg font-black text-foreground uppercase tracking-widest">
                                       KYC Status: {user?.kyc || 'Unverified'}
                                    </h3>
                                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest italic opacity-60">
                                       {user?.kyc === 'Verified' ? 'Full Access Unlocked' : 
                                        user?.kyc === 'Pending' ? 'Review in Progress' : 
                                        user?.kyc === 'Rejected' ? 'Resubmission Required' :
                                        'Restrictions Applied'}
                                    </p>
                                 </div>
                              </div>
                              <Button 
                                 onClick={() => navigate('/dashboard/kyc')}
                                 className="h-12 px-8 bg-card border border-border text-foreground font-black text-[10px] uppercase tracking-[0.2em] hover:bg-secondary hover:text-primary transition-all"
                              >
                                 {user?.kyc === 'Verified' ? 'View Details' : 'Verify Identity'}
                              </Button>
                           </div>
                        </div>
                    </motion.div>
                 )}

                 {activeTab === "security" && (
                    <motion.div 
                        key="security"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="space-y-8"
                    >
                        <div className="bg-card p-10 rounded-[2.5rem] border border-border shadow-sm">
                           <div className="flex items-center gap-6 mb-10 pb-6 border-b border-border">
                              <div className="w-16 h-16 rounded-2xl bg-blue-50 flex items-center justify-center border border-blue-100 text-blue-600 shadow-inner">
                                 <Lock className="w-8 h-8" />
                              </div>
                              <div>
                                 <h2 className="text-2xl font-black text-foreground">Security Vault</h2>
                                 <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mt-1">Multi-factor enforcement & Encryption</p>
                              </div>
                           </div>

                           <div className="space-y-4">
                              {[
                                 { icon: Fingerprint, label: "Two-Factor Auth (2FA)", desc: "Require OTP code for every login and withdrawal.", enabled: true, color: "text-primary" },
                                 { icon: Smartphone, label: "Biometric Passkey", desc: "Unlock account via FaceID or local device secure enclave.", enabled: false, color: "text-blue-600" },
                                 { icon: History, label: "Session Monitoring", desc: "Keep history of all IP addresses and devices.", enabled: true, color: "text-purple-600" },
                              ].map((sec) => (
                                 <div key={sec.label} className="p-6 rounded-2xl bg-secondary border border-border hover:border-primary/20 transition-all group flex items-center justify-between">
                                    <div className="flex items-center gap-5">
                                       <div className="w-12 h-12 rounded-xl bg-card border border-border flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform duration-300">
                                          <sec.icon className={`w-6 h-6 ${sec.color}`} />
                                       </div>
                                       <div className="space-y-1">
                                          <div className="text-sm font-black text-foreground">{sec.label}</div>
                                          <p className="text-xs text-muted-foreground font-medium italic">{sec.desc}</p>
                                       </div>
                                    </div>
                                    <Switch defaultChecked={sec.enabled} />
                                 </div>
                              ))}
                           </div>

                           <div className="mt-12 pt-10 border-t border-border space-y-8">
                              <h3 className="text-sm font-black uppercase tracking-[0.3em] text-muted-foreground pl-1">Modify Vault Access</h3>
                              <div className="grid md:grid-cols-2 gap-8">
                                 <div className="space-y-3">
                                    <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest px-1">Current Password</Label>
                                    <div className="relative">
                                       <Input type={showPassword ? "text" : "password"} className="h-14 bg-secondary border-border rounded-xl font-mono text-xs" />
                                       <button onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground">
                                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                       </button>
                                    </div>
                                 </div>
                                 <div className="space-y-3">
                                    <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest px-1">New Password</Label>
                                    <Input type={showPassword ? "text" : "password"} className="h-14 bg-secondary border-border rounded-xl font-mono text-xs" />
                                 </div>
                              </div>
                              <Button variant="outline" className="h-14 px-12 rounded-xl bg-card border-border font-black text-[10px] uppercase tracking-widest hover:text-primary transition-all shadow-sm">
                                 Rotate Access Credentials
                              </Button>
                           </div>
                        </div>
                    </motion.div>
                 )}

                 {activeTab === "notifications" && (
                    <motion.div 
                        key="notifications"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="space-y-8"
                    >
                        <div className="bg-card p-10 rounded-[2.5rem] border border-border shadow-sm">
                           <div className="flex items-center gap-6 mb-10 pb-6 border-b border-border">
                              <div className="w-16 h-16 rounded-2xl bg-orange-50 flex items-center justify-center border border-orange-100 text-orange-600 shadow-inner">
                                 <Bell className="w-8 h-8" />
                              </div>
                              <div>
                                 <h2 className="text-2xl font-black text-foreground">Alert Hub</h2>
                                 <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mt-1">Configure real-time event tracking</p>
                              </div>
                           </div>

                           <div className="grid gap-6">
                              {[
                                 { label: "Financial Executions", desc: "Push & Email alerts for completed trades and orders.", active: true },
                                 { label: "Whale Movement Alerts", desc: "Notify when significant market volatility occurs.", active: false },
                                 { label: "Portfolio Drift", desc: "Get notified when your assets drop below your target split.", active: true },
                                 { label: "Security & Login", desc: "Critical alerts for new login sessions and IP changes.", active: true },
                              ].map((item) => (
                                 <div key={item.label} className="p-6 rounded-2xl bg-secondary border border-border flex items-center justify-between hover:border-primary/20 transition-all">
                                    <div className="space-y-1">
                                       <div className="text-sm font-black text-foreground uppercase tracking-widest">{item.label}</div>
                                       <p className="text-xs text-muted-foreground font-bold italic">{item.desc}</p>
                                    </div>
                                    <Switch defaultChecked={item.active} />
                                 </div>
                              ))}
                           </div>

                           <div className="mt-10 p-6 rounded-2xl bg-secondary/50 border border-dashed border-border flex items-center justify-between">
                              <div className="flex gap-4 items-center">
                                 <Mail className="w-5 h-5 text-primary" />
                                 <div>
                                    <div className="text-xs font-black text-foreground uppercase tracking-widest">Digest Frequency</div>
                                    <p className="text-[10px] font-bold text-muted-foreground mt-0.5">Summary of daily activity</p>
                                 </div>
                              </div>
                              <select className="bg-card border-border rounded-lg text-xs font-bold px-4 py-2 outline-none">
                                 <option>Instant</option>
                                 <option>Daily Digest</option>
                                 <option>Weekly Report</option>
                              </select>
                           </div>
                        </div>
                    </motion.div>
                 )}

                 {activeTab === "preferences" && (
                    <motion.div 
                        key="preferences"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="space-y-8"
                    >
                        <div className="bg-card p-10 rounded-[2.5rem] border border-border shadow-sm">
                           <div className="flex items-center gap-6 mb-10 pb-6 border-b border-border">
                              <div className="w-16 h-16 rounded-2xl bg-green-50 flex items-center justify-center border border-green-100 text-green-600 shadow-inner">
                                 <Globe className="w-8 h-8" />
                              </div>
                              <div>
                                 <h2 className="text-2xl font-black text-foreground">Local Experience</h2>
                                 <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mt-1">Regional formats & Interface settings</p>
                              </div>
                           </div>

                           <div className="space-y-10">
                              <div className="space-y-4">
                                 <div className="flex items-center justify-between px-1">
                                    <div>
                                       <Label className="text-[10px] font-black uppercase text-foreground tracking-[0.2em]">Preferred Display Currency</Label>
                                       <p className="text-[10px] font-bold text-muted-foreground mt-1 italic">Overrides auto-detected regional currency defaults.</p>
                                    </div>
                                 </div>
                                 <div className="p-2 rounded-2xl bg-secondary border border-border inline-block min-w-[320px]">
                                    <CurrencySelector />
                                 </div>
                              </div>

                                 <div className="space-y-3">
                                    <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Timezone</Label>
                                    <select className="w-full h-14 bg-secondary border border-border rounded-xl px-4 text-sm font-bold outline-none appearance-none">
                                       <option>UTC -05:00 (Eastern Time)</option>
                                       <option>UTC +00:00 (London/GMT)</option>
                                       <option>UTC +01:00 (Paris/CET)</option>
                                    </select>
                                 </div>
                           </div>
                        </div>
                    </motion.div>
                 )}

                 {activeTab === "activity" && (
                    <motion.div 
                        key="activity"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="space-y-8"
                    >
                        <div className="bg-card p-10 rounded-[2.5rem] border border-border shadow-sm">
                           <div className="flex items-center gap-6 mb-10 pb-6 border-b border-border">
                              <div className="w-16 h-16 rounded-2xl bg-secondary border border-border flex items-center justify-center text-primary shadow-inner">
                                 <History className="w-8 h-8" />
                              </div>
                              <div>
                                 <h2 className="text-2xl font-black text-foreground">Recent Activity</h2>
                                 <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mt-1">Audit log of your personal actions</p>
                              </div>
                           </div>

                           <div className="space-y-4">
                                {combinedLogs.length === 0 ? (
                                    <div className="py-20 text-center border-2 border-dashed border-border rounded-3xl">
                                        <History className="w-12 h-12 text-muted-foreground/20 mx-auto mb-4" />
                                        <p className="text-sm font-bold text-muted-foreground">No recent activity detected.</p>
                                    </div>
                                ) : combinedLogs.slice(0, 10).map((log, i) => (
                                    <div key={i} className="flex items-center justify-between p-5 rounded-2xl bg-secondary/50 border border-border hover:border-primary/20 transition-all group">
                                        <div className="flex items-center gap-5">
                                            <div className="w-10 h-10 rounded-[0.9rem] bg-card border border-border flex items-center justify-center font-black text-[10px] text-muted-foreground group-hover:bg-primary/5 transition-colors">
                                                {String(i + 1).padStart(2, '0')}
                                            </div>
                                            <div>
                                                <div className="text-sm font-black text-foreground">{log.action}</div>
                                                <div className="text-[10px] text-muted-foreground font-bold font-mono mt-0.5">{log.device} • {log.time}</div>
                                            </div>
                                        </div>
                                        <span className={`text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full border ${
                                            log.status === 'Alerted' ? 'bg-red-50 text-red-600 border-red-100' : 'bg-card text-muted-foreground border-border'
                                        }`}>
                                            {log.status}
                                        </span>
                                    </div>
                                ))}
                           </div>

                           <div className="mt-10 flex justify-center">
                              <Button variant="ghost" className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em] hover:text-primary transition-colors flex items-center gap-3">
                                 Download Detailed Archive <ExternalLink className="w-3 h-3" />
                              </Button>
                           </div>
                        </div>
                    </motion.div>
                 )}
               </AnimatePresence>
            </main>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default SettingsPage;
