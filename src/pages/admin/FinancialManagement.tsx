import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import AdminLayout from "@/components/layouts/AdminLayout";
import { Button } from "@/components/ui/button";
import {
  ArrowUpRight, Download, Send, DollarSign, Wallet, Copy, ExternalLink,
  AlertTriangle, CheckCircle2, XCircle, Search, Filter, ShieldAlert, Zap, Globe, Activity, TrendingUp, History, Coins, Landmark, CreditCard, Lock, RefreshCw, Clock, ArrowRight
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useStore } from "@/store/useStore";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { supabase } from "@/lib/supabase";
import { Badge } from "@/components/ui/badge";



type Tab = "withdrawals" | "deposits" | "card_deposits" | "purchase" | "fees" | "wallets" | "alerts";

const suspiciousActivity = [
  { user: "john.doe@email.com", detail: "Multiple failed login attempts from unknown locations", severity: "CRITICAL", time: "2m ago", ip: "185.212.14.8" },
  { user: "trader_882", detail: "Withdrawal amount exceeds 24-hour limit", severity: "WARN", time: "15m ago", ip: "45.12.98.211" },
  { user: "unverified_user", detail: "Large deposit followed by immediate withdrawal request", severity: "CRITICAL", time: "1h ago", ip: "103.44.1.92" },
];

