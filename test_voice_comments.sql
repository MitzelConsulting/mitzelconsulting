-- Test script to verify voice_comments table setup
-- Run this in Supabase SQL Editor after creating the table

-- 1. Check if table exists
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'voice_comments';

-- 2. Check table structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'voice_comments'
ORDER BY ordinal_position;

-- 3. Check if indexes were created
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE tablename = 'voice_comments';

-- 4. Check if RLS is enabled
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'voice_comments';

-- 5. Check if policies exist
SELECT policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'voice_comments';

-- 6. Check if trigger exists
SELECT trigger_name, event_manipulation, action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'voice_comments';

-- 7. Test insert (this should work if everything is set up correctly)
-- Note: Replace the UUIDs with actual song_id and artist_id from your database
INSERT INTO voice_comments (
  song_id, 
  artist_id, 
  song_title, 
  artist_name, 
  audio_data, 
  audio_filename
) VALUES (
  '00000000-0000-0000-0000-000000000000', -- Replace with actual song_id
  '00000000-0000-0000-0000-000000000000', -- Replace with actual artist_id
  'Test Song',
  'Test Artist',
  'data:audio/webm;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWT',
  'test-comment.webm'
);

-- 8. Test select
SELECT * FROM voice_comments WHERE song_title = 'Test Song';

-- 9. Test update (should trigger the updated_at timestamp)
UPDATE voice_comments 
SET status = 'purchased' 
WHERE song_title = 'Test Song';

-- 10. Verify updated_at was changed
SELECT song_title, status, created_at, updated_at 
FROM voice_comments 
WHERE song_title = 'Test Song';

-- 11. Clean up test data
DELETE FROM voice_comments WHERE song_title = 'Test Song'; 