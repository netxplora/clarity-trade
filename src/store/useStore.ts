import { create } from 'zustand';
import { supabase } from '@/lib/supabase';

export interface AppUser {
    id: string | number;
    name: string;
    email: string;
    phone: string;
    role: string;
    status: string;
    kyc: string;
    frozen: boolean;
    joined: string;
    balanceNum: number;
    cryptoBalanceNum: number;
    fiatBalanceNum: number;
    tradingBalance: number;
    copyTradingBalance: number;
    balances: Record<string, number>;
    referralCode?: string;
    default_currency?: string;
    preferred_currency?: string;
    theme_preference?: string;
    admin_theme_preference?: string;
    avatar_url?: string;
    current_plan?: string;
}

export interface Trade {
    id: string;
    user_id: string;
    asset: string;
    amount: number;
    type: string;
    status: string;
    pnl: number;
    created_at: string;
    open_price?: number;
    close_price?: number;
    leverage?: number;
    [key: string]: any;
}

export interface CopySession {
    id: string;
    user_id: string;
    trader_id: string;
    status: string;
    pnl: number;
    allocated_amount: number;
    trader_name?: string;
    avatar_url?: string;
    ranking_level?: number;
    [key: string]: any;
}

export interface Notification {
    id: string;
    user_id: string;
    title: string;
    message: string;
    is_read: boolean;
    type: string;
    created_at: string;
    [key: string]: any;
}

export interface Referral {
    id: string;
    referrer_id: string;
    referee_id: string;
    referee_name?: string;
    referee_email?: string;
    status: string;
    bonus_earned: number;
    created_at: string;
}

export interface Transaction {
    id: string;
    user_id: string;
    type: string;
    amount: number;
    asset: string;
    status: string;
    date?: string;
    created_at?: string;
    [key: string]: any;
}

export interface DepositWallet {
    id: string;
    coin: string;
    address: string;
    network: string;
    [key: string]: any;
}

export interface ProTrader {
    id: string;
    name: string;
    avatar_url: string;
    ranking_level: number;
    [key: string]: any;
}

export interface AuditLog {
    id: string;
    user_id?: string;
    user_name: string;
    action: string;
    details: string;
    type: string;
    created_at: string;
    [key: string]: any;
}

/** Granular loading states for layered UI rendering */
export interface LoadingStates {
    profile: boolean;
    trades: boolean;
    sessions: boolean;
    transactions: boolean;
    notifications: boolean;
    referrals: boolean;
    adminData: boolean;
}

/** Error states for fallback UI */
export interface ErrorStates {
    profile: string | null;
    trades: string | null;
    sessions: string | null;
    transactions: string | null;
    notifications: string | null;
    referrals: string | null;
    adminData: string | null;
}

export interface AppState {
    user: {
        id: string;
        name: string;
        email: string;
        phone: string;
        role: 'user' | 'admin';
        status: string;
        kyc: string;
        frozen: boolean;
        joined: string;
        tradingBalance: number;
        copyTradingBalance: number;
        fiatBalanceNum: number;
        cryptoBalanceNum: number;
        balances: Record<string, number>;
        referralCode?: string;
        preferred_currency?: string;
        avatar_url?: string;
        current_plan?: string;
        theme_preference?: 'light' | 'dark' | 'system';
        admin_theme_preference?: 'light' | 'dark' | 'system';
    } | null;
    balance: {
        total: number;
        available: number;
        invested: number;
        copyTrading: number;
        totalProfit: number;
        copySessions: number;
        totalTrades: number;
        winRate: number;
        maxDrawdown: number;
    };
    activeTrades: Trade[];
    tradeHistory: Trade[];
    activeSessions: CopySession[];
    notifications: Notification[];
    referrals: Referral[];
    users: AppUser[];
    proTraders: ProTrader[];
    depositWallets: DepositWallet[];
    auditLogs: AuditLog[];
    transactions: Transaction[];
    displayCurrency: string;
    exchangeRates: Record<string, number>;
    
