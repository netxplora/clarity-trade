import { useState, useEffect } from "react";
import { Plus, Edit, Trash, Activity, TrendingUp, DollarSign, Clock, ShieldCheck, User, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import AdminLayout from "@/components/layouts/AdminLayout";

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export default function AdminInvestments() {
  const [plans, setPlans] = useState<any[]>([]);
  const [investments, setInvestments] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [editingPlan, setEditingPlan] = useState<any | null>(null);
  
  // Plan Form State — uses correct column names matching investment_plans table
  const [planForm, setPlanForm] = useState({
    category: 'Forex',
    name: '',
    roi_percentage: '',
    duration_days: '',
    min_amount: '',
    max_amount: '',
    is_active: true
  });  

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      // Trigger profit recalculation
      await supabase.rpc('calculate_investment_profits');

      const [
         { data: plansRes },
         { data: invRes },
         { data: usersRes }
      ] = await Promise.all([
         supabase.from('investment_plans').select('*').order('created_at', { ascending: false }),
         supabase.from('user_investments').select('*, investment_plans(name, category)').order('created_at', { ascending: false }),
         supabase.from('profiles').select('*')
      ]);

      if (plansRes) setPlans(plansRes);
      if (invRes) setInvestments(invRes);
      if (usersRes) setUsers(usersRes);
    } catch (error) {
       console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSavePlan = async () => {
    try {
      const payload = {
          name: planForm.name,
          category: planForm.category,
          roi_percentage: parseFloat(planForm.roi_percentage),
          duration_days: parseInt(planForm.duration_days),
          min_amount: parseFloat(planForm.min_amount),
          max_amount: parseFloat(planForm.max_amount),
          is_active: planForm.is_active
      };

      if (editingPlan) {
          const { error } = await supabase.from('investment_plans').update(payload).eq('id', editingPlan.id);
          if (error) throw error;
      } else {
          const { error } = await supabase.from('investment_plans').insert(payload);
          if (error) throw error;
      }

      toast.success(`Plan ${editingPlan ? 'updated' : 'created'} successfully`);
      setShowPlanModal(false);
      fetchData();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleDeletePlan = async (id: string) => {
    if (!confirm('Are you sure you want to delete this plan?')) return;
    try {
      const { error } = await supabase.from('investment_plans').delete().eq('id', id);
      if (error) throw error;
      toast.success('Plan deleted');
      fetchData();
    } catch (error: any) {
      toast.error(error.message || 'Deletion failed');
    }
  };

  const handleCompleteInvestment = async (inv: any) => {
    if (!confirm('Mark investment as complete and return principal + profit to user?')) return;
    
    try {
      const amount = parseFloat(inv.amount);
      const profit = parseFloat(inv.profit_generated || 0);
      const maxProfit = amount * (parseFloat(inv.roi_percentage) / 100);
      const finalProfit = Math.max(profit, maxProfit);
      const totalReturn = amount + finalProfit;
      
      // Update investment status
      const { error } = await supabase
        .from('user_investments')
        .update({ 
          status: 'Completed', 
          profit_generated: finalProfit,
          updated_at: new Date().toISOString() 
        })
        .eq('id', inv.id);
      if (error) throw error;

      // Credit user balance (the DB function handles this too, but manual complete bypasses it)
      const { data: balData, error: balErr } = await supabase.from('balances').select('*').eq('user_id', inv.user_id).single();
      if (balErr) throw new Error("Could not fetch user balance");

      const cryptoBalances = balData.crypto_balances || {};
      const currentUsdt = Number(cryptoBalances['usdt'] || 0);
      const updatedCrypto = { ...cryptoBalances, usdt: currentUsdt + totalReturn };

      await supabase.from('balances').update({ crypto_balances: updatedCrypto }).eq('user_id', inv.user_id);

      // Log transaction
      await supabase.from('transactions').insert({
        user_id: inv.user_id,
        type: 'Investment Return',
        amount: totalReturn,
        asset: 'USDT',
        status: 'Completed'
      });

      toast.success('Investment completed and user credited');
      fetchData();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  // Summary stats
  const activeInvestments = investments.filter(inv => inv.status?.toLowerCase() === 'active');
  const totalActiveCapital = activeInvestments.reduce((s, inv) => s + parseFloat(inv.amount || 0), 0);
  const totalAccruedProfit = activeInvestments.reduce((s, inv) => s + parseFloat(inv.profit_generated || 0), 0);

  if (loading) {
    return (
      <AdminLayout>
         <div className="flex items-center justify-center min-h-[300px]">
           <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
         </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* Institutional Header */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-border">
          <div className="space-y-1">
            <h1 className="text-3xl font-black text-foreground tracking-tight uppercase">Portfolio Asset Management</h1>
            <p className="text-muted-foreground text-sm font-medium">Manage investment strategies and oversee user capital performance.</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
             <Button variant="outline" onClick={fetchData} className="h-11 border-border text-[10px] font-black uppercase tracking-[0.2em] px-6 hover:bg-secondary rounded-xl transition-all">
                <RefreshCw className="w-4 h-4 mr-2" /> Refresh Data
             </Button>
             <Button 
               onClick={() => {
                 setEditingPlan(null);
                 setPlanForm({ category: 'Forex', name: '', roi_percentage: '', duration_days: '', min_amount: '', max_amount: '', is_active: true });
                 setShowPlanModal(true);
               }}
               className="h-11 bg-primary shadow-gold text-white text-[10px] font-black uppercase tracking-[0.2em] px-8 rounded-xl transition-all"
             >
               <Plus className="w-4 h-4 mr-2" /> Create Strategy
             </Button>
          </div>
        </header>

        {/* Performance Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {[
            { label: "Active Portfolios", value: activeInvestments.length, suffix: "ACCOUNTS", icon: Activity, bg: "bg-blue-500/5", color: "text-blue-600" },
            { label: "Assets Under Management", value: `$${totalActiveCapital.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, suffix: "USD", icon: DollarSign, bg: "bg-emerald-500/5", color: "text-emerald-600" },
            { label: "Total Accrued Earnings", value: `$${totalAccruedProfit.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, suffix: "USD", icon: TrendingUp, bg: "bg-primary/5", color: "text-primary" },
          ].map((stat) => (
            <div key={stat.label} className="bg-card border border-border p-8 rounded-[2rem] shadow-sm relative overflow-hidden group hover:border-primary/20 transition-all">
               <div className={`absolute top-0 right-0 w-32 h-32 ${stat.bg} rounded-full blur-3xl`} />
               <p className="text-[10px] font-black uppercase tracking-[0.25em] text-muted-foreground mb-6 relative z-10 opacity-60">{stat.label}</p>
               <div className="flex items-end gap-3 relative z-10">
                  <p className={`text-3xl font-black ${stat.color} tabular-nums tracking-tighter`}>{stat.value}</p>
                  <span className="text-[10px] font-black text-muted-foreground/40 mb-1.5 uppercase tracking-widest">{stat.suffix}</span>
               </div>
            </div>
          ))}
        </div>


      {/* ─── Plans ─── */}
        <div className="flex items-center gap-2 pl-2">
           <h2 className="text-sm font-black uppercase tracking-[0.2em] text-foreground">Investment Strategies</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {plans.map(plan => (
            <div key={plan.id} className="bg-card border border-border/50 rounded-3xl p-6 shadow-sm relative overflow-hidden group hover:border-primary/30 transition-all">
                <div className="absolute -right-4 -bottom-4 w-20 h-20 bg-primary/5 rounded-full blur-2xl group-hover:bg-primary/10 transition-colors" />
               <div className="flex justify-between items-start mb-5 relative z-10">
                 <div>
                   <span className="px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest bg-primary/10 text-primary mb-3 inline-block border border-primary/20">{plan.category}</span>
                   <h3 className="font-black text-lg text-foreground tracking-tight">{plan.name}</h3>
                 </div>
                 <div className="flex gap-2">
                   <button onClick={() => { 
                     setEditingPlan(plan); 
                     setPlanForm({ 
                       category: plan.category || 'Forex', 
                       name: plan.name || '', 
                       roi_percentage: plan.roi_percentage?.toString() || '', 
                       duration_days: plan.duration_days?.toString() || '', 
                       min_amount: plan.min_amount?.toString() || '', 
                       max_amount: plan.max_amount?.toString() || '', 
                       is_active: plan.is_active !== false 
                     }); 
                     setShowPlanModal(true); 
                   }} className="w-10 h-10 rounded-xl bg-secondary/50 flex items-center justify-center hover:bg-primary hover:text-white transition-all text-muted-foreground shadow-sm"><Edit className="w-4 h-4" /></button>
                   <button onClick={() => handleDeletePlan(plan.id)} className="w-10 h-10 rounded-xl bg-secondary/50 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all text-muted-foreground shadow-sm"><Trash className="w-4 h-4" /></button>
                 </div>
               </div>

               <div className="space-y-4 relative z-10">
                 <div className="flex justify-between items-center pb-3 border-b border-border/30">
                   <span className="text-[10px] font-bold text-muted-foreground uppercase">Rate of Return</span>
                   <span className="font-black text-green-500 text-sm">{plan.roi_percentage}%</span>
                 </div>
                 <div className="flex justify-between items-center pb-3 border-b border-border/30">
                   <span className="text-[10px] font-bold text-muted-foreground uppercase">Tenure</span>
                   <span className="font-black text-foreground text-sm">{plan.duration_days} Days</span>
                 </div>
                 <div className="flex justify-between items-center pb-3 border-b border-border/30">
                   <span className="text-[10px] font-bold text-muted-foreground uppercase">Capital Limits</span>
                   <span className="font-black text-foreground text-xs">${plan.min_amount} - ${plan.max_amount}</span>
                 </div>
                  <div className="flex justify-between items-center pt-1">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase">Status</span>
                    <div className="flex items-center gap-2">
                       <span className={`font-black uppercase text-[10px] tracking-widest ${plan.is_active ? 'text-green-500' : 'text-red-500'}`}>{plan.is_active ? 'Active' : 'Inactive'}</span>
                    </div>
                  </div>

               </div>
            </div>
          ))}
        </div>

      {/* ─── Active User Investments ─── */}
      <div className="space-y-6">
        <div className="flex justify-between items-center pr-2 mt-12 pb-2">
           <h2 className="text-sm font-black uppercase tracking-[0.2em] text-foreground flex items-center gap-2">
              <Activity className="w-4 h-4 text-primary" /> Active Capital Ledger
           </h2>
           <span className="text-[10px] font-black text-muted-foreground/40 uppercase tracking-widest">{investments.length} Records</span>
        </div>
        
        {/* Desktop Table View */}
        <div className="hidden lg:block bg-card border border-border/50 rounded-[2rem] overflow-hidden shadow-huge">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-[10px] font-black uppercase text-muted-foreground bg-secondary/20 tracking-widest border-b border-border">
                <tr>
                  <th className="px-8 py-5">Investor Account</th>
                  <th className="px-8 py-5">Selected Strategy</th>
                  <th className="px-8 py-5 text-right">Principal Amount</th>
                  <th className="px-8 py-5 text-right">Accrued Return</th>
                  <th className="px-8 py-5">Status</th>
                  <th className="px-8 py-5 text-right">Administrative Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-border">
                {investments.map(inv => {
                  const userObj = users.find(u => u.id === inv.user_id);
                  const planData = inv.investment_plans;
                  const planName = planData?.name || plans.find(p => p.id === inv.plan_id)?.name || 'Unknown';
                  return (
                    <tr key={inv.id} className="hover:bg-primary/[0.02] transition-colors group">
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-3">
                           <div className="w-10 h-10 rounded-xl bg-gradient-gold flex items-center justify-center text-white text-xs font-black shadow-sm group-hover:scale-105 transition-transform">
                              {userObj?.name?.charAt(0) || 'U'}
                           </div>
                           <div>
                              <div className="font-black text-foreground tracking-tight text-sm">{userObj?.name || 'Unknown User'}</div>
                              <div className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-tighter mt-1 truncate max-w-[150px]">{userObj?.email || inv.user_id}</div>
                           </div>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="font-black text-primary text-sm tracking-tight">{planName}</div>
                        <div className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest mt-1.5">{inv.roi_percentage}% APY · {inv.duration_days} Day Cycle</div>
                      </td>
                      <td className="px-8 py-6 font-mono font-black text-right text-foreground">
                        ${parseFloat(inv.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-8 py-6 font-mono font-black text-green-500 text-right">
                        +${(parseFloat(inv.profit_generated) || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="px-8 py-6">
                        <span className={`px-2.5 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest border ${
                          inv.status?.toLowerCase() === 'active' ? 'bg-green-500/10 text-green-500 border-green-500/20' :
                          inv.status?.toLowerCase() === 'completed' ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' :
                          'bg-secondary text-muted-foreground border-border'
                        }`}>
                          {inv.status}
                        </span>
                      </td>
                      <td className="px-8 py-6 text-right">
                        {inv.status?.toLowerCase() === 'active' && (
                          <Button 
                            variant="hero" 
                            size="sm" 
                            className="text-[10px] font-black uppercase tracking-[0.2em] shadow-gold h-9 px-6 text-white"
                            onClick={() => handleCompleteInvestment(inv)}
                          >
                            Finalize Transaction
                          </Button>

                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Mobile Grid/Card View */}
        <div className="lg:hidden space-y-4">
           {investments.map(inv => {
             const userObj = users.find(u => u.id === inv.user_id);
             const planData = inv.investment_plans;
             const planName = planData?.name || plans.find(p => p.id === inv.plan_id)?.name || 'Unknown';
             return (
               <div key={inv.id} className="bg-card border border-border/50 rounded-3xl p-6 shadow-sm space-y-6">
                  <div className="flex items-center justify-between">
                     <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-gold flex items-center justify-center text-white text-xs font-black">
                           {userObj?.name?.charAt(0) || 'U'}
                        </div>
                        <div>
                           <div className="font-black text-foreground text-sm">{userObj?.name || 'Unknown User'}</div>
                           <div className="text-[10px] font-bold text-muted-foreground uppercase truncate max-w-[120px]">{userObj?.email}</div>
                        </div>
                     </div>
                     <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border ${
                        inv.status?.toLowerCase() === 'active' ? 'bg-green-500/10 text-green-500 border-green-500/20' :
                        'bg-blue-500/10 text-blue-500 border-blue-500/20'
                     }`}>
                        {inv.status}
                     </span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 pt-2 border-t border-border/30">
                     <div>
                        <div className="text-[10px] font-bold text-muted-foreground uppercase opacity-60 mb-1">Plan</div>
                        <div className="font-black text-primary text-xs">{planName}</div>
                     </div>
                     <div className="text-right">
                        <div className="text-[10px] font-bold text-muted-foreground uppercase opacity-60 mb-1">ROI</div>
                        <div className="font-black text-foreground text-xs">{inv.roi_percentage}% APY</div>
                     </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                     <div>
                        <div className="text-[10px] font-bold text-muted-foreground uppercase opacity-60 mb-1">Allocated</div>
                        <div className="font-black text-foreground text-sm tabular-nums">${parseFloat(inv.amount).toLocaleString()}</div>
                     </div>
                     <div className="text-right">
                        <div className="text-[10px] font-bold text-muted-foreground uppercase opacity-60 mb-1">Accrued</div>
                        <div className="font-black text-green-500 text-sm tabular-nums">+${parseFloat(inv.profit_generated || '0').toFixed(2)}</div>
                     </div>
                  </div>

                  {inv.status?.toLowerCase() === 'active' && (
                     <Button 
                       variant="hero" 
                       className="w-full text-[10px] font-black uppercase tracking-widest shadow-gold h-12 text-white"
                       onClick={() => handleCompleteInvestment(inv)}
                     >
                       Finalize & Payout
                     </Button>
                  )}
               </div>
             )
           })}
        </div>

        {investments.length === 0 && (
           <div className="py-20 text-center bg-card border border-dashed border-border rounded-3xl">
              <Activity className="w-12 h-12 text-muted-foreground opacity-20 mx-auto mb-4" />
              <p className="text-xs font-black uppercase text-muted-foreground tracking-widest">No active deployments found</p>
           </div>
        )}
      </div>

      {/* Plan Modal */}
      <Dialog open={showPlanModal} onOpenChange={setShowPlanModal}>
        <DialogContent className="sm:max-w-md bg-card border border-border shadow-huge rounded-2xl p-6">
          <DialogTitle className="text-xl font-black mb-4">
            {editingPlan ? 'Edit Investment Plan' : 'Create New Plan'}
          </DialogTitle>
          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold text-muted-foreground uppercase mb-1.5 block ml-1">Asset Category</label>
              <select 
                className="w-full bg-background border border-border rounded-xl h-11 px-4 text-sm font-bold focus:outline-none focus:border-primary transition-all"
                value={planForm.category}
                onChange={(e) => setPlanForm({...planForm, category: e.target.value})}
              >
                <option value="Forex">Forex</option>
                <option value="Crypto">Crypto</option>
                <option value="Gold">Gold</option>
                <option value="Oil">Oil</option>
                <option value="Stocks">Stocks</option>
                <option value="Bonds">Bonds</option>
              </select>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase mb-1.5 block ml-1">Plan Name</label>
                <input 
                  type="text" 
                  value={planForm.name} 
                  onChange={e => setPlanForm({...planForm, name: e.target.value})}
                  className="w-full bg-background border border-border rounded-xl h-11 px-4 text-sm font-bold" 
                />
              </div>
              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase mb-1.5 block ml-1">ROI %</label>
                <input 
                  type="number" 
                  value={planForm.roi_percentage} 
                  onChange={e => setPlanForm({...planForm, roi_percentage: e.target.value})}
                  className="w-full bg-background border border-border rounded-xl h-11 px-4 text-sm font-bold" 
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase mb-1.5 block ml-1">Duration (Days)</label>
                <input 
                  type="number" 
                  value={planForm.duration_days} 
                  onChange={e => setPlanForm({...planForm, duration_days: e.target.value})}
                  className="w-full bg-background border border-border rounded-xl h-11 px-4 text-sm font-bold" 
                />
              </div>
              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase mb-1.5 block ml-1">Status</label>
                <select 
                  className="w-full bg-background border border-border rounded-xl h-11 px-4 text-sm font-bold"
                  value={planForm.is_active ? 'active' : 'disabled'}
                  onChange={(e) => setPlanForm({...planForm, is_active: e.target.value === 'active'})}
                >
                  <option value="active">Active</option>
                  <option value="disabled">Disabled</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase mb-1.5 block ml-1">Min USD</label>
                <input 
                  type="number" 
                  value={planForm.min_amount} 
                  onChange={e => setPlanForm({...planForm, min_amount: e.target.value})}
                  className="w-full bg-background border border-border rounded-xl h-11 px-4 text-sm font-bold" 
                />
              </div>
              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase mb-1.5 block ml-1">Max USD</label>
                <input 
                  type="number" 
                  value={planForm.max_amount} 
                  onChange={e => setPlanForm({...planForm, max_amount: e.target.value})}
                  className="w-full bg-background border border-border rounded-xl h-11 px-4 text-sm font-bold" 
                />
              </div>
            </div>
            
            <Button onClick={handleSavePlan} className="w-full h-11 mt-2 text-white font-bold rounded-xl shadow-gold">
               Save Plan
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
    </AdminLayout>
  );
}
