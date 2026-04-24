/**
 * Crypto Deposit System — Shared Helpers
 * Covers asset configs, network mappings, reference ID generation,
 * and blockchain explorer URL construction.
 */

import { supabase } from "@/lib/supabase";

export interface AssetConfig {
  symbol: string;
  name: string;
  icon: string;
  color: string;
  networks: NetworkConfig[];
}

export interface NetworkConfig {
  id: string;
  name: string;
  shortName: string;
  /** Warning text shown to user about sending on wrong network */
  warning: string;
}

export const SUPPORTED_ASSETS: AssetConfig[] = [
  {
    symbol: 'BTC',
    name: 'Bitcoin',
    icon: '₿',
    color: 'text-[#F7931A]',
    networks: [
      { id: 'bitcoin', name: 'Bitcoin Network', shortName: 'BTC', warning: 'Only send BTC via the Bitcoin mainnet. Sending via other networks will result in permanent loss.' },
    ],
  },
  {
    symbol: 'ETH',
    name: 'Ethereum',
    icon: 'Ξ',
    color: 'text-[#627EEA]',
    networks: [
      { id: 'erc20', name: 'Ethereum (ERC20)', shortName: 'ERC20', warning: 'Only send ETH or ERC-20 tokens via the Ethereum mainnet.' },
    ],
  },
  {
    symbol: 'USDT',
    name: 'Tether',
    icon: '₮',
    color: 'text-[#26A17B]',
    networks: [
      { id: 'erc20', name: 'Ethereum (ERC20)', shortName: 'ERC20', warning: 'Only send USDT via the ERC-20 network. Sending via TRC-20 or BEP-20 to this address will result in loss.' },
      { id: 'trc20', name: 'Tron (TRC20)', shortName: 'TRC20', warning: 'Only send USDT via the TRC-20 network. Sending via ERC-20 or BEP-20 to this address will result in loss.' },
      { id: 'bep20', name: 'BSC (BEP20)', shortName: 'BEP20', warning: 'Only send USDT via the BEP-20 (BSC) network. Sending via other networks to this address will result in loss.' },
    ],
  },
  {
    symbol: 'USDC',
    name: 'USD Coin',
    icon: '$',
    color: 'text-[#2775CA]',
    networks: [
      { id: 'erc20', name: 'Ethereum (ERC20)', shortName: 'ERC20', warning: 'Only send USDC via the ERC-20 network.' },
      { id: 'bep20', name: 'BSC (BEP20)', shortName: 'BEP20', warning: 'Only send USDC via the BEP-20 (BSC) network.' },
    ],
  },
  {
    symbol: 'BNB',
    name: 'BNB',
    icon: 'B',
    color: 'text-[#F3BA2F]',
    networks: [
      { id: 'bep20', name: 'BSC (BEP20)', shortName: 'BEP20', warning: 'Only send BNB via the BEP-20 (BSC) network.' },
    ],
  },
  {
    symbol: 'SOL',
    name: 'Solana',
    icon: 'S',
    color: 'text-purple-500',
    networks: [
      { id: 'solana', name: 'Solana Network', shortName: 'SOL', warning: 'Only send SOL via the Solana mainnet.' },
    ],
  },
  {
    symbol: 'XRP',
    name: 'Ripple',
    icon: 'X',
    color: 'text-[#23292F]',
    networks: [
      { id: 'ripple', name: 'Ripple Network', shortName: 'XRP', warning: 'Only send XRP via the Ripple mainnet. Destination Tag may be required if specified in address.' },
    ],
  },
  {
    symbol: 'LTC',
    name: 'Litecoin',
    icon: 'Ł',
    color: 'text-[#345D9D]',
    networks: [
      { id: 'litecoin', name: 'Litecoin Network', shortName: 'LTC', warning: 'Only send LTC via the Litecoin mainnet.' },
    ],
  },
  {
    symbol: 'DOGE',
    name: 'Dogecoin',
    icon: 'Ð',
    color: 'text-[#C2A633]',
    networks: [
      { id: 'dogecoin', name: 'Dogecoin Network', shortName: 'DOGE', warning: 'Only send DOGE via the Dogecoin mainnet.' },
    ],
  },
  {
    symbol: 'TRX',
    name: 'Tron',
    icon: 'T',
    color: 'text-[#FF0013]',
    networks: [
      { id: 'trc20', name: 'Tron (TRC20)', shortName: 'TRC20', warning: 'Only send TRX via the TRC-20 network.' },
    ],
  },
  {
    symbol: 'MATIC',
    name: 'Polygon',
    icon: 'P',
    color: 'text-[#8247E5]',
    networks: [
      { id: 'polygon', name: 'Polygon Network', shortName: 'MATIC', warning: 'Only send MATIC via the Polygon mainnet.' },
    ],
  },
];

