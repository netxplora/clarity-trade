import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

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
    cryptoDeposits: any[];
    displayCurrency: string;
    exchangeRates: Record<string, number>;

    /** Realtime Array Patcher */
    handleRealtimeEvent: (table: string, payload: any) => void;

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
    fetchAppData: (userId?: string, force?: boolean) => Promise<void>;
    setRoleTheme: (theme: 'light' | 'dark' | 'system', role: 'user' | 'admin') => Promise<void>;
    markNotificationAsRead: (id: string | 'all') => Promise<void>;
    dismissNotification: (id: string, isGlobal?: boolean) => Promise<void>;
    addAuditLog: (log: { action: string, details?: string, type: string, user?: string }) => Promise<void>;

    /** Polling fallback management */
    startPolling: (userId: string) => void;
    stopPolling: () => void;

    /** Legacy loading flag — true only during initial profile fetch */
    isLoading: boolean;
    isAuthInitialized: boolean;
    hasActiveSession: boolean | null;
    lastFetchTime: number;
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

export const useStore = create<AppState>()(
    persist(
        (set, get) => ({
            user: null,
            isLoading: false,
            isAuthInitialized: false,
            hasActiveSession: null,
            lastFetchTime: 0,
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
            cryptoDeposits: [],

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
                cryptoDeposits: [],
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

            fetchAppData: async (userId?: string, force = false) => {
                const { user, lastFetchTime, setTradeHistory, setActiveTrades, setActiveSessions, setBalanceStats, setNotifications } = get();
                const targetId = userId || user?.id;
                if (!targetId) return;

                const now = Date.now();
                if (!force && lastFetchTime && (now - lastFetchTime < 5000)) {
                    console.log("[Store] Skipping redundant fetch (data is fresh)");
                    return;
                }

                console.log(`[Store] Initiating platform sync for: ${targetId}`);
                if (!user || force) set({ isLoading: true });

                set({
                    lastFetchTime: now,
                    loadingStates: { profile: true, trades: true, sessions: true, transactions: true, notifications: true, referrals: true, adminData: true },
                    errorStates: { ...DEFAULT_ERRORS },
                });

                // ── PHASE 1: Profile Fetch (own try/catch — exceptions NEVER bypass fallback) ──
                let profile: any = null;

                try {
                    console.log("[Store] Phase 1: Fetching user profile...");
                    const { data, error } = await supabase
                        .from('profiles')
                        .select('*, balances(*)')
                        .eq('id', targetId)
                        .maybeSingle();

                    if (data) {
                        profile = data;
                    } else if (error) {
                        console.warn("[Store] Profile query error:", error.message);
                    }
                } catch (fetchErr: any) {
                    console.warn("[Store] Profile fetch exception:", fetchErr.message);
                }

                // Recovery upsert if first fetch failed
                if (!profile) {
                    try {
                        console.log("[Store] Attempting recovery upsert...");
                        const { data: authData } = await supabase.auth.getUser();
                        if (authData?.user) {
                            const email = authData.user.email || '';
                            const name = authData.user.user_metadata?.full_name || authData.user.user_metadata?.name || email.split('@')[0] || 'Trader';

                            const { data: recovered } = await supabase
                                .from('profiles')
                                .upsert({ id: targetId, email, name, role: 'user', status: 'Active', kyc: 'Pending' })
                                .select('*, balances(*)')
                                .maybeSingle();

                            if (recovered) {
                                profile = recovered;
                                await supabase.from('balances').upsert({
                                    user_id: targetId, fiat_balance: 0, trading_balance: 0, copy_trading_balance: 0,
                                    crypto_balances: { bnb: 0, btc: 0, eth: 0, sol: 0, usdc: 0, usdt: 0 }
                                }).then(() => {}, () => {});
                            }
                        }
                    } catch (e: any) {
                        console.warn("[Store] Recovery upsert failed:", e.message);
                    }
                }

                // FINAL FALLBACK: build in-memory profile so dashboard always opens
                if (!profile) {
                    console.warn("[Store] Building fallback profile for dashboard access.");
                    let fallbackEmail = 'user@claritytrade.com';
                    let fallbackName = 'Trader';
                    try {
                        const { data: authData } = await supabase.auth.getUser();
                        if (authData?.user) {
                            fallbackEmail = authData.user.email || fallbackEmail;
                            fallbackName = authData.user.user_metadata?.full_name || fallbackEmail.split('@')[0];
                        }
                    } catch (e) { /* ignore */ }

                    profile = {
                        id: targetId, email: fallbackEmail, name: fallbackName,
                        role: 'user', status: 'Active', kyc: 'Pending',
                        created_at: new Date().toISOString(),
                        balances: { fiat_balance: 0, trading_balance: 0, copy_trading_balance: 0, crypto_balances: {} }
                    };
                    toast.error("Could not load your profile from the database. Showing limited data.");
                }

                // ── PHASE 2: Process profile → commit to store → unblock dashboard ──
                try {
                    const b = Array.isArray(profile.balances) ? profile.balances[0] : profile.balances;
                    const crypto = b?.crypto_balances || {};
                    const cryptoTotal = calcCryptoTotal(crypto);

                    const userData = {
                        id: profile.id, name: profile.name, email: profile.email,
                        phone: profile.phone || '', role: profile.role, status: profile.status,
                        kyc: profile.kyc, frozen: profile.frozen, joined: profile.created_at,
                        fiatBalanceNum: Number(b?.fiat_balance || 0),
                        tradingBalance: Number(b?.trading_balance || 0),
                        copyTradingBalance: Number(b?.copy_trading_balance || 0),
                        cryptoBalanceNum: cryptoTotal, balances: crypto,
                        referralCode: profile.referral_code,
                        preferred_currency: profile.preferred_currency || 'USD',
                        avatar_url: profile.avatar_url, current_plan: profile.current_plan,
                        theme_preference: profile.theme_preference,
                        admin_theme_preference: profile.admin_theme_preference
                    };

                    const balanceData = {
                        total: userData.fiatBalanceNum + userData.tradingBalance + userData.copyTradingBalance + userData.cryptoBalanceNum,
                        available: userData.fiatBalanceNum, invested: userData.tradingBalance,
                        copyTrading: userData.copyTradingBalance,
                        totalProfit: get().balance.totalProfit, copySessions: get().balance.copySessions,
                        totalTrades: get().balance.totalTrades, winRate: get().balance.winRate,
                        maxDrawdown: get().balance.maxDrawdown
                    };

                    set({
                        user: userData as any, balance: balanceData, isLoading: false,
                        loadingStates: { ...get().loadingStates, profile: false },
                        errorStates: { ...get().errorStates, profile: null },
                    });

                    console.log("[Store] Phase 2 complete. Dashboard unblocked.");

                    // ── PHASE 3+: Non-blocking parallel fetches ──
                    const isAdmin = profile.role === 'admin';

                    supabase.from('trades').select('*').eq('user_id', targetId).order('created_at', { ascending: false })
                        .then(({ data: trades, error }) => {
                            if (!error && trades) {
                                setTradeHistory(trades);
                                setActiveTrades(trades.filter((t: any) => t.status === 'Open'));
                                setBalanceStats({ totalTrades: trades.length + get().balance.copySessions });
                            }
                            set(s => ({ loadingStates: { ...s.loadingStates, trades: false } }));
                        }, () => set(s => ({ loadingStates: { ...s.loadingStates, trades: false }, errorStates: { ...s.errorStates, trades: 'Trades unavailable' } })));

                    Promise.all([
                        supabase.from('active_sessions').select('*').eq('user_id', targetId).in('status', ['active', 'paused']),
                        supabase.from('copy_traders').select('*').order('created_at', { ascending: false })
                    ]).then(([{ data: sessions }, { data: proTraders }]) => {
                        if (proTraders) set({ proTraders });
                        if (sessions) {
                            setActiveSessions(sessions.map(s => {
                                const trader = proTraders?.find((t: any) => t.id === s.trader_id);
                                return { ...s, trader_name: s.trader_name || trader?.name, avatar_url: s.avatar_url || trader?.avatar_url, ranking_level: s.ranking_level || trader?.ranking_level };
                            }));
                            setBalanceStats({ copySessions: sessions.length, totalTrades: sessions.length + get().tradeHistory.length });
                        }
                        set(s => ({ loadingStates: { ...s.loadingStates, sessions: false } }));
                    }).catch(() => set(s => ({ loadingStates: { ...s.loadingStates, sessions: false }, errorStates: { ...s.errorStates, sessions: 'Sessions unavailable' } })));

                    supabase.from('transactions').select('*').eq('user_id', targetId).order('created_at', { ascending: false })
                        .then(({ data: txns, error }) => {
                            if (!error && txns) set({ transactions: txns.map((t: any) => ({ ...t, date: t.created_at || t.date })) });
                            set(s => ({ loadingStates: { ...s.loadingStates, transactions: false } }));
                        }, () => set(s => ({ loadingStates: { ...s.loadingStates, transactions: false } })));

                    supabase.from('crypto_deposits').select('*').eq('user_id', targetId).order('created_at', { ascending: false })
                        .then(({ data: deposits }) => { if (deposits) set({ cryptoDeposits: deposits }); }, () => {});

                    supabase.from('notifications').select('*')
                        .or(isAdmin ? `user_id.eq.${targetId},user_id.is.null` : `user_id.eq.${targetId},type.eq.GLOBAL`)
                        .order('created_at', { ascending: false }).limit(50)
                        .then(({ data: notifs, error }) => {
                            if (!error && notifs) setNotifications(notifs.filter((n: any) => !n.dismissed_by?.includes(targetId)));
                            set(s => ({ loadingStates: { ...s.loadingStates, notifications: false } }));
                        }, () => set(s => ({ loadingStates: { ...s.loadingStates, notifications: false } })));

                    supabase.from('referrals').select('*, referee:referee_id(name, email)').eq('referrer_id', targetId)
                        .then(({ data: referrals }) => {
                            if (referrals) set({ referrals });
                            set(s => ({ loadingStates: { ...s.loadingStates, referrals: false } }));
                        }, () => set(s => ({ loadingStates: { ...s.loadingStates, referrals: false } })));

                    if (isAdmin) {
                        Promise.all([
                            supabase.from('profiles').select('*, balances(*)').order('created_at', { ascending: false }),
                            supabase.from('deposit_wallets').select('*'),
                            supabase.from('audit_logs').select('*').order('created_at', { ascending: false }).limit(100),
                            supabase.from('trades').select('*').order('created_at', { ascending: false }),
                            supabase.from('active_sessions').select('*').order('created_at', { ascending: false }),
                        ]).then(([{ data: users }, { data: wallets }, { data: logs }]) => {
                            if (users) {
                                set({ users: users.map(u => {
                                    const bal = Array.isArray(u.balances) ? u.balances[0] : u.balances;
                                    const cr = bal?.crypto_balances || {};
                                    return { ...u, balanceNum: Number(bal?.fiat_balance || 0) + Number(bal?.trading_balance || 0) + Number(bal?.copy_trading_balance || 0) + calcCryptoTotal(cr), balances: cr };
                                })});
                            }
                            if (wallets) set({ depositWallets: wallets });
                            if (logs) set({ auditLogs: logs });
                            set(s => ({ loadingStates: { ...s.loadingStates, adminData: false } }));
                        }).catch(() => set(s => ({ loadingStates: { ...s.loadingStates, adminData: false } })));
                    } else {
                        set(s => ({ loadingStates: { ...s.loadingStates, adminData: false } }));
                    }

                } catch (processingErr: any) {
                    console.error("[Store] Profile processing error:", processingErr);
                    set({ isLoading: false, loadingStates: { ...DEFAULT_LOADING } });
                }
            },

            startPolling: (userId) => {
                const interval = setInterval(() => {
                    console.log("[Sync] Fallback polling check...");
                    get().fetchAppData(userId, false);
                }, 45000); // 45s fallback polling

                (window as any)._syncPolling = interval;
            },

            stopPolling: () => {
                if ((window as any)._syncPolling) {
                    clearInterval((window as any)._syncPolling);
                    (window as any)._syncPolling = null;
                }
            },

            handleRealtimeEvent: (table: string, payload: any) => {
                const state = get();
                const { eventType, new: newRecord, old: oldRecord } = payload;

                if (table === 'trades') {
                    if (eventType === 'INSERT') {
                        set({ tradeHistory: [newRecord, ...state.tradeHistory] });
                        if (newRecord.status === 'Open') {
                            set({ activeTrades: [newRecord, ...state.activeTrades] });
                        }
                    } else if (eventType === 'UPDATE') {
                        set({ tradeHistory: state.tradeHistory.map(t => t.id === newRecord.id ? newRecord : t) });
                        const stillOpen = newRecord.status === 'Open';
                        const wasOpen = state.activeTrades.some(t => t.id === newRecord.id);
                        if (stillOpen && !wasOpen) {
                            set({ activeTrades: [newRecord, ...state.activeTrades] });
                        } else if (!stillOpen && wasOpen) {
                            set({ activeTrades: state.activeTrades.filter(t => t.id !== newRecord.id) });
                        } else if (stillOpen && wasOpen) {
                            set({ activeTrades: state.activeTrades.map(t => t.id === newRecord.id ? newRecord : t) });
                        }
                    } else if (eventType === 'DELETE') {
                        set({
                            tradeHistory: state.tradeHistory.filter(t => t.id !== oldRecord.id),
                            activeTrades: state.activeTrades.filter(t => t.id !== oldRecord.id)
                        });
                    }
                }

                if (table === 'transactions') {
                    if (eventType === 'INSERT') {
                        set({ transactions: [{ ...newRecord, date: newRecord.created_at }, ...state.transactions] });
                    } else if (eventType === 'UPDATE') {
                        set({ transactions: state.transactions.map(t => t.id === newRecord.id ? { ...newRecord, date: newRecord.created_at || newRecord.date } : t) });
                    } else if (eventType === 'DELETE') {
                        set({ transactions: state.transactions.filter(t => t.id !== oldRecord.id) });
                    }
                }

                if (table === 'notifications') {
                    if (eventType === 'INSERT') {
                        set({ notifications: [newRecord, ...state.notifications] });
                    } else if (eventType === 'UPDATE') {
                        set({ notifications: state.notifications.map(n => n.id === newRecord.id ? newRecord : n) });
                    } else if (eventType === 'DELETE') {
                        set({ notifications: state.notifications.filter(n => n.id !== oldRecord.id) });
                    }
                }

                if (table === 'referrals') {
                    if (eventType === 'INSERT') {
                        set({ referrals: [newRecord, ...state.referrals] });
                    } else if (eventType === 'UPDATE') {
                        set({ referrals: state.referrals.map(r => r.id === newRecord.id ? newRecord : r) });
                    } else if (eventType === 'DELETE') {
                        set({ referrals: state.referrals.filter(r => r.id !== oldRecord.id) });
                    }
                }

                if (table === 'crypto_deposits') {
                    if (eventType === 'INSERT') {
                        set({ cryptoDeposits: [newRecord, ...state.cryptoDeposits] });
                    } else if (eventType === 'UPDATE') {
                        set({ cryptoDeposits: state.cryptoDeposits.map(d => d.id === newRecord.id ? newRecord : d) });
                    } else if (eventType === 'DELETE') {
                        set({ cryptoDeposits: state.cryptoDeposits.filter(d => d.id !== oldRecord.id) });
                    }
                }
            },
        }),
        {
            name: 'clarity-trade-storage',
            storage: createJSONStorage(() => localStorage),
            // SECURITY: Only persist non-sensitive display preferences.
            // NEVER persist user identity, role, or balance data in localStorage.
            // These must always be fetched from the server on session restore.
            partialize: (state) => ({
                displayCurrency: state.displayCurrency,
            }),
        }
    ));

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
