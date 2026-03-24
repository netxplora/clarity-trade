import { useState, useEffect, useCallback } from "react";
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
  Search, CheckCircle, Ban, Star, ShieldCheck, Target, Users, Zap, TrendingUp, MoreVertical, Shield, Clock, Plus, Trash2, Filter, Activity
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
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'approved' | 'rejected' | 'revoked'>('all');
  
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
    status: "Active"
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

  const fetchAllSessions = useCallback(async () => {
    try {
        const { data, error } = await supabase.from('active_sessions').select('*');
        if (data) setActiveSessions(data);
    } catch (err) {
        console.error("Failed to fetch all sessions", err);
    }
  }, []);

  useEffect(() => {
    fetchTraders();
    fetchAllSessions();
    const interval = setInterval(() => {
        fetchTraders();
        fetchAllSessions();
    }, 15000);
    return () => clearInterval(interval);
  }, [fetchTraders, fetchAllSessions]);



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

  const handleUpsertTrader = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
        name: traderForm.name,
        roi: parseFloat(traderForm.roi) || 0,
        risk_score: parseInt(traderForm.riskScore) || 1,
        followers: parseInt(traderForm.followers) || 0,
        drawdown: parseFloat(traderForm.drawdown) || 0,
        win_rate: parseFloat(traderForm.winRate) || 0,
        total_trades: parseInt(traderForm.totalTrades) || 0,
        status: traderForm.status
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
            status: "Active"
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
        drawdown: trader.drawdown.toString(),
        winRate: (trader.win_rate || 0).toString(),
        totalTrades: (trader.total_trades || 0).toString(),
        status: trader.status || 'Active'
    });
    setShowAddTrader(true);
  };

  const filtered = traders.filter(t => {
    const matchesSearch = t.name.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === 'all' || t.status?.toLowerCase() === filter;
    return matchesSearch && matchesFilter;
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

            <Dialog open={showAddTrader} onOpenChange={setShowAddTrader}>
                <DialogTrigger asChild>
                    <Button variant="hero" className="h-11 px-6 shadow-gold text-sm font-medium text-white">
                        Add Trader <Star className="w-4 h-4 ml-2" />
                    </Button>
                </DialogTrigger>
                <DialogContent className="max-w-xl bg-card border-border sm:rounded-2xl">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold">{traderForm.id ? 'Edit Professional Trader' : 'Add Professional Trader'}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleUpsertTrader} className="space-y-6 mt-4">
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
                        </div>
                        <Button type="submit" variant="hero" className="w-full h-12 rounded-xl text-white font-bold uppercase tracking-widest shadow-gold">
                            {traderForm.id ? 'Save Profile Changes' : 'Register Trader'}
                        </Button>
                    </form>
                </DialogContent>
            </Dialog>
          </div>
        </header>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { label: "Elite Portfolio", value: traders.filter(t => t.status === 'Active').length, icon: Target, color: "text-primary", bg: "bg-primary/10" },
            { label: "Active Sessions", value: activeSessions.filter(s => s.status === 'active').length, icon: Activity, color: "text-amber-600", bg: "bg-amber-50" },
            { label: "Total Copied Assets", value: formatCurrency(activeSessions.reduce((acc, s) => acc + s.current_value, 0)), icon: Zap, color: "text-blue-600", bg: "bg-blue-50" },
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

        {/* Live Monitoring Section */}
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold font-sans text-foreground flex items-center gap-2">
                    <Activity className="w-5 h-5 text-primary" />
                    Platform-wide Active Sessions
                </h2>
                <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase bg-secondary px-3 py-1 rounded-full border border-border">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                    Live Internal Ledger
                </div>
            </div>
            
            <div className="bg-card rounded-2xl border border-border overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider border-b border-border bg-secondary/30">
                                <th className="text-left p-4">Session ID</th>
                                <th className="text-left p-4">User ID</th>
                                <th className="text-left p-4">Master Trader</th>
                                <th className="text-left p-4">Principal</th>
                                <th className="text-left p-4">Current Value</th>
                                <th className="text-left p-4">PnL</th>
                                <th className="text-center p-4">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {activeSessions.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="p-8 text-center text-muted-foreground italic">No active copy sessions found.</td>
                                </tr>
                            ) : (
                                activeSessions.map((session) => (
                                    <tr key={session.id} className="hover:bg-secondary/20 transition-colors">
                                        <td className="p-4 font-mono text-[10px] text-muted-foreground">{session.id.slice(-8).toUpperCase()}</td>
                                        <td className="p-4 font-bold text-foreground">{session.user_id}</td>
                                        <td className="p-4 font-bold text-primary">{session.trader_name || 'Unknown'}</td>
                                        <td className="p-4 font-bold text-foreground">{formatCurrency(session.allocated_amount)}</td>
                                        <td className="p-4 font-bold text-foreground">{formatCurrency(session.current_value)}</td>
                                        <td className={`p-4 font-black ${session.pnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                            {session.pnl >= 0 ? '+' : ''}{formatCurrency(session.pnl)}
                                        </td>
                                        <td className="p-4 text-center">
                                            <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full border ${
                                                session.status === 'active' ? 'bg-green-100 text-green-700 border-green-200' : 
                                                session.status === 'stopped' ? 'bg-secondary text-muted-foreground border-border' :
                                                'bg-amber-100 text-amber-700 border-amber-200'
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
        </div>

        {/* Traders Table */}
        <div className="bg-card rounded-2xl border border-border overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs font-medium text-muted-foreground border-b border-border bg-secondary/30">
                  <th className="text-left p-5">Trader</th>
                  <th className="text-left p-5">ROI (YTD)</th>
                  <th className="text-left p-5">Risk</th>
                  <th className="text-left p-5">Win Rate</th>
                  <th className="text-left p-5">Drawdown</th>
                  <th className="text-left p-5">Trades</th>
                  <th className="text-right p-5">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((trader) => (
                  <tr key={trader.id} className="group hover:bg-secondary/20 transition-colors">
                    <td className="p-5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-gold text-white flex items-center justify-center font-bold text-sm shadow-sm">
                          {trader.name.substring(0, 1)}
                        </div>
                        <div>
                          <span className="font-semibold text-foreground group-hover:text-primary transition-colors">{trader.name}</span>
                          <div className="text-[10px] text-muted-foreground mt-0.5 uppercase tracking-wider font-bold">{trader.followers.toLocaleString()} COPIERS</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-5 font-bold text-green-600 tabular-nums">+{trader.roi}%</td>
                    <td className="p-5">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                            trader.risk_score < 3 ? 'bg-green-50 text-green-700 border-green-200' :
                            trader.risk_score < 7 ? 'bg-orange-50 text-orange-700 border-orange-200' :
                            'bg-red-50 text-red-700 border-red-200'
                        }`}>
                            SCORE {trader.risk_score}
                        </span>
                    </td>
                    <td className="p-5 font-bold text-foreground tabular-nums">{trader.win_rate || 0}%</td>
                    <td className="p-5 font-bold text-red-600 tabular-nums">{trader.drawdown || 0}%</td>
                    <td className="p-5 font-bold text-foreground tabular-nums">{trader.total_trades || 0}</td>
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
