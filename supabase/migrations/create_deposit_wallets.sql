-- ============================================================
-- Admin Managed Deposit Wallets
-- ============================================================

-- Drop if exists to ensure clean state with requested fields
DROP TABLE IF EXISTS deposit_wallets CASCADE;

CREATE TABLE deposit_wallets (
  id             UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  asset          TEXT NOT NULL,               -- e.g. BTC, ETH, USDT
  network        TEXT NOT NULL,               -- e.g. Bitcoin, ERC20, TRC20, BEP20
  wallet_address TEXT NOT NULL,
  status         TEXT NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive')),
  label          TEXT,                        -- e.g. "Main Exchange Wallet"
  priority       INT DEFAULT 0,               -- For sorting
  created_at     TIMESTAMPTZ DEFAULT now(),
  updated_at     TIMESTAMPTZ DEFAULT now()
);

-- Index for fast filtering by asset and active status
CREATE INDEX idx_deposit_wallets_asset_status ON deposit_wallets(asset, status);

-- Enable RLS
ALTER TABLE deposit_wallets ENABLE ROW LEVEL SECURITY;

-- 1. Everyone (authenticated) can view Active wallets
CREATE POLICY "Users can view active wallets"
  ON deposit_wallets FOR SELECT
  USING (status = 'Active');

-- 2. Admins can do everything
CREATE POLICY "Admins have full access to deposit_wallets"
  ON deposit_wallets FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Sample Data (Standard Wallets)
INSERT INTO deposit_wallets (asset, network, wallet_address, status, label, priority)
VALUES 
('BTC', 'Bitcoin', '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa', 'Active', 'Legacy Bitcoin', 10),
('ETH', 'ERC20', '0x742d35Cc6634C0532925a3b844Bc454e4438f44e', 'Active', 'Ethereum Mainnet', 10),
('USDT', 'ERC20', '0x742d35Cc6634C0532925a3b844Bc454e4438f44e', 'Active', 'USDT ERC20', 10),
('USDT', 'TRC20', 'TR7NHqJfy2tzh3hsz4wYX33C1y31iNDJ68', 'Active', 'USDT TRC20', 10),
('USDT', 'BEP20', '0x742d35Cc6634C0532925a3b844Bc454e4438f44e', 'Active', 'USDT BEP20', 10);
