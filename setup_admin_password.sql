-- Setup Admin Password System
-- This script adds password support to admin_users table and creates an admin user

-- 1. Add password_hash column to admin_users table if it doesn't exist
ALTER TABLE admin_users 
ADD COLUMN IF NOT EXISTS password_hash VARCHAR;

-- 2. Add other necessary columns if they don't exist
ALTER TABLE admin_users 
ADD COLUMN IF NOT EXISTS first_name VARCHAR,
ADD COLUMN IF NOT EXISTS last_name VARCHAR,
ADD COLUMN IF NOT EXISTS phone VARCHAR,
ADD COLUMN IF NOT EXISTS permissions JSONB DEFAULT '{"courses": true, "users": true, "analytics": true, "blog": true}',
ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS last_login TIMESTAMP WITH TIME ZONE;

-- 3. Create a function to hash passwords (using bcrypt)
CREATE OR REPLACE FUNCTION hash_password(password TEXT)
RETURNS TEXT AS $$
BEGIN
  -- Using a simple hash for now - in production, use bcrypt
  -- This is a placeholder - you should use proper bcrypt hashing
  RETURN encode(digest(password || 'mizel_salt_2024', 'sha256'), 'hex');
END;
$$ LANGUAGE plpgsql;

-- 4. Create or update admin user
-- Replace 'admin@mizelconsulting.com' with your desired admin email
-- Replace 'admin123' with your desired password
INSERT INTO admin_users (
  email, 
  password_hash, 
  first_name, 
  last_name, 
  role, 
  is_active, 
  email_verified,
  permissions
) VALUES (
  'admin@mizelconsulting.com',
  hash_password('admin123'),
  'Kris',
  'Mizel',
  'super_admin',
  true,
  true,
  '{"courses": true, "users": true, "analytics": true, "blog": true, "admin": true}'
) ON CONFLICT (email) DO UPDATE SET
  password_hash = EXCLUDED.password_hash,
  first_name = EXCLUDED.first_name,
  last_name = EXCLUDED.last_name,
  role = EXCLUDED.role,
  is_active = EXCLUDED.is_active,
  email_verified = EXCLUDED.email_verified,
  permissions = EXCLUDED.permissions,
  updated_at = NOW();

-- 5. Create a function to verify admin password
CREATE OR REPLACE FUNCTION verify_admin_password(p_email TEXT, p_password TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  stored_hash TEXT;
BEGIN
  SELECT password_hash INTO stored_hash 
  FROM admin_users 
  WHERE admin_users.email = p_email 
  AND is_active = true;
  
  IF stored_hash IS NULL THEN
    RETURN FALSE;
  END IF;
  
  RETURN stored_hash = hash_password(p_password);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Create a function to get admin user by email and password
CREATE OR REPLACE FUNCTION get_admin_by_credentials(p_email TEXT, p_password TEXT)
RETURNS TABLE(
  id UUID,
  email TEXT,
  first_name TEXT,
  last_name TEXT,
  role TEXT,
  permissions JSONB,
  is_active BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    au.id,
    au.email,
    au.first_name,
    au.last_name,
    au.role,
    au.permissions,
    au.is_active
  FROM admin_users au
  WHERE au.email = p_email
  AND au.is_active = true
  AND au.password_hash = hash_password(p_password);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Update the updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for updated_at if it doesn't exist
DROP TRIGGER IF EXISTS update_admin_users_updated_at ON admin_users;
CREATE TRIGGER update_admin_users_updated_at 
    BEFORE UPDATE ON admin_users 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 8. Add comments for documentation
COMMENT ON FUNCTION hash_password(TEXT) IS 'Hashes a password using SHA256 with salt';
COMMENT ON FUNCTION verify_admin_password(TEXT, TEXT) IS 'Verifies admin password against stored hash';
COMMENT ON FUNCTION get_admin_by_credentials(TEXT, TEXT) IS 'Returns admin user if credentials are valid';

-- 9. Show the created admin user
SELECT 
  email,
  first_name,
  last_name,
  role,
  is_active,
  email_verified,
  created_at
FROM admin_users 
WHERE email = 'admin@mizelconsulting.com';