    /** Granular loading states */
    loadingStates: LoadingStates;
    /** Error states for fallback UI */
    errorStates: ErrorStates;
    
    setUser: (user: AppState['user']) => void;
    setBalanceStats: (stats: Partial<AppState['balance']>) => void;
    setActiveSessions: (sessions: CopySession[]) => void;
    setTradeHistory: (trades: Trade[]) => void;
    setActiveTrades: (trades: Trade[]) => void;
    setNotifications: (alerts: Notification[]) => void;
    setCurrency: (currency: string, persists?: boolean) => Promise<void>;
    setExchangeRates: (rates: Record<string, number>) => void;
    formatCurrency: (amount: number, asset?: string) => string;
    logout: () => Promise<void>;
    reset: () => void;
    fetchAppData: (userId?: string) => Promise<void>;
    setRoleTheme: (theme: 'light' | 'dark' | 'system', role: 'user' | 'admin') => Promise<void>;
    markNotificationAsRead: (id: string | 'all') => Promise<void>;
    dismissNotification: (id: string, isGlobal?: boolean) => Promise<void>;
    addAuditLog: (log: { action: string, details?: string, type: string, user?: string }) => Promise<void>;
    /** Legacy loading flag — true only during initial profile fetch */
    isLoading: boolean;
    isAuthInitialized: boolean;
    hasActiveSession: boolean | null;
}

// Crypto price lookup used for portfolio valuation
const CRYPTO_PRICES: Record<string, number> = { 
    btc: 65000, eth: 3500, usdt: 1, sol: 145, 
    usdc: 1, xrp: 0.62, bnb: 580, matic: 0.9, dot: 8.2 
};

const DEFAULT_LOADING: LoadingStates = {
    profile: false, trades: false, sessions: false,
    transactions: false, notifications: false, referrals: false, adminData: false,
};

const DEFAULT_ERRORS: ErrorStates = {
    profile: null, trades: null, sessions: null,
    transactions: null, notifications: null, referrals: null, adminData: null,
};

const DEFAULT_BALANCE = {
    total: 0, available: 0, invested: 0, copyTrading: 0,
    totalProfit: 0, copySessions: 0, totalTrades: 0, winRate: 0, maxDrawdown: 0,
};

/** Debounce timer for real-time sync events */
let syncDebounceTimer: ReturnType<typeof setTimeout> | null = null;
const SYNC_DEBOUNCE_MS = 800;

/** Calculates total crypto value from a balances object */
function calcCryptoTotal(crypto: Record<string, number>): number {
    return Object.entries(crypto).reduce((acc, [coin, amount]) => {
        return acc + (Number(amount) * (CRYPTO_PRICES[coin.toLowerCase()] || 0));
    }, 0);
}

