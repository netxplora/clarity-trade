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
  Clock,
  ChevronRight,
  Settings,
  CreditCard,
  Mail,
  Eye,
  EyeOff,
  Upload,
  RefreshCw,
  TrendingUp,
  Users,
  Share2,
  Activity,
  Wallet,
  SmartphoneNfc,
  Laptop,
  Save,
  Copy,
  Building2,
  AlertTriangle,
  ChevronDown,
  Info
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { useStore } from "@/store/useStore";

const SettingsPage = () => {
  const { user, fetchAppData } = useStore();
  const [activeTab, setActiveTab] = useState("account");
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // --- MENU ITEMS ---
  const menuItems = [
    { id: "account", icon: User, label: "Account" },
    { id: "security", icon: Shield, label: "Security" },
    { id: "investment", icon: TrendingUp, label: "Investments" },
    { id: "notifications", icon: Bell, label: "Notifications" },
    { id: "payments", icon: CreditCard, label: "Payments" },
    { id: "referrals", icon: Users, label: "Referrals" },
  ];

  // --- STATE ---
  const [accountData, setAccountData] = useState({
    name: user?.name || "",
    email: user?.email || "",
    phone: user?.phone || "",
    country: "United States",
    timezone: "(GMT-05:00) Eastern Time"
  });

  const [passwordData, setPasswordData] = useState({ current: "", new: "", confirm: "" });
  const [showPass, setShowPass] = useState(false);
  const [twoFactor, setTwoFactor] = useState(true);

  const [investmentData, setInvestmentData] = useState({
    riskLevel: "Balanced",
    autoCopy: true,
    withdrawalPreference: "Monthly"
  });

  const [notifData, setNotifData] = useState({
    email: true,
    sms: false,
    push: true,
    alerts: true
  });

  const [paymentData, setPaymentData] = useState({
    bankName: "",
    accountNum: "",
    cryptoWallet: "",
    defaultMethod: "Crypto Wallet"
  });

  useEffect(() => {
    if (user) {
      setAccountData(prev => ({
        ...prev,
        name: user.name || prev.name,
        email: user.email || prev.email,
        phone: user.phone || prev.phone,
        country: "United States"
      }));
    }
  }, [user]);

  // --- HANDLERS ---
  const handleSave = async (section: string) => {
    setLoading(true);
    try {
      if (section === "Account") {
        if (!user) return;
        const { error } = await supabase.from('profiles').update({
          name: accountData.name,
          phone: accountData.phone
        }).eq('id', user.id);
        if (error) throw error;
        await fetchAppData();
      }
      toast.success(`${section} settings updated`, {
        description: "Your changes have been saved successfully."
      });
    } catch (err: any) {
      toast.error("Update failed", { description: err.message || "Please try again." });
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Math.random()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage.from('avatars').upload(fileName, file);
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(fileName);
      const { error: updateError } = await supabase.from('profiles').update({ avatar_url: publicUrl }).eq('id', user.id);
      if (updateError) throw updateError;
      toast.success("Profile photo updated");
      await fetchAppData();
    } catch (error: any) {
      toast.error("Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handlePasswordUpdate = async () => {
    if (!passwordData.new || passwordData.new !== passwordData.confirm) {
       toast.error("Passwords do not match");
       return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: passwordData.new });
      if (error) throw error;
      toast.success("Password updated");
      setPasswordData({ current: "", new: "", confirm: "" });
    } catch (err: any) {
      toast.error("Update failed", { description: err.message });
    } finally {
      setLoading(false);
    }
  };

  const referralLink = `https://claritytrade.com/ref/${user?.id?.substring(0, 8)}`;

  // --- REUSABLE COMPONENTS ---

  const SettingsCard = ({ 
    title, 
    desc, 
    children, 
    onSave, 
    isPending = false
  }: { 
    title: string, 
    desc: string, 
    children: React.ReactNode, 
    onSave?: () => void, 
    isPending?: boolean
  }) => {
    return (
      <div className="bg-card border border-border rounded-3xl p-6 md:p-8 shadow-sm space-y-6 mb-6 overflow-hidden">
        <div className="space-y-1">
          <h4 className="text-lg font-black text-foreground uppercase tracking-tight">{title}</h4>
          <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest opacity-60">{desc}</p>
        </div>
        <div className="space-y-6 pt-2">
          {children}
        </div>
        {onSave && (
          <div className="pt-6 border-t border-border/50 flex justify-end">
            <Button 
              onClick={onSave} 
              disabled={isPending}
              className="w-full sm:w-auto h-12 px-8 rounded-xl text-[10px] font-black uppercase tracking-widest bg-primary hover:bg-primary/90 text-white transition-all shadow-main"
            >
              <Save className="w-4 h-4 mr-2" /> {isPending ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        )}
      </div>
    );
  };

  // --- SECTIONS ---

  const AccountTab = () => (
    <div className="space-y-6">
      <SettingsCard title="Profile Photo" desc="Your public identity on the platform" onSave={() => handleAvatarUpload({ target: { files: [] } } as any)} isPending={uploading}>
        <div className="flex items-center gap-6">
          <div className="relative group cursor-pointer" onClick={() => document.getElementById('avatarInput')?.click()}>
            <div className="w-24 h-24 rounded-3xl bg-secondary border-2 border-dashed border-border flex items-center justify-center overflow-hidden transition-all group-hover:border-primary shadow-inner">
              {user?.avatar_url ? (
                <img src={user.avatar_url} className="w-full h-full object-cover" />
              ) : (
                <User className="w-8 h-8 text-muted-foreground" />
              )}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Upload className="w-5 h-5 text-white" />
              </div>
            </div>
            {uploading && (
                <div className="absolute inset-0 flex items-center justify-center bg-card/80 rounded-3xl">
                  <RefreshCw className="w-6 h-6 text-primary animate-spin" />
                </div>
            )}
          </div>
          <div className="space-y-1.5">
            <p className="text-sm font-bold text-foreground">Update Photo</p>
            <p className="text-[10px] text-muted-foreground font-medium italic max-w-[150px]">Choose a clean, professional headshot. Max 2MB.</p>
            <input id="avatarInput" type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
          </div>
        </div>
      </SettingsCard>

      <SettingsCard title="Personal Details" desc="Basic account information and contact info" onSave={() => handleSave("Account")} isPending={loading}>
        <div className="grid gap-6 sm:grid-cols-2">
          <div className="space-y-2">
            <Label className="settings-label">Full Name</Label>
            <Input value={accountData.name} onChange={e => setAccountData({...accountData, name: e.target.value})} className="settings-input" />
          </div>
          <div className="space-y-2">
            <Label className="settings-label">Email Address</Label>
            <Input value={accountData.email} disabled className="settings-input opacity-60 bg-secondary/50" />
          </div>
          <div className="space-y-2">
            <Label className="settings-label">Phone Number</Label>
            <Input value={accountData.phone} onChange={e => setAccountData({...accountData, phone: e.target.value})} className="settings-input" />
          </div>
          <div className="space-y-2">
            <Label className="settings-label">Country</Label>
            <div className="h-[3.5rem] bg-secondary/30 border border-border rounded-2xl px-5 flex items-center gap-3">
              <Globe className="w-4.5 h-4.5 text-muted-foreground" />
              <span className="text-sm font-bold text-foreground">{accountData.country}</span>
            </div>
          </div>
        </div>
      </SettingsCard>

      <SettingsCard title="Preferences" desc="Localize your dashboard experience">
        <div className="space-y-2">
          <Label className="settings-label">Timezone</Label>
          <select 
            className="settings-select" 
            value={accountData.timezone} 
            onChange={e => setAccountData({...accountData, timezone: e.target.value})}
          >
            <option>(GMT-05:00) Eastern Time</option>
            <option>(GMT+00:00) London / GMT</option>
            <option>(GMT+01:00) Paris / CET</option>
            <option>(GMT+08:00) Singapore / HK</option>
          </select>
        </div>
      </SettingsCard>
    </div>
  );

  const SecurityTab = () => (
    <div className="space-y-6">
      <SettingsCard title="Security Password" desc="Change your account entry credentials" onSave={handlePasswordUpdate} isPending={loading}>
        <div className="grid gap-6 sm:grid-cols-1">
          <div className="space-y-2">
            <Label className="settings-label">New Password</Label>
            <div className="relative">
              <Input 
                type={showPass ? "text" : "password"} 
                className="settings-input pr-12" 
                value={passwordData.new} 
                onChange={e => setPasswordData({...passwordData, new: e.target.value})}
                placeholder="Minimum 8 characters"
              />
              <button 
                onClick={() => setShowPass(!showPass)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary p-2"
              >
                {showPass ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
              </button>
            </div>
          </div>
          <div className="space-y-2">
            <Label className="settings-label">Confirm New Password</Label>
            <Input 
              type={showPass ? "text" : "password"} 
              className="settings-input"
              value={passwordData.confirm}
              onChange={e => setPasswordData({...passwordData, confirm: e.target.value})}
              placeholder="Repeat new password"
            />
          </div>
        </div>
      </SettingsCard>

      <SettingsCard title="Two-Factor Security" desc="Add an extra layer of protection to your funds">
        <div className="flex items-center justify-between p-5 rounded-3xl bg-primary/5 border border-primary/10 shadow-sm">
          <div className="flex gap-4 items-center">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-inner">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-black text-foreground uppercase tracking-tight">2FA Authentication</p>
              <p className="text-[10px] text-muted-foreground font-medium italic">Require code for withdrawals</p>
            </div>
          </div>
          <Switch checked={twoFactor} onCheckedChange={setTwoFactor} className="data-[state=checked]:bg-primary" />
        </div>
      </SettingsCard>

      <SettingsCard title="Active Logins" desc="Recent login activity from your devices">
        <div className="space-y-3">
          {[
            { device: "MacBook Pro 16", loc: "New York, NY", time: "Now (Active)", icon: Laptop, current: true },
            { device: "iPhone 15 Pro", loc: "New York, NY", time: "2 hours ago", icon: SmartphoneNfc, current: false },
          ].map((session, i) => (
            <div key={i} className={`flex items-center justify-between p-5 rounded-2xl border transition-all ${session.current ? 'bg-secondary/30 border-primary/20' : 'bg-secondary/10 border-border'}`}>
              <div className="flex items-center gap-4">
                 <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${session.current ? 'bg-primary/10 text-primary' : 'bg-muted/10 text-muted-foreground'}`}>
                    <session.icon className="w-5.5 h-5.5" />
                 </div>
                 <div>
                    <p className="text-xs font-black text-foreground uppercase tracking-wide">{session.device}</p>
                    <p className="text-[9px] text-muted-foreground font-bold">{session.loc} • {session.time}</p>
                 </div>
              </div>
              {!session.current && (
                <Button variant="ghost" className="h-9 px-4 text-[9px] font-black uppercase text-red-500 hover:text-red-600 hover:bg-red-500/10 rounded-xl border border-transparent hover:border-red-500/10">Log out</Button>
              )}
            </div>
          ))}
        </div>
      </SettingsCard>
    </div>
  );

  const InvestmentTab = () => (
    <div className="space-y-6">
      <SettingsCard title="Trading Preferences" desc="Guidelines for your investment portfolio" onSave={() => handleSave("Investment")} isPending={loading}>
        <div className="grid gap-6 sm:grid-cols-2">
           <div className="space-y-2">
              <Label className="settings-label">Risk Level Preference</Label>
              <select 
                className="settings-select"
                value={investmentData.riskLevel}
                onChange={e => setInvestmentData({...investmentData, riskLevel: e.target.value})}
              >
                <option>Conservative (Low Risk)</option>
                <option>Balanced (Moderate)</option>
                <option>Aggressive (High Return)</option>
              </select>
           </div>
           <div className="space-y-2">
              <Label className="settings-label">Profit Withdrawal Schedule</Label>
              <select 
                className="settings-select"
                value={investmentData.withdrawalPreference}
                onChange={e => setInvestmentData({...investmentData, withdrawalPreference: e.target.value})}
              >
                <option>Manual Withdrawal</option>
                <option>Auto-Withdraw Weekly</option>
                <option>Auto-Withdraw Monthly</option>
              </select>
           </div>
        </div>
        <div className="p-5 rounded-3xl bg-amber-500/5 border border-amber-500/20 flex gap-4 mt-2">
          <Info className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
          <p className="text-[10px] font-bold text-amber-800/80 leading-relaxed italic">
            Note: Changing these settings might affect your portfolio balance and margin requirements.
          </p>
        </div>
      </SettingsCard>

      <SettingsCard title="Automated Copy Trading" desc="Settings for mirroring expert portfolio moves">
        <div className="flex items-center justify-between p-5 rounded-3xl bg-secondary/20 border border-border">
           <div className="flex gap-4 items-center">
              <div className="w-12 h-12 rounded-2xl bg-orange-500/10 flex items-center justify-center text-orange-500 shadow-inner">
                <RefreshCw className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-black text-foreground uppercase tracking-tight">Auto-Copy Trades</p>
                <p className="text-[10px] text-muted-foreground font-medium italic">Execute mirror trades automatically</p>
              </div>
           </div>
           <Switch checked={investmentData.autoCopy} onCheckedChange={val => setInvestmentData({...investmentData, autoCopy: val})} />
        </div>
      </SettingsCard>
    </div>
  );

  const NotificationsTab = () => (
    <SettingsCard title="Contact Preferences" desc="Decide how we keep you informed" onSave={() => handleSave("Notification")} isPending={loading}>
      <div className="space-y-4">
        {[
          { id: 'email', icon: Mail, label: "Email Notifications", desc: "For security alerts and statements" },
          { id: 'sms', icon: Smartphone, label: "SMS Notifications", desc: "Urgent withdrawal and login alerts" },
          { id: 'push', icon: Bell, label: "Mobile Push Alerts", desc: "Instant updates to your smartphone" },
          { id: 'alerts', icon: Activity, label: "Trade Execution Alerts", desc: "Notifications for every trade result" },
        ].map((item) => (
          <div key={item.id} className="flex items-center justify-between p-5 rounded-3xl bg-secondary/30 border border-border transition-all hover:border-primary/20">
            <div className="flex gap-4 items-center">
               <div className="w-11 h-11 rounded-2xl bg-secondary flex items-center justify-center text-muted-foreground">
                  <item.icon className="w-5 h-5 transition-colors group-hover:text-primary" />
               </div>
               <div>
                  <p className="text-sm font-black text-foreground uppercase tracking-wide">{item.label}</p>
                  <p className="text-[10px] text-muted-foreground font-medium italic">{item.desc}</p>
               </div>
            </div>
            <Switch 
              checked={notifData[item.id as keyof typeof notifData]} 
              onCheckedChange={val => setNotifData({...notifData, [item.id]: val})} 
            />
          </div>
        ))}
      </div>
    </SettingsCard>
  );

  const PaymentsTab = () => (
    <div className="space-y-6">
      <SettingsCard title="Bank Account Details" desc="Required for fiat wire transfers" onSave={() => handleSave("Payment")} isPending={loading}>
        <div className="grid gap-6 sm:grid-cols-2">
          <div className="space-y-2">
            <Label className="settings-label">Bank Institution</Label>
            <Input className="settings-input" placeholder="e.g. JPMorgan Chase" />
          </div>
          <div className="space-y-2">
            <Label className="settings-label">Account Number</Label>
            <Input className="settings-input" placeholder="1234 5678 9012" />
          </div>
        </div>
      </SettingsCard>

      <SettingsCard title="Crypto Wallet" desc="Your external destination for digital assets" onSave={() => handleSave("Payment")} isPending={loading}>
        <div className="space-y-3">
          <Label className="settings-label">Personal Wallet Address</Label>
          <div className="relative">
            <Wallet className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input 
              className="settings-input pl-12 font-mono text-[11px] h-16 tracking-tighter" 
              placeholder="Enter your BTC, ETH or USDT address" 
            />
          </div>
        </div>
      </SettingsCard>
    </div>
  );

  const ReferralsTab = () => (
    <div className="space-y-6">
      <SettingsCard title="Referral Invitation" desc="Earn rewards by inviting other traders">
        <div className="p-7 rounded-[2rem] bg-gradient-to-br from-primary to-primary-foreground text-white space-y-6 shadow-huge relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-3xl" />
          <div className="relative z-10">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-80 mb-4">Your Invitation Link</p>
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-black/10 p-4 rounded-2xl border border-white/10">
              <p className="text-base font-black truncate max-w-full sm:max-w-[200px] whitespace-nowrap">{referralLink}</p>
              <Button 
                  onClick={() => {
                    navigator.clipboard.writeText(referralLink);
                    toast.success("Link copied to clipboard");
                  }}
                  className="w-full sm:w-auto bg-white text-primary hover:bg-white/90 h-11 px-6 rounded-xl border border-white/20 text-[10px] font-black uppercase tracking-widest transition-all shadow-sm active:scale-95"
                >
                  <Copy className="w-4 h-4 mr-2" /> Copy link
                </Button>
            </div>
          </div>
        </div>
      </SettingsCard>

      <div className="grid grid-cols-2 gap-4">
        {[
          { label: "Direct Referral Count", val: user?.referral_count || "0", icon: Users },
          { label: "Total Bonus Earned", val: "$0.00", icon: TrendingUp },
        ].map((stat, i) => (
          <div key={i} className="bg-card border border-border p-7 rounded-[2rem] text-center shadow-sm hover:shadow-md transition-shadow group">
            <div className={`w-10 h-10 rounded-2xl mx-auto mb-4 flex items-center justify-center transition-colors ${i === 0 ? 'bg-blue-500/10 text-blue-500' : 'bg-green-500/10 text-green-500'}`}>
               <stat.icon className="w-5 h-5" />
            </div>
            <p className="text-[9px] font-black uppercase text-muted-foreground tracking-widest mb-1.5 opacity-60 group-hover:opacity-100 transition-opacity">{stat.label}</p>
            <p className="text-2xl font-black text-foreground tracking-tight">{stat.val}</p>
          </div>
        ))}
      </div>
    </div>
  );

  const renderContent = () => {
    switch(activeTab) {
      case "account": return <AccountTab />;
      case "security": return <SecurityTab />;
      case "investment": return <InvestmentTab />;
      case "notifications": return <NotificationsTab />;
      case "payments": return <PaymentsTab />;
      case "referrals": return <ReferralsTab />;
      default: return <AccountTab />;
    }
  };

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-background/50 relative">
        
        {/* Mobile Header Title */}
        <div className="lg:hidden px-6 pt-10 pb-4">
           <div className="flex items-center gap-3 mb-1">
              <div className="w-10 h-10 rounded-2xl bg-primary/15 flex items-center justify-center text-primary">
                 <Settings className="w-5 bg h-5" />
              </div>
              <h1 className="text-3xl font-black text-foreground uppercase tracking-tighter">Settings</h1>
           </div>
           <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest opacity-60">Control your account data and safety</p>
        </div>

        <div className="max-w-4xl mx-auto lg:pt-12">
          
          {/* Desktop Header */}
          <header className="hidden lg:block px-6 py-8 md:px-0 mb-4 text-left">
            <div className="flex items-center gap-4 mb-2">
               <div className="w-12 h-12 rounded-2xl bg-primary/15 flex items-center justify-center text-primary shadow-sm border border-primary/10">
                  <Settings className="w-6 h-6" />
               </div>
               <div>
                  <h1 className="text-4xl font-black text-foreground uppercase tracking-tighter">Account Settings</h1>
                  <p className="text-muted-foreground text-sm font-medium mt-1">Manage your professional profile and security preferences.</p>
               </div>
            </div>
          </header>

          {/* Category Selector - Sticky below main layout header */}
          <div className="sticky top-16 z-30 bg-background/95 backdrop-blur-xl border-y border-border mb-8 shadow-sm">
             <div 
               ref={scrollRef}
               className="flex items-center gap-2 overflow-x-auto no-scrollbar px-6 py-4 scroll-smooth"
             >
                {menuItems.map((item) => {
                  const active = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setActiveTab(item.id)}
                      className={`flex items-center gap-2.5 px-6 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-[0.1em] transition-all whitespace-nowrap border-2 ${
                        active 
                        ? "bg-primary text-white border-primary shadow-huge scale-105" 
                        : "bg-secondary/40 text-muted-foreground border-transparent hover:bg-secondary/60 hover:text-foreground"
                      }`}
                    >
                      <item.icon className={`w-4 h-4 ${active ? 'text-white' : 'text-muted-foreground'}`} />
                      {item.label}
                    </button>
                  );
                })}
             </div>
          </div>

          {/* Main Content Areas */}
          <main className="px-6 pb-40">
             <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                >
                   {renderContent()}
                </motion.div>
             </AnimatePresence>
          </main>

          {/* Mobile Sticky Save Button */}
          <div className="lg:hidden fixed bottom-6 left-0 right-0 px-6 z-40 pointer-events-none">
             <motion.div 
               initial={{ y: 100 }}
               animate={{ y: 0 }}
               className="pointer-events-auto"
             >
                <Button 
                  onClick={() => handleSave(activeTab.charAt(0).toUpperCase() + activeTab.slice(1))}
                  disabled={loading}
                  className="w-full h-16 rounded-[2rem] bg-foreground text-background font-black uppercase tracking-[0.2em] text-[11px] shadow-2xl active:scale-95 transition-all border border-foreground/10"
                >
                   <Save className="w-5 h-5 mr-3" />
                   {loading ? "Saving Progress..." : "Save Changes"}
                </Button>
             </motion.div>
          </div>

        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .settings-label {
          font-size: 11px;
          font-weight: 900;
          text-transform: uppercase;
          color: hsl(var(--muted-foreground));
          letter-spacing: 0.12em;
          padding-left: 0.25rem;
          opacity: 0.7;
        }
        .settings-input {
          height: 3.5rem;
          background-color: hsl(var(--secondary) / 0.15);
          border: 1.5px solid hsl(var(--border) / 0.4);
          border-radius: 1.25rem;
          font-weight: 800;
          font-size: 0.9rem;
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .settings-input:focus {
          border-color: hsl(var(--primary));
          background-color: hsl(var(--card));
          box-shadow: 0 0 0 5px hsl(var(--primary) / 0.08);
          transform: translateY(-1px);
        }
        .settings-select {
          width: 100%;
          height: 3.5rem;
          background-color: hsl(var(--secondary) / 0.2);
          border: 1.5px solid hsl(var(--border) / 0.4);
          border-radius: 1.25rem;
          padding: 0 1.5rem;
          font-size: 0.9rem;
          font-weight: 800;
          outline: none;
          appearance: none;
          cursor: pointer;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='18' height='18' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='3' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 1.5rem center;
          transition: all 0.3s;
        }
        .settings-select:focus {
           border-color: hsl(var(--primary));
           box-shadow: 0 0 0 5px hsl(var(--primary) / 0.08);
        }
        .shadow-main {
          box-shadow: 0 10px 30px -5px rgba(0, 0, 0, 0.1);
        }
        .shadow-huge {
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.15);
        }
      `}} />
    </DashboardLayout>
  );
};

export default SettingsPage;
