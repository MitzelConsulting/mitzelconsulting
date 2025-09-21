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
