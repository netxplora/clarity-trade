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
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-border">
          <div>
            <div className="flex items-center gap-2 text-primary mb-1">
              <CreditCard className="w-4 h-4" />
              <span className="text-[10px] font-black tracking-[0.2em] uppercase">Administration</span>
            </div>
            <h1 className="text-4xl font-black text-foreground tracking-tight">Crypto Providers</h1>
            <p className="text-muted-foreground mt-1 text-[10px] font-black uppercase tracking-widest opacity-40">Manage third-party purchase providers</p>
          </div>
          <Button
            variant="hero"
            className="h-12 text-[10px] font-black uppercase tracking-widest px-6 shadow-gold text-white rounded-xl"
            onClick={openCreateDialog}
          >
            <Plus className="w-4 h-4 mr-2" /> Add Provider
          </Button>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl bg-card border border-border">
            <div className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-2 opacity-60">Total Providers</div>
            <div className="text-3xl font-black text-foreground tabular-nums">{providers.length}</div>
          </div>
          <div className="p-5 rounded-2xl bg-card border border-border">
            <div className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-2 opacity-60">Active</div>
            <div className="text-3xl font-black text-green-500 tabular-nums">{activeCount}</div>
          </div>
          <div className="p-5 rounded-2xl bg-card border border-border">
            <div className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-2 opacity-60">Inactive</div>
            <div className="text-3xl font-black text-red-500 tabular-nums">{providers.length - activeCount}</div>
          </div>
          <div className="p-5 rounded-2xl bg-primary/5 border border-primary/10">
            <div className="text-[10px] font-black text-primary uppercase tracking-widest mb-2">Primary Provider</div>
            <div className="text-sm font-black text-primary truncate">{primaryProvider?.provider_name || "Not Set"}</div>
          </div>
        </div>

        {/* Redirect Fallback Settings */}
        <div className="bg-card border border-border rounded-3xl p-6 shadow-sm">
          <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-6 pb-6 border-b border-border">
            <div>
              <h2 className="text-lg font-bold text-foreground">Widget Failover & Redirect Strategy</h2>
              <p className="text-xs text-muted-foreground mt-1 tracking-widest font-bold uppercase">Fallback overrides and intelligent redirection parameters</p>
            </div>
            <Button variant="hero" className="shadow-gold text-white px-6 rounded-xl text-xs font-black uppercase tracking-widest h-12" onClick={handleSaveRedirectSettings} disabled={savingRedirect}>
              {savingRedirect ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <ShieldCheck className="w-4 h-4 mr-2" />}
              Save configuration
            </Button>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
             <div className="space-y-6">
                 {/* Main Toggle */}
                 <div className="p-5 rounded-2xl bg-secondary/50 border border-border flex items-center justify-between hover:border-primary/20 transition-all">
                     <div className="space-y-1 pr-4">
                         <div className="text-sm font-black text-foreground uppercase tracking-wide">Force Widget Redirect</div>
                         <p className="text-xs text-muted-foreground font-medium">Bypass embedded widgets entirely and route users to the secure external link.</p>
                     </div>
                     <button
                        onClick={() => setRedirectSettings({...redirectSettings, redirectEnabled: !redirectSettings.redirectEnabled})}
                        className={`w-14 h-8 rounded-full transition-colors flex items-center shrink-0 px-1 border border-border ${redirectSettings.redirectEnabled ? 'bg-primary' : 'bg-muted'}`}
                     >
                       <div className={`w-6 h-6 rounded-full bg-white transition-transform ${redirectSettings.redirectEnabled ? 'translate-x-6' : ''}`} />
                     </button>
                 </div>

                 {/* Configuration Inputs */}
                 <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest pl-1">Primary Redirect URL</Label>
                      <Input
                        value={redirectSettings.primaryUrl}
                        onChange={(e) => setRedirectSettings({...redirectSettings, primaryUrl: e.target.value})}
                        className="h-12 bg-secondary border-border rounded-xl text-sm font-mono"
                        placeholder="https://provider.com/secure-checkout"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest pl-1">Backup Provider Fallback URL</Label>
                      <Input
                        value={redirectSettings.backupUrl}
                        onChange={(e) => setRedirectSettings({...redirectSettings, backupUrl: e.target.value})}
                        className="h-12 bg-secondary border-border rounded-xl text-sm font-mono"
                        placeholder="https://backup.provider.com/checkout"
                      />
                    </div>
                 </div>
             </div>

             <div className="space-y-6">
                 <div className="p-5 rounded-2xl bg-secondary/50 border border-border flex items-center justify-between hover:border-primary/20 transition-all">
                     <div className="space-y-1">
                         <div className="text-sm font-black text-foreground uppercase tracking-wide">Auto-Redirect Action</div>
                         <p className="text-xs text-muted-foreground font-medium">Automatically forward user upon timeout or fatal iframe error.</p>
                     </div>
                     <button
                        onClick={() => setRedirectSettings({...redirectSettings, autoRedirect: !redirectSettings.autoRedirect})}
                        className={`w-14 h-8 rounded-full transition-colors flex items-center px-1 border border-border ${redirectSettings.autoRedirect ? 'bg-green-500' : 'bg-muted'}`}
                     >
                       <div className={`w-6 h-6 rounded-full bg-white transition-transform ${redirectSettings.autoRedirect ? 'translate-x-6' : ''}`} />
                     </button>
                 </div>

                 <div className="p-5 rounded-2xl bg-secondary/50 border border-border flex items-center justify-between hover:border-primary/20 transition-all">
                     <div className="space-y-1">
                         <div className="text-sm font-black text-foreground uppercase tracking-wide">Display Fallback Notice</div>
                         <p className="text-xs text-muted-foreground font-medium">Show pre-redirect system message ("Opening in secure window...").</p>
                     </div>
                     <button
                        onClick={() => setRedirectSettings({...redirectSettings, showMessage: !redirectSettings.showMessage})}
                        className={`w-14 h-8 rounded-full transition-colors flex items-center px-1 border border-border ${redirectSettings.showMessage ? 'bg-primary' : 'bg-muted'}`}
                     >
                       <div className={`w-6 h-6 rounded-full bg-white transition-transform ${redirectSettings.showMessage ? 'translate-x-6' : ''}`} />
                     </button>
                 </div>

                 <div className="p-5 rounded-2xl bg-secondary/50 border border-border space-y-3">
                     <div className="flex justify-between">
                         <div className="text-sm font-black text-foreground uppercase tracking-wide">Redirection Delay Pivot</div>
                         <span className="font-bold text-foreground text-sm tabular-nums">{redirectSettings.delaySeconds}s</span>
                     </div>
                     <input 
                       type="range" min="1" max="10" 
                       value={redirectSettings.delaySeconds}
                       onChange={(e) => setRedirectSettings({...redirectSettings, delaySeconds: parseInt(e.target.value)})}
                       className="w-full accent-primary h-2 bg-border rounded-lg appearance-none cursor-pointer"
                     />
                     <div className="flex justify-between text-[10px] uppercase font-bold text-muted-foreground tracking-widest">
                         <span>Instant</span>
                         <span>Delayed</span>
                     </div>
                 </div>
             </div>
          </div>
        </div>

        {/* Search */}
        <div className="relative w-full lg:max-w-md group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/40 group-focus-within:text-primary transition-colors" />
          <input
            placeholder="Search providers..."
            className="w-full h-12 bg-card border border-border rounded-xl pl-11 pr-4 text-[13px] font-medium outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Providers List */}
        <div className="rounded-[2.5rem] bg-card border border-border overflow-hidden shadow-sm">
          {loading ? (
            <div className="py-24 flex justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-24 text-center">
              <div className="w-16 h-16 rounded-2xl bg-secondary/30 flex items-center justify-center mx-auto mb-4 border border-border/50">
                <Globe className="w-8 h-8 text-muted-foreground/30" />
              </div>
              <p className="text-sm font-bold text-muted-foreground">No providers found.</p>
              <p className="text-xs text-muted-foreground/50 mt-1 uppercase tracking-widest font-medium">Add your first crypto provider to get started.</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {filtered.map((provider, index) => (
                <motion.div
                  key={provider.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="p-6 md:p-8 flex flex-col md:flex-row md:items-center gap-6 hover:bg-secondary/20 transition-colors group"
                >
                  {/* Provider Info */}
                  <div className="flex items-center gap-5 flex-1 min-w-0">
                    <div className="relative shrink-0">
                      <div className="w-14 h-14 rounded-2xl bg-secondary border border-border flex items-center justify-center overflow-hidden group-hover:scale-105 transition-transform">
                        {provider.provider_logo ? (
                          <img src={provider.provider_logo} alt={provider.provider_name} className="w-full h-full object-cover" />
                        ) : (
                          <Globe className="w-6 h-6 text-muted-foreground/40" />
                        )}
                      </div>
                      {provider.provider_type === 'Primary' && (
                        <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-gradient-gold flex items-center justify-center shadow-gold">
                          <Star className="w-3 h-3 text-white" />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-3 flex-wrap">
                        <h3 className="font-bold text-foreground text-sm tracking-tight">{provider.provider_name}</h3>
                        <Badge
                          variant={provider.provider_type === 'Primary' ? 'default' : 'secondary'}
                          className={`text-[8px] font-black uppercase tracking-widest ${
                            provider.provider_type === 'Primary'
                              ? 'bg-gradient-gold text-white border-transparent shadow-gold'
                              : provider.provider_type === 'Secondary'
                              ? 'bg-blue-500/10 text-blue-500 border-blue-500/20'
                              : ''
                          }`}
                        >
                          {provider.provider_type}
                        </Badge>
                        <Badge
                          variant="outline"
                          className={`text-[8px] font-black uppercase tracking-widest ${
                            provider.provider_status === 'Active'
                              ? 'bg-green-500/10 text-green-500 border-green-500/20'
                              : 'bg-red-500/10 text-red-500 border-red-500/20'
                          }`}
                        >
                          {provider.provider_status === 'Active' ? <CheckCircle className="w-3 h-3 mr-1" /> : <XCircle className="w-3 h-3 mr-1" />}
                          {provider.provider_status}
                        </Badge>
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-1 line-clamp-1 font-medium">{provider.provider_description || "No description provided."}</p>
                      <div className="flex items-center gap-3 mt-2">
                        <span className="text-[9px] text-muted-foreground/40 font-bold uppercase tracking-widest flex items-center gap-1">
                          <Link2 className="w-3 h-3" /> {new URL(provider.provider_url).hostname}
                        </span>
                        <span className="text-[9px] text-muted-foreground/40 font-bold uppercase tracking-widest">
                          Priority: {provider.provider_priority}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => openEditDialog(provider)}
                      className="h-10 w-10 rounded-xl border-border hover:bg-primary/10 hover:text-primary transition-all"
                    >
                      <Edit3 className="w-4 h-4" />
                    </Button>

                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleToggleStatus(provider)}
                      className={`h-10 w-10 rounded-xl border-border transition-all ${
                        provider.provider_status === 'Active'
                          ? 'hover:bg-red-500/10 hover:text-red-500'
                          : 'hover:bg-green-500/10 hover:text-green-500'
                      }`}
                    >
                      {provider.provider_status === 'Active' ? <PowerOff className="w-4 h-4" /> : <Power className="w-4 h-4" />}
                    </Button>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="icon" className="h-10 w-10 rounded-xl border-border">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-56 p-2 bg-card border-border rounded-2xl shadow-huge">
                        <DropdownMenuItem className="rounded-xl px-3 py-3 cursor-pointer group" onClick={() => handleSetPrimary(provider)}>
                          <Star className="w-4 h-4 mr-3 text-primary transition-transform group-hover:scale-110" />
                          <div className="flex flex-col">
                            <span className="text-xs font-black uppercase tracking-tight">Set as Primary</span>
                            <span className="text-[9px] text-muted-foreground font-bold">Default load provider</span>
                          </div>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="rounded-xl px-3 py-3 cursor-pointer"
                          onClick={() => window.open(provider.provider_url, '_blank')}
                        >
                          <ExternalLink className="w-4 h-4 mr-3" />
                          <div className="flex flex-col">
                            <span className="text-xs font-black uppercase tracking-tight">Open URL</span>
                            <span className="text-[9px] text-muted-foreground font-bold">Test in new tab</span>
                          </div>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="rounded-xl px-3 py-3 cursor-pointer text-red-500 focus:text-red-500 focus:bg-red-500/10 group"
                          onClick={() => setDeleteConfirm(provider)}
                        >
                          <Trash2 className="w-4 h-4 mr-3 transition-transform group-hover:rotate-12" />
                          <div className="flex flex-col">
                            <span className="text-xs font-black uppercase tracking-tight">Delete Provider</span>
                            <span className="text-[9px] text-red-500/60 font-bold">Permanently remove</span>
                          </div>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          <div className="p-6 border-t border-border bg-secondary/10 flex items-center justify-between">
            <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest opacity-60">
              {filtered.length} of {providers.length} Providers
            </span>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-500/10 border border-green-500/20">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              <span className="text-[9px] font-black text-green-500 uppercase tracking-widest">Real-time Sync</span>
            </div>
          </div>
        </div>

        {/* Recent Failover Activity */}
        <div className="bg-card border border-border rounded-[2rem] p-8 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-500">
               <Activity className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-foreground">Recent Failover Events</h3>
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold opacity-60">Audit trail of widget failures and redirections</p>
            </div>
          </div>

          <div className="space-y-3">
             {loadingLogs ? (
               <div className="py-10 flex justify-center"><Loader2 className="w-5 h-5 animate-spin text-primary" /></div>
             ) : failoverLogs.length === 0 ? (
               <div className="py-10 text-center text-xs font-bold text-muted-foreground opacity-40 uppercase tracking-widest">No recent failover events detected</div>
             ) : (
               failoverLogs.map((log) => (
                 <div key={log.id} className="p-4 rounded-xl bg-secondary/30 border border-border flex items-center justify-between group hover:border-primary/20 transition-all">
                    <div className="flex items-center gap-4">
                       <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center text-red-500">
                          <AlertTriangle className="w-4 h-4" />
                       </div>
                       <div>
                          <div className="text-[11px] font-black text-foreground uppercase tracking-wide">{log.user_name} encountered an error</div>
                          <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-1">{log.details}</p>
                       </div>
                    </div>
                    <div className="text-right shrink-0">
                       <div className="text-[10px] font-bold text-foreground mb-0.5">{new Date(log.created_at).toLocaleTimeString()}</div>
                       <div className="text-[9px] text-muted-foreground uppercase tracking-tighter whitespace-nowrap">{new Date(log.created_at).toLocaleDateString()}</div>
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
