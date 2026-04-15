import { useState, useEffect, useRef, useCallback } from "react";
import { Copy, TrendingUp, Clock, AlertTriangle, ArrowRight, ShieldCheck, CheckCircle2, ChevronRight, BarChart3, Info, Wallet, History, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useStore } from "@/store/useStore";
import { supabase } from "@/lib/supabase";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { motion } from "framer-motion";

// Modals
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const categoryIcons: Record<string, string> = {
  Forex: "💱",
  Crypto: "₿",
  Gold: "🪙",
  Oil: "🛢️",
  Stocks: "📈",
  Bonds: "🏦"
};

type Tab = "overview" | "plans" | "history";

export default function InvestmentsPage() {
  const { user } = useStore();
  const [tab, setTab] = useState<Tab>("overview");
  const [plans, setPlans] = useState<any[]>([]);
  const [investments, setInvestments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const profitTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Modal state
  const [selectedPlan, setSelectedPlan] = useState<any | null>(null);
  const [showInvestModal, setShowInvestModal] = useState(false);
  const [investAmount, setInvestAmount] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchData = useCallback(async (silent = false) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      // Trigger server-side profit calculation
      await supabase.rpc('calculate_investment_profits');

      const [plansRes, investRes] = await Promise.all([
        supabase
          .from('investment_plans')
          .select('*')
          .eq('is_active', true)
          .order('roi_percentage', { ascending: true }),
        supabase
          .from('user_investments')
          .select('*, investment_plans(name, category, description)')
          .eq('user_id', session.user.id)
          .order('created_at', { ascending: false })
      ]);

      if (plansRes.data) setPlans(plansRes.data);
      if (investRes.data) setInvestments(investRes.data);
    } catch (error) {
      if (!silent) {
        console.error("Investment fetch error:", error);
        toast.error("Could not load investment data. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();

    // Refresh profit every 60 seconds for near real-time updates
    profitTimerRef.current = setInterval(() => {
      fetchData(true);
    }, 60000);

    return () => {
      if (profitTimerRef.current) clearInterval(profitTimerRef.current);
    };
  }, [fetchData]);

  const activeInvestments = investments.filter(inv => inv.status?.toLowerCase() === 'active');
  const pastInvestments = investments.filter(inv => inv.status?.toLowerCase() !== 'active');
  
  const totalInvested = activeInvestments.reduce((sum, inv) => sum + parseFloat(inv.amount || 0), 0);
  const totalProfit = activeInvestments.reduce((sum, inv) => sum + parseFloat(inv.profit_generated || 0), 0);

  // Calculate live-interpolated profit for display
  const getLiveProfit = (inv: any) => {
    const profitGenerated = parseFloat(inv.profit_generated || 0);
    const amount = parseFloat(inv.amount || 0);
    const roi = parseFloat(inv.roi_percentage || 0);
    const durationDays = inv.duration_days || 1;
    const dailyProfit = amount * (roi / 100.0) / durationDays;
    
    // Time since last server update
    const lastUpdate = inv.last_profit_update ? new Date(inv.last_profit_update) : new Date(inv.start_date);
    const secondsSinceUpdate = (Date.now() - lastUpdate.getTime()) / 1000;
    const profitSinceUpdate = (dailyProfit / 86400) * secondsSinceUpdate;
    
    const maxProfit = amount * (roi / 100.0);
    return Math.min(profitGenerated + profitSinceUpdate, maxProfit);
  };

  // Live profit ticker
  const [tickCount, setTickCount] = useState(0);
  useEffect(() => {
    if (activeInvestments.length === 0) return;
    const ticker = setInterval(() => setTickCount(c => c + 1), 3000);
    return () => clearInterval(ticker);
  }, [activeInvestments.length]);

  const handleInvest = async () => {
    if (!selectedPlan || !investAmount || isNaN(Number(investAmount))) return;
    const amount = Number(investAmount);

    if (amount < selectedPlan.min_amount || amount > selectedPlan.max_amount) {
      toast.error(`Amount must be between $${selectedPlan.min_amount} and $${selectedPlan.max_amount}`);
      return;
    }

    setIsSubmitting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("No active session");
      
      const { data: b, error: fetchErr } = await supabase.from('balances').select('*').eq('user_id', session.user.id).single();
      if (fetchErr) throw new Error("Could not fetch balances");
      
      const cryptoBalances = b.crypto_balances || {};
      const currentUsdt = Number(cryptoBalances['usdt'] || 0);

      if (currentUsdt < amount) {
          toast.error("Insufficient USDT balance. Please deposit funds first.");
          setIsSubmitting(false);
          return;
      }

      // Deduct from USDT balance
      const updatedCrypto = { ...cryptoBalances, usdt: Math.max(0, currentUsdt - amount) };
      await supabase.from('balances').update({ crypto_balances: updatedCrypto }).eq('user_id', session.user.id);

      // Calculate end date
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + selectedPlan.duration_days);

      // Insert into user_investments with correct column names
      const { error: invErr } = await supabase.from('user_investments').insert({
        user_id: session.user.id,
        plan_id: selectedPlan.id,
        category: selectedPlan.category,
        amount: amount,
        roi_percentage: selectedPlan.roi_percentage,
        duration_days: selectedPlan.duration_days,
        status: 'Active',
        start_date: new Date().toISOString(),
        end_date: endDate.toISOString(),
        profit_generated: 0,
        last_profit_update: new Date().toISOString()
      });
      if (invErr) throw new Error("Failed to create investment record");

      // Log transaction
      await supabase.from('transactions').insert({
        user_id: session.user.id,
        type: 'Investment',
        amount: amount,
        asset: 'USDT',
        status: 'Completed'
      });

      toast.success('Investment successfully started!');
      setShowInvestModal(false);
      setInvestAmount("");
      fetchData();
      setTab("overview");
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-8 animate-in fade-in duration-500">
        
        <header className="pb-6 border-b border-border">
          <h1 className="text-3xl font-bold font-sans text-foreground">Investments</h1>
          <p className="text-muted-foreground mt-1 text-sm">Automated portfolios generating daily returns.</p>
        </header>

        {/* ─── Tabs ─── */}
        <div className="flex border-b border-border bg-secondary/10 overflow-x-auto no-scrollbar rounded-xl">
          {(["overview", "plans", "history"] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 min-w-[100px] h-12 text-[10px] font-black uppercase tracking-widest transition-all ${
                tab === t ? "bg-card text-primary border-b-2 border-primary shadow-sm" : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {tab === "overview" && (
          <div className="space-y-8">
            {/* ─── Hero Summary ─── */}
            <div className="relative overflow-hidden rounded-3xl bg-card border border-border p-8 shadow-sm">
              <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-primary/10 rounded-full blur-[80px]" />
              
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 relative z-10">
                <div className="space-y-2">
                  <div className="text-[10px] text-muted-foreground font-black uppercase tracking-widest mb-2 flex items-center gap-1.5 text-primary">
                    <ShieldCheck className="w-3.5 h-3.5" /> Total Active Capital
                  </div>
                  <h2 className="text-5xl font-black text-foreground tracking-tight">
                    ${totalInvested.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </h2>
                </div>
                
                <div className="flex gap-4">
                  <div className="p-5 rounded-2xl bg-secondary/50 border border-border min-w-[200px]">
                    <p className="text-[10px] text-green-500 font-black uppercase tracking-widest mb-2 flex items-center gap-1.5">
                      <TrendingUp className="w-3 h-3 text-green-500" /> Total Profit
                    </p>
                    <h2 className="text-2xl font-black text-green-500">
                      +${totalProfit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </h2>
                  </div>
                  <div className="p-5 rounded-2xl bg-primary/10 border border-primary/20 min-w-[150px] cursor-pointer hover:bg-primary/20 transition-colors" onClick={() => setTab("plans")}>
                    <p className="text-[10px] text-primary font-black uppercase tracking-widest mb-2">New Plan</p>
                    <h2 className="text-sm font-black text-foreground">+ Invest Now</h2>
                  </div>
                </div>
              </div>
            </div>

            {/* ─── Active Investments Section ─── */}
            {activeInvestments.length > 0 ? (
              <div className="space-y-4">
                 <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest pl-1">Your Active Portfolios</h3>
                 
                 <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
                   {activeInvestments.map(inv => {
                      const planData = inv.investment_plans;
                      const planName = planData?.name || plans.find(p => p.id === inv.plan_id)?.name || 'Investment';
                      const planCategory = planData?.category || plans.find(p => p.id === inv.plan_id)?.category || 'General';
                      const amount = parseFloat(inv.amount || 0);
                      const roi = parseFloat(inv.roi_percentage || 0);
                      const maxProfit = amount * (roi / 100);
                      const liveProfit = getLiveProfit(inv);
                      const progressPercentage = maxProfit > 0 ? Math.min(100, (liveProfit / maxProfit) * 100) : 0;

                      // Days remaining
                      const endDate = new Date(inv.end_date);
                      const now = new Date();
                      const daysRemaining = Math.max(0, Math.ceil((endDate.getTime() - now.getTime()) / 86400000));

                      return (
                       <div key={inv.id} className="p-6 rounded-2xl bg-card border border-border shadow-sm hover:border-primary/30 transition-all relative overflow-hidden group">
                         <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-bl-full pointer-events-none" />
                         
                         <div className="flex justify-between items-start mb-5">
                           <div className="flex items-center gap-4">
                             <div className="w-12 h-12 rounded-xl bg-orange-500/10 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                                {categoryIcons[planCategory] || "📊"}
                             </div>
                             <div>
                               <h3 className="font-bold text-foreground text-sm uppercase tracking-wider">{planName}</h3>
                               <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest mt-1 text-primary">{roi}% ROI · {inv.duration_days} Days</p>
                             </div>
                           </div>
                           <span className="text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-md bg-green-500/10 text-green-500 border border-green-500/20">Active</span>
                         </div>

                         <div className="space-y-4">
                           <div className="flex justify-between items-end border-b border-border/50 pb-4">
                              <div className="space-y-1">
                                <p className="text-[10px] text-muted-foreground font-black uppercase">Capital Locked</p>
                                <p className="font-black text-lg text-foreground">${amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                              </div>
                              <div className="text-right space-y-1">
                                <p className="text-[10px] text-green-500 font-black uppercase flex items-center gap-1 justify-end"><TrendingUp className="w-3 h-3" /> Profit Generated</p>
                                <p className="font-black text-lg text-green-500 tabular-nums">+${liveProfit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                              </div>
                           </div>

                           <div>
                              <div className="flex justify-between items-center mb-2 text-[10px] font-black uppercase tracking-widest">
                                 <span className="text-muted-foreground">{daysRemaining > 0 ? `${daysRemaining} Days Left` : 'Completing...'}</span>
                                 <span className="text-primary">{progressPercentage.toFixed(1)}% Earned</span>
                              </div>
                              <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
                                 <motion.div 
                                   className="h-full bg-primary rounded-full" 
                                   initial={{ width: 0 }}
                                   animate={{ width: `${progressPercentage}%` }}
                                   transition={{ duration: 1, ease: "easeOut" }}
                                 />
                              </div>
                           </div>
                         </div>
                       </div>
                     )
                   })}
                 </div>
              </div>
            ) : (
              <div className="py-24 text-center bg-card rounded-3xl border border-border">
                  <div className="w-16 h-16 rounded-2xl bg-secondary/30 flex items-center justify-center mx-auto mb-4 border border-border/50">
                     <Wallet className="w-8 h-8 text-muted-foreground/30" />
                  </div>
                  <p className="text-sm font-bold text-muted-foreground">You have no active investments.</p>
                  <p className="text-xs text-muted-foreground/50 mt-1 uppercase tracking-widest font-medium">Head to the Plans tab to start earning.</p>
                  <Button className="mt-6" onClick={() => setTab('plans')}>View Investment Plans</Button>
              </div>
            )}
          </div>
        )}

        {tab === "plans" && (
          <div>
            {plans.length === 0 ? (
              <div className="py-24 text-center bg-card rounded-3xl border border-border">
                  <div className="w-16 h-16 rounded-2xl bg-secondary/30 flex items-center justify-center mx-auto mb-4 border border-border/50">
                     <History className="w-8 h-8 text-muted-foreground/30" />
                  </div>
                  <p className="text-sm font-bold text-muted-foreground">No investment plans available at the moment.</p>
                  <p className="text-xs text-muted-foreground/50 mt-1 uppercase tracking-widest font-medium">Please check back later or contact support.</p>
                  <Button variant="outline" className="mt-6 font-bold" onClick={() => fetchData()}>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Refresh Service
                  </Button>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {plans.map(plan => (
                  <motion.div
                    key={plan.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-card rounded-3xl border border-border shadow-sm flex flex-col group hover:border-primary/40 transition-all hover:shadow-md cursor-pointer relative overflow-hidden"
                  >
                    <div className="p-6 border-b border-border bg-secondary/20 flex flex-col items-center text-center">
                       <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-2xl mb-3 group-hover:scale-110 transition-all">
                          {categoryIcons[plan.category] || "📊"}
                       </div>
                       <span className="px-2 py-0.5 rounded-full bg-foreground/10 text-[9px] font-black uppercase tracking-widest mb-1">{plan.category}</span>
                       <h3 className="text-lg font-black text-foreground">{plan.name}</h3>
                       <p className="text-2xl font-black text-primary mt-1">
                         {plan.roi_percentage}% <span className="text-xs text-muted-foreground font-semibold uppercase">ROI</span>
                       </p>
                    </div>

                    <div className="p-6 flex-1 flex flex-col">
                      <div className="space-y-3 mb-6">
                        <div className="flex justify-between text-xs">
                          <span className="text-muted-foreground font-black uppercase tracking-widest">Duration</span>
                          <span className="font-bold text-foreground">{plan.duration_days} Days</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-muted-foreground font-black uppercase tracking-widest">Min Entry</span>
                          <span className="font-bold text-foreground tracking-tighter">${plan.min_amount.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-muted-foreground font-black uppercase tracking-widest">Max Entry</span>
                          <span className="font-bold text-foreground tracking-tighter">${plan.max_amount.toLocaleString()}</span>
                        </div>
                      </div>

                      <Button 
                        className="w-full h-12 rounded-xl font-bold uppercase text-[10px] tracking-widest mt-auto group-hover:shadow-gold"
                        onClick={() => {
                          setSelectedPlan(plan);
                          setInvestAmount(plan.min_amount.toString());
                          setShowInvestModal(true);
                        }}
                      >
                        Invest Now <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === "history" && (
           <div className="space-y-6">
              {pastInvestments.length === 0 ? (
                <div className="py-24 text-center bg-card rounded-3xl border border-border">
                   <div className="w-16 h-16 rounded-2xl bg-secondary/30 flex items-center justify-center mx-auto mb-4 border border-border/50">
                      <Clock className="w-8 h-8 text-muted-foreground/30" />
                   </div>
                   <p className="text-sm font-bold text-muted-foreground">No historical records found.</p>
                   <p className="text-xs text-muted-foreground/50 mt-1 uppercase tracking-widest font-medium">Completed investments will appear here.</p>
                </div>
              ) : (
                <div className="bg-card border border-border rounded-3xl overflow-hidden shadow-sm">
                   <table className="w-full text-sm">
                     <thead className="bg-secondary/30 text-[10px] font-black uppercase text-muted-foreground tracking-widest text-left">
                       <tr>
                          <th className="px-6 py-4">Plan</th>
                          <th className="px-6 py-4 text-right">Investment</th>
                          <th className="px-6 py-4 text-right">Returns</th>
                          <th className="px-6 py-4">Status</th>
                       </tr>
                     </thead>
                     <tbody className="divide-y divide-border">
                        {pastInvestments.map(inv => {
                          const planData = inv.investment_plans;
                          const planName = planData?.name || 'Investment';
                          const planCategory = planData?.category || 'General';
                          return (
                            <tr key={inv.id} className="hover:bg-muted/5 transition-colors group">
                               <td className="px-6 py-4">
                                  <div className="font-bold text-foreground text-sm uppercase tracking-wider">{planName}</div>
                                  <div className="text-[10px] text-muted-foreground uppercase font-black tracking-widest mt-1 text-primary">{inv.roi_percentage}% ROI · {inv.duration_days} Days</div>
                               </td>
                               <td className="px-6 py-4 font-mono font-black text-right text-muted-foreground">
                                  ${parseFloat(inv.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                               </td>
                               <td className="px-6 py-4 font-mono font-black text-green-500 text-right">
                                  +${(parseFloat(inv.profit_generated) || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                               </td>
                               <td className="px-6 py-4">
                                  <span className={`px-2.5 py-1 rounded-md text-[9px] font-black uppercase tracking-widest ${
                                    inv.status?.toLowerCase() === 'completed' 
                                      ? 'bg-green-500/10 text-green-500 border border-green-500/20' 
                                      : 'bg-blue-500/10 text-blue-500 border border-blue-500/20'
                                  }`}>
                                     {inv.status}
                                  </span>
                               </td>
                            </tr>
                          );
                        })}
                     </tbody>
                   </table>
                </div>
              )}
           </div>
        )}

      {/* ─── Invest Modal ─── */}
      <Dialog open={showInvestModal} onOpenChange={setShowInvestModal}>
        <DialogContent className="sm:max-w-md rounded-3xl border border-border bg-card shadow-huge overflow-hidden p-0">
          <div className="p-6 bg-secondary/30 border-b border-border text-center relative overflow-hidden">
             <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-primary/50 via-primary to-primary/50" />
             <DialogTitle className="text-xl font-black">Start Investment</DialogTitle>
             <DialogDescription className="text-xs font-medium uppercase tracking-widest mt-2">{selectedPlan?.name} — {selectedPlan?.roi_percentage}% ROI</DialogDescription>
          </div>

          <div className="p-6 space-y-6">
            
            <div className="p-4 rounded-xl bg-orange-500/10 border border-orange-500/20 flex gap-3 text-orange-600">
               <Info className="w-5 h-5 shrink-0" />
               <p className="text-xs font-medium">
                 Your principal amount will be locked for the duration of <strong>{selectedPlan?.duration_days} days</strong>. Profit accumulates daily and total returns will be credited automatically at the end of the term.
               </p>
            </div>

            <div className="space-y-2 relative">
              <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest ml-1">Investment Amount (USDT)</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-bold">$</span>
                <input
                  type="number"
                  value={investAmount}
                  onChange={(e) => setInvestAmount(e.target.value)}
                  className="w-full bg-background border border-border rounded-xl h-14 pl-8 pr-20 text-sm font-bold text-foreground focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all font-mono"
                  placeholder="0.00"
                />
                <button 
                  onClick={() => setInvestAmount(selectedPlan?.max_amount.toString() || "")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1.5 rounded-lg bg-secondary text-[10px] font-black uppercase tracking-widest hover:text-primary transition-colors"
                >
                  Max
                </button>
              </div>
              <p className="text-xs text-muted-foreground/60 text-right mt-1 font-medium">Limits: ${selectedPlan?.min_amount} - ${selectedPlan?.max_amount}</p>
            </div>

            <div className="p-5 rounded-2xl bg-secondary/30 mt-4 border border-border space-y-3">
               <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground font-medium">Expected Profit:</span>
                  <span className="font-black text-green-500 text-lg">
                    +${(parseFloat(investAmount || "0") * ((selectedPlan?.roi_percentage || 0)/100)).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                  </span>
               </div>
               <div className="flex justify-between items-center text-xs">
                  <span className="text-muted-foreground font-medium">Daily Return:</span>
                  <span className="font-bold text-foreground">
                    ~${((parseFloat(investAmount || "0") * ((selectedPlan?.roi_percentage || 0)/100)) / (selectedPlan?.duration_days || 1)).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 4})}/day
                  </span>
               </div>
               <div className="flex justify-between items-center text-xs">
                  <span className="text-muted-foreground font-medium">Total Return:</span>
                  <span className="font-bold text-foreground">
                    ${(parseFloat(investAmount || "0") + (parseFloat(investAmount || "0") * ((selectedPlan?.roi_percentage || 0)/100))).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                  </span>
               </div>
            </div>

            <Button 
                onClick={handleInvest} 
                className="w-full h-14 rounded-2xl text-sm font-black uppercase tracking-widest shadow-gold text-white"
                disabled={isSubmitting || !investAmount}
            >
                {isSubmitting ? "Processing..." : "Confirm Investment"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
    </DashboardLayout>
  );
}
