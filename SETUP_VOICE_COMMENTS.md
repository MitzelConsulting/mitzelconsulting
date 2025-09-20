# Voice Comments Feature Setup

## Overview
This feature allows listeners to record voice comments about songs, which are saved as drafts and sent to artists when the purchase is completed.

## Database Setup

### 1. Create the voice_comments table in Supabase
Run the SQL script in `voice_comments_table.sql` in your Supabase SQL editor:

```sql
-- Voice Comments Table
CREATE TABLE voice_comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  song_id UUID REFERENCES songs(id) ON DELETE CASCADE,
  artist_id UUID REFERENCES artists(id) ON DELETE CASCADE,
  song_title TEXT NOT NULL,
  artist_name TEXT NOT NULL,
  audio_data TEXT NOT NULL, -- Base64 encoded audio
  audio_filename TEXT NOT NULL,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'purchased', 'sent')),
  purchase_session_id TEXT, -- Stripe session ID when purchased
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_voice_comments_song_id ON voice_comments(song_id);
CREATE INDEX idx_voice_comments_status ON voice_comments(status);
CREATE INDEX idx_voice_comments_purchase_session ON voice_comments(purchase_session_id);

-- Enable RLS
ALTER TABLE voice_comments ENABLE ROW LEVEL SECURITY;

-- Allow all operations (restrict later as needed)
CREATE POLICY "Allow all operations on voice_comments" ON voice_comments
  FOR ALL USING (true);

-- Auto-update timestamp function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for auto-updating timestamps
CREATE TRIGGER update_voice_comments_updated_at 
  BEFORE UPDATE ON voice_comments 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();
```

## How It Works

### 1. Recording Voice Comments
- Users can record voice comments on artist pages by flipping song cards
- Comments are saved as base64 audio data in the `voice_comments` table with status 'draft'
- Comments are added to the cart context for display

### 2. Cart Display
- Voice comments appear in the cart page with a green indicator
- Users can play back their comments before purchase
- Comments can be removed from the cart

### 3. Purchase Process
- When checkout is initiated, voice comment IDs are included in Stripe metadata
- After successful payment, the webhook updates comment status to 'purchased'
- Comments are associated with the purchase session ID

### 4. Status Tracking
- **draft**: Comment recorded but not purchased
- **purchased**: Comment included in a completed purchase
- **sent**: Comment has been sent to the artist (future feature)

## Files Modified/Created

### New Files:
- `voice_comments_table.sql` - Database schema
- `src/app/api/save-voice-comment/route.ts` - Save comments to Supabase
- `src/app/api/update-voice-comments/route.ts` - Update comment status

### Modified Files:
- `src/context/CartContext.tsx` - Added voice comment support
- `src/app/artist/[id]/page.tsx` - Updated to save comments instead of emailing
- `src/app/cart/page.tsx` - Display and manage voice comments
- `src/app/api/stripe/checkout/route.ts` - Include voice comment IDs in metadata
- `src/app/api/stripe/webhook/route.ts` - Update comment status on purchase

## Testing the Feature

1. **Record a comment**: Go to an artist page, flip a song card, and record a voice comment
2. **Add to cart**: Vote for the song to add it to your cart
3. **View in cart**: Go to the cart page to see the voice comment indicator
4. **Play comment**: Click "Play Comment" to hear your recording
5. **Checkout**: Complete the purchase to see the comment status update

## Next Steps

1. **Email Integration**: Create a system to send purchased comments to artists
2. **Comment Management**: Allow artists to view and manage received comments
3. **Comment Analytics**: Track comment engagement and feedback
4. **Security**: Implement proper RLS policies for the voice_comments table 