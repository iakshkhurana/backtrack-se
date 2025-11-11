-- ============================================
-- Check Admin Access for User
-- ============================================
-- Run this to check if a user has admin privileges
-- Replace 'khuranaaksh08@gmail.com' with the email you want to check
-- ============================================

-- Check user profile and role
SELECT 
  u.id AS user_id,
  u.email,
  u.created_at AS user_created_at,
  p.full_name,
  p.role,
  p.created_at AS profile_created_at,
  CASE 
    WHEN p.role = 'admin' THEN '✅ Admin Access'
    WHEN p.role = 'moderator' THEN '✅ Moderator Access'
    WHEN p.role = 'user' THEN '❌ Regular User'
    WHEN p.role IS NULL THEN '❌ No Role Set'
    ELSE '❓ Unknown Role'
  END AS access_status
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
WHERE u.email = 'khuranaaksh08@gmail.com';

-- If profile doesn't exist, create it with admin role
-- (Uncomment and run if needed)
/*
INSERT INTO public.profiles (id, full_name, role)
SELECT 
  u.id,
  COALESCE(u.raw_user_meta_data->>'full_name', SPLIT_PART(u.email, '@', 1), 'User'),
  'admin'
FROM auth.users u
WHERE u.email = 'khuranaaksh08@gmail.com'
AND NOT EXISTS (
  SELECT 1 FROM public.profiles WHERE id = u.id
);
*/

-- Grant admin role to existing profile
-- (Uncomment and run if profile exists but role is not admin)
/*
UPDATE public.profiles
SET role = 'admin'
WHERE id IN (
  SELECT id FROM auth.users WHERE email = 'khuranaaksh08@gmail.com'
);
*/

