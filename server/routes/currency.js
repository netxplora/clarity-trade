import express from 'express';
import axios from 'axios';
import * as db from '../db/json-db.js';

const router = express.Router();

let cachedRates = {
    USD: 1,
    EUR: 0.92,
    GBP: 0.79,
    NGN: 1450, // Added NGN as fallback interest
    lastUpdated: new Date().toISOString()
};

const fetchNewRates = async () => {
    try {
        const resp = await axios.get('https://api.exchangerate-api.com/v4/latest/USD');
        if (resp.data && resp.data.rates) {
            cachedRates = {
                ...resp.data.rates,
                lastUpdated: new Date().toISOString()
            };
        }
    } catch (err) {
        console.error("Failed to fetch rates, using cache:", err.message);
    }
};

// Update rates every 30 minutes
setInterval(fetchNewRates, 30 * 60 * 1000);
fetchNewRates(); // Initial fetch

router.get('/rates', (req, res) => {
    res.json(cachedRates);
});

router.post('/preference', async (req, res) => {
    const { userId, type, currency } = req.body;
    if (!userId || !currency) return res.status(400).json({ error: 'Missing parameters' });
    
    try {
        const user = await db.updateUserCurrency(userId, type || 'preferred', currency);
        if (!user) return res.status(404).json({ error: 'User not found' });
        res.json({ success: true, user });
    } catch (err) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;
