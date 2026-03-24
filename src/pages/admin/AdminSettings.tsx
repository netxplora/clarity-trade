import AdminLayout from "@/components/layouts/AdminLayout";
import { validateWalletAddress } from "@/lib/wallet-validator";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { 
  Settings, Globe, Key, Bell, ShieldCheck, Zap, Server, 
  RefreshCw, Lock, Wallet, CreditCard, Target, History,
  Shield, Scale, ArrowRight, Percent, CheckCircle, XCircle, Copy
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useStore } from "@/store/useStore";
import { supabase } from "@/lib/supabase";

const AdminSettings = () => {
  const { depositWallets, user } = useStore();
  const [activeTab, setActiveTab] = useState("general");
  const [settings, setSettings] = useState<any>({
    platformFeePercent: 2,
    feeWalletAddress: '',
    feeWalletNetwork: 'ERC-20',
    feeCollectedTotal: 0,
    feeEnabled: true,
    minWithdrawalAmount: 10,
    maxWithdrawalAmount: 50000,
    kycRequiredForWithdrawal: true,
    copyTradingEnabled: true,
    minCopyAllocation: 100,
    commissionAutoDeduct: 10,
    globalTradingEnabled: true
  });
  const [feeLedger, setFeeLedger] = useState<any[]>([]);
  const [savingFee, setSavingFee] = useState(false);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase.from('platform_settings').select('*').single();
      if (data) {
        setSettings({
          platformFeePercent: data.platform_fee_percent ?? 2,
          feeWalletAddress: data.fee_wallet_address ?? '',
          feeWalletNetwork: data.fee_wallet_network ?? 'ERC-20',
          feeEnabled: data.fee_enabled ?? true,
          minWithdrawalAmount: data.min_withdrawal_amount ?? 10,
          maxWithdrawalAmount: data.max_withdrawal_amount ?? 50000,
          kycRequiredForWithdrawal: data.kyc_required_for_withdrawal ?? true,
          copyTradingEnabled: data.copy_trading_enabled ?? true,
          minCopyAllocation: data.min_copy_allocation ?? 100,
          commissionAutoDeduct: data.commission_auto_deduct_percent ?? 10,
          globalTradingEnabled: data.global_trading_enabled ?? true,
          feeCollectedTotal: settings.feeCollectedTotal // We'll compute this from ledger
        });
      }
    } catch (err) {
      console.error("Failed to fetch settings", err);
    }
  };

  const fetchFeeLedger = async () => {
    try {
      const { data, error } = await supabase.from('fee_ledger').select('*').order('created_at', { ascending: false });
      if (data) {
        setFeeLedger(data);
        const total = data.reduce((acc, row) => acc + (Number(row.fee_amount) || 0), 0);
        setSettings(prev => ({ ...prev, feeCollectedTotal: total }));
      }
    } catch (err) {
      console.error('Failed to fetch fee ledger', err);
    }
  };

  useEffect(() => {
    fetchSettings();
    fetchFeeLedger();
  }, []);

  const handleSave = async (payload: any = {}) => {
    try {
        const finalPayload = { ...settings, ...payload };
        const { error } = await supabase.from('platform_settings').upsert({
          id: 1,
          platform_fee_percent: finalPayload.platformFeePercent,
          fee_wallet_address: finalPayload.feeWalletAddress,
          fee_wallet_network: finalPayload.feeWalletNetwork,
          fee_enabled: finalPayload.feeEnabled,
          min_withdrawal_amount: finalPayload.minWithdrawalAmount,
          max_withdrawal_amount: finalPayload.maxWithdrawalAmount,
          kyc_required_for_withdrawal: finalPayload.kycRequiredForWithdrawal,
          copy_trading_enabled: finalPayload.copyTradingEnabled,
          min_copy_allocation: finalPayload.minCopyAllocation,
          commission_auto_deduct_percent: finalPayload.commissionAutoDeduct,
          global_trading_enabled: finalPayload.globalTradingEnabled
        });
        
        if (!error) {
            setSettings(finalPayload);
            toast.success("System settings updated", {
                description: "Settings have been saved across the platform."
            });
        } else {
            throw error;
        }
    } catch (err) {
        toast.error("Failed to save settings");
    }
  };

  const handleRestart = () => {
    toast.promise(new Promise(r => setTimeout(r, 2000)), {
      loading: "Restarting platform services...",
      success: "Services restarted successfully",
      error: "Failed to restart services"
    });
  };

  const handleSaveFeeWallet = async () => {
    setSavingFee(true);
    try {
    const { error } = await supabase.from('platform_settings').update({
         fee_wallet_address: settings.feeWalletAddress,
         fee_wallet_network: settings.feeWalletNetwork,
         platform_fee_percent: settings.platformFeePercent,
         fee_enabled: settings.feeEnabled
      }).eq('id', 1);

      if (!error) {
        toast.success('Fee wallet configuration saved', {
          description: 'Platform fee routing has been updated across all modules.'
        });
        await fetchSettings();
      } else {
        throw error;
      }
    } catch (err) {
      toast.error('Failed to save fee wallet');
    } finally {
      setSavingFee(false);
    }
  };

  const tabs = [
    { id: "general", label: "General", icon: Globe },
    { id: "fees", label: "Platform Fees", icon: Percent },
    { id: "wallets", label: "Wallets", icon: Wallet },
    { id: "trading", label: "Trading", icon: Target },
    { id: "security", label: "Security", icon: ShieldCheck },
    { id: "api", label: "API & Infrastructure", icon: Key },
  ];

  return (
    <AdminLayout>
      <div className="space-y-10 max-w-7xl">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-border">
          <div>
            <h1 className="text-3xl font-bold text-foreground">System Configuration</h1>
            <p className="text-muted-foreground text-sm mt-2">Manage global platform behavior, financial rules, and infra settings.</p>
          </div>
          <div className="flex gap-3">
             <Button variant="outline" onClick={handleRestart} className="h-11 border-border bg-card text-sm font-medium px-6 shadow-sm hover:bg-secondary">
               <RefreshCw className="w-4 h-4 mr-2" /> Restart Services
             </Button>
          </div>
        </div>

        <div className="grid lg:grid-cols-[280px_1fr] gap-12">
          {/* Sidebar Tabs */}
          <aside className="space-y-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-5 py-3.5 rounded-2xl text-sm font-bold transition-all border ${
                  activeTab === tab.id
                    ? "bg-primary text-white border-primary shadow-gold"
                    : "bg-card text-muted-foreground border-border hover:bg-secondary hover:border-primary/20"
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </aside>

          {/* Tab Content */}
          <main className="space-y-8">
            <AnimatePresence mode="wait">
              {activeTab === "general" && (
                <motion.div 
                   key="general"
                   initial={{ opacity: 0, x: 20 }}
                   animate={{ opacity: 1, x: 0 }}
                   exit={{ opacity: 0, x: -20 }}
                   className="space-y-8"
                >
                  <div className="bg-card p-8 rounded-3xl border border-border shadow-sm space-y-8">
                    <div className="flex items-center gap-4 border-b border-border pb-6">
                      <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                        <Globe className="w-6 h-6" />
                      </div>
                      <div>
                        <h2 className="text-xl font-bold text-foreground">Global Platform Identity</h2>
                        <p className="text-xs text-muted-foreground mt-0.5">Control the public face of the platform.</p>
                      </div>
                    </div>
                    
                    <div className="grid md:grid-cols-2 gap-8">
                       <div className="space-y-2">
                          <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest pl-1">Platform Public Name</Label>
                          <Input defaultValue="Clarity Trade" className="h-14 bg-secondary border-border rounded-xl font-bold" />
                       </div>
                       <div className="space-y-2">
                          <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest pl-1">Contact Support Email</Label>
                          <Input defaultValue="support@claritytrade.com" className="h-14 bg-secondary border-border rounded-xl font-bold" />
                       </div>
                    </div>

                    <div className="grid md:grid-cols-3 gap-6">
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest pl-1">Platform Fee (%)</Label>
                            <Input 
                               value={settings.platformFeePercent} 
                               onChange={(e) => setSettings({...settings, platformFeePercent: parseFloat(e.target.value) || 0})} 
                               type="number" 
                               className="h-14 bg-secondary border-border rounded-xl font-bold" 
                            />
                            <p className="text-[9px] text-muted-foreground px-1 italic">Applied to all buy/sell transactions.</p>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest pl-1">Min. Withdrawal (USD)</Label>
                            <Input 
                               value={settings.minWithdrawalAmount} 
                               onChange={(e) => setSettings({...settings, minWithdrawalAmount: parseFloat(e.target.value) || 0})} 
                               type="number" 
                               className="h-14 bg-secondary border-border rounded-xl font-bold" 
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest pl-1">Max. Withdrawal (USD)</Label>
                            <Input 
                               value={settings.maxWithdrawalAmount} 
                               onChange={(e) => setSettings({...settings, maxWithdrawalAmount: parseFloat(e.target.value) || 0})} 
                               type="number" 
                               className="h-14 bg-secondary border-border rounded-xl font-bold" 
                            />
                        </div>
                    </div>

                    <Button variant="hero" onClick={handleSave} className="h-14 px-10 text-xs font-black uppercase tracking-widest text-white shadow-gold">
                      Update Global Rules
                    </Button>
                  </div>

                  <div className="bg-card p-8 rounded-3xl border border-border shadow-sm space-y-8">
                    <div className="flex items-center gap-4 border-b border-border pb-6">
                       <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 border border-blue-100">
                         <CreditCard className="w-6 h-6" />
                       </div>
                       <div>
                         <h2 className="text-xl font-bold text-foreground">Payment Gateways</h2>
                         <p className="text-xs text-muted-foreground mt-0.5">Configure fiat-to-crypto onramp providers.</p>
                       </div>
                    </div>
                    
                    <div className="space-y-4">
                        {[
                          { name: "Changelly Onramp", provider: "Changelly API", status: "Active" },
                          { name: "MoonPay Gateway", provider: "MoonPay SDK", status: "Inactive" },
                          { name: "Stripe Connect", provider: "Stripe Fiat", status: "Maintenance" },
                        ].map((gw) => (
                           <div key={gw.name} className="flex items-center justify-between p-5 rounded-2xl bg-secondary border border-border">
                              <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-xl bg-card flex items-center justify-center border border-border">
                                  <Zap className={`w-5 h-5 ${gw.status === 'Active' ? 'text-green-500' : 'text-muted-foreground'}`} />
                                </div>
                                <div>
                                   <div className="text-sm font-bold text-foreground">{gw.name}</div>
                                   <div className="text-[10px] font-bold text-muted-foreground uppercase">{gw.provider}</div>
                                </div>
                              </div>
                              <div className="flex items-center gap-4">
                                 <span className={`text-[10px] font-black uppercase px-3 py-1 rounded-full border ${
                                   gw.status === 'Active' ? 'bg-green-50 text-green-700 border-green-100' : 'bg-card text-muted-foreground border-border'
                                 }`}>
                                   {gw.status}
                                 </span>
                                 <Switch defaultChecked={gw.status === 'Active'} />
                              </div>
                           </div>
                        ))}
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === "fees" && (
                <motion.div 
                   key="fees"
                   initial={{ opacity: 0, x: 20 }}
                   animate={{ opacity: 1, x: 0 }}
                   exit={{ opacity: 0, x: -20 }}
                   className="space-y-8"
                >
                  {/* Fee Configuration Card */}
                  <div className="bg-card p-8 rounded-3xl border border-border shadow-sm space-y-8">
                    <div className="flex items-center gap-4 border-b border-border pb-6">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500/20 to-purple-600/20 flex items-center justify-center text-purple-500 border border-purple-500/20">
                        <Percent className="w-6 h-6" />
                      </div>
                      <div className="flex-1">
                        <h2 className="text-xl font-bold text-foreground">Clarity Platform Fee Engine</h2>
                        <p className="text-xs text-muted-foreground mt-0.5">Configure the fee percentage, collection wallet, and routing rules.</p>
                      </div>
                      <div className="flex items-center gap-3">
                        {settings.feeEnabled ? (
                          <span className="flex items-center gap-1.5 text-[10px] font-black uppercase text-green-600 bg-green-50 px-3 py-1.5 rounded-full border border-green-100">
                            <CheckCircle className="w-3 h-3" /> Active
                          </span>
                        ) : (
                          <span className="flex items-center gap-1.5 text-[10px] font-black uppercase text-red-600 bg-red-50 px-3 py-1.5 rounded-full border border-red-100">
                            <XCircle className="w-3 h-3" /> Disabled
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Stats Row */}
                    <div className="grid grid-cols-3 gap-6">
                      <div className="p-5 rounded-2xl bg-secondary border border-border text-center">
                        <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest mb-2">Fee Rate</p>
                        <p className="text-2xl font-black text-primary">{settings.platformFeePercent}%</p>
                      </div>
                      <div className="p-5 rounded-2xl bg-secondary border border-border text-center">
                        <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest mb-2">Total Collected</p>
                        <p className="text-2xl font-black text-foreground">${(settings.feeCollectedTotal || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                      </div>
                      <div className="p-5 rounded-2xl bg-secondary border border-border text-center">
                        <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest mb-2">Ledger Entries</p>
                        <p className="text-2xl font-black text-foreground">{feeLedger.length}</p>
                      </div>
                    </div>

                    {/* Enable/Disable Toggle */}
                    <div className="flex items-center justify-between p-6 rounded-2xl bg-secondary border border-border hover:bg-card transition-colors">
                      <div className="flex gap-4">
                        <div className="w-11 h-11 rounded-xl bg-primary/20 flex items-center justify-center text-primary border border-primary/20">
                          <Zap className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="text-sm font-black text-foreground">Fee Collection Status</div>
                          <div className="text-[10px] font-bold text-muted-foreground uppercase mt-0.5 italic">Toggle to enable or disable the 2% platform fee on all transactions.</div>
                        </div>
                      </div>
                      <Switch 
                        checked={settings.feeEnabled} 
                        onCheckedChange={(checked) => setSettings({...settings, feeEnabled: checked})} 
                      />
                    </div>

                    {/* Fee % Input */}
                    <div className="grid md:grid-cols-2 gap-8">
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest pl-1">Platform Fee Percentage (%)</Label>
                        <Input 
                          value={settings.platformFeePercent} 
                          onChange={(e) => setSettings({...settings, platformFeePercent: parseFloat(e.target.value) || 0})}
                          type="number" 
                          step="0.1"
                          min="0"
                          max="100"
                          className="h-14 bg-secondary border-border rounded-xl font-bold" 
                        />
                        <p className="text-[9px] text-muted-foreground px-1 italic">Applied automatically to buy/sell/deposit transactions at completion.</p>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest pl-1">Collection Network</Label>
                        <Input 
                          value={settings.feeWalletNetwork} 
                          onChange={(e) => setSettings({...settings, feeWalletNetwork: e.target.value})}
                          className="h-14 bg-secondary border-border rounded-xl font-bold" 
                          placeholder="e.g. ERC-20, TRC-20, BEP-20"
                        />
                      </div>
                    </div>

                    {/* Fee Wallet Address */}
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest pl-1">Fee Collection Wallet Address</Label>
                      <div className="flex gap-3">
                        <Input 
                          value={settings.feeWalletAddress} 
                          onChange={(e) => setSettings({...settings, feeWalletAddress: e.target.value})}
                          className="h-14 bg-secondary border-border rounded-xl font-mono text-xs font-bold flex-1" 
                          placeholder="0x... or T... or bc1..."
                        />
                        <Button 
                          variant="outline" 
                          className="h-14 px-4 border-border bg-card"
                          onClick={() => {
                            navigator.clipboard.writeText(settings.feeWalletAddress);
                            toast.success("Wallet address copied");
                          }}
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                      </div>
                      <p className="text-[9px] text-muted-foreground px-1 italic">All platform fees will be routed to this address. Ensure it's a valid, accessible wallet.</p>
                    </div>

                    {!settings.feeWalletAddress && (
                      <div className="p-5 rounded-2xl bg-amber-50 border border-amber-200 flex items-start gap-4">
                        <Shield className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
                        <div>
                          <p className="text-xs font-bold text-amber-800 uppercase tracking-widest mb-1">⚠ Wallet Not Configured</p>
                          <p className="text-xs text-amber-700 leading-relaxed font-medium">Fees are being calculated but cannot be routed until a valid collection wallet is set.</p>
                        </div>
                      </div>
                    )}

                    <Button 
                      variant="hero" 
                      onClick={handleSaveFeeWallet} 
                      disabled={savingFee}
                      className="h-14 px-10 text-xs font-black uppercase tracking-widest text-white shadow-gold"
                    >
                      {savingFee ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <ShieldCheck className="w-4 h-4 mr-2" />}
                      Save Fee Configuration
                    </Button>
                  </div>

                  {/* Fee Ledger */}
                  <div className="bg-card p-8 rounded-3xl border border-border shadow-sm space-y-6">
                    <div className="flex items-center gap-4 border-b border-border pb-6">
                      <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600 border border-emerald-100">
                        <History className="w-6 h-6" />
                      </div>
                      <div>
                        <h2 className="text-xl font-bold text-foreground">Fee Collection Ledger</h2>
                        <p className="text-xs text-muted-foreground mt-0.5">Real-time log of every fee deducted from completed transactions.</p>
                      </div>
                    </div>

                    {feeLedger.length === 0 ? (
                      <div className="text-center py-12">
                        <History className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                        <p className="text-sm font-bold text-muted-foreground">No fees collected yet</p>
                        <p className="text-xs text-muted-foreground/60 mt-1">Fee entries will appear here once transactions are completed.</p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left">
                          <thead>
                            <tr className="border-b border-border">
                              <th className="pb-3 text-[10px] font-black uppercase text-muted-foreground tracking-widest">Date</th>
                              <th className="pb-3 text-[10px] font-black uppercase text-muted-foreground tracking-widest">Transaction</th>
                              <th className="pb-3 text-[10px] font-black uppercase text-muted-foreground tracking-widest">Gross</th>
                              <th className="pb-3 text-[10px] font-black uppercase text-muted-foreground tracking-widest">Fee ({settings.platformFeePercent}%)</th>
                              <th className="pb-3 text-[10px] font-black uppercase text-muted-foreground tracking-widest">Net Credited</th>
                              <th className="pb-3 text-[10px] font-black uppercase text-muted-foreground tracking-widest">Asset</th>
                            </tr>
                          </thead>
                          <tbody>
                            {feeLedger.map((entry: any) => (
                              <tr key={entry.id} className="border-b border-border/50 hover:bg-secondary/50 transition-colors">
                                <td className="py-3 text-xs text-muted-foreground">{new Date(entry.created_at).toLocaleDateString()}</td>
                                <td className="py-3 text-xs font-mono text-foreground">{entry.transaction_id?.substring(0, 14)}...</td>
                                <td className="py-3 text-xs font-bold text-foreground">${entry.gross_amount?.toFixed(2)}</td>
                                <td className="py-3 text-xs font-bold text-red-500">-${entry.fee_amount?.toFixed(2)}</td>
                                <td className="py-3 text-xs font-bold text-green-600">${entry.net_amount?.toFixed(2)}</td>
                                <td className="py-3 text-[10px] font-black uppercase text-muted-foreground">{entry.asset}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {activeTab === "wallets" && (
                <motion.div 
                   key="wallets"
                   initial={{ opacity: 0, x: 20 }}
                   animate={{ opacity: 1, x: 0 }}
                   className="space-y-8"
                >
                  <WalletsPanel />
                </motion.div>
              )}

              {activeTab === "trading" && (
                <motion.div 
                   key="trading"
                   initial={{ opacity: 0, x: 20 }}
                   animate={{ opacity: 1, x: 0 }}
                   className="space-y-8"
                >
                  <div className="bg-card p-8 rounded-3xl border border-border shadow-sm space-y-8">
                     <div className="flex items-center gap-4 border-b border-border pb-6">
                       <div className="w-12 h-12 rounded-2xl bg-green-50 flex items-center justify-center text-green-600 border border-green-100">
                         <Target className="w-6 h-6" />
                       </div>
                       <div>
                         <h2 className="text-xl font-bold text-foreground">Copy Trading Parameters</h2>
                         <p className="text-xs text-muted-foreground mt-0.5">Manage risk levels and participation limits.</p>
                       </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-8">
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Min. Copy Allocation ($)</Label>
                            <Input 
                                value={settings.minCopyAllocation} 
                                onChange={(e) => setSettings({...settings, minCopyAllocation: e.target.value})}
                                type="number" 
                                className="h-14 bg-secondary border-border rounded-xl font-bold" 
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Commission Auto-Deduct (%)</Label>
                            <Input 
                                value={settings.commissionAutoDeduct} 
                                onChange={(e) => setSettings({...settings, commissionAutoDeduct: e.target.value})}
                                type="number" 
                                className="h-14 bg-secondary border-border rounded-xl font-bold" 
                            />
                        </div>
                    </div>

                    <div className="space-y-6">
                         <div className="flex items-center justify-between p-6 rounded-2xl bg-secondary border border-border hover:bg-card transition-colors">
                            <div className="flex gap-4">
                                <div className="w-11 h-11 rounded-xl bg-primary/20 flex items-center justify-center text-primary border border-primary/20">
                                   <Shield className="w-5 h-5" />
                                </div>
                                <div>
                                   <div className="text-sm font-black text-foreground">Anti-Whale Protection</div>
                                   <div className="text-[10px] font-bold text-muted-foreground uppercase mt-0.5 italic">Limit copy trades per trader to $1M volume.</div>
                                </div>
                            </div>
                            <Switch defaultChecked />
                         </div>

                         <div className="flex items-center justify-between p-6 rounded-2xl bg-secondary border border-border hover:bg-card transition-colors">
                            <div className="flex gap-4">
                                <div className="w-11 h-11 rounded-xl bg-orange-50 flex items-center justify-center text-orange-600 border border-orange-200">
                                   <Scale className="w-5 h-5" />
                                </div>
                                <div>
                                   <div className="text-sm font-black text-foreground">Risk Escalation Mode</div>
                                   <div className="text-[10px] font-bold text-muted-foreground uppercase mt-0.5 italic">Auto-pause trading during extreme market swings.</div>
                                </div>
                            </div>
                            <Switch />
                         </div>

                         <div className="flex items-center justify-between p-6 rounded-2xl bg-secondary border border-border hover:bg-card transition-colors">
                             <div className="flex gap-4">
                                 <div className="w-11 h-11 rounded-xl bg-red-50 flex items-center justify-center text-red-600 border border-red-200">
                                    <Zap className="w-5 h-5" />
                                 </div>
                                 <div>
                                    <div className="text-sm font-black text-foreground">Global Trading Kill Switch</div>
                                    <div className="text-[10px] font-bold text-muted-foreground uppercase mt-0.5 italic text-red-600/80">Instantly pause all market activity platform-wide.</div>
                                 </div>
                             </div>
                             <Switch 
                               checked={settings.globalTradingEnabled}
                               onCheckedChange={(checked) => setSettings({...settings, globalTradingEnabled: checked})}
                             />
                          </div>
                    </div>
                    
                    <Button variant="hero" onClick={handleSave} className="h-14 px-10 text-xs font-black uppercase tracking-widest text-white shadow-gold">
                      Update Trading Engine
                    </Button>
                  </div>
                </motion.div>
              )}

              {activeTab === "security" && (
                <motion.div 
                   key="security"
                   initial={{ opacity: 0, x: 20 }}
                   animate={{ opacity: 1, x: 0 }}
                   className="space-y-8"
                >
                  <div className="bg-card p-8 rounded-3xl border border-border shadow-sm space-y-8">
                     <div className="flex items-center gap-4 border-b border-border pb-6">
                        <div className="w-12 h-12 rounded-2xl bg-red-50 flex items-center justify-center text-red-600 border border-red-100">
                           <Lock className="w-6 h-6" />
                        </div>
                        <div>
                           <h2 className="text-xl font-bold text-foreground">Platform Security Policies</h2>
                           <p className="text-xs text-muted-foreground mt-0.5">Configure enforcement of user protection rules.</p>
                        </div>
                     </div>

                     <div className="space-y-4">
                         {[
                             { label: "Force 2FA on Withdrawals", enabled: true, desc: "Require users to have 2FA enabled for any outbound funds." },
                             { label: "IP Conflict Lock", enabled: false, desc: "Auto-lock account if login IP changes during active session." },
                             { label: "KYC L3 Requirement", enabled: true, desc: "Users must verify identity for trades > $10,000." },
                             { label: "New Login Webhooks", enabled: true, desc: "Notify admin Slack/Email on every successful admin login." },
                         ].map((policy) => (
                             <div key={policy.label} className="p-6 rounded-2xl bg-secondary border border-border flex items-center justify-between hover:border-primary/20 transition-all">
                                 <div className="space-y-1">
                                     <div className="text-sm font-black text-foreground uppercase tracking-wide">{policy.label}</div>
                                     <p className="text-xs text-muted-foreground italic font-medium">{policy.desc}</p>
                                 </div>
                                 <Switch defaultChecked={policy.enabled} />
                             </div>
                         ))}
                     </div>

                     <div className="p-5 rounded-2xl bg-red-50 border border-red-200 flex items-start gap-4">
                        <Lock className="w-5 h-5 text-red-600 mt-1" />
                        <div>
                            <p className="text-xs font-bold text-red-800 uppercase tracking-widest mb-1">Critical Security Zone</p>
                            <p className="text-xs text-red-700 leading-relaxed font-medium">Changes here affect the entire platform's authentication flow. Use with extreme caution.</p>
                        </div>
                     </div>

                     <Button variant="hero" onClick={handleSave} className="h-14 px-10 text-xs font-black uppercase tracking-widest text-white shadow-gold">
                        Update Policy
                     </Button>
                  </div>
                </motion.div>
              )}

              {activeTab === "api" && (
                <motion.div 
                   key="api"
                   initial={{ opacity: 0, x: 20 }}
                   animate={{ opacity: 1, x: 0 }}
                   className="space-y-8"
                >
                   <div className="bg-card p-8 rounded-3xl border border-border shadow-sm space-y-8">
                      <div className="flex items-center gap-4 border-b border-border pb-6">
                        <div className="w-12 h-12 rounded-2xl bg-purple-50 flex items-center justify-center text-purple-600 border border-purple-100">
                          <Key className="w-6 h-6" />
                        </div>
                        <div>
                          <h2 className="text-xl font-bold text-foreground">Infrastructure & API Keys</h2>
                          <p className="text-xs text-muted-foreground mt-0.5">Manage external service connections.</p>
                        </div>
                      </div>

                      <div className="space-y-4">
                        {["Blockchain Node API", "Trading Simulation Engine", "Email Delivery Service", "GeoIP Provider"].map((key) => (
                          <div key={key} className="p-6 rounded-2xl bg-secondary border border-border flex items-center justify-between">
                             <div className="space-y-1">
                                <div className="text-sm font-black text-foreground uppercase">{key}</div>
                                <div className="text-xs font-mono text-muted-foreground">••••••••••••••••••••••••••••••••</div>
                             </div>
                             <Button variant="outline" className="h-10 border-border bg-card font-bold text-[10px] uppercase tracking-widest hover:text-primary">
                                Rotate Config
                             </Button>
                          </div>
                        ))}
                      </div>

                      <div className="bg-secondary/40 p-6 rounded-2xl border border-border flex items-center justify-between">
                         <div className="flex items-center gap-4">
                            <Server className="w-6 h-6 text-primary" />
                            <div>
                               <div className="text-sm font-bold text-foreground">Platform Server Status</div>
                               <p className="text-[10px] font-bold text-green-600 uppercase">Operational • 99.99% Uptime</p>
                            </div>
                         </div>
                         <div className="flex gap-4 items-center">
                            <div className="text-right">
                               <p className="text-[10px] font-bold text-muted-foreground uppercase mb-1">Active Memory</p>
                               <p className="text-sm font-black text-foreground">4.2 GB / 16 GB</p>
                            </div>
                            <ActivityIndicator color="bg-green-500" />
                         </div>
                      </div>
                   </div>
                </motion.div>
              )}
            </AnimatePresence>
          </main>
        </div>
      </div>
    </AdminLayout>
  );
};

const COIN_OPTIONS = [
  { value: 'Bitcoin', label: 'Bitcoin (BTC)', badge: 'BTC' },
  { value: 'Ethereum', label: 'Ethereum (ETH)', badge: 'ETH' },
  { value: 'USDT', label: 'Tether (USDT)', badge: 'USDT' },
  { value: 'USDC', label: 'USD Coin (USDC)', badge: 'USDC' },
  { value: 'Solana', label: 'Solana (SOL)', badge: 'SOL' },
  { value: 'BNB', label: 'BNB Chain (BNB)', badge: 'BNB' },
  { value: 'XRP', label: 'Ripple (XRP)', badge: 'XRP' },
  { value: 'Litecoin', label: 'Litecoin (LTC)', badge: 'LTC' },
  { value: 'Dogecoin', label: 'Dogecoin (DOGE)', badge: 'DOGE' },
  { value: 'TRON', label: 'Tron (TRX)', badge: 'TRX' },
  { value: 'Polygon', label: 'Polygon (MATIC)', badge: 'MATIC' },
];

type WalletRow = {
  id: string;
  coin: string;
  network: string;
  address: string;
  status: string;
};

const WalletsPanel = () => {
  const [wallets, setWallets] = useState<WalletRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [newWallet, setNewWallet] = useState({ coin: 'Bitcoin', network: 'Mainnet', address: '' });

  const fetchWallets = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('deposit_wallets').select('*').order('created_at', { ascending: true });
    if (!error && data) setWallets(data as WalletRow[]);
    setLoading(false);
  };

  useEffect(() => { fetchWallets(); }, []);


  const handleAdd = async () => {
    if (!newWallet.address.trim()) { toast.error('Wallet address is required'); return; }
    
    // Validation
    const validation = await validateWalletAddress(newWallet.address.trim(), newWallet.coin, newWallet.network);
    if (!validation.isValid) {
      toast.error(validation.error || 'Invalid address format');
      return;
    }

    setSaving('new');
    const { error } = await supabase.from('deposit_wallets').insert({
      coin: newWallet.coin,
      network: newWallet.network,
      address: newWallet.address.trim(),
      status: 'Active',
    });
    if (error) { toast.error(error.message); } else {
      toast.success(`${newWallet.coin} wallet added`);
      setNewWallet({ coin: 'Bitcoin', network: 'Mainnet', address: '' });
      setShowAdd(false);
      await fetchWallets();
    }
    setSaving(null);
  };

  const handleUpdate = async (id: string, updates: Partial<WalletRow>) => {
    if (updates.address) {
      const wallet = wallets.find(w => w.id === id);
      const validation = await validateWalletAddress(updates.address, wallet?.coin || '', wallet?.network || '');
      if (!validation.isValid) {
        toast.error(validation.error || 'Invalid address format');
        return;
      }
    }
    setSaving(id);
    const { error } = await supabase.from('deposit_wallets').update(updates).eq('id', id);
    if (error) toast.error(error.message);
    else {
      setWallets(prev => prev.map(w => w.id === id ? { ...w, ...updates } : w));
      toast.success('Wallet updated');
    }
    setSaving(null);
  };

  const handleDelete = async (id: string, coin: string) => {
    const { error } = await supabase.from('deposit_wallets').delete().eq('id', id);
    if (error) toast.error(error.message);
    else {
      setWallets(prev => prev.filter(w => w.id !== id));
      toast.success(`${coin} wallet removed`);
    }
  };

  const coinBadge = (coin: string) => COIN_OPTIONS.find(c => c.value === coin)?.badge || coin.substring(0, 4).toUpperCase();

  return (
    <div className="space-y-8">
      {/* Header Card */}
      <div className="bg-card p-8 rounded-3xl border border-border shadow-sm space-y-8">
        <div className="flex items-center justify-between border-b border-border pb-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-orange-50 flex items-center justify-center text-orange-600 border border-orange-100">
              <Wallet className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground">Operational Wallets</h2>
              <p className="text-xs text-muted-foreground mt-0.5">Define system addresses for user deposits and reserves.</p>
            </div>
          </div>
          <Button 
            variant="hero" 
            onClick={() => setShowAdd(!showAdd)}
            className="h-12 px-6 text-xs font-black uppercase tracking-widest text-white shadow-gold"
          >
            {showAdd ? <XCircle className="w-4 h-4 mr-2" /> : <ArrowRight className="w-4 h-4 mr-2" />}
            {showAdd ? 'Cancel' : 'Add Wallet'}
          </Button>
        </div>

        {/* Stats Bar */}
        <div className="grid grid-cols-3 gap-6">
          <div className="p-4 rounded-2xl bg-secondary border border-border text-center">
            <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest mb-1">Total Wallets</p>
            <p className="text-2xl font-black text-foreground">{wallets.length}</p>
          </div>
          <div className="p-4 rounded-2xl bg-secondary border border-border text-center">
            <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest mb-1">Active</p>
            <p className="text-2xl font-black text-green-600">{wallets.filter(w => w.status === 'Active').length}</p>
          </div>
          <div className="p-4 rounded-2xl bg-secondary border border-border text-center">
            <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest mb-1">Inactive</p>
            <p className="text-2xl font-black text-red-500">{wallets.filter(w => w.status !== 'Active').length}</p>
          </div>
        </div>

        {/* Add New Wallet Form */}
        <AnimatePresence>
          {showAdd && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }} 
              animate={{ opacity: 1, height: 'auto' }} 
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="p-6 rounded-2xl bg-primary/5 border border-primary/20 space-y-5">
                <div className="flex items-center gap-2 mb-2">
                  <Wallet className="w-4 h-4 text-primary" />
                  <span className="text-sm font-black text-foreground uppercase tracking-wide">Register New Wallet</span>
                </div>
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label className="text-[9px] font-black uppercase text-muted-foreground tracking-widest">Cryptocurrency</Label>
                    <select
                      value={newWallet.coin}
                      onChange={(e) => setNewWallet({ ...newWallet, coin: e.target.value })}
                      className="w-full h-12 bg-card border border-border rounded-xl px-4 text-sm font-bold text-foreground focus:outline-none focus:border-primary"
                    >
                      {COIN_OPTIONS.map(c => (
                        <option key={c.value} value={c.value}>{c.label}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[9px] font-black uppercase text-muted-foreground tracking-widest">Network</Label>
                    <Input 
                      value={newWallet.network} 
                      onChange={(e) => setNewWallet({ ...newWallet, network: e.target.value })}
                      placeholder="e.g. ERC-20, TRC-20, BEP-20, Mainnet"
                      className="h-12 bg-card border-border text-xs font-bold" 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[9px] font-black uppercase text-muted-foreground tracking-widest">Wallet Address</Label>
                    <Input 
                      value={newWallet.address} 
                      onChange={(e) => setNewWallet({ ...newWallet, address: e.target.value })}
                      placeholder="0x... or bc1... or T..."
                      className="h-12 bg-card border-border font-mono text-xs font-bold" 
                    />
                  </div>
                </div>
                <Button 
                  onClick={handleAdd} 
                  disabled={saving === 'new'}
                  className="h-12 px-8 bg-primary hover:bg-primary/90 text-white text-xs font-black uppercase tracking-widest"
                >
                  {saving === 'new' ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle className="w-4 h-4 mr-2" />}
                  Register Wallet
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Wallet List */}
        {loading ? (
          <div className="flex flex-col items-center gap-3 py-12">
            <RefreshCw className="w-6 h-6 text-muted-foreground animate-spin" />
            <p className="text-xs text-muted-foreground">Loading wallets from database...</p>
          </div>
        ) : wallets.length === 0 ? (
          <div className="text-center py-12">
            <Wallet className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm font-bold text-muted-foreground">No operational wallets configured</p>
            <p className="text-xs text-muted-foreground/60 mt-1">Click "Add Wallet" above to register your first deposit address.</p>
          </div>
        ) : (
          <div className="space-y-5">
            {wallets.map((wallet) => (
              <div key={wallet.id} className="space-y-4 p-6 rounded-2xl bg-secondary border border-border group relative hover:border-primary/20 transition-all">
                {/* Header Row */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-card flex items-center justify-center font-black text-[10px] border border-border shadow-sm tracking-wider">
                      {coinBadge(wallet.coin)}
                    </div>
                    <div>
                      <span className="text-sm font-black text-foreground">{wallet.coin}</span>
                      <p className="text-[10px] text-muted-foreground font-bold uppercase">{wallet.network || 'Mainnet'} Network</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => handleUpdate(wallet.id, { status: wallet.status === 'Active' ? 'Inactive' : 'Active' })}
                      className={`text-[10px] uppercase font-black px-3 py-1.5 rounded-full border cursor-pointer transition-colors ${
                        wallet.status === 'Active' 
                          ? 'text-green-600 bg-green-50 border-green-100 hover:bg-green-100' 
                          : 'text-red-600 bg-red-50 border-red-100 hover:bg-red-100'
                      }`}
                    >
                      {wallet.status === 'Active' ? <><CheckCircle className="w-3 h-3 inline mr-1" />Active</> : <><XCircle className="w-3 h-3 inline mr-1" />Inactive</>}
                    </button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="h-8 px-3 text-[10px] font-black uppercase border-red-200 text-red-500 hover:bg-red-50 hover:text-red-700 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => handleDelete(wallet.id, wallet.coin)}
                    >
                      Remove
                    </Button>
                  </div>
                </div>

                {/* Address Row */}
                <div className="space-y-2">
                  <Label className="text-[9px] font-black uppercase text-muted-foreground tracking-[0.2em]">Deposit Receiving Address</Label>
                  <div className="flex gap-2">
                    <Input 
                      value={wallet.address} 
                      onChange={(e) => setWallets(prev => prev.map(w => w.id === wallet.id ? { ...w, address: e.target.value } : w))}
                      className="h-12 bg-card border-border font-mono text-xs font-bold flex-1" 
                    />
                    <Button 
                      variant="outline"
                      className="h-12 px-3 border-border bg-card"
                      onClick={() => { navigator.clipboard.writeText(wallet.address); toast.success('Address copied'); }}
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                    <Button 
                      variant="outline"
                      className="h-12 px-4 border-border bg-card text-xs font-bold"
                      disabled={saving === wallet.id}
                      onClick={() => handleUpdate(wallet.id, { address: wallet.address })}
                    >
                      {saving === wallet.id ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'Save'}
                    </Button>
                  </div>
                </div>

                {/* Network Row */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label className="text-[9px] font-black uppercase text-muted-foreground">Network</Label>
                    <Input 
                      value={wallet.network || ''} 
                      onChange={(e) => setWallets(prev => prev.map(w => w.id === wallet.id ? { ...w, network: e.target.value } : w))}
                      onBlur={() => handleUpdate(wallet.id, { network: wallet.network })}
                      className="h-10 bg-card border-border text-xs font-bold" 
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[9px] font-black uppercase text-muted-foreground">Wallet Type</Label>
                    <Input 
                      defaultValue="HOT_WALLET" 
                      readOnly
                      className="h-10 bg-card border-border text-xs font-bold uppercase text-muted-foreground cursor-not-allowed" 
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const ActivityIndicator = ({ color }: { color: string }) => (
    <div className="flex gap-1">
        <div className={`w-1 h-3 ${color} rounded-full animate-pulse transition-all`} />
        <div className={`w-1 h-3 ${color} rounded-full animate-pulse delay-75 transition-all`} />
        <div className={`w-1 h-3 ${color} rounded-full animate-pulse delay-150 transition-all`} />
    </div>
);

export default AdminSettings;
