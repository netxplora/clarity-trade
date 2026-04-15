-- ============================================================
-- Enhanced KYC Verification System — Database Migration
-- Run this in your Supabase SQL Editor
-- ============================================================

-- If the table doesn't exist at all, this creates it. 
-- Note: if you already have it, the next ALTER statements will update it.
CREATE TABLE IF NOT EXISTS kyc_submissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'Pending',
  id_type TEXT,
  id_number TEXT,
  document_front TEXT,
  document_back TEXT,
  selfie_url TEXT,
  rejection_reason TEXT,
  admin_notes TEXT,
  submitted_at TIMESTAMPTZ DEFAULT now(),
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ==========================================
-- ADD MISSING MULTI-LEVEL COLUMNS
-- ==========================================
DO $$ 
BEGIN 
    -- Level
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='kyc_submissions' AND column_name='kyc_level') THEN
        ALTER TABLE kyc_submissions ADD COLUMN kyc_level INTEGER NOT NULL DEFAULT 1;
    END IF;
    
    -- Basic Info
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='kyc_submissions' AND column_name='full_name') THEN
        ALTER TABLE kyc_submissions ADD COLUMN full_name TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='kyc_submissions' AND column_name='date_of_birth') THEN
        ALTER TABLE kyc_submissions ADD COLUMN date_of_birth DATE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='kyc_submissions' AND column_name='country') THEN
        ALTER TABLE kyc_submissions ADD COLUMN country TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='kyc_submissions' AND column_name='phone') THEN
        ALTER TABLE kyc_submissions ADD COLUMN phone TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='kyc_submissions' AND column_name='address') THEN
        ALTER TABLE kyc_submissions ADD COLUMN address TEXT;
    END IF;

    -- Address Proof Documents
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='kyc_submissions' AND column_name='address_doc_type') THEN
        ALTER TABLE kyc_submissions ADD COLUMN address_doc_type TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='kyc_submissions' AND column_name='address_doc_url') THEN
        ALTER TABLE kyc_submissions ADD COLUMN address_doc_url TEXT;
    END IF;

    -- Fix Constraints for Multi-Level KYC (Levels 1 & 3 won't have ID documents)
    ALTER TABLE kyc_submissions ALTER COLUMN id_type DROP NOT NULL;
    ALTER TABLE kyc_submissions ALTER COLUMN id_number DROP NOT NULL;
    ALTER TABLE kyc_submissions ALTER COLUMN document_front DROP NOT NULL;
    ALTER TABLE kyc_submissions ALTER COLUMN document_back DROP NOT NULL;
    ALTER TABLE kyc_submissions ALTER COLUMN selfie_url DROP NOT NULL;

    -- Review Data
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='kyc_submissions' AND column_name='rejection_reason') THEN
        ALTER TABLE kyc_submissions ADD COLUMN rejection_reason TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='kyc_submissions' AND column_name='admin_notes') THEN
        ALTER TABLE kyc_submissions ADD COLUMN admin_notes TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='kyc_submissions' AND column_name='reviewed_at') THEN
        ALTER TABLE kyc_submissions ADD COLUMN reviewed_at TIMESTAMPTZ;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='kyc_submissions' AND column_name='submitted_at') THEN
        ALTER TABLE kyc_submissions ADD COLUMN submitted_at TIMESTAMPTZ DEFAULT now();
    END IF;

    -- Reviewer
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='kyc_submissions' AND column_name='reviewed_by') THEN
        ALTER TABLE kyc_submissions ADD COLUMN reviewed_by UUID REFERENCES auth.users(id);
    END IF;
END $$;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_kyc_user ON kyc_submissions(user_id);
CREATE INDEX IF NOT EXISTS idx_kyc_status ON kyc_submissions(status);
CREATE INDEX IF NOT EXISTS idx_kyc_level ON kyc_submissions(kyc_level);
CREATE INDEX IF NOT EXISTS idx_kyc_submitted ON kyc_submissions(submitted_at DESC);

-- RLS (Ensure enabled)
ALTER TABLE kyc_submissions ENABLE ROW LEVEL SECURITY;

-- Safely recreate policies
DROP POLICY IF EXISTS "Users view own KYC" ON kyc_submissions;
CREATE POLICY "Users view own KYC" ON kyc_submissions FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users create KYC" ON kyc_submissions;
CREATE POLICY "Users create KYC" ON kyc_submissions FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users update own pending KYC" ON kyc_submissions;
CREATE POLICY "Users update own pending KYC" ON kyc_submissions FOR UPDATE USING (auth.uid() = user_id AND status = 'Pending');

DROP POLICY IF EXISTS "Admins full KYC access SELECT" ON kyc_submissions;
CREATE POLICY "Admins full KYC access SELECT" ON kyc_submissions FOR SELECT USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

DROP POLICY IF EXISTS "Admins full KYC access UPDATE" ON kyc_submissions;
CREATE POLICY "Admins full KYC access UPDATE" ON kyc_submissions FOR UPDATE USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

DROP POLICY IF EXISTS "Admins full KYC access DELETE" ON kyc_submissions;
CREATE POLICY "Admins full KYC access DELETE" ON kyc_submissions FOR DELETE USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- Notify Supabase to pick up schema changes
NOTIFY pgrst, 'reload schema';
