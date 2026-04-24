-- ============================================================
-- Crypto Providers & External Purchase Tracking
-- ============================================================

-- 1. Crypto Providers Table (Matching existing Admin UI fields)
CREATE TABLE IF NOT EXISTS crypto_providers (
  id                  UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  provider_name       TEXT NOT NULL,
  provider_logo       TEXT,
  provider_description TEXT,
  provider_url        TEXT NOT NULL,
  supported_assets    TEXT[], -- ['BTC', 'ETH', 'USDT']
  supported_regions   TEXT[], -- ['US', 'EU', 'GLOBAL']
  provider_status     TEXT NOT NULL DEFAULT 'Active' CHECK (provider_status IN ('Active', 'Inactive')),
  provider_priority   INTEGER DEFAULT 100,
  provider_type       TEXT DEFAULT 'Secondary' CHECK (provider_type IN ('Primary', 'Secondary', 'Backup')),
  created_at          TIMESTAMPTZ DEFAULT now(),
  updated_at          TIMESTAMPTZ DEFAULT now()
);

-- 2. External Purchase Sessions (Tracking Intent)
CREATE TABLE IF NOT EXISTS external_purchase_sessions (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider_id     UUID NOT NULL REFERENCES crypto_providers(id) ON DELETE CASCADE,
  asset           TEXT NOT NULL,
  network         TEXT NOT NULL,
  wallet_address  TEXT NOT NULL,
  status          TEXT NOT NULL DEFAULT 'initiated' CHECK (status IN ('initiated', 'completed', 'abandoned')),
  created_at      TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE crypto_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE external_purchase_sessions ENABLE ROW LEVEL SECURITY;

-- Policies for crypto_providers
CREATE POLICY "Public can view active providers"
  ON crypto_providers FOR SELECT
  USING (provider_status = 'Active');

CREATE POLICY "Admins can manage providers"
  ON crypto_providers FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Policies for external_purchase_sessions
CREATE POLICY "Users can view own sessions"
  ON external_purchase_sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own sessions"
  ON external_purchase_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all sessions"
  ON external_purchase_sessions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Initial Seed Data
INSERT INTO crypto_providers (provider_name, provider_logo, provider_description, provider_url, supported_assets, provider_status, provider_priority, provider_type)
VALUES 
('MoonPay', 'https://www.moonpay.com/favicon.png', 'Fast and secure crypto purchases via Credit Card or Apple Pay.', 'https://www.moonpay.com/', ARRAY['BTC', 'ETH', 'USDT', 'SOL'], 'Active', 1, 'Primary'),
('Banxa', 'https://banxa.com/wp-content/uploads/2020/01/favicon.png', 'Global on-ramp with low fees and multiple payment options.', 'https://banxa.com/', ARRAY['BTC', 'ETH', 'USDT'], 'Active', 2, 'Secondary'),
('Simplex', 'https://www.simplex.com/wp-content/uploads/2021/03/favicon.ico', 'Buy crypto instantly with your credit or debit card.', 'https://www.simplex.com/', ARRAY['BTC', 'ETH', 'USDC'], 'Active', 3, 'Secondary');