/** Minimum deposit amounts for each asset to prevent spam/micro-deposits */
export const MIN_DEPOSIT_AMOUNTS: Record<string, number> = {
  BTC: 0.0001,
  ETH: 0.005,
  USDT: 10,
  USDC: 10,
  BNB: 0.02,
  SOL: 0.1,
  XRP: 10,
  LTC: 0.1,
  DOGE: 100,
  TRX: 100,
  MATIC: 10,
};

/** All possible deposit statuses */
export type DepositStatus = 'pending' | 'submitted' | 'under_review' | 'approved' | 'rejected';

export const DEPOSIT_STATUS_CONFIG: Record<DepositStatus, { label: string; color: string; bg: string; border: string }> = {
  pending:      { label: 'Pending',      color: 'text-amber-500',  bg: 'bg-amber-500/10',  border: 'border-amber-500/20' },
  submitted:    { label: 'Submitted',    color: 'text-blue-500',   bg: 'bg-blue-500/10',   border: 'border-blue-500/20' },
  under_review: { label: 'Under Review', color: 'text-purple-500', bg: 'bg-purple-500/10', border: 'border-purple-500/20' },
  approved:     { label: 'Approved',     color: 'text-green-500',  bg: 'bg-green-500/10',  border: 'border-green-500/20' },
  rejected:     { label: 'Rejected',     color: 'text-red-500',    bg: 'bg-red-500/10',    border: 'border-red-500/20' },
};

/**
 * Generate a unique, human-readable deposit reference ID.
 * Format: CT-XXXXXX-XXXX (12 chars)
 */
export function generateReferenceId(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // No ambiguous chars (0/O, 1/I)
  let result = 'CT-';
  for (let i = 0; i < 6; i++) result += chars.charAt(Math.floor(Math.random() * chars.length));
  result += '-';
  for (let i = 0; i < 4; i++) result += chars.charAt(Math.floor(Math.random() * chars.length));
  return result;
}

/**
 * Build a blockchain explorer URL for a given TXID and network.
 */
export function getExplorerUrl(networkId: string, txid: string): string {
  const explorers: Record<string, string> = {
    bitcoin: `https://www.blockchain.com/btc/tx/${txid}`,
    erc20:   `https://etherscan.io/tx/${txid}`,
    trc20:   `https://tronscan.org/#/transaction/${txid}`,
    bep20:   `https://bscscan.com/tx/${txid}`,
    solana:  `https://solscan.io/tx/${txid}`,
  };
  return explorers[networkId] || `https://www.blockchain.com/search?search=${txid}`;
}

/**
 * Fetch real-time price for a given asset from a public API.
 * Defaults to 1 if fetching fails or asset is a stablecoin.
 */
export async function fetchCryptoPrice(symbol: string): Promise<number> {
  const stablecoins = ['USDT', 'USDC', 'DAI', 'BUSD'];
  if (stablecoins.includes(symbol.toUpperCase())) return 1.0;

  try {
    const response = await fetch(`https://api.binance.com/api/v3/ticker/price?symbol=${symbol.toUpperCase()}USDT`);
    const data = await response.json();
    if (data.price) return parseFloat(data.price);
    
    // Fallback to CryptoCompare if Binance fails
    const ccRes = await fetch(`https://min-api.cryptocompare.com/data/price?fsym=${symbol.toUpperCase()}&tsyms=USD`);
    const ccData = await ccRes.json();
    return ccData.USD || 1.0;
  } catch (err) {
    console.error(`Price fetch error for ${symbol}:`, err);
    return 1.0;
  }
}

/**
 * Find the matching wallet from the deposit_wallets table based on asset symbol and network.
 */
export async function findMatchingWallet(asset: string, network: string): Promise<any> {
    try {
        const { data, error } = await supabase
            .from('deposit_wallets')
            .select('*')
            .eq('asset', asset.toUpperCase())
            .eq('network', network.toLowerCase())
            .eq('status', 'active')
            .maybeSingle();
            
        if (error) throw error;
        return data;
    } catch (err) {
        console.error("Failed to find matching wallet:", err);
        return null;
    }
}

