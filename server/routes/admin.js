import express from 'express';
import * as db from '../db/json-db.js';
import { requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// Apply admin check to all routes in this file
router.use(requireAdmin);

// Get all transactions
router.get('/transactions', async (req, res) => {
    try {
        const transactions = await db.getTransactions();
        res.json(transactions);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch transactions' });
    }
});

// Update transaction status manually (with fee processing)
router.post('/transactions/:id/status', async (req, res) => {
    const { id } = req.params;
    const { status, amount_to } = req.body;
    try {
        const dbData = await db.readDb();
        const transaction = dbData.transactions.find(t => t.id === id || t.internal_id === id);

        if (!transaction) return res.status(404).json({ error: 'Transaction not found' });

        if (status === 'Completed' && transaction.status !== 'Completed') {
            const grossAmount = amount_to || transaction.crypto_amount;
            
            // Process platform fee
            const { feeAmount, netAmount, entry } = await db.processFee(
                transaction.id,
                transaction.userId,
                grossAmount,
                transaction.crypto_type
            );

            // Credit the NET amount (after fee) to the user
            await db.updateUserBalance(transaction.userId, transaction.crypto_type, netAmount);
            
            // Update transaction with fee data
            await db.updateTransaction(transaction.id, { 
                status, 
                crypto_amount: grossAmount,
                fee_amount: feeAmount,
                net_credited: netAmount,
                fee_entry_id: entry.id 
            });
        } else {
            await db.updateTransaction(transaction.id, { status, crypto_amount: amount_to || transaction.crypto_amount });
        }

        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Failed to update transaction status' });
    }
});

// Get settings
router.get('/settings', async (req, res) => {
    try {
        const settings = await db.getSettings();
        res.json(settings);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch settings' });
    }
});

// Update settings
router.post('/settings', async (req, res) => {
    try {
        const currentDb = await db.readDb();
        currentDb.settings = { ...currentDb.settings, ...req.body };
        await db.writeDb(currentDb);
        res.json(currentDb.settings);
    } catch (error) {
        res.status(500).json({ error: 'Failed to update settings' });
    }
});

// ── Fee Wallet Configuration ──
router.post('/settings/fee-wallet', async (req, res) => {
    const { feeWalletAddress, feeWalletNetwork, platformFeePercent, feeEnabled } = req.body;
    try {
        const updates = {};
        if (feeWalletAddress !== undefined) updates.feeWalletAddress = feeWalletAddress;
        if (feeWalletNetwork !== undefined) updates.feeWalletNetwork = feeWalletNetwork;
        if (platformFeePercent !== undefined) updates.platformFeePercent = parseFloat(platformFeePercent);
        if (feeEnabled !== undefined) updates.feeEnabled = feeEnabled;
        const settings = await db.updateSettings(updates);
        res.json(settings);
    } catch (error) {
        res.status(500).json({ error: 'Failed to update fee wallet' });
    }
});

// ── Fee Ledger (history of collected fees) ──
router.get('/fee-ledger', async (req, res) => {
    try {
        const ledger = await db.getFeeLedger(parseInt(req.query.limit) || 50);
        res.json(ledger);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch fee ledger' });
    }
});

// Get user balances
router.get('/users/balances', async (req, res) => {
    try {
        const dbData = await db.readDb();
        const userBalances = dbData.users.map(u => ({
            id: u.id,
            name: u.name,
            email: u.email,
            balances: u.balances
        }));
        res.json(userBalances);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch balances' });
    }
});

export default router;
