import express from 'express';
import * as db from '../db/json-db.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

// Apply general auth to all routes in this file
router.use(requireAuth);

// Get user profile
router.get('/profile', async (req, res) => {
    res.json(req.user);
});

// Update user profile
router.post('/profile', async (req, res) => {
    const { name, phone, email } = req.body;
    try {
        const userId = req.user.id;
        const currentDb = await db.readDb();
        const idx = currentDb.users.findIndex(u => u.id === userId);
        
        if (idx !== -1) {
            if (name) currentDb.users[idx].name = name;
            if (phone) currentDb.users[idx].phone = phone;
            if (email) currentDb.users[idx].email = email;
            
            await db.writeDb(currentDb);
            res.json(currentDb.users[idx]);
        } else {
            res.status(404).json({ error: 'User not found' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Failed to update profile' });
    }
});

// Update user preferences (currency, etc)
router.post('/preferences', async (req, res) => {
    const { preferred_currency, notification_settings } = req.body;
    try {
        const userId = req.user.id;
        let updatedUser = req.user;
        
        if (preferred_currency) {
            updatedUser = await db.updateUserCurrency(userId, 'preferred', preferred_currency);
        }
        
        // Simulating other preference updates
        if (notification_settings) {
            const currentDb = await db.readDb();
            const idx = currentDb.users.findIndex(u => u.id === userId);
            currentDb.users[idx].notification_settings = notification_settings;
            await db.writeDb(currentDb);
            updatedUser = currentDb.users[idx];
        }

        res.json(updatedUser);
    } catch (error) {
        res.status(500).json({ error: 'Failed to update preferences' });
    }
});

// Get user activity (transactions + copy trades for specific user)
router.get('/activity', async (req, res) => {
    try {
        const dbData = await db.readDb();
        const userId = req.user.id;
        
        const transactions = dbData.transactions.filter(t => t.userId === userId || t.user_id === userId);
        const copyTrades = dbData.copy_trades.filter(ct => ct.userId === userId);
        
        res.json({
            transactions,
            copyTrades,
            lastLogin: new Date().toISOString(), // Mock
            securityAlerts: [] // Mock
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch activity' });
    }
});

// POST /api/user/validate-wallet
router.post('/validate-wallet', async (req, res) => {
    const { address, coin, network } = req.body;
    
    if (!address || !coin) {
        return res.status(400).json({ isValid: false, error: 'Address and coin are required' });
    }

    const coinUpper = coin.toUpperCase();
    const networkUpper = (network || '').toUpperCase();

    // Ethereum and EVM chains
    if (['ETH', 'USDT', 'USDC', 'BNB', 'MATIC'].includes(coinUpper) && networkUpper !== 'TRC20') {
        const ethRegex = /^0x[a-fA-F0-9]{40}$/;
        const isValid = ethRegex.test(address);
        return res.json({ 
            isValid, 
            error: isValid ? null : `Invalid ${coinUpper} address format for ${networkUpper || 'EVM'} network. Must start with 0x.` 
        });
    }

    // Bitcoin
    if (coinUpper === 'BTC') {
        const btcRegex = /^(?:[13][a-km-zA-HJ-NP-Z1-9]{25,34}|bc1[ac-hj-np-z02-9]{11,71})$/i;
        const isValid = btcRegex.test(address);
        return res.json({ 
            isValid, 
            error: isValid ? null : 'Invalid BTC address. Supported formats: Legacy (1...), P2SH (3...), Bech32 (bc1...).' 
        });
    }

    // Tron / TRC20
    if (networkUpper === 'TRC20' || (coinUpper === 'USDT' && address.startsWith('T'))) {
        const tronRegex = /^T[A-Za-z1-9]{33}$/;
        const isValid = tronRegex.test(address);
        return res.json({ 
            isValid, 
            error: isValid ? null : 'Invalid TRC20 address. Tron addresses must start with T.' 
        });
    }

    // Default basic validation
    const isValid = address.length >= 20 && address.length <= 100;
    res.json({ 
        isValid, 
        error: isValid ? null : 'Unrecognized address format or length.' 
    });
});

export default router;
