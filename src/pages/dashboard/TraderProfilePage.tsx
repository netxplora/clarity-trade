import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useStore } from '@/store/useStore';
import { supabase } from '@/lib/supabase';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, ArrowUpRight, TrendingUp, ShieldCheck, 
  Wallet, AlertCircle, Clock, CheckCircle2, Star,
  Activity, Users, DollarSign, Zap, BarChart3, ChevronRight 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

const TraderProfilePage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { activeSessions, balance, user } = useStore();
  
  const [trader, setTrader] = useState<any>(null);
  const [isCopying, setIsCopying] = useState(false);
  const [copyAmount, setCopyAmount] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const totalUserBalance = balance?.total || 0;

  useEffect(() => {
    const fetchTrader = async () => {
      if (!id) return;
      try {
        const { data, error } = await supabase.from('copy_traders').select('*').eq('id', id).single();
        if (error || !data) {
          toast.error("Trader not found.");
          navigate("/dashboard/copy-trading");
          return;
        }
        setTrader(data);
      } catch (err) {
        toast.error("Failed to load trader.");
        navigate("/dashboard/copy-trading");
      }
    };
    
    fetchTrader();
  }, [id, navigate]);

  if (!trader) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
        </div>
      </DashboardLayout>
    );
  }

  // Same logic as card
  const requiredBalance = trader.min_amount || 100;
  const isLocked = totalUserBalance < requiredBalance;
  const isBeingCopied = activeSessions?.some((s: any) => s.trader_id === trader.id && s.status === 'active');

  const riskLevel = trader.risk || 'Low';
  const riskInfo = 
    riskLevel.toLowerCase() === 'high' ? { color: 'text-red-500', label: 'Aggressive' } :
    riskLevel.toLowerCase() === 'medium' ? { color: 'text-yellow-500', label: 'Moderate' } :
    { color: 'text-green-500', label: 'Conservative' };

  const handleCopy = async () => {
    if (isLocked) {
      toast.error(`Insufficient balance. Requires ${formatCurrency(requiredBalance)}`);
      return;
    }
    const amount = parseFloat(copyAmount);
    if (!amount || amount < requiredBalance) {
      toast.error(`Minimum amount is ${formatCurrency(requiredBalance)}`);
      return;
    }

    setIsProcessing(true);
    try {
      const { user } = useStore.getState();
      if (!user) throw new Error("Authentication error");

      // Deduct from copy trading balance
      const { data: b } = await supabase.from('balances').select('*').eq('user_id', user.id).maybeSingle();
      if (b && (b.copy_trading_balance || 0) >= amount) {
          await supabase.from('balances').update({
              copy_trading_balance: Math.max(0, (b.copy_trading_balance || 0) - amount)
          }).eq('user_id', user.id);
      } else {
         toast.error("Insufficient copy trading balance. Use the Transfer module to move funds.");
         setIsProcessing(false);
         return;
      }

      // Add Active session
      const { error } = await supabase.from('active_sessions').insert({
          user_id: user.id,
          trader_id: String(trader.id),
          trader_name: trader.name,
          allocated_amount: amount,
          status: 'active'
      });
      
      if (!error) {
        toast.success(`Successfully started copying ${trader.name}`);
        useStore.getState().fetchAppData();
        navigate('/dashboard/copy-trading');
      } else {
        toast.error(error.message);
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to start copying");
    } finally {
      setIsProcessing(false);
      setIsCopying(false);
    }
  };

  const formatCurrency = (val: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto space-y-6">
        
        {/* Navigation / Header */}
        <button 
          onClick={() => navigate('/dashboard/copy-trading')}
          className="flex items-center text-sm font-bold text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Traders
        </button>

        {/* Profile Header Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Main Info */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="lg:col-span-2 space-y-6"
          >
            <div className="bg-card border border-border rounded-2xl p-6 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
              
              <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-center relative z-10">
                <div className="relative">
                  <div className={`w-24 h-24 rounded-2xl border-4 ${trader.tier === 'Elite' ? 'border-amber-500/50' : 'border-card'} overflow-hidden shadow-xl`}>
                    {trader.avatar ? (
                      <img src={trader.avatar} alt={trader.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-secondary flex items-center justify-center text-2xl font-black text-muted-foreground">
                        {trader.name?.charAt(0)}
                      </div>
                    )}
                  </div>
                  {trader.tier && (
                    <div className="absolute -bottom-2 -right-2 bg-gradient-to-r from-amber-500 to-amber-700 text-white text-[10px] font-black uppercase px-2 py-1 rounded-lg border-2 border-card shadow-lg flex items-center shadow-gold">
                      <Star className="w-3 h-3 mr-1 fill-current" /> {trader.tier}
                    </div>
                  )}
                </div>

                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h1 className="text-3xl font-black">{trader.name}</h1>
                    <ShieldCheck className="w-6 h-6 text-green-500" />
                  </div>
                  <div className="flex flex-wrap gap-2 mb-4">
                    <span className="px-2.5 py-1 rounded-lg bg-primary/10 text-primary text-[10px] font-bold uppercase">{trader.category}</span>
                    <span className={`px-2.5 py-1 rounded-lg bg-secondary text-[10px] font-bold uppercase ${riskInfo.color}`}>{riskInfo.label} Risk</span>
                  </div>
                  <p className="text-sm text-muted-foreground max-w-xl leading-relaxed">
                    A leading {trader.category} master trader focusing on {riskInfo.label.toLowerCase()}-risk capital growth.
                    This profile utilizes a dedicated strategy with advanced market analytics.
                  </p>
                </div>
              </div>

              {/* Quick Stats Strip */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8 pt-6 border-t border-border/50">
                <div>
                  <div className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider mb-1">Total ROI</div>
                  <div className="text-2xl font-black text-green-500">+{trader.roi}%</div>
                </div>
                <div>
                  <div className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider mb-1">Win Rate</div>
                  <div className="text-2xl font-black">{trader.win_rate}%</div>
                </div>
                <div>
                  <div className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider mb-1">Followers</div>
                  <div className="text-2xl font-black">{trader.followers_count || 0}</div>
                </div>
                <div>
                  <div className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider mb-1">Max Drawdown</div>
                  <div className="text-2xl font-black text-red-500">{trader.drawdown || 0}%</div>
                </div>
              </div>
            </div>

            {/* Performance Overview (Mocked Chart Area for MVP) */}
            <div className="bg-card border border-border rounded-2xl p-6">
              <h2 className="text-sm font-black uppercase tracking-wider mb-6 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-primary" /> Performance History
              </h2>
              <div className="h-64 rounded-xl bg-secondary/50 border border-border/50 flex flex-col items-center justify-center text-center p-6 relative overflow-hidden">
                <Activity className="w-12 h-12 text-primary/20 mb-3" />
                <div className="text-sm font-bold text-foreground">Interactive Chart</div>
                <div className="text-xs text-muted-foreground max-w-xs mt-2">
                  Historical trading performance visualization is available for active sessions and Elite tier users.
                </div>
                {/* Decorative lines */}
                <svg className="absolute bottom-0 w-full h-24 text-primary/10" preserveAspectRatio="none" viewBox="0 0 100 100">
                  <path d="M0,100 L0,50 Q25,20 50,60 T100,30 L100,100 Z" fill="currentColor" />
                </svg>
              </div>
            </div>

          </motion.div>

          {/* Action Panel */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="space-y-6"
          >
            {/* Action Box */}
            <div className="bg-card border border-border rounded-2xl p-5 sticky top-24 shadow-lg shadow-black/5">
              <div className="mb-6">
                <h3 className="text-sm font-black uppercase tracking-wider flex items-center gap-2 mb-1">
                  <Wallet className="w-4 h-4 text-primary" /> Start Copying
                </h3>
                <p className="text-xs text-muted-foreground">Allocate funds to mirror this trader.</p>
              </div>

              {/* Requirement Alert */}
              <div className="bg-secondary/50 rounded-xl p-4 mb-6">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase">Min Requirement</span>
                  <span className="text-sm font-black">{formatCurrency(requiredBalance)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase">Your Balance</span>
                  <span className={`text-sm font-black ${isLocked ? 'text-red-500' : 'text-green-500'}`}>
                    {formatCurrency(totalUserBalance)}
                  </span>
                </div>
                {isLocked && (
                  <div className="mt-3 bg-red-500/10 border border-red-500/20 rounded-lg p-2 text-[10px] text-red-600 font-bold flex items-center gap-1.5 leading-tight">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" /> Balance insufficient to copy this trader.
                  </div>
                )}
              </div>

              {/* Control Flow */}
              {isBeingCopied ? (
                <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4 text-center">
                  <CheckCircle2 className="w-8 h-8 text-green-500 mx-auto mb-2" />
                  <div className="text-sm font-black text-green-500 uppercase">Currently Copying</div>
                  <div className="text-xs text-green-500/80 mt-1">Manage this session from your Dashboard.</div>
                  <Button 
                    variant="outline" 
                    className="w-full mt-4 h-10 rounded-lg text-xs font-bold uppercase"
                    onClick={() => navigate('/dashboard/copy-trading')}
                  >
                    View Session
                  </Button>
                </div>
              ) : isCopying ? (
                <div className="space-y-4">
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                      type="number"
                      placeholder={`Minimum ${formatCurrency(requiredBalance)}`}
                      value={copyAmount}
                      onChange={(e) => setCopyAmount(e.target.value)}
                      className="w-full h-12 bg-background border border-border rounded-xl pl-9 pr-16 text-sm font-bold tabular-nums outline-none focus:border-primary/50 text-foreground"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-muted-foreground">USDT</span>
                  </div>
                  <div className="text-[10px] text-muted-foreground leading-relaxed">
                    By confirming, you authorize our system to automatically execute trades from this master account onto your portfolio.
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Button variant="outline" className="h-12 rounded-xl text-xs font-bold uppercase" onClick={() => setIsCopying(false)}>
                      Cancel
                    </Button>
                    <Button 
                      variant="hero" 
                      className="h-12 rounded-xl text-xs font-bold uppercase text-white shadow-gold" 
                      onClick={handleCopy}
                      disabled={isProcessing || parseFloat(copyAmount || '0') < requiredBalance}
                    >
                      {isProcessing ? <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : "Confirm"}
                    </Button>
                  </div>
                </div>
              ) : (
                <Button
                  variant={isLocked ? "outline" : "hero"}
                  className={`w-full h-12 rounded-xl text-xs font-bold uppercase tracking-wider ${isLocked ? 'border-red-500/20 text-red-500 hover:bg-red-500/5 cursor-not-allowed' : 'text-white shadow-gold'}`}
                  onClick={() => !isLocked && setIsCopying(true)}
                  disabled={isLocked}
                >
                  {isLocked ? <><AlertCircle className="w-4 h-4 mr-2" /> Locked</> : <>Allocate Capital <ArrowUpRight className="w-4 h-4 ml-1.5" /></>}
                </Button>
              )}
            </div>

            {/* Features Module */}
            {trader.dedicated_features && trader.dedicated_features.length > 0 && (
              <div className="bg-card border border-border rounded-2xl p-5">
                <h3 className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider mb-4 border-b border-border pb-2">Dedicated Features</h3>
                <div className="space-y-3">
                  {trader.dedicated_features.map((feat: string, idx: number) => (
                    <div key={idx} className="flex gap-3 items-center text-sm font-medium text-foreground">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <Zap className="w-4 h-4 text-primary" />
                      </div>
                      {feat}
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Info Module */}
            <div className="bg-secondary/30 border border-border rounded-2xl p-5 text-center px-6">
              <ShieldCheck className="w-8 h-8 text-primary/50 mx-auto mb-3" />
              <div className="text-xs font-bold mb-1">Capital Protection</div>
              <div className="text-[10px] text-muted-foreground leading-relaxed">
                Your funds remain fully in your control. You can pause or stop copying the strategy at any time to preserve your balance.
              </div>
            </div>

          </motion.div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default TraderProfilePage;
