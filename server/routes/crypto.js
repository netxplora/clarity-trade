import express from 'express';
import axios from 'axios';
import crypto from 'crypto';
import * as db from '../db/json-db.js';
import cache from '../utils/cache.js';

const router = express.Router();

// Fetch supported fiat and crypto assets (Changelly API placeholder)
router.get('/assets', async (req, res) => {
  try {
    const assets = await cache.wrap('market:assets', async () => {
        // In a real implementation: const { data } = await axios.get('https://api.changelly.com/v1/supported_crypto')
        return {
            cryptoAssets: [
                { symbol: 'btc', name: 'Bitcoin', logo: 'https://changenow.io/images/coins/btc.svg' },
                { symbol: 'eth', name: 'Ethereum', logo: 'https://changenow.io/images/coins/eth.svg' },
                { symbol: 'usdt', name: 'Tether (ERC20)', logo: 'https://changenow.io/images/coins/usdt.svg' },
                { symbol: 'usdc', name: 'USD Coin', logo: 'https://changenow.io/images/coins/usdc.svg' }
            ],
            fiatCurrencies: [
                { symbol: 'usd', name: 'US Dollar' },
                { symbol: 'eur', name: 'Euro' },
                { symbol: 'ngn', name: 'Nigerian Naira' }
            ]
        };
    }, 3600); // Cache for 1 hour

    res.json(assets);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch supported assets' });
  }
});