export const useStore = create<AppState>((set, get) => ({
    user: null,
    isLoading: false,
    isAuthInitialized: false,
    hasActiveSession: null,
    loadingStates: { ...DEFAULT_LOADING },
    errorStates: { ...DEFAULT_ERRORS },
    balance: { ...DEFAULT_BALANCE },
    activeTrades: [],
    tradeHistory: [],
    activeSessions: [],
    notifications: [],
    referrals: [],
    users: [],
    proTraders: [],
    depositWallets: [],
    auditLogs: [],
    transactions: [],

    setUser: (user) => set((state) => {
        if (!user) return { user: null, balance: { ...state.balance, total: 0, available: 0, invested: 0, copyTrading: 0 } };
        
        const fiat = Number(user.fiatBalanceNum ?? 0);
        const trading = Number(user.tradingBalance ?? 0);
        const copyTrading = Number(user.copyTradingBalance ?? 0);
        const cryptoTotal = Number(user.cryptoBalanceNum ?? 0);

        return { 
            user, 
            balance: {
                ...state.balance,
                available: fiat,
                total: fiat + trading + copyTrading + cryptoTotal,
                invested: trading,
                copyTrading: copyTrading
            }
        };
    }),

    setBalanceStats: (stats) => set((state) => ({ balance: { ...state.balance, ...stats } })),
    setActiveSessions: (sessions) => set({ activeSessions: sessions }),
    setTradeHistory: (trades) => set({ tradeHistory: trades }),
    setActiveTrades: (trades) => set({ activeTrades: trades }),
    setNotifications: (alerts) => set({ notifications: alerts }),
    
    displayCurrency: 'USD',
    exchangeRates: { USD: 1, EUR: 0.92, GBP: 0.79 },

    setExchangeRates: (rates) => set({ exchangeRates: rates }),

    setCurrency: async (currency, persists = true) => {
        const { user } = get();
        set({ displayCurrency: currency });
        
        if (persists && user) {
            try {
                await supabase.from('profiles').update({ preferred_currency: currency }).eq('id', user.id);
                set({ user: { ...user, preferred_currency: currency } });
            } catch (err) {
                console.error("Failed to save currency preference", err);
            }
        }
    },

    formatCurrency: (amount, asset = 'USD') => {
        const { displayCurrency, exchangeRates } = get();
        const rate = exchangeRates[displayCurrency] || 1;
        const converted = amount * rate;
        
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: displayCurrency,
            minimumFractionDigits: amount < 1 ? 4 : 2,
            maximumFractionDigits: amount < 1 ? 6 : 2,
        }).format(converted);
    },

    logout: async () => {
        await supabase.auth.signOut();
        get().reset();
    },

    reset: () => set({
        user: null,
        balance: { ...DEFAULT_BALANCE },
        activeTrades: [],
        tradeHistory: [],
        activeSessions: [],
        notifications: [],
        referrals: [],
        transactions: [],
        hasActiveSession: false,
        isLoading: false,
        loadingStates: { ...DEFAULT_LOADING },
        errorStates: { ...DEFAULT_ERRORS },
    }),

    setRoleTheme: async (theme, role) => {
        const { user } = get();
        if (!user) return;

        const themeKey = role === 'admin' ? 'admin_theme_preference' : 'theme_preference';
        set({ user: { ...user, [themeKey]: theme } });

        try {
            await supabase.from('profiles').update({ [themeKey]: theme }).eq('id', user.id);
        } catch (err) {
            console.error("Failed to save theme preference", err);
        }
    },

    dismissNotification: async (id, isGlobal = false) => {
        const { user, notifications } = get();
        if (!user) return;
        
        try {
            set({ notifications: notifications.filter(n => n.id !== id) });
            
            if (isGlobal) {
                 const targetNotif = notifications.find(n => n.id === id);
                 const currentDismissed = targetNotif?.dismissed_by || [];
                 if (!currentDismissed.includes(user.id)) {
                     await supabase.from('notifications').update({ dismissed_by: [...currentDismissed, user.id] }).eq('id', id);
                 }
            } else {
                 await supabase.from('notifications').delete().eq('id', id);
            }
        } catch (err) {
            console.error("Failed to dismiss notification", err);
        }
    },

    markNotificationAsRead: async (id) => {
        const { user, notifications } = get();
        if (!user) return;
        
        try {
            if (id === 'all') {
                await supabase.from('notifications').update({ is_read: true }).eq('user_id', user.id);
                set({ notifications: notifications.map(n => ({ ...n, is_read: true })) });
            } else {
                await supabase.from('notifications').update({ is_read: true }).eq('id', id);
                set({ notifications: notifications.map(n => n.id === id ? { ...n, is_read: true } : n) });
            }
        } catch (err) {
            console.error("Failed to mark notifications as read", err);
        }
    },

    addAuditLog: async (log) => {
        const { user, auditLogs } = get();
        try {
            const payload = {
                action: log.action,
                details: log.details || '',
                type: log.type,
                user_id: user?.id,
                user_name: log.user || user?.name || 'System'
            };
            
            const { data, error } = await supabase.from('audit_logs').insert(payload).select().single();
            if (!error && data) {
                set({ auditLogs: [data, ...auditLogs] });
            }
        } catch (err) {
            console.error("Failed to add audit log", err);
        }
    },

    fetchAppData: async (userId?: string) => {
        const { user, setTradeHistory, setActiveTrades, setActiveSessions, setBalanceStats, setNotifications } = get();
        const targetId = userId || user?.id;
        if (!targetId) return;

        // Mark profile as loading (legacy + granular)
        set({ 
            isLoading: true,
            loadingStates: {
                profile: true, trades: true, sessions: true,
                transactions: true, notifications: true, referrals: true, adminData: true,
            },
            errorStates: { ...DEFAULT_ERRORS },
        });
        
        try {
            // ── PHASE 1: Profile Fetch (Critical, Blocking) ──
            let profile = null;
            let retries = 0;
            const maxRetries = 5;

            while (retries < maxRetries) {
                const { data, error } = await supabase
                    .from('profiles')
                    .select('*, balances(*)')
                    .eq('id', targetId)
                    .maybeSingle();
                
                if (error) {
                    console.error(`Profile fetch error (Attempt ${retries + 1}/${maxRetries}):`, error);
                }

                if (data) {
                    profile = data;
                    break;
                }
                
                retries++;
                if (retries < maxRetries) {
                    await new Promise(r => setTimeout(r, 1500));
                }
            }

            if (!profile) {
                console.error("Critical: Profile not found after retries. Attempting to recover...");
                try {
                    const { data: authData } = await supabase.auth.getUser();
                    if (authData?.user) {
                        const email = authData.user.email || '';
                        const name = authData.user.user_metadata?.full_name || authData.user.user_metadata?.name || email.split('@')[0] || 'Trader';
                        
                        const { data: recoveredProfile } = await supabase
                            .from('profiles')
                            .upsert({ id: targetId, email: email, name: name, role: 'user', status: 'Active', kyc: 'Pending' })
                            .select('*, balances(*)')
                            .maybeSingle();
                        
                        if (!recoveredProfile) {
                            throw new Error("Force upsert didn't return a profile");
                        }
                        
                        await supabase.from('balances').upsert({
                            user_id: targetId,
                            fiat_balance: 0,
                            trading_balance: 0,
                            copy_trading_balance: 0,
                            crypto_balances: {bnb: 0, btc: 0, eth: 0, sol: 0, usdc: 0, usdt: 0}
                        }).select().maybeSingle();

                        profile = recoveredProfile;
                    } else {
                        set({ 
                            isLoading: false, 
                            loadingStates: { ...DEFAULT_LOADING },
                            errorStates: { ...get().errorStates, profile: 'No authenticated user found' }
                        });
                        return;
                    }
                } catch (recoveryErr) {
                    console.error("Recovery failed:", recoveryErr);
                    set({ 
                        isLoading: false, 
                        loadingStates: { ...DEFAULT_LOADING },
                        errorStates: { ...get().errorStates, profile: 'Profile recovery failed' }
                    });
                    return;
                }
            }

            const b = Array.isArray(profile.balances) ? profile.balances[0] : profile.balances;
            const crypto = b?.crypto_balances || {};
            const cryptoTotal = calcCryptoTotal(crypto);

            const userData = {
                id: profile.id,
                name: profile.name,
                email: profile.email,
                phone: profile.phone || '',
                role: profile.role,
                status: profile.status,
                kyc: profile.kyc,
                frozen: profile.frozen,
                joined: profile.created_at,
                fiatBalanceNum: Number(b?.fiat_balance || 0),
                tradingBalance: Number(b?.trading_balance || 0),
                copyTradingBalance: Number(b?.copy_trading_balance || 0),
                cryptoBalanceNum: cryptoTotal,
                balances: crypto,
                referralCode: profile.referral_code,
                preferred_currency: profile.preferred_currency || 'USD',
                avatar_url: profile.avatar_url,
                current_plan: profile.current_plan,
                theme_preference: profile.theme_preference,
                admin_theme_preference: profile.admin_theme_preference
            };

            const balanceData = {
                total: userData.fiatBalanceNum + userData.tradingBalance + userData.copyTradingBalance + userData.cryptoBalanceNum,
                available: userData.fiatBalanceNum,
                invested: userData.tradingBalance,
                copyTrading: userData.copyTradingBalance,
                totalProfit: get().balance.totalProfit,
                copySessions: get().balance.copySessions,
                totalTrades: get().balance.totalTrades,
                winRate: get().balance.winRate,
                maxDrawdown: get().balance.maxDrawdown
            };

            // ── PHASE 2: Render Immediately — set user + balance, clear profile loading ──
            set({ 
                user: userData as any, 
                balance: balanceData, 
                isLoading: false,
                loadingStates: { ...get().loadingStates, profile: false },
                errorStates: { ...get().errorStates, profile: null },
            });

            const isAdmin = profile.role === 'admin';

            // ── PHASE 3: Critical Data (parallel, non-blocking) ──
            // Trades
            supabase.from('trades').select('*').eq('user_id', targetId).order('created_at', { ascending: false })
                .then(({ data: trades, error }) => {
                    if (error) {
                        set(s => ({ 
                            loadingStates: { ...s.loadingStates, trades: false },
                            errorStates: { ...s.errorStates, trades: 'Failed to load trades' }
                        }));
                        return;
                    }
                    if (trades) {
                        setTradeHistory(trades);
                        setActiveTrades(trades.filter((t: any) => t.status === 'Open'));
                        setBalanceStats({ totalTrades: trades.length + get().balance.copySessions });
                    }
                    set(s => ({ loadingStates: { ...s.loadingStates, trades: false } }));
                }, err => {
                    console.warn("Trades fetch failed", err);
                    set(s => ({ 
                        loadingStates: { ...s.loadingStates, trades: false },
                        errorStates: { ...s.errorStates, trades: 'Trades unavailable' }
                    }));
                });

            // Copy Trading Sessions + Pro Traders (parallel batch)
            Promise.all([
                supabase.from('active_sessions').select('*').eq('user_id', targetId).in('status', ['active', 'paused']),
                supabase.from('copy_traders').select('*').order('created_at', { ascending: false })
            ]).then(([ { data: sessions, error: sessErr }, { data: proTraders, error: ptErr } ]) => {
                if (proTraders) set({ proTraders });
                if (sessions) {
                    setActiveSessions(sessions.map(s => {
                        const trader = proTraders?.find((t: any) => t.id === s.trader_id);
                        return {
                            ...s,
                            trader_name: s.trader_name || trader?.name,
                            avatar_url: s.avatar_url || trader?.avatar_url,
                            ranking_level: s.ranking_level || trader?.ranking_level
                        };
                    }));
                    setBalanceStats({ copySessions: sessions.length, totalTrades: sessions.length + get().tradeHistory.length });
                }
                if (sessErr) {
                    set(s => ({ errorStates: { ...s.errorStates, sessions: 'Sessions unavailable' } }));
                }
                set(s => ({ loadingStates: { ...s.loadingStates, sessions: false } }));
            }).catch(err => {
                console.warn("Sessions fetch failed", err);
                set(s => ({ 
                    loadingStates: { ...s.loadingStates, sessions: false },
                    errorStates: { ...s.errorStates, sessions: 'Sessions unavailable' }
                }));
            });

            // ── PHASE 4: Deferred Data (secondary priority, non-blocking) ──
            // Transactions
            supabase.from('transactions').select('*').eq('user_id', targetId).order('created_at', { ascending: false })
                .then(({ data: transactions, error }) => {
                    if (!error && transactions) {
                        set({ transactions: transactions.map((t: any) => ({ ...t, date: t.created_at || t.date })) });
                    }
                    if (error) {
                        set(s => ({ errorStates: { ...s.errorStates, transactions: 'Transactions unavailable' } }));
                    }
                    set(s => ({ loadingStates: { ...s.loadingStates, transactions: false } }));
                }, err => {
                    console.warn("Transactions fetch failed", err);
                    set(s => ({ 
                        loadingStates: { ...s.loadingStates, transactions: false },
                        errorStates: { ...s.errorStates, transactions: 'Transactions unavailable' }
                    }));
                });

            // Notifications
            supabase.from('notifications').select('*')
                .or(isAdmin ? `user_id.eq.${targetId},user_id.is.null` : `user_id.eq.${targetId},type.eq.GLOBAL`)
                .order('created_at', { ascending: false }).limit(50)
                .then(({ data: notifs, error }) => {
                    if (!error && notifs) {
                        setNotifications(notifs.filter((n: any) => !n.dismissed_by?.includes(targetId)));
                    }
                    if (error) {
                        set(s => ({ errorStates: { ...s.errorStates, notifications: 'Notifications unavailable' } }));
                    }
                    set(s => ({ loadingStates: { ...s.loadingStates, notifications: false } }));
                }, err => {
                    console.warn("Notifs fetch failed", err);
                    set(s => ({ 
                        loadingStates: { ...s.loadingStates, notifications: false },
                        errorStates: { ...s.errorStates, notifications: 'Notifications unavailable' }
                    }));
                });

            // Referrals
            supabase.from('referrals').select('*, referee:referee_id(name, email)').eq('referrer_id', targetId)
                .then(({ data: referrals, error }) => {
                    if (!error && referrals) {
                        set({ referrals });
                    }
                    if (error) {
                        set(s => ({ errorStates: { ...s.errorStates, referrals: 'Referrals unavailable' } }));
                    }
                    set(s => ({ loadingStates: { ...s.loadingStates, referrals: false } }));
                }, err => {
                    console.warn("Referrals fetch failed", err);
                    set(s => ({ 
                        loadingStates: { ...s.loadingStates, referrals: false },
                        errorStates: { ...s.errorStates, referrals: 'Referrals unavailable' }
                    }));
                });

            // ── PHASE 5: Admin-Only Data ──
            if (isAdmin) {
                Promise.all([
                    supabase.from('profiles').select('*, balances(*)').order('created_at', { ascending: false }),
                    supabase.from('deposit_wallets').select('*'),
                    supabase.from('audit_logs').select('*').order('created_at', { ascending: false }).limit(100),
                ]).then(([{ data: users }, { data: wallets }, { data: logs }]) => {
                    if (users) set({ users });
                    if (wallets) set({ depositWallets: wallets });
                    if (logs) set({ auditLogs: logs });
                    set(s => ({ loadingStates: { ...s.loadingStates, adminData: false } }));
                }).catch(err => {
                    console.warn("Admin data fetch failed", err);
                    set(s => ({ 
                        loadingStates: { ...s.loadingStates, adminData: false },
                        errorStates: { ...s.errorStates, adminData: 'Admin data unavailable' }
                    }));
                });
            } else {
                set(s => ({ loadingStates: { ...s.loadingStates, adminData: false } }));
            }

        } catch (err) {
            console.error("Critical State Sync Error:", err);
            set({ 
                isLoading: false,
                loadingStates: { ...DEFAULT_LOADING },
                errorStates: { ...get().errorStates, profile: 'Unexpected error during data sync' }
            });
        }
    }
}));

/**
 * Debounced sync helper — prevents real-time subscription floods
 * from triggering redundant full data re-fetches.
 */
export function debouncedSync(userId: string) {
    if (syncDebounceTimer) clearTimeout(syncDebounceTimer);
    syncDebounceTimer = setTimeout(() => {
        useStore.getState().fetchAppData(userId);
    }, SYNC_DEBOUNCE_MS);
}
