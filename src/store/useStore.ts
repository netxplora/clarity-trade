import { create } from 'zustand';
import { supabase } from '@/lib/supabase';

// Types
export type Trade = {
  id: string;
  pair: string;
  type: 'Buy' | 'Sell';
  amount: number;
  entryPrice: number;
  currentPrice: number;
  pnl: number;
  status: 'Open' | 'Closed';
  orderType: 'market' | 'limit' | 'stop-loss' | 'take-profit';
  time: string | number;
};

export type CopyTrader = {
  id: string;
  name: string;
  roi: number;
  risk_score: number;
  followers: number;
  max_drawdown: number;
  win_rate: number;
  total_trades: number;
  status: 'Active' | 'Paused' | 'Not Copied';
  invested?: number;
  categories?: string[];
  ranking_score?: number;
  ranking_level?: string;
  is_trending?: boolean;
  min_amount?: number;
  avatar_url?: string;
  dedicated_features?: string[];
  monthly_roi?: number;
  drawdown?: number;
  min_plan?: string;
};

export type Transaction = {
  id: string;
  type: 'Deposit' | 'Withdrawal' | 'Copy Allocation' | 'Bank Transfer';
  amount: number;
  asset: string;
  status: 'Completed' | 'Pending' | 'Rejected' | 'Expired';
  date: string;
  external_id?: string;
  userId?: string;
};

export type Referral = {
  id: string;
  referrerId: number | string;
  refereeName: string;
  refereeEmail: string;
  status: 'Joined' | 'Trading' | 'Completed';
  bonusEarned: number;
  date: string;
};

export type AppUser = {
  id: string | number;
  name: string;
  email: string;
  phone: string;
  role: 'user' | 'admin';
  status: string;
  kyc: string;
  balanceNum: number;
  cryptoBalanceNum: number;
  fiatBalanceNum: number;
  tradingBalance: number;
  copyTradingBalance: number;
  balances: {
    btc: number;
    eth: number;
    usdt: number;
    usdc: number;
    sol?: number;
    bnb?: number;
  };
  joined: string;
  frozen: boolean;
  referralCode: string;
  referredBy?: string;
  default_currency: string;
  preferred_currency: string | null;
  theme_preference: 'light' | 'dark' | 'system';
  admin_theme_preference: 'light' | 'dark' | 'system';
  avatar_url?: string;
  current_plan: string;
};

export type ProTraderApplication = {
  id: string;
  name: string;
  email: string;
  status: 'Approved' | 'Pending' | 'Rejected';
  followers: string;
  roi: string;
  commission: string;
  applied: string;
};

export type DepositWallet = {
  id: string;
  coin: string;
  network?: string;
  address: string;
  status: 'Active' | 'Inactive';
};

export type AuditLog = {
  id: string;
  action: string;
  user: string;
  timestamp: string;
  type: 'Security' | 'Finance' | 'Trading' | 'System';
};

export type AppNotification = {
  id: string;
  user_id: string | null;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  created_at: string;
};

interface AppState {
  user: AppUser | null;
  setUser: (user: AppUser | null) => void;
  logout: () => void;
  
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
  setBalanceStats: (stats: Partial<AppState['balance']>) => void;
  transactions: Transaction[];
  addTransaction: (tx: Omit<Transaction, 'id' | 'date'>) => void;
  updateTransactionStatus: (id: string, status: 'Completed' | 'Rejected' | 'Expired') => void;
  
  activeTrades: Trade[];
  tradeHistory: Trade[];
  openTrade: (trade: Omit<Trade, 'id' | 'pnl' | 'status' | 'time'>) => void;
  closeTrade: (id: string) => void;
  
  availableTraders: CopyTrader[];
  copiedTraders: CopyTrader[];
  startCopying: (traderId: string, amount: number) => void;
  stopCopying: (traderId: string) => void;

  notifications: AppNotification[];
  setNotifications: (alerts: AppNotification[]) => void;
  markNotificationAsRead: (id: string) => void;

  referrals: Referral[];
  addReferral: (referral: Omit<Referral, 'id' | 'date'>) => void;
  fetchAppData: () => Promise<void>;
  setTradeHistory: (trades: any[]) => void;
  setActiveTrades: (trades: any[]) => void;
  users: AppUser[];
  freezeUser: (id: string | number) => void;
  approveKyc: (id: string | number) => void;
  updateUserBalance: (id: string | number, amount: number, currency: string) => void;
  
  proTraders: ProTraderApplication[];
  updateProTraderStatus: (id: string, status: 'Approved' | 'Rejected') => void;

  depositWallets: DepositWallet[];
  addDepositWallet: (wallet: Omit<DepositWallet, 'id'>) => void;
  updateDepositWallet: (id: string, wallet: Partial<DepositWallet>) => void;
  deleteDepositWallet: (id: string) => void;

