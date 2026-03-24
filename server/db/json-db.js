import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import cache from '../utils/cache.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.join(__dirname, '../db.json');

// Cache keys
const CACHE_KEYS = {
    SETTINGS: 'system:settings',
    TRADERS: 'market:traders',
    SUMMARY: 'admin:summary'
};

async function ensureDb() {
  try {
    await fs.access(DB_PATH);
    const data = JSON.parse(await fs.readFile(DB_PATH, 'utf-8'));
    let modified = false;
    
    const requiredKeys = {
      transactions: [],
      copy_trades: [],
      users: [
        { 
          id: 'u123', 
          name: 'John Doe',
          role: 'admin', 
          balances: { btc: 0, eth: 0, usdt: 10000, usdc: 0, fiat: 5000 },
          default_currency: 'USD',
          preferred_currency: null
        }
      ],
      settings: { 
          platformFeePercent: 2.0,
          feeWalletAddress: '',
          feeWalletNetwork: 'ERC-20',
          feeCollectedTotal: 0,
          feeEnabled: true,
          minWithdrawalAmount: 10,
          maxWithdrawalAmount: 50000,
          kycRequiredForWithdrawal: true,
          copyTradingEnabled: true,
          minCopyAllocation: 100,
          commissionAutoDeduct: 10
      },
      fee_ledger: []
    };

    for (const [key, defaultValue] of Object.entries(requiredKeys)) {
      if (!data[key]) {
        data[key] = defaultValue;
        modified = true;
      }
    }

    if (modified) {
      await fs.writeFile(DB_PATH, JSON.stringify(data, null, 2));
    }
  } catch (err) {
    await fs.writeFile(DB_PATH, JSON.stringify({
      transactions: [],
      copy_trades: [],
      users: [
        { 
          id: 'u123', 
          name: 'John Doe',
          role: 'admin', 
          balances: { btc: 0, eth: 0, usdt: 10000, usdc: 0, fiat: 5000 }
        }
      ],
      settings: {
          platformFeePercent: 2.0,
          feeWalletAddress: '',
          feeWalletNetwork: 'ERC-20',
          feeCollectedTotal: 0,
          feeEnabled: true,
          minWithdrawalAmount: 10,
          maxWithdrawalAmount: 50000,
          kycRequiredForWithdrawal: true,
          copyTradingEnabled: true,
          minCopyAllocation: 100,
          commissionAutoDeduct: 10
      },
      fee_ledger: []
    }, null, 2));
  }
}

export async function readDb() {
  await ensureDb();
  const data = await fs.readFile(DB_PATH, 'utf-8');
  return JSON.parse(data);
}

export async function writeDb(data) {
  await fs.writeFile(DB_PATH, JSON.stringify(data, null, 2));
  // Invalidate dashboard summaries on ANY write that can affect summaries
  await cache.del(CACHE_KEYS.SUMMARY);
}

export async function getTransactions() {
  // CRITICAL: Financial data bypasses cache for absolute accuracy
  const db = await readDb();
  return db.transactions;
}

export async function addTransaction(tx) {
  const db = await readDb();
  db.transactions.unshift({
    ...tx,
    id: `tx_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
    created_at: new Date().toISOString()
  });
  await writeDb(db);
  return db.transactions[0];
}

export async function updateTransaction(id, updates) {
  const db = await readDb();
  const index = db.transactions.findIndex(t => t.id === id || t.provider_tx_id === id);
  if (index !== -1) {
    db.transactions[index] = { ...db.transactions[index], ...updates, updated_at: new Date().toISOString() };
    await writeDb(db);
    return db.transactions[index];
  }
  return null;
}

export async function getUser(id) {
    // Personal user profiles should be fetched fresh or have per-user cache
    const db = await readDb();
    return db.users.find(u => u.id === id);
}

export async function updateUserBalance(id, currency, amountChange) {
    const db = await readDb();
    const index = db.users.findIndex(u => u.id === id);
    if (index !== -1) {
        const user = db.users[index];
        const currentBalance = user.balances[currency.toLowerCase()] || 0;
        user.balances[currency.toLowerCase()] = currentBalance + amountChange;
        await writeDb(db);
        return user;
    }
    return null;
}

export async function updateUserCurrency(id, type, currency) {
    const db = await readDb();
    const index = db.users.findIndex(u => u.id === id);
    if (index !== -1) {
        if (type === 'preferred') {
            db.users[index].preferred_currency = currency;
        } else {
            db.users[index].default_currency = currency;
        }
        await writeDb(db);
        return db.users[index];
    }
    return null;
}

export async function updateUser(id, updates) {
    const db = await readDb();
    const index = db.users.findIndex(u => u.id === id);
    if (index !== -1) {
        db.users[index] = { ...db.users[index], ...updates };
        await writeDb(db);
        return db.users[index];
    }
    return null;
}

export async function getCopyTrades(userId) {
    // Filtered user sessions are semi-dynamic but usually better fresh
    const db = await readDb();
    if (userId) return db.copy_trades.filter(ct => ct.userId === userId);
    return db.copy_trades;
}

export async function addCopyTrade(trade) {
    const db = await readDb();
    const newTrade = { ...trade, id: `ct_${Date.now()}`, status: 'active', pnl: 0, current_value: trade.allocated_amount, created_at: new Date().toISOString() };
    db.copy_trades.push(newTrade);
    await writeDb(db);
    return newTrade;
}

export async function updateCopyTrade(id, updates) {
    const db = await readDb();
    const index = db.copy_trades.findIndex(t => t.id === id);
    if (index !== -1) {
        db.copy_trades[index] = { ...db.copy_trades[index], ...updates, updated_at: new Date().toISOString() };
        await writeDb(db);
        return db.copy_trades[index];
    }
    return null;
}

export async function getSettings() {
    // Settings are read-heavy but change infrequently
    return await cache.wrap(CACHE_KEYS.SETTINGS, async () => {
        const db = await readDb();
        return db.settings;
    }, 600); // 10 min cache
}

export async function updateSettings(updates) {
    const db = await readDb();
    db.settings = { ...db.settings, ...updates };
    await writeDb(db);
    // Invalidate settings cache
    await cache.del(CACHE_KEYS.SETTINGS);
    return db.settings;
}

// ── Fee Engine ──
export async function processFee(transactionId, userId, grossAmount, assetType) {
    const db = await readDb();
    const feePercent = db.settings.feeEnabled ? (db.settings.platformFeePercent || 2) : 0;
    const feeAmount = +(grossAmount * (feePercent / 100)).toFixed(8);
    const netAmount = +(grossAmount - feeAmount).toFixed(8);

    const entry = { id: `fee_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`, transaction_id: transactionId, user_id: userId, gross_amount: grossAmount, fee_percent: feePercent, fee_amount: feeAmount, net_amount: netAmount, asset: assetType, wallet_address: db.settings.feeWalletAddress || 'NOT_CONFIGURED', created_at: new Date().toISOString() };

    if (!db.fee_ledger) db.fee_ledger = [];
    db.fee_ledger.unshift(entry);
    db.settings.feeCollectedTotal = (db.settings.feeCollectedTotal || 0) + feeAmount;
    await writeDb(db);
    
    // Specifically invalidate settings as total collected changed
    await cache.del(CACHE_KEYS.SETTINGS);

    return { feeAmount, netAmount, entry };
}

export async function getFeeLedger(limit = 50) {
    const db = await readDb();
    return (db.fee_ledger || []).slice(0, limit);
}

