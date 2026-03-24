import express from 'express';
import * as db from '../db/json-db.js';

const router = express.Router();

// Get active copy sessions for a user
router.get('/active/:userId', async (req, res) => {
    try {
        const trades = await db.getCopyTrades(req.params.userId);
        res.json(trades.filter(t => t.status !== 'stopped'));
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch copy trades' });
    }
});

// Initiate copy trading
router.post('/initiate', async (req, res) => {
    const { userId, traderId, traderName, amount } = req.body;
    
    if (!userId || !traderId || !amount || amount <= 0) {
        return res.status(400).json({ error: 'Invalid parameters' });
    }

    try {
        const user = await db.getUser(userId);
        if (!user) return res.status(404).json({ error: 'User not found' });

        // Ensure sufficient USDT balance (using USDT as base for copy trading)
        if (user.balances.usdt < amount) {
            return res.status(400).json({ error: 'Insufficient USDT balance' });
        }

        // 1. Deduct from main balance
        await db.updateUserBalance(userId, 'usdt', -amount);

        // 2. Create copy trade record
        const newCopyTrade = await db.addCopyTrade({
            userId,
            traderId,
            traderName,
            allocated_amount: parseFloat(amount)
        });

        // 3. Log transaction
        await db.addTransaction({
            userId,
            type: 'Copy Trading Allocation',
            amount: -amount,
            asset: 'USDT',
            status: 'Completed',
            message: `Allocated funds to copy ${traderName}`
        });

        res.json({ 
            success: true, 
            trade: newCopyTrade,
            message: `Successfully allocating $${amount} to copy ${traderName}` 
        });
    } catch (err) {
        console.error('Initiation error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Stop copy trading
router.post('/stop/:id', async (req, res) => {
    try {
        const trade = (await db.getCopyTrades()).find(t => t.id === req.params.id);
        if (!trade || trade.status === 'stopped') {
            return res.status(404).json({ error: 'Session not found or already stopped' });
        }

        const finalValue = trade.current_value;

        // 1. Return funds to main balance
        await db.updateUserBalance(trade.userId, 'usdt', finalValue);

        // 2. Close session
        await db.updateCopyTrade(trade.id, { 
            status: 'stopped', 
            end_date: new Date().toISOString() 
        });

        // 3. Log transaction
        await db.addTransaction({
            userId: trade.userId,
            type: 'Copy Trading Return',
            amount: finalValue,
            asset: 'USDT',
            status: 'Completed',
            message: `Withdrawn funds from ${trade.traderName} (PnL: $${trade.pnl.toFixed(2)})`
        });

        res.json({ success: true, returnedAmount: finalValue });
    } catch (err) {
        res.status(500).json({ error: 'Failed to stop copy trading' });
    }
});

// Toggle Pause
router.post('/pause/:id', async (req, res) => {
    try {
        const trade = (await db.getCopyTrades()).find(t => t.id === req.params.id);
        const newStatus = trade.status === 'active' ? 'paused' : 'active';
        await db.updateCopyTrade(req.params.id, { status: newStatus });
        res.json({ success: true, status: newStatus });
    } catch (err) {
        res.status(500).json({ error: 'Failed to update status' });
    }
});

// Admin Route: Get ALL sessions across all users
router.get('/all', async (req, res) => {
    try {
        const trades = await db.getCopyTrades();
        res.json(trades);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch all sessions' });
    }
});

export default router;
