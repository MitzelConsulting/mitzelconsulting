-- Add admin user to admin_users table (PROPER METHOD)
-- Run this in your Supabase SQL editor

-- First, let's check if the user exists in auth.users
SELECT id, email, created_at FROM auth.users WHERE email = 'admin@Launchthatsong.com';

-- Check if admin_users table exists and its structure
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'admin_users'
ORDER BY ordinal_position;

-- Check if there are any existing admin users
SELECT * FROM admin_users;

-- Check if this specific admin user already exists
SELECT * FROM admin_users WHERE email = 'admin@Launchthatsong.com';

-- Only add the admin user if they don't already exist
INSERT INTO admin_users (user_id, email, role, is_active, created_at)
SELECT 
  id as user_id,
  email,
  'super_admin' as role,
  true as is_active,
  NOW() as created_at
FROM auth.users 
WHERE email = 'admin@Launchthatsong.com'
AND NOT EXISTS (
  SELECT 1 FROM admin_users WHERE email = 'admin@Launchthatsong.com'
);

-- Verify the admin user was added (or already existed)
SELECT 
  au.id,
  au.user_id,
  au.email,
  au.role,
  au.is_active,
  au.created_at,
  auth.email as auth_email
FROM admin_users au
LEFT JOIN auth.users auth ON au.user_id = auth.id
WHERE au.email = 'admin@Launchthatsong.com'; 