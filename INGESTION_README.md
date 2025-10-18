# Google Drive → Embeddings → Pinecone Ingestion Pipeline

This pipeline ingests safety training content from Google Drive, processes it into embeddings, and stores it in Pinecone for AI-powered search and chat functionality.

## 🚀 Quick Start

### 1. Set Up Environment

```bash
# Create and activate virtual environment
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

### 2. Configure Secrets

Copy the environment template and add your API keys:

```bash
cp env.template .env.local
```

Edit `.env.local` with your actual values:

```bash
# OpenAI API Key for embeddings
OPENAI_API_KEY=sk-your-openai-api-key-here

# Pinecone Configuration
PINECONE_API_KEY=your-pinecone-api-key-here
PINECONE_INDEX=mizel-consulting
DEFAULT_NAMESPACE=site

# Google Drive Configuration
GDRIVE_FOLDER_ID=your-google-drive-folder-id-here
```

### 3. Add Service Account

Place your Google Cloud service account JSON file in the project root as `service-account.json`.

### 4. Run Smoke Tests

```bash
# Test Google Drive access
python tests/test_drive_access.py

# Test Pinecone connectivity
python tests/test_pinecone_query.py
```

### 5. Run Full Ingestion

```bash
python ingest.py
```

## 📋 Prerequisites

### Google Cloud Setup

1. **Create a Google Cloud Project**
2. **Enable Google Drive API**
3. **Create a Service Account**:
   - Go to IAM & Admin → Service Accounts
   - Create new service account
   - Download JSON key file
   - Place as `service-account.json` in project root

4. **Share Google Drive Folder**:
   - Share your content folder with the service account email
   - Grant "Viewer" permissions
   - Copy the folder ID from the URL

### API Keys

- **OpenAI API Key**: Get from [OpenAI Platform](https://platform.openai.com/api-keys)
- **Pinecone API Key**: Get from [Pinecone Console](https://app.pinecone.io/)

## 🔧 Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `OPENAI_API_KEY` | OpenAI API key for embeddings | Required |
| `PINECONE_API_KEY` | Pinecone API key | Required |
| `PINECONE_INDEX` | Pinecone index name | `mizel-consulting` |
| `DEFAULT_NAMESPACE` | Default namespace for vectors | `site` |
| `GDRIVE_FOLDER_ID` | Google Drive folder ID to ingest | Required |
| `NAMESPACE` | Override namespace for specific runs | Optional |

### Chunking Configuration

The pipeline uses these settings for text chunking:

- **Chunk Size**: 700 tokens (approximately 800 characters)
- **Overlap**: 150 tokens
- **Embedding Model**: `text-embedding-3-small` (1536 dimensions)
- **Chat Model**: `gpt-4.1-mini` (NOT gpt-4o-mini)

## 📁 Supported File Types

### Google Workspace Files
- **Google Docs** → Exported as plain text
- **Google Slides** → Exported as plain text  
- **Google Sheets** → Exported as CSV, converted to readable text

### Document Files
- **PDF** → Text extraction (scanned PDFs require OCR - future enhancement)
- **DOCX** → Text extraction
- **TXT** → Direct text processing

## 🔄 How It Works

1. **Authentication**: Uses service account to access Google Drive
2. **File Discovery**: Recursively walks the shared folder
3. **Text Extraction**: Exports Google files or downloads and processes documents
4. **Chunking**: Splits text into overlapping segments (~700 tokens)
5. **Embedding**: Generates embeddings using OpenAI's `text-embedding-3-small`
6. **Storage**: Upserts vectors to Pinecone with rich metadata
7. **Tracking**: Maintains `manifest.json` for incremental processing

## 📊 Metadata Structure

Each vector includes metadata:

```json
{
  "text": "chunk content...",
  "file_id": "google_drive_file_id",
  "file_name": "document_name.pdf",
  "folder_path": "safety-training/osha-30",
  "mime_type": "application/pdf",
  "modified_time": "2024-01-15T10:30:00Z",
  "start_token": 0,
  "end_token": 700
}
```

## 🚨 Important Gotchas

### Google Drive Permissions
- **Critical**: The shared folder must be shared with the service account email (not your personal email)
- **Permission Level**: "Viewer" is sufficient
- **Folder ID**: Use the ID from the URL, not the folder name

### File Processing
- **Scanned PDFs**: Currently not supported (requires OCR - future enhancement)
- **Large Files**: Processing time scales with file size
- **Rate Limits**: Google Drive API has rate limits for large folders

### Pinecone Considerations
- **Index Creation**: Index is created automatically if it doesn't exist
- **Namespace**: Use different namespaces for different content types
- **Costs**: Pinecone charges based on vector count and queries

### Re-run Safety
- **Manifest Tracking**: Only processes changed files on subsequent runs
- **Hash-based**: Uses file modification time and size for change detection
- **Incremental**: Safe to run multiple times without duplicating data

## 🔍 Querying from Your App

### Basic Query Example

```python
from pinecone import Pinecone
from openai import OpenAI

