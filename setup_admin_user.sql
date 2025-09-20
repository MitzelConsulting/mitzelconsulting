-- Complete Admin User Setup Script (Fresh Start)
-- Run this in your Supabase SQL Editor AFTER creating the user account

-- Step 1: Verify the user exists in auth.users
SELECT 
  id, 
  email, 
  created_at,
  CASE 
    WHEN email_confirmed_at IS NOT NULL THEN 'Email Confirmed'
    ELSE 'Email Not Confirmed'
  END as email_status
FROM auth.users 
WHERE email = 'admin@launchthatsong.com';

-- Step 2: Check if admin_users table exists
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'admin_users'
) as table_exists;

-- Step 3: Show current admin_users (should be empty after fresh start)
SELECT * FROM admin_users;

-- Step 4: Add admin user to admin_users table
INSERT INTO admin_users (user_id, email, role, is_active, created_at)
SELECT 
  id as user_id,
  email,
  'super_admin' as role,
  true as is_active,
  NOW() as created_at
FROM auth.users 
WHERE email = 'admin@launchthatsong.com';

-- Step 5: Verify the complete setup
SELECT 
  au.id as admin_user_id,
  au.user_id,
  au.email,
  au.role,
  au.is_active,
  au.created_at,
  auth.email as auth_email,
  auth.email_confirmed_at,
  CASE 
    WHEN auth.email_confirmed_at IS NOT NULL THEN 'Ready to Login'
    ELSE 'Email needs confirmation (but auto-confirm should handle this)'
  END as status
FROM admin_users au
LEFT JOIN auth.users auth ON au.user_id = auth.id
WHERE au.email = 'admin@launchthatsong.com';

-- Step 6: Show all admin users for verification
SELECT 
  au.email,
  au.role,
  au.is_active,
  au.created_at
FROM admin_users au
ORDER BY au.created_at DESC; 