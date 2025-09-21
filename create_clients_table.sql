CREATE TABLE IF NOT EXISTS clients (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  title TEXT,
  company TEXT NOT NULL,
  team_size TEXT NOT NULL,
  industry TEXT,
  email TEXT NOT NULL UNIQUE,
  phone TEXT NOT NULL,
  safety_interests TEXT[] DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'suspended')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index on email for faster lookups
CREATE INDEX IF NOT EXISTS clients_email_idx ON clients(email);

-- Create index on company for admin filtering
CREATE INDEX IF NOT EXISTS clients_company_idx ON clients(company);

-- Create index on industry for admin filtering
CREATE INDEX IF NOT EXISTS clients_industry_idx ON clients(industry);

-- Create index on status for admin filtering
CREATE INDEX IF NOT EXISTS clients_status_idx ON clients(status);

-- Enable Row Level Security
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Allow clients to read their own data
CREATE POLICY "Clients can view own data" ON clients
  FOR SELECT USING (auth.uid() = id);

-- Allow clients to update their own data
CREATE POLICY "Clients can update own data" ON clients
  FOR UPDATE USING (auth.uid() = id);

-- Allow admins to read all client data
CREATE POLICY "Admins can view all clients" ON clients
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE admin_users.email = auth.jwt() ->> 'email' 
      AND admin_users.role = 'admin' 
      AND admin_users.is_active = true
    )
  );

-- Allow admins to update all client data
CREATE POLICY "Admins can update all clients" ON clients
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE admin_users.email = auth.jwt() ->> 'email' 
      AND admin_users.role = 'admin' 
      AND admin_users.is_active = true
    )
  );

-- Allow public access for signup (INSERT only)
CREATE POLICY "Public can create client accounts" ON clients
  FOR INSERT WITH CHECK (true);

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_clients_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER clients_updated_at_trigger
  BEFORE UPDATE ON clients
  FOR EACH ROW
  EXECUTE FUNCTION update_clients_updated_at();

-- Add comments for documentation
COMMENT ON TABLE clients IS 'Client accounts for Mizel Safety Consulting safety training platform';
COMMENT ON COLUMN clients.id IS 'UUID from auth.users table';
COMMENT ON COLUMN clients.full_name IS 'Client full name';
COMMENT ON COLUMN clients.title IS 'Client job title or position (optional)';
COMMENT ON COLUMN clients.company IS 'Company name where client works';
COMMENT ON COLUMN clients.team_size IS 'Size of client team (1-10, 11-50, 51-200, 201-500, 500+)';
COMMENT ON COLUMN clients.industry IS 'Industry sector (optional)';
COMMENT ON COLUMN clients.email IS 'Client email address (unique)';
COMMENT ON COLUMN clients.phone IS 'Client phone number';
COMMENT ON COLUMN clients.safety_interests IS 'Array of safety training interests';
COMMENT ON COLUMN clients.status IS 'Account status: pending, approved, rejected, suspended';
COMMENT ON COLUMN clients.created_at IS 'Account creation timestamp';
COMMENT ON COLUMN clients.updated_at IS 'Last update timestamp';
