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

CREATE INDEX IF NOT EXISTS clients_email_idx ON clients(email);
CREATE INDEX IF NOT EXISTS clients_company_idx ON clients(company);
CREATE INDEX IF NOT EXISTS clients_industry_idx ON clients(industry);
CREATE INDEX IF NOT EXISTS clients_status_idx ON clients(status);

ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Clients can view own data" ON clients
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Clients can update own data" ON clients
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins can view all clients" ON clients
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE admin_users.email = auth.jwt() ->> 'email' 
      AND admin_users.role = 'admin' 
      AND admin_users.is_active = true
    )
  );

CREATE POLICY "Admins can update all clients" ON clients
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE admin_users.email = auth.jwt() ->> 'email' 
      AND admin_users.role = 'admin' 
      AND admin_users.is_active = true
    )
  );

CREATE POLICY "Public can create client accounts" ON clients
  FOR INSERT WITH CHECK (true);

CREATE OR REPLACE FUNCTION update_clients_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER clients_updated_at_trigger
  BEFORE UPDATE ON clients
  FOR EACH ROW
  EXECUTE FUNCTION update_clients_updated_at();
