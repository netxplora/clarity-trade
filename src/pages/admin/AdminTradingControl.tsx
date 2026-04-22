import { useState, useEffect } from "react";
import AdminLayout from "@/components/layouts/AdminLayout";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Plus, Trash2, Zap, Settings2, BarChart3, AlertTriangle, Activity, Globe, RefreshCw, Power, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import { useStore } from "@/store/useStore";
import { supabase } from "@/lib/supabase";

const AdminTradingControl = () => {
  const { formatCurrency } = useStore();
  const [pairs, setPairs] = useState<any[]>([]);
  const [globalActive, setGlobalActive] = useState(true);
  const [sentimentBias, setSentimentBias] = useState(0);

  const [addPairModalOpen, setAddPairModalOpen] = useState(false);
  const [newPairData, setNewPairData] = useState({ name: '', spread: '0.1%', fee: '0.1%', latency: '5ms', load_status: 'Low' });

  const [editPairModalOpen, setEditPairModalOpen] = useState(false);
  const [editingPair, setEditingPair] = useState<any>(null);

  useEffect(() => {
    fetchData();

    const channel = supabase
      .channel("admin-trading-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "market_pairs" },
        () => fetchData()
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "platform_settings" },
        () => fetchData()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchData = async () => {
    try {
      const { data: mkts } = await supabase.from('market_pairs').select('*').order('name');
      if (mkts) setPairs(mkts);

      const { data: sets } = await supabase.from('platform_settings').select('*').limit(1).single();
      if (sets) {
          setSentimentBias(sets.sentiment_bias || 0);
          setGlobalActive(sets.global_trading_enabled ?? true);
      }
    } catch (err: any) {
      console.error(err);
    }
  };

  const togglePair = async (id: string, currentStatus: boolean, name: string) => {
    const { error } = await supabase.from('market_pairs').update({ active: !currentStatus }).eq('id', id);
    if (!error) {
       toast.info(`${name} ${!currentStatus ? 'enabled' : 'disabled'}`, {
           description: `Market pair has been ${!currentStatus ? 'activated' : 'paused'}.`
       });
       fetchData();
    } else {
       toast.error(error.message);
    }
  };

  const deletePair = async (id: string, name: string) => {
    const { error } = await supabase.from('market_pairs').delete().eq('id', id);
    if (!error) {
       toast.success(`${name} deleted`);
       fetchData();
    } else {
       toast.error(error.message);
    }
  };

  const applySentimentBias = async (bias: number) => {
    const { error } = await supabase.from('platform_settings').update({ sentiment_bias: bias }).eq('id', 1);
    if (!error) {
       toast.success(bias === 0 ? "Market sentiment neutralized" : `Bullish bias of +${bias}% applied`);
       fetchData();
    } else {
       toast.error(error.message);
    }
  };

  const handleAddPair = async () => {
    if (!newPairData.name) return;
    const { error } = await supabase.from('market_pairs').insert([{ ...newPairData, active: true }]);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success(`${newPairData.name} added to markets`);
      setAddPairModalOpen(false);
      setNewPairData({ name: '', spread: '0.1%', fee: '0.1%', latency: '5ms', load_status: 'Low' });
      fetchData();
    }
  };

  const openEdit = (pair: any) => {
    setEditingPair({ ...pair });
    setEditPairModalOpen(true);
  };

  const handleEditPair = async () => {
    if (!editingPair) return;
    const { error } = await supabase.from('market_pairs').update({ 
       spread: editingPair.spread, 
       fee: editingPair.fee, 
       load_status: editingPair.load_status 
    }).eq('id', editingPair.id);
    
    if (error) {
       toast.error(error.message);
    } else {
       toast.success(`${editingPair.name} settings updated`);
       fetchData();
       setEditPairModalOpen(false);
    }
  };

  const handleGlobalKillSwitch = async () => {
      const newStatus = !globalActive;
      const { error } = await supabase.from('platform_settings').update({ global_trading_enabled: newStatus }).eq('id', 1);
      if (!error) {
          setGlobalActive(newStatus);
          toast[newStatus ? "success" : "error"](newStatus ? "Trading resumed" : "All trading paused", {
              description: newStatus ? "All market pairs are now active again." : "All market pairs have been temporarily disabled.",
              duration: 5000
          });
      } else {
          toast.error(error.message);
      }
  };

  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* Institutional Header */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-border">
          <div className="space-y-1">
            <h1 className="text-3xl font-black text-foreground tracking-tight uppercase">Market Operations</h1>
            <p className="text-muted-foreground text-sm font-medium">Configure global trading parameters, asset pairs, and platform-wide execution policies.</p>
          </div>
          <div className="flex items-center gap-3">
            <Button 
              onClick={handleGlobalKillSwitch}
              className={`h-11 px-6 rounded-xl flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] font-black transition-all shadow-sm ${
                  globalActive 
                  ? "bg-red-500/10 text-red-500 border border-red-200/50 hover:bg-red-500 hover:text-white" 
                  : "bg-green-500/10 text-green-500 border border-green-200/50 hover:bg-green-500 hover:text-white"
              }`}
            >
              <Power className="w-4 h-4" />
              {globalActive ? "Emergency Halt" : "Resume Operations"}
            </Button>
            <Button variant="hero" className="h-11 px-6 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] text-white shadow-gold" onClick={() => setAddPairModalOpen(true)}>
              <Plus className="w-4 h-4 mr-2" /> Register Asset
            </Button>
          </div>
        </header>


        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { label: "Active Markets", value: `${pairs.filter(p => p.active).length} / ${pairs.length}`, icon: Globe, color: "text-blue-600", bg: "bg-blue-50" },
            { label: "System Uptime", value: "99.998%", icon: RefreshCw, color: "text-primary", bg: "bg-primary/5" },
            { label: "Execution Speed", value: "1,240 req/s", icon: Activity, color: "text-green-600", bg: "bg-green-50" },
          ].map((stat) => (
            <div key={stat.label} className="bg-card p-6 rounded-[2rem] border border-border shadow-sm flex items-center gap-5 group hover:border-primary/20 transition-all">
              <div className={`w-14 h-14 rounded-2xl ${stat.bg} flex items-center justify-center shrink-0`}>
                <stat.icon className={`w-6 h-6 ${stat.color}`} />
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{stat.label}</p>
                <p className="text-2xl font-black text-foreground tracking-tight">{stat.value}</p>
              </div>
            </div>
          ))}
        </div>


        <div className="bg-card rounded-[2rem] border border-border overflow-hidden shadow-sm">
          <div className="p-6 border-b border-border flex items-center justify-between bg-secondary/10">
            <h2 className="text-xl font-black font-sans text-foreground uppercase tracking-tight">Registered Assets</h2>
            <div className="flex items-center gap-2 bg-secondary px-3 py-1 rounded-full border border-border">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
              <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Network Live</span>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] border-b border-border bg-secondary/40">
                  <th className="text-left p-6">Asset Pair</th>
                  <th className="text-left p-6">Base Spread</th>
                  <th className="text-left p-6">Fixed Fee</th>
                  <th className="text-left p-6">Execution</th>
                  <th className="text-left p-6">Activity</th>
                  <th className="text-right p-6">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-border">
                {pairs.map((pair) => (
                  <tr key={pair.id} className={`group hover:bg-secondary/20 transition-colors ${!pair.active ? 'opacity-40 grayscale' : ''}`}>
                    <td className="p-6">
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-2xl bg-secondary border border-border flex items-center justify-center font-black text-xs uppercase tracking-tighter shadow-sm transition-all group-hover:border-primary/30 ${pair.active ? "text-primary" : "text-muted-foreground"}`}>
                          {pair.name.split('/')[0].substring(0, 3)}
                        </div>
                        <div>
                          <div className="font-black text-sm text-foreground tracking-tight">{pair.name}</div>
                          <div className="text-[9px] text-muted-foreground uppercase font-black tracking-widest mt-1">Load Status: {pair.load_status}</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-6">
                      <span className="font-bold text-xs text-foreground tabular-nums bg-secondary/50 px-2 py-1 rounded-lg border border-border">{pair.spread}</span>
                    </td>
                    <td className="p-6">
                      <span className="font-bold text-xs text-foreground tabular-nums bg-secondary/50 px-2 py-1 rounded-lg border border-border">{pair.fee}</span>
                    </td>
                    <td className="p-6">
                      <div className="flex items-center gap-2">
                        <Zap className={`w-3.5 h-3.5 ${pair.active ? "text-primary shadow-gold" : "text-muted-foreground/30"}`} />
                        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-60">{pair.latency}</span>
                      </div>
                    </td>
                    <td className="p-6">
                      <Switch 
                        checked={pair.active} 
                        onCheckedChange={() => togglePair(pair.id, pair.active, pair.name)}
                        className="data-[state=checked]:bg-primary"
                      />
                    </td>
                    <td className="p-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="outline" size="icon" className="h-9 w-9 rounded-xl border-border bg-card hover:bg-secondary shadow-sm" onClick={() => openEdit(pair)}>
                          <Settings2 className="w-4 h-4" />
                        </Button>
                        <Button variant="outline" size="icon" className="h-9 w-9 rounded-xl border-red-100 text-red-500 hover:bg-red-50 shadow-sm" onClick={() => deletePair(pair.id, pair.name)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          
          <div className="p-5 border-t border-border flex flex-wrap items-center justify-center gap-6 text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              <span>Total Volume (MTD): {formatCurrency(421800000)}</span>
            </div>
            <div className="w-px h-4 bg-border" />
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              <span>3 pairs under high load</span>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
            <div className="bg-card p-8 rounded-[2rem] border border-border shadow-sm space-y-6 flex flex-col group hover:border-primary/10 transition-all">
                <div className="flex items-center gap-4 mb-2">
                    <div className="w-12 h-12 rounded-2xl bg-red-50 flex items-center justify-center text-red-600 border border-red-100 shadow-sm">
                        <AlertTriangle className="w-5 h-5" />
                    </div>
                    <div>
                        <h2 className="text-xl font-black text-foreground uppercase tracking-tight">Risk Protocols</h2>
                        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest opacity-60 mt-1">Safety parameters and execution filters.</p>
                    </div>
                </div>
                <div className="space-y-4">
                    {[
                        { label: "Trading Pause Trigger", enabled: true, desc: "Pause trading if volatility exceeds 5% per minute." },
                        { label: "Large Order Flag", enabled: true, desc: `Flag orders exceeding institutional limits.` },
                        { label: "Systemic Halt", enabled: false, desc: "Automatically halt operations on total value drain." },
                    ].map((risk) => (
                        <div key={risk.label} className="p-5 rounded-2xl bg-secondary/30 border border-border flex items-center justify-between group/item hover:bg-secondary/50 transition-all">
                            <div className="flex flex-col gap-1">
                                <span className="text-[11px] font-black text-foreground uppercase tracking-widest">{risk.label}</span>
                                <span className="text-[10px] text-muted-foreground font-medium opacity-60 leading-relaxed max-w-[220px]">{risk.desc}</span>
                            </div>
                            <Switch defaultChecked={risk.enabled} onCheckedChange={(checked) => toast.success(`${risk.label} policies ${checked ? 'deployed' : 'revoked'}`)} />
                        </div>
                    ))}
                </div>
            </div>

            <div className="bg-card p-8 rounded-[2rem] border border-border shadow-sm space-y-6 flex flex-col group hover:border-primary/10 transition-all">
                <div className="flex items-center gap-4 mb-2">
                    <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 border border-blue-100 shadow-sm">
                        <TrendingUp className="w-5 h-5" />
                    </div>
                    <div>
                        <h2 className="text-xl font-black text-foreground uppercase tracking-tight">Market View Settings</h2>
                        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest opacity-60 mt-1">Configure market visual adjustments.</p>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="space-y-4">
                        <div className="flex justify-between text-[11px] font-black text-muted-foreground uppercase tracking-[0.2em]">
                            <span>Positive Bias Setting</span>
                            <span className={sentimentBias > 0 ? "text-green-600" : "text-muted-foreground"}>+{sentimentBias}%</span>
                        </div>
                        <div className="h-2 bg-secondary rounded-full overflow-hidden flex items-center border border-border shadow-inner">
                            <div className="h-full bg-green-500 shadow-gold transition-all duration-700 ease-out" style={{ width: `${Math.min(100, 50 + sentimentBias)}%` }} />
                        </div>
                        <p className="text-[11px] text-muted-foreground leading-relaxed italic opacity-70">Adjust positive visual trends for platform asset lists.</p>
                    </div>
                    <div className="flex flex-wrap gap-2 pt-2">
                        <Button variant="outline" className="flex-1 h-11 text-[9px] font-black border-border hover:bg-secondary uppercase tracking-widest rounded-xl" onClick={() => applySentimentBias(0)}>
                            Neutral
                        </Button>
                        <Button className="flex-1 h-11 text-[9px] font-black bg-primary text-white hover:bg-primary/90 uppercase tracking-widest shadow-gold rounded-xl" onClick={() => applySentimentBias(12)}>
                            Moderate (+12%)
                        </Button>
                        <Button className="flex-2 h-11 text-[9px] font-black bg-zinc-950 text-white hover:bg-zinc-800 uppercase tracking-widest shadow-huge rounded-xl px-6" onClick={() => applySentimentBias(25)}>
                            High (+25%)
                        </Button>
                    </div>
                </div>

            </div>
        </div>
      </div>

      <Dialog open={addPairModalOpen} onOpenChange={setAddPairModalOpen}>
        <DialogContent className="bg-card border-border shadow-huge p-6 rounded-2xl w-full max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Market Pair</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Pair Name (e.g. DOT/USDT)</Label>
              <Input 
                 value={newPairData.name} 
                 onChange={e => setNewPairData({...newPairData, name: e.target.value.toUpperCase()})}
                 placeholder="BTC/USDT" 
                 className="bg-secondary/50 border-border" 
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
               <div className="space-y-2">
                 <Label>Spread</Label>
                 <Input 
                    value={newPairData.spread} 
                    onChange={e => setNewPairData({...newPairData, spread: e.target.value})} 
                    className="bg-secondary/50 border-border" 
                 />
               </div>
               <div className="space-y-2">
                 <Label>Fee</Label>
                 <Input 
                    value={newPairData.fee} 
                    onChange={e => setNewPairData({...newPairData, fee: e.target.value})} 
                    className="bg-secondary/50 border-border" 
                 />
               </div>
            </div>
            <div className="space-y-2">
              <Label>Simulated Load Status</Label>
              <select 
                 value={newPairData.load_status} 
                 onChange={e => setNewPairData({...newPairData, load_status: e.target.value})}
                 className="w-full h-10 px-3 rounded-md bg-secondary/50 border border-border text-sm"
              >
                 <option value="Low">Low</option>
                 <option value="Medium">Medium</option>
                 <option value="High">High</option>
              </select>
            </div>
          </div>
          <DialogFooter className="mt-6 pt-4 border-t border-border">
            <Button variant="outline" onClick={() => setAddPairModalOpen(false)}>Cancel</Button>
            <Button variant="hero" onClick={handleAddPair} className="shadow-gold text-white" disabled={!newPairData.name}>Add Pair</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={editPairModalOpen} onOpenChange={setEditPairModalOpen}>
        <DialogContent className="bg-card border-border shadow-huge p-6 rounded-2xl w-full max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Market Pair</DialogTitle>
          </DialogHeader>
          {editingPair && (
            <>
              <div className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label>Pair Name</Label>
                  <Input value={editingPair.name} disabled className="bg-secondary/50 border-border font-bold text-muted-foreground" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                   <div className="space-y-2">
                     <Label>Spread</Label>
                     <Input 
                        value={editingPair.spread} 
                        onChange={e => setEditingPair({...editingPair, spread: e.target.value})} 
                        className="bg-secondary/50 border-border" 
                     />
                   </div>
                   <div className="space-y-2">
                     <Label>Fee</Label>
                     <Input 
                        value={editingPair.fee} 
                        onChange={e => setEditingPair({...editingPair, fee: e.target.value})} 
                        className="bg-secondary/50 border-border" 
                     />
                   </div>
                </div>
                <div className="space-y-2">
                  <Label>Simulated Load Status</Label>
                  <select 
                     value={editingPair.load_status} 
                     onChange={e => setEditingPair({...editingPair, load_status: e.target.value})}
                     className="w-full h-10 px-3 rounded-md bg-secondary/50 border border-border text-sm"
                  >
                     <option value="None">None</option>
                     <option value="Low">Low</option>
                     <option value="Medium">Medium</option>
                     <option value="High">High</option>
                  </select>
                </div>
              </div>
              <DialogFooter className="mt-6 pt-4 border-t border-border">
                <Button variant="outline" onClick={() => setEditPairModalOpen(false)}>Cancel</Button>
                <Button variant="hero" onClick={handleEditPair} className="shadow-gold text-white">Save Changes</Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminTradingControl;
