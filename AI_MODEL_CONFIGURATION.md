# AI Model Configuration

## ⚠️ CRITICAL: Model Information

### Chat Model
**Model:** `gpt-4.1-mini`  
**NOT:** ~~gpt-4o-mini~~ (Never use this model)

**Location:** `src/app/api/openai-chat/route.ts` line 117

### Embedding Model
**Model:** `text-embedding-3-small` (1536 dimensions)  
**NOT:** ~~text-embedding-3-large~~ (3072 dimensions)

**Locations:**
- `src/app/api/openai-chat/route.ts` line 45 (for RAG queries)
- `src/app/api/query-safety-content/route.ts` line 28 (for safety content search)
- All Python ingestion scripts (`ingest_*.py`)

## Why These Models?

### GPT-4.1-mini
- Latest model with improved reasoning
- Cost-effective for production use
- Excellent performance with RAG context

### text-embedding-3-small
- Matches the embeddings created during document ingestion
- **Critical:** Query embeddings MUST use the same model as ingestion embeddings
- 1536 dimensions (optimal balance of performance and cost)
- All 53 documents in Pinecone were embedded with this model

## System Architecture

```
User Query
    ↓
[Frontend: Chatbot.tsx]
    ↓
[API: /api/openai-chat]
    ↓
1. Generate query embedding → text-embedding-3-small
2. Search Pinecone vector DB → Find relevant documents
3. Retrieve document context
4. Send to GPT-4.1-mini with context
    ↓
Expert response based on actual training materials
```

## Vector Database

- **Platform:** Pinecone
- **Index Name:** mizelconsulting
- **Namespace:** site
- **Total Vectors:** 53 documents
- **Dimension:** 1536 (matches text-embedding-3-small)
- **Similarity Metric:** Cosine similarity

## Document Processing

All documents from Google Drive are:
1. Downloaded and text extracted
2. Chunked (~800 characters per chunk)
3. Embedded using `text-embedding-3-small`
4. Stored in Pinecone with metadata:
   - file_name
   - file_id
   - mime_type
   - modified_time
   - folder_path
   - text (chunk content)

## Configuration Files

### Environment Variables (.env.local)
```
OPENAI_API_KEY=<your-key>
PINECONE_API_KEY=<your-key>
PINECONE_INDEX=mizelconsulting
DEFAULT_NAMESPACE=site
```

### Important Files
- `/src/app/api/openai-chat/route.ts` - Main chat API with RAG
- `/src/components/Chatbot.tsx` - Chat UI component
- `/ingest_incremental.py` - Document ingestion script
- `/ingestion_manifest.json` - Tracks processed files

## Testing

To test the RAG system:
```bash
# Query the API directly
curl -X POST http://localhost:3000/api/query-safety-content \
  -H "Content-Type: application/json" \
  -d '{"query": "What are PPE requirements?", "topK": 3}'

# Or use the chatbot interface
# Open http://localhost:3000 and click the chat button
```

## Monitoring

- Check Pinecone dashboard for vector count and index stats
- Monitor OpenAI API usage for embeddings and completions
- Review chat session logs in Supabase

## Updates

When adding new documents:
1. Upload to Google Drive folder
2. Run `python ingest_incremental.py` or click "Update AI" in admin dashboard
3. New documents will be embedded with `text-embedding-3-small`
4. Chat will automatically have access to new content

## ⚠️ Important Reminders

1. **NEVER** change the chat model to gpt-4o-mini
2. **NEVER** change the embedding model to text-embedding-3-large (without re-ingesting all documents)
3. **ALWAYS** use the same embedding model for queries as was used for ingestion
4. Embedding model dimension MUST match Pinecone index dimension (1536)

## Last Updated
October 18, 2025

