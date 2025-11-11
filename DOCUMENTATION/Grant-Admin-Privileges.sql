-- ============================================
-- Grant Admin Privileges to User
-- ============================================
-- This script grants admin privileges to a specific user by email
-- Run this in Supabase SQL Editor
-- ============================================

-- Step 1: Check if user exists
DO $$
DECLARE
  v_user_id UUID;
  v_profile_exists BOOLEAN;
BEGIN
  -- Get user ID
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE email = 'khuranaaksh08@gmail.com';

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User with email khuranaaksh08@gmail.com not found in auth.users';
  END IF;

  -- Check if profile exists
  SELECT EXISTS(SELECT 1 FROM public.profiles WHERE id = v_user_id) INTO v_profile_exists;

  -- Create profile if it doesn't exist
  IF NOT v_profile_exists THEN
    INSERT INTO public.profiles (id, full_name, role)
    VALUES (
      v_user_id,
      COALESCE(
        (SELECT raw_user_meta_data->>'full_name' FROM auth.users WHERE id = v_user_id),
        SPLIT_PART('khuranaaksh08@gmail.com', '@', 1),
        'User'
      ),
      'admin'
    );
    RAISE NOTICE 'Profile created with admin role for user: %', v_user_id;
  ELSE
    -- Update existing profile to admin
    UPDATE public.profiles
    SET role = 'admin'
    WHERE id = v_user_id;
    RAISE NOTICE 'Profile updated to admin role for user: %', v_user_id;
  END IF;
END $$;

-- Step 2: Verify the update
SELECT 
  u.id AS user_id,
  u.email,
  u.created_at AS user_created_at,
  p.full_name,
  p.role,
  p.created_at AS profile_created_at,
  CASE 
    WHEN p.role = 'admin' THEN '✅ Admin Access Granted'
    WHEN p.role = 'moderator' THEN '⚠️ Moderator Access'
    WHEN p.role = 'user' THEN '❌ Regular User (Not Admin)'
    ELSE '❓ Unknown Role'
  END AS access_status
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
WHERE u.email = 'khuranaaksh08@gmail.com';

-- ============================================
-- Alternative: If you know the user ID directly
-- ============================================
-- UPDATE public.profiles
-- SET role = 'admin'
-- WHERE id = '<user-id-here>';
--
-- Or create if doesn't exist:
-- INSERT INTO public.profiles (id, role)
-- VALUES ('<user-id-here>', 'admin')
-- ON CONFLICT (id) DO UPDATE SET role = 'admin';

