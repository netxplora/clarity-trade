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

-- Sample Data: REMOVED for production safety.
-- Wallet addresses MUST be configured by administrators through the Admin Panel.
-- DO NOT hardcode wallet addresses in migrations.
-- The following addresses were removed because they included test/sample addresses
-- that could result in permanent loss of user funds if used in production.

