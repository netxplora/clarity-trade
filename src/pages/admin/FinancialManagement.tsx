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



type Tab = "withdrawals" | "deposits" | "card_deposits" | "purchase" | "fees" | "wallets" | "suspicious";

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

  const [cardDeposits, setCardDeposits] = useState<any[]>([]);
  const [selectedCard, setSelectedCard] = useState<any | null>(null);
  const [viewingCardDetails, setViewingCardDetails] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [{ data: txData }, { data: walletData }, { data: settingsData }, { data: ledgerData }, { data: cardData }] = await Promise.all([
        supabase.from('transactions').select('*, profiles(name)').order('created_at', { ascending: false }),
        supabase.from('deposit_wallets').select('*').eq('status', 'Active'),
        supabase.from('platform_settings').select('*').single(),
        supabase.from('fee_ledger').select('fee_amount'),
        supabase.from('card_deposits').select('*, profiles(name)').order('created_at', { ascending: false })
      ]);
      
      if (txData) setTransactions(txData);
      if (walletData) setDepositWallets(walletData);
      if (cardData) setCardDeposits(cardData);
      if (ledgerData) {
        const total = ledgerData.reduce((acc, curr) => acc + (Number(curr.fee_amount) || 0), 0);
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
    { label: "Total Deposits", value: formatCurrency(totalDeposited), change: "+18.3%", icon: Download, color: "text-[#D4AF37]", bg: "bg-[#D4AF37]/10" },
    { label: "Total Withdrawals", value: formatCurrency(totalWithdrawn), change: "+9.1%", icon: Send, color: "text-red-600", bg: "bg-red-50" },
    { label: "Platform Revenue", value: formatCurrency(feeLedgerTotal), change: "Lifetime", icon: DollarSign, color: "text-[#D4AF37]", bg: "bg-[#D4AF37]/10" },
    { label: "Net Balance", value: formatCurrency(totalDeposited - totalWithdrawn), change: "+24.7%", icon: Wallet, color: "text-blue-600", bg: "bg-blue-50" },
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
      toast.error("System Rejection", { id: 'wallet-add', description: error.message || "Could not persist wallet to global database." }); 
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
      <div className="space-y-10 p-2 lg:p-6 font-sans">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-white/5">
          <div>
             <h1 className="text-3xl font-bold text-foreground">Financial Management</h1>
             <p className="text-muted-foreground text-sm mt-2">Monitor deposits, withdrawals, platform revenue, and flagged activity.</p>
          </div>
          <div className="flex items-center gap-3">
             <Button 
               variant="outline" 
               className="h-11 border-border bg-card text-sm font-medium px-6 shadow-sm hover:bg-secondary"
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
               className="h-11 border-border bg-card text-sm font-medium px-6 shadow-sm hover:bg-secondary"
               onClick={fetchData}
             >
                <Activity className="w-4 h-4 mr-2" /> Refresh
             </Button>
             <Button 
               variant="hero" 
               className="h-11 text-sm font-medium px-6 text-white shadow-gold"
               onClick={() => {
                 toast.loading("Analyzing transactions...", { id: "audit" });
                 setTimeout(() => {
                   toast.success("Audit complete", { id: "audit", description: "No discrepancies found in transactions." });
                 }, 2000);
               }}
             >
                Run Audit
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
              className="glass-card p-8 group hover:border-primary/20 transition-all duration-500 relative overflow-hidden bg-secondary/10"
            >
              <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                 <stat.icon className="w-16 h-16 rotate-12" />
              </div>
              <div className="flex items-center justify-between mb-6">
                <span className="text-xs font-semibold text-muted-foreground">{stat.label}</span>
                <div className={`w-10 h-10 rounded-xl ${stat.bg} flex items-center justify-center`}>
                  <stat.icon className={`w-5 h-5 ${stat.color} shadow-glow`} />
                </div>
              </div>
              <div className="text-3xl font-bold text-white tracking-tight mb-2">{stat.value}</div>
              <div className="flex items-center gap-2 text-xs font-bold text-profit">
                <TrendingUp className="w-4 h-4" /> {stat.change}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Console Interface */}
        <div className="glass-card border-white/5 bg-secondary/10 overflow-hidden rounded-[2.5rem] shadow-huge">
          <div className="flex flex-col lg:flex-row items-center justify-between border-b border-white/5 px-8 pt-4 lg:pt-0">
            <div className="flex w-full lg:w-auto">
              {(["withdrawals", "deposits", "card_deposits", "purchase", "fees", "wallets", "suspicious"] as Tab[]).map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`px-8 py-6 text-[10px] font-bold tracking-[0.3em] uppercase transition-all relative ${
                    tab === t ? "text-primary italic" : "text-muted-foreground/40 hover:text-white"
                  }`}
                >
                  {t === "suspicious" ? "Alerts" : t === "purchase" ? "Crypto Buy" : t === "card_deposits" ? "Card Deposits" : t}
                  {tab === t && (
                    <motion.div layoutId="tab-underline" className="absolute bottom-0 left-0 w-full h-1 bg-primary glow-primary" />
                  )}
                  {t === "suspicious" && (
                     <span className="absolute top-4 right-4 w-2 h-2 rounded-full bg-loss animate-pulse" />
                  )}
                </button>
              ))}
            </div>
            
            <div className="flex items-center gap-4 py-4 w-full lg:w-auto border-t lg:border-t-0 border-white/5">
                <div className="relative flex-1 lg:w-64">
                   <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/30" />
                   <Input placeholder="Search by ID..." className="h-10 bg-secondary border-border text-sm pl-12" />
                </div>
                <Button variant="outline" className="h-10 border-white/5 text-[9px] font-bold tracking-widest uppercase bg-black/40">
                   <Filter className="w-3.5 h-3.5 mr-2" /> FILTER
                </Button>
            </div>
          </div>

          <div className="p-8">
            <AnimatePresence mode="wait">
              {tab === "withdrawals" && (
                <motion.div 
                   key="withdrawals" 
                   initial={{ opacity: 0, x: -10 }} 
                   animate={{ opacity: 1, x: 0 }} 
                   exit={{ opacity: 0, x: 10 }}
                   className="overflow-x-auto"
                >
                  <table className="w-full">
                    <thead>
                      <tr className="text-xs font-medium text-muted-foreground border-b border-border">
                        <th className="text-left pb-6 font-medium text-xs">User</th>
                        <th className="text-left pb-6 font-medium text-xs">Amount</th>
                        <th className="text-left pb-6 font-medium text-xs">USD Value</th>
                        <th className="text-left pb-6 font-medium text-xs">Status</th>
                        <th className="text-right pb-6 font-medium text-xs">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {withdrawals.length === 0 ? (
                        <tr><td colSpan={5} className="py-16 text-center text-muted-foreground text-sm">No pending withdrawals.</td></tr>
                      ) : withdrawals.map((w) => (
                        <tr key={w.id} className="group hover:bg-card/[0.02] transition-colors">
                          <td className="py-6">
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
                                <Button onClick={() => handleAction(w.id, "Completed")} className="h-10 px-4 bg-profit/10 text-profit hover:bg-profit hover:text-white border border-profit/20 transition-all rounded-xl font-bold text-[9px] tracking-widest uppercase">
                                   <CheckCircle2 className="w-3.5 h-3.5 mr-2" /> APPROVE
                                </Button>
                                <Button onClick={() => handleAction(w.id, "Rejected")} className="h-10 px-4 bg-loss/10 text-loss hover:bg-loss hover:text-white border border-loss/20 transition-all rounded-xl font-bold text-[9px] tracking-widest uppercase">
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
                  <table className="w-full">
                    <thead>
                      <tr className="text-xs font-medium text-muted-foreground border-b border-border">
                        <th className="text-left pb-6 font-bold">User / Card</th>
                        <th className="text-left pb-6 font-bold">Amount</th>
                        <th className="text-left pb-6 font-bold uppercase">Status</th>
                        <th className="text-left pb-6 font-bold uppercase">Verification</th>
                        <th className="text-right pb-6 font-bold uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
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
                  <table className="w-full">
                    <thead>
                      <tr className="text-xs font-medium text-muted-foreground border-b border-border">
                        <th className="text-left pb-6 font-bold">User / Source</th>
                        <th className="text-left pb-6 font-bold">Amount</th>
                        <th className="text-left pb-6 font-bold uppercase">USD Valuation</th>
                        <th className="text-left pb-6 font-bold uppercase">Status</th>
                        <th className="text-right pb-6 font-bold uppercase">Timestamp</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
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
                          </td>
                          <td className="py-6 font-bold text-white text-sm">
                            {formatCurrency(d.amount)}
                          </td>
                          <td className="py-6">
                            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest bg-profit/10 text-profit border border-profit/20 shadow-glow">
                               <CheckCircle2 className="w-3 h-3" /> Verified
                            </span>
                          </td>
                          <td className="py-6 text-right text-xs text-muted-foreground">
                             {new Date(d.created_at || d.date).toLocaleString()}
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
                      <div className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Powered by Changelly</div>
                   </div>
                   <div className="overflow-x-auto rounded-3xl border border-border">
                      <table className="w-full text-sm">
                        <thead className="bg-secondary/30">
                          <tr className="text-muted-foreground border-b border-border text-[10px] font-bold uppercase tracking-widest">
                            <th className="text-left py-4 px-6 italic">Status</th>
                            <th className="text-left py-4 px-6">User/TXID</th>
                            <th className="text-left py-4 px-6">Fiat Amount</th>
                            <th className="text-left py-4 px-6">Crypto Amount</th>
                            <th className="text-right py-4 px-6">Date</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border bg-card">
                          {buyTransactions.length === 0 ? (
                            <tr><td colSpan={5} className="py-20 text-center text-muted-foreground italic font-medium">No Buy Crypto transactions found.</td></tr>
                          ) : buyTransactions.map((tx) => {
                            const fiatVal = parseFloat(tx.external_id?.split('_')[1] || "0");
                            const fiatCurr = tx.external_id?.split('_')[2] || "USD";
                            return (
                            <tr key={tx.id} className="group hover:bg-secondary/50">
                              <td className="py-5 px-6">
                                <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full w-fit text-[10px] font-black uppercase tracking-widest border ${
                                  tx.status === "Completed" ? "bg-green-500/10 text-green-500 border-green-500/20" : tx.status === "Pending" ? "bg-amber-500/10 text-amber-500 border-amber-500/20" : "bg-red-500/10 text-red-500 border-red-500/20"
                                }`}>
                                   {tx.status}
                                </div>
                              </td>
                              <td className="py-5 px-6">
                                <div className="font-bold text-foreground text-xs uppercase tracking-tight">{tx.profiles?.name || "Member"}</div>
                                <div className="text-[10px] text-muted-foreground font-medium lowercase italic tracking-tight">{(tx.internal_id || tx.id)?.substring(0, 8)}</div>
                              </td>
                              <td className="py-5 px-6 font-black text-foreground">{formatCurrency(fiatVal)} <span className="text-[9px] text-muted-foreground tracking-widest uppercase">{fiatCurr}</span></td>
                              <td className="py-5 px-6 font-black text-primary">+{tx.amount || 0} {tx.asset?.toUpperCase()}</td>
                              <td className="py-5 px-6 text-right">
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
                                  <div className="text-xs text-muted-foreground font-medium">
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
                        <div key={i} className="p-8 rounded-[2rem] bg-secondary/30 border border-white/5 relative overflow-hidden group">
                           <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                              <f.icon className="w-12 h-12" />
                           </div>
                           <div className="text-[10px] font-bold text-muted-foreground/40 uppercase tracking-[0.3em] mb-4">{f.label}</div>
                           <div className="text-3xl font-black text-primary tracking-tight font-display mb-2">{f.value}</div>
                            <div className="text-xs font-semibold text-green-600">Active / Global</div>
                        </div>
                      ))}
                   </div>
                   
                   <div className="p-10 rounded-[2.5rem] bg-card border border-border shadow-huge max-w-2xl mx-auto">
                      <h3 className="text-xl font-bold mb-6 italic">Fee Settings</h3>
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
                   
                   <div className="p-10 rounded-[2.5rem] bg-primary/5 border border-primary/20 backdrop-blur-3xl">
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

              {tab === "suspicious" && (
                <motion.div 
                   key="suspicious" 
                   initial={{ opacity: 0, y: 10 }} 
                   animate={{ opacity: 1, y: 0 }} 
                   exit={{ opacity: 0, y: 10 }}
                   className="space-y-6"
                >
                  <div className="flex items-center gap-3 text-loss mb-8 p-4 bg-loss/10 border border-loss/20 rounded-2xl w-fit">
                     <ShieldAlert className="w-5 h-5 animate-bounce-slow" />
                      <span className="text-xs font-semibold">Monitoring active</span>
                  </div>
                  
                  {suspiciousActivity.map((a, i) => (
                    <motion.div 
                       key={i} 
                       initial={{ opacity: 0, x: -20 }}
                       animate={{ opacity: 1, x: 0 }}
                       transition={{ delay: i * 0.1 }}
                       className={`p-8 rounded-[2rem] border relative overflow-hidden group ${a.severity === "CRITICAL" ? "border-loss/30 bg-loss/5" : "border-warning/30 bg-warning/5"}`}
                    >
                      <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                         <ShieldAlert className="w-24 h-24 rotate-12" />
                      </div>
                      
                      <div className="flex flex-col md:flex-row items-center justify-between gap-8 relative z-10">
                        <div className="flex items-start gap-6">
                           <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all shadow-huge ${a.severity === "CRITICAL" ? "bg-loss/20 text-loss border border-loss/30" : "bg-warning/20 text-warning border border-warning/30"}`}>
                              <AlertTriangle className="w-7 h-7" />
                           </div>
                           <div>
                              <div className="flex items-center gap-3 mb-2">
                                 <span className="font-bold text-foreground text-lg">{a.user}</span>
                                 <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${a.severity === "CRITICAL" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"}`}>
                                    {a.severity}
                                 </span>
                              </div>
                              <div className="text-[10px] text-muted-foreground/60 font-bold tracking-widest uppercase max-w-lg mb-2">{a.detail}</div>
                               <div className="text-xs text-muted-foreground">IP Address: {a.ip}</div>
                           </div>
                        </div>
                        
                        <div className="flex flex-col items-end gap-3">
                           <div className="text-[10px] font-bold text-muted-foreground/30 uppercase tracking-[0.2em]">{a.time}</div>
                           <div className="flex gap-3">
                               <Button variant="outline" className="h-9 px-4 text-xs font-medium rounded-lg border-border hover:bg-secondary">
                                  Dismiss
                              </Button>
                              <Button className={`h-10 px-6 border-none text-[9px] font-bold tracking-widest uppercase rounded-xl shadow-huge ${a.severity === "CRITICAL" ? "bg-loss text-white glow-loss" : "bg-warning text-black glow-warning"}`}>
                                  Lock Account
                              </Button>
                           </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                  
                  <div className="pt-10 flex justify-center">
                      <div className="flex items-center gap-2 text-muted-foreground text-xs">
                         <Activity className="w-4 h-4" /> Status: Normal
                     </div>
                  </div>
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
                        className="bg-secondary/20 border border-white/5 rounded-2xl p-6 overflow-hidden"
                      >
                         <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
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
                      <div key={w.id} className="p-8 rounded-[2.5rem] bg-secondary/10 border border-white/5 relative group hover:border-primary/20 transition-all duration-500">
                        <div className="flex flex-col sm:flex-row gap-8 items-start sm:items-center">
                          <div className="w-32 h-32 rounded-3xl bg-white p-3 shadow-huge shrink-0 border border-white/10 group-hover:scale-105 transition-transform duration-500">
                            <img 
                              src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${w.address}`} 
                              alt="Wallet QR" 
                              className="w-full h-full object-contain"
                            />
                          </div>
                          <div className="flex-1 space-y-4 w-full">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
                                  <Coins className="w-5 h-5" />
                                </div>
                                <div>
                                  <h4 className="font-bold text-white uppercase tracking-tight">{w.coin}</h4>
                                  {w.network && <span className="text-[10px] font-bold text-primary/50 uppercase tracking-widest">{w.network} NETWORK</span>}
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
