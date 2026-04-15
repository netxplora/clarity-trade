import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '@/store/useStore';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { 
  ArrowRight, ShieldCheck, Wallet, ChevronDown, CheckCircle,
  Copy, Loader2, Globe, AlertTriangle, RefreshCw, Zap
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface CryptoProvider {
  id: string;
  provider_name: string;
  provider_url: string;
  provider_priority: number;
  provider_status: string;
  provider_type: string;
  provider_logo: string | null;
  provider_description: string | null;
}

export default function CryptoDepositModule({ onComplete }: { onComplete?: () => void }) {
  const { user, formatCurrency } = useStore();
  const [step, setStep] = useState<1 | 2>(1);
  const [amount, setAmount] = useState('');
  const [selectedCoin, setSelectedCoin] = useState('USDT');
  
  // Step 2 State
  const [methodTab, setMethodTab] = useState<'direct' | 'buy'>('direct');
  const [txHash, setTxHash] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [depositWallets, setDepositWallets] = useState<any[]>([]);

  // Buy Crypto Provider State
  const [providers, setProviders] = useState<CryptoProvider[]>([]);
  const [activeProvider, setActiveProvider] = useState<CryptoProvider | null>(null);
  const [providerDropdownOpen, setProviderDropdownOpen] = useState(false);
  const [providerLoading, setProviderLoading] = useState(true);
  const [iframeLoading, setIframeLoading] = useState(true);
  const [iframeError, setIframeError] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setProviderDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      // Wallets
      const { data: wData } = await supabase.from('deposit_wallets').select('*').eq('status', 'Active');
      if (wData) setDepositWallets(wData);

      // Providers
      setProviderLoading(true);
      const { data: pData } = await supabase
        .from('crypto_providers')
        .select('*')
        .eq('provider_status', 'Active')
        .order('provider_priority', { ascending: true });

      if (pData) {
        setProviders(pData);
        const primary = pData.find((p: any) => p.provider_type === 'Primary');
        setActiveProvider(primary || pData[0]);
      }
      setProviderLoading(false);
    };
    fetchData();

    // Setup realtime for providers
    const channel = supabase.channel('user-crypto-providers-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'crypto_providers' }, fetchData)
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  useEffect(() => {
    if (activeProvider) {
      setIframeLoading(true);
      setIframeError(false);
    }
  }, [activeProvider?.id]);

  const currentWallet = depositWallets.find(w => {
    const symbolMap: Record<string, string> = { 'BTC': 'Bitcoin', 'ETH': 'Ethereum', 'USDT': 'USDT' };
    const targetName = symbolMap[selectedCoin.toUpperCase()] || selectedCoin;
    return w.coin.toUpperCase() === targetName.toUpperCase();
  });

  const handleCopyAddress = () => {
    if (currentWallet) {
      navigator.clipboard.writeText(currentWallet.address);
      toast.success(`${selectedCoin} address copied to clipboard`);
    } else {
      toast.error("No address available");
    }
  };

  const handleSubmitStep1 = () => {
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) {
      toast.error("Please enter a valid amount to deposit.");
      return;
    }
    setStep(2);
  };

  const handleConfirmDeposit = async () => {
    if (!txHash.trim()) {
      toast.error("Please provide the Transaction Hash or Sender Address.");
      return;
    }
    setIsSubmitting(true);
    try {
      const { error } = await supabase.from('transactions').insert({
        user_id: user?.id,
        type: 'Deposit',
        amount: parseFloat(amount),
        asset: selectedCoin,
        status: 'Pending',
        metadata: {
          tx_hash: txHash,
          method: methodTab === 'direct' ? 'Direct Transfer' : 'Third Party Provider',
          provider_used: methodTab === 'buy' ? activeProvider?.provider_name : null
        }
      });

      if (error) throw error;
      
      // Notify Admin
      await supabase.from('notifications').insert({
        user_id: null,
        title: `New Crypto Deposit`,
        message: `${user?.name || 'User'} claims a deposit of ${amount} ${selectedCoin}. Hash: ${txHash}`,
        type: 'DEPOSIT',
        is_read: false
      });

      toast.success("Deposit Submitted Successfully", {
        description: "Your deposit is pending confirmation on the blockchain."
      });
      
      if (onComplete) onComplete();
      else {
        setStep(1);
        setAmount('');
        setTxHash('');
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to submit deposit.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleIframeError = () => {
    setIframeLoading(false);
    setIframeError(true);
    if (activeProvider) {
      const currentIndex = providers.findIndex(p => p.id === activeProvider.id);
      const nextProvider = providers[currentIndex + 1];
      if (nextProvider) {
        toast.info(`${activeProvider.provider_name} unavailable. Switching...`);
        setTimeout(() => {
          setActiveProvider(nextProvider);
          setIframeLoading(true);
          setIframeError(false);
        }, 1500);
      }
    }
  };

  return (
    <div className="w-full">
      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.div
            key="step1"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="space-y-8 max-w-xl mx-auto"
          >
            <div className="p-8 rounded-3xl bg-card border border-border shadow-sm space-y-8">
              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4 text-primary">
                  <Wallet className="w-8 h-8" />
                </div>
                <h3 className="text-2xl font-black text-foreground uppercase tracking-tight">Deposit Funds</h3>
                <p className="text-sm text-muted-foreground mt-2">Enter the amount and select an asset to fund your account.</p>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest pl-1 mb-3 block">Asset</label>
                  <div className="grid grid-cols-3 gap-3">
                    {['BTC', 'ETH', 'USDT'].map(coin => (
                      <button
                        key={coin}
                        onClick={() => setSelectedCoin(coin)}
                        className={`py-3 rounded-xl text-xs font-black transition-all border ${
                          selectedCoin === coin ? 'bg-primary border-primary text-white shadow-sm' : 'bg-secondary border-border text-muted-foreground hover:bg-secondary/80'
                        }`}
                      >
                        {coin}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest pl-1 mb-3 block">Amount to Deposit</label>
                  <Input 
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    className="h-16 bg-secondary/50 border-border rounded-xl text-2xl font-black px-6"
                  />
                </div>

                <Button 
                  onClick={handleSubmitStep1}
                  disabled={!amount || parseFloat(amount) <= 0}
                  className="w-full h-16 rounded-xl bg-foreground text-background font-black uppercase tracking-[0.2em] shadow-huge hover:scale-[1.02] transition-transform"
                >
                  Submit Deposit <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </div>
            </div>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div
            key="step2"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Step 2 Header */}
            <div className="bg-card p-6 md:p-8 border border-border rounded-3xl shadow-sm text-center relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-primary" />
              <h2 className="text-2xl font-black text-foreground tracking-tight mb-2">Step 2 &mdash; Confirm Your Deposit</h2>
              <p className="text-sm font-medium text-muted-foreground">
                You have requested to deposit <strong className="text-foreground">${amount} USD</strong>. 
                Please pay <strong className="text-primary">{amount} {selectedCoin}</strong> for successful payment.
              </p>
              <p className="text-xs text-muted-foreground mt-4 italic font-medium">
                Make your deposit to the designated {selectedCoin} wallet address below.
              </p>
            </div>

            {/* Tabs */}
            <div className="flex bg-secondary p-1 rounded-xl max-w-sm mx-auto">
              <button
                className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${methodTab === 'direct' ? 'bg-card text-primary shadow-sm border border-border' : 'text-muted-foreground hover:text-foreground'}`}
                onClick={() => setMethodTab('direct')}
              >
                Direct Transfer
              </button>
              <button
                className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${methodTab === 'buy' ? 'bg-card text-primary shadow-sm border border-border' : 'text-muted-foreground hover:text-foreground'}`}
                onClick={() => setMethodTab('buy')}
              >
                Buy Crypto
              </button>
            </div>

            {methodTab === 'buy' && (
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-4 rounded-xl bg-primary/5 border border-primary/20">
                  <Globe className="w-5 h-5 text-primary shrink-0" />
                  <p className="text-xs text-muted-foreground font-medium">
                    You are purchasing cryptocurrency from a authorized third-party provider.
                  </p>
                </div>

                {/* Destination Wallet Bar */}
                <div className="bg-card p-6 border border-border shadow-sm rounded-2xl space-y-5">
                   <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0 border border-primary/20">
                         <Wallet className="w-6 h-6" />
                      </div>
                      <div>
                         <h4 className="text-xs font-black uppercase text-foreground tracking-widest leading-none mb-1.5">Destination Wallet</h4>
                         <p className="text-xs text-muted-foreground font-medium">Copy and paste this <strong className="text-foreground">{selectedCoin}</strong> address to the provider below.</p>
                      </div>
                   </div>
                   
                   {currentWallet ? (
                       <div className="flex flex-col sm:flex-row items-center gap-3 w-full pl-0 sm:pl-16">
                           <div className="w-full sm:flex-1 h-14 bg-secondary font-mono text-sm font-black rounded-xl flex items-center px-5 overflow-x-auto no-scrollbar border border-border text-foreground shadow-inner">
                             {currentWallet.address}
                           </div>
                           <Button onClick={handleCopyAddress} className="w-full sm:w-auto h-14 px-8 shrink-0 rounded-xl bg-primary text-white font-black text-xs uppercase tracking-widest hover:scale-[1.02] transition-transform shadow-gold">
                             Copy <Copy className="w-4 h-4 ml-2" />
                           </Button>
                       </div>
                   ) : (
                       <div className="text-xs text-amber-500 font-bold italic pl-0 sm:pl-16">Address temporarily unavailable</div>
                   )}
                </div>
              </div>
            )}

            {methodTab === 'direct' ? (
              <div className="max-w-2xl mx-auto space-y-6 w-full">
                {/* Address Details & Confirmation */}
                <div className="p-6 md:p-8 bg-card border border-border rounded-3xl shadow-sm">
                  <h4 className="text-xs font-black uppercase tracking-widest text-foreground mb-6 text-center">Your {selectedCoin} Wallet Address (Destination)</h4>
                  
                  {currentWallet ? (
                    <div className="space-y-6">
                      <div className="flex flex-col items-center gap-4 group mb-6">
                        <div className="p-4 bg-white shadow-md rounded-[2rem] w-48 h-48 border border-border">
                          <img 
                            src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${currentWallet.address}`} 
                            alt="Deposit QR" 
                            className="w-full h-full object-contain" 
                          />
                        </div>
                        <span className="text-[9px] uppercase tracking-[0.3em] text-primary font-black">Scan to Deposit</span>
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest text-center block">Wallet Address</label>
                        <div className="flex flex-col sm:flex-row gap-2">
                          <div className="flex-1 h-14 bg-secondary font-mono text-sm font-black rounded-xl flex items-center justify-center px-4 overflow-x-auto no-scrollbar border border-border">
                            {currentWallet.address}
                          </div>
                          <Button onClick={handleCopyAddress} className="h-14 px-8 shrink-0 rounded-xl bg-primary text-white font-black text-xs uppercase tracking-widest hover:scale-[1.02] transition-transform shadow-gold">
                            Copy <Copy className="w-4 h-4 ml-2" />
                          </Button>
                        </div>
                        {currentWallet.network && (
                          <div className="flex items-center justify-center gap-2 mt-2 px-3 py-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-600">
                             <AlertTriangle className="w-4 h-4 shrink-0" />
                             <span className="text-[10px] font-bold uppercase tracking-widest leading-relaxed text-center">
                               Only send {selectedCoin} via {currentWallet.network} network.
                             </span>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="p-6 bg-secondary/50 rounded-xl text-center border border-border text-xs text-muted-foreground italic">
                      Destination address for {selectedCoin} is temporarily unavailable.
                    </div>
                  )}

                  <div className="mt-8 pt-8 border-t border-border space-y-4">
                    <div>
                      <label className="text-[10px] font-black text-foreground uppercase tracking-widest block mb-2 text-center">Transaction Hash or Sender's Wallet Address</label>
                      <Input 
                        value={txHash}
                        onChange={(e) => setTxHash(e.target.value)}
                        placeholder="Enter hash or address used to send"
                        className="h-14 bg-secondary/50 border-border rounded-xl font-mono text-sm text-center"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed text-center pb-2">
                       Please send exactly <span className="font-bold text-foreground">{amount} {selectedCoin}</span>.
                       Once sent, paste the transaction hash or your wallet address and click Confirm Deposit.
                    </p>
                    <Button 
                      onClick={handleConfirmDeposit}
                      disabled={isSubmitting || !txHash}
                      className="w-full h-14 rounded-xl bg-primary text-white font-black uppercase tracking-[0.2em] shadow-gold hover:scale-[1.02] transition-transform"
                    >
                      {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : "Confirm Deposit"}
                    </Button>
                  </div>
                  
                  <div className="mt-6">
                     <Button variant="ghost" onClick={() => setStep(1)} className="w-full text-[10px] font-bold text-muted-foreground uppercase tracking-widest hover:text-foreground">
                       ← Back to Amount
                     </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="w-full bg-card border border-border rounded-3xl shadow-sm overflow-hidden flex flex-col min-h-[700px] lg:min-h-[800px]">
                {/* Buy Crypto Iframe Full Width View */}
                <div className="p-5 border-b border-border bg-secondary/20 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-3 w-full sm:w-auto">
                    <Button variant="ghost" onClick={() => setStep(1)} className="h-10 px-3 text-[10px] font-bold text-muted-foreground uppercase tracking-widest hover:bg-secondary">
                      ← Back
                    </Button>
                    <div className="h-6 w-px bg-border" />
                    <span className="text-xs font-bold text-foreground uppercase tracking-widest pl-1 border-l-2 border-primary h-4 flex items-center">Purchase Gateway</span>
                  </div>
                  
                  <div className="flex items-center gap-3 w-full sm:w-auto">
                    <div className="relative flex-1 sm:w-64" ref={dropdownRef}>
                      <button 
                        onClick={() => setProviderDropdownOpen(!providerDropdownOpen)}
                        className="w-full flex items-center gap-3 h-12 px-4 bg-card border border-border rounded-xl hover:border-primary/50 transition-all text-left shadow-sm"
                      >
                        <div className="w-6 h-6 rounded bg-secondary flex items-center justify-center overflow-hidden shrink-0">
                          {activeProvider?.provider_logo ? (
                            <img src={activeProvider.provider_logo} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <Globe className="w-3 h-3 text-muted-foreground/40" />
                          )}
                        </div>
                        <span className="text-xs font-bold text-foreground flex-1 truncate">
                          {providerLoading ? "Loading..." : activeProvider?.provider_name || "Select Provider"}
                        </span>
                        <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${providerDropdownOpen ? 'rotate-180' : ''}`} />
                      </button>
                      
                      <AnimatePresence>
                        {providerDropdownOpen && (
                          <motion.div
                            initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }}
                            className="absolute top-14 left-0 right-0 z-50 bg-card border border-border rounded-xl shadow-huge overflow-hidden"
                          >
                            <div className="max-h-60 overflow-y-auto p-1">
                              {providers.map((p) => (
                                <button
                                  key={p.id}
                                  onClick={() => { setActiveProvider(p); setProviderDropdownOpen(false); }}
                                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-all ${activeProvider?.id === p.id ? 'bg-primary/10 text-primary' : 'hover:bg-secondary text-foreground'}`}
                                >
                                  <span className="text-xs font-bold flex-1">{p.provider_name}</span>
                                  {activeProvider?.id === p.id && <CheckCircle className="w-3 h-3" />}
                                </button>
                              ))}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                    <Button variant="outline" size="icon" onClick={() => { setIframeLoading(true); setIframeError(false); if (iframeRef.current && activeProvider) iframeRef.current.src = activeProvider.provider_url; }} className="h-12 w-12 shrink-0 rounded-xl border-border hover:bg-secondary shadow-sm">
                      <RefreshCw className={`w-4 h-4 ${iframeLoading ? 'animate-spin' : ''}`} />
                    </Button>
                  </div>
                </div>


                <div className="relative flex-1 bg-secondary/10 overflow-hidden">
                  {(iframeLoading || providerLoading) && (
                    <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-card">
                      <Loader2 className="w-12 h-12 text-primary animate-spin mb-6 drop-shadow-gold" />
                      <p className="text-xs font-black text-muted-foreground uppercase tracking-widest">Loading Secure Gateway...</p>
                    </div>
                  )}
                  {iframeError && !iframeLoading && (
                    <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-card p-6 text-center">
                      <div className="w-20 h-20 rounded-full bg-red-500/10 flex items-center justify-center mb-6 border border-red-500/20">
                         <AlertTriangle className="w-10 h-10 text-red-500" />
                      </div>
                      <p className="text-xl font-bold text-foreground mb-2">Provider Unavailable</p>
                      <p className="text-sm text-muted-foreground w-full max-w-sm">We could not load this provider. Please try refreshing or select another provider from the dropdown.</p>
                      <Button onClick={() => { setIframeLoading(true); setIframeError(false); if (iframeRef.current && activeProvider) iframeRef.current.src = activeProvider.provider_url; }} className="mt-8 px-8 h-12 rounded-xl text-xs font-bold uppercase tracking-widest text-white">
                         Try Again
                      </Button>
                    </div>
                  )}
                  {activeProvider && !providerLoading && (
                    <iframe
                      ref={iframeRef}
                      src={activeProvider.provider_url}
                      className="w-full h-full border-0 absolute inset-0"
                      onLoad={() => setIframeLoading(false)}
                      onError={handleIframeError}
                      sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox"
                      allow="payment; camera"
                    />
                  )}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
