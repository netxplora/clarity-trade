import express from 'express';
import cache from '../utils/cache.js';

const router = express.Router();

/**
 * @route GET /api/market/traders
 * @desc Get list of elite traders with performance metrics
 * @access Public
 */
router.get('/traders', async (req, res) => {
    try {
        // Selective caching for public trader listings
        // These don't change every second and are heavy to aggregate
        const traders = await cache.wrap('market:traders', async () => {
            // In a production app, this would be a complex query joining multiple tables
            // with performance calculations (ROI, Win Rate, etc.)
            console.log('[CACHE] MISS: Fetching fresh trader listings from database...');
            
            // Mocking the data that would typically come from Supabase or long-running query
            return [
                { id: 't1', name: 'Alpha Whale', roi: 45.2, win_rate: 82, followers: 1240, risk_score: 3, drawdown: 5.2 },
                { id: 't2', name: 'Crypto Sage', roi: 32.8, win_rate: 75, followers: 850, risk_score: 2, drawdown: 4.1 },
                { id: 't3', name: 'Moon Walker', roi: 128.5, win_rate: 64, followers: 3200, risk_score: 8, drawdown: 15.4 },
                { id: 't4', name: 'Stable Yield', roi: 12.4, win_rate: 94, followers: 2100, risk_score: 1, drawdown: 1.2 }
            ];
        }, 1200); // 20 minute cache

        res.json(traders);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch market data' });
    }
});

/**
 * @route GET /api/market/summary
 * @desc Non-sensitive platform statistics for marketing/dashboard
 */
router.get('/summary', async (req, res) => {
    try {
        const summary = await cache.wrap('market:summary', async () => {
             // Simulate expensive aggregation
             return {
                 totalVolume: '1.2B+',
                 activeTraders: 15420,
                 platformUptime: '99.99%',
                 lastUpdated: new Date().toISOString()
             };
        }, 3600); // 1 hour cache
        
        res.json(summary);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch summary' });
    }
});

export default router;
