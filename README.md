# Mizel Consulting - Safety Training Platform

A comprehensive safety training platform built with Next.js 15, providing OSHA certification courses, on-site training booking, and client management for HR directors and companies.

## Features

- **Safety Training Courses**: OSHA 30-Hour Construction, OSHA 10-Hour General Industry, Fall Protection, Electrical Safety, and more
- **Client Management**: Company accounts for HR directors with employee enrollment tracking
- **On-Site Training**: Booking system for in-person safety training sessions
- **Blog System**: SEO-optimized blog with safety training content
- **Admin Dashboard**: Comprehensive analytics and course management
- **AI Chatbot**: Intelligent assistant powered by GPT-4.1-mini with RAG (Retrieval Augmented Generation) using Pinecone vector database for expert knowledge from 53+ training documents. Features markdown rendering for beautifully formatted responses with proper spacing, lists, and emphasis.
- **Partnership System**: Revenue sharing with training partners via Stripe Connect

## Technology Stack

- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Auth, Real-time)
- **AI & ML**: OpenAI GPT-4.1-mini, Pinecone Vector Database, RAG Pipeline
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
   -- Execute mizel_consulting_schema.sql in Supabase SQL Editor
   ```

2. Set up environment variables:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   ```

## Deployment

The platform is deployed on Vercel with automatic deployments from the main branch.

## AI-Powered Chat with RAG

The platform features an intelligent AI chatbot that uses GPT-4.1-mini combined with Retrieval Augmented Generation (RAG) to provide expert answers based on your actual training materials.

### How It Works

1. **Document Ingestion**: 53+ training documents (DOCX, PDF, PPT, PPTX) are processed from Google Drive
2. **Vectorization**: Documents are chunked and embedded using OpenAI's text-embedding-3-small model
3. **Storage**: Vectors stored in Pinecone for fast semantic search
4. **Query Pipeline**: User questions → Embedding → Vector search → Context retrieval → GPT-4.1-mini response
5. **Expert Responses**: AI answers questions using actual content from training materials with source citations

### AI Content Ingestion Pipeline

This project includes a Google Drive → Embeddings → Pinecone ingestion pipeline for AI-powered content search and chat functionality.

### Quick Setup

1. **Install Python dependencies:**
   ```bash
   python3 -m venv venv
   source venv/bin/activate
   pip install -r requirements.txt
   ```

2. **Configure environment:**
   ```bash
   cp env.template .env.local
   # Edit .env.local with your API keys
   ```

3. **Add service account:**
   - Place your Google Cloud service account JSON as `service-account.json`

4. **Run tests:**
   ```bash
   python tests/test_drive_access.py
   python tests/test_pinecone_query.py
   ```

5. **Run ingestion:**
   ```bash
   python ingest.py
   ```

6. **Test queries:**
   ```bash
   python query_example.py
   ```

### Features

- **File Support**: Google Docs, Slides, Sheets, PDFs, DOCX, TXT
- **Smart Chunking**: 700-token chunks with 150-token overlap
- **Rich Metadata**: File paths, types, modification times
- **Incremental Processing**: Only processes changed files
- **Namespace Support**: Organize content by course or category

For detailed documentation, see [INGESTION_README.md](./INGESTION_README.md).

## Contact

For questions about safety training services, contact Kris Mizel at kris@mizelconsulting.com# Deployment trigger Sat Oct 18 17:25:05 EDT 2025
