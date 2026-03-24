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
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-border">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Trading Control</h1>
            <p className="text-muted-foreground text-sm mt-2">Manage market pairs, spreads, fees, and trading availability.</p>
          </div>
          <div className="flex items-center gap-3">
            <Button 
              onClick={handleGlobalKillSwitch}
              className={`h-12 px-6 rounded-xl flex items-center gap-2 text-sm font-semibold transition-all ${
                  globalActive 
                  ? "bg-red-50 text-red-600 border border-red-200 hover:bg-red-600 hover:text-white" 
                  : "bg-green-50 text-green-600 border border-green-200 hover:bg-green-600 hover:text-white"
              }`}
            >
              <Power className="w-4 h-4" />
              {globalActive ? "Pause All Trading" : "Resume Trading"}
            </Button>
            <Button variant="hero" className="h-12 px-6 rounded-xl text-sm font-semibold text-white shadow-gold" onClick={() => setAddPairModalOpen(true)}>
              <Plus className="w-4 h-4 mr-2" /> Add Market Pair
            </Button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-card p-6 rounded-2xl border border-border shadow-sm text-center">
            <Globe className="w-6 h-6 text-blue-500 mx-auto mb-3 opacity-60" />
            <div className="text-xs font-medium text-muted-foreground mb-2">Active Markets</div>
            <div className="text-2xl font-bold text-foreground">{pairs.filter(p => p.active).length} of {pairs.length}</div>
          </div>
          <div className="bg-card p-6 rounded-2xl border border-border shadow-sm text-center">
            <RefreshCw className="w-6 h-6 text-primary mx-auto mb-3 opacity-60" />
            <div className="text-xs font-medium text-muted-foreground mb-2">Platform Uptime</div>
            <div className="text-2xl font-bold text-foreground">99.998%</div>
          </div>
          <div className="bg-card p-6 rounded-2xl border border-border shadow-sm text-center">
            <Activity className="w-6 h-6 text-green-500 mx-auto mb-3 opacity-60" />
            <div className="text-xs font-medium text-muted-foreground mb-2">Requests / Second</div>
            <div className="text-2xl font-bold text-foreground">1,240</div>
          </div>
        </div>

        {/* Markets Table */}
        <div className="bg-card rounded-2xl border border-border overflow-hidden shadow-sm">
          <div className="p-6 border-b border-border flex items-center justify-between">
            <h2 className="text-lg font-bold text-foreground">Market Pairs</h2>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-xs font-medium text-green-600">Live</span>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-xs font-medium text-muted-foreground border-b border-border bg-secondary/30">
                  <th className="text-left p-5">Trading Pair</th>
                  <th className="text-left p-5">Spread</th>
                  <th className="text-left p-5">Fee</th>
                  <th className="text-left p-5">Latency</th>
                  <th className="text-left p-5">Active</th>
                  <th className="text-right p-5">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {pairs.map((pair) => (
                  <tr key={pair.id} className={`group hover:bg-secondary/20 transition-colors ${!pair.active ? 'opacity-50' : ''}`}>
                    <td className="p-5">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl bg-secondary border border-border flex items-center justify-center font-bold text-xs ${pair.active ? "text-primary" : "text-muted-foreground"}`}>
                          {pair.name.split('/')[0].substring(0, 3)}
                        </div>
                        <div>
                          <div className="font-semibold text-sm text-foreground">{pair.name}</div>
                          <div className="text-xs text-muted-foreground mt-0.5">Load: {pair.load_status}</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-5">
                      <span className="font-semibold text-sm text-foreground">{pair.spread}</span>
                    </td>
                    <td className="p-5">
                      <span className="font-semibold text-sm text-foreground">{pair.fee}</span>
                    </td>
                    <td className="p-5">
                      <div className="flex items-center gap-2">
                        <Zap className={`w-3.5 h-3.5 ${pair.active ? "text-primary" : "text-muted-foreground/30"}`} />
                        <span className="text-sm font-medium text-muted-foreground">{pair.latency}</span>
                      </div>
                    </td>
                    <td className="p-5">
                      <Switch 
                        checked={pair.active} 
                        onCheckedChange={() => togglePair(pair.id, pair.active, pair.name)} 
                        className="data-[state=checked]:bg-green-500"
                      />
                    </td>
                    <td className="p-5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="outline" size="icon" className="h-9 w-9 rounded-lg border-border bg-card hover:bg-secondary" onClick={() => openEdit(pair)}>
                          <Settings2 className="w-4 h-4 text-muted-foreground" />
                        </Button>
                        <Button variant="outline" size="icon" className="h-9 w-9 rounded-lg border-border bg-card hover:bg-red-50 hover:text-red-600 hover:border-red-200" onClick={() => deletePair(pair.id, pair.name)}>
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

        {/* Advanced Market Controls */}
        <div className="grid lg:grid-cols-2 gap-8 pt-4">
            <div className="bg-card p-8 rounded-2xl border border-border shadow-sm space-y-6">
                <div className="flex items-center gap-4 mb-2">
                    <div className="w-11 h-11 rounded-xl bg-red-50 flex items-center justify-center text-red-600 border border-red-200">
                        <AlertTriangle className="w-5 h-5" />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-foreground">Risk Management</h2>
                        <p className="text-xs text-muted-foreground mt-0.5">Safety rules to limit losses automatically.</p>
                    </div>
                </div>
                <div className="space-y-4">
                    {[
                        { label: "Flash Crash Protection", enabled: true, desc: "Pause trading if price drops > 5% in 1min." },
                        { label: "Whale Alert Notifications", enabled: true, desc: `Alert admins on orders > ${formatCurrency(1000000)}.` },
                        { label: "Global Stop-Loss", enabled: false, desc: "Close all trades if total platform value drops more than 20%." },
                    ].map((risk) => (
                        <div key={risk.label} className="p-4 rounded-xl bg-secondary/30 border border-border flex items-center justify-between group hover:bg-secondary/50 transition-all">
                            <div className="flex flex-col gap-1">
                                <span className="text-sm font-bold text-foreground font-sans italic lowercase tracking-tight">{risk.label}</span>
                                <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest">{risk.desc}</span>
                            </div>
                            <Switch defaultChecked={risk.enabled} onCheckedChange={(checked) => toast.success(`${risk.label} ${checked ? 'enabled' : 'disabled'}`)} />
                        </div>
                    ))}
                </div>
            </div>

            <div className="bg-card p-8 rounded-2xl border border-border shadow-sm space-y-6">
                <div className="flex items-center gap-4 mb-2">
                    <div className="w-11 h-11 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 border border-blue-200">
                        <TrendingUp className="w-5 h-5" />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-foreground">Sentiment Manipulation</h2>
                        <p className="text-xs text-muted-foreground mt-0.5">Control displayed market sentiment indicators.</p>
                    </div>
                </div>
                <div className="space-y-6">
                    <div className="space-y-3">
                        <div className="flex justify-between text-xs font-bold text-muted-foreground uppercase tracking-wider">
                            <span>Synthetic Bullish Bias</span>
                            <span className={sentimentBias > 0 ? "text-green-600" : "text-muted-foreground"}>+{sentimentBias}%</span>
                        </div>
                        <div className="h-2 bg-secondary rounded-full overflow-hidden flex items-center">
                            <div className="h-full bg-green-500 shadow-glow transition-all duration-500" style={{ width: `${Math.min(100, 50 + sentimentBias)}%` }} />
                        </div>
                        <p className="text-[10px] text-muted-foreground italic leading-relaxed">Artificially inflate the 'Buy' sentiment percentage across all pairs to encourage market entry.</p>
                    </div>
                    <div className="flex gap-4">
                        <Button variant="outline" className="flex-1 h-10 text-xs font-bold border-border hover:bg-secondary uppercase tracking-widest" onClick={() => applySentimentBias(0)}>
                            Neutralize
                        </Button>
                        <Button className="flex-1 h-10 text-xs font-bold bg-primary text-white hover:bg-primary/90 uppercase tracking-widest shadow-gold" onClick={() => applySentimentBias(12)}>
                            Apply Bias (+12%)
                        </Button>
                        <Button className="flex-1 h-10 text-xs font-bold bg-primary text-white hover:bg-primary/90 uppercase tracking-widest shadow-gold" onClick={() => applySentimentBias(25)}>
                            Max Bias (+25%)
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
