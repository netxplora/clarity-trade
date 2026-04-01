import { useState, useEffect, useCallback, useRef } from "react";
import { motion } from "framer-motion";
import AdminLayout from "@/components/layouts/AdminLayout";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Search, CheckCircle, Ban, Star, ShieldCheck, Target, Users, Zap, TrendingUp, MoreVertical, Shield, Clock, Plus, Trash2, Filter, Activity, Upload, Loader2, Camera, X
} from "lucide-react";
import { useStore } from "@/store/useStore";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

const AdminCopyTrading = () => {
  const { auditLogs, addAuditLog, formatCurrency } = useStore();
  const [search, setSearch] = useState("");
  const [showAudit, setShowAudit] = useState(false);
  const [showAddTrader, setShowAddTrader] = useState(false);
  const [traders, setTraders] = useState<any[]>([]);
  const [activeSessions, setActiveSessions] = useState<any[]>([]);
  const [executionLogs, setExecutionLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'approved' | 'rejected' | 'revoked'>('all');
  const [tierFilter, setTierFilter] = useState<'All' | 'Starter' | 'Silver' | 'Gold' | 'Elite'>('All');
  const [tierMinimums, setTierMinimums] = useState<Record<string, number>>({ Starter: 100, Silver: 1000, Gold: 5000, Elite: 25000 });
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  
  // New/Edit Trader Form
  const [traderForm, setTraderForm] = useState({
    id: "",
    name: "",
    roi: "",
    riskScore: "1",
    followers: "0",
    drawdown: "0",
    winRate: "0",
    totalTrades: "0",
    status: "Active",
    categories: [] as string[],
    min_amount: "500",
    min_plan: "Starter",
    is_trending: false,
    dedicated_features: "",
    avatar_url: ""
  });

  const fetchTraders = useCallback(async () => {
    try {
        const { data, error } = await supabase.from('copy_traders').select('*').order('name');
        if (data) setTraders(data);
    } catch (err) {
        console.error("Failed to fetch traders", err);
    } finally {
        setLoading(false);
    }
  }, []);

  const fetchGlobalLogs = useCallback(async () => {
    try {
        const { data, error } = await supabase
            .from('copy_trading_logs')
            .select(`
                *,
                copy_traders (
                    name,
                    avatar_url
                )
            `)
            .order('created_at', { ascending: false })
            .limit(50);
        if (data) setExecutionLogs(data);
    } catch (err) {
        console.error("Failed to fetch global logs", err);
    }
  }, []);

  const fetchAllSessions = useCallback(async () => {
    try {
        const { data, error } = await supabase
            .from('active_sessions')
            .select(`
                *,
                copy_traders!inner (
                    avatar_url,
                    ranking_level
                )
            `);
        if (data) setActiveSessions(data);
    } catch (err) {
        console.error("Failed to fetch all sessions", err);
    }
  }, []);

  const fetchTierMinimums = useCallback(async () => {
    try {
      const { data } = await supabase.from('platform_settings').select('tier_minimums').eq('id', 1).single();
      if (data?.tier_minimums) {
        setTierMinimums(data.tier_minimums);
      }
    } catch (err) {
      console.error('Failed to fetch tier minimums', err);
    }
  }, []);

  useEffect(() => {
    fetchTraders();
    fetchAllSessions();
    fetchGlobalLogs();
    fetchTierMinimums();
    
    // Subscribe to new logs for real-time monitoring
    const logSubscription = supabase
        .channel('admin-logs')
        .on('postgres_changes', { event: 'INSERT', table: 'copy_trading_logs', schema: 'public' }, () => {
             fetchGlobalLogs();
             fetchAllSessions();
        })
        .subscribe();

    const interval = setInterval(() => {
        fetchTraders();
    }, 30000);
    
    return () => {
        clearInterval(interval);
        supabase.removeChannel(logSubscription);
    };
  }, [fetchTraders, fetchAllSessions, fetchGlobalLogs, fetchTierMinimums]);



  const handleStatusChange = async (id: string, newStatus: string, action: string, traderName: string) => {
    const { error } = await supabase.from('copy_traders').update({ status: newStatus }).eq('id', id);
    if (!error) {
        addAuditLog({
          action: `Trader "${traderName}" status changed to ${newStatus}`,
          user: "Admin",
          type: "Trading"
        });
        toast.success(`Trader ${action} successfully.`);
        fetchTraders();
    }
  };

  const getTierMinAmount = (tierName: string) => {
    return tierMinimums[tierName] || 0;
  };

  const handleUpsertTrader = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
        name: traderForm.name,
        roi: parseFloat(traderForm.roi) || 0,
        risk_score: parseInt(traderForm.riskScore) || 1,
        followers: parseInt(traderForm.followers) || 0,
        max_drawdown: parseFloat(traderForm.drawdown) || 0,
        win_rate: parseFloat(traderForm.winRate) || 0,
        total_trades: parseInt(traderForm.totalTrades) || 0,
        status: traderForm.status,
        categories: traderForm.categories,
        min_amount: getTierMinAmount(traderForm.min_plan),
        min_plan: traderForm.min_plan,
        is_trending: traderForm.is_trending,
        dedicated_features: traderForm.dedicated_features ? traderForm.dedicated_features.split(',').map(s=>s.trim()) : [],
        avatar_url: traderForm.avatar_url
    };

    let error;
    if (traderForm.id) {
        const { error: err } = await supabase.from('copy_traders').update(payload).eq('id', traderForm.id);
        error = err;
    } else {
        const { error: err } = await supabase.from('copy_traders').insert(payload);
        error = err;
    }

    if (!error) {
        addAuditLog({
          action: `${traderForm.id ? 'Updated' : 'Created'} trader profile: "${traderForm.name}"`,
          user: "Admin",
          type: "Trading"
        });
        setShowAddTrader(false);
        toast.success(`Trader profile ${traderForm.id ? 'updated' : 'added'} successfully.`);
        setTraderForm({
            id: "",
            name: "",
            roi: "",
            riskScore: "1",
            followers: "0",
            drawdown: "0",
            winRate: "0",
            totalTrades: "0",
            status: "Active",
            categories: [],
            min_amount: "500",
            min_plan: "Starter",
            is_trending: false,
            dedicated_features: "",
            avatar_url: ""
        });
        fetchTraders();
    } else {
        toast.error(error.message);
    }
  };

  const handleDeleteTrader = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete ${name}? This action is irreversible.`)) return;
    const { error } = await supabase.from('copy_traders').delete().eq('id', id);
    if (!error) {
        toast.success("Trader deleted from registry");
        fetchTraders();
    }
  };

  const openEdit = (trader: any) => {
    setTraderForm({
        id: trader.id,
        name: trader.name,
        roi: trader.roi.toString(),
        riskScore: trader.risk_score.toString(),
        followers: trader.followers.toString(),
        drawdown: (trader.max_drawdown || trader.drawdown || 0).toString(),
        winRate: (trader.win_rate || 0).toString(),
        totalTrades: (trader.total_trades || 0).toString(),
        status: trader.status || 'Active',
        categories: trader.categories || [],
        min_amount: (trader.min_amount || 0).toString(),
        min_plan: trader.min_plan || 'Starter',
        is_trending: !!trader.is_trending,
        dedicated_features: (trader.dedicated_features || []).join(', '),
        avatar_url: trader.avatar_url || ""
    });
    setShowAddTrader(true);
  };

  const triggerSystemUpdate = async () => {
    try {
        setLoading(true);
        const { error } = await supabase.rpc('trigger_global_copy_trading_pulse');
        if (error) throw error;
        toast.success("System trade update triggered successfully!");
        fetchGlobalLogs();
        fetchAllSessions();
    } catch (err: any) {
        toast.error("System Update failed: " + err.message);
    } finally {
        setLoading(false);
    }
  };

  const filtered = traders.filter(t => {
    const matchesSearch = t.name.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = filter === 'all' || t.status?.toLowerCase() === filter;
    const matchesTier = tierFilter === 'All' || t.min_plan === tierFilter;
    return matchesSearch && matchesStatus && matchesTier;
  });

  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-border">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Copy Trading Management</h1>
            <p className="text-muted-foreground mt-2 text-sm">Review, approve, and manage professional traders on the platform.</p>
          </div>
          <div className="flex gap-3">
             <Button 
                variant="outline" 
                onClick={triggerSystemUpdate}
                className="h-11 border-primary/20 bg-primary/5 text-primary text-sm font-bold px-6 shadow-sm hover:bg-primary/10"
                disabled={loading}
             >
                <Zap className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} /> Update All Trades
             </Button>

            <Dialog open={showAudit} onOpenChange={setShowAudit}>
              <DialogTrigger asChild>
                <Button variant="outline" className="h-11 border-border bg-card text-sm font-medium px-6 shadow-sm hover:bg-secondary">
                  <ShieldCheck className="w-4 h-4 mr-2" /> Audit Log
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl bg-card border-border sm:rounded-2xl">
                <DialogHeader>
                  <DialogTitle className="text-xl font-bold flex items-center gap-2">
                    <Clock className="w-5 h-5 text-primary" /> Trading Audit Log
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4 mt-4 max-h-[400px] overflow-y-auto pr-2">
                   {auditLogs.filter(log => log.type === 'Trading').map(log => (
                     <div key={log.id} className="p-4 rounded-xl bg-secondary/50 border border-border flex justify-between items-start">
                        <div className="space-y-1">
                           <p className="text-sm font-medium text-foreground">{log.action}</p>
                           <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Executed by {log.user}</p>
                        </div>
                        <span className="text-[11px] text-muted-foreground whitespace-nowrap">{new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                     </div>
                   ))}
                 </div>
              </DialogContent>
            </Dialog>

            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" className="h-11 border-border bg-card text-zinc-950 text-sm font-medium px-6 shadow-sm hover:bg-secondary">
                  <ShieldCheck className="w-4 h-4 mr-2" /> Global Tier Rules
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-xl bg-card border-border sm:rounded-2xl">
                 <DialogHeader>
                    <DialogTitle className="text-xl font-bold flex items-center gap-2">
                       <ShieldCheck className="w-5 h-5 text-primary" /> Tier Requirements
                    </DialogTitle>
                 </DialogHeader>
                 <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 mt-2 mb-2">
                    <p className="text-[10px] font-bold text-primary uppercase tracking-widest leading-relaxed">
                       Update the minimum required balance across all traders inside a specific tier instantly.
                    </p>
                 </div>
                 <div className="space-y-3 mt-4">
                    {['Starter', 'Silver', 'Gold', 'Elite'].map(tier => (
                       <div key={tier} className="flex items-end justify-between p-4 rounded-xl border border-border bg-secondary/30 gap-4">
                          <div className="flex-1 space-y-1.5">
                             <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{tier} Minimum Balance ($)</Label>
                             <div className="text-[10px] text-muted-foreground font-medium mb-1">Current: ${(tierMinimums[tier] || 0).toLocaleString()}</div>
                             <div className="relative">
                               <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                                 <span className="text-muted-foreground font-bold text-sm">$</span>
                               </div>
                               <Input 
                                  type="number" 
                                  id={`globalTier_${tier}`}
                                  placeholder={`${(tierMinimums[tier] || 0).toLocaleString()}`}
                                  className="h-10 bg-white border-border text-zinc-950 font-bold pl-8" 
                               />
                             </div>
                          </div>
                          <Button 
                             onClick={async () => {
                                const val = (document.getElementById(`globalTier_${tier}`) as HTMLInputElement).value;
                                if (!val || parseFloat(val) < 0) {
                                   toast.error(`Enter a valid balance for ${tier} tier`);
                                   return;
                                }
                                const amount = parseFloat(val);
                                
                                // Step 1: Update the authoritative tier_minimums in platform_settings
                                const newMinimums = { ...tierMinimums, [tier]: amount };
                                const { error: settingsError } = await supabase.from('platform_settings').update({ tier_minimums: newMinimums }).eq('id', 1);
                                if (settingsError) {
                                   toast.error(settingsError.message);
                                   return;
                                }
                                
                                // Step 2: Sync all traders in this tier with the new minimum
                                await supabase.from('copy_traders').update({ min_amount: amount }).eq('min_plan', tier);
                                
                                // Step 3: Update local state
                                setTierMinimums(newMinimums);
                                toast.success(`Updated $${amount.toLocaleString()} as required balance for all ${tier} traders.`);
                                fetchTraders();
                                (document.getElementById(`globalTier_${tier}`) as HTMLInputElement).value = '';
                             }}
                             className="h-10 px-6 bg-zinc-950 hover:bg-zinc-800 text-white font-bold text-xs uppercase tracking-widest shadow-sm"
                          >
                             Apply Update
                          </Button>
                       </div>
                    ))}
                 </div>
              </DialogContent>
            </Dialog>

            <Dialog open={showAddTrader} onOpenChange={setShowAddTrader}>

                <DialogTrigger asChild>
                    <Button variant="hero" className="h-11 px-6 shadow-gold text-sm font-medium text-white">
                        Add Trader <Star className="w-4 h-4 ml-2" />
                    </Button>
                </DialogTrigger>
                <DialogContent className="max-w-xl bg-card border-border sm:rounded-2xl max-h-[90vh] flex flex-col p-0 overflow-hidden">
                    <DialogHeader className="p-6 pb-2 shrink-0">
                        <DialogTitle className="text-xl font-bold">{traderForm.id ? 'Edit Professional Trader' : 'Add Professional Trader'}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleUpsertTrader} className="flex flex-col h-full overflow-hidden">
                        <div className="flex-1 overflow-y-auto p-6 pt-2 space-y-6">
                            <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-2 col-span-2">
                                <Label className="text-xs font-bold uppercase text-muted-foreground">Full Name</Label>
                                <Input 
                                    required 
                                    value={traderForm.name}
                                    onChange={e => setTraderForm({...traderForm, name: e.target.value})}
                                    placeholder="e.g. Michael Burry" 
                                    className="h-12 bg-secondary border-border" 
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs font-bold uppercase text-muted-foreground">Return (YTD %)</Label>
                                <Input 
                                    required
                                    value={traderForm.roi}
                                    onChange={e => setTraderForm({...traderForm, roi: e.target.value})}
                                    placeholder="125.4" 
                                    className="h-12 bg-secondary border-border" 
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs font-bold uppercase text-muted-foreground">Risk Score (1-10)</Label>
                                <Input 
                                    required
                                    type="number"
                                    min="1" max="10"
                                    value={traderForm.riskScore}
                                    onChange={e => setTraderForm({...traderForm, riskScore: e.target.value})}
                                    placeholder="2" 
                                    className="h-12 bg-secondary border-border" 
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs font-bold uppercase text-muted-foreground">Followers</Label>
                                <Input 
                                    value={traderForm.followers}
                                    onChange={e => setTraderForm({...traderForm, followers: e.target.value})}
                                    placeholder="2341" 
                                    className="h-12 bg-secondary border-border" 
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs font-bold uppercase text-muted-foreground">Max Drawdown (%)</Label>
                                <Input 
                                    value={traderForm.drawdown}
                                    onChange={e => setTraderForm({...traderForm, drawdown: e.target.value})}
                                    placeholder="12.5" 
                                    className="h-12 bg-secondary border-border" 
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs font-bold uppercase text-muted-foreground">Win Rate (%)</Label>
                                <Input 
                                    value={traderForm.winRate}
                                    onChange={e => setTraderForm({...traderForm, winRate: e.target.value})}
                                    placeholder="82.4" 
                                    className="h-12 bg-secondary border-border" 
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs font-bold uppercase text-muted-foreground">Total Trades</Label>
                                <Input 
                                    value={traderForm.totalTrades}
                                    onChange={e => setTraderForm({...traderForm, totalTrades: e.target.value})}
                                    placeholder="145" 
                                    className="h-12 bg-secondary border-border" 
                                />
                            </div>
                            <div className="space-y-2 col-span-2">
                                <Label className="text-xs font-bold uppercase text-muted-foreground">Categories</Label>
                                <div className="flex flex-wrap gap-2">
                                    {['Crypto', 'Forex', 'Commodities'].map(cat => (
                                        <button
                                            key={cat}
                                            type="button"
                                            onClick={() => {
                                                const exists = traderForm.categories.includes(cat);
                                                setTraderForm({
                                                    ...traderForm,
                                                    categories: exists 
                                                        ? traderForm.categories.filter(c => c !== cat)
                                                        : [...traderForm.categories, cat]
                                                });
                                            }}
                                            className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                                                traderForm.categories.includes(cat)
                                                ? "bg-primary/20 border-primary text-primary"
                                                : "bg-secondary border-border text-muted-foreground"
                                            }`}
                                        >
                                            {cat}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs font-bold uppercase text-muted-foreground">Min Wallet Balance</Label>
                                <div className="h-12 bg-secondary/50 border border-border rounded-md px-3 flex items-center text-sm font-bold text-muted-foreground">
                                    {formatCurrency(getTierMinAmount(traderForm.min_plan))} <span className="text-[10px] uppercase ml-2 text-primary/70 tracking-widest bg-primary/10 px-2 py-0.5 rounded ml-auto">Auto-Synced</span>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs font-bold uppercase text-muted-foreground">Trader Ranking Level</Label>
                                <select
                                    value={traderForm.min_plan}
                                    onChange={e => setTraderForm({...traderForm, min_plan: e.target.value})}
                                    className="w-full h-12 bg-secondary border border-border rounded-md px-3 text-sm font-medium outline-none focus:border-primary/50 transition-all cursor-pointer text-zinc-950"
                                >
                                    <option value="Starter">Starter</option>
                                    <option value="Silver">Silver</option>
                                    <option value="Gold">Gold</option>
                                    <option value="Elite">Elite Professional</option>
                                </select>
                            </div>
                            <div className="space-y-2 col-span-1 md:col-span-2">
                                <Label className="text-xs font-bold uppercase text-muted-foreground">Dedicated Features (Comma Separated)</Label>
                                <Input 
                                    type="text"
                                    value={traderForm.dedicated_features}
                                    onChange={e => setTraderForm({...traderForm, dedicated_features: e.target.value})}
                                    placeholder="e.g. 1-on-1 Mentorship, Private Signals, Risk Updates" 
                                    className="h-12 bg-secondary border-border" 
                                />
                            </div>
                            <div className="space-y-2 col-span-1 md:col-span-2">
                                <Label className="text-xs font-bold uppercase text-muted-foreground">Profile Picture</Label>
                                <div className="flex items-start gap-4">
                                    {/* Preview */}
                                    <div className="w-20 h-20 rounded-2xl bg-secondary border-2 border-dashed border-border overflow-hidden flex items-center justify-center shrink-0 relative group">
                                        {traderForm.avatar_url ? (
                                            <>
                                                <img src={traderForm.avatar_url} alt="Preview" className="w-full h-full object-cover" />
                                                <button
                                                    type="button"
                                                    onClick={() => setTraderForm({...traderForm, avatar_url: ""})}
                                                    className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                                                >
                                                    <X className="w-5 h-5 text-white" />
                                                </button>
                                            </>
                                        ) : (
                                            <Camera className="w-6 h-6 text-muted-foreground/40" />
                                        )}
                                    </div>
                                    <div className="flex-1 space-y-3">
                                        {/* File Upload */}
                                        <label className="flex items-center gap-3 px-4 py-3 rounded-xl bg-secondary border border-border hover:border-primary/30 cursor-pointer transition-all group">
                                            <input
                                                type="file"
                                                accept="image/*"
                                                className="hidden"
                                                onChange={async (e) => {
                                                    const file = e.target.files?.[0];
                                                    if (!file) return;
                                                    if (file.size > 2 * 1024 * 1024) {
                                                        toast.error("File too large. Max 2MB.");
                                                        return;
                                                    }
                                                    setUploadingAvatar(true);
                                                    try {
                                                        const ext = file.name.split('.').pop();
                                                        const fileName = `trader-${Date.now()}.${ext}`;
                                                        const { data, error } = await supabase.storage
                                                            .from('avatars')
                                                            .upload(`traders/${fileName}`, file, { upsert: true });
                                                        if (error) throw error;
                                                        const { data: urlData } = supabase.storage
                                                            .from('avatars')
                                                            .getPublicUrl(`traders/${fileName}`);
                                                        setTraderForm({...traderForm, avatar_url: urlData.publicUrl});
                                                        toast.success("Avatar uploaded successfully");
                                                    } catch (err: any) {
                                                        toast.error(err.message || "Upload failed");
                                                    } finally {
                                                        setUploadingAvatar(false);
                                                    }
                                                }}
                                            />
                                            {uploadingAvatar ? (
                                                <Loader2 className="w-4 h-4 text-primary animate-spin" />
                                            ) : (
                                                <Upload className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                                            )}
                                            <span className="text-xs font-bold text-muted-foreground group-hover:text-foreground transition-colors uppercase">
                                                {uploadingAvatar ? 'Uploading...' : 'Upload Image'}
                                            </span>
                                        </label>
                                        {/* Or paste URL */}
                                        <Input
                                            type="text"
                                            value={traderForm.avatar_url}
                                            onChange={e => setTraderForm({...traderForm, avatar_url: e.target.value})}
                                            placeholder="Or paste an image URL..."
                                            className="h-10 bg-secondary/50 border-border text-xs"
                                        />
                                        <p className="text-[9px] text-muted-foreground/60 font-medium">Max 2MB • JPG, PNG, WebP supported</p>
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-2 flex items-center gap-3 pt-6">
                                <input 
                                    type="checkbox"
                                    id="is_trending"
                                    checked={traderForm.is_trending}
                                    onChange={e => setTraderForm({...traderForm, is_trending: e.target.checked})}
                                    className="w-5 h-5 accent-primary rounded cursor-pointer"
                                />
                                <Label htmlFor="is_trending" className="text-xs font-bold uppercase text-foreground cursor-pointer">Trending Badge</Label>
                            </div>
                        </div>
                    </div>
                        <div className="p-6 bg-secondary/30 border-t border-border shrink-0">
                            <Button type="submit" variant="hero" className="w-full h-12 rounded-xl text-white font-bold uppercase tracking-widest shadow-gold">
                                {traderForm.id ? 'Save Profile Changes' : 'Register Trader'}
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>
          </div>
        </header>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { label: "Active Traders", value: traders.filter(t => t.status === 'Active').length, icon: Target, color: "text-primary", bg: "bg-primary/10" },
            { label: "Active Sessions", value: activeSessions.filter(s => s.status === 'active').length, icon: Activity, color: "text-amber-600", bg: "bg-amber-50" },
            { label: "Total Invested", value: formatCurrency(activeSessions.reduce((acc, s) => acc + s.current_value, 0)), icon: Zap, color: "text-blue-600", bg: "bg-blue-50" },
            { label: "Avg. ROI", value: "+24.8%", icon: TrendingUp, color: "text-green-600", bg: "bg-green-50" },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-card p-6 rounded-2xl border border-border shadow-sm hover:border-primary/20 transition-all"
            >
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-medium text-muted-foreground">{stat.label}</span>
                <div className={`w-10 h-10 rounded-xl ${stat.bg} flex items-center justify-center`}>
                  <stat.icon className={`w-5 h-5 ${stat.color}`} />
                </div>
              </div>
              <div className="text-3xl font-bold text-foreground">{stat.value}</div>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Live Monitoring Section */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold font-sans text-foreground flex items-center gap-2">
                        <Activity className="w-5 h-5 text-primary" />
                        Investment Tracking
                    </h2>
                    <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase bg-secondary px-3 py-1 rounded-full border border-border">
                        <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                        Internal Records
                    </div>
                </div>
                
                <div className="bg-card rounded-2xl border border-border overflow-hidden shadow-sm max-h-[500px] overflow-y-auto">
                    <table className="w-full text-sm">
                        <thead className="sticky top-0 z-10">
                            <tr className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider border-b border-border bg-secondary/80 backdrop-blur-md">
                                <th className="text-left p-4">Session</th>
                                <th className="text-left p-4">Invested</th>
                                <th className="text-left p-4">Current PnL</th>
                                <th className="text-center p-4">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {activeSessions.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="p-8 text-center text-muted-foreground italic">No active copy sessions found.</td>
                                </tr>
                            ) : (
                                activeSessions.map((session) => (
                                    <tr key={session.id} className="hover:bg-secondary/20 transition-colors">
                                        <td className="p-4">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-[10px] shadow-sm overflow-hidden shrink-0 ${
                                                    session.copy_traders?.ranking_level === 'Elite' ? 'ring-1 ring-primary ring-offset-1 ring-offset-background bg-gradient-gold text-white' : 'bg-secondary text-muted-foreground border border-border'
                                                }`}>
                                                    {session.copy_traders?.avatar_url ? (
                                                        <img src={session.copy_traders.avatar_url} alt="" className="w-full h-full object-cover" />
                                                    ) : (
                                                        session.trader_name?.charAt(0) || 'T'
                                                    )}
                                                </div>
                                                <div>
                                                    <div className="text-[10px] font-mono text-muted-foreground">{session.id.slice(-6).toUpperCase()}</div>
                                                    <div className="font-bold text-foreground text-xs">{session.trader_name}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4 font-bold text-foreground tabular-nums">{formatCurrency(session.allocated_amount)}</td>
                                        <td className={`p-4 font-black tabular-nums text-xs ${session.pnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                            {session.pnl >= 0 ? '+' : ''}{formatCurrency(session.pnl)}
                                        </td>
                                        <td className="p-4 text-center">
                                            <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full border ${
                                                session.status === 'active' ? 'bg-green-100 text-green-700 border-green-200' : 
                                                'bg-secondary text-muted-foreground border-border'
                                            }`}>
                                                {session.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* System Trade Logs */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold font-sans text-foreground flex items-center gap-2">
                        <Zap className="w-5 h-5 text-primary" />
                        System Trade Logs
                    </h2>
                    <span className="text-[10px] font-black text-muted-foreground bg-secondary px-3 py-1 rounded-full uppercase tracking-widest">Live Feed</span>
                </div>
                
                <div className="bg-card rounded-2xl border border-border overflow-hidden shadow-sm max-h-[500px] overflow-y-auto">
                    <div className="p-4 space-y-3">
                        {executionLogs.length === 0 ? (
                            <div className="py-12 text-center text-muted-foreground italic text-xs">Waiting for trades...</div>
                        ) : executionLogs.map((log) => (
                            <div key={log.id} className="p-3 rounded-xl bg-secondary/30 border border-border group hover:border-primary/20 transition-all flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-secondary border border-border overflow-hidden shrink-0">
                                        {log.copy_traders?.avatar_url ? (
                                            <img src={log.copy_traders.avatar_url} alt="" className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-[10px] font-bold text-muted-foreground">
                                                {log.copy_traders?.name?.charAt(0) || log.pair?.charAt(0)}
                                            </div>
                                        )}
                                    </div>
                                    <div className={`p-1.5 rounded-lg ${log.type === 'Buy' ? 'bg-green-500/10 text-green-600' : 'bg-red-500/10 text-red-600'}`}>
                                        <TrendingUp className={`w-3.5 h-3.5 ${log.type === 'Sell' ? 'rotate-180' : ''}`} />
                                    </div>
                                    <div>
                                        <div className="text-[11px] font-black text-foreground">{log.pair} • <span className="text-[10px] text-muted-foreground">{log.type}</span></div>
                                        <div className="text-[9px] text-muted-foreground/60">{new Date(log.created_at).toLocaleTimeString()}</div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-[10px] font-bold text-foreground">{formatCurrency(log.amount)}</div>
                                    <div className={`text-[9px] font-black ${log.pnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                        {log.pnl >= 0 ? '+' : ''}{formatCurrency(log.pnl)}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>

        {/* Search & Filters */}
        <div className="flex flex-col lg:flex-row gap-4 items-center pt-8">
          <div className="relative w-full lg:w-96 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <input 
              placeholder="Search traders by name..." 
              className="w-full h-11 bg-secondary border border-border rounded-xl pl-11 pr-4 text-sm outline-none focus:border-primary/50 transition-all"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex gap-2 p-1 bg-secondary border border-border rounded-xl ml-auto">
            {['All', 'Approved', 'Rejected', 'Revoked'].map((f) => (
              <button 
                key={f} 
                onClick={() => setFilter(f.toLowerCase() as any)}
                className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
                  filter === f.toLowerCase() ? "bg-card text-primary shadow-sm" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
          <div className="shrink-0 relative">
            <select
              value={tierFilter}
              onChange={(e) => setTierFilter(e.target.value as any)}
              className="h-11 px-4 pr-10 rounded-xl bg-secondary border border-border text-[10px] font-black uppercase tracking-widest text-foreground outline-none focus:border-primary/50 transition-all cursor-pointer appearance-none shadow-sm"
              style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='%239ca3af' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center' }}
            >
              <option value="All">All Tiers</option>
              <option value="Starter">Starter</option>
              <option value="Silver">Silver</option>
              <option value="Gold">Gold</option>
              <option value="Elite">Elite</option>
            </select>
          </div>
        </div>

        {/* Traders Table */}
        <div className="bg-card rounded-2xl border border-border overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs font-medium text-muted-foreground border-b border-border bg-secondary/30">
                  <th className="text-left p-5">Trader / Categories</th>
                  <th className="text-left p-5">ROI</th>
                  <th className="text-left p-5">Level & Score</th>
                  <th className="text-left p-5">Win Rate / DD</th>
                  <th className="text-left p-5">Min Req</th>
                  <th className="text-right p-5">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((trader) => (
                  <tr key={trader.id} className="group hover:bg-secondary/20 transition-colors">
                    <td className="p-5">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm shadow-sm overflow-hidden ${
                          trader.ranking_level === 'Elite' ? 'ring-2 ring-primary ring-offset-2 ring-offset-background bg-gradient-gold text-white' : 'bg-secondary text-muted-foreground'
                        }`}>
                          {trader.avatar_url ? (
                            <img src={trader.avatar_url} alt={trader.name} className="w-full h-full object-cover" />
                          ) : (
                            trader.name.substring(0, 1)
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                             <span className="font-semibold text-foreground group-hover:text-primary transition-colors">{trader.name}</span>
                             {trader.is_trending && <Zap className="w-3 h-3 text-amber-500 fill-amber-500" />}
                          </div>
                          <div className="flex flex-wrap gap-1 mt-1">
                             {trader.categories?.map((cat: string) => (
                               <span key={cat} className="text-[8px] bg-secondary px-1.5 py-0.5 rounded border border-border uppercase font-bold text-muted-foreground">{cat}</span>
                             ))}
                             {(!trader.categories || trader.categories.length === 0) && <span className="text-[8px] text-muted-foreground italic">No Category</span>}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="p-5">
                       <span className="font-bold text-green-600 tabular-nums">+{trader.roi}%</span>
                       <div className="text-[10px] text-muted-foreground font-bold">{trader.total_trades} TRADES</div>
                    </td>
                    <td className="p-5">
                        <div className="flex flex-col gap-1">
                            <span className={`text-[10px] font-black w-fit px-2 py-0.5 rounded-full border shadow-sm ${
                                trader.ranking_level === 'Elite' ? 'bg-gradient-gold text-white border-transparent' :
                                trader.ranking_level === 'Gold' ? 'bg-amber-100 text-amber-700 border-amber-200' :
                                trader.ranking_level === 'Silver' ? 'bg-blue-100 text-blue-700 border-blue-200' :
                                trader.ranking_level === 'Starter' ? 'bg-slate-100 text-slate-700 border-slate-200' :
                                'bg-secondary text-muted-foreground border-border'
                            }`}>
                                {trader.ranking_level || 'NEW'}
                            </span>
                            <span className="text-[9px] text-muted-foreground font-medium uppercase">Score: {Math.round(trader.ranking_score || 0)}</span>
                        </div>
                    </td>
                    <td className="p-5">
                        <div className="font-bold text-foreground tabular-nums">{trader.win_rate || 0}% WR</div>
                        <div className="text-[10px] text-red-600 font-bold tabular-nums">{(trader.max_drawdown || trader.drawdown || 0)}% DD</div>
                    </td>
                    <td className="p-5">
                        <span className="text-[10px] font-bold uppercase py-1 px-2 bg-card border border-border rounded-lg text-primary shadow-sm tabular-nums">
                             {formatCurrency(trader.min_amount || 0)}
                        </span>
                    </td>
                    <td className="p-5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => openEdit(trader)}
                            className="h-9 px-3 rounded-lg border-border bg-card text-xs font-semibold hover:bg-secondary"
                        >
                            Edit
                        </Button>
                        <Button 
                            variant="outline" 
                            size="icon" 
                            onClick={() => handleDeleteTrader(trader.id, trader.name)}
                            className="h-9 w-9 border-red-100 text-red-600 hover:bg-red-600 hover:text-white rounded-lg"
                        >
                            <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <div className="p-5 bg-secondary/30 border-t border-border flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Shield className="w-4 h-4" /> All changes are logged and auditable.
            </div>
            <div className="flex gap-3">
              <Button variant="link" className="text-xs font-medium text-primary" onClick={() => toast.success("Report export started")}>Export Report</Button>
              <div className="w-px h-5 bg-border" />
              <Button variant="link" className="text-xs font-medium text-muted-foreground hover:text-foreground" onClick={() => toast.success("Bulk actions dialogue opened")}>Bulk Actions</Button>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminCopyTrading;
