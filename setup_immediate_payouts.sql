-- Setup Immediate Payouts System
-- Run this in Supabase SQL Editor to ensure all tables are properly configured

-- Ensure artist_revenue table exists with proper structure
CREATE TABLE IF NOT EXISTS artist_revenue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_id uuid REFERENCES artists(id) ON DELETE CASCADE,
  total_revenue decimal(10,2) DEFAULT 0,
  total_payouts decimal(10,2) DEFAULT 0,
  pending_payouts decimal(10,2) DEFAULT 0,
  platform_fees decimal(10,2) DEFAULT 0,
  last_updated timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- Ensure purchase_transactions table exists with proper structure
CREATE TABLE IF NOT EXISTS purchase_transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  artist_id UUID REFERENCES artists(id) ON DELETE CASCADE,
  song_id UUID REFERENCES songs(id) ON DELETE CASCADE,
  stripe_payment_intent_id VARCHAR(255),
  stripe_transfer_id VARCHAR(255),
  amount DECIMAL(10,2) NOT NULL,
  platform_fee DECIMAL(10,2) DEFAULT 0.00,
  artist_payout DECIMAL(10,2) DEFAULT 0.00,
  status VARCHAR(50) DEFAULT 'pending',
  customer_email VARCHAR(255),
  purchase_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  payout_date TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_artist_revenue_artist_id ON artist_revenue(artist_id);
CREATE INDEX IF NOT EXISTS idx_purchase_transactions_artist_id ON purchase_transactions(artist_id);
CREATE INDEX IF NOT EXISTS idx_purchase_transactions_song_id ON purchase_transactions(song_id);
CREATE INDEX IF NOT EXISTS idx_purchase_transactions_status ON purchase_transactions(status);
CREATE INDEX IF NOT EXISTS idx_purchase_transactions_payment_intent ON purchase_transactions(stripe_payment_intent_id);

-- Insert default revenue records for existing artists if they don't exist
INSERT INTO artist_revenue (artist_id, total_revenue, total_payouts, pending_payouts, platform_fees)
SELECT id, 0.00, 0.00, 0.00, 0.00
FROM artists
WHERE id NOT IN (SELECT artist_id FROM artist_revenue);

-- Function to automatically create revenue record for new artists
CREATE OR REPLACE FUNCTION create_artist_revenue()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO artist_revenue (artist_id) VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for new artists
DROP TRIGGER IF EXISTS artist_revenue_trigger ON artists;
CREATE TRIGGER artist_revenue_trigger
  AFTER INSERT ON artists
  FOR EACH ROW
  EXECUTE FUNCTION create_artist_revenue();

-- Function to update artist revenue totals
CREATE OR REPLACE FUNCTION update_artist_revenue_totals()
RETURNS TRIGGER AS $$
BEGIN
  -- Update artist revenue totals when transaction status changes
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    -- Calculate totals for this artist
    WITH totals AS (
      SELECT 
        artist_id,
        SUM(amount) as total_revenue,
        SUM(CASE WHEN status = 'completed' THEN artist_payout ELSE 0 END) as total_payouts,
        SUM(CASE WHEN status = 'pending_stripe_connection' THEN artist_payout ELSE 0 END) as pending_payouts,
        SUM(platform_fee) as platform_fees
      FROM purchase_transactions 
      WHERE artist_id = NEW.artist_id
      GROUP BY artist_id
    )
    INSERT INTO artist_revenue (artist_id, total_revenue, total_payouts, pending_payouts, platform_fees, last_updated)
    SELECT artist_id, total_revenue, total_payouts, pending_payouts, platform_fees, NOW()
    FROM totals
    ON CONFLICT (artist_id) 
    DO UPDATE SET
      total_revenue = EXCLUDED.total_revenue,
      total_payouts = EXCLUDED.total_payouts,
      pending_payouts = EXCLUDED.pending_payouts,
      platform_fees = EXCLUDED.platform_fees,
      last_updated = NOW();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for purchase transactions
DROP TRIGGER IF EXISTS purchase_transactions_revenue_trigger ON purchase_transactions;
CREATE TRIGGER purchase_transactions_revenue_trigger
  AFTER INSERT OR UPDATE ON purchase_transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_artist_revenue_totals();

-- Success message
SELECT 'Immediate payouts system setup completed successfully!' as status; 