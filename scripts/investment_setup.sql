-- ============================================================
-- Asset Investment System — Supabase Migration
-- Run this in your Supabase SQL Editor
-- ============================================================

-- 1. Investment Plans Table
CREATE TABLE IF NOT EXISTS investment_plans (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  asset_type TEXT NOT NULL,       -- 'Forex', 'Crypto', 'Gold', 'Oil'
  plan_name TEXT NOT NULL,        -- e.g. 'Gold Standard', 'Crypto Alpha'
  roi_percentage NUMERIC NOT NULL,
  duration TEXT NOT NULL,         -- e.g. '7', '30', '90' in days
  min_amount NUMERIC NOT NULL,
  max_amount NUMERIC NOT NULL,
  status TEXT DEFAULT 'Active' CHECK (status IN ('Active', 'Disabled', 'Archived')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. User Investments Table
CREATE TABLE IF NOT EXISTS investments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id UUID REFERENCES investment_plans(id),
  asset_type TEXT NOT NULL,
  investment_amount NUMERIC NOT NULL,
  roi_percentage NUMERIC NOT NULL,
  duration TEXT NOT NULL,
  status TEXT DEFAULT 'Active' CHECK (status IN ('Pending', 'Active', 'Completed', 'Cancelled')),
  profit NUMERIC DEFAULT 0,
  start_date TIMESTAMPTZ DEFAULT now(),
  end_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS for Plans
ALTER TABLE investment_plans ENABLE ROW LEVEL SECURITY;

-- Plan Policies
CREATE POLICY "Public read active plans" ON investment_plans
  FOR SELECT USING (status = 'Active');

CREATE POLICY "Admins all operations on plans" ON investment_plans
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Enable RLS for Investments
ALTER TABLE investments ENABLE ROW LEVEL SECURITY;

-- Investment Policies
CREATE POLICY "Users view own investments" ON investments
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users insert own investments" ON investments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins all operations on investments" ON investments
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Insert Default Investment Plans
INSERT INTO investment_plans (asset_type, plan_name, roi_percentage, duration, min_amount, max_amount) VALUES 
('Forex', 'Forex Elite', 15.0, '30', 500, 10000),
('Crypto', 'Crypto Alpha', 25.0, '14', 1000, 50000),
('Gold', 'Gold Reserves', 8.5, '60', 5000, 100000),
('Oil', 'Energy Futures', 12.0, '45', 2000, 25000);
