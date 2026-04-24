import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '@/store/useStore';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import {
  ArrowRight, ShieldCheck, Wallet, CheckCircle, Copy, Loader2,
  AlertTriangle, QrCode, Clock, ArrowLeft, HelpCircle, ChevronRight,
  Globe, ExternalLink, Camera, History, CheckCircle2, Info,
  CreditCard, Zap, Search, Coins, AlertCircle, RefreshCw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog, DialogContent, DialogTitle, DialogDescription, DialogHeader, DialogFooter
} from '@/components/ui/dialog';
import { SUPPORTED_ASSETS, fetchCryptoPrice, generateReferenceId } from '@/lib/deposit-helpers';

type Step = 1 | 2 | 3; // 1: Init, 2: Confirm, 3: Success

export default function CryptoDepositModule({ onComplete }: { onComplete?: () => void }) {
  const { user } = useStore();
  const [step, setStep] = useState<Step>(1);
  const [isLoading, setIsLoading] = useState(true);
  
  // Data State
  const [wallets, setWallets] = useState<any[]>([]);
  const [providers, setProviders] = useState<any[]>([]);
  
  // Selection State
  const [selectedAsset, setSelectedAsset] = useState<string | null>(null);
  const [selectedNetwork, setSelectedNetwork] = useState<string | null>(null);
  const [amountUsd, setAmountUsd] = useState('');
  const [cryptoAmount, setCryptoAmount] = useState<number>(0);
  const [currentRate, setCurrentRate] = useState<number>(1);
  const [isFetchingRate, setIsFetchingRate] = useState(false);
  
  // Confirmation State
  const [txHash, setTxHash] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [referenceId] = useState(() => generateReferenceId());
  
  // UI State
  const [showHistory, setShowHistory] = useState(false);
  const [deposits, setDeposits] = useState<any[]>([]);
  const [showBuyModal, setShowBuyModal] = useState(false);
  
  // Proof Upload State
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [proofPreview, setProofPreview] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!user?.id) {
      // If we don't have a user, we can't fetch data, but we shouldn't hang
      setIsLoading(false);
      return;
    }
    
    setIsLoading(true);
    try {
      const [wRes, pRes, dRes] = await Promise.all([
        supabase.from('deposit_wallets').select('*').eq('status', 'Active').order('priority', { ascending: false }),
        supabase.from('crypto_providers').select('*').eq('provider_status', 'Active').order('provider_priority', { ascending: true }),
        supabase.from('crypto_deposits').select('*').eq('user_id', user.id).order('created_at', { ascending: false })
      ]);

      if (wRes.error) throw wRes.error;

      setWallets(wRes.data || []);
      setProviders(pRes.data || []);
      setDeposits(dRes.data || []);
    } catch (err: any) {
      console.error('Fetch data error:', err);
      if (err.code === '42P01') {
         toast.error("Database Configuration Missing", {
            description: "Table 'deposit_wallets' not found. Please run migrations."
         });
      }
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Failsafe: force stop loading after 8 seconds
  useEffect(() => {
    if (isLoading) {
      const timer = setTimeout(() => setIsLoading(false), 8000);
      return () => clearTimeout(timer);
    }
  }, [isLoading]);

  // Rate Fetching Logic
  useEffect(() => {
    if (selectedAsset && amountUsd) {
      const updateRate = async () => {
        setIsFetchingRate(true);
        const rate = await fetchCryptoPrice(selectedAsset);
        setCurrentRate(rate);
        setCryptoAmount(parseFloat(amountUsd) / rate);
        setIsFetchingRate(false);
      };
      const debounce = setTimeout(updateRate, 500);
      return () => clearTimeout(debounce);
    }
  }, [selectedAsset, amountUsd]);

  const uniqueAssets = useMemo(() => {
    return Array.from(new Set(wallets.map(w => (w.asset || w.coin || '').toUpperCase()))).filter(Boolean).sort();
  }, [wallets]);

  const availableNetworks = useMemo(() => {
    if (!selectedAsset) return [];
    return wallets.filter(w => (w.asset || w.coin || '').toUpperCase() === selectedAsset.toUpperCase());
  }, [selectedAsset, wallets]);

  const currentWallet = useMemo(() => {
    if (!selectedAsset || !selectedNetwork) return null;
    return wallets.find(w => 
      (w.asset || w.coin || '').toUpperCase() === selectedAsset.toUpperCase() && 
      (w.network || '').toLowerCase() === selectedNetwork.toLowerCase()
    );
  }, [selectedAsset, selectedNetwork, wallets]);

  const handleInitialize = () => {
    if (!selectedAsset || !amountUsd || parseFloat(amountUsd) <= 0) {
      toast.error('Please select an asset and enter a valid amount.');
      return;
    }
    // Auto-select network if only one available
    if (availableNetworks.length === 1) {
      setSelectedNetwork(availableNetworks[0].network);
    }
    setStep(2);
  };

  const handleConfirmDeposit = async () => {
    if (!txHash.trim()) {
      toast.error('Transaction Hash or Sender Wallet Address is required.');
      return;
    }
    if (!currentWallet) return;

    setIsSubmitting(true);
    try {
      let proofUrl = null;

      // Upload proof image if exists
      if (proofFile) {
        setIsUploading(true);
        const fileExt = proofFile.name.split('.').pop();
        const fileName = `${user?.id}_${Date.now()}.${fileExt}`;
        const filePath = `proofs/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('deposits')
          .upload(filePath, proofFile);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('deposits')
          .getPublicUrl(filePath);
        
        proofUrl = publicUrl;
        setIsUploading(false);
      }

      const { error } = await supabase.from('crypto_deposits').insert({
        user_id: user?.id,
        asset: selectedAsset,
        network: selectedNetwork,
        amount_expected: cryptoAmount,
        amount_usd: parseFloat(amountUsd),
        conversion_rate: currentRate,
        wallet_address: currentWallet.wallet_address,
        reference_id: referenceId,
        txid: txHash.trim(),
        proof_image: proofUrl,
        status: 'pending'
      });


      if (error) throw error;
      setStep(3);
      toast.success('Deposit submitted for verification.');
      
      // Update history
      fetchData();
    } catch (err: any) {
      toast.error(err.message || 'Submission failed.');
    } finally {
      setIsSubmitting(false);
      setIsUploading(false);
    }
  };

  const resetFlow = () => {
    setStep(1);
    setSelectedAsset(null);
    setSelectedNetwork(null);
    setAmountUsd('');
    setCryptoAmount(0);
    setTxHash('');
  };

  if (isLoading) return (
    <div className="py-20 flex flex-col items-center justify-center space-y-4">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
      <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Initializing Secure Gateway...</p>
    </div>
  );

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-black text-foreground tracking-tight uppercase">Deposit Funds</h2>
          <p className="text-xs text-muted-foreground font-medium mt-1">Institutional-grade cryptocurrency funding system.</p>
        </div>
        <Button variant="ghost" onClick={() => setShowHistory(!showHistory)} 
          className="h-10 text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-primary gap-2 bg-secondary/30 rounded-xl px-4">
          <History className="w-4 h-4" /> {showHistory ? 'Return to Flow' : 'History'}
        </Button>
      </div>

      <AnimatePresence mode="wait">
        {showHistory ? (
          <motion.div key="history" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            {deposits.length === 0 ? (
              <div className="py-20 text-center border-2 border-dashed border-border rounded-3xl text-muted-foreground font-bold uppercase text-[10px] tracking-widest opacity-40">No activity recorded.</div>
            ) : deposits.map(d => (
              <div key={d.id} className="p-5 rounded-2xl bg-card border border-border flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center font-black text-primary uppercase border border-border/50">
                    {(d.asset || d.coin || '??').slice(0, 2)}
                  </div>
                  <div>
                    <div className="text-sm font-black text-foreground">{d.amount_expected} {d.asset || d.coin}</div>
                    <div className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">{d.reference_id} • {new Date(d.created_at).toLocaleDateString()}</div>
                  </div>
                </div>
                <Badge variant="outline" className="uppercase font-black text-[8px] px-2 py-1 rounded-lg border-primary/20 bg-primary/5 text-primary">
                  {d.status.replace('_', ' ')}
                </Badge>
              </div>
            ))}
          </motion.div>
        ) : (
          <motion.div key="flow" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            
            {/* STEP 1: INITIALIZATION */}
            {step === 1 && (
              <div className="space-y-8">
                <div className="space-y-4">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground px-1">Select Cryptocurrency</Label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {uniqueAssets.map(asset => {
                      const config = SUPPORTED_ASSETS.find(a => a.symbol === asset);
                      const isSelected = selectedAsset === asset;
                      return (
                        <button key={asset} onClick={() => setSelectedAsset(asset)}
                          className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 ${
                            isSelected ? 'bg-primary/5 border-primary shadow-lg shadow-primary/10 scale-105' : 'bg-card border-border hover:border-primary/50'
                          }`}>
                          <div className={`w-10 h-10 rounded-xl bg-secondary flex items-center justify-center text-xl font-black ${config?.color || 'text-primary'}`}>
                            {config?.icon || asset.slice(0, 2)}
                          </div>
                          <span className="text-[10px] font-black uppercase tracking-widest">{asset}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-4">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground px-1">Deposit Amount (USD)</Label>
                  <div className="relative">
                    <Input type="number" value={amountUsd} onChange={(e) => setAmountUsd(e.target.value)} placeholder="500.00"
                      className="h-16 bg-secondary/30 border-border rounded-2xl text-2xl font-black pl-10" />
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-black text-muted-foreground">$</span>
                  </div>
                </div>

                {selectedAsset && amountUsd && (
                  <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                    className="p-6 rounded-3xl bg-primary/5 border border-primary/20 text-center space-y-1">
                    <div className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">Equivalent Conversion</div>
                    <div className="text-3xl font-black text-foreground flex items-center justify-center gap-3">
                      {isFetchingRate ? <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" /> : `${cryptoAmount.toFixed(8)} ${selectedAsset}`}
                    </div>
                    <div className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Live Rate: 1 {selectedAsset} = ${currentRate.toLocaleString()}</div>
                  </motion.div>
                )}

                <div className="flex flex-col sm:flex-row gap-3">
                  <Button onClick={handleInitialize} disabled={!selectedAsset || !amountUsd || parseFloat(amountUsd) <= 0}
                    className="flex-1 h-14 bg-foreground text-background font-black uppercase tracking-widest rounded-2xl shadow-huge hover:scale-[1.01] transition-transform">
                    Proceed to Deposit <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                  <Button variant="outline" onClick={() => setShowBuyModal(true)} disabled={!selectedAsset}
                    className="h-14 px-8 border-primary text-primary font-black uppercase tracking-widest rounded-2xl hover:bg-primary/5">
                    Buy with Card <CreditCard className="w-5 h-5 ml-2" />
                  </Button>
                </div>
              </div>
            )}

            {/* STEP 2: CONFIRMATION */}
            {step === 2 && (
              <div className="space-y-8">
                <div className="flex items-center gap-4">
                  <Button variant="ghost" size="icon" onClick={() => setStep(1)} className="rounded-full bg-secondary h-10 w-10"><ArrowLeft className="w-4 h-4" /></Button>
                  <div>
                    <h3 className="text-lg font-black text-foreground uppercase tracking-tight">Step 2: Confirm Your Deposit</h3>
                    <p className="text-xs text-muted-foreground font-medium">Verify payment details and submit your transaction hash.</p>
                  </div>
                </div>

                <div className="p-8 rounded-[2.5rem] bg-card border border-border shadow-huge space-y-8">
                  {/* Summary */}
                  <div className="grid grid-cols-2 gap-4 pb-8 border-b border-border/50">
                    <div className="space-y-1">
                      <Label className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Fiat Amount</Label>
                      <div className="text-xl font-black text-foreground">${parseFloat(amountUsd).toLocaleString()} USD</div>
                    </div>
                    <div className="space-y-1 text-right">
                      <Label className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Crypto Amount</Label>
                      <div className="text-xl font-black text-primary">{cryptoAmount.toFixed(8)} {selectedAsset}</div>
                    </div>
                  </div>

                  {/* Network Selection (If multiple) */}
                  {availableNetworks.length > 1 && (
                    <div className="space-y-3">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Select Network</Label>
                      <div className="grid grid-cols-2 gap-2">
                        {availableNetworks.map(net => (
                          <button key={net.id} onClick={() => setSelectedNetwork(net.network)}
                            className={`p-3 rounded-xl border-2 text-[10px] font-black uppercase tracking-widest transition-all ${
                              selectedNetwork === net.network ? 'bg-primary/5 border-primary text-primary' : 'bg-secondary/30 border-border'
                            }`}>
                            {net.network}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Instructions */}
                  {selectedNetwork && currentWallet && (
                    <div className="space-y-6">
                      <div className="flex flex-col items-center space-y-4">
                        <div className="p-4 bg-white rounded-3xl shadow-xl border border-border">
                          <img src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${currentWallet.wallet_address}`} 
                            alt="QR" className="w-40 h-40 object-contain" />
                        </div>
                        <div className="w-full space-y-2">
                          <Label className="text-[9px] font-black text-center block uppercase tracking-widest text-muted-foreground">Destination Wallet Address</Label>
                          <div className="flex gap-2">
                            <div className="flex-1 h-12 bg-secondary border border-border rounded-xl flex items-center justify-center font-mono text-[10px] font-black text-foreground px-4 truncate select-all">
                              {currentWallet.wallet_address}
                            </div>
                            <Button onClick={() => { navigator.clipboard.writeText(currentWallet.wallet_address); toast.success('Address Copied'); }}
                              className="h-12 px-4 bg-primary text-white rounded-xl"><Copy className="w-4 h-4" /></Button>
                          </div>
                        </div>
                      </div>

                      <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex gap-4">
                        <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
                        <div className="text-[10px] text-amber-700/80 font-medium leading-relaxed">
                          Only send <span className="font-black underline">{selectedAsset}</span> via the <span className="font-black underline">{selectedNetwork}</span> network. 
                          Sending via the wrong network or sending the wrong asset will result in <span className="font-black">Permanent Loss of Funds</span>.
                        </div>
                      </div>

                      {/* TXID Input */}
                      <div className="space-y-4 pt-4 border-t border-border/50">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-foreground">Transaction Hash or Sender Wallet Address</Label>
                        <Input value={txHash} onChange={(e) => setTxHash(e.target.value)} placeholder="Paste hash or wallet here..."
                          className="h-14 bg-secondary/30 border-border rounded-xl font-mono text-sm" />
                      </div>

                      {/* PROOF UPLOAD */}
                      <div className="space-y-4">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-foreground flex items-center gap-2">
                          <Camera className="w-4 h-4 text-primary" /> Upload Payment Proof (Optional)
                        </Label>
                        
                        <div className="relative group">
                          {proofPreview ? (
                            <div className="relative h-40 rounded-2xl overflow-hidden border border-border bg-secondary/20">
                              <img src={proofPreview} className="w-full h-full object-cover" />
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                                <Button variant="secondary" size="sm" onClick={() => { setProofFile(null); setProofPreview(null); }}
                                  className="h-8 text-[9px] font-black uppercase rounded-lg">Remove</Button>
                              </div>
                            </div>
                          ) : (
                            <div className="relative h-40 rounded-2xl border-2 border-dashed border-border hover:border-primary/50 transition-colors bg-secondary/5 flex flex-col items-center justify-center p-6 text-center cursor-pointer">
                              <input type="file" accept="image/*" onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  setProofFile(file);
                                  setProofPreview(URL.createObjectURL(file));
                                }
                              }} className="absolute inset-0 opacity-0 cursor-pointer" />
                              <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center mb-3">
                                <Camera className="w-6 h-6 text-muted-foreground/40" />
                              </div>
                              <div className="text-[10px] font-black uppercase tracking-widest text-foreground">Click to upload screenshot</div>
                              <div className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mt-1">JPG, PNG or PDF (Max 5MB)</div>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="pt-4 border-t border-border/50">
                        <Button onClick={handleConfirmDeposit} disabled={!txHash || isSubmitting || isUploading}
                          className="w-full h-16 bg-primary text-white font-black uppercase tracking-[0.2em] rounded-2xl shadow-gold hover:scale-[1.01] transition-transform">
                          {isSubmitting ? <Loader2 className="w-6 h-6 animate-spin" /> : 'Confirm Deposit'}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* STEP 3: SUCCESS */}
            {step === 3 && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="py-12 text-center space-y-8"
              >
                <div className="relative mx-auto w-24 h-24">
                  <div className="absolute inset-0 bg-green-500/20 blur-2xl rounded-full animate-pulse" />
                  <div className="relative w-24 h-24 rounded-3xl bg-green-500/10 flex items-center justify-center border border-green-500/20">
                    <CheckCircle className="w-12 h-12 text-green-500 animate-in zoom-in duration-500" />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <h2 className="text-3xl font-black text-foreground uppercase tracking-tight">Deposit Received</h2>
                  <p className="text-muted-foreground max-w-sm mx-auto font-medium">
                    Your transfer is being verified by our audit team. Funds will be credited shortly.
                  </p>
                </div>

                <div className="max-w-xs mx-auto p-6 rounded-3xl bg-secondary/30 border border-border space-y-4 shadow-sm">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-black text-muted-foreground uppercase tracking-widest opacity-60">Reference ID</span>
                    <span className="font-mono font-bold text-foreground bg-card px-2 py-1 rounded-lg border border-border">{referenceId}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-black text-muted-foreground uppercase tracking-widest opacity-60">Expected Amount</span>
                    <span className="font-bold text-foreground">{cryptoAmount} {selectedAsset}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs pt-4 border-t border-border/50">
                    <span className="font-black text-muted-foreground uppercase tracking-widest opacity-60">Status</span>
                    <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20">
                      <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                      <span className="text-[9px] font-black text-amber-600 uppercase tracking-tighter">Awaiting Audit</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-3 pt-4">
                  <Button onClick={() => setStep(1)} variant="outline" className="h-14 rounded-2xl border-border font-black uppercase tracking-widest hover:bg-secondary">
                    New Deposit
                  </Button>
                  <Button onClick={() => setShowHistory(true)} className="h-14 rounded-2xl bg-foreground text-background font-black uppercase tracking-widest hover:scale-[1.01] transition-transform">
                    View History
                  </Button>
                </div>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Buy Crypto Modal */}
      <Dialog open={showBuyModal} onOpenChange={setShowBuyModal}>
        <DialogContent className="sm:max-w-[500px] bg-card border-border shadow-huge p-0 overflow-hidden rounded-[2.5rem]">
          <div className="p-8 space-y-8">
            <div className="text-center space-y-3">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto text-primary mb-2">
                <ExternalLink className="w-8 h-8" />
              </div>
              <DialogTitle className="text-xl font-black uppercase tracking-tight text-foreground">Buy Crypto with Card</DialogTitle>
              <p className="text-xs text-muted-foreground font-medium leading-relaxed">
                Purchase cryptocurrency through our verified third-party partners and send it directly to your ClarityTrade wallet.
              </p>
            </div>

            {/* Instruction Modal Content */}
            <div className="p-6 rounded-2xl bg-secondary/50 border border-border space-y-6">
              <div className="space-y-4">
                <h4 className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-2">
                  <Info className="w-4 h-4" /> Crucial Instructions
                </h4>
                <div className="space-y-3">
                  <div className="flex justify-between items-center text-[11px] font-medium text-muted-foreground">
                    <span>Reference ID:</span>
                    <span className="font-black text-foreground">{referenceId}</span>
                  </div>
                  <div className="flex justify-between items-center text-[11px] font-medium text-muted-foreground">
                    <span>Target Asset:</span>
                    <span className="font-black text-foreground">{selectedAsset}</span>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground opacity-60">Destination Wallet</Label>
                    <div className="flex items-center justify-between gap-3 p-3 bg-card border border-border rounded-xl">
                      <span className="font-mono text-[10px] font-black text-foreground truncate select-all">{currentWallet?.wallet_address || currentWallet?.address || 'Select network first'}</span>
                      <button onClick={() => { 
                        const addr = currentWallet?.wallet_address || currentWallet?.address || '';
                        if (addr) {
                          navigator.clipboard.writeText(addr); 
                          toast.success('Address Copied'); 
                        }
                      }} 
                        className="text-primary hover:scale-110 transition-transform"><Copy className="w-4 h-4" /></button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground px-1">Select Provider</Label>
              <div className="grid gap-3">
                {providers.map(p => (
                  <button key={p.id} onClick={() => { window.open(p.provider_url, '_blank'); setShowBuyModal(false); setStep(2); }}
                    className="p-4 rounded-2xl bg-card border border-border hover:border-primary transition-all flex items-center justify-between group shadow-sm">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center overflow-hidden border border-border/50">
                        {p.provider_logo ? <img src={p.provider_logo} className="w-full h-full object-cover" /> : <Globe className="w-5 h-5 text-muted-foreground/30" />}
                      </div>
                      <div className="text-left">
                        <div className="text-xs font-black text-foreground uppercase tracking-tight">{p.provider_name}</div>
                        <div className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest opacity-40">{p.supported_regions || 'Global'}</div>
                      </div>
                    </div>
                    <Button size="sm" className="bg-primary/10 text-primary hover:bg-primary hover:text-white h-8 text-[9px] font-black uppercase rounded-lg">Buy Now</Button>
                  </button>
                ))}
              </div>
            </div>

            <p className="text-[9px] text-center text-amber-600 font-bold uppercase tracking-widest px-4">
              Return here and paste your Transaction Hash after the purchase is complete.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
