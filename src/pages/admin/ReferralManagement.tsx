import { useState } from "react";
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

const ReferralManagement = () => {
  const referrals = useStore(state => state.referrals);
  const users = useStore(state => state.users);
  const [searchTerm, setSearchTerm] = useState("");

  const filteredReferrals = referrals.filter(ref => 
    ref.refereeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ref.refereeEmail.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const stats = [
    { label: "Active Affiliates", value: "24", icon: Users, color: "text-blue-500", bg: "bg-blue-50" },
    { label: "Total Commissions", value: `$${referrals.reduce((acc, r) => acc + r.bonusEarned, 0).toLocaleString()}`, icon: DollarSign, color: "text-green-500", bg: "bg-green-50" },
    { label: "Conversion Rate", value: "12.5%", icon: TrendingUp, color: "text-amber-500", bg: "bg-amber-50" },
    { label: "Top Bonus", value: "$1,200", icon: Award, color: "text-primary", bg: "bg-primary/10" },
  ];

  return (
    <AdminLayout>
      <div className="space-y-8 lg:space-y-12 mb-10">
        <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-2">
          <div>
            <h1 className="text-3xl font-bold font-sans text-foreground">Referral & Affiliates</h1>
            <p className="text-muted-foreground mt-1 text-sm">Track referral activity and commission payouts.</p>
          </div>
          <div className="flex gap-3">
             <Button variant="outline" className="h-10 rounded-xl gap-2 text-[10px] font-black uppercase tracking-widest">
               <Filter className="w-4 h-4" /> Export Data
             </Button>
             <Button variant="hero" className="h-10 rounded-xl shadow-gold text-white text-[10px] font-black uppercase tracking-widest gap-2">
               Affiliate Settings <ChevronRight className="w-4 h-4" />
             </Button>
          </div>
        </header>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-card p-6 rounded-3xl border border-border shadow-sm flex items-center gap-6 hover:shadow-md transition-shadow"
            >
              <div className={`w-14 h-14 rounded-2xl ${stat.bg} ${stat.color} flex items-center justify-center shrink-0`}>
                <stat.icon className="w-7 h-7" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] mb-1 block">{stat.label}</span>
                <span className="text-2xl font-bold text-foreground">{stat.value}</span>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="bg-card rounded-3xl border border-border flex flex-col shadow-sm overflow-hidden">
          <div className="p-6 border-b border-border flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="relative w-full md:w-96 group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-muted-foreground group-focus-within:text-primary transition-colors" />
              <Input 
                placeholder="Search by referee name or email..." 
                className="pl-12 h-10 rounded-xl bg-background border-border group-focus-within:border-primary/50 text-sm transition-all"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0">
               {['All', 'Joined', 'Trading', 'Completed'].map((tab) => (
                 <button key={tab} className={`px-5 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all border shrink-0 ${tab === 'All' ? 'bg-primary text-white border-primary shadow-glow' : 'bg-background text-muted-foreground border-border hover:border-primary/30'}`}>
                   {tab}
                 </button>
               ))}
            </div>
          </div>

          <div className="overflow-x-auto flex-1">
            <table className="w-full text-sm min-w-[800px]">
              <thead>
                <tr className="text-muted-foreground border-b border-border text-[10px] font-bold uppercase tracking-widest">
                  <th className="text-left py-4 pl-6">Referee (Invited)</th>
                  <th className="text-left py-4 px-4">Referrer ID</th>
                  <th className="text-left py-4 px-4">Status</th>
                  <th className="text-left py-4 px-4">Earnings</th>
                  <th className="text-left py-4 px-4">Joined Date</th>
                  <th className="text-right py-4 pr-6">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredReferrals.map((ref) => (
                  <tr key={ref.id} className="group hover:bg-secondary/30 transition-colors">
                    <td className="py-4 pl-6">
                      <div className="flex flex-col">
                        <span className="font-bold text-foreground group-hover:text-primary transition-colors">{ref.refereeName}</span>
                        <span className="text-[10px] uppercase font-black tracking-widest text-muted-foreground mt-0.5">{ref.refereeEmail}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                       <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-pink-50 text-pink-600 flex items-center justify-center text-[10px] font-bold border border-pink-100 uppercase">
                             {ref.referrerId.toString().substring(0, 2)}
                          </div>
                           <span className="font-mono text-xs font-bold text-muted-foreground">ID_{ref.referrerId}</span>
                       </div>
                    </td>
                    <td className="py-3 px-8">
                       <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest ${
                          ref.status === 'Completed' ? 'bg-green-50 text-green-700 border-green-200' :
                          ref.status === 'Trading' ? 'bg-primary/10 text-primary border-primary/20' :
                          'bg-amber-50 text-amber-700 border-amber-200'
                        }`}>
                          {ref.status === 'Completed' ? <CheckCircle2 className="w-3.5 h-3.5" /> :
                           ref.status === 'Trading' ? <Zap className="w-3.5 h-3.5" /> :
                           <Clock className="w-3.5 h-3.5" />}
                          {ref.status}
                        </div>
                    </td>
                    <td className="py-4 px-4">
                       <div className="flex flex-col">
                          <span className="font-bold text-foreground tabular-nums">${ref.bonusEarned.toFixed(2)}</span>
                          <span className="text-[10px] text-muted-foreground/60 uppercase font-black tracking-widest mt-0.5">Paid</span>
                       </div>
                    </td>
                    <td className="py-4 px-4 text-muted-foreground font-medium text-xs">
                      {new Date(ref.date).toLocaleDateString()}
                    </td>
                    <td className="py-4 pr-6 text-right">
                       <div className="flex items-center justify-end gap-2">
                           <Button variant="outline" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity h-9 w-9 rounded-xl border-border bg-card hover:bg-primary/10 hover:border-primary/20 hover:text-primary">
                             <ExternalLink className="w-4 h-4" />
                          </Button>
                          <Button variant="outline" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity h-9 w-9 rounded-xl border-border bg-card hover:bg-loss/10 hover:text-loss hover:border-loss/20">
                             <TrendingUp className="w-4 h-4" />
                          </Button>
                       </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <div className="p-6 border-t border-border bg-secondary/10 flex items-center justify-between">
             <span className="text-xs text-muted-foreground font-medium">Showing 1 to {filteredReferrals.length} of {referrals.length} referrals</span>
             <div className="flex gap-2">
                <Button variant="outline" size="sm" className="h-9 rounded-lg text-xs font-bold uppercase tracking-wider disabled:opacity-50">Prev</Button>
                <Button variant="outline" size="sm" className="h-9 rounded-lg text-xs font-bold uppercase tracking-wider">Next</Button>
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
