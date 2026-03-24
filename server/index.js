import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import cryptoRoutes from './routes/crypto.js';
import adminRoutes from './routes/admin.js';
import copyRoutes from './routes/copytrading.js';
import currencyRoutes from './routes/currency.js';
import userRoutes from './routes/user.js';
import themeRoutes from './routes/theme.js';
import marketRoutes from './routes/market.js';
import * as db from './db/json-db.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Simulation Engine for Copy Trading PnL
// Simulates one "trade" update every 10 seconds for all active copy sessions
const startSimulation = () => {
  setInterval(async () => {
    try {
      const data = await db.readDb();
      const activeSessions = (data.copy_trades || []).filter(ct => ct.status === 'active');
      
      for (const session of activeSessions) {
        // Random performance shift (-2% to +3% per tick)
        const volatility = (Math.random() * 0.05) - 0.02; 
        const pnlShift = session.allocated_amount * volatility;
        
        const newPnl = session.pnl + pnlShift;
        const newValue = session.allocated_amount + newPnl;

        await db.updateCopyTrade(session.id, { 
          pnl: newPnl,
          current_value: newValue
        });
      }
    } catch (err) {
      console.error('Simulation Error:', err);
    }
  }, 10000); 
};

startSimulation();

// Routes
app.use('/api/crypto', cryptoRoutes);
app.use('/api/admin/crypto', adminRoutes);
app.use('/api/copytrading', copyRoutes);
app.use('/api/currency', currencyRoutes);
app.use('/api/user', userRoutes);
app.use('/api/theme', themeRoutes);
app.use('/api/market', marketRoutes);

app.get('/', (req, res) => {
  res.json({ message: 'Clarity Trade Backend API is running' });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
