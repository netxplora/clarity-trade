-- ============================================================
-- Balance Management System — Supabase Migration
-- Run this in your Supabase SQL Editor
-- ============================================================

-- 1. Create Balances Table
CREATE TABLE IF NOT EXISTS public.balances (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    crypto_balance NUMERIC DEFAULT 0,
    fiat_balance NUMERIC DEFAULT 0,
    btc_balance NUMERIC DEFAULT 0,
    eth_balance NUMERIC DEFAULT 0,
    usdt_balance NUMERIC DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Enable RLS
ALTER TABLE public.balances ENABLE ROW LEVEL SECURITY;

-- 3. Balance Policies
CREATE POLICY "Users can view own balance" ON public.balances
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all balances" ON public.balances
    FOR ALL USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- 4. Trigger to auto-create balance row for new users
CREATE OR REPLACE FUNCTION public.handle_new_user_balance()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.balances (user_id)
    VALUES (NEW.id)
    ON CONFLICT (user_id) DO NOTHING;
    RETURN NEW;
END;
$$;

-- Drop trigger if exists and recreate
DROP TRIGGER IF EXISTS on_auth_user_created_balance ON auth.users;
CREATE TRIGGER on_auth_user_created_balance
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_balance();

-- 5. Backfill: Create balance rows for all existing users
INSERT INTO public.balances (user_id)
SELECT id FROM auth.users
WHERE NOT EXISTS (
    SELECT 1 FROM public.balances WHERE user_id = auth.users.id
);

-- 6. Trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_balances_updated_at
    BEFORE UPDATE ON balances
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
