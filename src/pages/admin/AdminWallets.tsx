import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import AdminLayout from "@/components/layouts/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import {
  Plus, Search, RefreshCw, Wallet, Trash2, Edit3, CheckCircle2,
  XCircle, MoreVertical, ShieldCheck, ArrowRight, History, Settings2,
  PlusCircle, Filter, Save, X, Info
} from "lucide-react";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";

interface WalletRecord {
  id: string;
  asset?: string;
  coin?: string;
  network: string;
  wallet_address?: string;
  address?: string;
  status: 'Active' | 'Inactive';
  label?: string;
  priority: number;
  created_at: string;
}

const AdminWallets = () => {
  const [wallets, setWallets] = useState<WalletRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentWallet, setCurrentWallet] = useState<Partial<WalletRecord> | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const fetchWallets = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("deposit_wallets")
        .select("*")
        .order("asset", { ascending: true })
        .order("priority", { ascending: false });
      
      if (error) throw error;
      setWallets(data || []);
    } catch (err: any) {
      toast.error("Failed to fetch wallets: " + err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWallets();
  }, [fetchWallets]);

  const handleSave = async () => {
    if (!currentWallet?.asset || !currentWallet?.network || !currentWallet?.wallet_address) {
      toast.error("Please fill in all required fields.");
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        asset: (currentWallet.asset || currentWallet.coin || '').toUpperCase(),
        coin: (currentWallet.asset || currentWallet.coin || '').toUpperCase(),
        network: currentWallet.network,
        wallet_address: (currentWallet.wallet_address || currentWallet.address || '').trim(),
        address: (currentWallet.wallet_address || currentWallet.address || '').trim(),
        status: currentWallet.status || 'Active',
        label: currentWallet.label || '',
        priority: currentWallet.priority || 0,
      };

      if (currentWallet.id) {
        const { error } = await supabase.from("deposit_wallets").update(payload).eq("id", currentWallet.id);
        if (error) throw error;
        toast.success("Wallet updated successfully.");
      } else {
        const { error } = await supabase.from("deposit_wallets").insert([payload]);
        if (error) throw error;
        toast.success("New wallet added successfully.");
      }

      setIsDialogOpen(false);
      setCurrentWallet(null);
      fetchWallets();
    } catch (err: any) {
      toast.error("Save failed: " + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this wallet? This cannot be undone.")) return;
    
    try {
      const { error } = await supabase.from("deposit_wallets").delete().eq("id", id);
      if (error) throw error;
      toast.success("Wallet deleted.");
      fetchWallets();
    } catch (err: any) {
      toast.error("Delete failed: " + err.message);
    }
  };

  const toggleStatus = async (wallet: WalletRecord) => {
    const newStatus = wallet.status === 'Active' ? 'Inactive' : 'Active';
    try {
      const { error } = await supabase.from("deposit_wallets").update({ status: newStatus }).eq("id", wallet.id);
      if (error) throw error;
      toast.success(`Wallet marked as ${newStatus}`);
      fetchWallets();
    } catch (err: any) {
      toast.error("Update failed: " + err.message);
    }
  };

  const filtered = wallets.filter(w => {
    const q = search.toLowerCase();
    return w.asset.toLowerCase().includes(q) || 
           w.network.toLowerCase().includes(q) || 
           w.wallet_address.toLowerCase().includes(q) ||
           (w.label && w.label.toLowerCase().includes(q));
  });

  return (
    <AdminLayout>
      <div className="space-y-8">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-border">
          <div>
            <h1 className="text-3xl font-black text-foreground tracking-tight uppercase">Deposit Wallet Management</h1>
            <p className="text-muted-foreground text-sm font-medium mt-1">Configure and manage corporate wallet addresses for user deposits.</p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={fetchWallets} className="h-11 border-border text-[10px] font-black uppercase tracking-[0.2em] px-6 rounded-xl group">
              <RefreshCw className={`w-4 h-4 mr-2 group-hover:rotate-180 transition-transform duration-500 ${isLoading ? "animate-spin" : ""}`} /> Refresh
            </Button>
            <Button onClick={() => { setCurrentWallet({ status: 'Active', priority: 0 }); setIsDialogOpen(true); }} 
              className="h-11 bg-primary text-white text-[10px] font-black uppercase tracking-[0.2em] px-6 rounded-xl shadow-gold hover:scale-[1.02] transition-transform">
              <Plus className="w-4 h-4 mr-2" /> Add New Wallet
            </Button>
          </div>
        </header>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { label: "Total Wallets", value: wallets.length, color: "text-foreground", icon: <Wallet className="w-5 h-5" /> },
            { label: "Active Channels", value: wallets.filter(w => w.status === 'Active').length, color: "text-green-500", icon: <CheckCircle2 className="w-5 h-5" /> },
            { label: "Inactive", value: wallets.filter(w => w.status === 'Inactive').length, color: "text-red-500", icon: <XCircle className="w-5 h-5" /> },
          ].map(s => (
            <div key={s.label} className="p-6 rounded-2xl bg-card border border-border flex items-center gap-4">
              <div className={`w-12 h-12 rounded-xl bg-secondary flex items-center justify-center ${s.color}`}>
                {s.icon}
              </div>
              <div>
                <div className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">{s.label}</div>
                <div className={`text-2xl font-black ${s.color}`}>{s.value}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-card rounded-3xl border border-border shadow-sm overflow-hidden">
          <div className="p-4 sm:p-6 border-b border-border bg-secondary/10">
            <div className="relative w-full md:w-96">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/30" />
              <Input placeholder="Search wallets..." value={search} onChange={(e: any) => setSearch(e.target.value)}
                className="h-12 pl-12 bg-background border-border rounded-xl text-xs font-bold" />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/50 border-b border-border">
                  <th className="text-left py-4 pl-6">Asset / Label</th>
                  <th className="text-left py-4">Network</th>
                  <th className="text-left py-4">Wallet Address</th>
                  <th className="text-center py-4">Priority</th>
                  <th className="text-center py-4">Status</th>
                  <th className="text-right py-4 pr-6">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30">
                {isLoading && filtered.length === 0 ? (
                  <tr><td colSpan={6} className="py-20 text-center"><RefreshCw className="w-8 h-8 animate-spin mx-auto text-muted-foreground/20" /></td></tr>
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={6} className="py-20 text-center text-muted-foreground font-bold uppercase tracking-widest opacity-30">No wallets found</td></tr>
                ) : filtered.map((w) => (
                  <tr key={w.id} className="group hover:bg-secondary/20 transition-colors">
                    <td className="py-5 pl-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center font-black text-primary uppercase">
                          {(w.asset || w.coin || "??").slice(0, 2)}
                        </div>
                        <div>
                          <div className="text-sm font-black text-foreground">{w.asset || w.coin}</div>
                          <div className="text-[10px] font-bold text-muted-foreground/50 uppercase tracking-widest">{w.label || "No Label"}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-5">
                      <Badge variant="outline" className="text-[9px] font-black uppercase tracking-widest border-border/50">{w.network}</Badge>
                    </td>
                    <td className="py-5">
                      <div className="flex items-center gap-2 group/addr">
                        <span className="text-[11px] font-mono text-muted-foreground truncate max-w-[200px]">{w.wallet_address || w.address}</span>
                        <button onClick={() => { navigator.clipboard.writeText(w.wallet_address || w.address || ''); toast.success("Copied"); }} 
                          className="opacity-0 group-hover/addr:opacity-100 transition-opacity p-1.5 hover:bg-secondary rounded-lg">
                          <Copy className="w-3 h-3" />
                        </button>
                      </div>
                    </td>
                    <td className="py-5 text-center">
                      <span className="text-xs font-black text-muted-foreground">{w.priority}</span>
                    </td>
                    <td className="py-5 text-center">
                      <button onClick={() => toggleStatus(w)}>
                        <Badge className={`text-[8px] font-black uppercase tracking-widest px-2.5 py-1 border transition-all ${
                          w.status === 'Active' ? 'bg-green-500/10 text-green-500 border-green-500/20' : 'bg-red-500/10 text-red-500 border-red-500/20'
                        }`}>{w.status}</Badge>
                      </button>
                    </td>
                    <td className="py-5 pr-6 text-right">
                      <div className="flex justify-end gap-2">
                        <Button size="icon" variant="ghost" onClick={() => { setCurrentWallet(w); setIsDialogOpen(true); }}
                          className="h-8 w-8 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/5">
                          <Edit3 className="w-3.5 h-3.5" />
                        </Button>
                        <Button size="icon" variant="ghost" onClick={() => handleDelete(w.id)}
                          className="h-8 w-8 rounded-lg text-muted-foreground hover:text-red-500 hover:bg-red-500/5">
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[480px] bg-card border-border shadow-huge p-0 overflow-hidden rounded-3xl">
          <DialogHeader className="p-8 pb-4">
            <DialogTitle className="text-xl font-black uppercase tracking-tight text-foreground">
              {currentWallet?.id ? "Edit Wallet" : "Add New Wallet"}
            </DialogTitle>
            <DialogDescription className="text-xs font-medium text-muted-foreground">
              Configure a deposit destination for users. Make sure the address and network are 100% correct.
            </DialogDescription>
          </DialogHeader>

          <div className="p-8 pt-4 space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground pl-1">Asset Symbol</Label>
                <Input placeholder="BTC, ETH, USDT..." value={currentWallet?.asset || ""} 
                  onChange={(e) => setCurrentWallet(prev => ({ ...prev, asset: e.target.value }))}
                  className="h-12 bg-secondary/50 border-border rounded-xl font-black uppercase" />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground pl-1">Network</Label>
                <Input placeholder="Bitcoin, ERC20, TRC20..." value={currentWallet?.network || ""} 
                  onChange={(e) => setCurrentWallet(prev => ({ ...prev, network: e.target.value }))}
                  className="h-12 bg-secondary/50 border-border rounded-xl font-bold" />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground pl-1">Wallet Address</Label>
              <Input placeholder="Enter destination address..." value={currentWallet?.wallet_address || currentWallet?.address || ""} 
                onChange={(e) => setCurrentWallet(prev => ({ ...prev, wallet_address: e.target.value, address: e.target.value }))}
                className="h-12 bg-secondary/50 border-border rounded-xl font-mono text-sm" />
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground pl-1">Admin Label (Optional)</Label>
              <Input placeholder="e.g. Binance Corporate Wallet" value={currentWallet?.label || ""} 
                onChange={(e) => setCurrentWallet(prev => ({ ...prev, label: e.target.value }))}
                className="h-12 bg-secondary/50 border-border rounded-xl text-xs font-medium" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground pl-1">Priority (Sorting)</Label>
                <Input type="number" value={currentWallet?.priority ?? 0} 
                  onChange={(e) => setCurrentWallet(prev => ({ ...prev, priority: parseInt(e.target.value) || 0 }))}
                  className="h-12 bg-secondary/50 border-border rounded-xl font-bold" />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground pl-1">Status</Label>
                <select value={currentWallet?.status || 'Active'} 
                  onChange={(e) => setCurrentWallet(prev => ({ ...prev, status: e.target.value as any }))}
                  className="w-full h-12 bg-secondary/50 border border-border rounded-xl text-xs font-bold px-4 outline-none appearance-none">
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/10 flex gap-3">
              <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <p className="text-[10px] text-amber-700/70 font-medium leading-relaxed">
                Users will only see <span className="font-bold text-amber-700 uppercase">Active</span> wallets. 
                Higher priority wallets for the same asset will appear first.
              </p>
            </div>
          </div>

          <DialogFooter className="p-8 pt-0 gap-3">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)} className="h-12 flex-1 rounded-xl border-border text-xs font-black uppercase tracking-widest">Cancel</Button>
            <Button onClick={handleSave} disabled={isSaving} className="h-12 flex-1 rounded-xl bg-primary text-white text-xs font-black uppercase tracking-widest shadow-gold">
              {isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : "Save Wallet"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminWallets;