  auditLogs: AuditLog[];
  addAuditLog: (log: Omit<AuditLog, 'id' | 'timestamp'>) => void;
  addProTrader: (trader: Omit<ProTraderApplication, 'id' | 'applied'>) => void;

  displayCurrency: string;
  exchangeRates: Record<string, number>;
  setCurrency: (currency: string, persists?: boolean) => void;
  setExchangeRates: (rates: Record<string, number>) => void;
  formatCurrency: (amount: number, asset?: string) => string;
  getPlanLevel: (planName?: string) => number;
  setRoleTheme: (theme: 'light' | 'dark' | 'system', role: 'user' | 'admin') => void;
}

const PLAN_HIERARCHY: Record<string, number> = {
  'Starter': 0,
  'Silver': 1,
  'Gold': 2,
  'Elite': 3
};

export const useStore = create<AppState>((set, get) => ({
  user: null,
  setUser: (user) => set((state) => {
    if (!user) return { user, balance: { total: 0, available: 0, invested: 0, copyTrading: 0, totalProfit: 0, copySessions: 0, totalTrades: 0, winRate: 0, maxDrawdown: 0 } };
    
    // Aggregate all balance types for the unified balance object
    const fiat = Number(user.fiatBalanceNum || 0);
    const trading = Number(user.tradingBalance || 0);
    const copyTrading = Number((user as any).copyTradingBalance || 0);
    const crypto = Number((user as any).cryptoBalanceNum || 0);

    return { 
      user, 
      balance: {
        ...state.balance,
        available: fiat,
        total: fiat + trading + copyTrading + crypto,
        invested: trading,
        copyTrading: copyTrading
      }
    };
  }),
  setBalanceStats: (stats) => set((state) => ({ balance: { ...state.balance, ...stats } })),
  setTradeHistory: (trades) => set({ tradeHistory: trades }),
  setActiveTrades: (trades) => set({ activeTrades: trades }),
  logout: async () => {
    await supabase.auth.signOut();
    set({ user: null });
  },
  
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
    const baseAmount = asset === 'USD' ? amount : (amount / (exchangeRates[asset] || 1));
    const converted = baseAmount * rate;

    const symbols: Record<string, string> = { USD: '$', EUR: '€', GBP: '£' };
    return `${symbols[displayCurrency] || '$'}${converted.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  },

  getPlanLevel: (planName) => {
    const hierarchy: Record<string, number> = {
      'Starter': 0,
      'Silver': 1,
      'Gold': 2,
      'Elite': 3
    };
    return hierarchy[planName || 'Starter'] ?? 0;
  },

  balance: {
    total: 0,
    available: 0,
    invested: 0,
    copyTrading: 0,
    totalProfit: 0,
    copySessions: 0,
    totalTrades: 0,
    winRate: 0,
    maxDrawdown: 0,
  },
  
  transactions: [],
  addTransaction: (tx) => set((state) => ({
    transactions: [{ ...tx, id: Math.random().toString(36).substr(2, 9), date: new Date().toISOString(), status: tx.status || 'Pending' }, ...state.transactions],
  })),

  updateTransactionStatus: (id, status) => set((state) => ({
    transactions: state.transactions.map(t => t.id === id ? { ...t, status } : t)
  })),

  notifications: [],
  setNotifications: (alerts) => set({ notifications: alerts }),
  markNotificationAsRead: async (id) => {
    try {
      if (id === 'all') {
         const unreadIds = get().notifications.filter(n => !n.is_read).map(n => n.id);
         if (unreadIds.length > 0) {
            await supabase.from('notifications').update({ is_read: true }).in('id', unreadIds);
            set((state) => ({ notifications: state.notifications.map(n => ({ ...n, is_read: true })) }));
         }
      } else {
         await supabase.from('notifications').update({ is_read: true }).eq('id', id);
         set((state) => ({ notifications: state.notifications.map(n => n.id === id ? { ...n, is_read: true } : n) }));
      }
    } catch(err) { console.error('Error marking notification read', err); }
  },
  
  activeTrades: [],
  tradeHistory: [],
  
  openTrade: (trade) => set((state) => {
    const newAvailable = state.balance.available - trade.amount;
    if (newAvailable < 0) return state;
    
    const newTrade: Trade = {
      ...trade,
      id: Math.random().toString(36).substr(2, 9),
      pnl: 0,
      status: 'Open',
      orderType: trade.orderType || 'market',
      time: Date.now()
    };
    
    return {
      activeTrades: [newTrade, ...state.activeTrades],
      balance: {
        ...state.balance,
        available: newAvailable,
        invested: state.balance.invested + trade.amount
      }
    };
  }),
  
  closeTrade: (id) => set((state) => {
    const trade = state.activeTrades.find(t => t.id === id);
    if (!trade) return state;
    
    return {
      activeTrades: state.activeTrades.filter(t => t.id !== id),
      tradeHistory: [{ ...trade, status: 'Closed', time: Date.now() }, ...state.tradeHistory],
      balance: {
        ...state.balance,
        available: state.balance.available + trade.amount + trade.pnl,
        invested: state.balance.invested - trade.amount
      }
    };
  }),
  
  availableTraders: [],
  
  copiedTraders: [],
  
  startCopying: (traderId, amount) => set((state) => {
    if (state.balance.available < amount) return state;
    
    const traderConfig = state.availableTraders.find(t => t.id === traderId);
    if (!traderConfig) return state;
    
    const newCopiedTrader: CopyTrader = {
      ...traderConfig,
      status: 'Active',
      invested: amount
    };
    
    return {
      copiedTraders: [...state.copiedTraders, newCopiedTrader],
      balance: {
        ...state.balance,
        available: state.balance.available - amount,
        invested: state.balance.invested + amount
      }
    };
  }),
  
  stopCopying: (traderId) => set((state) => {
    const traderConfig = state.copiedTraders.find(t => t.id === traderId);
    if (!traderConfig) return state;
    
    return {
      copiedTraders: state.copiedTraders.filter(t => t.id !== traderId),
      balance: {
        ...state.balance,
        available: state.balance.available + traderConfig.invested,
        invested: state.balance.invested - traderConfig.invested
      }
    };
  }),
  
  referrals: [],
  
  addReferral: (ref) => set((state) => ({
    referrals: [{ ...ref, id: Math.random().toString(36).substr(2, 9), date: new Date().toISOString() }, ...state.referrals]
  })),

  users: [],
  freezeUser: (id) => set((state) => ({
    users: state.users.map(u => 
      u.id === id ? { ...u, frozen: !u.frozen, status: u.frozen ? "Active" : "Suspended" } : u
    )
  })),
  approveKyc: (id) => set((state) => ({
    users: state.users.map(u => 
      u.id === id ? { ...u, kyc: "Approved", status: "Verified" } : u
    )
  })),
  updateUserBalance: (id, amount, currency) => {
      // This is now handled direct via Supabase in the component
  },

  proTraders: [],
  updateProTraderStatus: (id, status) => set((state) => ({
    proTraders: state.proTraders.map(t => 
      t.id === id ? { ...t, status } : t
    )
  })),

  depositWallets: [],
  addDepositWallet: (wallet) => set((state) => ({
    depositWallets: [...state.depositWallets, { ...wallet, id: Math.random().toString(36).substr(2, 9) }]
  })),
  updateDepositWallet: (id, wallet) => set((state) => ({
    depositWallets: state.depositWallets.map(w => w.id === id ? { ...w, ...wallet } : w)
  })),
  deleteDepositWallet: (id) => set((state) => ({
    depositWallets: state.depositWallets.filter(w => w.id !== id)
  })),

  auditLogs: [],
  addAuditLog: (log) => set((state) => ({
    auditLogs: [{ ...log, id: Math.random().toString(36).substr(2, 9), timestamp: new Date().toISOString() }, ...state.auditLogs]
  })),
  addProTrader: (trader) => set((state) => ({
    proTraders: [{ ...trader, id: 'pt' + Math.random().toString(36).substr(2, 5), applied: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) }, ...state.proTraders]
  })),

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

  fetchAppData: async () => {
    const { user, setUser } = get();
    if (!user?.id) return;

    try {
      const [{ data: profile }, { data: balanceData }] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', user.id).single(),
        supabase.from('balances').select('*').eq('user_id', user.id).maybeSingle()
      ]);

      if (profile && balanceData) {
        // Aggregate full user object as expected by dashboard
        const crypto = balanceData.crypto_balances || {};
        const cryptoPrices: Record<string, number> = { btc: 65000, eth: 3500, usdt: 1, sol: 145, usdc: 1, xrp: 0.62, bnb: 580 };
        const cryptoTotal = Object.entries(crypto).reduce((acc, [coin, amount]) => {
            return acc + (Number(amount) * (cryptoPrices[coin.toLowerCase()] || 0));
        }, 0);

        const fullUser = {
            ...profile,
            fiatBalanceNum: Number(balanceData.fiat_balance || 0),
            tradingBalance: Number(balanceData.trading_balance || 0),
            copyTradingBalance: Number(balanceData.copy_trading_balance || 0),
            cryptoBalanceNum: cryptoTotal,
            balances: crypto,
            joined: new Date(profile.created_at).toLocaleDateString()
        };
        setUser(fullUser);
      }
    } catch (err) {
      console.error("fetchAppData failed", err);
    }
  }
}));
