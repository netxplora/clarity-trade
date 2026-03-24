import express from 'express';
import { readDb, updateUser } from '../db/json-db.js';

const router = express.Router();

router.post('/preference', async (req, res) => {
    const { userId, theme, role } = req.body;
    
    try {
        const themeKey = role === 'admin' ? 'admin_theme_preference' : 'theme_preference';
        
        await updateUser(userId, { [themeKey]: theme });
        
        res.json({ success: true, message: 'Theme preference updated' });
    } catch (err) {
        res.status(500).json({ error: 'Failed to update theme preference' });
    }
});

export default router;
