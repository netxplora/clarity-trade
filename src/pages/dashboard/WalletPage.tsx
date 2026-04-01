import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { validateWalletAddress } from "@/lib/wallet-validator";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useStore } from "@/store/useStore";
import { supabase } from "@/lib/supabase";
import BuyCryptoModule from "@/components/dashboard/BuyCryptoModule";
import {
  ArrowUpRight,
  ArrowDownRight,
  Copy,
  Send,
  Download,
  ShieldCheck,
  ShieldAlert,
  Clock,
  Landmark,
  Globe,
  Zap,
  CreditCard,
  CreditCardIcon,
  RefreshCw,
  Coins,
  ArrowRightLeft
} from "lucide-react";
import CardDepositModule from "@/components/dashboard/CardDepositModule";
import TransferModule from "@/components/dashboard/TransferModule";
import ConvertModule from "@/components/dashboard/ConvertModule";

type Tab = "deposit" | "buy" | "transfer" | "convert" | "withdraw" | "history";
type MethodType = "crypto" | "fiat";

const WalletPage = () => {
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("deposit");
  
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tabParam = params.get('tab') as Tab;
    if (tabParam && ["deposit", "buy", "transfer", "convert", "withdraw", "history"].includes(tabParam)) {
        setTab(tabParam);
    }
  }, [window.location.search]);

  const [method, setMethod] = useState<MethodType>("crypto");
  const [selectedCoin, setSelectedCoin] = useState("BTC");
  const [selectedFiat, setSelectedFiat] = useState("USD");
  const [withdrawAddress, setWithdrawAddress] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [fiatDepositType, setFiatDepositType] = useState<"selector" | "bank" | "card">("selector");
  
  const [transactions, setTransactions] = useState<any[]>([]);
  const [depositWallets, setDepositWallets] = useState<any[]>([]);
  
  const { user, balance, formatCurrency } = useStore();

  const fetchWalletData = async () => {
     if (!user?.id) return;
     const [{ data: txData }, { data: walletData }] = await Promise.all([
         supabase.from('transactions').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
         supabase.from('deposit_wallets').select('*').eq('status', 'Active')
     ]);
     if (txData) setTransactions(txData);
     if (walletData) setDepositWallets(walletData);
  };

  useEffect(() => {
     fetchWalletData();
  }, [user?.id]);

  const currentWallet = depositWallets.find(w => {
    const symbolMap: Record<string, string> = { 'BTC': 'Bitcoin', 'ETH': 'Ethereum', 'USDT': 'USDT' };
    const targetName = symbolMap[selectedCoin.toUpperCase()] || selectedCoin;
    return w.coin.toUpperCase() === targetName.toUpperCase();
  });

  const fiatBal = user?.fiatBalanceNum || 0;
  const tradingBal = user?.tradingBalance || 0;
  const grandTotal = balance.total; 

  const cryptoPrices: Record<string, number> = { btc: 65100, eth: 3545, usdt: 1, sol: 145, usdc: 1, xrp: 0.62, bnb: 580 };
  
  const cryptoBalances = Object.entries(user?.balances || {}).map(([coin, amount]) => {
      const price = cryptoPrices[coin.toLowerCase()] || 0;
      const symbols: Record<string, string> = { btc: '₿', eth: 'Ξ', usdt: '₮', sol: 'S' };
      const colors: Record<string, string> = { btc: 'text-[#F7931A]', eth: 'text-[#627EEA]', usdt: 'text-[#26A17B]', sol: 'text-purple-500' };
      
      return {
          coin: coin.toUpperCase(),
          symbol: coin.toUpperCase(),
          amount: Number(amount).toLocaleString(),
          usd: formatCurrency(Number(amount) * price),
          icon: symbols[coin.toLowerCase()] || coin.charAt(0).toUpperCase(),
          change: "",
          color: colors[coin.toLowerCase()] || "text-primary"
      };
  }).filter(b => Number(b.amount.replace(/,/g, '')) > 0 || ['BTC', 'ETH', 'USDT'].includes(b.symbol));

  const fiatBalances = [
     { coin: "US Dollar", symbol: "USD", amount: fiatBal.toLocaleString(), usd: formatCurrency(fiatBal), icon: "$", change: "", color: "text-green-600" },
  ];

  const handleCopy = () => {
    if (currentWallet) {
      navigator.clipboard.writeText(currentWallet.address);
      toast.success(`${selectedCoin} Address copied to clipboard`);
    } else {
      toast.error("No address available for this asset");
    }
  };


  const handleWithdraw = async () => {
    const kycStatus = user?.kyc || 'None';
    const isVerified = kycStatus === 'Verified' || kycStatus === 'Approved' || kycStatus === 'Intermediate' || kycStatus === 'Advanced';
    
    if (!isVerified) {
        toast.error("KYC Verification Required", {
            description: "Please complete identity verification to unlock withdrawals."
        });
        navigate('/dashboard/kyc');
        return;
    }

    let maxWithdrawal = 0;
    let tierName = "Unverified";

    if (kycStatus === 'Verified' || kycStatus === 'Approved') {
        maxWithdrawal = 10000;
        tierName = "Standard Verified";
    } else if (kycStatus === 'Intermediate') {
        maxWithdrawal = 50000;
        tierName = "Intermediate";
    } else if (kycStatus === 'Advanced') {
        maxWithdrawal = 1000000; // Effectively Unlimited
        tierName = "Advanced / Institutional";
    }


    if (!withdrawAddress || !withdrawAmount) {
      toast.error("Please fill in all fields");
      return;
    }

    if (method === 'crypto') {
        const validation = await validateWalletAddress(withdrawAddress, selectedCoin);
        if (!validation.isValid) {
            toast.error(validation.error);
            return;
        }
    }

    const amount = parseFloat(withdrawAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    if (amount > maxWithdrawal) {
      toast.error(`Withdrawal Limit Exceeded`, {
         description: `Your current KYC Level (${tierName}) only allows up to ${formatCurrency(maxWithdrawal)} per transaction.`
      });
      return;
    }


    try {
        const { data: b, error: fetchError } = await supabase.from('balances').select('*').eq('user_id', user?.id).maybeSingle();
        if (fetchError || !b) throw new Error("Could not fetch balance data");

        if (method === 'fiat') {
            const currentFiat = Number(b.fiat_balance || 0);
            if (amount > currentFiat) {
                toast.error(`Insufficient ${selectedFiat} balance`);
                return;
            }

            await supabase.from('balances').update({
                fiat_balance: Math.max(0, currentFiat - amount)
            }).eq('user_id', user?.id);
        } else {
            const crypto = b.crypto_balances || {};
            const coinKey = selectedCoin.toLowerCase();
            const currentCrypto = Number(crypto[coinKey] || 0);

            if (amount > currentCrypto) {
                toast.error(`Insufficient ${selectedCoin} balance`);
                return;
            }

            const updatedCrypto = { ...crypto, [coinKey]: Math.max(0, currentCrypto - amount) };
            await supabase.from('balances').update({
                crypto_balances: updatedCrypto
            }).eq('user_id', user?.id);
        }

        const { error } = await supabase.from('transactions').insert({
            user_id: user?.id,
            type: "Withdrawal",
            amount: amount,
            asset: method === 'crypto' ? selectedCoin : selectedFiat,
            status: 'Pending'
        });
        
        if (!error) {
           // Notify Admin
           await supabase.from('notifications').insert({
               user_id: null,
               title: `New Withdrawal Request`,
               message: `${user?.name || 'User'} requested withdrawal of ${formatCurrency(amount, method === 'crypto' ? selectedCoin : selectedFiat)} via ${method === 'crypto' ? selectedCoin : 'Bank/Card'}.`,
               type: 'WITHDRAWAL',
               is_read: false
           });

           toast.success(`${method.toUpperCase()} Withdrawal request submitted successfully`);
           setWithdrawAddress("");
           setWithdrawAmount("");
           setTab("history");
           fetchWalletData();
        } else {
           toast.error(error.message);
        }
    } catch(err: any) {
        console.error("Withdrawal error:", err);
        toast.error(err.message || "Withdrawal request failed.");
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <header className="pb-6 border-b border-border">
          <h1 className="text-3xl font-bold font-sans text-foreground">Wallet</h1>
          <p className="text-muted-foreground mt-1 text-sm">Manage your crypto and fiat balances.</p>
        </header>

        <div className="grid lg:grid-cols-12 gap-8">
           <div className="lg:col-span-4 space-y-6">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-card p-8 rounded-3xl border border-border shadow-md relative overflow-hidden group"
              >
                <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-primary/10 rounded-full blur-[80px]" />
                <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Total Net Worth</div>
                <div className="text-4xl font-bold text-foreground tracking-tight">{formatCurrency(grandTotal)}</div>
                
                <div className="mt-6 space-y-3">
                  <div className="p-4 rounded-2xl bg-secondary/50 border border-border flex justify-between items-center group/item hover:border-primary/30 transition-all">
                    <div>
                      <div className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Fiat / Main</div>
                      <div className="text-lg font-black text-foreground tabular-nums">{formatCurrency(fiatBal)}</div>
                    </div>
                    <Landmark className="w-5 h-5 text-muted-foreground/20 group-hover/item:text-primary transition-colors" />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                     <div className="p-4 rounded-2xl bg-secondary/50 border border-border group/item hover:border-primary/30 transition-all">
                        <div className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Trading</div>
                        <div className="text-sm font-black text-foreground tabular-nums mt-1">{formatCurrency(tradingBal)}</div>
                     </div>
                     <div className="p-4 rounded-2xl bg-primary/5 border border-primary/10 group/item hover:border-primary/30 transition-all cursor-pointer" onClick={() => navigate('/dashboard/copy-trading')}>
                        <div className="text-[9px] font-black text-primary uppercase tracking-widest">Copy Trading</div>
                        <div className="text-sm font-black text-primary tabular-nums mt-1">{formatCurrency(balance.copyTrading)}</div>
                     </div>
                  </div>
                </div>
              </motion.div>

              <div className="space-y-4">
                <div className="px-1 flex items-center justify-between">
                   <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Crypto Balances</h3>
                </div>
                <div className="grid grid-cols-1 gap-3">
                  {cryptoBalances.map((b, i) => (
                    <motion.div
                      key={b.symbol}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="bg-card p-4 rounded-2xl border border-border hover:border-primary/30 transition-all group shadow-sm"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className={`w-12 h-12 rounded-xl bg-secondary flex items-center justify-center text-2xl font-bold group-hover:scale-110 transition-transform ${b.color}`}>
                            {b.icon}
                          </div>
                          <div>
                            <div className="font-bold text-foreground text-sm uppercase tracking-wider">{b.coin}</div>
                            <div className="text-[10px] text-muted-foreground flex items-center gap-1.5 mt-0.5 font-semibold">
                              {b.amount} {b.symbol}
                              <span className="w-1 h-1 rounded-full bg-border" />
                              {b.change}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                           <div className="font-bold text-foreground">{b.usd}</div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>

                <div className="px-1 pt-4 flex items-center justify-between border-t border-border">
                   <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Fiat Balances</h3>
                    <Landmark className="w-4 h-4 text-muted-foreground/30" />
                </div>
                <div className="grid grid-cols-1 gap-3">
                  {fiatBalances.map((b, i) => (
                    <motion.div
                      key={b.symbol}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 + i * 0.1 }}
                      className="bg-card p-4 rounded-2xl border border-border hover:border-primary/30 transition-all group shadow-sm"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className={`w-12 h-12 rounded-xl bg-secondary flex items-center justify-center text-2xl font-bold group-hover:scale-110 transition-transform ${b.color}`}>
                            {b.icon}
                          </div>
                          <div>
                            <div className="font-bold text-foreground text-sm uppercase tracking-wider">{b.coin}</div>
                            <div className="text-[10px] text-muted-foreground flex items-center gap-1.5 mt-0.5 font-semibold">
                              {b.amount} {b.symbol}
                              <span className="w-1 h-1 rounded-full bg-border" />
                              {b.change}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                           <div className="font-bold text-foreground">{b.usd}</div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
           </div>

           <div className="lg:col-span-8">
              <div className="bg-card rounded-3xl border border-border shadow-sm h-full flex flex-col overflow-hidden">
                <div className="flex border-b border-border bg-secondary/30 overflow-x-auto no-scrollbar">
                  {(["deposit", "buy", "transfer", "convert", "withdraw", "history"] as Tab[]).map((t) => (
                    <button
                      key={t}
                      onClick={() => setTab(t)}
                      className={`flex-1 min-w-[100px] h-14 text-[10px] font-black uppercase tracking-widest transition-all ${
                        tab === t ? "bg-card text-primary border-b-2 border-primary shadow-sm" : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                      }`}
                    >
                      {t === 'buy' ? 'Buy Crypto' : t}
                    </button>
                  ))}
                </div>

                <div className="p-6 md:p-10 flex-1">
                   {tab !== 'history' && (
                     <div className="flex items-center gap-2 p-1.5 bg-secondary border border-border rounded-xl w-fit mb-8 mx-auto">
                        <button 
                           onClick={() => setMethod('crypto')}
                           className={`px-6 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${method === 'crypto' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                        >
                           Crypto
                        </button>
                        <button 
                           onClick={() => setMethod('fiat')}
                           className={`px-6 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${method === 'fiat' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                        >
                           Fiat
                        </button>
                     </div>
                   )}

                  {tab === "deposit" && (
                    <div className="max-w-xl mx-auto">
                      <AnimatePresence mode="wait">
                         {method === 'crypto' ? (
                           <motion.div 
                              key="crypto-dep"
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -10 }}
                              className="space-y-8"
                           >
                               <div className="flex flex-col lg:flex-row gap-10 items-center">
                                 <div className="flex-1 space-y-6 w-full">
                                   <div>
                                     <label className="text-xs font-bold text-muted-foreground mb-3 block uppercase tracking-widest">1. Select Crypto</label>
                                     <div className="flex flex-wrap gap-2">
                                       {["BTC", "ETH", "USDT"].map((c) => (
                                         <button
                                           key={c}
                                           onClick={() => setSelectedCoin(c)}
                                           className={`px-6 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all border ${
                                             selectedCoin === c ? "bg-gradient-gold text-white shadow-gold border-transparent" : "bg-secondary/40 text-muted-foreground hover:border-primary/20 hover:text-white"
                                           }`}
                                         >
                                           {c}
                                         </button>
                                       ))}
                                     </div>
                                   </div>

                                   {currentWallet ? (
                                     <div className="space-y-6">
                                       <div>
                                         <label className="text-xs font-bold text-muted-foreground mb-3 block uppercase tracking-widest">2. Deposit Address</label>
                                         <div className="flex items-center gap-2">
                                           <div className="flex-1 h-14 bg-secondary border border-border font-mono text-sm rounded-2xl flex items-center px-6 overflow-x-auto no-scrollbar text-foreground">
                                              {currentWallet.address}
                                           </div>
                                           <Button variant="outline" size="icon" className="h-14 w-14 shrink-0 border-border bg-card rounded-2xl hover:bg-primary hover:text-primary-foreground transition-all shadow-huge group" onClick={handleCopy}>
                                             <Copy className="w-4 h-4 group-hover:scale-110 transition-transform" />
                                           </Button>
                                         </div>
                                         {currentWallet.network && (
                                           <div className="mt-3 flex items-center gap-2 px-3 py-1 rounded-lg bg-primary/10 border border-primary/20 w-fit">
                                              <Zap className="w-3 h-3 text-primary" />
                                              <span className="text-[10px] font-bold text-primary uppercase tracking-widest">Network: {currentWallet.network} ONLY</span>
                                           </div>
                                         )}
                                       </div>
                                     </div>
                                   ) : (
                                     <div className="p-8 rounded-2xl bg-secondary/40 border border-border text-center italic text-muted-foreground text-sm">
                                        Deposit address for {selectedCoin} is temporarily unavailable. 
                                        Please contact support or select another method.
                                     </div>
                                   )}
                                 </div>

                                 {currentWallet && (
                                   <div className="flex flex-col items-center gap-4 group">
                                     <div className="p-4 bg-white shadow-huge rounded-[2.5rem] w-48 h-48 border border-white/10 group-hover:scale-105 transition-transform duration-500">
                                       <img 
                                          src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${currentWallet.address}`} 
                                          alt="Deposit QR" 
                                          className="w-full h-full object-contain" 
                                       />
                                     </div>
                                     <span className="text-[10px] uppercase tracking-[0.3em] text-primary font-black animate-pulse">Your QR Code</span>
                                   </div>
                                 )}
                               </div>

                               <div className="flex items-start gap-5 p-8 rounded-[2.5rem] bg-secondary/20 border border-white/5 relative overflow-hidden">
                                  <div className="absolute top-0 right-0 p-4 opacity-5">
                                     <ShieldCheck className="w-12 h-12" />
                                  </div>
                                  <Clock className="w-6 h-6 text-primary mt-0.5 shrink-0" />
                                  <div className="space-y-2">
                                     <h4 className="text-xs font-bold text-white uppercase tracking-widest">Important Notes</h4>
                                     <ul className="text-[11px] text-muted-foreground leading-relaxed font-medium list-disc pl-4 space-y-1 decoration-primary">
                                        <li>Minimum deposit: 50.00 USD equivalent. Deposits below this amount will not be credited.</li>
                                        <li>Trading access is determined by your <span className="text-primary font-bold">Total Wallet Balance</span>. Ensure you meet the minimum requirement for your chosen trader.</li>
                                        <li>Withdrawal limits are strictly tied to your <span className="text-primary font-bold">KYC Verification Level</span>.</li>
                                        <li>Ensure you are sending via the <span className="text-primary">{currentWallet?.network || 'correct'}</span> network.</li>
                                        <li>Only send the selected crypto to this address.</li>
                                     </ul>

                                  </div>
                               </div>
                           </motion.div>
                         ) : (
                            <motion.div 
                               key="fiat-dep"
                               initial={{ opacity: 0, y: 10 }}
                               animate={{ opacity: 1, y: 0 }}
                               exit={{ opacity: 0, y: -10 }}
                               className="space-y-8"
                            >
                                <AnimatePresence mode="wait">
                                {fiatDepositType === "selector" ? (
                                  <motion.div 
                                    key="selector"
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    className="space-y-8"
                                  >
                                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div 
                                           onClick={() => setFiatDepositType("bank")}
                                           className="p-6 rounded-2xl bg-card border border-border hover:border-primary/40 transition-all shadow-sm cursor-pointer group"
                                        >
                                           <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center text-primary mb-4 transition-transform group-hover:scale-110">
                                              <Landmark className="w-5 h-5" />
                                           </div>
                                           <h3 className="font-bold text-foreground mb-1">Bank Transfer</h3>
                                           <p className="text-xs text-muted-foreground leading-relaxed">SWIFT/SEPA transfers. 1-3 business days.</p>
                                        </div>
                                        <div 
                                           onClick={() => setFiatDepositType("card")}
                                           className="p-6 rounded-2xl bg-card border border-border hover:border-primary/40 transition-all shadow-sm cursor-pointer group"
                                        >
                                           <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center text-primary mb-4 transition-transform group-hover:scale-110">
                                              <CreditCard className="w-5 h-5" />
                                           </div>
                                           <h3 className="font-bold text-foreground mb-1">Credit/Debit Card</h3>
                                           <p className="text-xs text-muted-foreground leading-relaxed">Secure and instant processing.</p>
                                        </div>
                                     </div>
                                     
                                     <div className="p-6 rounded-2xl bg-secondary/30 border border-border space-y-6">
                                        <div>
                                          <label className="text-xs font-semibold text-foreground mb-3 block">Select Currency</label>
                                          <div className="grid grid-cols-3 gap-3">
                                             {["USD", "EUR", "GBP"].map(f => (
                                                <button 
                                                   key={f}
                                                   onClick={() => setSelectedFiat(f)}
                                                   className={`py-3 rounded-xl text-xs font-bold transition-all border ${selectedFiat === f ? 'bg-card border-primary text-primary shadow-sm' : 'bg-card border-border text-muted-foreground hover:bg-secondary'}`}
                                                >
                                                   {f}
                                                </button>
                                             ))}
                                          </div>
                                        </div>
                                        <div>
                                          <label className="text-xs font-semibold text-foreground mb-3 block">Amount To Deposit</label>
                                          <Input placeholder="0.00" type="number" className="h-14 bg-card border-border rounded-xl text-lg font-bold text-zinc-950" />

                                        </div>
                                         <Button variant="outline" className="w-full h-14 rounded-xl border-primary text-primary font-semibold flex items-center justify-center">
                                           Continue
                                        </Button>
                                     </div>
                                  </motion.div>
                                ) : fiatDepositType === "card" ? (
                                  <motion.div 
                                    key="card-flow"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                  >
                                     <div className="mb-6">
                                        <Button 
                                          variant="ghost" 
                                          onClick={() => setFiatDepositType("selector")}
                                          className="text-[10px] font-black text-muted-foreground uppercase tracking-widest p-0 h-auto hover:text-primary"
                                        >
                                           ← Back to Methods
                                        </Button>
                                     </div>
                                     <CardDepositModule />
                                  </motion.div>
                                ) : (
                                  <motion.div 
                                    key="bank-flow"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className="space-y-8"
                                  >
                                    <div className="mb-2">
                                        <Button 
                                          variant="ghost" 
                                          onClick={() => setFiatDepositType("selector")}
                                          className="text-[10px] font-black text-muted-foreground uppercase tracking-widest p-0 h-auto hover:text-primary"
                                        >
                                           ← Back to Methods
                                        </Button>
                                    </div>
                                    <div className="p-6 rounded-2xl bg-secondary/30 border border-border space-y-6">
                                        <div>
                                          <label className="text-xs font-semibold text-foreground mb-3 block">Select Currency (Bank)</label>
                                          <div className="grid grid-cols-3 gap-3">
                                            {["USD", "EUR", "GBP"].map(f => (
                                                <button 
                                                  key={f}
                                                  onClick={() => setSelectedFiat(f)}
                                                  className={`py-3 rounded-xl text-xs font-bold transition-all border ${selectedFiat === f ? 'bg-card border-primary text-primary shadow-sm' : 'bg-card border-border text-muted-foreground hover:bg-secondary'}`}
                                                >
                                                  {f}
                                                </button>
                                            ))}
                                          </div>
                                        </div>
                                        <div>
                                          <label className="text-xs font-semibold text-foreground mb-3 block">Amount To Deposit</label>
                                          <Input placeholder="0.00" type="number" className="h-14 bg-card border-border rounded-xl text-lg font-bold" />
                                        </div>
                                         <Button variant="outline" className="w-full h-14 rounded-xl border-primary text-primary font-semibold flex items-center justify-center">
                                          Continue
                                        </Button>
                                    </div>
                                  </motion.div>
                                )}
                               </AnimatePresence>
                            </motion.div>
                         )}
                      </AnimatePresence>
                    </div>
                  )}

                  {tab === "buy" && (
                    <div className="space-y-8">
                        <BuyCryptoModule />
                    </div>
                  )}

                  {tab === "transfer" && (
                    <div className="space-y-8">
                        <TransferModule />
                    </div>
                  )}

                  {tab === "convert" && (
                    <div className="space-y-8">
                        <ConvertModule />
                    </div>
                  )}

                  {tab === "withdraw" && (
                    <div className="max-w-xl mx-auto space-y-8">
                       <div className="p-8 rounded-[2.5rem] bg-card border border-border shadow-huge space-y-6 relative overflow-hidden group">
                          <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:scale-110 transition-transform duration-700">
                             <ShieldCheck className="w-16 h-16" />
                          </div>
                          
                          <div className="flex items-center justify-between">
                             <div className="space-y-1">
                                <h3 className="text-xs font-black text-muted-foreground uppercase tracking-[0.2em]">Current Limit</h3>
                                <div className="text-2xl font-black text-foreground tabular-nums">
                                   {user?.kyc === 'Intermediate' ? formatCurrency(50000) : (user?.kyc === 'Verified' || user?.kyc === 'Approved') ? formatCurrency(10000) : user?.kyc === 'Advanced' ? 'Unlimited' : formatCurrency(0)}
                                   <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-2">/ Day</span>
                                </div>
                             </div>
                             <div className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${
                                (user?.kyc === 'Verified' || user?.kyc === 'Approved' || user?.kyc === 'Intermediate' || user?.kyc === 'Advanced') 
                                ? 'bg-primary/10 border-primary/20 text-primary' 
                                : 'bg-destructive/10 border-destructive/20 text-destructive animate-pulse'
                             }`}>
                                {user?.kyc === 'Intermediate' ? 'TIER 2' : (user?.kyc === 'Verified' || user?.kyc === 'Approved') ? 'TIER 1' : user?.kyc === 'Advanced' ? 'TIER 3' : 'UNVERIFIED'}
                             </div>
                          </div>

                          <div className="pt-4 border-t border-border flex items-center justify-between gap-4">
                             <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center">
                                   <ShieldAlert className="w-4 h-4 text-muted-foreground/60" />
                                </div>
                                <p className="text-[10px] font-bold text-muted-foreground uppercase leading-relaxed max-w-[200px]">
                                   { (user?.kyc === 'Verified' || user?.kyc === 'Approved' || user?.kyc === 'Intermediate' || user?.kyc === 'Advanced') 
                                      ? "Account verified. Higher tiers available for Institutional users." 
                                      : "Identity verification required to enable withdrawal processing." }
                                </p>
                             </div>
                             {!(user?.kyc === 'Verified' || user?.kyc === 'Approved' || user?.kyc === 'Intermediate' || user?.kyc === 'Advanced') && (
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  onClick={() => navigate('/dashboard/kyc')} 
                                  className="h-9 px-4 rounded-lg bg-secondary/50 border-border text-[10px] font-black uppercase tracking-widest hover:bg-primary hover:text-white transition-all"
                                >
                                   Verify Now
                                </Button>
                             )}
                          </div>
                       </div>
                       
                       <>


                          <div className="grid grid-cols-2 gap-6 items-end">
                            <div className="space-y-3">
                               <div className="flex justify-between items-center">
                                   <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Asset</label>
                                   <span className="text-[10px] font-bold text-primary">
                                       {method === 'crypto' 
                                         ? `${(user?.balances as any)?.[selectedCoin.toLowerCase()] || 0} ${selectedCoin}`
                                         : `${(user?.fiatBalanceNum || 0).toLocaleString()} ${selectedFiat}`}
                                   </span>
                               </div>
                               <div className="grid grid-cols-3 gap-2">
                                {(method === 'crypto' ? ["BTC", "ETH", "USDT"] : ["USD", "EUR", "GBP"]).map((c) => (
                                  <button
                                    key={c}
                                    onClick={() => method === 'crypto' ? setSelectedCoin(c) : setSelectedFiat(c)}
                                    className={`py-3 rounded-xl text-xs font-black transition-all border ${
                                      (method === 'crypto' ? selectedCoin : selectedFiat) === c ? "bg-primary border-primary text-white shadow-sm" : "bg-card border-border text-muted-foreground hover:bg-secondary"
                                    }`}
                                  >
                                    {c}
                                  </button>
                                ))}
                               </div>
                            </div>

                            <div className="space-y-3">
                               <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest pl-1">Amount</label>
                               <div className="relative">
                                  <Input 
                                    className="h-14 bg-secondary/50 border-border rounded-xl font-bold text-lg text-zinc-950" 
                                    placeholder="0.00"
                                    value={withdrawAmount}
                                    onChange={(e) => setWithdrawAmount(e.target.value)}
                                  />
                                  <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black uppercase text-primary cursor-pointer hover:underline" onClick={() => setWithdrawAmount(method === 'crypto' ? String((user?.balances as any)?.[selectedCoin.toLowerCase()] || 0) : String(user?.fiatBalanceNum || 0))}>MAX</div>
                               </div>
                            </div>
                          </div>

                          {method === 'crypto' && (
                              <div className="grid grid-cols-2 gap-4">
                                  <div className="p-3.5 rounded-2xl bg-secondary/30 border border-border">
                                      <div className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-1">Asset Value</div>
                                      <div className="text-sm font-black text-foreground">{formatCurrency(((user?.balances as any)?.[selectedCoin.toLowerCase()] || 0) * (cryptoPrices[selectedCoin.toLowerCase()] || 0))}</div>
                                  </div>
                                  {withdrawAmount && parseFloat(withdrawAmount) > 0 && (
                                      <div className="p-3.5 rounded-2xl bg-primary/5 border border-primary/20">
                                          <div className="text-[9px] font-black text-primary uppercase tracking-[0.2em] mb-1">Estimated Value</div>
                                          <div className="text-sm font-black text-primary">{formatCurrency(parseFloat(withdrawAmount) * (cryptoPrices[selectedCoin.toLowerCase()] || 0))}</div>
                                      </div>
                                  )}
                              </div>
                          )}

                          <div className="space-y-3">
                             <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest pl-1">
                                {method === 'crypto' ? `${selectedCoin} Destination Address` : `Bank Details / Card Reference`}
                             </label>
                             <div className="relative">
                                <Input 
                                  className="h-16 bg-secondary/50 border-border rounded-xl font-mono text-sm tracking-tighter text-zinc-950" 
                                  placeholder={method === 'crypto' ? "Enter your wallet address" : "Enter bank details or card alias"}
                                  value={withdrawAddress}
                                  onChange={(e) => setWithdrawAddress(e.target.value)}
                                />
                                <Send className="absolute right-6 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground opacity-20" />
                             </div>
                             <p className="text-[9px] text-muted-foreground font-bold uppercase tracking-widest pl-1">
                                {method === 'crypto' 
                                  ? `Ensue the address supports the ${selectedCoin} network.` 
                                  : `Processing takes 12-48 hours depending on your bank.`}
                             </p>
                          </div>

                          <div className="p-8 rounded-[2rem] bg-foreground text-background shadow-huge">
                             <div className="flex justify-between items-center mb-6">
                                <div>
                                   <p className="text-[10px] font-black uppercase opacity-60 tracking-widest">You Withdraw</p>
                                   <p className="text-3xl font-black">{withdrawAmount ? formatCurrency(parseFloat(withdrawAmount)) : formatCurrency(0)}</p>
                                 </div>
                                 <div className="text-right">
                                    <p className="text-[10px] font-black uppercase opacity-60 tracking-widest">Fee (0.5%)</p>
                                    <p className="font-bold">{withdrawAmount ? formatCurrency(parseFloat(withdrawAmount) * 0.005) : formatCurrency(0)}</p>
                                 </div>
                              </div>
                              <Button 
                                 onClick={handleWithdraw}
                                 className="w-full h-16 rounded-2xl bg-white text-black font-black uppercase tracking-[0.2em] hover:bg-white/90 transition-all shadow-huge"
                              >
                                 Request Withdrawal
                              </Button>
                           </div>
                        </>
                    </div>
                  )}

                  {tab === "history" && (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>

                          <tr className="text-muted-foreground border-b border-border text-xs font-semibold uppercase tracking-wider">
                            <th className="text-left pb-4 pl-4">Type</th>
                            <th className="text-left pb-4">Amount</th>
                            <th className="text-left pb-4">Asset</th>
                            <th className="text-left pb-4">Status</th>
                            <th className="text-right pb-4 pr-4">Date</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                          {transactions.length === 0 ? (
                            <tr><td colSpan={5} className="py-20 text-center text-muted-foreground">No recent transactions found.</td></tr>
                          ) : transactions.map((tx) => (
                            <tr key={tx.id} className="group hover:bg-secondary/50 transition-colors">
                              <td className="py-4 px-4">
                                <div className="flex items-center gap-4">
                                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center border border-border group-hover:scale-110 transition-transform ${
                                    tx.type === "Deposit" || tx.type === "Bank Transfer" ? "bg-green-50 text-green-600" : tx.type === "Withdrawal" ? "bg-red-50 text-red-600" : "bg-primary/10 text-primary"
                                  }`}>
                                    {tx.type === "Deposit" ? <Download className="w-4 h-4" /> : tx.type === "Bank Transfer" ? <Landmark className="w-4 h-4" /> : <Send className="w-4 h-4" />}
                                  </div>
                                  <div>
                                    <div className="font-bold text-foreground text-sm">{tx.type}</div>
                                  </div>
                                </div>
                              </td>
                              <td className={`py-4 font-bold ${tx.type === "Withdrawal" ? "text-red-600" : "text-green-600"}`}>
                                {tx.type === "Withdrawal" ? "- " : "+ "}{formatCurrency(tx.amount)}
                              </td>
                              <td className="py-4">
                                 <span className="font-bold text-foreground text-xs">{tx.asset}</span>
                              </td>
                              <td className="py-4">
                                <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full w-fit text-[10px] font-bold border ${
                                  tx.status === "Completed" ? "bg-green-50 text-green-700 border-green-200" : "bg-orange-50 text-orange-700 border-orange-200"
                                }`}>
                                   {tx.status === "Completed" ? <ShieldCheck className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                                   {tx.status}
                                </div>
                              </td>
                              <td className="py-4 px-4 text-right">
                                 <div className="text-xs text-muted-foreground font-medium">{new Date(tx.created_at).toLocaleDateString()}</div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
           </div>
            </div>
      </div>
    </DashboardLayout>
  );
};

export default WalletPage;
