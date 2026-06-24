/**
 * Crypto Wallet Address Validator
 * Uses client-side regex validation with optional backend verification.
 * Falls back gracefully if backend is unavailable.
 */

/**
 * Basic Crypto Wallet Address Validator (Sync)
 */
export const validateWalletAddressSync = (address: string, coin: string): { isValid: boolean; error?: string } => {
  if (!address) return { isValid: false, error: "Address is required" };
  
  const coinUpper = coin.toUpperCase();

  // Ethereum and most EVM chains (ERC20, BEP20)
  if (['ETH', 'USDT', 'USDC', 'BNB', 'MATIC'].includes(coinUpper)) {
    const ethRegex = /^0x[a-fA-F0-9]{40}$/;
    if (!ethRegex.test(address)) {
      return { isValid: false, error: `Invalid ${coinUpper} address format (should start with 0x and be 40 hex characters)` };
    }
    return { isValid: true };
  }

  // Bitcoin (Legacy, SegWit, Bech32)
  if (coinUpper === 'BTC') {
    const btcRegex = /^(?:[13][a-km-zA-HJ-NP-Z1-9]{25,34}|bc1[ac-hj-np-z02-9]{11,71})$/i;
    if (!btcRegex.test(address)) {
      return { isValid: false, error: "Invalid BTC address format (supports Legacy, P2SH, and Bech32/SegWit)" };
    }
    return { isValid: true };
  }

  // Solana
  if (coinUpper === 'SOL') {
    const solRegex = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;
    if (!solRegex.test(address)) {
      return { isValid: false, error: "Invalid SOL address format" };
    }
    return { isValid: true };
  }

  // XRP / Ripple
  if (coinUpper === 'XRP') {
    const xrpRegex = /^r[1-9A-HJ-NP-Za-km-z]{24,34}$/;
    if (!xrpRegex.test(address)) {
      return { isValid: false, error: "Invalid XRP address format (should start with 'r')" };
    }
    return { isValid: true };
  }

  // Generic fallback
  if (address.length < 20 || address.length > 100) {
    return { isValid: false, error: "Wallet address length appears invalid" };
  }

  return { isValid: true };
};

/**
 * Enhanced Wallet Validation — uses sync check first,
 * then optionally calls backend. If backend is unreachable,
 * the sync result is used instead of blocking the user.
 */
export const validateWalletAddress = async (address: string, coin: string, _network?: string): Promise<{ isValid: boolean; error?: string }> => {
  // 1. Sync check (fast, always available)
  const syncResult = validateWalletAddressSync(address, coin);
  if (!syncResult.isValid) return syncResult;

  // 2. Backend check (optional, non-blocking)
  try {
    const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5001/api';
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000); // 3s timeout

    const response = await fetch(`${BACKEND_URL}/user/validate-wallet`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ address, coin, network: _network }),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!response.ok) {
      // Backend returned error — fall through to sync result
      console.warn('[WalletValidator] Backend returned non-OK status, using client-side validation');
      return syncResult;
    }

    return await response.json();
  } catch (err) {
    // Backend unreachable — use sync validation result instead of blocking
    console.warn('[WalletValidator] Backend unreachable, using client-side validation only');
    return syncResult;
  }
};
