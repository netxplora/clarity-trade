-- Admin Initialization RPC
-- This allows the first user to be elevated to admin bypassing RLS.
CREATE OR REPLACE FUNCTION initialize_first_admin(admin_name text, admin_email text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER -- Essential: runs as postgres superuser to bypass RLS
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

    -- 3. Update the profile to admin
    UPDATE profiles 
    SET role = 'admin', name = admin_name
    WHERE id = target_id;

    RETURN true;
END;
$$;
