import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import AdminLayout from "@/components/layouts/AdminLayout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  Users, 
  Search, 
  TrendingUp, 
  DollarSign, 
  Award, 
  ArrowUpRight, 
  Filter,
  CheckCircle2,
  Zap,
  Clock,
  ExternalLink,
  ChevronRight
} from "lucide-react";
import { useStore } from "@/store/useStore";
import { supabase } from "@/lib/supabase";

const ReferralManagement = () => {
  const [referrals, setReferrals] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchData = useCallback(async () => {
    const { data } = await supabase
      .from('referrals')
      .select('*, referee:referee_id(name, email)')
      .order('created_at', { ascending: false });

    if (data) {
      setReferrals(data.map(r => ({
        id: r.id,
        referrerId: r.referrer_id,
        refereeName: r.referee?.name || 'Anonymous',
        refereeEmail: r.referee?.email || 'No email',
        status: r.status,
        bonusEarned: r.bonus_earned,
        date: r.created_at
      })));
    }
  }, []);

  useEffect(() => {
    fetchData();

    const channel = supabase
      .channel('admin-referrals-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'referrals' }, () => fetchData())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchData]);

  const filteredReferrals = referrals.filter(ref => 
    ref.refereeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ref.refereeEmail.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const stats = [
    { label: "Active Partners", value: "24", icon: Users, color: "text-blue-600", bg: "bg-blue-50" },
    { label: "Total Payouts", value: `$${referrals.reduce((acc, r) => acc + r.bonusEarned, 0).toLocaleString()}`, icon: DollarSign, color: "text-green-600", bg: "bg-green-50" },
    { label: "Conversion Rate", value: "12.5%", icon: TrendingUp, color: "text-amber-600", bg: "bg-amber-50" },
    { label: "Peak Commission", value: "$1,200", icon: Award, color: "text-primary", bg: "bg-primary/5" },

  ];

  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* Institutional Header */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-border">
          <div className="space-y-1">
            <h1 className="text-3xl font-black text-foreground tracking-tight uppercase">Partner Network Management</h1>
            <p className="text-muted-foreground text-sm font-medium">Monitor network expansion and oversee partner commission disbursements.</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
             <Button variant="outline" className="h-11 border-border text-[10px] font-black uppercase tracking-[0.2em] px-6 hover:bg-secondary rounded-xl transition-all">
                <Filter className="w-4 h-4 mr-2" /> Filter Records
             </Button>
             <Button variant="hero" className="h-11 bg-primary shadow-gold text-white text-[10px] font-black uppercase tracking-[0.2em] px-8 rounded-xl transition-all">
                Partner Configuration
             </Button>
          </div>
        </header>


        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-card p-8 rounded-[2rem] border border-border shadow-huge relative overflow-hidden group hover:border-primary/30 transition-all"
            >
              <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-primary/5 rounded-full blur-2xl group-hover:bg-primary/10 transition-colors" />
              <div className="flex items-center justify-between mb-6 relative z-10">
                 <div className={`w-14 h-14 rounded-2xl ${stat.bg} ${stat.color} flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform`}>
                   <stat.icon className="w-7 h-7 shadow-glow" />
                 </div>
                 <div className="w-8 h-8 rounded-full bg-secondary/50 border border-border flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <ArrowUpRight className="w-4 h-4 text-muted-foreground" />
                 </div>
              </div>
              <div className="relative z-10">
                <span className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.25em] mb-2 block opacity-60">{stat.label}</span>
                <span className="text-3xl font-black text-foreground tabular-nums tracking-tighter">{stat.value}</span>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="bg-card rounded-[2.5rem] border border-border flex flex-col shadow-huge overflow-hidden relative group">
          <div className="absolute inset-0 bg-primary/[0.01] pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="p-8 sm:p-10 border-b border-border flex flex-col xl:flex-row xl:items-center justify-between gap-8 relative z-10">
            <div className="relative w-full xl:w-[450px] group/search">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within/search:text-primary transition-all" />
              <Input 
                placeholder="Search partners by name or email..." 
                className="pl-14 h-14 rounded-2xl bg-secondary/30 border-border group-focus-within/search:border-primary/50 text-sm font-black uppercase tracking-tight transition-all"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="flex items-center gap-3 overflow-x-auto pb-4 xl:pb-0 scrollbar-hide">
               {['All', 'Joined', 'Trading', 'Completed'].map((tab) => (
                 <button key={tab} className={`px-8 py-3.5 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all border shrink-0 ${tab === 'All' ? 'bg-primary text-white border-primary shadow-gold' : 'bg-secondary/40 text-muted-foreground border-border hover:border-primary/30 hover:bg-secondary/60'}`}>
                   {tab}
                 </button>
               ))}
            </div>
          </div>

          <div className="flex-1 relative z-10 overflow-hidden">
             {/* Mobile View */}
             <div className="lg:hidden p-6 space-y-4">
                {filteredReferrals.map((ref) => (
                   <div key={ref.id} className="p-6 rounded-[2rem] bg-secondary/5 border border-border group/card hover:border-primary/30 transition-all">
                      <div className="flex items-center justify-between mb-5">
                         <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-card border border-border flex items-center justify-center text-primary font-black text-sm shadow-sm group-hover/card:scale-110 transition-transform">
                               {ref.refereeName?.charAt(0)}
                            </div>
                            <div>
                               <div className="text-sm font-black text-foreground uppercase tracking-tight">{ref.refereeName}</div>
                               <div className="text-[10px] font-black text-muted-foreground/40 uppercase tracking-widest">{ref.refereeEmail}</div>
                            </div>
                         </div>
                         <div className={`px-2.5 py-1 rounded-lg text-[8px] font-black uppercase tracking-[0.2em] border ${
                            ref.status === 'Completed' ? 'bg-green-500/10 text-green-500 border-green-500/20' :
                            ref.status === 'Trading' ? 'bg-primary/10 text-primary border-primary/20' :
                            'bg-amber-500/10 text-amber-500 border-amber-500/20'
                          }`}>
                            {ref.status}
                         </div>
                      </div>
                      <div className="grid grid-cols-2 gap-6 pt-5 border-t border-border/50">
                         <div>
                            <span className="text-[8px] font-black text-muted-foreground uppercase opacity-40 block mb-1">Affiliate ID</span>
                            <span className="text-xs font-black text-foreground tabular-nums opacity-60">ID_{ref.referrerId}</span>
                         </div>
                         <div className="text-right">
                            <span className="text-[8px] font-black text-muted-foreground uppercase opacity-40 block mb-1">Commission</span>
                            <span className="text-sm font-black text-foreground tabular-nums">${ref.bonusEarned.toFixed(2)}</span>
                         </div>
                      </div>
                      <div className="flex items-center justify-between mt-6 pt-5 border-t border-border/50">
                         <span className="text-[10px] font-black text-muted-foreground/40 tabular-nums uppercase">{new Date(ref.date).toLocaleDateString()}</span>
                         <div className="flex gap-2">
                           <Button variant="outline" size="icon" className="h-10 w-10 rounded-xl border-border bg-card">
                              <ExternalLink className="w-4 h-4" />
                           </Button>
                           <Button variant="outline" size="icon" className="h-10 w-10 rounded-xl border-border bg-card">
                              <TrendingUp className="w-4 h-4" />
                           </Button>
                         </div>
                      </div>
                   </div>
                ))}
             </div>

             {/* Desktop Table View */}
             <div className="hidden lg:block overflow-x-auto">
                <table className="w-full text-sm">
                   <thead>
                    <tr className="text-muted-foreground text-[10px] font-bold uppercase tracking-wider bg-secondary/20 border-b border-border">
                      <th className="text-left py-6 pl-10">Partner Account</th>
                      <th className="text-left py-6 px-4">Partner ID</th>
                      <th className="text-left py-6 px-4">Status</th>
                      <th className="text-left py-6 px-4 text-right">Settlement</th>
                      <th className="text-left py-6 px-4">Registry Date</th>
                      <th className="text-right py-6 pr-10">Actions</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-border/30">
                    {filteredReferrals.map((ref) => (
                      <tr key={ref.id} className="group/row hover:bg-secondary/20 transition-all">
                        <td className="py-6 pl-10">
                          <div className="flex flex-col">
                            <span className="text-[10px] uppercase font-black tracking-widest text-muted-foreground/40 mt-1 tabular-nums">{ref.refereeEmail}</span>
                          </div>
                        </td>
                        <td className="py-6 px-4">
                           <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-card border border-border flex items-center justify-center text-[11px] font-black text-muted-foreground shadow-sm group-hover/row:scale-110 transition-transform">
                                 {ref.referrerId.toString().substring(0, 2).toUpperCase()}
                              </div>
                               <span className="font-black text-[10px] text-primary/60 tracking-widest tabular-nums uppercase">L_ID_{ref.referrerId}</span>
                           </div>
                        </td>
                        <td className="py-6 px-4">
                           <div className={`inline-flex items-center gap-2.5 px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-[0.15em] border ${
                              ref.status === 'Completed' ? 'bg-green-500/10 text-green-500 border-green-500/20' :
                              ref.status === 'Trading' ? 'bg-primary/10 text-primary border-primary/20' :
                              'bg-amber-500/10 text-amber-500 border-amber-500/20'
                            }`}>
                              {ref.status === 'Completed' ? <CheckCircle2 className="w-3.5 h-3.5" /> :
                               ref.status === 'Trading' ? <Zap className="w-3.5 h-3.5" /> :
                               <Clock className="w-3.5 h-3.5" />}
                              {ref.status}
                            </div>
                        </td>
                        <td className="py-6 px-4 text-right">
                           <div className="flex flex-col">
                              <span className="text-base font-black text-foreground tabular-nums tracking-tighter">${ref.bonusEarned.toFixed(2)}</span>
                              <span className="text-[9px] text-muted-foreground/30 uppercase font-black tracking-[0.2em] mt-0.5">NET_CREDIT</span>
                           </div>
                        </td>
                        <td className="py-6 px-4">
                           <div className="text-[10px] font-black text-muted-foreground/40 tabular-nums uppercase tracking-widest">{new Date(ref.date).toLocaleDateString()}</div>
                        </td>
                        <td className="py-6 pr-10 text-right">
                           <div className="flex items-center justify-end gap-3 translate-x-4 opacity-0 group-hover/row:opacity-100 group-hover/row:translate-x-0 transition-all duration-300">
                               <Button variant="outline" size="icon" className="h-10 w-10 rounded-xl border-border bg-card hover:bg-primary/10 hover:border-primary/20 hover:text-primary shadow-sm hover:rotate-12">
                                 <ExternalLink className="w-4 h-4" />
                              </Button>
                              <Button variant="outline" size="icon" className="h-10 w-10 rounded-xl border-border bg-card hover:bg-loss/10 hover:text-loss hover:border-loss/20 shadow-sm hover:-rotate-12">
                                 <TrendingUp className="w-4 h-4" />
                              </Button>
                           </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
             </div>
          </div>
          
          <div className="p-8 border-t border-border bg-secondary/10 flex flex-col sm:flex-row items-center justify-between gap-6 relative z-10">
             <span className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] opacity-40">Displaying Records: {filteredReferrals.length} OF {referrals.length} REGISTERED ENTITIES</span>
             <div className="flex gap-3">
                <Button variant="outline" className="h-11 px-6 rounded-xl text-[10px] font-black uppercase tracking-widest border-border bg-card shadow-sm disabled:opacity-30">Previous</Button>
                <Button variant="outline" className="h-11 px-6 rounded-xl text-[10px] font-black uppercase tracking-widest border-border bg-card shadow-sm">Next Page</Button>
             </div>
          </div>

        </div>

        <div className="grid lg:grid-cols-2 gap-8">
           <div className="bg-[#1a1510] p-6 sm:p-8 rounded-3xl border border-primary/10 shadow-huge text-white flex flex-col hover:shadow-glow transition-shadow">
              <div className="flex items-center gap-3 mb-8">
                 <Award className="w-7 h-7 text-primary" />
                 <h3 className="text-xl font-bold">Top Affiliate Leaderboard</h3>
              </div>
              <div className="space-y-5">
                 {[
                    { name: "John Doe", code: "JD777", earned: 4560, refs: 124 },
                    { name: "Alice Johnson", code: "ALICE123", earned: 3240, refs: 89 },
                    { name: "Carol White", code: "CAROL789", earned: 2150, refs: 56 },
                 ].map((top, i) => (
                    <div key={i} className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-all cursor-pointer">
                       <div className="flex items-center gap-4">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${i === 0 ? "bg-primary text-white" : "bg-white/10 text-white/50"}`}>
                             {i + 1}
                          </div>
                          <div>
                             <div className="font-bold text-sm">{top.name}</div>
                             <div className="text-[10px] text-white/30 font-bold uppercase tracking-widest">{top.code}</div>
                          </div>
                       </div>
                       <div className="text-right">
                          <div className="font-bold text-primary">${top.earned.toLocaleString()}</div>
                          <div className="text-[10px] text-white/30 font-bold uppercase tracking-widest">{top.refs} Refers</div>
                       </div>
                    </div>
                 ))}
              </div>
           </div>

           <div className="bg-card p-6 sm:p-8 rounded-3xl border border-border shadow-sm flex flex-col hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3 mb-8">
                 <TrendingUp className="w-7 h-7 text-primary" />
                 <h3 className="text-xl font-bold text-foreground">Referral Growth</h3>
              </div>
              <div className="space-y-6">
                 <div className="p-6 rounded-2xl bg-secondary border border-border">
                    <div className="flex justify-between items-center mb-4">
                       <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Sign-up Rate</span>
                       <span className="text-xs font-bold text-primary">+24% This Month</span>
                    </div>
                    <div className="h-5 bg-background border border-border rounded-lg p-1">
                       <motion.div initial={{ width: 0 }} animate={{ width: "68%" }} className="h-full bg-primary rounded-md shadow-glow" />
                    </div>
                 </div>
                 
                 <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 rounded-xl border border-border bg-background">
                       <span className="text-[10px] font-bold text-muted-foreground uppercase block mb-1">Average Bonus</span>
                       <span className="text-lg font-bold text-foreground">$42.50</span>
                    </div>
                    <div className="p-4 rounded-xl border border-border bg-background">
                       <span className="text-[10px] font-bold text-muted-foreground uppercase block mb-1">Unpaid</span>
                       <span className="text-lg font-bold text-green-600">$824.10</span>
                    </div>
                 </div>

                 <Button variant="hero" className="w-full h-12 rounded-xl text-white font-black uppercase tracking-[0.2em] shadow-gold group">
                    View Full Report <ArrowUpRight className="w-4 h-4 ml-2 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                 </Button>
              </div>
           </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default ReferralManagement;
