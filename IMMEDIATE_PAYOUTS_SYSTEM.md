# Immediate Payouts System

## Overview

The Launch That Song platform now features an **immediate payout system** where artists get paid every time someone adds rocket fuel (makes a purchase), not just when their song reaches its funding goal. This ensures artists start earning immediately and receive funds directly to their connected Stripe accounts.

## How It Works

### 1. Fan Purchase Flow
1. Fans purchase rocket fuel for songs through Stripe Checkout
2. Payment is processed and funds are held by Stripe
3. Our webhook immediately processes the payment and calculates artist shares

### 2. Artist Payout Flow
1. **If Stripe account is connected**: Funds are transferred immediately to the artist's connected Stripe account
2. **If Stripe account is not connected**: Funds are held in pending status until the artist connects their Stripe account
3. Artists receive 90% of their portion after a 10% platform fee

### 3. Transaction Tracking
- All transactions are recorded in the `purchase_transactions` table
- Artist revenue totals are automatically updated in the `artist_revenue` table
- Real-time tracking of total revenue, payouts, and pending amounts

## Key Features

### Immediate Transfers
- Artists with connected Stripe accounts receive funds instantly
- No waiting for funding goals to be reached
- Automatic calculation and transfer of artist shares

### Pending Payouts
- Artists without connected Stripe accounts have funds held safely
- One-click processing of all pending payouts when Stripe is connected
- Clear visibility of pending amounts in the artist dashboard

### Real-time Tracking
- Live updates of revenue, payouts, and pending amounts
- Transaction history with detailed status tracking
- Platform fee transparency (10% fee clearly displayed)

## Technical Implementation

### Database Changes
- `purchase_transactions` table tracks individual transactions
- `artist_revenue` table maintains running totals
- Automatic triggers update revenue totals when transactions change

### API Endpoints
- **Webhook** (`/api/stripe/webhook`): Processes payments and creates transfers
- **Process Pending** (`/api/stripe/process-pending-payouts`): Handles pending payouts
- **Checkout** (`/api/stripe/checkout`): Creates payment sessions with artist metadata

### Frontend Updates
- Artist dashboard shows real-time earnings
- Payouts tab displays connection status and pending amounts
- Clear messaging about immediate payment benefits

## Setup Instructions

### 1. Database Setup
Run the `setup_immediate_payouts.sql` script in your Supabase SQL Editor to create necessary tables and triggers.

### 2. Environment Variables
Ensure your Stripe environment variables are configured:
```
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

### 3. Webhook Configuration
Configure your Stripe webhook to listen for `checkout.session.completed` events and point to your webhook endpoint.

## Artist Experience

### Before Connecting Stripe
- Artists can see pending payouts in their dashboard
- Clear messaging about connecting Stripe to receive funds
- Funds are safely held until connection is complete

### After Connecting Stripe
- Immediate payouts for all future purchases
- One-click processing of any pending payouts
- Real-time visibility of earnings and transfers

### Dashboard Features
- **Overview**: Total revenue, payouts, and connection status
- **Payouts Tab**: Detailed earnings breakdown and Stripe integration
- **Transaction History**: Complete record of all purchases and transfers

## Benefits

### For Artists
- **Immediate earnings**: No waiting for funding goals
- **Transparent fees**: Clear 10% platform fee structure
- **Real-time tracking**: Live updates of all financial activity
- **Secure transfers**: Direct deposits to connected bank accounts

### For Fans
- **Immediate impact**: Artists benefit from every purchase
- **Transparent system**: Clear understanding of where funds go
- **Better engagement**: Artists are motivated to promote their work

### For Platform
- **Increased artist retention**: Immediate financial benefits
- **Better user experience**: Clear, transparent payment system
- **Reduced support**: Automated payout processing

## Monitoring and Support

### Transaction Statuses
- `completed`: Successfully transferred to artist
- `pending_stripe_connection`: Waiting for artist to connect Stripe
- `failed`: Transfer failed (logged with error details)

### Error Handling
- Failed transfers are logged with detailed error messages
- Artists are notified of any issues
- Support team can manually process failed transfers

### Analytics
- Track platform revenue and artist payouts
- Monitor transfer success rates
- Identify artists needing Stripe connection assistance

## Future Enhancements

- **Scheduled payouts**: Option for weekly/monthly payouts instead of immediate
- **Multiple payment methods**: Support for additional payment processors
- **Advanced analytics**: Detailed revenue reporting and insights
- **Tax reporting**: Automated tax document generation for artists

---

This system ensures that artists on Launch That Song receive immediate financial benefits from fan support, creating a more engaging and rewarding experience for both artists and fans. 