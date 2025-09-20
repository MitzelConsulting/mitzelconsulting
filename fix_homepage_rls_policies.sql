-- Fix RLS policies for homepage data access
-- Run this in Supabase SQL Editor

-- Enable RLS on artists table if not already enabled
ALTER TABLE artists ENABLE ROW LEVEL SECURITY;

-- Create policy to allow public read access to artists
CREATE POLICY "Allow public read access to artists" ON artists
  FOR SELECT USING (true);

-- Enable RLS on songs table if not already enabled
ALTER TABLE songs ENABLE ROW LEVEL SECURITY;

-- Create policy to allow public read access to songs
CREATE POLICY "Allow public read access to songs" ON songs
  FOR SELECT USING (true);

-- Create policy to allow artists to manage their own songs
CREATE POLICY "Allow artists to manage their own songs" ON songs
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM artists 
      WHERE artists.id = songs.artist_id 
      AND artists.email = auth.jwt() ->> 'email'
    )
  );

-- Create policy to allow authenticated users to insert songs
CREATE POLICY "Allow authenticated users to insert songs" ON songs
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Create policy to allow authenticated users to update songs
CREATE POLICY "Allow authenticated users to update songs" ON songs
  FOR UPDATE USING (auth.role() = 'authenticated');

-- Create policy to allow authenticated users to delete songs
CREATE POLICY "Allow authenticated users to delete songs" ON songs
  FOR DELETE USING (auth.role() = 'authenticated'); 