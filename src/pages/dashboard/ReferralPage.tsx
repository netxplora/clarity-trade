import { useState } from "react";
import { motion } from "framer-motion";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useStore } from "@/store/useStore";
import {
  Users,
  Copy,
  Share2,
  Gift,
  ArrowUpRight,
  TrendingUp,
  Award,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Zap
} from "lucide-react";

const ReferralPage = () => {
  const user = useStore(state => state.user);
  const referrals = useStore(state => state.referrals);
  const [copied, setCopied] = useState(false);

  const referralLink = `${window.location.origin}/auth/register?ref=${user?.referralCode || "USER_REF"}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    toast.success("Referral link copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  const stats = [
    { label: "Total Referrals", value: referrals.length, icon: Users, color: "text-blue-500", bg: "bg-blue-500/10" },
    { label: "Active Traders", value: referrals.filter(r => r.status === 'Trading' || r.status === 'Completed').length, icon: Zap, color: "text-amber-500", bg: "bg-amber-500/10" },
    { label: "Total Earning", value: `$${referrals.reduce((acc, r) => acc + r.bonusEarned, 0).toLocaleString()}`, icon: Gift, color: "text-green-500", bg: "bg-green-500/10" },
    { label: "Commission Rate", value: "10%", icon: Award, color: "text-primary", bg: "bg-primary/10" },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-border">
          <div>
            <h1 className="text-3xl font-bold font-sans text-foreground">Referral Program</h1>
            <p className="text-muted-foreground mt-1 text-sm">Invite your network and earn commissions on every trade they make.</p>
          </div>
          <div className="flex gap-3">
             <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary/5 border border-primary/20 text-primary text-xs font-bold uppercase tracking-wider">
               <ShieldCheck className="w-4 h-4" /> Lifetime Commissions
             </div>
          </div>
        </header>

        <div className="grid lg:grid-cols-12 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-8 space-y-8">
            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {stats.map((stat, i) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="bg-card p-6 rounded-2xl border border-border flex flex-col items-center text-center shadow-sm"
                >
                  <div className={`w-12 h-12 rounded-xl ${stat.bg} ${stat.color} flex items-center justify-center mb-4`}>
                    <stat.icon className="w-6 h-6" />
                  </div>
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">{stat.label}</span>
                  <span className="text-xl font-bold text-foreground">{stat.value}</span>
                </motion.div>
              ))}
            </div>

            {/* Link Sharing Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-card p-8 rounded-3xl border border-border shadow-md relative overflow-hidden group"
            >
              <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                <Share2 className="w-32 h-32 rotate-12" />
              </div>
              <div className="relative z-10 space-y-6">
                <div className="space-y-2">
                  <h3 className="text-xl font-bold text-foreground">Share Your Link</h3>
                  <p className="text-sm text-muted-foreground">Copy your unique referral link and share it across your social networks.</p>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="flex-1 bg-secondary border border-border rounded-xl px-5 h-14 flex items-center overflow-x-auto no-scrollbar font-mono text-sm text-foreground/80 focus-within:border-primary/50 transition-all">
                    {referralLink}
                  </div>
                  <Button 
                    variant="hero" 
                    className="h-14 px-8 rounded-xl shadow-gold text-white font-semibold shrink-0"
                    onClick={handleCopy}
                  >
                    {copied ? (
                      <CheckCircle2 className="w-5 h-5 mr-2" />
                    ) : (
                      <Copy className="w-5 h-5 mr-2" />
                    )}
                    {copied ? "Copied" : "Copy Link"}
                  </Button>
                </div>

                <div className="flex gap-4 pt-4">
                  <button className="flex-1 h-12 rounded-xl bg-[#1877F2]/10 text-[#1877F2] font-bold text-xs uppercase tracking-wider hover:bg-[#1877F2]/20 transition-all flex items-center justify-center gap-2">
                    Facebook
                  </button>
                  <button className="flex-1 h-12 rounded-xl bg-[#1DA1F2]/10 text-[#1DA1F2] font-bold text-xs uppercase tracking-wider hover:bg-[#1DA1F2]/20 transition-all flex items-center justify-center gap-2">
                    Twitter
                  </button>
                  <button className="flex-1 h-12 rounded-xl bg-[#25D366]/10 text-[#25D366] font-bold text-xs uppercase tracking-wider hover:bg-[#25D366]/20 transition-all flex items-center justify-center gap-2">
                    WhatsApp
                  </button>
                </div>
              </div>
            </motion.div>

            {/* Referral History */}
            <div className="bg-card rounded-3xl border border-border shadow-sm overflow-hidden">
               <div className="p-6 border-b border-border bg-secondary/30 flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-foreground">Your Referrals</h3>
                    <p className="text-xs text-muted-foreground mt-1">Real-time status of your invited network members.</p>
                  </div>
                  <Users className="w-5 h-5 text-muted-foreground/30" />
               </div>
               <div className="overflow-x-auto">
                 <table className="w-full text-sm">
                   <thead>
                     <tr className="text-muted-foreground border-b border-border text-xs font-semibold uppercase tracking-wider">
                       <th className="text-left py-4 px-6">User</th>
                       <th className="text-left py-4 px-6">Status</th>
                       <th className="text-left py-4 px-6">Date</th>
                       <th className="text-right py-4 px-6">Bonus</th>
                     </tr>
                   </thead>
                   <tbody className="divide-y divide-border">
                     {referrals.length === 0 ? (
                       <tr><td colSpan={4} className="py-20 text-center text-muted-foreground">No referrals yet. Start sharing to earn!</td></tr>
                     ) : referrals.map((ref) => (
                       <tr key={ref.id} className="group hover:bg-secondary/50 transition-colors">
                         <td className="py-4 px-6">
                           <div className="flex flex-col">
                             <span className="font-bold text-foreground">{ref.refereeName}</span>
                             <span className="text-[10px] text-muted-foreground">{ref.refereeEmail}</span>
                           </div>
                         </td>
                         <td className="py-4 px-6">
                            <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold border ${
                              ref.status === 'Completed' ? 'bg-green-50 text-green-700 border-green-200' :
                              ref.status === 'Trading' ? 'bg-primary/10 text-primary border-primary/20' :
                              'bg-secondary text-muted-foreground border-border'
                            }`}>
                              {ref.status === 'Completed' ? <CheckCircle2 className="w-3 h-3" /> :
                               ref.status === 'Trading' ? <Zap className="w-3 h-3" /> :
                               <Clock className="w-3 h-3" />}
                              {ref.status}
                            </div>
                         </td>
                         <td className="py-4 px-6 text-muted-foreground">
                           {new Date(ref.date).toLocaleDateString()}
                         </td>
                         <td className="py-4 px-6 text-right">
                           <span className={`font-bold ${ref.bonusEarned > 0 ? "text-green-600" : "text-muted-foreground"}`}>
                             {ref.bonusEarned > 0 ? `+$${ref.bonusEarned}` : "$0.00"}
                           </span>
                         </td>
                       </tr>
                     ))}
                   </tbody>
                 </table>
               </div>
            </div>
          </div>

          {/* Sidebar Info */}
          <div className="lg:col-span-4 space-y-6">
             <div className="bg-card p-8 rounded-3xl border border-border shadow-sm space-y-6">
                <h3 className="text-lg font-bold text-foreground">How it Works</h3>
                <div className="space-y-6">
                  <div className="flex gap-4">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm shrink-0">1</div>
                    <div>
                      <h4 className="font-bold text-sm text-foreground mb-1">Invite Friends</h4>
                      <p className="text-[11px] text-muted-foreground leading-relaxed">Share your unique referral link with your friends and community.</p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm shrink-0">2</div>
                    <div>
                      <h4 className="font-bold text-sm text-foreground mb-1">They Join & Trade</h4>
                      <p className="text-[11px] text-muted-foreground leading-relaxed">When they register and start their first trading execution.</p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm shrink-0">3</div>
                    <div>
                      <h4 className="font-bold text-sm text-foreground mb-1">Earn Daily</h4>
                      <p className="text-[11px] text-muted-foreground leading-relaxed">Receive instant commissions directly to your wallet on every trade.</p>
                    </div>
                  </div>
                </div>

                <div className="pt-6 border-t border-border">
                   <div className="p-4 rounded-2xl bg-gradient-gold text-white shadow-gold relative overflow-hidden">
                      <div className="relative z-10">
                        <h4 className="font-bold text-sm mb-1 italic">Pro Affiliate?</h4>
                        <p className="text-[10px] opacity-90 leading-relaxed mb-4">Are you an influencer? Contact us for custom rates up to 25%.</p>
                        <button className="w-full h-10 rounded-lg bg-white/20 hover:bg-white/30 transition-all text-xs font-bold uppercase tracking-wider backdrop-blur-md">
                          Apply Now
                        </button>
                      </div>
                      <Award className="absolute -right-2 -bottom-2 w-16 h-16 opacity-10" />
                   </div>
                </div>
             </div>
           </div>
        </div>


        {/* Affiliate Program Details */}
        <div className="grid lg:grid-cols-3 gap-8 pb-12 pt-8">
            <div className="bg-card p-8 rounded-3xl border border-border">
                <h3 className="text-xl font-bold text-foreground mb-6 flex items-center gap-3">
                    <Award className="w-6 h-6 text-primary" /> Affiliate Tiers
                </h3>
                <div className="space-y-6">
                    {[
                        { tier: "BRONZE", min: "0-5 Refs", rate: "10%", active: true },
                        { tier: "SILVER", min: "6-20 Refs", rate: "15%", active: false },
                        { tier: "GOLD", min: "21+ Refs", rate: "25%", active: false }
                    ].map((t) => (
                        <div key={t.tier} className={`p-4 rounded-2xl border transition-all ${t.active ? 'bg-primary/5 border-primary/30' : 'bg-secondary/30 border-border opacity-60'}`}>
                            <div className="flex justify-between items-center">
                                <div>
                                    <div className={`text-xs font-black uppercase tracking-widest ${t.active ? 'text-primary' : 'text-muted-foreground'}`}>{t.tier}</div>
                                    <div className="text-[10px] text-muted-foreground font-bold mt-0.5">{t.min}</div>
                                </div>
                                <div className="text-lg font-bold text-foreground">{t.rate}</div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>


        </div>
      </div>
    </DashboardLayout>
  );
};

export default ReferralPage;
