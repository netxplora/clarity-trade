import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CreditCard, ArrowRight, Info, Loader2, CheckCircle2, AlertTriangle, ChevronDown, Wallet, ShieldCheck, ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useStore } from '@/store/useStore';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import CardDepositModule from './CardDepositModule';

export default function BuyCryptoModule() {
  const { user, addTransaction, displayCurrency } = useStore();
  const [fiatAmount, setFiatAmount] = useState('100');
  const [fiatCurrency, setFiatCurrency] = useState(displayCurrency);
  const [cryptoAsset, setCryptoAsset] = useState('BTC');
  const [walletAddress, setWalletAddress] = useState('');
  const [rates, setRates] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [initiating, setInitiating] = useState(false);
  const [paymentStep, setPaymentStep] = useState(false);
  const [assets, setAssets] = useState<any>({ 
    cryptoAssets: [
      { symbol: 'BTC', name: 'Bitcoin' },
      { symbol: 'ETH', name: 'Ethereum' },
      { symbol: 'USDT', name: 'Tether' },
      { symbol: 'USDC', name: 'USD Coin' }
    ], 
    fiatCurrencies: [
        { symbol: 'USD', name: 'US Dollar' }, 
        { symbol: 'EUR', name: 'Euro' }, 
        { symbol: 'GBP', name: 'British Pound' }
    ] 
  });
  const [pendingTx, setPendingTx] = useState<any[]>([]);
  const [depositWallets, setDepositWallets] = useState<any[]>([]);

  useEffect(() => {
    const fetchWallets = async () => {
        const { data } = await supabase.from('deposit_wallets').select('*').eq('status', 'Active');
        if (data) setDepositWallets(data);
    };
    fetchWallets();
  }, []);

  useEffect(() => {
    const wallet = depositWallets.find(w => 
        w.coin.toLowerCase().includes(cryptoAsset.toLowerCase()) || 
        cryptoAsset.toLowerCase().includes(w.coin.toLowerCase())
    );
    if (wallet) {
        setWalletAddress(wallet.address);
    }
  }, [cryptoAsset, depositWallets]);

  const fetchRates = useCallback(async (amount: string, from: string, to: string) => {
    if (!amount || isNaN(parseFloat(amount))) return;
    setLoading(true);
    // Approximate rates for UI simulation
    const mockRates: Record<string, number> = { BTC: 65120, ETH: 3540, USDT: 1, USDC: 1 };
    const rate = mockRates[to.toUpperCase()] || 1;
    const cryptoAmt = parseFloat(amount) / rate;
    
    setRates({
        rate: rate,
        cryptoAmount: cryptoAmt.toFixed(8),
        providerFeeEstimated: (parseFloat(amount) * 0.01).toFixed(2),
        platformFee: parseFloat(amount) * 0.02,
        totalToCharge: parseFloat(amount) * 1.03
    });
    setLoading(false);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchRates(fiatAmount, fiatCurrency, cryptoAsset);
    }, 500);
    return () => clearTimeout(timer);
  }, [fiatAmount, fiatCurrency, cryptoAsset, fetchRates]);

  const handleBuy = async () => {
    if (!user || !rates) return;
    setPaymentStep(true);
  };

  if (paymentStep) {
      return (
          <div className="w-full h-full animate-in slide-in-from-right duration-500">
              <div className="max-w-xl mx-auto mb-8">
                  <Button 
                    onClick={() => setPaymentStep(false)} 
                    variant="ghost" 
                    className="group flex items-center gap-2 p-0 h-auto text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors"
                  >
                      <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                      Back to Calculator
                  </Button>
              </div>
              <CardDepositModule initialAmount={rates?.totalToCharge.toString()} />
          </div>
      );
  }

  return (
    <div className="max-w-xl mx-auto space-y-8">
      <div className="flex items-center justify-between gap-4 p-5 rounded-3xl bg-primary/5 border border-primary/10 mb-2">
         <div className="flex gap-4 items-center">
            <div className="w-12 h-12 rounded-2xl bg-gradient-gold flex items-center justify-center text-white shadow-gold">
                <CreditCard className="w-6 h-6" />
            </div>
            <div>
                <h3 className="font-bold text-foreground text-sm uppercase tracking-wide">Buy Crypto with Card</h3>
                <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">Visa & Mastercard Supported</p>
            </div>
         </div>
         <div className="text-right">
            <p className="text-[10px] text-muted-foreground font-black uppercase mb-1">Instant Deposit</p>
            <div className="flex gap-1">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse delay-75" />
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse delay-150" />
            </div>
         </div>
      </div>

      <div className="space-y-6">
        <div>
          <label className="text-xs font-bold text-muted-foreground mb-3 block uppercase tracking-widest">1. You Pay</label>
          <div className="relative group">
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex gap-2">
                <div className="h-10 px-3 bg-secondary border border-border rounded-xl flex items-center gap-2 cursor-pointer hover:bg-card transition-colors">
                    <span className="font-bold text-xs uppercase">{fiatCurrency}</span>
                    <ChevronDown className="w-3 h-3" />
                </div>
            </div>
            <Input 
                value={fiatAmount}
                onChange={(e) => setFiatAmount(e.target.value)}
                placeholder="Enter amount"
                className="h-16 bg-card border-border rounded-2xl text-2xl font-black px-6 focus:ring-primary/20 focus:border-primary placeholder:text-muted-foreground/30 transition-all" 
                type="number"
            />
          </div>
        </div>

        <div className="flex justify-center -my-3 relative z-10">
            <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white shadow-gold border-4 border-background hover:scale-110 transition-transform cursor-pointer">
                <ArrowRight className="w-5 h-5 rotate-90" />
            </div>
        </div>

        <div>
          <label className="text-xs font-bold text-muted-foreground mb-3 block uppercase tracking-widest">2. You Receive (Approx)</label>
          <div className="relative group">
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex gap-2">
                 <select 
                    className="h-10 px-3 bg-secondary border border-border rounded-xl font-bold text-xs uppercase outline-none"
                    value={cryptoAsset}
                    onChange={(e) => setCryptoAsset(e.target.value)}
                 >
                    {assets.cryptoAssets.map((c: any) => (
                        <option key={c.symbol} value={c.symbol.toUpperCase()}>{c.symbol.toUpperCase()}</option>
                    ))}
                 </select>
            </div>
            <div className="h-16 bg-secondary/30 border border-border rounded-2xl px-6 flex items-center">
                {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin text-primary" />
                ) : (
                    <span className="text-2xl font-black text-foreground">
                        {rates?.cryptoAmount || '0.00000000'} <span className="text-xs font-bold text-primary ml-1 uppercase">{cryptoAsset}</span>
                    </span>
                )}
            </div>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-secondary/20 border border-border/50 space-y-3">
            <div className="flex justify-between items-center">
                <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest flex items-center gap-2">
                    <Wallet className="w-3 h-3 text-primary" />
                    Receiving to Wallet
                </label>
                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-green-500/10 border border-green-500/20">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-[8px] font-black text-green-500 uppercase tracking-tighter">Secure</span>
                </div>
            </div>
            <div className="relative">
                <Input 
                    value={walletAddress}
                    readOnly
                    className="bg-secondary/40 border border-border/50 h-12 text-sm font-black text-foreground cursor-default font-mono px-4 rounded-xl"
                />
                <p className="mt-2 text-[9px] text-muted-foreground font-bold uppercase tracking-tight italic">
                    Funds will go to: <span className="text-primary">{walletAddress || "Select Asset Above"}</span>
                </p>
            </div>
        </div>

        <AnimatePresence>
            {rates && fiatAmount && (
                <motion.div 
                    initial={{ opacity: 0, height: 0 }} 
                    animate={{ opacity: 1, height: 'auto' }}
                    className="p-6 rounded-2xl bg-card border border-border space-y-4 overflow-hidden"
                >
                    <div className="flex justify-between text-xs font-bold mb-4 border-b border-border pb-3">
                        <span className="text-muted-foreground uppercase tracking-wider">Asset Price</span>
                        <span className="text-foreground">1 {cryptoAsset} ≈ {(rates.rate || 0).toLocaleString()} {fiatCurrency}</span>
                    </div>
                    <div className="space-y-3">
                        <div className="flex justify-between text-xs font-bold">
                            <span className="text-muted-foreground">Order Amount</span>
                            <span className="text-foreground">{parseFloat(fiatAmount).toFixed(2)} {fiatCurrency}</span>
                        </div>
                        <div className="flex justify-between text-xs font-bold">
                            <span className="text-muted-foreground">Network Fee (Estimated)</span>
                            <span className="text-foreground">~{rates.providerFeeEstimated} {fiatCurrency}</span>
                        </div>
                        <div className="flex justify-between text-xs font-bold text-primary">
                            <span className="uppercase tracking-widest">Platform Fee (2%)</span>
                            <span>{rates.platformFee.toFixed(2)} {fiatCurrency}</span>
                        </div>
                    </div>
                    <div className="pt-4 border-t border-border flex justify-between pr-4">
                         <span className="text-sm font-black text-foreground uppercase tracking-widest">Total to Charge</span>
                         <span className="text-lg font-black text-[#D4AF37]">${rates.totalToCharge.toFixed(2)}</span>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>

        <div className="flex items-start gap-3 p-4 bg-primary/5 rounded-2xl border border-primary/10">
            <Info className="w-5 h-5 text-primary mt-0.5" />
            <p className="text-[10px] text-muted-foreground leading-relaxed font-bold uppercase tracking-tight">
                Crypto will be added to your wallet directly after payment.
            </p>
        </div>

        <Button 
            variant="hero" 
            className="w-full h-16 rounded-2xl shadow-gold text-white font-black text-sm uppercase tracking-widest flex items-center justify-center group"
            onClick={handleBuy}
            disabled={initiating || !fiatAmount}
        >
            {initiating ? <Loader2 className="w-5 h-5 animate-spin" /> : "Buy Now"} 
            {!initiating && <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />}
        </Button>
      </div>
      <div className="text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-secondary rounded-full border border-border">
            <ShieldCheck className="w-3 h-3 text-green-600" />
            <span className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Secure Encrypted Payment</span>
          </div>
      </div>
    </div>
  );
}
