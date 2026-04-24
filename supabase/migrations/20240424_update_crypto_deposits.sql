-- Add missing columns to crypto_deposits for institutional tracking
ALTER TABLE crypto_deposits ADD COLUMN IF NOT EXISTS actual_amount NUMERIC(20, 8);
ALTER TABLE crypto_deposits ADD COLUMN IF NOT EXISTS amount_usd NUMERIC(20, 2);
ALTER TABLE crypto_deposits ADD COLUMN IF NOT EXISTS conversion_rate NUMERIC(20, 8);
ALTER TABLE crypto_deposits ADD COLUMN IF NOT EXISTS proof_image_url TEXT; -- Alternative name sometimes used

-- Ensure foreign key to profiles exists for easier joining
-- First, check if it exists or just try to add it (Postgres handles ADD COLUMN IF NOT EXISTS but not ADD CONSTRAINT IF NOT EXISTS easily without a DO block)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'crypto_deposits_user_id_fkey_profiles') THEN
        ALTER TABLE crypto_deposits 
        DROP CONSTRAINT IF EXISTS crypto_deposits_user_id_fkey,
        ADD CONSTRAINT crypto_deposits_user_id_fkey_profiles 
        FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;
    END IF;
END $$;
