# Mitzel Consulting - Safety Training Platform

A comprehensive safety training platform built with Next.js 15, providing OSHA certification courses, on-site training booking, and client management for HR directors and companies.

## Features

- **Safety Training Courses**: OSHA 30-Hour Construction, OSHA 10-Hour General Industry, Fall Protection, Electrical Safety, and more
- **Client Management**: Company accounts for HR directors with employee enrollment tracking
- **On-Site Training**: Booking system for in-person safety training sessions
- **Blog System**: SEO-optimized blog with safety training content
- **Admin Dashboard**: Comprehensive analytics and course management
- **AI Chatbot**: Intelligent assistant for course inquiries and lead generation
- **Partnership System**: Revenue sharing with training partners via Stripe Connect

## Technology Stack

- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Auth, Real-time)
- **Payments**: Stripe with Connect for partner payouts
- **Deployment**: Vercel
- **LMS Integration**: WordPress LMS Tutor integration

## Getting Started

First, run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Database Setup

1. Run the database schema in your Supabase project:
   ```sql
   -- Execute mitzel_consulting_schema.sql in Supabase SQL Editor
   ```

2. Set up environment variables:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   ```

## Deployment

The platform is deployed on Vercel with automatic deployments from the main branch.

## Contact

For questions about safety training services, contact Kris Mitzel at kris@mitzelconsulting.com