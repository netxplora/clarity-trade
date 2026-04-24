import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CreditCard, ArrowRight, Info, Loader2, ChevronDown, Wallet, ShieldCheck,
  ChevronLeft, Globe, Star, RefreshCw, AlertTriangle, Copy, Zap, ExternalLink,
  CheckCircle, XCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useStore } from '@/store/useStore';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';

interface CryptoProvider {
  id: string;
  provider_name: string;
  provider_url: string;
  provider_priority: number;
  provider_status: string;
  provider_type: string;
  provider_logo: string | null;
  provider_description: string | null;
}

export default function BuyCryptoModule() {
  const { user, displayCurrency, addAuditLog } = useStore();

  // Provider state
  const [providers, setProviders] = useState<CryptoProvider[]>([]);
  const [activeProvider, setActiveProvider] = useState<CryptoProvider | null>(null);
  const [providerDropdownOpen, setProviderDropdownOpen] = useState(false);
  const [providerLoading, setProviderLoading] = useState(true);
  const [iframeLoading, setIframeLoading] = useState(true);
  const [iframeError, setIframeError] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Redirect Settings State
  const [redirectSettings, setRedirectSettings] = useState({
    redirectEnabled: false,
    primaryUrl: '',
    backupUrl: '',
    delaySeconds: 2,
    autoRedirect: true,
    showMessage: true
  });
  const [isRedirecting, setIsRedirecting] = useState(false);
  const redirectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const failoverTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Wallet state
  const [selectedCoin, setSelectedCoin] = useState('BTC');
  const [depositWallets, setDepositWallets] = useState<any[]>([]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setProviderDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch providers from database
  const fetchProviders = useCallback(async () => {
    setProviderLoading(true);
    try {
      const { data, error } = await supabase
        .from('crypto_providers')
        .select('*')
        .eq('provider_status', 'Active')
        .order('provider_priority', { ascending: true });

      if (error) throw error;

      const activeProviders = data || [];
      setProviders(activeProviders);

      // Auto-select: Primary first, then by priority
      if (activeProviders.length > 0) {
        const primary = activeProviders.find(p => p.provider_type === 'Primary');
        setActiveProvider(primary || activeProviders[0]);
      } else {
        setActiveProvider(null);
      }
    } catch (err: any) {
      console.error("Failed to fetch crypto providers:", err);
      toast.error("Could not load purchase providers.");
    } finally {
      setProviderLoading(false);
    }
  }, []);

  // Fetch Redirect Settings
  const fetchRedirectSettings = useCallback(async () => {
    try {
      const { data } = await supabase
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
    } catch (err) {
      console.error("Failed to load redirect widget settings:", err);
    }
  }, []);

  // Fetch deposit wallets
  const fetchWallets = useCallback(async () => {
    const { data } = await supabase.from('deposit_wallets').select('*').eq('status', 'Active');
    if (data) setDepositWallets(data);
  }, []);

  useEffect(() => {
    fetchProviders();
    fetchWallets();
    fetchRedirectSettings();

    // Real-time sync for provider changes
    const channel = supabase
      .channel('user-crypto-providers-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'crypto_providers' }, () => {
        fetchProviders();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'platform_content', filter: "section=eq.system_redirect" }, () => {
        fetchRedirectSettings();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [fetchProviders, fetchWallets, fetchRedirectSettings]);

  // Reset iframe state when provider changes
  useEffect(() => {
    if (activeProvider) {
      setIframeLoading(true);
      setIframeError(false);
    }
  }, [activeProvider?.id]);

  // Handle Redirection logic
  const triggerRedirect = useCallback((url: string, manualClick: boolean = false) => {
    if (!url) return;
    setIsRedirecting(true);
    
    if (redirectTimerRef.current) clearTimeout(redirectTimerRef.current);
    
    redirectTimerRef.current = setTimeout(() => {
      if (manualClick) {
         window.open(url, '_blank');
      } else {
         // Use location.href for automated redirects to prevent strict popup blockers
         window.location.href = url;
      }
      setTimeout(() => setIsRedirecting(false), 2000);
    }, (redirectSettings.delaySeconds || 0) * 1000);
  }, [redirectSettings.delaySeconds]);

  // Clean up timer
  useEffect(() => {
    return () => {
      if (redirectTimerRef.current) clearTimeout(redirectTimerRef.current);
    };
  }, []);

  // Enforce global redirect Enabled check
  useEffect(() => {
    if (!providerLoading && redirectSettings.redirectEnabled && redirectSettings.primaryUrl) {
      if (redirectSettings.autoRedirect && !isRedirecting) {
        triggerRedirect(redirectSettings.primaryUrl);
      }
    }
  }, [redirectSettings.redirectEnabled, providerLoading, redirectSettings.autoRedirect, redirectSettings.primaryUrl, triggerRedirect, isRedirecting]);

  // Get current wallet for selected coin
  const currentWallet = depositWallets.find(w => {
    const symbolMap: Record<string, string> = { 'BTC': 'Bitcoin', 'ETH': 'Ethereum', 'USDT': 'USDT' };
    const targetName = symbolMap[selectedCoin.toUpperCase()] || selectedCoin;
    const coinName = (w.coin || w.asset || '').toUpperCase();
    return coinName === targetName.toUpperCase();
  });

  const handleCopyAddress = () => {
    const addr = currentWallet?.address || currentWallet?.wallet_address;
    if (addr) {
      navigator.clipboard.writeText(addr);
      toast.success(`${selectedCoin} address copied to clipboard`);
    } else {
      toast.error("No address available for this asset");
    }
  };

  const handleProviderSwitch = (provider: CryptoProvider) => {
    setActiveProvider(provider);
    setProviderDropdownOpen(false);
    setIframeLoading(true);
    setIframeError(false);
    toast.success(`Switched to ${provider.provider_name}`);
  };

  const handleIframeLoad = () => {
    setIframeLoading(false);
    if (failoverTimeoutRef.current) clearTimeout(failoverTimeoutRef.current);
  };

  const handleIframeError = (reason: string = 'LOAD_ERROR') => {
    setIframeLoading(false);
    setIframeError(true);
    if (failoverTimeoutRef.current) clearTimeout(failoverTimeoutRef.current);
    
    // Log failover event
    addAuditLog({
      action: 'CRYPTO_WIDGET_FAILOVER',
      details: `Failover triggered for ${activeProvider?.provider_name}. Reason: ${reason}. Target: ${redirectSettings.primaryUrl || 'Next available provider'}`,
      type: 'SYSTEM',
      user: user?.name
    });

    // Strategy 1: Global Redirect Enabled
    if (redirectSettings.redirectEnabled && redirectSettings.primaryUrl) {
       toast.error(`${activeProvider?.provider_name || 'Provider'} connection issue. Switching to secure gateway...`);
       triggerRedirect(redirectSettings.primaryUrl);
       return;
    }

    // Strategy 2: Switch to next provider in priority list
    if (activeProvider) {
      const currentIndex = providers.findIndex(p => p.id === activeProvider.id);
      const nextProvider = providers[currentIndex + 1];
      
      if (nextProvider && nextProvider.provider_status === 'Active') {
        toast.info(`${activeProvider.provider_name} unavailable. Switching to ${nextProvider.provider_name}...`);
        
        // Show a brief loading state for the switch
        setIframeLoading(true);
        setIframeError(false);
        
        setTimeout(() => {
          setActiveProvider(nextProvider);
        }, 1200);
        return;
      }
      
      // Strategy 3: No more providers, try backup URLs
      if (redirectSettings.backupUrl && redirectSettings.autoRedirect) {
        toast.error(`Primary providers currently unresponsive. Opening secure backup gateway...`);
        triggerRedirect(redirectSettings.backupUrl);
      } else if (redirectSettings.primaryUrl && redirectSettings.autoRedirect) {
        toast.error(`Switching to backup secure gateway...`);
        triggerRedirect(redirectSettings.primaryUrl);
      }
    }
  };

  const handleRetry = () => {
    setIframeLoading(true);
    setIframeError(false);
    if (iframeRef.current && activeProvider) {
      iframeRef.current.src = activeProvider.provider_url;
    }
  };

  // Failover Timeout Tracker
  useEffect(() => {
    if (activeProvider && iframeLoading && !isRedirecting) {
      if (failoverTimeoutRef.current) clearTimeout(failoverTimeoutRef.current);
      
      // 15 seconds timeout for widget load detection
      failoverTimeoutRef.current = setTimeout(() => {
        if (iframeLoading) {
          console.warn(`Provider ${activeProvider.provider_name} load timeout`);
          handleIframeError('TIMEOUT');
        }
      }, 15000);
    }
    
    return () => {
      if (failoverTimeoutRef.current) clearTimeout(failoverTimeoutRef.current);
    };
  }, [activeProvider, iframeLoading, isRedirecting]);

  // ─── No providers configured ───
  if (!providerLoading && providers.length === 0 && !redirectSettings.redirectEnabled) {
    return (
      <div className="max-w-xl mx-auto py-12 text-center">
        <div className="w-16 h-16 rounded-2xl bg-secondary/30 flex items-center justify-center mx-auto mb-5 border border-border/50">
          <CreditCard className="w-8 h-8 text-muted-foreground/30" />
        </div>
        <h3 className="text-lg font-bold text-foreground mb-2">No Purchase Providers Available</h3>
        <p className="text-sm text-muted-foreground max-w-sm mx-auto">
          Crypto purchase providers are currently being configured. Please try again later or use the direct deposit option.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header Bar */}
      <div className="flex items-center justify-between gap-4 p-5 rounded-3xl bg-primary/5 border border-primary/10">
        <div className="flex gap-4 items-center">
          <div className="w-12 h-12 rounded-2xl bg-gradient-gold flex items-center justify-center text-white shadow-gold">
            <CreditCard className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-foreground text-sm uppercase tracking-wide">Buy Crypto with Card</h3>
            <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">Visa & Mastercard Supported</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-[10px] text-muted-foreground font-black uppercase mb-1">Instant Purchase</p>
          <div className="flex gap-1 justify-end">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse delay-75" />
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse delay-150" />
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-5 gap-8">
        {/* ─── Left Column: Provider Embed ─── */}
        <div className="lg:col-span-3 space-y-5">
          {/* Provider Selector */}
          <div className="flex items-center justify-between gap-4">
            <div className="relative flex-1" ref={dropdownRef}>
              <button 
                onClick={() => setProviderDropdownOpen(!providerDropdownOpen)}
                className="w-full flex items-center gap-3 h-14 px-5 bg-card border border-border rounded-2xl hover:border-primary/30 transition-all group"
              >
                <div className="w-8 h-8 rounded-xl bg-secondary flex items-center justify-center overflow-hidden shrink-0">
                  {activeProvider?.provider_logo ? (
                    <img src={activeProvider.provider_logo} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <Globe className="w-4 h-4 text-muted-foreground/40" />
                  )}
                </div>
                <div className="flex flex-col items-start flex-1 min-w-0">
                  <span className="text-xs font-bold text-foreground truncate w-full text-left">
                    {providerLoading ? "Loading..." : activeProvider?.provider_name || "Select Provider"}
                  </span>
                  <span className="text-[9px] text-muted-foreground font-bold uppercase tracking-widest">
                    {activeProvider?.provider_type === 'Primary' && '★ Primary Provider'}
                    {activeProvider?.provider_type === 'Secondary' && 'Secondary Provider'}
                    {activeProvider?.provider_type === 'Backup' && 'Backup Provider'}
                    {!activeProvider && 'No provider selected'}
                  </span>
                </div>
                <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${providerDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Dropdown */}
              <AnimatePresence>
                {providerDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -5, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -5, scale: 0.95 }}
                    className="absolute top-full left-0 right-0 mt-2 z-50 bg-card border border-border rounded-2xl shadow-huge overflow-hidden"
                  >
                    <div className="p-3 border-b border-border bg-secondary/20">
                      <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest px-2">Available Providers</p>
                    </div>
                    <div className="p-2 max-h-64 overflow-y-auto">
                      {providers.map((provider) => (
                        <button
                          key={provider.id}
                          onClick={() => handleProviderSwitch(provider)}
                          className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                            activeProvider?.id === provider.id
                              ? 'bg-primary/10 text-primary'
                              : 'hover:bg-secondary text-foreground'
                          }`}
                        >
                          <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center overflow-hidden shrink-0 border border-border">
                            {provider.provider_logo ? (
                              <img src={provider.provider_logo} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <Globe className="w-4 h-4 text-muted-foreground/40" />
                            )}
                          </div>
                          <div className="flex flex-col items-start flex-1 min-w-0">
                            <span className="text-xs font-bold truncate w-full text-left">{provider.provider_name}</span>
                            <span className="text-[9px] text-muted-foreground font-medium truncate w-full text-left">
                              {provider.provider_description || new URL(provider.provider_url).hostname}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            {provider.provider_type === 'Primary' && (
                              <span className="px-2 py-0.5 rounded-full bg-gradient-gold text-white text-[8px] font-black uppercase tracking-tighter shadow-sm">Primary</span>
                            )}
                            {activeProvider?.id === provider.id && <CheckCircle className="w-4 h-4 text-primary" />}
                          </div>
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <Button
              variant="outline"
              size="icon"
              onClick={handleRetry}
              className="h-14 w-14 shrink-0 rounded-2xl border-border hover:bg-primary/10 hover:text-primary transition-all"
              title="Reload Provider"
              disabled={redirectSettings.redirectEnabled || isRedirecting}
            >
              <RefreshCw className={`w-4 h-4 ${iframeLoading || isRedirecting ? 'animate-spin' : ''}`} />
            </Button>
          </div>

          {/* Provider Embed / Redirect Container */}
          <div className="relative rounded-3xl border border-border overflow-hidden bg-card shadow-sm" style={{ minHeight: '520px' }}>
            
            {/* Redirect State */}
            <AnimatePresence>
              {(isRedirecting || redirectSettings.redirectEnabled) && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 z-30 bg-card flex flex-col items-center justify-center gap-6 p-8 text-center"
                >
                  <div className="relative">
                    <div className="w-20 h-20 rounded-3xl bg-primary/10 flex items-center justify-center border border-primary/20">
                      <ShieldCheck className="w-10 h-10 text-primary" />
                    </div>
                    {isRedirecting && (
                      <svg className="absolute inset-0 w-full h-full -rotate-90 animate-spin" viewBox="0 0 100 100">
                        <circle cx="50" cy="50" r="48" fill="none" stroke="currentColor" strokeWidth="2" className="text-primary/20" />
                        <circle cx="50" cy="50" r="48" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="300" strokeDashoffset="250" className="text-primary" />
                      </svg>
                    )}
                  </div>
                  
                  <div>
                    <h3 className="text-xl font-bold text-foreground mb-2">Secure Payment Gateway</h3>
                    {redirectSettings.showMessage ? (
                      <p className="text-sm font-medium text-muted-foreground max-w-sm mx-auto leading-relaxed">
                        Crypto purchase is opening in a secure dedicated window. Redirecting...
                      </p>
                    ) : (
                       <p className="text-sm font-medium text-muted-foreground max-w-sm mx-auto leading-relaxed">
                        Routing you to our trusted payment partner.
                      </p>
                    )}
                  </div>

                  {!redirectSettings.autoRedirect && !isRedirecting && (
                     <Button 
                       onClick={() => triggerRedirect(redirectSettings.primaryUrl || redirectSettings.backupUrl, true)}
                       variant="hero" 
                       className="shadow-gold text-white font-black uppercase tracking-widest px-8 rounded-2xl h-14 w-full max-w-xs mt-4"
                     >
                        Open Provider <ExternalLink className="w-4 h-4 ml-2" />
                     </Button>
                  )}
                  
                  {isRedirecting && (
                     <div className="flex items-center gap-2 mt-4 text-[10px] font-black tracking-widest uppercase text-primary">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary animate-ping" />
                        Awaiting your return
                     </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Loading Overlay */}
            <AnimatePresence>
              {(iframeLoading || providerLoading) && !redirectSettings.redirectEnabled && !isRedirecting && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 z-20 bg-card flex flex-col items-center justify-center gap-5"
                >
                  <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
                    <Loader2 className="w-7 h-7 text-primary animate-spin" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-bold text-foreground mb-1">Loading {activeProvider?.provider_name || "Provider"}...</p>
                    <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">Establishing secure connection</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Error State */}
            {iframeError && !iframeLoading && (
              <div className="absolute inset-0 z-20 bg-card flex flex-col items-center justify-center gap-5 p-8">
                <div className="w-14 h-14 rounded-2xl bg-red-500/10 flex items-center justify-center">
                  <AlertTriangle className="w-7 h-7 text-red-500" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-bold text-foreground mb-1">Provider Unavailable</p>
                  <p className="text-xs text-muted-foreground max-w-xs">
                    {activeProvider?.provider_name} is temporarily unavailable. Try another provider or retry.
                  </p>
                </div>
                <div className="flex gap-3">
                  <Button variant="outline" className="h-10 rounded-xl text-xs font-bold" onClick={handleRetry}>
                    <RefreshCw className="w-3 h-3 mr-2" /> Retry
                  </Button>
                  {(redirectSettings.primaryUrl || activeProvider) && (
                    <Button
                      variant="outline"
                      className="h-10 rounded-xl text-xs font-bold"
                      onClick={() => triggerRedirect(redirectSettings.primaryUrl || activeProvider?.provider_url || '', true)}
                    >
                      <ExternalLink className="w-3 h-3 mr-2" /> Open Manual Gateway
                    </Button>
                  )}
                </div>
              </div>
            )}

            {/* Iframe */}
            {activeProvider && !providerLoading && !redirectSettings.redirectEnabled && !isRedirecting && (
              <iframe
                ref={iframeRef}
                src={activeProvider.provider_url}
                title={activeProvider.provider_name}
                className="w-full border-0"
                style={{ height: '520px' }}
                onLoad={handleIframeLoad}
                onError={() => handleIframeError('LOAD_ERROR')}
                sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox"
                allow="payment; camera"
              />
            )}
          </div>

          {/* Provider Info Footer */}
          {activeProvider && (
            <div className="flex items-center gap-3 px-5 py-3 rounded-2xl bg-secondary/20 border border-border/50">
              <ShieldCheck className="w-4 h-4 text-green-500 shrink-0" />
              <p className="text-[10px] text-muted-foreground font-bold leading-relaxed">
                Purchases are processed securely by <span className="text-foreground font-black">{activeProvider.provider_name}</span>. 
                Your card details are never stored on our servers.
              </p>
            </div>
          )}
        </div>

        {/* ─── Right Column: Wallet Info ─── */}
        <div className="lg:col-span-2 space-y-5">
          {/* Wallet Address Section */}
          <div className="p-6 rounded-3xl bg-card border border-border shadow-sm space-y-5">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-black text-foreground uppercase tracking-widest flex items-center gap-2">
                <Wallet className="w-4 h-4 text-primary" /> Deposit Address
              </h4>
              <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-green-500/10 border border-green-500/20">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                <span className="text-[8px] font-black text-green-500 uppercase tracking-tighter">Secure</span>
              </div>
            </div>

            {/* Coin Selector */}
            <div>
              <label className="text-[10px] font-black text-muted-foreground mb-3 block uppercase tracking-widest">Select Asset</label>
              <div className="flex gap-2">
                {["BTC", "ETH", "USDT"].map((c) => (
                  <button
                    key={c}
                    onClick={() => setSelectedCoin(c)}
                    className={`flex-1 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all border ${
                      selectedCoin === c
                        ? "bg-gradient-gold text-white shadow-gold border-transparent"
                        : "bg-secondary/40 text-muted-foreground hover:border-primary/20 border-border"
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>

            {/* Address */}
            {currentWallet ? (
              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-black text-muted-foreground mb-2 block uppercase tracking-widest">Wallet Address</label>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-12 bg-secondary border border-border font-mono text-[10px] rounded-xl flex items-center px-4 overflow-x-auto no-scrollbar text-foreground">
                      {currentWallet.address}
                    </div>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-12 w-12 shrink-0 border-border rounded-xl hover:bg-primary hover:text-primary-foreground transition-all group"
                      onClick={handleCopyAddress}
                    >
                      <Copy className="w-4 h-4 group-hover:scale-110 transition-transform" />
                    </Button>
                  </div>
                </div>

                {/* Network Badge */}
                {currentWallet.network && (
                  <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-primary/10 border border-primary/20">
                    <Zap className="w-3 h-3 text-primary" />
                    <span className="text-[10px] font-bold text-primary uppercase tracking-widest">Network: {currentWallet.network}</span>
                  </div>
                )}

                {/* QR Code */}
                <div className="flex flex-col items-center gap-3 pt-2">
                  <div className="p-3 bg-white shadow-lg rounded-2xl w-36 h-36 border border-border">
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${currentWallet.address}`}
                      alt="Deposit QR"
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <span className="text-[9px] uppercase tracking-[0.2em] text-primary font-black">Scan to Deposit</span>
                </div>
              </div>
            ) : (
              <div className="p-6 rounded-2xl bg-secondary/30 border border-border text-center">
                <p className="text-xs text-muted-foreground italic">
                  Deposit address for {selectedCoin} is temporarily unavailable.
                </p>
              </div>
            )}
          </div>

          {/* Instructions */}
          <div className="p-5 rounded-2xl bg-secondary/20 border border-border/50 space-y-3">
            <h4 className="text-[10px] font-black text-foreground uppercase tracking-widest flex items-center gap-2">
              <Info className="w-3 h-3 text-primary" /> How to Buy
            </h4>
            <ol className="text-[10px] text-muted-foreground font-medium space-y-2 leading-relaxed list-decimal pl-4">
              <li>Copy your <span className="text-primary font-bold">{selectedCoin}</span> wallet address above</li>
              <li>Select a provider from the panel on the left</li>
              <li>Paste your wallet address into the provider</li>
              <li>Complete your purchase using your debit or credit card</li>
              <li>Funds will be credited automatically after confirmation</li>
            </ol>
          </div>

          {/* Warning */}
          <div className="flex items-start gap-3 p-4 rounded-2xl bg-amber-500/5 border border-amber-500/10">
            <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
            <div>
              <p className="text-[10px] text-amber-600 font-bold uppercase tracking-widest mb-1">Important</p>
              <p className="text-[10px] text-muted-foreground font-medium leading-relaxed">
                Only send <span className="text-foreground font-bold">{selectedCoin}</span> to this address
                {currentWallet?.network && <> via the <span className="text-primary font-bold">{currentWallet.network}</span> network</>}.
                Sending other assets may result in permanent loss.
              </p>
            </div>
          </div>

          {/* Security Footer */}
          <div className="text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-secondary rounded-full border border-border">
              <ShieldCheck className="w-3 h-3 text-green-600" />
              <span className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Secure Encrypted Payment</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
