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
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-card p-6 rounded-2xl border border-border shadow-sm">
        <div>
          <h1 className="text-2xl font-black text-foreground">Investment Management</h1>
          <p className="text-muted-foreground text-sm font-medium mt-1">Manage plans, monitor active capital, and oversee the ROI engine.</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={fetchData} className="font-bold rounded-xl">
            <RefreshCw className="w-4 h-4 mr-2" /> Refresh
          </Button>
          <Button 
            onClick={() => {
              setEditingPlan(null);
              setPlanForm({ category: 'Forex', name: '', roi_percentage: '', duration_days: '', min_amount: '', max_amount: '', is_active: true });
              setShowPlanModal(true);
            }}
            className="font-bold rounded-xl shadow-sm text-white"
          >
            <Plus className="w-4 h-4 mr-2" /> Add Plan
          </Button>
        </div>
      </div>

      {/* ─── Summary Cards ─── */}
      <div className="grid sm:grid-cols-3 gap-4">
        <div className="bg-card border border-border rounded-2xl p-5">
          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2">Active Investments</p>
          <p className="text-2xl font-black text-foreground">{activeInvestments.length}</p>
        </div>
        <div className="bg-card border border-border rounded-2xl p-5">
          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2">Total Active Capital</p>
          <p className="text-2xl font-black text-foreground">${totalActiveCapital.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
        </div>
        <div className="bg-card border border-border rounded-2xl p-5">
          <p className="text-[10px] font-black uppercase tracking-widest text-green-500 mb-2">Total Accrued Profit</p>
          <p className="text-2xl font-black text-green-500">+${totalAccruedProfit.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
        </div>
      </div>

      {/* ─── Plans ─── */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-foreground pl-2">Investment Plans</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {plans.map(plan => (
            <div key={plan.id} className="bg-card border border-border rounded-2xl p-6 shadow-sm relative overflow-hidden group">
               <div className="flex justify-between items-start mb-4">
                 <div>
                   <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest bg-primary/10 text-primary mb-2 inline-block shadow-sm">{plan.category}</span>
                   <h3 className="font-black text-lg text-foreground">{plan.name}</h3>
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
                   }} className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center hover:bg-primary/20 transition-all text-muted-foreground hover:text-primary"><Edit className="w-4 h-4" /></button>
                   <button onClick={() => handleDeletePlan(plan.id)} className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center hover:bg-red-500/20 transition-all text-muted-foreground hover:text-red-500"><Trash className="w-4 h-4" /></button>
                 </div>
               </div>

               <div className="space-y-2 text-sm">
                 <div className="flex justify-between pb-2 border-b border-border/50">
                   <span className="text-muted-foreground">ROI</span>
                   <span className="font-black text-green-500">{plan.roi_percentage}%</span>
                 </div>
                 <div className="flex justify-between pb-2 border-b border-border/50">
                   <span className="text-muted-foreground">Duration</span>
                   <span className="font-bold">{plan.duration_days} Days</span>
                 </div>
                 <div className="flex justify-between pb-2 border-b border-border/50">
                   <span className="text-muted-foreground">Limits</span>
                   <span className="font-bold">${plan.min_amount} - ${plan.max_amount}</span>
                 </div>
                 <div className="flex justify-between pt-1">
                   <span className="text-muted-foreground">Status</span>
                   <span className={`font-black uppercase text-[10px] tracking-widest ${plan.is_active ? 'text-green-500' : 'text-red-500'}`}>{plan.is_active ? 'Active' : 'Disabled'}</span>
                 </div>
               </div>
            </div>
          ))}
        </div>
      </div>

      {/* ─── Active User Investments ─── */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-foreground pl-2 mt-8">Investments Ledger</h2>
        <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-[10px] font-black uppercase text-muted-foreground bg-secondary/30">
                <tr>
                  <th className="px-6 py-4">User</th>
                  <th className="px-6 py-4">Plan</th>
                  <th className="px-6 py-4 text-right">Amount</th>
                  <th className="px-6 py-4 text-right">Profit</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 pr-8 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {investments.map(inv => {
                  const userObj = users.find(u => u.id === inv.user_id);
                  const planData = inv.investment_plans;
                  const planName = planData?.name || plans.find(p => p.id === inv.plan_id)?.name || 'Unknown';
                  const planCategory = planData?.category || '';
                  return (
                    <tr key={inv.id} className="hover:bg-muted/5 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="font-bold text-foreground">{userObj?.name || 'Unknown User'}</div>
                        <div className="text-[10px] text-muted-foreground mt-0.5">{userObj?.email || inv.user_id}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-bold text-primary">{planName}</div>
                        <div className="text-[10px] text-muted-foreground uppercase tracking-widest mt-0.5">{inv.roi_percentage}% ROI · {inv.duration_days} Days</div>
                      </td>
                      <td className="px-6 py-4 font-mono font-black text-right">
                        ${parseFloat(inv.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-6 py-4 font-mono font-black text-green-500 text-right">
                        +${(parseFloat(inv.profit_generated) || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-widest ${
                          inv.status?.toLowerCase() === 'active' ? 'bg-green-500/10 text-green-500 border border-green-500/20' :
                          inv.status?.toLowerCase() === 'completed' ? 'bg-blue-500/10 text-blue-500 border border-blue-500/20' :
                          'bg-secondary text-muted-foreground'
                        }`}>
                          {inv.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 pr-8 text-right">
                        {inv.status?.toLowerCase() === 'active' && (
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="text-xs font-bold shadow-sm"
                            onClick={() => handleCompleteInvestment(inv)}
                          >
                            Complete & Payout
                          </Button>
                        )}
                      </td>
                    </tr>
                  )
                })}
                {investments.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground text-sm font-medium">
                      No investments found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
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
