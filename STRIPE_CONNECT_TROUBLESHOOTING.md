# 🔧 Stripe Connect Troubleshooting

## Issue: "Failed to create Stripe account link"

### **Common Causes & Solutions:**

### 1. **Missing Environment Variables**
Check your `.env.local` file has:
```env
STRIPE_SECRET_KEY=sk_test_... # Your Stripe secret key
NEXT_PUBLIC_BASE_URL=http://localhost:3000 # Your base URL
```

### 2. **Invalid Stripe API Key**
- **Test Mode**: Use `sk_test_...` keys for development
- **Live Mode**: Use `sk_live_...` keys for production
- **Format**: Should start with `sk_test_` or `sk_live_`

### 3. **Stripe Account Permissions**
- **Connect**: Ensure your Stripe account has Connect enabled
- **Dashboard**: Go to Stripe Dashboard → Connect → Settings
- **Enable**: Make sure Connect is activated

### 4. **API Version Mismatch**
The code uses `apiVersion: '2025-05-28.basil'` - ensure your Stripe package supports this.

### 5. **Network/SSL Issues**
- **Localhost**: Should work fine for development
- **HTTPS**: Production requires HTTPS for Stripe Connect

## 🔍 **Debugging Steps:**

### **Step 1: Check Environment Variables**
```bash
# In your terminal, check if variables are loaded
echo $STRIPE_SECRET_KEY
```

### **Step 2: Test Stripe Connection**
Create a simple test endpoint:
```typescript
// Test endpoint to verify Stripe connection
export async function GET() {
  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: '2025-05-28.basil',
    })
    
    // Test basic API call
    const account = await stripe.accounts.list({ limit: 1 })
    
    return NextResponse.json({ 
      success: true, 
      message: 'Stripe connection working',
      accountCount: account.data.length 
    })
  } catch (error) {
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    })
  }
}
```

### **Step 3: Check Browser Console**
- Open browser developer tools
- Look for network errors
- Check the actual error response

### **Step 4: Check Server Logs**
- Look at your terminal/server logs
- The updated code now includes detailed error logging

## 🚀 **Quick Fixes:**

### **Option 1: Use Test Keys**
```env
STRIPE_SECRET_KEY=sk_test_51ABC123...
STRIPE_PUBLISHABLE_KEY=pk_test_51ABC123...
```

### **Option 2: Enable Connect in Stripe Dashboard**
1. Go to [Stripe Dashboard](https://dashboard.stripe.com)
2. Navigate to **Connect** → **Settings**
3. Enable **Connect** if not already enabled

### **Option 3: Check Stripe Package Version**
```bash
npm list stripe
# Should show a recent version like ^14.0.0
```

## 📞 **Still Having Issues?**

If the problem persists, check:
1. **Stripe Dashboard** for any account restrictions
2. **Network connectivity** to Stripe API
3. **Firewall/Proxy** settings blocking Stripe
4. **Stripe Support** for account-specific issues

The updated code now provides much better error messages to help identify the specific issue! 