-- ============================================================
-- Crypto Deposits Table
-- Manual deposit verification system for ClarityTrade
-- ============================================================

CREATE TABLE IF NOT EXISTS crypto_deposits (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  asset         TEXT NOT NULL,               -- BTC, ETH, USDT, etc.
  network       TEXT NOT NULL,               -- erc20, trc20, bep20, bitcoin, solana
  amount_expected NUMERIC(20, 8) NOT NULL,   -- Exact amount user should send
  wallet_address TEXT NOT NULL,              -- Global wallet address shown to user
  reference_id  TEXT NOT NULL UNIQUE,        -- Unique human-readable ref (CT-XXXXXX-XXXX)
  txid          TEXT,                        -- Transaction hash submitted by user
  status        TEXT NOT NULL DEFAULT 'pending'
                CHECK (status IN ('pending', 'submitted', 'under_review', 'approved', 'rejected')),
  proof_image   TEXT,                        -- Optional screenshot URL
  rejection_reason TEXT,                     -- Reason if rejected
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now(),
  verified_by   UUID REFERENCES auth.users(id), -- Admin who approved/rejected
  verified_at   TIMESTAMPTZ                  -- When verification happened
);

-- Prevent duplicate TXIDs (fraud protection)
CREATE UNIQUE INDEX IF NOT EXISTS idx_crypto_deposits_txid
  ON crypto_deposits (txid)
  WHERE txid IS NOT NULL AND txid != '';

-- Fast lookups by user
CREATE INDEX IF NOT EXISTS idx_crypto_deposits_user_id
  ON crypto_deposits (user_id);

-- Fast lookups by status for admin panel
CREATE INDEX IF NOT EXISTS idx_crypto_deposits_status
  ON crypto_deposits (status);

-- Fast lookups by reference_id
CREATE INDEX IF NOT EXISTS idx_crypto_deposits_reference_id
  ON crypto_deposits (reference_id);

-- Auto-update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_crypto_deposits_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_crypto_deposits_updated_at
  BEFORE UPDATE ON crypto_deposits
  FOR EACH ROW
  EXECUTE FUNCTION update_crypto_deposits_updated_at();

-- Enable RLS
ALTER TABLE crypto_deposits ENABLE ROW LEVEL SECURITY;

-- Users can read their own deposits
CREATE POLICY "Users can view own deposits"
  ON crypto_deposits FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own deposits
CREATE POLICY "Users can create deposits"
  ON crypto_deposits FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own pending deposits (submit TXID)
CREATE POLICY "Users can update own pending deposits"
  ON crypto_deposits FOR UPDATE
  USING (auth.uid() = user_id AND status IN ('pending', 'submitted'))
  WITH CHECK (auth.uid() = user_id);

-- Admins can read all deposits
CREATE POLICY "Admins can view all deposits"
  ON crypto_deposits FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Admins can update any deposit (approve/reject)
CREATE POLICY "Admins can update all deposits"
  ON crypto_deposits FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );
