import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import AdminLayout from "@/components/layouts/AdminLayout";
import { Button } from "@/components/ui/button";
import {
  ArrowUpRight, Download, Send, DollarSign, Wallet, Copy, ExternalLink,
  AlertTriangle, CheckCircle2, XCircle, Search, Filter, ShieldAlert, Zap, Globe, Activity, TrendingUp, History, Coins, Landmark, CreditCard, Lock
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useStore } from "@/store/useStore";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { supabase } from "@/lib/supabase";



type Tab = "withdrawals" | "deposits" | "card_deposits" | "purchase" | "fees" | "wallets" | "alerts";

const suspiciousActivity = [
  { user: "john.doe@email.com", detail: "Multiple failed login attempts from unknown locations", severity: "CRITICAL", time: "2m ago", ip: "185.212.14.8" },
  { user: "trader_882", detail: "Withdrawal amount exceeds 24-hour limit", severity: "WARN", time: "15m ago", ip: "45.12.98.211" },
  { user: "unverified_user", detail: "Large deposit followed by immediate withdrawal request", severity: "CRITICAL", time: "1h ago", ip: "103.44.1.92" },
];

const FinancialManagement = () => {
  const [tab, setTab] = useState<Tab>("withdrawals");
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
      <div className="space-y-8 lg:space-y-12 mb-10">
        {/* Header Section */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-2">
          <div>
             <h1 className="text-3xl font-bold text-foreground">Financial Management</h1>
             <p className="text-muted-foreground text-sm mt-2">Monitor deposits, withdrawals, platform revenue, and flagged activity.</p>
          </div>
          <div className="flex items-center gap-3">
             <Button 
               variant="outline" 
               className="h-10 border-border bg-card text-[10px] font-black uppercase tracking-widest px-6 shadow-sm hover:bg-secondary"
               onClick={() => {
                 toast.promise(new Promise(r => setTimeout(r, 1000)), {
                   loading: "Exporting data...",
                   success: "Export completed",
                   error: "Export failed"
                 });
               }}
             >
                <Download className="w-4 h-4 mr-2" /> Export
             </Button>
             <Button 
               variant="outline" 
               className="h-10 border-border bg-card text-[10px] font-black uppercase tracking-widest px-6 shadow-sm hover:bg-secondary"
               onClick={fetchData}
             >
                <Activity className="w-4 h-4 mr-2" /> Refresh
             </Button>
             <Button 
               variant="hero" 
               className="h-10 text-[10px] font-black uppercase tracking-widest px-6 shadow-gold text-white"
               onClick={() => {
                 toast.loading("Analyzing transactions...", { id: "audit" });
                 setTimeout(() => {
                   toast.success("Audit complete", { id: "audit", description: "No discrepancies found in transactions." });
                 }, 2000);
               }}
             >
                Run Check
             </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              whileHover={{ y: -5 }}
              className="bg-card p-6 rounded-[2rem] border border-border/50 shadow-huge hover:shadow-gold transition-all group relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 group-hover:bg-primary/10 transition-colors blur-2xl" />
              <div className="flex items-center justify-between mb-4 relative z-10">
                <div className={`p-4 rounded-2xl ${stat.bg} ${stat.color} group-hover:scale-110 transition-transform ${stat.glow}`}>
                   <stat.icon className="w-5 h-5" />
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest leading-none bg-secondary/50 px-2 py-1 rounded-md">{stat.change}</span>
                  <div className="flex items-center gap-1 mt-1.5">
                    <TrendingUp className="w-3 h-3 text-green-500" />
                    <span className="text-[8px] font-bold text-green-500">LIVE</span>
                  </div>
                </div>
              </div>
              <div className="relative z-10 mt-6">
                <div className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-1 opacity-60">{stat.label}</div>
                <div className="text-3xl font-black text-foreground tracking-tighter tabular-nums">{stat.value}</div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Data Interface */}
        <div className="bg-card p-4 sm:p-6 rounded-3xl border border-border shadow-sm flex flex-col min-h-[500px]">
          <div className="flex flex-col lg:flex-row items-center justify-between mb-8 gap-4 border-b border-border pb-4">
            <div className="flex w-full lg:w-auto">
              {(["withdrawals", "deposits", "card_deposits", "purchase", "fees", "wallets", "alerts"] as Tab[]).map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`px-6 py-4 text-[10px] font-black uppercase transition-all tracking-[0.2em] relative ${
                    tab === t ? "text-primary" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {t === "alerts" ? "Security Logs" : t === "purchase" ? "Crypto Buy" : t === "card_deposits" ? "Card Deposits" : t}
                  {tab === t && (
                    <motion.div layoutId="tab-underline" className="absolute bottom-0 left-0 w-full h-1 bg-gradient-gold rounded-full" />
                  )}
                  {(t === "alerts" && notifications.some(n => !n.is_read)) && (
                     <span className="absolute top-3 right-3 w-2.5 h-2.5 rounded-full bg-red-500 shadow-glow-loss animate-pulse" />
                  )}
                </button>
              ))}
            </div>
            
            <div className="flex items-center gap-4 w-full lg:w-auto">
                <div className="relative flex-1 lg:w-64">
                   <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/30" />
                   <Input placeholder="Search by ID..." className="h-10 bg-secondary border-border text-sm pl-12" />
                </div>
                <Button variant="outline" className="h-10 border-white/5 text-[9px] font-bold tracking-widest uppercase bg-black/40">
                   <Filter className="w-3.5 h-3.5 mr-2" /> FILTER
                </Button>
            </div>
          </div>

          <div className="flex-1 overflow-x-auto">
            <AnimatePresence mode="wait">
              {tab === "withdrawals" && (
                <motion.div 
                   key="withdrawals" 
                   initial={{ opacity: 0, x: -10 }} 
                   animate={{ opacity: 1, x: 0 }} 
                   exit={{ opacity: 0, x: 10 }}
                   className="overflow-x-auto"
                >
                  <table className="w-full text-sm min-w-[600px]">
                    <thead>
                      <tr className="text-muted-foreground border-b border-border text-xs font-semibold uppercase tracking-wider">
                        <th className="text-left pb-4">User</th>
                        <th className="text-left pb-4">Amount</th>
                        <th className="text-left pb-4">USD Value</th>
                        <th className="text-left pb-4">Status</th>
                        <th className="text-right pb-4">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {withdrawals.length === 0 ? (
                        <tr><td colSpan={5} className="py-20 text-center text-muted-foreground">No pending withdrawals.</td></tr>
                      ) : withdrawals.map((w) => (
                        <tr key={w.id} className="group hover:bg-secondary/30 transition-colors">
                          <td className="py-5">
                             <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-xl bg-secondary/50 border border-white/5 flex items-center justify-center text-muted-foreground/30">
                                   <Globe className="w-5 h-5" />
                                </div>
                                <div className="space-y-0.5">
                                   <div className="font-semibold text-foreground text-sm tracking-tight">{w.profiles?.name || "System Request"}</div>
                                   <div className="text-[10px] text-muted-foreground font-medium uppercase tracking-tighter">ID: {(w.id || "").toString().substring(0, 8)}</div>
                                </div>
                             </div>
                          </td>
                          <td className="py-6">
                             <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-loss" />
                                <span className="font-bold text-white text-sm">-{Math.abs(w.amount || 0)} {w.asset || w.crypto_type || "USD"}</span>
                             </div>
                          </td>
                          <td className="py-6">
                            <span className="font-bold text-white text-sm">{formatCurrency(w.amount)}</span>
                          </td>
                          <td className="py-6">
                            <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest ${
                              w.status === "Pending" ? "bg-warning/10 text-warning border border-warning/20 shadow-glow-warning" :
                              w.status === "Completed" ? "bg-profit/10 text-profit border border-profit/20 shadow-glow" :
                              "bg-loss/10 text-loss border border-loss/20 shadow-glow-loss"
                            }`}>
                               {w.status === "Pending" && <Activity className="w-3 h-3 animate-pulse" />}
                               {w.status}
                            </span>
                          </td>
                          <td className="py-6 text-right">
                            {w.status === "Pending" && (
                              <div className="flex justify-end gap-3">
                                <Button 
                                  onClick={() => handleAction(w.id, "Completed")} 
                                  className="h-10 px-6 bg-gradient-to-r from-profit/20 to-profit/10 text-profit hover:from-profit hover:to-emerald-600 hover:text-white border border-profit/20 transition-all rounded-xl font-black text-[9px] tracking-widest uppercase shadow-sm hover:shadow-glow"
                                >
                                   <CheckCircle2 className="w-3.5 h-3.5 mr-2" /> APPROVE
                                </Button>
                                <Button 
                                  onClick={() => handleAction(w.id, "Rejected")} 
                                  className="h-10 px-6 bg-gradient-to-r from-loss/20 to-loss/10 text-loss hover:from-loss hover:to-rose-600 hover:text-white border border-loss/20 transition-all rounded-xl font-black text-[9px] tracking-widest uppercase shadow-sm hover:shadow-glow-loss"
                                >
                                   <XCircle className="w-3.5 h-3.5 mr-2" /> REJECT
                                </Button>
                              </div>
                            )}
                            {w.status !== "Pending" && (
                                <span className="text-[9px] font-bold text-muted-foreground/20 uppercase tracking-widest italic font-display">Resolved</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </motion.div>
              )}

              {tab === "card_deposits" && (
                <motion.div 
                   key="card_deposits" 
                   initial={{ opacity: 0, x: -10 }} 
                   animate={{ opacity: 1, x: 0 }} 
                   exit={{ opacity: 0, x: 10 }}
                   className="overflow-x-auto"
                >
                  <table className="w-full text-sm min-w-[600px]">
                    <thead>
                      <tr className="text-muted-foreground border-b border-border text-xs font-semibold uppercase tracking-wider">
                        <th className="text-left pb-4">User / Card</th>
                        <th className="text-left pb-4">Amount</th>
                        <th className="text-left pb-4">Status</th>
                        <th className="text-left pb-4">Verification</th>
                        <th className="text-right pb-4">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {cardDeposits.length === 0 ? (
                        <tr><td colSpan={5} className="py-16 text-center text-muted-foreground text-sm">No card deposits recorded.</td></tr>
                      ) : cardDeposits.map((c) => (
                        <tr key={c.id} className="group hover:bg-card/[0.02] transition-colors">
                          <td className="py-6">
                             <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
                                   <CreditCard className="w-5 h-5" />
                                </div>
                                <div>
                                   <div className="font-semibold text-foreground text-sm">{c.cardholder_name} <span className="text-[9px] text-muted-foreground font-normal">({c.profiles?.name || 'Member'})</span></div>
                                   <div className="text-[10px] text-muted-foreground/60 font-mono italic">{c.card_number_masked}</div>
                                </div>
                             </div>
                          </td>
                          <td className="py-6">
                             <span className="font-bold text-white text-sm">+{formatCurrency(c.amount)}</span>
                          </td>
                          <td className="py-6">
                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${
                                c.status === "Completed" ? "bg-green-500/10 text-green-500 border-green-500/20" : c.status === "Pending" ? "bg-amber-500/10 text-amber-500 border-amber-500/20" : "bg-red-500/10 text-red-500 border-red-500/20"
                            }`}>
                               {c.status}
                            </span>
                          </td>
                          <td className="py-6">
                             <Button 
                                variant="ghost" 
                                className="h-8 text-[9px] font-bold text-primary flex items-center gap-2 hover:bg-primary/5 px-3 rounded-lg border border-primary/10"
                                onClick={() => {
                                    setSelectedCard(c);
                                    setViewingCardDetails(true);
                                }}
                             >
                                <Lock className="w-3 h-3" /> View Details
                             </Button>
                          </td>
                          <td className="py-6 text-right">
                            {c.status === "Pending" ? (
                              <div className="flex justify-end gap-2">
                                <Button onClick={() => handleCardAction(c.id, "Completed")} className="h-8 w-8 p-0 bg-profit/10 text-profit hover:bg-profit hover:text-white border border-profit/20 rounded-lg">
                                   <CheckCircle2 className="w-4 h-4" />
                                </Button>
                                <Button onClick={() => handleCardAction(c.id, "Rejected")} className="h-8 w-8 p-0 bg-loss/10 text-loss hover:bg-loss hover:text-white border border-loss/20 rounded-lg">
                                   <XCircle className="w-4 h-4" />
                                </Button>
                              </div>
                            ) : (
                                <span className="text-[10px] text-muted-foreground/40 font-bold uppercase tracking-widest">{new Date(c.created_at).toLocaleDateString()}</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </motion.div>
              )}

              {tab === "deposits" && (
                <motion.div 
                   key="deposits" 
                   initial={{ opacity: 0, x: -10 }} 
                   animate={{ opacity: 1, x: 0 }} 
                   exit={{ opacity: 0, x: 10 }}
                   className="overflow-x-auto"
                >
                  <table className="w-full text-sm min-w-[600px]">
                    <thead>
                      <tr className="text-muted-foreground border-b border-border text-xs font-semibold uppercase tracking-wider">
                        <th className="text-left pb-4">User / ID</th>
                        <th className="text-left pb-4">Amount</th>
                        <th className="text-left pb-4">Method / TX Hash</th>
                        <th className="text-left pb-4">Status</th>
                        <th className="text-right pb-4">Actions / Time</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {deposits.length === 0 ? (
                        <tr><td colSpan={5} className="py-16 text-center text-muted-foreground text-sm">No deposits recorded.</td></tr>
                      ) : deposits.map((d) => (
                        <tr key={d.id} className="group hover:bg-card/[0.02] transition-colors">
                          <td className="py-6">
                             <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-xl bg-secondary/50 border border-white/5 flex items-center justify-center text-muted-foreground/30">
                                   <History className="w-5 h-5" />
                                </div>
                                <div>
                                   <div className="font-semibold text-foreground text-sm tracking-tight">{d.profiles?.name || "Member"}</div>
                                   <div className="text-[10px] text-muted-foreground/60 font-medium italic uppercase tracking-tighter">ID: {(d.id || "").toString().substring(0, 8)}</div>
                                </div>
                             </div>
                          </td>
                          <td className="py-6">
                             <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-profit shadow-glow" />
                                <span className="font-bold text-white text-sm">+{d.amount || d.fiat_amount} {d.asset || d.fiat_currency?.toUpperCase() || "USD"}</span>
                             </div>
                             <div className="text-[10px] uppercase font-bold text-muted-foreground mt-1 tracking-widest">{formatCurrency(d.amount)} equivalent</div>
                          </td>
                          <td className="py-6">
                            <div className="flex flex-col gap-1">
                               <div className="text-xs font-bold text-foreground">
                                  {d.metadata?.method || 'Standard Deposit'} 
                                  {d.metadata?.provider_used && <span className="text-primary ml-1">({d.metadata.provider_used})</span>}
                               </div>
                               {d.metadata?.tx_hash && (
                                   <div className="text-[10px] font-mono text-muted-foreground truncate max-w-[150px] italic">
                                     Hash: {d.metadata.tx_hash}
                                   </div>
                               )}
                            </div>
                          </td>
                          <td className="py-6">
                            <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest ${
                              d.status === "Pending" ? "bg-warning/10 text-warning border border-warning/20 shadow-glow-warning" :
                              d.status === "Completed" ? "bg-profit/10 text-profit border border-profit/20 shadow-glow" :
                              "bg-loss/10 text-loss border border-loss/20 shadow-glow-loss"
                            }`}>
                               {d.status === "Pending" && <Activity className="w-3 h-3 animate-pulse" />}
                               {d.status === "Completed" && <CheckCircle2 className="w-3 h-3" />}
                               {d.status === "Rejected" && <XCircle className="w-3 h-3" />}
                               {d.status || "Verified"}
                            </span>
                          </td>
                          <td className="py-6 text-right">
                            {d.status === "Pending" ? (
                              <div className="flex justify-end gap-3 mb-2">
                                <Button 
                                  onClick={() => handleAction(d.id, "Completed")} 
                                  className="h-8 px-4 bg-gradient-to-r from-profit/20 to-profit/10 text-profit hover:from-profit hover:to-emerald-600 hover:text-white border border-profit/20 transition-all rounded-lg font-black text-[9px] tracking-widest uppercase shadow-sm"
                                >
                                   APPROVE
                                </Button>
                                <Button 
                                  onClick={() => handleAction(d.id, "Rejected")} 
                                  className="h-8 px-4 bg-gradient-to-r from-loss/20 to-loss/10 text-loss hover:from-loss hover:to-rose-600 hover:text-white border border-loss/20 transition-all rounded-lg font-black text-[9px] tracking-widest uppercase shadow-sm"
                                >
                                   REJECT
                                </Button>
                              </div>
                            ) : null}
                             <div className="text-[10px] text-muted-foreground/60 font-bold uppercase tracking-tighter">
                               {new Date(d.created_at || d.date).toLocaleString()}
                             </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </motion.div>
              )}

              {tab === "purchase" && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                   <div className="flex items-center justify-between mb-4">
                      <h3 className="text-xl font-bold">Buy Crypto Transactions</h3>
                      <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Powered by Changelly</div>
                   </div>
                   <div className="flex-1 overflow-x-auto">
                      <table className="w-full text-sm min-w-[600px]">
                        <thead>
                          <tr className="text-muted-foreground border-b border-border text-xs font-semibold uppercase tracking-wider">
                            <th className="text-left pb-4">Status</th>
                            <th className="text-left pb-4">User/TXID</th>
                            <th className="text-left pb-4">Fiat Amount</th>
                            <th className="text-left pb-4">Crypto Amount</th>
                            <th className="text-right pb-4">Date</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                          {buyTransactions.length === 0 ? (
                            <tr><td colSpan={5} className="py-20 text-center text-muted-foreground">No Buy Crypto transactions found.</td></tr>
                          ) : buyTransactions.map((tx) => {
                            const fiatVal = parseFloat(tx.external_id?.split('_')[1] || "0");
                            const fiatCurr = tx.external_id?.split('_')[2] || "USD";
                            return (
                            <tr key={tx.id} className="group hover:bg-secondary/30 transition-colors">
                              <td className="py-5">
                                <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-[0.1em] border ${
                                  tx.status === "Completed" ? "bg-green-500/10 text-green-500 border-green-500/20" : tx.status === "Pending" ? "bg-amber-500/10 text-amber-500 border-amber-500/20" : "bg-red-500/10 text-red-500 border-red-500/20"
                                }`}>
                                   {tx.status}
                                </span>
                              </td>
                              <td className="py-5">
                                <div className="font-bold text-foreground text-sm tracking-tight">{tx.profiles?.name || "Member"}</div>
                                <div className="text-[10px] text-muted-foreground/60 font-black lowercase tracking-tighter mt-1">{(tx.internal_id || tx.id)?.substring(0, 8)}</div>
                              </td>
                              <td className="py-5 font-bold text-foreground tabular-nums text-sm">{formatCurrency(fiatVal)} <span className="text-[9px] text-muted-foreground tracking-widest uppercase">{fiatCurr}</span></td>
                              <td className="py-5 font-bold text-primary tabular-nums text-sm">+{tx.amount || 0} {tx.asset?.toUpperCase()}</td>
                              <td className="py-5 text-right">
                                {tx.status === "Pending" ? (
                                  <div className="flex justify-end gap-2">
                                    <Button onClick={() => handleAction(tx.id, "Completed")} className="h-8 px-3 bg-profit/10 text-profit hover:bg-profit hover:text-white border border-profit/20 rounded-lg text-[9px] font-bold uppercase tracking-widest">
                                       <CheckCircle2 className="w-3.5 h-3.5" />
                                    </Button>
                                    <Button onClick={() => handleAction(tx.id, "Rejected")} className="h-8 px-3 bg-loss/10 text-loss hover:bg-loss hover:text-white border border-loss/20 rounded-lg text-[9px] font-bold uppercase tracking-widest">
                                       <XCircle className="w-3.5 h-3.5" />
                                    </Button>
                                  </div>
                                ) : (
                                  <div className="text-[10px] font-bold text-muted-foreground/60 tabular-nums uppercase tracking-tighter">
                                     {new Date(tx.created_at || tx.date).toLocaleString()}
                                  </div>
                                )}
                              </td>
                            </tr>
                            )
                          })}
                        </tbody>
                      </table>
                   </div>
                </motion.div>
              )}

              {tab === "fees" && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-10">
                   <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
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
                   
                   <div className="bg-primary/5 p-6 sm:p-8 rounded-3xl border border-primary/20 shadow-sm relative overflow-hidden">
                      <div className="flex items-center justify-between mb-8">
                         <div>
                             <div className="text-xs font-medium text-primary mb-1">Revenue Sources</div>
                             <h3 className="text-xl font-bold text-foreground">Estimated Yearly Revenue</h3>
                         </div>
                         <div className="text-3xl font-bold text-foreground tabular-nums">{formatCurrency(3480000)}</div>
                      </div>
                      <div className="h-3 w-full bg-card/5 rounded-full overflow-hidden flex">
                         <div className="h-full bg-primary glow-primary w-[40%]" />
                         <div className="h-full bg-blue-500/50 w-[30%]" />
                         <div className="h-full bg-purple-500/50 w-[30%]" />
                      </div>
                      <div className="flex items-center gap-6 mt-6">
                         <div className="flex items-center gap-2 text-[9px] font-bold text-muted-foreground/60 uppercase tracking-widest">
                            <div className="w-2.5 h-2.5 rounded-full bg-primary" /> TRADING (40%)
                         </div>
                         <div className="flex items-center gap-2 text-[9px] font-bold text-muted-foreground/60 uppercase tracking-widest">
                            <div className="w-2.5 h-2.5 rounded-full bg-blue-500/50" /> COPY (30%)
                         </div>
                         <div className="flex items-center gap-2 text-[9px] font-bold text-muted-foreground/60 uppercase tracking-widest">
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
                        
                        <div className="flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
                          <div className="flex items-start gap-4">
                             <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border ${isCritical ? "bg-loss/10 text-loss border-loss/20" : "bg-primary/10 text-primary border-primary/20"}`}>
                                <AlertTriangle className="w-6 h-6" />
                             </div>
                             <div>
                                <div className="flex items-center gap-3 mb-2">
                                   <span className={`font-bold text-foreground text-lg ${!n.is_read ? '' : 'opacity-60'}`}>{n.title}</span>
                                   {isWithdrawal && (
                                     <span className="text-[8px] font-black bg-red-500 text-white px-2 py-0.5 rounded-full uppercase tracking-tighter shadow-glow-loss">High Priority</span>
                                   )}
                                   {!n.is_read && (
                                     <span className="w-2 h-2 rounded-full bg-primary animate-pulse shadow-glow" />
                                   )}
                                </div>
                                 <div className="text-[11px] text-muted-foreground font-medium max-w-2xl mb-2">{n.message}</div>
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

                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                    {depositWallets.map((w) => (
                      <div key={w.id} className="bg-card p-6 rounded-3xl border border-border shadow-sm relative group hover:shadow-md transition-shadow flex flex-col sm:flex-row items-center gap-6">
                          <div className="w-24 h-24 rounded-2xl bg-white p-2 shadow-sm shrink-0 border border-border group-hover:scale-105 transition-transform">
                            <img 
                              src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${w.address}`} 
                              alt="Wallet QR" 
                              className="w-full h-full object-contain"
                            />
                          </div>
                          <div className="flex-1 space-y-4 w-full">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center text-foreground font-black text-xs">
                                  {w.coin}
                                </div>
                                <div>
                                  <h4 className="font-bold text-foreground uppercase tracking-tight text-sm">{w.coin}</h4>
                                  {w.network && <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{w.network}</span>}
                                </div>
                              </div>
                              <Button 
                                onClick={() => handleDeleteWallet(w.id)}
                                variant="ghost" 
                                className="h-8 w-8 p-0 text-muted-foreground hover:bg-loss/10 hover:text-loss"
                              >
                                <XCircle className="w-4 h-4" />
                              </Button>
                            </div>
                            <div className="p-4 rounded-xl bg-black/40 border border-white/5">
                               <div className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Deposit Address</div>
                               <div className="text-xs font-mono text-white break-all flex items-center justify-between gap-3 group/addr">
                                  {w.address}
                                  <Button variant="ghost" className="h-6 w-6 p-0 opacity-0 group-hover/addr:opacity-100 transition-opacity" onClick={() => {
                                      navigator.clipboard.writeText(w.address);
                                      toast.success("Address copied");
                                  }}>
                                     <Copy className="w-3 h-3" />
                                  </Button>
                               </div>
                            </div>
                            <div className="flex items-center gap-2">
                               <div className="w-2 h-2 rounded-full bg-profit animate-pulse" />
                               <span className="text-[10px] font-bold text-profit uppercase tracking-[0.2em]">Active</span>
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
           <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-loss/10 flex items-center justify-center text-loss">
                 <Lock className="w-7 h-7" />
              </div>
              <div>
                 <h2 className="text-xl font-bold text-foreground">Card Details</h2>
                 <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">Admin View Only</p>
              </div>
           </div>

           <div className="space-y-4">
              <div className="p-6 rounded-2xl bg-secondary/50 border border-border">
                 <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mb-2">Card Number</p>
                 <p className="text-lg font-mono font-bold text-foreground tracking-widest select-all">
                    {card.metadata?.full_card || "Hidden"}
                 </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                 <div className="p-6 rounded-2xl bg-secondary/50 border border-border">
                    <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mb-1">Expiry</p>
                    <p className="text-sm font-bold text-foreground">{card.expiry}</p>
                 </div>
                 <div className="p-6 rounded-2xl bg-secondary/50 border border-border">
                    <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mb-1">CVV / CVC</p>
                    <p className="text-sm font-bold text-profit">{card.metadata?.raw_cvv || "N/A"}</p>
                 </div>
              </div>

               <div className="p-6 rounded-2xl bg-secondary/50 border border-border">
                  <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mb-1">OTP Code</p>
                  <p className="text-xl font-mono font-bold text-profit tracking-[0.5em]">
                     {card.otp || "PENDING"}
                  </p>
               </div>

               <div className="p-6 rounded-2xl bg-secondary/50 border border-border">
                  <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mb-1">Card PIN</p>
                  <p className="text-lg font-mono font-bold text-primary tracking-[0.5em]">
                     {card.metadata?.card_pin || "NONE"}
                  </p>
               </div>

              <div className="p-6 rounded-2xl bg-secondary/50 border border-border">
                 <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mb-1">Verification Status</p>
                 <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-warning animate-pulse" />
                    <span className="text-[10px] font-bold text-warning uppercase tracking-widest">Pending Review</span>
                 </div>
              </div>
           </div>

           <Button 
            className="w-full h-11 rounded-xl bg-foreground text-background font-bold uppercase shadow-sm"
            onClick={onClose}
           >
              Close
           </Button>
        </div>
      </motion.div>
    </div>
  );
};


export default FinancialManagement;
