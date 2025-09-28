# Analytics Setup Guide

## Problem Identified
The analytics dashboard is showing "Failed to fetch" errors because the required database tables and functions don't exist yet.

## Root Cause
- ✅ API endpoints are correctly configured
- ✅ Service role key authentication is working
- ❌ Database tables (`chat_sessions`, `email_captures`, `course_search_analytics`, etc.) don't exist
- ❌ Database functions (`get_all_chat_sessions`, `get_keyword_analytics`, etc.) don't exist

## Solution

### Step 1: Create Database Tables and Functions

You have several options to create the required database schema:

#### Option A: Using Supabase Dashboard (Recommended)
1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Copy and paste the contents of `setup_analytics_database.sql`
4. Click **Run** to execute the script

#### Option B: Using Supabase CLI
```bash
# If you have Supabase CLI installed
supabase db push
# Or
supabase db reset --linked
```

#### Option C: Manual Table Creation
If you prefer to create tables manually through the Supabase dashboard:
1. Go to **Table Editor**
2. Create each table with the schema defined in `setup_analytics_database.sql`

### Step 2: Verify Setup

After creating the tables, run the test script to verify everything is working:

```bash
node test-db-connection.js
```

You should see:
- ✅ All tables accessible
- ✅ All functions working
- 📊 Data counts (will be 0 initially)

### Step 3: Test Analytics Dashboard

1. Restart your development server:
   ```bash
   npm run dev
   ```

2. Navigate to the admin dashboard
3. The analytics components should now load without errors

## Files Created/Modified

### API Endpoints Fixed:
- ✅ `/api/analytics/chat-sessions/route.ts` - Now uses service role key
- ✅ `/api/analytics/email-captures/route.ts` - Now uses service role key  
- ✅ `/api/analytics/email-captures-detailed/route.ts` - Now uses service role key
- ✅ `/api/analytics/keywords/route.ts` - Now uses service role key

### Database Setup:
- ✅ `setup_analytics_database.sql` - Complete database schema
- ✅ `test-db-connection.js` - Database connection test
- ✅ `simple-db-setup.js` - Setup verification script

### Key Improvements:
1. **Service Role Authentication**: All analytics APIs now use the service role key for admin access
2. **Graceful Fallbacks**: APIs work even if database functions don't exist
3. **Better Error Handling**: Detailed error messages for debugging
4. **Comprehensive Schema**: All required tables, indexes, functions, and policies

## Expected Results

After completing the setup:

1. **Chat Analytics**: Will show chat sessions and message counts
2. **Email Analytics**: Will show email captures and conversion rates  
3. **Keywords Analytics**: Will show search trends and popular keywords
4. **Email Capture Analytics**: Will show detailed email capture data with keyword analysis

## Troubleshooting

### If tables still don't exist:
1. Check Supabase project permissions
2. Verify service role key is correct
3. Ensure RLS policies allow admin access

### If APIs still return 500 errors:
1. Check server logs for specific error messages
2. Verify environment variables are set correctly
3. Test database connection with `node test-db-connection.js`

### If data is not showing:
1. Tables exist but are empty (this is normal for new setup)
2. Create some test data through the chat interface
3. Check if RLS policies are blocking data access

## Next Steps

Once the database is set up:
1. Test the chat functionality to generate some data
2. Use the course search feature to create search analytics
3. Monitor the analytics dashboard for real-time data

The analytics system is now ready to track user interactions and provide valuable insights!
