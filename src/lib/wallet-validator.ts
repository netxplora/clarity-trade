import { validateWalletBackend } from "./api";

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

  // Generic fallback
  if (address.length < 20 || address.length > 100) {
    return { isValid: false, error: "Wallet address length appears invalid" };
  }

  return { isValid: true };
};

/**
 * Enhanced Wallet Validation with Backend Check
 */
export const validateWalletAddress = async (address: string, coin: string, network?: string): Promise<{ isValid: boolean; error?: string }> => {
  // 1. Sync check (fast)
  const syncResult = validateWalletAddressSync(address, coin);
  if (!syncResult.isValid) return syncResult;

  // 2. Async Backend check (thorough)
  const backendResult = await validateWalletBackend(address, coin, network);
  return backendResult;
};

