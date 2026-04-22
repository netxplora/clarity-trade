import { useState, useEffect, useCallback } from "react";
import AdminLayout from "@/components/layouts/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Plus, Edit3, Trash2, MoreHorizontal, ShieldCheck, Globe, Zap,
  ArrowUpDown, ExternalLink, Loader2, Power, PowerOff, Star,
  GripVertical, Shield, Link2, Image as ImageIcon, FileText, Search,
  CheckCircle, XCircle, AlertTriangle, CreditCard, Activity
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useStore } from "@/store/useStore";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

interface CryptoProvider {
  id: string;
  provider_name: string;
  provider_url: string;
  provider_priority: number;
  provider_status: string;
  provider_type: string;
  provider_logo: string | null;
  provider_description: string | null;
  created_at: string;
  updated_at: string;
}

const EMPTY_FORM: Omit<CryptoProvider, 'id' | 'created_at' | 'updated_at'> = {
  provider_name: '',
  provider_url: '',
  provider_priority: 100,
  provider_status: 'Active',
  provider_type: 'Backup',
  provider_logo: null,
  provider_description: null,
};

const CryptoProviderManagement = () => {
  const { addAuditLog } = useStore();
  const [providers, setProviders] = useState<CryptoProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<CryptoProvider | null>(null);
  const [editingProvider, setEditingProvider] = useState<CryptoProvider | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [redirectSettings, setRedirectSettings] = useState({
    redirectEnabled: false,
    primaryUrl: '',
    backupUrl: '',
    delaySeconds: 2,
    autoRedirect: true,
    showMessage: true
  });
  const [failoverLogs, setFailoverLogs] = useState<any[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [savingRedirect, setSavingRedirect] = useState(false);

  const fetchRedirectSettings = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('platform_content')
        .select('*')
        .eq('section', 'system_redirect')
        .maybeSingle();

      if (data && data.metadata) {
        setRedirectSettings({
          redirectEnabled: data.metadata.redirectEnabled ?? false,
          primaryUrl: data.metadata.primaryUrl ?? '',
          backupUrl: data.metadata.backupUrl ?? '',
          delaySeconds: data.metadata.delaySeconds ?? 2,
          autoRedirect: data.metadata.autoRedirect ?? true,
          showMessage: data.metadata.showMessage ?? true
        });
      }
    } catch(err) {
      console.error("Failed to load redirect settings", err);
    }
  }, []);

  const handleSaveRedirectSettings = async () => {
    setSavingRedirect(true);
    try {
      const { data: existing } = await supabase.from('platform_content').select('id').eq('section', 'system_redirect').maybeSingle();
      
      const payload = {
        type: 'page_section',
        section: 'system_redirect',
        title: 'Widget Fallback Config',
        status: 'PUBLISHED',
        metadata: redirectSettings
      };

      if (existing) {
        await supabase.from('platform_content').update(payload).eq('id', existing.id);
      } else {
        await supabase.from('platform_content').insert(payload);
      }
      toast.success("Redirect settings saved successfully.");
      addAuditLog({ action: 'UPDATE_REDIRECT_SETTINGS', details: 'Updated fallback definitions', type: 'SYSTEM' });
    } catch(err: any) {
      toast.error(err.message);
    } finally {
      setSavingRedirect(false);
    }
  };

  const fetchFailoverLogs = useCallback(async () => {
    setLoadingLogs(true);
    try {
      const { data } = await supabase
        .from('audit_logs')
        .select('*')
        .eq('action', 'CRYPTO_WIDGET_FAILOVER')
        .order('created_at', { ascending: false })
        .limit(10);
      setFailoverLogs(data || []);
    } catch(err) {
      console.error("Failed to load failover logs", err);
    } finally {
      setLoadingLogs(false);
    }
  }, []);

  const fetchProviders = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('crypto_providers')
        .select('*')
        .order('provider_priority', { ascending: true });
      if (error) throw error;
      setProviders(data || []);
    } catch (err: any) {
      toast.error("Failed to load providers", { description: err.message });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProviders();
    fetchRedirectSettings();
    fetchFailoverLogs();

    const channel = supabase
      .channel('admin-crypto-providers-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'crypto_providers' }, () => {
        fetchProviders();
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'audit_logs', filter: 'action=eq.CRYPTO_WIDGET_FAILOVER' }, () => {
        fetchFailoverLogs();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [fetchProviders, fetchRedirectSettings, fetchFailoverLogs]);

  const validateUrl = (url: string): boolean => {
    try {
      const parsed = new URL(url);
      return parsed.protocol === 'https:';
    } catch {
      return false;
    }
  };

  const openCreateDialog = () => {
    setEditingProvider(null);
    setForm(EMPTY_FORM);
    setFormOpen(true);
  };

  const openEditDialog = (provider: CryptoProvider) => {
    setEditingProvider(provider);
    setForm({
      provider_name: provider.provider_name,
      provider_url: provider.provider_url,
      provider_priority: provider.provider_priority,
      provider_status: provider.provider_status,
      provider_type: provider.provider_type,
      provider_logo: provider.provider_logo,
      provider_description: provider.provider_description,
    });
    setFormOpen(true);
  };

  const handleSave = async () => {
    if (!form.provider_name.trim()) {
      toast.error("Provider name is required.");
      return;
    }
    if (!form.provider_url.trim()) {
      toast.error("Provider URL is required.");
      return;
    }
    if (!validateUrl(form.provider_url)) {
      toast.error("Invalid URL. Only HTTPS URLs are allowed.");
      return;
    }

    setSaving(true);
    try {
      if (editingProvider) {
        const { error } = await supabase
          .from('crypto_providers')
          .update({
            provider_name: form.provider_name,
            provider_url: form.provider_url,
            provider_priority: form.provider_priority,
            provider_status: form.provider_status,
            provider_type: form.provider_type,
            provider_logo: form.provider_logo,
            provider_description: form.provider_description,
          })
          .eq('id', editingProvider.id);
        if (error) throw error;

        toast.success(`Provider "${form.provider_name}" updated.`);
        addAuditLog({ action: 'UPDATE_CRYPTO_PROVIDER', details: `Updated provider: ${form.provider_name}`, type: 'PROVIDER' });
      } else {
        const { error } = await supabase
          .from('crypto_providers')
          .insert({
            provider_name: form.provider_name,
            provider_url: form.provider_url,
            provider_priority: form.provider_priority,
            provider_status: form.provider_status,
            provider_type: form.provider_type,
            provider_logo: form.provider_logo,
            provider_description: form.provider_description,
          });
        if (error) throw error;

        toast.success(`Provider "${form.provider_name}" added.`);
        addAuditLog({ action: 'CREATE_CRYPTO_PROVIDER', details: `Created provider: ${form.provider_name}`, type: 'PROVIDER' });
      }

      setFormOpen(false);
      setEditingProvider(null);
      setForm(EMPTY_FORM);
      fetchProviders();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    try {
      const { error } = await supabase.from('crypto_providers').delete().eq('id', deleteConfirm.id);
      if (error) throw error;
      toast.success(`Provider "${deleteConfirm.provider_name}" deleted.`);
      addAuditLog({ action: 'DELETE_CRYPTO_PROVIDER', details: `Deleted provider: ${deleteConfirm.provider_name}`, type: 'PROVIDER' });
      setDeleteConfirm(null);
      fetchProviders();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleToggleStatus = async (provider: CryptoProvider) => {
    const newStatus = provider.provider_status === 'Active' ? 'Inactive' : 'Active';
    const { error } = await supabase.from('crypto_providers').update({ provider_status: newStatus }).eq('id', provider.id);
    if (!error) {
      toast.success(`${provider.provider_name} is now ${newStatus}.`);
      addAuditLog({ action: 'TOGGLE_CRYPTO_PROVIDER', details: `${provider.provider_name} set to ${newStatus}`, type: 'PROVIDER' });
      fetchProviders();
    } else {
      toast.error(error.message);
    }
  };

  const handleSetPrimary = async (provider: CryptoProvider) => {
    try {
      // Reset all to Backup first, then set selected as Primary
      await supabase.from('crypto_providers').update({ provider_type: 'Backup' }).neq('id', provider.id);
      const { error } = await supabase.from('crypto_providers').update({ provider_type: 'Primary', provider_priority: 1 }).eq('id', provider.id);
      if (error) throw error;
      toast.success(`${provider.provider_name} is now the Primary provider.`);
      addAuditLog({ action: 'SET_PRIMARY_PROVIDER', details: `Set ${provider.provider_name} as Primary`, type: 'PROVIDER' });
      fetchProviders();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const filtered = providers.filter(p =>
    p.provider_name.toLowerCase().includes(search.toLowerCase()) ||
    (p.provider_description || '').toLowerCase().includes(search.toLowerCase())
  );

  const activeCount = providers.filter(p => p.provider_status === 'Active').length;
  const primaryProvider = providers.find(p => p.provider_type === 'Primary');

  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* Institutional Header */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-border">
          <div className="space-y-1">
            <h1 className="text-3xl font-black text-foreground tracking-tight uppercase">Payment Provider Management</h1>
            <p className="text-muted-foreground text-sm font-medium">Manage third-party cryptocurrency purchase gateways and transaction routing policies.</p>
          </div>
          <Button
            variant="hero"
            className="h-11 text-[10px] font-black uppercase tracking-[0.2em] px-8 shadow-gold text-white rounded-xl"
            onClick={openCreateDialog}
          >
            <Plus className="w-4 h-4 mr-2" /> Register Provider
          </Button>
        </header>


        {/* Stats Row */}
        {/* Operations Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { label: "Total Gateways", value: providers.length, icon: Globe, color: "text-blue-600", bg: "bg-blue-50" },
            { label: "Active Channels", value: activeCount, icon: Activity, color: "text-green-600", bg: "bg-green-50" },
            { label: "Redundancy Pool", value: providers.length - activeCount, icon: Shield, color: "text-red-500", bg: "bg-red-50" },
            { label: "Primary Gateway", value: primaryProvider?.provider_name || "N/A", icon: Star, color: "text-primary", bg: "bg-primary/5" },
          ].map((stat) => (
            <div key={stat.label} className="bg-card p-6 rounded-[2rem] border border-border shadow-sm flex items-center gap-5 group hover:border-primary/20 transition-all">
               <div className={`w-14 h-14 rounded-2xl ${stat.bg} flex items-center justify-center shrink-0`}>
                  <stat.icon className={`w-6 h-6 ${stat.color}`} />
               </div>
               <div className="space-y-1">
                  <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest opacity-40">{stat.label}</p>
                  <p className="text-lg font-black text-foreground tracking-tight truncate max-w-[120px]">{stat.value}</p>
               </div>
            </div>
          ))}
        </div>


        {/* Redirect & Redundancy Settings */}
        <div className="bg-card border border-border rounded-[2.5rem] p-8 shadow-sm">
          <div className="flex flex-col xl:flex-row justify-between xl:items-center gap-6 mb-10 pb-8 border-b border-border">
            <div className="space-y-1">
              <h2 className="text-xl font-black text-foreground uppercase tracking-tight">System Fallback Settings</h2>
              <p className="text-[10px] text-muted-foreground tracking-widest font-black uppercase opacity-40 leading-loose">Configure fallback behavior and routing.</p>
            </div>
            <Button variant="hero" className="shadow-gold text-white px-8 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] h-12 w-full xl:w-auto" onClick={handleSaveRedirectSettings} disabled={savingRedirect}>
              {savingRedirect ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <ShieldCheck className="w-4 h-4 mr-2" />}
              Save Configuration
            </Button>
          </div>


          <div className="grid lg:grid-cols-2 gap-10">
             <div className="space-y-8">
                 {/* Main Toggle */}
                 <div className="p-6 rounded-2xl bg-secondary/20 border border-border flex items-center justify-between hover:border-primary/20 transition-all">
                     <div className="space-y-1 pr-6 flex-1">
                         <div className="text-sm font-black text-foreground uppercase tracking-wide">Force External Checkout</div>
                         <p className="text-[11px] text-muted-foreground font-medium leading-relaxed">Bypass embedded widgets and use direct external checkout.</p>
                     </div>
                     <button
                        onClick={() => setRedirectSettings({...redirectSettings, redirectEnabled: !redirectSettings.redirectEnabled})}
                        className={`w-14 h-8 rounded-full transition-colors flex items-center shrink-0 px-1 border border-border ${redirectSettings.redirectEnabled ? 'bg-primary shadow-glow' : 'bg-muted opacity-40'}`}
                     >
                       <div className="w-6 h-6 rounded-full bg-white transition-transform" style={{ transform: redirectSettings.redirectEnabled ? 'translateX(1.5rem)' : 'translateX(0)' }} />
                     </button>
                 </div>

                 {/* Configuration Inputs */}
                 <div className="space-y-6">
                    <div className="space-y-3">
                      <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest pl-1 opacity-40">Primary Transaction URL</Label>
                      <Input
                        value={redirectSettings.primaryUrl}
                        onChange={(e) => setRedirectSettings({...redirectSettings, primaryUrl: e.target.value})}
                        className="h-14 bg-secondary/40 border-border rounded-xl text-xs font-mono"
                        placeholder="https://terminal.provider.com/checkout"
                      />
                    </div>
                    <div className="space-y-3">
                      <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest pl-1 opacity-40">Secondary Fallback URL</Label>
                      <Input
                        value={redirectSettings.backupUrl}
                        onChange={(e) => setRedirectSettings({...redirectSettings, backupUrl: e.target.value})}
                        className="h-14 bg-secondary/40 border-border rounded-xl text-xs font-mono"
                        placeholder="https://backup.terminal.com/v2"
                      />
                    </div>
                 </div>
             </div>

             <div className="space-y-8">
                 <div className="p-6 rounded-2xl bg-secondary/20 border border-border flex items-center justify-between hover:border-primary/20 transition-all group">
                     <div className="space-y-1 flex-1 pr-6">
                         <div className="text-sm font-black text-foreground uppercase tracking-wide group-hover:text-primary transition-colors">Automated Fallback</div>
                         <p className="text-[11px] text-muted-foreground font-medium leading-relaxed">System-wide auto-forwarding on connection timeout or iframe exceptions.</p>
                     </div>
                     <button
                        onClick={() => setRedirectSettings({...redirectSettings, autoRedirect: !redirectSettings.autoRedirect})}
                        className={`w-14 h-8 rounded-full transition-colors flex items-center shrink-0 px-1 border border-border ${redirectSettings.autoRedirect ? 'bg-green-500 shadow-glow' : 'bg-muted opacity-40'}`}
                     >
                       <div className="w-6 h-6 rounded-full bg-white transition-transform" style={{ transform: redirectSettings.autoRedirect ? 'translateX(1.5rem)' : 'translateX(0)' }} />
                     </button>
                 </div>

                 <div className="p-6 rounded-2xl bg-secondary/20 border border-border flex items-center justify-between hover:border-primary/20 transition-all group">
                     <div className="space-y-1 flex-1 pr-6">
                         <div className="text-sm font-black text-foreground uppercase tracking-wide group-hover:text-primary transition-colors">Fallback Notice</div>
                         <p className="text-[11px] text-muted-foreground font-medium leading-relaxed">Display notice before initiating fallback redirect.</p>
                     </div>
                     <button
                        onClick={() => setRedirectSettings({...redirectSettings, showMessage: !redirectSettings.showMessage})}
                        className={`w-14 h-8 rounded-full transition-colors flex items-center shrink-0 px-1 border border-border ${redirectSettings.showMessage ? 'bg-primary shadow-glow' : 'bg-muted opacity-40'}`}
                     >
                       <div className="w-6 h-6 rounded-full bg-white transition-transform" style={{ transform: redirectSettings.showMessage ? 'translateX(1.5rem)' : 'translateX(0)' }} />
                     </button>
                 </div>

                 <div className="p-6 rounded-2xl bg-secondary/20 border border-border space-y-6">
                     <div className="flex justify-between items-center">
                         <div className="text-sm font-black text-foreground uppercase tracking-wide">Sensitivity Threshold</div>
                         <span className="font-black text-primary text-sm tabular-nums bg-primary/10 px-3 py-1 rounded-lg">{redirectSettings.delaySeconds}s</span>
                     </div>
                     <div className="relative pt-2">
                        <input 
                          type="range" min="1" max="10" 
                          value={redirectSettings.delaySeconds}
                          onChange={(e) => setRedirectSettings({...redirectSettings, delaySeconds: parseInt(e.target.value)})}
                          className="w-full h-2 bg-border rounded-lg appearance-none cursor-pointer accent-primary"
                        />
                     </div>
                     <div className="flex justify-between text-[8px] uppercase font-black text-muted-foreground/30 tracking-[0.2em]">
                         <span>Aggressive</span>
                         <span>Conservative</span>
                     </div>
                 </div>
             </div>
          </div>
        </div>

        {/* Search */}
        <div className="relative w-full lg:max-w-md group px-1">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/40 group-focus-within:text-primary transition-colors" />
          <input
            placeholder="Search providers or descriptions..."
            className="w-full h-14 bg-card border border-border rounded-2xl pl-12 pr-4 text-xs font-black uppercase tracking-widest outline-none focus:border-primary focus:ring-8 focus:ring-primary/5 transition-all shadow-sm"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Providers List */}
        <div className="rounded-[2.5rem] bg-card border border-border overflow-hidden shadow-sm">
          {loading ? (
            <div className="py-24 flex justify-center">
               <div className="relative flex items-center justify-center">
                  <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                  <Activity className="w-4 h-4 text-primary absolute animate-pulse" />
               </div>
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-24 text-center px-6">
              <div className="w-20 h-20 rounded-[2.5rem] bg-secondary/30 flex items-center justify-center mx-auto mb-6 border border-border/50">
                <Globe className="w-10 h-10 text-muted-foreground opacity-20" />
              </div>
              <p className="text-base font-black text-foreground uppercase tracking-tight">No active providers located</p>
              <p className="text-[10px] text-muted-foreground mt-2 uppercase tracking-widest font-black opacity-30 max-w-xs mx-auto leading-relaxed">Adjust your search parameters or register a new payment gateway to continue.</p>
            </div>

          ) : (
            <div className="divide-y divide-border">
              {filtered.map((provider, index) => (
                <motion.div
                  key={provider.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="p-6 sm:p-8 xl:p-10 flex flex-col md:flex-row md:items-center gap-8 hover:bg-secondary/[0.15] transition-colors group relative"
                >
                  {/* Provider Info */}
                  <div className="flex items-start sm:items-center gap-6 flex-1 min-w-0">
                    <div className="relative shrink-0">
                      <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-3xl bg-secondary border border-border flex items-center justify-center overflow-hidden group-hover:scale-105 transition-transform shadow-sm">
                        {provider.provider_logo ? (
                          <img src={provider.provider_logo} alt={provider.provider_name} className="w-full h-full object-cover" />
                        ) : (
                          <Globe className="w-8 h-8 text-muted-foreground/30" />
                        )}
                      </div>
                      {provider.provider_type === 'Primary' && (
                        <div className="absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full bg-gradient-gold flex items-center justify-center shadow-gold border-2 border-card">
                          <Star className="w-3 h-3 text-white" />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1 space-y-2">
                      <div className="flex items-center gap-3 flex-wrap">
                        <h3 className="font-black text-foreground text-base tracking-tighter uppercase">{provider.provider_name}</h3>
                        <Badge
                          className={`text-[8px] font-black uppercase tracking-widest px-2.5 py-1 ${
                            provider.provider_type === 'Primary'
                              ? 'bg-gradient-gold text-white border-transparent'
                              : 'bg-primary/10 text-primary border-primary/20'
                          }`}
                        >
                          {provider.provider_type}
                        </Badge>
                        <Badge
                          variant="outline"
                          className={`text-[8px] font-black uppercase tracking-widest px-2.5 py-1 border-2 ${
                            provider.provider_status === 'Active'
                              ? 'bg-green-500/10 text-green-500 border-green-500/10'
                              : 'bg-red-500/10 text-red-500 border-red-500/10'
                          }`}
                        >
                          {provider.provider_status}
                        </Badge>
                      </div>
                      <p className="text-[11px] text-muted-foreground/70 font-medium leading-relaxed max-w-xl">{provider.provider_description || "Institutional purchase provider for secure wallet funding."}</p>
                      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 pt-1">
                        <span className="text-[10px] text-muted-foreground/40 font-black uppercase tracking-widest flex items-center gap-2">
                          <Link2 className="w-3.5 h-3.5" /> {(provider.provider_url || "").replace('https://', '').split('/')[0]}
                        </span>
                        <span className="text-[10px] text-muted-foreground/40 font-black uppercase tracking-widest flex items-center gap-2">
                          <ArrowUpDown className="w-3.5 h-3.5" /> Rank #{provider.provider_priority}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-3 shrink-0 pt-4 md:pt-0 border-t md:border-t-0 border-border/50">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => openEditDialog(provider)}
                      className="h-12 w-12 rounded-2xl border-border hover:bg-primary/10 hover:text-primary hover:border-primary/30 transition-all"
                    >
                      <Edit3 className="w-4 h-4" />
                    </Button>

                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleToggleStatus(provider)}
                      className={`h-12 w-12 rounded-2xl border-border transition-all ${
                        provider.provider_status === 'Active'
                          ? 'hover:bg-red-500/10 hover:text-red-500 hover:border-red-500/30'
                          : 'hover:bg-green-500/10 hover:text-green-500 hover:border-green-500/30'
                      }`}
                    >
                      {provider.provider_status === 'Active' ? <PowerOff className="w-4 h-4" /> : <Power className="w-4 h-4" />}
                    </Button>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="icon" className="h-12 w-12 rounded-2xl border-border hover:bg-secondary">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-64 p-3 bg-card border-border rounded-[2rem] shadow-huge">
                        <DropdownMenuItem className="rounded-2xl px-4 py-4 cursor-pointer group" onClick={() => handleSetPrimary(provider)}>
                          <Star className="w-5 h-5 mr-4 text-primary transition-transform group-hover:scale-125" />
                          <div className="flex flex-col">
                            <span className="text-xs font-black uppercase tracking-tight">Assign Primary</span>
                            <span className="text-[9px] text-muted-foreground font-bold opacity-60">Set as root node</span>
                          </div>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="rounded-2xl px-4 py-4 cursor-pointer group"
                          onClick={() => window.open(provider.provider_url, '_blank')}
                        >
                          <ExternalLink className="w-5 h-5 mr-4 text-muted-foreground group-hover:text-primary" />
                          <div className="flex flex-col">
                            <span className="text-xs font-black uppercase tracking-tight">Validate Protocol</span>
                            <span className="text-[9px] text-muted-foreground font-bold opacity-60">Test endpoint link</span>
                          </div>
                        </DropdownMenuItem>
                        <div className="h-px bg-border my-2 mx-1" />
                        <DropdownMenuItem
                          className="rounded-2xl px-4 py-4 cursor-pointer text-red-500 focus:text-red-500 focus:bg-red-500/10 group"
                          onClick={() => setDeleteConfirm(provider)}
                        >
                          <Trash2 className="w-5 h-5 mr-4 transition-transform group-hover:rotate-12" />
                          <div className="flex flex-col">
                            <span className="text-xs font-black uppercase tracking-tight">Purge Provider</span>
                            <span className="text-[9px] text-red-500/60 font-bold">Destroy entry permanently</span>
                          </div>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          <div className="p-6 px-10 border-t border-border bg-secondary/10 flex flex-col sm:flex-row items-center justify-between gap-4">
            <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest opacity-40">
              Total Providers: {filtered.length} active
            </span>
            <div className="flex items-center gap-3 px-4 py-2 rounded-full bg-green-500/10 border border-green-500/20">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse shadow-glow" />
              <span className="text-[9px] font-black text-green-500 uppercase tracking-[0.2em]">Live Data Sync</span>
            </div>
          </div>
        </div>

        {/* Redundancy Log */}
        <div className="bg-card border border-border rounded-[2.5rem] p-8 shadow-sm relative overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center gap-5 mb-10">
            <div className="w-12 h-12 rounded-2xl bg-orange-500/10 flex items-center justify-center text-orange-500 border border-orange-200/50 shadow-sm">
               <Activity className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-black text-foreground uppercase tracking-tight">System Fallback Log</h3>
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-black opacity-40 mt-1 leading-loose">Audit trail of automated fallback routing actions.</p>
            </div>
          </div>


          <div className="space-y-4">
             {loadingLogs ? (
               <div className="py-20 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary opacity-20" /></div>
             ) : failoverLogs.length === 0 ? (
               <div className="py-16 text-center bg-secondary/10 rounded-3xl border border-dashed border-border">
                 <p className="text-[10px] font-black text-muted-foreground opacity-40 uppercase tracking-[0.2em]">No failover exceptions detected in current cycle</p>
               </div>
             ) : (
               failoverLogs.map((log) => (
                 <div key={log.id} className="p-5 sm:p-6 rounded-3xl bg-secondary/30 border border-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 group hover:border-primary/30 hover:bg-secondary/40 transition-all">
                    <div className="flex items-start gap-4">
                       <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center text-red-500 border border-red-500/20 shrink-0">
                          <AlertTriangle className="w-5 h-5" />
                       </div>
                       <div>
                          <div className="text-xs font-black text-foreground uppercase tracking-wide group-hover:text-red-400 transition-colors">{log.user_name || "System Actor"} Exception</div>
                          <p className="text-[11px] text-muted-foreground mt-1.5 leading-relaxed max-w-xl">{log.details}</p>
                       </div>
                    </div>
                    <div className="w-full sm:w-auto text-left sm:text-right shrink-0 pt-4 sm:pt-0 border-t sm:border-t-0 border-border/50">
                       <div className="text-sm font-black text-foreground mb-1 tabular-nums">{new Date(log.created_at).toLocaleTimeString()}</div>
                       <div className="text-[10px] text-muted-foreground uppercase tracking-widest font-black opacity-30">{new Date(log.created_at).toLocaleDateString()}</div>
                    </div>
                 </div>
               ))
             )}
          </div>
        </div>
      </div>

      {/* Add / Edit Dialog */}
      <Dialog open={formOpen} onOpenChange={() => { setFormOpen(false); setEditingProvider(null); setForm(EMPTY_FORM); }}>
        <DialogContent className="bg-card border-border shadow-huge p-0 max-w-lg rounded-2xl overflow-hidden">
          <DialogHeader className="p-8 pb-0">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-4">
              {editingProvider ? <Edit3 className="w-6 h-6" /> : <Plus className="w-6 h-6" />}
            </div>
            <DialogTitle className="text-xl font-bold text-foreground">
              {editingProvider ? "Edit Provider" : "Add Provider"}
            </DialogTitle>
          </DialogHeader>

          <ScrollArea className="max-h-[60vh] px-8 py-6">
            <div className="space-y-6">
              {/* Name */}
              <div className="space-y-2">
                <Label className="text-xs font-bold text-foreground uppercase tracking-widest flex items-center gap-2">
                  <FileText className="w-3 h-3 text-primary" /> Provider Name
                </Label>
                <Input
                  value={form.provider_name}
                  onChange={(e) => setForm({ ...form, provider_name: e.target.value })}
                  placeholder="e.g. MoonPay"
                  className="h-12 bg-secondary/50 border-border rounded-xl font-bold"
                />
              </div>

              {/* URL */}
              <div className="space-y-2">
                <Label className="text-xs font-bold text-foreground uppercase tracking-widest flex items-center gap-2">
                  <Link2 className="w-3 h-3 text-primary" /> Provider URL
                </Label>
                <Input
                  value={form.provider_url}
                  onChange={(e) => setForm({ ...form, provider_url: e.target.value })}
                  placeholder="https://widget.provider.com/buy"
                  className="h-12 bg-secondary/50 border-border rounded-xl font-mono text-sm"
                />
                <p className="text-[9px] text-muted-foreground font-bold uppercase tracking-widest flex items-center gap-1">
                  <Shield className="w-3 h-3" /> Only HTTPS URLs are accepted
                </p>
              </div>

              {/* Logo URL */}
              <div className="space-y-2">
                <Label className="text-xs font-bold text-foreground uppercase tracking-widest flex items-center gap-2">
                  <ImageIcon className="w-3 h-3 text-primary" /> Logo URL (Optional)
                </Label>
                <Input
                  value={form.provider_logo || ''}
                  onChange={(e) => setForm({ ...form, provider_logo: e.target.value || null })}
                  placeholder="https://example.com/logo.png"
                  className="h-12 bg-secondary/50 border-border rounded-xl font-mono text-sm"
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label className="text-xs font-bold text-foreground uppercase tracking-widest">Description (Optional)</Label>
                <textarea
                  value={form.provider_description || ''}
                  onChange={(e) => setForm({ ...form, provider_description: e.target.value || null })}
                  placeholder="Brief description of this provider..."
                  className="w-full h-24 bg-secondary/50 border border-border rounded-xl p-4 text-sm font-medium outline-none resize-none focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all"
                />
              </div>

              {/* Type & Priority Row */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-foreground uppercase tracking-widest">Provider Type</Label>
                  <div className="grid grid-cols-1 gap-2">
                    {(['Primary', 'Secondary', 'Backup'] as const).map(type => (
                      <button
                        key={type}
                        onClick={() => setForm({ ...form, provider_type: type })}
                        className={`px-4 py-3 rounded-xl text-xs font-bold transition-all border ${
                          form.provider_type === type
                            ? type === 'Primary'
                              ? 'bg-gradient-gold text-white border-transparent shadow-gold'
                              : 'bg-primary/10 text-primary border-primary/20'
                            : 'bg-secondary text-muted-foreground border-border hover:border-primary/30'
                        }`}
                      >
                        {type === 'Primary' && <Star className="w-3 h-3 inline mr-1" />}
                        {type}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-foreground uppercase tracking-widest">Priority</Label>
                  <Input
                    type="number"
                    min={1}
                    max={999}
                    value={form.provider_priority}
                    onChange={(e) => setForm({ ...form, provider_priority: parseInt(e.target.value) || 1 })}
                    className="h-12 bg-secondary/50 border-border rounded-xl font-bold text-lg tabular-nums"
                  />
                  <p className="text-[9px] text-muted-foreground font-bold uppercase tracking-widest">Lower number = Higher priority</p>

                  <div className="pt-4">
                    <Label className="text-xs font-bold text-foreground uppercase tracking-widest">Status</Label>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      <button
                        onClick={() => setForm({ ...form, provider_status: 'Active' })}
                        className={`py-3 rounded-xl text-xs font-bold transition-all border ${
                          form.provider_status === 'Active' ? 'bg-green-600 text-white border-transparent shadow-sm' : 'bg-secondary text-muted-foreground border-border'
                        }`}
                      >
                        Active
                      </button>
                      <button
                        onClick={() => setForm({ ...form, provider_status: 'Inactive' })}
                        className={`py-3 rounded-xl text-xs font-bold transition-all border ${
                          form.provider_status === 'Inactive' ? 'bg-red-600 text-white border-transparent shadow-sm' : 'bg-secondary text-muted-foreground border-border'
                        }`}
                      >
                        Inactive
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </ScrollArea>

          <DialogFooter className="p-8 pt-4 grid grid-cols-2 gap-3">
            <Button variant="outline" className="h-12 rounded-xl" onClick={() => { setFormOpen(false); setEditingProvider(null); setForm(EMPTY_FORM); }}>
              Cancel
            </Button>
            <Button variant="hero" className="h-12 rounded-xl shadow-gold text-white" onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              {editingProvider ? "Update Provider" : "Add Provider"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent className="bg-card border-border shadow-huge p-8 max-w-sm rounded-2xl">
          <DialogHeader>
            <div className="w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center text-red-500 mb-4">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <DialogTitle className="text-xl font-bold text-foreground">Delete Provider</DialogTitle>
            <p className="text-sm text-muted-foreground mt-2">
              Are you sure you want to permanently delete <span className="font-bold text-foreground">{deleteConfirm?.provider_name}</span>? This action cannot be undone.
            </p>
          </DialogHeader>
          <DialogFooter className="mt-6 grid grid-cols-2 gap-3">
            <Button variant="outline" className="h-12 rounded-xl" onClick={() => setDeleteConfirm(null)}>Cancel</Button>
            <Button className="h-12 rounded-xl bg-red-600 hover:bg-red-700 text-white" onClick={handleDelete}>
              <Trash2 className="w-4 h-4 mr-2" /> Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default CryptoProviderManagement;
