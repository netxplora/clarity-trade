import { useState } from 'react';
import { useStore } from '@/store/useStore';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { RefreshCw, ArrowRightLeft, Loader2, Info, Wallet, Zap, ShieldCheck, ArrowRight, Users, ArrowRightLeft as SwapIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Input } from '@/components/ui/input';

type BalanceType = 'main' | 'trading' | 'copy';
const labelMapping = { main: 'Main Wallet', trading: 'Trading Account', copy: 'Copy Trading Account' };

export default function TransferModule() {
  const { user, balance, formatCurrency, fetchAppData } = useStore();
  const [amount, setAmount] = useState('');
  const [from, setFrom] = useState<BalanceType>('main');
  const [to, setTo] = useState<BalanceType>('trading');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSwap = () => {
    const temp = from;
    setFrom(to);
    setTo(temp);
  };

  const currentAvailable = from === 'main' ? balance.available : from === 'trading' ? balance.invested : balance.copyTrading;

  const handleTransfer = async () => {
    const amountNum = parseFloat(amount);
    if (!amountNum || amountNum <= 0) return toast.error("Enter a valid amount");
    if (amountNum > currentAvailable) return toast.error(`Insufficient ${labelMapping[from]} balance`);
    if (from === to) return toast.error("Select different accounts to move funds");
    
    setIsProcessing(true);
    try {
        const { data: balanceData } = await supabase.from('balances').select('*').eq('user_id', user?.id).single();
        if (!balanceData) throw new Error("Balance profile not found");

        let updates: any = {};
        const getColumn = (type: BalanceType) => type === 'main' ? 'fiat_balance' : type === 'trading' ? 'trading_balance' : 'copy_trading_balance';
        
        updates[getColumn(from)] = Number(balanceData[getColumn(from)] || 0) - amountNum;
        updates[getColumn(to)] = Number(balanceData[getColumn(to)] || 0) + amountNum;

        const { error } = await supabase.from('balances').update(updates).eq('user_id', user?.id);
        if (error) throw error;

        // Record internal transaction? 
        // We can add a 'Transfer' type transaction if we want history
        await supabase.from('transactions').insert({
            user_id: user?.id,
            amount: amountNum,
            asset: 'USD',
            type: 'Transfer',
            status: 'Completed',
            method: `${from.toUpperCase()} to ${to.toUpperCase()}`,
            address: 'Internal System'
        });

        toast.success("Transfer Successful", {
            description: `${formatCurrency(amountNum)} moved to ${labelMapping[to]}.`
        });
        setAmount('');
        if (fetchAppData) fetchAppData();
    } catch (err: any) {
        toast.error(err.message || "Transfer failed");
    } finally {
        setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto space-y-8">
      <div className="flex items-center justify-between gap-4 p-5 rounded-3xl bg-primary/5 border border-primary/10">
         <div className="flex gap-4 items-center">
            <div className="w-12 h-12 rounded-2xl bg-gradient-gold flex items-center justify-center text-white shadow-gold">
                <ArrowRightLeft className="w-6 h-6" />
            </div>
            <div>
                <h3 className="font-bold text-foreground text-sm uppercase tracking-wide">Transfer Funds</h3>
                <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">Free & Instant</p>
            </div>
         </div>
         <div className="text-right">
            <p className="text-[10px] text-muted-foreground font-black uppercase mb-1">Status</p>
            <div className="flex gap-1 justify-end">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-[8px] font-black text-green-500 uppercase tracking-tighter">Live</span>
            </div>
         </div>
      </div>

      <div className="space-y-6">
        <div className="grid grid-cols-3 gap-2 sm:gap-4">
            <button onClick={() => setFrom('main')} className={`p-4 rounded-2xl border transition-all text-left ${from === 'main' ? 'bg-primary/5 border-primary/30 shadow-sm' : 'bg-card border-border opacity-60'}`}>
                <div className="text-[9px] font-black text-muted-foreground uppercase mb-1 tracking-widest">From</div>
                <div className="flex items-center gap-2">
                    <Wallet className="w-4 h-4 text-primary" />
                    <span className="font-bold text-[10px] uppercase">Main</span>
                </div>
                <div className="mt-2 text-[10px] font-bold text-foreground opacity-60">{formatCurrency(balance.available)}</div>
            </button>
            <button onClick={() => setFrom('trading')} className={`p-4 rounded-2xl border transition-all text-left ${from === 'trading' ? 'bg-primary/5 border-primary/30 shadow-sm' : 'bg-card border-border opacity-60'}`}>
                <div className="text-[9px] font-black text-muted-foreground uppercase mb-1 tracking-widest">From</div>
                <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-primary" />
                    <span className="font-bold text-[10px] uppercase">Trading</span>
                </div>
                <div className="mt-2 text-[10px] font-bold text-foreground opacity-60">{formatCurrency(balance.invested)}</div>
            </button>
            <button onClick={() => setFrom('copy')} className={`p-4 rounded-2xl border transition-all text-left ${from === 'copy' ? 'bg-primary/5 border-primary/30 shadow-sm' : 'bg-card border-border opacity-60'}`}>
                <div className="text-[9px] font-black text-muted-foreground uppercase mb-1 tracking-widest">From</div>
                <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-primary" />
                    <span className="font-bold text-[10px] uppercase">Copy</span>
                </div>
                <div className="mt-2 text-[10px] font-bold text-foreground opacity-60">{formatCurrency(balance.copyTrading)}</div>
            </button>
        </div>

        <div className="flex justify-center -my-3 relative z-10">
            <button 
                onClick={handleSwap}
                className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white shadow-gold border-4 border-background hover:scale-110 active:scale-95 transition-all"
            >
                <RefreshCw className="w-5 h-5" />
            </button>
        </div>

        <div>
          <label className="text-xs font-bold text-muted-foreground mb-3 block uppercase tracking-widest">Transfer Amount</label>
          <div className="relative group">
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <button 
                  onClick={() => setAmount(currentAvailable.toString())}
                  className="px-3 py-2 bg-secondary border border-border rounded-xl text-[10px] font-black text-primary hover:bg-card transition-colors uppercase"
                >
                    MAX
                </button>
            </div>
            <Input 
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="h-16 bg-card border-border rounded-2xl text-2xl font-black px-6 focus:ring-primary/20 focus:border-primary placeholder:text-muted-foreground/30 transition-all" 
                type="number"
            />
          </div>
          <div className="mt-4 p-4 rounded-xl bg-secondary/30 border border-border/50 flex flex-col gap-3">
             <div className="flex justify-between items-center">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Move to</span>
                <div className="flex items-center gap-2">
                   <span className="text-[10px] font-black text-foreground uppercase tracking-widest">{labelMapping[to]}</span>
                   <ArrowRight className="w-3 h-3 text-primary" />
                </div>
             </div>
             <div className="flex gap-2">
                 {(['main', 'trading', 'copy'] as BalanceType[]).map(t => (
                    <button 
                        key={t}
                        onClick={() => setTo(t)}
                        className={`px-3 py-1.5 rounded-lg border text-[8px] font-black uppercase transition-all ${to === t ? 'bg-primary border-primary text-white shadow-gold' : 'bg-secondary border-border text-muted-foreground'}`}
                    >
                        {t}
                    </button>
                 ))}
             </div>
          </div>
        </div>

        <div className="flex items-start gap-3 p-4 bg-primary/5 rounded-2xl border border-primary/10">
            <Info className="w-5 h-5 text-primary mt-0.5" />
            <p className="text-[10px] text-muted-foreground leading-relaxed font-bold uppercase tracking-tight">
                Funds in the Trading Pool can be used for manual trading and copy-trading activations. 
                Funds in the Main Wallet are available for withdrawals and purchasing crypto.
            </p>
        </div>

        <Button 
            variant="hero" 
            className="w-full h-16 rounded-2xl shadow-gold text-white font-black text-sm uppercase tracking-widest flex items-center justify-center group"
            onClick={handleTransfer}
            disabled={isProcessing || !amount}
        >
            {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : "Move Funds"} 
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