# Initialize clients
pc = Pinecone(api_key="your-pinecone-key")
index = pc.Index("mizel-consulting")
openai_client = OpenAI(api_key="your-openai-key")

# Generate query embedding
query = "OSHA 30 hour construction safety training requirements"
response = openai_client.embeddings.create(
    model="text-embedding-3-small",
    input=query
)
query_embedding = response.data[0].embedding

# Search Pinecone
results = index.query(
    vector=query_embedding,
    top_k=5,
    namespace="site",
    include_metadata=True
)

# Process results
for match in results.matches:
    print(f"File: {match.metadata['file_name']}")
    print(f"Score: {match.score}")
    print(f"Text: {match.metadata['text'][:200]}...")
    print(f"Source: {match.metadata['folder_path']}")
    print("---")
```

### Advanced Query with Filters

```python
# Query with metadata filters
results = index.query(
    vector=query_embedding,
    top_k=10,
    namespace="site",
    include_metadata=True,
    filter={
        "folder_path": {"$regex": "osha.*"},
        "mime_type": "application/pdf"
    }
)
```

### Chat Integration Example

```python
def get_relevant_content(query: str, namespace: str = "site") -> List[Dict]:
    """Get relevant content for chat context."""
    
    # Generate embedding
    response = openai_client.embeddings.create(
        model="text-embedding-3-small",
        input=query
    )
    query_embedding = response.data[0].embedding
    
    # Search Pinecone
    results = index.query(
        vector=query_embedding,
        top_k=5,
        namespace=namespace,
        include_metadata=True
    )
    
    # Format for chat context
    context = []
    for match in results.matches:
        context.append({
            "content": match.metadata["text"],
            "source": match.metadata["file_name"],
            "folder": match.metadata["folder_path"],
            "relevance": match.score
        })
    
    return context
```

## 📈 Monitoring and Logs

### Log Files
- **ingestion.log**: Detailed processing logs
- **manifest.json**: Tracks processed files and statistics

### Key Metrics
- Total files processed
- Chunks created
- Embeddings generated
- Processing time
- Error rates

## 🛠️ Troubleshooting

### Common Issues

1. **"service-account.json not found"**
   - Ensure the file is in the project root
   - Check file permissions

2. **"GDRIVE_FOLDER_ID not found"**
   - Verify `.env.local` exists and has the correct folder ID
   - Folder ID is in the URL: `https://drive.google.com/drive/folders/FOLDER_ID_HERE`

3. **"No files found in folder"**
   - Check that the folder is shared with the service account email
   - Verify the service account has "Viewer" permissions

4. **"Pinecone index not found"**
   - The index will be created automatically on first run
   - Check your Pinecone API key and account status

5. **"OpenAI API error"**
   - Verify your OpenAI API key is valid
   - Check your OpenAI account has sufficient credits

### Debug Mode

Enable debug logging by modifying the logging level in `ingest.py`:

```python
logging.basicConfig(level=logging.DEBUG)
```

## 🔄 Maintenance

### Regular Tasks
- **Monitor logs** for processing errors
- **Check Pinecone usage** and costs
- **Update dependencies** periodically
- **Review manifest.json** for processing statistics

### Scaling Considerations
- **Large folders**: Consider processing in batches
- **Rate limits**: Add delays between API calls if needed
- **Storage costs**: Monitor Pinecone vector count and costs

## 📞 Support

For issues with this pipeline:
1. Check the logs in `ingestion.log`
2. Run the smoke tests to isolate the problem
3. Verify all API keys and permissions
4. Check the troubleshooting section above

---

**Happy ingesting! 🚀**
