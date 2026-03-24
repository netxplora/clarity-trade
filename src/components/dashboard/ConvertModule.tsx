import { useState, useMemo } from 'react';
import { useStore } from '@/store/useStore';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { RefreshCw, ArrowRightLeft, Loader2, Info, Zap, ShieldCheck, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Input } from '@/components/ui/input';

const cryptoPrices: Record<string, number> = { 
    BTC: 65120, 
    ETH: 3540, 
    USDT: 1, 
    SOL: 145, 
    USDC: 1, 
    XRP: 0.62, 
    BNB: 580 
};

export default function ConvertModule() {
  const { user, fetchAppData } = useStore();
  const [fromAsset, setFromAsset] = useState('BTC');
  const [toAsset, setToAsset] = useState('USDT');
  const [amount, setAmount] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Safely get user balances
  const userBalances = user?.balances || {};
  const currentBalance = Number(userBalances[fromAsset.toLowerCase()] || 0);

  const conversion = useMemo(() => {
    const fromPrice = cryptoPrices[fromAsset] || 1;
    const toPrice = cryptoPrices[toAsset] || 1;
    const amt = parseFloat(amount) || 0;
    
    const result = (amt * fromPrice) / toPrice;
    const fee = result * 0.005; // 0.5% conversion fee
    
    return {
        receive: Math.max(0, result - fee),
        rate: fromPrice / toPrice,
        fee: fee
    };
  }, [fromAsset, toAsset, amount]);

  const handleSwap = () => {
    const temp = fromAsset;
    setFromAsset(toAsset);
    setToAsset(temp);
  };

  const handleConvert = async () => {
    const amountNum = parseFloat(amount);
    if (!amountNum || amountNum <= 0) return toast.error("Enter a valid amount");
    if (amountNum > currentBalance) return toast.error(`Insufficient ${fromAsset} balance`);
    if (fromAsset === toAsset) return toast.error("Select different assets to convert");
    
    setIsProcessing(true);
    try {
        const { data: balanceData } = await supabase.from('balances').select('*').eq('user_id', user?.id).single();
        if (!balanceData) throw new Error("Balance profile not found");

        const currentCrypto = balanceData.crypto_balances || {};
        const newFromBalance = Number(currentCrypto[fromAsset.toLowerCase()] || 0) - amountNum;
        const newToBalance = Number(currentCrypto[toAsset.toLowerCase()] || 0) + conversion.receive;

        const updatedCrypto = {
            ...currentCrypto,
            [fromAsset.toLowerCase()]: parseFloat(newFromBalance.toFixed(8)),
            [toAsset.toLowerCase()]: parseFloat(newToBalance.toFixed(8))
        };

        const { error } = await supabase.from('balances').update({
            crypto_balances: updatedCrypto
        }).eq('user_id', user?.id);

        if (error) throw error;

        // Record transaction
        const txPromise = supabase.from('transactions').insert({
            user_id: user?.id,
            amount: amountNum,
            asset: fromAsset,
            type: 'Conversion' as any,
            status: 'Completed',
            method: `Converted to ${toAsset}`,
            address: 'Internal Exchange'
        });

        // Record fee in platform ledger (USD value)
        const feeInUsd = conversion.fee * (cryptoPrices[toAsset] || 1);
        const feePromise = supabase.from('fee_ledger').insert({
            user_id: user?.id,
            fee_amount: feeInUsd,
            fee_type: 'Conversion',
            asset: toAsset,
            asset_amount: conversion.fee
        });

        await Promise.all([txPromise, feePromise]);

        toast.success("Conversion Complete", {
            description: `Successfully converted ${amountNum} ${fromAsset} to ${conversion.receive.toFixed(6)} ${toAsset}.`
        });
        
        setAmount('');
        if (fetchAppData) fetchAppData();
    } catch (err: any) {
        toast.error(err.message || "Conversion failed");
    } finally {
        setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto space-y-8">
      <div className="flex items-center justify-between gap-4 p-5 rounded-3xl bg-primary/5 border border-primary/10">
         <div className="flex gap-4 items-center">
            <div className="w-12 h-12 rounded-2xl bg-gradient-gold flex items-center justify-center text-white shadow-gold">
                <RefreshCw className="w-6 h-6" />
            </div>
            <div>
                <h3 className="font-bold text-foreground text-sm uppercase tracking-wide">Quick Convert</h3>
                <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">Swap your crypto assets instantly</p>
            </div>
         </div>
         <div className="text-right">
            <p className="text-[10px] text-muted-foreground font-black uppercase mb-1">Fee</p>
            <div className="px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-black uppercase">0.50%</div>
         </div>
      </div>

      <div className="space-y-6">
        <div>
          <label className="text-xs font-bold text-muted-foreground mb-3 block uppercase tracking-widest">From Asset</label>
          <div className="relative group">
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex gap-2">
                <div className="relative">
                    <select 
                        className="h-10 pl-3 pr-8 bg-secondary border border-border rounded-xl font-black text-xs uppercase outline-none appearance-none cursor-pointer hover:bg-card transition-colors"
                        value={fromAsset}
                        onChange={(e) => setFromAsset(e.target.value)}
                    >
                        {Object.keys(cryptoPrices).map(coin => (
                            <option key={coin} value={coin}>{coin}</option>
                        ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 pointer-events-none opacity-50" />
                </div>
            </div>
            <Input 
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="h-16 bg-card border-border rounded-2xl text-2xl font-black px-6 focus:ring-primary/20 focus:border-primary placeholder:text-muted-foreground/30 transition-all font-mono" 
                type="number"
            />
          </div>
          <div className="mt-2 flex justify-between items-center px-4">
             <span className="text-[10px] font-black text-muted-foreground/50 uppercase tracking-widest">Available: {currentBalance.toFixed(6)} {fromAsset}</span>
             <button onClick={() => setAmount(currentBalance.toString())} className="text-[10px] font-black text-primary hover:underline uppercase tracking-widest">MAX</button>
          </div>
        </div>

        <div className="flex justify-center -my-3 relative z-10">
            <button 
                onClick={handleSwap}
                className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white shadow-gold border-4 border-background hover:scale-110 active:scale-95 transition-all"
            >
                <ArrowRightLeft className="w-5 h-5 rotate-90" />
            </button>
        </div>

        <div>
          <label className="text-xs font-bold text-muted-foreground mb-3 block uppercase tracking-widest">Estimated Receive</label>
          <div className="relative group">
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex gap-2">
                <div className="relative">
                    <select 
                        className="h-10 pl-3 pr-8 bg-secondary border border-border rounded-xl font-black text-xs uppercase outline-none appearance-none cursor-pointer hover:bg-card transition-colors"
                        value={toAsset}
                        onChange={(e) => setToAsset(e.target.value)}
                    >
                        {Object.keys(cryptoPrices).map(coin => (
                            <option key={coin} value={coin}>{coin}</option>
                        ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 pointer-events-none opacity-50" />
                </div>
            </div>
            <div className="h-16 bg-secondary/30 border border-border rounded-2xl px-6 flex items-center">
                 <span className="text-2xl font-black text-foreground font-mono">
                    {conversion.receive.toFixed(6)}
                 </span>
            </div>
          </div>
        </div>

        <AnimatePresence>
            {amount && parseFloat(amount) > 0 && (
                <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="p-5 rounded-2xl bg-card border border-border space-y-3 overflow-hidden"
                >
                    <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                        <span className="text-muted-foreground">Exchange Rate</span>
                        <span className="text-foreground">1 {fromAsset} = {conversion.rate.toFixed(6)} {toAsset}</span>
                    </div>
                    <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                        <span className="text-muted-foreground">Network Fee</span>
                        <span className="text-green-600">N/A</span>
                    </div>
                    <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                        <span className="text-muted-foreground">Slippage & Platform Fee</span>
                        <span className="text-primary">{conversion.fee.toFixed(6)} {toAsset}</span>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>

        <div className="flex items-start gap-3 p-4 bg-primary/5 rounded-2xl border border-primary/10">
            <Info className="w-5 h-5 text-primary mt-0.5" />
            <p className="text-[10px] text-muted-foreground leading-relaxed font-bold uppercase tracking-tight">
                Instantly convert between supported digital assets without waiting for external network confirmations.
            </p>
        </div>

        <Button 
            variant="hero" 
            className="w-full h-16 rounded-2xl shadow-gold text-white font-black text-sm uppercase tracking-widest flex items-center justify-center group"
            onClick={handleConvert}
            disabled={isProcessing || !amount || fromAsset === toAsset}
        >
            {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : "Convert Now"} 
        </Button>
      </div>

      <div className="text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-secondary rounded-full border border-border">
            <ShieldCheck className="w-3 h-3 text-green-600" />
            <span className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Secured by Clarity Trade</span>
          </div>
      </div>
    </div>
  );
}
