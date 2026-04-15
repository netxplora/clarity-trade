-- ============================================================
-- Fix: Profiles Auto-Creation & Admin Setup
-- Run this in your Supabase SQL Editor
-- ============================================================

-- 1. Create a trigger function that auto-creates a profile when a new user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name, role, status, created_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    'user',
    'Active',
    NOW()
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- 2. Drop existing trigger if it exists, then create it
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 3. Backfill: Create profile rows for ALL existing auth users who don't have one
INSERT INTO public.profiles (id, email, name, role, status, created_at)
SELECT 
  u.id,
  u.email,
  COALESCE(u.raw_user_meta_data->>'full_name', u.email),
  'user',
  'Active',
  NOW()
FROM auth.users u
WHERE NOT EXISTS (
  SELECT 1 FROM public.profiles p WHERE p.id = u.id
);

-- 4. Fix the initialize_first_admin RPC to handle missing profiles (UPSERT instead of UPDATE)
DROP FUNCTION IF EXISTS initialize_first_admin(text, text);
CREATE OR REPLACE FUNCTION initialize_first_admin(admin_name text, admin_email text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    target_id uuid;
    admin_count integer;
BEGIN
    -- 1. Check if an admin already exists (security lock)
    SELECT count(*) INTO admin_count FROM profiles WHERE role = 'admin';
    IF admin_count > 0 THEN
        RAISE EXCEPTION 'An admin account already exists. Initialization locked.';
    END IF;

    -- 2. Get the auth ID using the email
    SELECT id INTO target_id FROM auth.users WHERE email = admin_email;
    IF target_id IS NULL THEN
        RAISE EXCEPTION 'Auth user not found for this email. Sign up first.';
    END IF;

    -- 3. Upsert the profile to admin (INSERT if missing, UPDATE if exists)
    INSERT INTO profiles (id, email, name, role, status, created_at)
    VALUES (target_id, admin_email, admin_name, 'admin', 'Active', NOW())
    ON CONFLICT (id) DO UPDATE SET role = 'admin', name = admin_name;

    RETURN true;
END;
$$;

-- 5. Verify: Show all profiles after backfill
SELECT id, email, name, role, status FROM profiles;