const FinancialManagement = () => {
  const [tab, setTab] = useState<Tab>("withdrawals");
  const [isLoading, setIsLoading] = useState(false);
  const { formatCurrency } = useStore();
  const [transactions, setTransactions] = useState<any[]>([]);
  const [depositWallets, setDepositWallets] = useState<any[]>([]);
  const [feeLedgerTotal, setFeeLedgerTotal] = useState(0);
  const [isAddingWallet, setIsAddingWallet] = useState(false);
  const [newWallet, setNewWallet] = useState({ coin: '', network: '', address: '' });
  const [platformSettings, setPlatformSettings] = useState({
    fee: 2.0,
    minWithdrawal: 10,
    maxWithdrawal: 50000
  });
  const [notifications, setNotifications] = useState<any[]>([]);

  const [cardDeposits, setCardDeposits] = useState<any[]>([]);
  const [selectedCard, setSelectedCard] = useState<any | null>(null);
  const [viewingCardDetails, setViewingCardDetails] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const responses = await Promise.all([
        supabase.from('transactions').select('*, profiles(name)').order('created_at', { ascending: false }),
        supabase.from('deposit_wallets').select('*').eq('status', 'Active'),
        supabase.from('platform_settings').select('*').single(),
        supabase.from('fee_ledger').select('fee_amount'),
        supabase.from('card_deposits').select('*, profiles(name)').order('created_at', { ascending: false }),
        supabase.from('notifications').select('*').is('user_id', null).order('created_at', { ascending: false }).limit(50)
      ]);
      
      const txData = responses[0].data;
      const walletData = responses[1].data;
      const settingsData = responses[2].data;
      const ledgerData = responses[3].data;
      const cardData = responses[4].data;
      const notifData = responses[5].data;
      
      if (txData) setTransactions(txData);
      if (walletData) setDepositWallets(walletData);
      if (cardData) setCardDeposits(cardData);
      if (notifData) setNotifications(notifData);
      if (ledgerData) {
        const total = (ledgerData as any[]).reduce((acc, curr) => acc + (Number(curr.fee_amount) || 0), 0);
        setFeeLedgerTotal(total);
      }
      if (settingsData) {
        setPlatformSettings({
          fee: settingsData.platformFeePercent || 2.0,
          minWithdrawal: settingsData.minWithdrawalAmount || 10,
          maxWithdrawal: settingsData.maxWithdrawalAmount || 50000
        });
      }
    } catch (err) {
      console.error("Fetch Data Error:", err);
    }
  }, []);

  useEffect(() => {
    fetchData();

    const txSub = supabase
      .channel('financial-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'transactions' },
        () => fetchData()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'card_deposits' },
        () => fetchData()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'fee_ledger' },
        () => fetchData()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'notifications' },
        () => fetchData()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(txSub);
    };
  }, [fetchData]);

  const withdrawals = transactions.filter(t => t.type === 'Withdrawal');
  const deposits = transactions.filter(t => t.type === 'Deposit' && !t.external_id?.startsWith('BUY_') && !t.external_id?.startsWith('CARD_DEP_'));
  const buyTransactions = transactions.filter(t => t.type === 'Deposit' && t.external_id?.startsWith('BUY_'));

  const totalDeposited = deposits.reduce((s, t) => s + (parseFloat(t.amount) || 0), 0);
  const totalWithdrawn = withdrawals.reduce((s, t) => s + Math.abs(parseFloat(t.amount) || 0), 0);

  const stats = [
    { label: "Total Deposits", value: formatCurrency(totalDeposited), change: "+18.3%", icon: Download, color: "text-primary", bg: "bg-primary/10", glow: "shadow-glow" },
    { label: "Total Withdrawals", value: formatCurrency(totalWithdrawn), change: "+9.1%", icon: Send, color: "text-red-500", bg: "bg-red-500/10", glow: "shadow-glow-loss" },
    { label: "Platform Revenue", value: formatCurrency(feeLedgerTotal), change: "Lifetime", icon: DollarSign, color: "text-primary", bg: "bg-primary/10", glow: "shadow-glow" },
    { label: "Net Balance", value: formatCurrency(totalDeposited - totalWithdrawn), change: "+24.7%", icon: Wallet, color: "text-blue-500", bg: "bg-blue-500/10", glow: "shadow-glow" },
  ];

  const handleAction = async (id: string, action: "Completed" | "Rejected") => {
    try {
      if (action === "Completed") {
        const tx = transactions.find(t => t.id === id);
        if (tx && tx.status !== 'Completed') {
           const isDeposit = tx.type === 'Deposit';
           const amount = parseFloat(tx.amount || 0);

           const { data: userBalance } = await supabase.from('balances').select('*').eq('user_id', tx.user_id).maybeSingle();
           
           const isFiat = ['USD', 'EUR', 'GBP'].includes(tx.asset?.toUpperCase());
           let updateData: any = { user_id: tx.user_id };

           if (isFiat) {
             const current = userBalance?.fiat_balance || 0;
             updateData.fiat_balance = isDeposit ? current + amount : current - amount;
           } else {
             const cryptoBalances = userBalance?.crypto_balances || {};
             const asset = tx.asset?.toUpperCase() || 'BTC';
             const current = cryptoBalances[asset] || 0;
             
             const feePercent = platformSettings.fee || 0;
             const feeAmount = parseFloat((amount * (feePercent / 100)).toFixed(8));
             const netAmount = parseFloat((amount - feeAmount).toFixed(8));

             const actualDiff = isDeposit ? netAmount : -amount;
             updateData.crypto_balances = { ...cryptoBalances, [asset]: current + actualDiff };

             if (isDeposit && feeAmount > 0) {
                 await supabase.from('fee_ledger').insert([{
                     transaction_id: tx.id,
                     user_id: tx.user_id,
                     gross_amount: amount,
                     fee_percent: feePercent,
                     fee_amount: feeAmount,
                     net_amount: netAmount,
                     asset: asset
                 }]);
             }
           }
           
           if (userBalance) {
               await supabase.from('balances').update(updateData).eq('user_id', tx.user_id);
           } else {
               await supabase.from('balances').insert([updateData]);
           }
        }
      }
      
      const { error } = await supabase.from('transactions').update({ status: action }).eq('id', id);
      if (error) throw error;
      
      toast.success(`Transaction ${action.toLowerCase()}`, { description: `ID: ${id.substring(0, 12)}...` });
      fetchData();
    } catch (error: any) {
      toast.error("Action failed: " + error.message);
    }
  };

  const handleCardAction = async (id: string, action: "Completed" | "Rejected") => {
    try {
      const cardRecord = cardDeposits.find(c => c.id === id);
      if (!cardRecord) return;

      // Update related transaction if it exists
      const relatedTx = transactions.find(t => t.external_id && t.external_id.includes(`CARD_DEP_`) && t.user_id === cardRecord.user_id && Math.abs(parseFloat(t.amount) - cardRecord.amount) < 0.01);
      
      if (relatedTx) {
          await handleAction(relatedTx.id, action);
      } else {
          // If no related tx found, just update the card deposit status
          const { error: cardUpdError } = await supabase.from('card_deposits').update({ status: action }).eq('id', id);
          if (cardUpdError) throw cardUpdError;
      }

      toast.success(`Card deposit ${action.toLowerCase()}`);
      fetchData();
    } catch (error: any) {
      toast.error("Action failed: " + error.message);
    }
  };

  const handleAddWallet = async () => {
    if (!newWallet.coin || !newWallet.address) { 
      toast.error("Required Fields Missing", { description: "Please provide both Coin Name and Wallet Address." }); 
      return; 
    }
    
    toast.loading("Adding wallet...", { id: 'wallet-add' });
    
    const { error } = await supabase
      .from('deposit_wallets')
      .insert([{
        coin: newWallet.coin.toUpperCase(),
        network: newWallet.network || 'SYSTEM',
        address: newWallet.address,
        status: 'Active'
      }]);

    if (error) { 
      console.error("Wallet Add Error:", error);
      toast.error("Action Failed", { id: 'wallet-add', description: error.message || "Could not save wallet." }); 
      return; 
    }
    
    setIsAddingWallet(false);
    setNewWallet({ coin: '', network: '', address: '' });
    toast.success("Wallet Added", { id: 'wallet-add', description: `${newWallet.coin} wallet is now available for all users.` });
    fetchData();
  };

  const handleUpdateSettings = async () => {
    toast.loading("Updating settings...", { id: 'settings' });
    
    const { error } = await supabase
      .from('platform_settings')
      .upsert({
        id: 1, // Global settings record
        platformFeePercent: platformSettings.fee,
        minWithdrawalAmount: platformSettings.minWithdrawal,
        maxWithdrawalAmount: platformSettings.maxWithdrawal
      });

    if (error) {
      toast.error("Error", { id: 'settings', description: error.message });
    } else {
      toast.success("Settings Updated", { id: 'settings' });
    }
  };

  const handleDeleteWallet = async (id: string) => {
    const { error } = await supabase.from('deposit_wallets').update({ status: 'Inactive' }).eq('id', id);
    if (error) { toast.error("Failed to remove wallet"); return; }
    toast.success("Wallet removed");
    fetchData();
  };

  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* Institutional Header */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-border">
          <div className="space-y-1">
            <h1 className="text-3xl font-black text-foreground tracking-tight uppercase">Liquidity & Treasury Oversight</h1>
            <p className="text-muted-foreground text-sm font-medium">Oversee platform capital flows, authorize disbursements, and manage settlement configurations.</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
             <Button variant="outline" className="h-11 border-border text-[10px] font-black uppercase tracking-[0.2em] px-6 hover:bg-secondary rounded-xl transition-all group" onClick={fetchData}>
                <RefreshCw className={`w-4 h-4 mr-2 group-hover:rotate-180 transition-transform duration-500 ${isLoading ? 'animate-spin' : ''}`} /> Refresh Records
             </Button>
             <Button variant="hero" className="h-11 text-[10px] font-black uppercase tracking-[0.2em] px-8 shadow-gold text-white rounded-xl transition-all">
                Perform Reconciliation
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
              className="bg-card p-6 rounded-3xl border border-border shadow-sm hover:shadow-md transition-shadow group relative overflow-hidden"
            >
              <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-primary/5 rounded-full blur-2xl group-hover:bg-primary/10 transition-colors" />
              <div className="flex items-center justify-between mb-5 relative z-10">
                <div className={`p-3 rounded-2xl ${stat.bg} ${stat.color} group-hover:scale-110 transition-transform`}>
                   <stat.icon className="w-5 h-5" />
                </div>
                <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1 bg-secondary/50 px-2 py-1 rounded-lg border border-border">
                  {stat.change}
                </div>
              </div>
              <div className="relative z-10">
                <div className="text-2xl font-black text-foreground tracking-tight mb-0.5 tabular-nums">{stat.value}</div>
                <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-tighter">{stat.label}</div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Data Interface */}
        <div className="bg-card rounded-[2.5rem] border border-border shadow-huge overflow-hidden">
          <div className="p-4 sm:p-8 border-b border-border bg-secondary/10">
            <div className="flex flex-col xl:flex-row items-center justify-between gap-8">
              <div className="flex items-center gap-1 overflow-x-auto no-scrollbar w-full pb-2 xl:pb-0">
                {(["withdrawals", "deposits", "card_deposits", "purchase", "fees", "wallets", "alerts"] as Tab[]).map((t) => (
                  <button
                    key={t}
                    onClick={() => setTab(t)}
                    className={`px-6 py-4 text-[10px] font-black uppercase transition-all tracking-[0.2em] relative whitespace-nowrap group ${
                      tab === t ? "text-primary" : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <span className="relative z-10">{t.replace('_', ' ')}</span>
                    {tab === t && (
                      <motion.div layoutId="nav-pill" className="absolute inset-0 bg-primary/10 rounded-xl" />
                    )}
                    {tab === t && (
                      <motion.div layoutId="nav-line" className="absolute bottom-0 left-6 right-6 h-0.5 bg-primary" />
                    )}
                    {(t === "alerts" && notifications.some(n => !n.is_read)) && (
                       <span className="absolute top-3 right-3 w-2 h-2 rounded-full bg-red-500 shadow-glow-loss animate-pulse" />
                    )}
                  </button>
                ))}
              </div>
              
              <div className="flex items-center gap-4 w-full xl:w-auto">
                  <div className="relative flex-1 xl:w-80 group">
                     <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/30 group-focus-within:text-primary transition-colors" />
                     <Input placeholder="Filter entries..." className="h-14 bg-background border-border rounded-2xl pl-14 text-[11px] font-bold uppercase tracking-widest placeholder:opacity-50 focus:ring-1 focus:ring-primary/20" />
                  </div>
                  <Button variant="outline" className="h-14 w-14 border-border rounded-2xl bg-background hover:bg-secondary p-0">
                     <Filter className="w-4 h-4" />
                  </Button>
              </div>
            </div>
          </div>

          <div className="p-4 sm:p-8">
            <AnimatePresence mode="wait">
              {tab === "withdrawals" && (
                <motion.div 
                   key="withdrawals" 
                   initial={{ opacity: 0, y: 10 }} 
                   animate={{ opacity: 1, y: 0 }} 
                   exit={{ opacity: 0, y: -10 }}
                   className="space-y-6"
                >
                  <div className="hidden lg:block overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 bg-secondary/20 border-b border-border">
                          <th className="text-left py-6 pl-8">Client Information</th>
                          <th className="text-left py-6 px-4">Asset Type</th>
                          <th className="text-left py-6 px-4">Valuation</th>
                          <th className="text-center py-6 px-4">Status</th>
                          <th className="text-right py-6 pr-8">Actions</th>
                        </tr>
                      </thead>

                      <tbody className="divide-y divide-border/50">
                        {withdrawals.length === 0 ? (
                          <tr><td colSpan={5} className="py-24 text-center text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground opacity-20">Processing Queue Empty</td></tr>

                        ) : withdrawals.map((w) => (
                          <tr key={w.id} className="group/row hover:bg-secondary/20 transition-all">
                             <td className="py-6 pl-4">
                                <div className="flex items-center gap-4">
                                   <div className="w-12 h-12 rounded-2xl bg-card border border-border flex items-center justify-center group-hover/row:scale-110 transition-transform shadow-sm">
                                      <Globe className="w-5 h-5 text-muted-foreground/40" />
                                   </div>
                                   <div>
                                      <div className="text-sm font-black text-foreground uppercase tracking-tight">{w.profiles?.name || "Anonymous Member"}</div>
                                      <div className="text-[10px] font-black text-muted-foreground/40 uppercase tracking-widest mt-1 tabular-nums">REF: {w.id.substring(0, 12)}</div>
                                   </div>
                                </div>
                             </td>
                             <td className="py-6">
                                <div className="flex items-center gap-2 text-sm font-black text-foreground tabular-nums">
                                   <div className="w-1.5 h-1.5 rounded-full bg-red-500 shadow-glow-loss" />
                                   {w.amount} {w.asset || "USD"}
                                </div>
                                <div className="text-[9px] font-black text-red-500/60 uppercase tracking-widest mt-1">Debit Directive</div>
                             </td>
                             <td className="py-6">
                                <span className="text-sm font-black text-foreground tabular-nums">{formatCurrency(w.amount)}</span>
                                <div className="text-[9px] font-black text-muted-foreground/40 uppercase tracking-widest mt-1">Settlement EQV</div>
                             </td>
                             <td className="py-6">
                                <Badge className={`text-[9px] font-black uppercase tracking-[0.15em] border inline-flex items-center gap-2 px-3 py-1 ${
                                   w.status === "Pending" ? "bg-amber-500/10 text-amber-500 border-amber-500/20" : 
                                   w.status === "Completed" ? "bg-green-500/10 text-green-500 border-green-500/20" : 
                                   "bg-red-500/10 text-red-500 border-red-500/20"
                                }`}>
                                   {w.status === "Pending" ? <Clock className="w-3.5 h-3.5 animate-pulse" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                                   {w.status}
                                </Badge>
                             </td>
                             <td className="py-6 pr-8 text-right">
                                {w.status === "Pending" ? (
                                   <div className="flex justify-end gap-3">
                                      <Button onClick={() => handleAction(w.id, 'Completed')} className="h-9 px-6 bg-primary text-white text-[9px] font-black uppercase tracking-[0.2em] rounded-xl shadow-gold hover:scale-105 transition-transform active:scale-95">
                                         Approve
                                      </Button>
                                      <Button onClick={() => handleAction(w.id, 'Rejected')} variant="outline" className="h-9 px-6 border-border text-[9px] font-black uppercase tracking-[0.2em] rounded-xl hover:bg-secondary transition-colors">
                                         Decline
                                      </Button>
                                   </div>
                                ) : (
                                   <div className="text-right text-[10px] font-black text-muted-foreground/30 uppercase tracking-[0.2em]">Settled</div>
                                )}
                             </td>

                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile Cards */}
                  <div className="lg:hidden space-y-4">
                      {withdrawals.length === 0 ? (
                          <div className="py-20 text-center border-4 border-dashed border-border rounded-[2.5rem] bg-secondary/5">
                             <div className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em] opacity-40">Queue Purged</div>
                          </div>
                      ) : withdrawals.map((w) => (
                          <div key={w.id} className="p-8 rounded-[2.5rem] bg-secondary/10 border border-border space-y-8 relative overflow-hidden group">
                              <div className="flex justify-between items-start relative z-10">
                                  <div className="flex items-center gap-4">
                                      <div className="w-12 h-12 rounded-2xl bg-card border border-border flex items-center justify-center">
                                          <ArrowUpRight className="w-6 h-6 text-red-500" />
                                      </div>
                                      <div>
                                          <div className="text-sm font-black text-foreground uppercase tracking-tight">{w.profiles?.name || "Member"}</div>
                                          <div className="text-[9px] font-black text-muted-foreground/40 uppercase tracking-widest mt-1 tabular-nums">ID: {w.id.substring(0, 12)}</div>
                                      </div>
                                  </div>
                                  <Badge className="text-[8px] font-black uppercase tracking-widest bg-amber-500/10 text-amber-500 border-amber-500/20">{w.status}</Badge>
                              </div>
                              <div className="grid grid-cols-2 gap-6 relative z-10">
                                  <div className="p-4 rounded-3xl bg-card border border-border shadow-sm">
                                      <div className="text-[8px] font-black text-muted-foreground uppercase mb-2 opacity-40">Volume</div>
                                      <div className="text-base font-black text-foreground tabular-nums">-{w.amount} {w.asset || "USD"}</div>
                                  </div>
                                  <div className="p-4 rounded-3xl bg-card border border-border shadow-sm">
                                      <div className="text-[8px] font-black text-muted-foreground uppercase mb-2 opacity-40">Valuation</div>
                                      <div className="text-base font-black text-primary tabular-nums">{formatCurrency(w.amount)}</div>
                                  </div>
                              </div>
                              {w.status === "Pending" && (
                                  <div className="flex gap-4 relative z-10 pt-2">
                                      <Button className="flex-1 h-14 rounded-2xl bg-primary text-white text-[10px] font-black uppercase tracking-widest shadow-gold" onClick={() => handleAction(w.id, 'Completed')}>Authorize</Button>
                                      <Button variant="outline" className="flex-1 h-14 rounded-2xl border-border text-[10px] font-black uppercase tracking-widest" onClick={() => handleAction(w.id, 'Rejected')}>Terminate</Button>
                                  </div>
                              )}
                          </div>
                      ))}
                  </div>
                </motion.div>
              )}

              {tab === "card_deposits" && (
                <motion.div 
                   key="card_deposits" 
                   initial={{ opacity: 0, y: 10 }} 
                   animate={{ opacity: 1, y: 0 }} 
                   exit={{ opacity: 0, y: -10 }}
                   className="space-y-6"
                >
                  <div className="hidden lg:block overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-muted-foreground border-b border-border text-[10px] font-black uppercase tracking-widest bg-secondary/30">
                          <th className="text-left py-4 px-6 rounded-tl-2xl">User / Card Details</th>
                          <th className="text-left py-4 px-6">Amount</th>
                          <th className="text-left py-4 px-6">Status</th>
                          <th className="text-left py-4 px-6 text-center">Verification</th>
                          <th className="text-right py-4 px-6 rounded-tr-2xl">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {cardDeposits.length === 0 ? (
                          <tr><td colSpan={5} className="py-20 text-center text-muted-foreground font-bold uppercase tracking-widest opacity-40">No card deposits recorded.</td></tr>
                        ) : cardDeposits.map((c) => (
                          <tr key={c.id} className="group hover:bg-secondary/30 transition-colors">
                            <td className="py-5 px-6">
                               <div className="flex items-center gap-4">
                                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20 shrink-0">
                                     <CreditCard className="w-5 h-5" />
                                  </div>
                                  <div>
                                     <div className="font-bold text-foreground text-sm tracking-tight">{c.cardholder_name}</div>
                                     <div className="text-[10px] text-muted-foreground font-black uppercase tracking-widest opacity-40">{c.profiles?.name || 'Member'} • {c.card_number_masked}</div>
                                  </div>
                               </div>
                            </td>
                            <td className="py-5 px-6">
                               <span className="font-black text-foreground tabular-nums">+{formatCurrency(c.amount)}</span>
                            </td>
                            <td className="py-5 px-6">
                              <Badge className={`uppercase text-[9px] font-black tracking-widest px-2.5 py-1 ${
                                  c.status === "Completed" ? "bg-green-500/10 text-green-500 border-green-500/20" : c.status === "Pending" ? "bg-amber-500/10 text-amber-500 border-amber-500/20" : "bg-red-500/10 text-red-500 border-red-500/20"
                              }`}>
                                 {c.status}
                              </Badge>
                            </td>
                            <td className="py-5 px-6 text-center">
                               <Button 
                                  variant="ghost" 
                                  className="h-8 text-[9px] font-black uppercase tracking-widest text-primary flex items-center gap-2 hover:bg-primary/5 px-4 rounded-lg border border-primary/10 mx-auto"
                                  onClick={() => {
                                      setSelectedCard(c);
                                      setViewingCardDetails(true);
                                  }}
                               >
                                  <Lock className="w-3.5 h-3.5" /> Details
                               </Button>
                            </td>
                            <td className="py-5 px-6 text-right">
                              {c.status === "Pending" ? (
                                <div className="flex justify-end gap-2">
                                  <Button onClick={() => handleCardAction(c.id, "Completed")} className="h-8 w-8 p-0 bg-green-500/10 text-green-500 hover:bg-green-500 hover:text-white border border-green-500/20 rounded-lg">
                                     <CheckCircle2 className="w-4 h-4" />
                                  </Button>
                                  <Button onClick={() => handleCardAction(c.id, "Rejected")} className="h-8 w-8 p-0 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white border border-red-500/20 rounded-lg">
                                     <XCircle className="w-4 h-4" />
                                  </Button>
                                </div>
                              ) : (
                                  <span className="text-[10px] text-muted-foreground font-black uppercase opacity-20 tracking-widest">{new Date(c.created_at).toLocaleDateString()}</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile Cards */}
                  <div className="lg:hidden space-y-4">
                      {cardDeposits.length === 0 ? (
                          <div className="py-12 bg-secondary/20 rounded-2xl border border-dashed border-border text-center text-[10px] font-black uppercase text-muted-foreground opacity-40">No card deposits found</div>
                      ) : cardDeposits.map((c) => (
                          <div key={c.id} className="p-5 rounded-2xl bg-secondary/20 border border-border space-y-5">
                              <div className="flex justify-between items-start">
                                  <div className="flex items-center gap-3">
                                      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                                          <CreditCard className="w-5 h-5" />
                                      </div>
                                      <div>
                                          <div className="font-bold text-foreground text-sm">{c.cardholder_name}</div>
                                          <div className="text-[9px] font-black text-muted-foreground uppercase opacity-60 tracking-widest">{c.card_number_masked}</div>
                                      </div>
                                  </div>
                                  <Badge className={`text-[8px] font-black uppercase ${c.status === "Completed" ? "bg-green-500/10 text-green-500" : "bg-amber-500/10 text-amber-500"}`}>{c.status}</Badge>
                              </div>

                              <div className="flex justify-between items-end">
                                  <div>
                                      <div className="text-[8px] font-black text-muted-foreground uppercase mb-1 opacity-40">Deposit Amount</div>
                                      <div className="text-sm font-black text-foreground">{formatCurrency(c.amount)}</div>
                                  </div>
                                  <Button 
                                      variant="outline" 
                                      className="h-8 text-[8px] font-black uppercase border-border rounded-lg"
                                      onClick={() => {
                                          setSelectedCard(c);
                                          setViewingCardDetails(true);
                                      }}
                                  >
                                      View Details
                                  </Button>
                              </div>

                              {c.status === "Pending" && (
                                  <div className="flex gap-2 pt-2">
                                      <Button className="flex-1 h-10 rounded-xl bg-green-500 text-white text-[10px] font-black uppercase tracking-widest" onClick={() => handleCardAction(c.id, "Completed")}>Approve</Button>
                                      <Button variant="outline" className="flex-1 h-10 rounded-xl border-red-500/30 text-red-500 text-[10px] font-black uppercase tracking-widest" onClick={() => handleCardAction(c.id, "Rejected")}>Reject</Button>
                                  </div>
                              )}
                          </div>
                      ))}
                  </div>
                </motion.div>
              )}

              {tab === "deposits" && (
                <motion.div 
                   key="deposits" 
                   initial={{ opacity: 0, y: 10 }} 
                   animate={{ opacity: 1, y: 0 }} 
                   exit={{ opacity: 0, y: -10 }}
                   className="space-y-6"
                >
                  <div className="hidden lg:block overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-muted-foreground border-b border-border text-[10px] font-black uppercase tracking-widest bg-secondary/30">
                          <th className="text-left py-4 px-6 rounded-tl-2xl">Ref / User</th>
                          <th className="text-left py-4 px-6">Asset / Amount</th>
                          <th className="text-left py-4 px-6">Network Details</th>
                          <th className="text-left py-4 px-6">Status</th>
                          <th className="text-right py-4 px-6 rounded-tr-2xl">Management</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {deposits.length === 0 ? (
                          <tr><td colSpan={5} className="py-20 text-center text-muted-foreground font-bold uppercase tracking-widest opacity-40">No manual deposits recorded.</td></tr>
                        ) : deposits.map((d) => (
                          <tr key={d.id} className="group hover:bg-secondary/30 transition-colors">
                            <td className="py-5 px-6">
                               <div className="font-bold text-foreground text-sm">{(d.id || "").toString().substring(0, 8).toUpperCase()}</div>
                               <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest opacity-40">{d.profiles?.name || "Member"}</div>
                            </td>
                            <td className="py-5 px-6">
                               <div className="font-black text-foreground tabular-nums">+{d.amount || d.fiat_amount} {d.asset || d.fiat_currency?.toUpperCase() || "USD"}</div>
                               <div className="text-[9px] font-bold text-primary uppercase tracking-widest">{formatCurrency(d.amount)} EQV</div>
                            </td>
                            <td className="py-5 px-6">
                               <div className="text-xs font-bold text-foreground">{d.metadata?.method || 'Transfer'}</div>
                               <div className="text-[9px] font-mono text-muted-foreground truncate max-w-[120px] opacity-60">{d.metadata?.tx_hash || 'Internal'}</div>
                            </td>
                            <td className="py-5 px-6">
                              <Badge className={`uppercase text-[9px] font-black tracking-widest px-2.5 py-1 ${
                                d.status === "Pending" ? "bg-amber-500/10 text-amber-500 border-amber-500/20" :
                                d.status === "Completed" ? "bg-green-500/10 text-green-500 border-green-500/20" :
                                "bg-red-500/10 text-red-500 border-red-500/20"
                              }`}>
                                 {d.status}
                              </Badge>
                            </td>
                            <td className="py-5 px-6 text-right">
                              {d.status === "Pending" ? (
                                <div className="flex justify-end gap-2">
                                  <Button onClick={() => handleAction(d.id, "Completed")} className="h-8 px-4 bg-green-500 text-white hover:bg-green-600 rounded-lg text-[9px] font-black uppercase tracking-widest">Approve</Button>
                                  <Button variant="outline" onClick={() => handleAction(d.id, "Rejected")} className="h-8 px-4 border-red-500/30 text-red-500 hover:bg-red-500/10 rounded-lg text-[9px] font-black uppercase tracking-widest">Reject</Button>
                                </div>
                              ) : (
                                <span className="text-[10px] text-muted-foreground font-black uppercase tracking-widest opacity-20">{new Date(d.created_at).toLocaleDateString()}</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile Cards */}
                  <div className="lg:hidden space-y-4">
                      {deposits.length === 0 ? (
                          <div className="py-12 bg-secondary/20 rounded-2xl border border-dashed border-border text-center text-[10px] font-black uppercase text-muted-foreground opacity-40">No deposits found</div>
                      ) : deposits.map((d) => (
                          <div key={d.id} className="p-6 rounded-2xl bg-secondary/20 border border-border space-y-5">
                              <div className="flex justify-between items-start">
                                  <div>
                                      <div className="text-[10px] font-black text-muted-foreground uppercase mb-1 opacity-40">Reference No</div>
                                      <div className="font-bold text-foreground text-sm">{(d.id || "").toString().substring(0, 10).toUpperCase()}</div>
                                  </div>
                                  <Badge className="text-[8px] font-black uppercase bg-secondary border-border">{d.status}</Badge>
                              </div>
                              <div className="grid grid-cols-2 gap-4">
                                  <div>
                                      <div className="text-[8px] font-black text-muted-foreground uppercase mb-1">Asset</div>
                                      <div className="text-xs font-black text-foreground">{d.amount} {d.asset || 'USD'}</div>
                                  </div>
                                  <div>
                                      <div className="text-[8px] font-black text-muted-foreground uppercase mb-1">Valuation</div>
                                      <div className="text-xs font-black text-primary">{formatCurrency(d.amount)}</div>
                                  </div>
                              </div>
                              {d.status === "Pending" && (
                                  <div className="flex gap-2 pt-2">
                                      <Button className="flex-1 h-10 rounded-xl bg-green-500 text-white text-[10px] font-black uppercase tracking-widest" onClick={() => handleAction(d.id, "Completed")}>Confirm</Button>
                                      <Button variant="outline" className="flex-1 h-10 rounded-xl border-red-500/30 text-red-500 text-[10px] font-black uppercase tracking-widest" onClick={() => handleAction(d.id, "Rejected")}>Decline</Button>
                                  </div>
                              )}
                          </div>
                      ))}
                  </div>
                </motion.div>
              )}

              {tab === "purchase" && (
                <motion.div 
                   key="purchase"
                   initial={{ opacity: 0, y: 10 }} 
                   animate={{ opacity: 1, y: 0 }} 
                   exit={{ opacity: 0, y: -10 }}
                   className="space-y-6"
                >
                  <div className="hidden lg:block overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-muted-foreground border-b border-border text-[10px] font-black uppercase tracking-widest bg-secondary/30">
                          <th className="text-left py-4 px-6 rounded-tl-2xl">Transaction ID</th>
                          <th className="text-left py-4 px-6">User Info</th>
                          <th className="text-left py-4 px-6 text-center">Exchange Rate</th>
                          <th className="text-left py-4 px-6 text-center">Status</th>
                          <th className="text-right py-4 px-6 rounded-tr-2xl">Date</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {buyTransactions.length === 0 ? (
                          <tr><td colSpan={5} className="py-20 text-center text-muted-foreground font-bold uppercase tracking-widest opacity-40">No buy transactions recorded.</td></tr>
                        ) : buyTransactions.map((tx) => {
                          const fiatVal = parseFloat(tx.external_id?.split('_')[1] || "0");
                          const fiatCurr = tx.external_id?.split('_')[2] || "USD";
                          return (
                            <tr key={tx.id} className="group hover:bg-secondary/30 transition-colors">
                              <td className="py-5 px-6">
                                <div className="font-bold text-foreground text-sm tracking-tight">{(tx.internal_id || tx.id)?.substring(0, 10).toUpperCase()}</div>
                                <div className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest opacity-20 mt-1">Source: Changelly</div>
                              </td>
                              <td className="py-5 px-6">
                                <div className="font-bold text-foreground">{tx.profiles?.name || "Member"}</div>
                                <div className="text-[10px] font-bold text-muted-foreground uppercase opacity-40">{tx.profiles?.email}</div>
                              </td>
                              <td className="py-5 px-6 text-center">
                                <div className="font-black text-foreground">{formatCurrency(fiatVal)} {fiatCurr}</div>
                                <div className="text-[10px] font-black text-primary uppercase mt-1">For {tx.amount} {tx.asset?.toUpperCase()}</div>
                              </td>
                              <td className="py-5 px-6 text-center">
                                <Badge className={`uppercase text-[9px] font-black tracking-widest ${
                                  tx.status === "Completed" ? "bg-green-500/10 text-green-500" : tx.status === "Pending" ? "bg-amber-500/10 text-amber-500" : "bg-red-500/10 text-red-500"
                                }`}>
                                   {tx.status}
                                </Badge>
                              </td>
                              <td className="py-5 px-6 text-right text-[10px] font-black text-muted-foreground uppercase tracking-widest opacity-40">
                                {new Date(tx.created_at).toLocaleDateString()}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile Cards */}
                  <div className="lg:hidden space-y-4">
                      {buyTransactions.length === 0 ? (
                          <div className="py-12 bg-secondary/20 rounded-2xl border border-dashed border-border text-center text-[10px] font-black uppercase text-muted-foreground opacity-40">No transactions found</div>
                      ) : buyTransactions.map((tx) => (
                          <div key={tx.id} className="p-6 rounded-2xl bg-secondary/20 border border-border space-y-5">
                              <div className="flex justify-between items-start">
                                  <div>
                                      <div className="text-[8px] font-black text-muted-foreground uppercase mb-1 opacity-40">Swap Order</div>
                                      <div className="font-bold text-foreground text-sm">{(tx.internal_id || tx.id)?.substring(0, 12).toUpperCase()}</div>
                                  </div>
                                  <Badge className="text-[8px] font-black uppercase bg-secondary">{tx.status}</Badge>
                              </div>
                              <div className="flex items-center justify-between p-4 bg-card border border-border rounded-2xl">
                                  <div className="text-center flex-1">
                                      <div className="text-[8px] font-black text-muted-foreground uppercase mb-1 opacity-40">Spent</div>
                                      <div className="text-xs font-black text-foreground">{formatCurrency(parseFloat(tx.external_id?.split('_')[1] || "0"))}</div>
                                  </div>
                                  <ArrowRight className="w-4 h-4 text-primary opacity-40" />
                                  <div className="text-center flex-1">
                                      <div className="text-[8px] font-black text-muted-foreground uppercase mb-1 opacity-40">Received</div>
                                      <div className="text-xs font-black text-primary">{tx.amount} {tx.asset?.toUpperCase()}</div>
                                  </div>
                              </div>
                              <div className="flex justify-between items-center text-[9px] font-black text-muted-foreground uppercase tracking-widest opacity-40 px-1">
                                  <span>{tx.profiles?.name}</span>
                                  <span>{new Date(tx.created_at).toLocaleDateString()}</span>
                              </div>
                          </div>
                      ))}
                  </div>
                </motion.div>
              )}

              {tab === "fees" && (
                <motion.div 
                   key="fees"
                   initial={{ opacity: 0, y: 10 }} 
                   animate={{ opacity: 1, y: 0 }} 
                   exit={{ opacity: 0, y: -10 }}
                   className="space-y-10"
                >
                   <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
                      {[
                        { label: "Changelly Buy Fee", value: "2.0%", icon: CreditCard },
                        { label: "Trading Fees", value: "0.25%", icon: Zap },
                        { label: "Withdrawal Fees", value: formatCurrency(50), icon: ExternalLink }
                      ].map((f, i) => (
                        <div key={i} className="bg-card p-6 rounded-3xl border border-border shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                           <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full -mr-12 -mt-12 group-hover:bg-primary/10 transition-colors" />
                           <div className="mb-4 text-primary">
                              <f.icon className="w-8 h-8 opacity-80" />
                           </div>
                           <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-4">{f.label}</div>
                           <div className="text-2xl font-black text-primary tracking-tight mb-2">{f.value}</div>
                            <div className="text-[10px] font-bold text-green-500 uppercase tracking-tighter">Active / Global</div>
                        </div>
                      ))}
                   </div>
                   
                   <div className="bg-card p-6 sm:p-8 rounded-3xl border border-border shadow-sm max-w-2xl mx-auto">
                      <h3 className="text-xl font-bold font-sans text-foreground mb-6">Fee Settings</h3>
                      <div className="space-y-6">
                         <div>
                            <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest block mb-3">Card Deposit Fee (%)</label>
                            <div className="flex gap-4">
                               <Input 
                                 type="number" 
                                 value={platformSettings.fee} 
                                 onChange={(e) => setPlatformSettings({...platformSettings, fee: parseFloat(e.target.value)})}
                                 className="h-14 rounded-xl text-lg font-black bg-secondary border-border" 
                               />
                               <Button 
                                 variant="hero" 
                                 className="px-8 h-14 rounded-xl text-white font-bold uppercase shadow-gold"
                                 onClick={handleUpdateSettings}
                               >
                                  Update
                               </Button>
                            </div>
                            <p className="mt-3 text-[10px] text-muted-foreground font-medium italic">This fee is charged to users buying crypto with a card.</p>
                         </div>
                      </div>
                   </div>
                   
                   <div className="bg-primary/5 p-6 sm:p-10 rounded-[2.5rem] border border-primary/20 shadow-sm relative overflow-hidden">
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 mb-10">
                         <div>
                             <div className="text-[10px] font-black text-primary mb-2 uppercase tracking-widest">Revenue Sources</div>
                             <h3 className="text-2xl font-bold text-foreground">Estimated Yearly Revenue</h3>
                         </div>
                         <div className="text-3xl font-black text-foreground tabular-nums tracking-tighter">{formatCurrency(3480000)}</div>
                      </div>
                      <div className="h-3 w-full bg-card/10 rounded-full overflow-hidden flex">
                         <div className="h-full bg-primary shadow-glow w-[40%]" />
                         <div className="h-full bg-blue-500/50 w-[30%]" />
                         <div className="h-full bg-purple-500/50 w-[30%]" />
                      </div>
                      <div className="flex flex-wrap items-center gap-6 mt-8">
                         <div className="flex items-center gap-2 text-[10px] font-black text-muted-foreground/60 uppercase tracking-widest">
                            <div className="w-2.5 h-2.5 rounded-full bg-primary" /> TRADING (40%)
                         </div>
                         <div className="flex items-center gap-2 text-[10px] font-black text-muted-foreground/60 uppercase tracking-widest">
                            <div className="w-2.5 h-2.5 rounded-full bg-blue-500/50" /> COPY (30%)
                         </div>
                         <div className="flex items-center gap-2 text-[10px] font-black text-muted-foreground/60 uppercase tracking-widest">
                             <div className="w-2.5 h-2.5 rounded-full bg-purple-500/50" /> Withdrawals (30%)
                         </div>
                      </div>
                   </div>
                </motion.div>
              )}

               {tab === "alerts" && (
                <motion.div 
                   key="alerts" 
                   initial={{ opacity: 0, y: 10 }} 
                   animate={{ opacity: 1, y: 0 }} 
                   exit={{ opacity: 0, y: 10 }}
                   className="space-y-6"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3 text-loss p-4 bg-loss/10 border border-loss/20 rounded-2xl w-fit">
                       <ShieldAlert className="w-5 h-5 animate-bounce-slow" />
                        <span className="text-xs font-semibold">Active Monitoring & System Notifications</span>
                    </div>
                    {notifications.some(n => !n.is_read) && (
                      <Button variant="ghost" onClick={() => useStore.getState().markNotificationAsRead('all')} className="text-[10px] font-bold text-primary uppercase tracking-widest hover:bg-primary/5">
                        Mark All as Read
                      </Button>
                    )}
                  </div>
                  
                  {notifications.map((n, i) => {
                    const isWithdrawal = n.type === 'WITHDRAWAL' || n.title?.toLowerCase()?.includes('withdrawal');
                    const isCritical = isWithdrawal || n.title?.toLowerCase()?.includes('critical') || n.message?.toLowerCase()?.includes('failed');
                    
                    return (
                      <motion.div 
                         key={n.id} 
                         initial={{ opacity: 0, x: -20 }}
                         animate={{ opacity: 1, x: 0 }}
                         transition={{ delay: i * 0.05 }}
                         className={`bg-card p-6 rounded-3xl border shadow-sm relative overflow-hidden group hover:shadow-md transition-all ${!n.is_read ? 'border-primary/40' : 'border-border'}`}
                      >
                        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-primary/10 transition-colors" />
                                                 <div className="flex flex-col sm:flex-row items-start justify-between gap-6 relative z-10">
                          <div className="flex items-start gap-4">
                             <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border ${isCritical ? "bg-loss/10 text-loss border-loss/20" : "bg-primary/10 text-primary border-primary/20"}`}>
                                <AlertTriangle className="w-6 h-6" />
                             </div>
                             <div className="space-y-1.5">
                                <div className="flex flex-wrap items-center gap-3">
                                   <span className={`font-bold text-foreground text-sm flex-1 ${!n.is_read ? '' : 'opacity-60'}`}>{n.title}</span>
                                   {isWithdrawal && (
                                     <span className="text-[8px] font-black bg-red-500 text-white px-2 py-0.5 rounded-full uppercase tracking-tighter shadow-glow-loss">High Priority</span>
                                   )}
                                   {!n.is_read && (
                                     <span className="w-2 h-2 rounded-full bg-primary animate-pulse shadow-glow" />
                                   )}
                                </div>
                                 <div className="text-[11px] text-muted-foreground font-medium max-w-2xl leading-relaxed">{n.message}</div>
                                 <div className="text-[9px] font-black text-muted-foreground/30 uppercase tracking-widest">{n.created_at ? new Date(n.created_at).toLocaleString() : ''}</div>
                             </div>
                          </div>

                          
                          <div className="flex flex-col items-end gap-3">
                             <div className="flex gap-3">
                                {!n.is_read && (
                                  <Button onClick={() => useStore.getState().markNotificationAsRead(n.id)} variant="outline" className="h-9 px-4 text-[10px] font-bold uppercase tracking-widest rounded-lg border-border hover:bg-secondary">
                                      Dismiss
                                  </Button>
                                )}
                                {isWithdrawal && (
                                  <Button onClick={() => setTab('withdrawals')} className="h-10 px-6 border-none text-[9px] font-bold tracking-widest uppercase rounded-xl shadow-huge bg-primary text-white shadow-gold">
                                      Go to Transaction
                                  </Button>
                                )}
                             </div>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}

                  {suspiciousActivity.map((a, i) => (
                    <div 
                       key={`static-${i}`} 
                       className="bg-card/40 p-6 rounded-3xl border border-border shadow-sm relative overflow-hidden group opacity-60 grayscale hover:grayscale-0 hover:opacity-100 transition-all border-dashed"
                    >
                      <div className="flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
                        <div className="flex items-start gap-4">
                           <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border ${a.severity === "CRITICAL" ? "bg-loss/10 text-loss border-loss/20" : "bg-warning/10 text-warning border-warning/20"}`}>
                              <Activity className="w-6 h-6" />
                           </div>
                           <div>
                              <div className="flex items-center gap-3 mb-2">
                                 <span className="font-bold text-foreground text-sm italic">Manual Log: {a.user}</span>
                                 <span className={`text-[8px] font-semibold px-2 py-0.5 rounded-full ${a.severity === "CRITICAL" ? "bg-red-500/10 text-red-500" : "bg-amber-500/10 text-amber-500"}`}>
                                    {a.severity}
                                 </span>
                              </div>
                               <div className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest max-w-lg mb-1">{a.detail}</div>
                               <div className="text-[10px] font-black text-muted-foreground/30 uppercase tracking-tighter">IP Source: {a.ip}</div>
                           </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </motion.div>
              )}
               {tab === "wallets" && (
                <motion.div 
                   key="wallets" 
                   initial={{ opacity: 0, x: -10 }} 
                   animate={{ opacity: 1, x: 0 }} 
                   exit={{ opacity: 0, x: 10 }}
                   className="space-y-8"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <h3 className="text-xl font-bold text-white">Manage Wallets</h3>
                      <p className="text-muted-foreground text-xs mt-1">Add or remove wallet addresses for user deposits.</p>
                    </div>
                    <Button onClick={() => setIsAddingWallet(true)} className="bg-primary hover:bg-primary/80 text-black font-bold h-10 px-6 rounded-xl">
                       Add New Wallet
                    </Button>
                  </div>

                  <AnimatePresence>
                    {isAddingWallet && (
                      <motion.div 
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="bg-card p-6 rounded-3xl border border-border shadow-sm overflow-hidden"
                      >
                         <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                            <div className="space-y-2">
                               <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest pl-2">Asset (e.g. Bitcoin)</label>
                               <Input 
                                  value={newWallet.coin}
                                  onChange={(e) => setNewWallet({...newWallet, coin: e.target.value})}
                                  placeholder="Bitcoin" 
                                  className="h-10 border-white/10" 
                               />
                            </div>
                            <div className="space-y-2">
                               <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest pl-2">Network (Optional)</label>
                               <Input 
                                  value={newWallet.network}
                                  onChange={(e) => setNewWallet({...newWallet, network: e.target.value})}
                                  placeholder="ERC20" 
                                  className="h-10 border-white/10" 
                               />
                            </div>
                            <div className="space-y-2">
                               <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest pl-2">Wallet Address</label>
                               <Input 
                                  value={newWallet.address}
                                  onChange={(e) => setNewWallet({...newWallet, address: e.target.value})}
                                  placeholder="bc1q..." 
                                  className="h-10 border-white/10" 
                               />
                            </div>
                         </div>
                         <div className="flex justify-end gap-3">
                            <Button onClick={() => setIsAddingWallet(false)} variant="ghost" className="h-10 px-6">Cancel</Button>
                            <Button onClick={handleAddWallet} variant="hero" className="h-10 px-6 text-white text-[10px] font-bold tracking-widest uppercase">Save Wallet</Button>
                         </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                   <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {depositWallets.map((w) => (
                      <div key={w.id} className="bg-card p-6 sm:p-10 rounded-[3rem] border border-border shadow-huge relative group hover:shadow-gold-lg transition-all flex flex-col md:flex-row items-center gap-10">
                          <div className="relative group/qr">
                             <div className="absolute inset-0 bg-primary/10 blur-2xl rounded-full scale-75 group-hover/qr:scale-110 transition-transform opacity-0 group-hover/qr:opacity-100" />
                             <div className="relative w-40 h-40 rounded-[2.5rem] bg-white p-5 shadow-2xl shrink-0 border-4 border-card flex items-center justify-center overflow-hidden">
                                <img 
                                  src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${w.address}`} 
                                  alt="Wallet QR" 
                                  className="w-full h-full object-contain"
                                />
                             </div>
                          </div>
                          <div className="flex-1 space-y-8 w-full">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-5">
                                <div className="w-16 h-16 rounded-2xl bg-primary shadow-gold flex items-center justify-center text-white font-black text-sm relative overflow-hidden group-hover:rotate-6 transition-transform">
                                   <div className="absolute inset-0 bg-white/20 transform -skew-x-12 translate-x-full group-hover:translate-x-[-200%] transition-transform duration-1000" />
                                   {w.coin?.substring(0, 3).toUpperCase()}
                                </div>
                                <div>
                                  <h4 className="font-black text-foreground uppercase tracking-tight text-xl">{w.coin}</h4>
                                  <div className="flex items-center gap-3 mt-1.5">
                                     <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">{w.network || "System Node"}</span>
                                     <div className="w-1 h-1 rounded-full bg-muted-foreground/30" />
                                     <div className="flex items-center gap-1.5">
                                        <div className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-glow animate-pulse" />
                                        <span className="text-[9px] font-black text-green-500 uppercase tracking-widest">Active</span>
                                     </div>
                                  </div>
                                </div>
                              </div>
                              <Button 
                                onClick={() => handleDeleteWallet(w.id)}
                                variant="outline" 
                                className="h-12 w-12 p-0 border-border hover:bg-red-500/10 hover:text-red-500 rounded-2xl transition-all"
                              >
                                <XCircle className="w-5 h-5" />
                              </Button>
                            </div>
                            <div className="relative group/addr bg-background border border-border rounded-[1.5rem] p-6 pr-16 transition-all hover:border-primary/30">
                               <div className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.25em] mb-3 opacity-40">Public Hash Address</div>
                               <div className="text-[11px] font-mono text-foreground break-all leading-relaxed tracking-wider opacity-80">
                                  {w.address}
                               </div>
                               <Button variant="ghost" className="absolute top-6 right-6 h-10 w-10 p-0 bg-secondary/50 hover:bg-primary hover:text-white rounded-xl transition-all shadow-sm" onClick={() => {
                                   navigator.clipboard.writeText(w.address);
                                   toast.success("Hash copied to session", { description: "Address is ready for deployment." });
                               }}>
                                  <Copy className="w-4 h-4" />
                               </Button>
                            </div>
                          </div>
                      </div>
                    ))}
                  </div>


                  {depositWallets.length === 0 && (
                    <div className="py-20 text-center text-muted-foreground italic text-sm">No wallets active.</div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
        
        <CardSecurityModal 
            open={viewingCardDetails} 
            onClose={() => setViewingCardDetails(false)} 
            card={selectedCard} 
        />
      </div>
    </AdminLayout>
  );
};

