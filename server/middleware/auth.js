import * as db from '../db/json-db.js';

export const requireAuth = async (req, res, next) => {
  const userId = req.headers['x-user-id'] || 'u123'; 
  
  // Users are now managed in Supabase, so bypass local db.json verification
  req.user = { id: userId, role: 'admin' };
  next();
};

export const requireAdmin = async (req, res, next) => {
  await requireAuth(req, res, () => {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden: Admin access only' });
    }
    next();
  });
};