// Calculate rates and fees
router.post('/rates', async (req, res) => {
    const { from, to, amount } = req.body;
    try {
        const settings = await db.getSettings();
        const platformFeePercent = settings.platformFeePercent || 2.0;

        // Use cache for raw exchange rates with short TTL (e.g. 1 minute)
        const rate = await cache.wrap(`market:rate:${to.toLowerCase()}`, async () => {
            // Mock rate fetch (In real: const { data } = await axios.get(`...`))
            const mockRates = { btc: 65100, eth: 3545, usdt: 1.0, usdc: 1.0 };
            return mockRates[to.toLowerCase()] || 1.0;
        }, 60);

        const providerRate = rate; 
        const cryptoAmount = from === 'usd' ? (amount / providerRate) : (amount * providerRate);

        const platformFee = (amount * platformFeePercent) / 100;
        const totalToCharge = parseFloat(amount) + platformFee;

        res.json({
            rate: providerRate,
            cryptoAmount: cryptoAmount.toFixed(8),
            platformFee,
            totalToCharge,
            providerFeeEstimated: (amount * 0.05).toFixed(2)
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to calculate rates' });
    }
});

// Address validation helper
const validateAddress = (coin, address) => {
  if (!address) return false;
  const patterns = {
    btc: /^(1|3|bc1)[a-zA-HJ-NP-Z0-9]{25,62}$/,
    eth: /^0x[a-fA-F0-0]{40}$/,
    usdt: /^(0x|T)[a-zA-Z0-9]{33,42}$/,
    usdc: /^0x[a-fA-F0-0]{40}$/
  };
  return patterns[coin.toLowerCase()]?.test(address) || true; // Fallback to true if unknown coin for now
};

// Initiate purchase
router.post('/buy/initiate', async (req, res) => {
  const { userId, from, to, amount, walletAddress } = req.body;

  // 1. Validation
  if (!validateAddress(to, walletAddress)) {
    return res.status(400).json({ error: `Invalid ${to.toUpperCase()} wallet address format.` });
  }

  if (amount < 30) {
    return res.status(400).json({ error: 'Minimum purchase amount is 30 USD.' });
  }

  try {
    const settings = await db.getSettings();
    const platformFee = (amount * settings.platformFeePercent) / 100;
    const totalAmount = parseFloat(amount) + platformFee;

    const internalTxId = `buy_${Date.now()}`;

    // 2. Prepare Changelly Fiat API Order
    // In a production setup, we would call the Changelly Direct API here:
    /*
    const orderData = {
      from: from.toLowerCase(),
      to: to.toLowerCase(),
      amountFrom: amount,
      walletAddress: walletAddress,
      externalId: internalTxId,
      redirectUrl: `${process.env.CLIENT_URL}/dashboard/wallet?status=success&id=${internalTxId}`,
      webhookUrl: `${process.env.SERVER_URL}/api/crypto/webhook/changelly`
    };

    // Signature Generation (Example for RSA-SHA256)
    const sign = crypto.createSign('SHA256');
    sign.update(JSON.stringify(orderData));
    const signature = sign.sign(process.env.CHANGELLY_PRIVATE_KEY, 'base64');
    
    // const response = await axios.post(process.env.CHANGELLY_API_URL + '/v1/orders', orderData, {
    //   headers: { 'X-Api-Key': process.env.CHANGELLY_API_KEY, 'X-Api-Signature': signature }
    // });
    // const paymentUrl = response.data.url;
    */

    // 3. For the "Native" feeling using the Changelly Buy Widget (Signed Parameters)
    // This allows pre-filling everything without the user typeing again.
    const baseUrl = "https://buy.changelly.com/";
    const params = new URLSearchParams({
      from: from.toLowerCase(),
      to: to.toLowerCase(),
      amount: amount.toString(),
      address: walletAddress,
      recipientWallet: walletAddress, // Ensures pre-fill
      externalId: internalTxId,
      merchantId: process.env.CHANGELLY_API_KEY || "clarity_trade_partner",
      theme: "dark",
      color: "D4AF37" // Matching our gold theme
    });

    const paymentUrl = `${baseUrl}?${params.toString()}`;

    // 4. Storing as Pending
    await db.addTransaction({
      userId,
      provider: 'changelly',
      fiat_amount: amount,
      fiat_currency: from,
      crypto_amount: 0, 
      crypto_type: to,
      wallet_address: walletAddress,
      status: 'Pending',
      internal_id: internalTxId,
      platform_fee: platformFee,
      total_charged: totalAmount
    });

    console.log(`[ONRAMP] Initiated order ${internalTxId} for User ${userId}. Redirecting to: ${paymentUrl}`);

    res.json({ 
      paymentUrl, 
      internalId: internalTxId,
      message: "Order initiated successfully. Redirecting to secure checkout..." 
    });
  } catch (error) {
    console.error('Onramp Initiation Error:', error);
    res.status(500).json({ error: 'Failed to connect to payment provider. Please try again later.' });
  }
});

// Webhook for transaction updates
router.post('/webhook/changelly', async (req, res) => {
  const { status, external_id, amount_to, tx_id } = req.body;
  
  // Security Verify signature (In real life!)
  // const signature = req.headers['x-api-signature'];
  // if (!verifySignature(req.body, signature)) return res.status(401).send();

  try {
    const dbData = await db.readDb();
    const transaction = dbData.transactions.find(t => t.internal_id === external_id);

    if (!transaction) return res.status(404).json({ error: 'Transaction not found' });

    if (status === 'finished' || status === 'success') {
      if (transaction.status !== 'Completed') {
        // Credit wallet
        await db.updateUserBalance(transaction.userId, transaction.crypto_type, amount_to);
        
        // Update transaction
        await db.updateTransaction(transaction.id, {
          status: 'Completed',
          crypto_amount: amount_to,
          provider_tx_id: tx_id
        });
      }
    } else if (status === 'failed' || status === 'refunded') {
        await db.updateTransaction(transaction.id, { status: 'Rejected' });
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

// Fetch pending transactions for user
router.get('/pending/:userId', async (req, res) => {
    try {
        const data = await db.readDb();
        const now = Date.now();
        const EXPIRATION_TIME = 30 * 60 * 1000; // 30 minutes

        const pending = data.transactions.filter(t => {
            if (t.userId != req.params.userId || t.status !== 'Pending') return false;
            
            const created = new Date(t.created_at).getTime();
            if (now - created > EXPIRATION_TIME) {
                // Silently expire in memory for this request, 
                // In real app maybe update DB in background
                return false;
            }
            return true;
        });
        res.json(pending);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch pending' });
    }
});

export default router;