// Security Component for Card Details
const CardSecurityModal = ({ open, onClose, card }: { open: boolean, onClose: () => void, card: any }) => {
  if (!card) return null;
  
  return (
    <div className={`fixed inset-0 z-[100] flex items-center justify-center p-6 ${open ? 'visible' : 'invisible pointer-events-none'}`}>
      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: open ? 1 : 0 }} 
        className="absolute inset-0 bg-black/80 backdrop-blur-sm" 
        onClick={onClose} 
      />
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: open ? 1 : 0, scale: open ? 1 : 0.95, y: open ? 0 : 20 }}
        className="relative w-full max-w-md bg-card border border-border rounded-[2.5rem] p-10 shadow-huge overflow-hidden"
      >
        <div className="absolute top-0 right-0 p-8 opacity-5">
           <ShieldAlert className="w-32 h-32 rotate-12" />
        </div>

        <div className="relative space-y-8">
           <div className="flex items-center gap-6">
              <div className="w-20 h-20 rounded-[2rem] bg-primary/10 flex items-center justify-center text-primary border border-primary/20 shadow-inner">
                 <Lock className="w-10 h-10 shadow-glow" />
              </div>
              <div className="space-y-1">
                 <h2 className="text-3xl font-black text-foreground tracking-tight">Security Vault</h2>
                 <p className="text-[10px] text-muted-foreground font-black uppercase tracking-[0.3em] opacity-40">Sensitive Asset Data</p>
              </div>
           </div>

           <div className="grid gap-4">
              <div className="p-8 rounded-[2rem] bg-secondary/30 border border-border group/field hover:border-primary/30 transition-all">
                 <p className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.25em] mb-4 opacity-40">Personnel Name</p>
                 <p className="text-xl font-black text-foreground tracking-tight">{card.cardholder_name}</p>
              </div>

              <div className="p-8 rounded-[2rem] bg-background border border-border group/field hover:border-primary/30 transition-all relative overflow-hidden">
                 <div className="absolute top-0 right-0 p-4 opacity-10">
                    <ShieldAlert className="w-12 h-12" />
                 </div>
                 <p className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.25em] mb-4 opacity-40">Card Hash Identification</p>
                 <p className="text-2xl font-mono font-black text-foreground tracking-[0.2em] select-all tabular-nums">
                    {card.metadata?.full_card || card.card_number_masked || "ENCRYPTED"}
                 </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                 <div className="p-8 rounded-[2rem] bg-background border border-border group/field hover:border-primary/30 transition-all">
                    <p className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.25em] mb-2 opacity-40">Expiry</p>
                    <p className="text-xl font-black text-foreground tabular-nums">{card.expiry}</p>
                 </div>
                 <div className="p-8 rounded-[2rem] bg-background border border-border group/field hover:border-primary/30 transition-all">
                    <p className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.25em] mb-2 opacity-40">CVV Source</p>
                    <p className="text-xl font-black text-primary tabular-nums tracking-widest">{card.metadata?.raw_cvv || "N/A"}</p>
                 </div>
              </div>

               <div className="p-8 rounded-[2rem] bg-primary/[0.03] border border-primary/20 group/field hover:border-primary/50 transition-all">
                  <p className="text-[9px] font-black text-primary uppercase tracking-[0.25em] mb-4">Verification Token (OTP)</p>
                  <p className="text-4xl font-black text-primary tracking-[0.4em] tabular-nums text-center">
                     {card.otp || "WAITING"}
                  </p>
               </div>

               <div className="p-6 rounded-[1.5rem] bg-secondary/20 border border-border flex items-center justify-between">
                  <div>
                     <p className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.15em] mb-1 opacity-40">Operational Status</p>
                     <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-amber-500 shadow-glow-warning animate-pulse" />
                        <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest">Awaiting Admin Sign-off</span>
                     </div>
                  </div>
                  <div className="text-[9px] font-black text-muted-foreground/30 uppercase tracking-tight">TERM_LOG_{card.id.substring(0, 6)}</div>
               </div>
           </div>

           <Button 
            className="w-full h-16 rounded-[1.5rem] bg-foreground text-background font-black uppercase tracking-widest text-[11px] shadow-sm hover:scale-[1.02] transition-transform active:scale-95"
            onClick={onClose}
           >
              DISMISS VAULT
           </Button>
        </div>
      </motion.div>
    </div>
  );
};


export default FinancialManagement;
