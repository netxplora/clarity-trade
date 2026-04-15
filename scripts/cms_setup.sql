-- ============================================================
-- Platform Content Management System — Database Migration
-- Run this in your Supabase SQL Editor
-- ============================================================

-- 1. Create platform_content table
CREATE TABLE IF NOT EXISTS platform_content (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN ('blog', 'page_section', 'banner', 'highlight')),
  section TEXT NOT NULL,          -- e.g. 'homepage', 'faq', 'dashboard', 'crypto_trading'
  title TEXT NOT NULL,
  content_raw TEXT,               -- For markdown or raw text body
  content_html TEXT,              -- For rendered HTML
  metadata JSONB DEFAULT '{}',    -- For image URLs, author, SEO data, priority
  status TEXT DEFAULT 'PUBLISHED' CHECK (status IN ('PUBLISHED', 'DRAFT', 'DISABLED')),
  views INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Indexes for fast lookup by frontend
CREATE INDEX IF NOT EXISTS idx_platform_content_type ON platform_content(type);
CREATE INDEX IF NOT EXISTS idx_platform_content_section ON platform_content(section);
CREATE INDEX IF NOT EXISTS idx_platform_content_status ON platform_content(status);

-- 3. Trigger for updated_at
CREATE OR REPLACE FUNCTION update_content_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_content_ts ON platform_content;
CREATE TRIGGER trg_update_content_ts
  BEFORE UPDATE ON platform_content
  FOR EACH ROW EXECUTE FUNCTION update_content_timestamp();

-- 4. Enable RLS
ALTER TABLE platform_content ENABLE ROW LEVEL SECURITY;

-- 5. Policies
-- Everyone can read published content
DROP POLICY IF EXISTS "Public can read published content" ON platform_content;
CREATE POLICY "Public can read published content" ON platform_content
  FOR SELECT USING (status = 'PUBLISHED');

-- Admins can read all content (drafts, disabled)
DROP POLICY IF EXISTS "Admins read all platform content" ON platform_content;
CREATE POLICY "Admins read all platform content" ON platform_content
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Admins can insert/update/delete
DROP POLICY IF EXISTS "Admins insert content" ON platform_content;
CREATE POLICY "Admins insert content" ON platform_content
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

DROP POLICY IF EXISTS "Admins update content" ON platform_content;
CREATE POLICY "Admins update content" ON platform_content
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

DROP POLICY IF EXISTS "Admins delete content" ON platform_content;
CREATE POLICY "Admins delete content" ON platform_content
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- 6. Subscribe to Realtime Updates
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE platform_content;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
