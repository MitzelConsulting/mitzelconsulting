#!/usr/bin/env python3
"""
Minimal ingestion script to test the pipeline with one chunk per file.
"""

import os
import json
import logging
from dotenv import load_dotenv
from google.oauth2 import service_account
from googleapiclient.discovery import build
from googleapiclient.http import MediaIoBaseDownload
from openai import OpenAI
from pinecone import Pinecone
from docx import Document
import io

load_dotenv('.env.local')

# Configure logging with more detail
logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler('ingest_minimal.log')
    ]
)
logger = logging.getLogger(__name__)

def setup_clients():
    """Initialize clients with detailed logging."""
    logger.info("🔧 Setting up clients...")
    
    # Google Drive
    logger.info("📁 Initializing Google Drive client...")
    credentials = service_account.Credentials.from_service_account_file(
        'service-account.json',
        scopes=['https://www.googleapis.com/auth/drive.readonly']
    )
    drive_service = build('drive', 'v3', credentials=credentials)
    logger.info("✅ Google Drive client ready")
    
    # OpenAI
    logger.info("🧠 Initializing OpenAI client...")
    openai_client = OpenAI(api_key=os.getenv('OPENAI_API_KEY'))
    logger.info("✅ OpenAI client ready")
    
    # Pinecone
    logger.info("📊 Initializing Pinecone client...")
    pc = Pinecone(api_key=os.getenv('PINECONE_API_KEY'))
    index = pc.Index('mizelconsulting')
    logger.info("✅ Pinecone client ready")
    
    return drive_service, openai_client, index

def get_docx_files(drive_service, folder_id):
    """Get DOCX files only."""
    logger.info(f"📁 Getting DOCX files from folder: {folder_id}")
    
    try:
        results = drive_service.files().list(
            q=f"'{folder_id}' in parents and trashed=false and mimeType='application/vnd.openxmlformats-officedocument.wordprocessingml.document'",
            fields="files(id, name, mimeType, modifiedTime, size)"
        ).execute()
        
        files = results.get('files', [])
        logger.info(f"📊 Found {len(files)} DOCX files")
        
        for file in files:
            logger.info(f"  - {file['name']} ({file['id']})")
        
        return files
        
    except Exception as e:
        logger.error(f"❌ Error getting files: {e}")
        return []

def process_single_docx(file_metadata, drive_service):
    """Process a single DOCX file and extract first chunk."""
    file_id = file_metadata['id']
    file_name = file_metadata['name']
    
    logger.info(f"🔄 Processing: {file_name}")
    
    try:
        # Download file
        logger.info(f"📥 Downloading {file_name}...")
        request = drive_service.files().get_media(fileId=file_id)
        fh = io.BytesIO()
        downloader = MediaIoBaseDownload(fh, request)
        done = False
        while done is False:
            status, done = downloader.next_chunk()
        
        content = fh.getvalue()
        logger.info(f"✅ Downloaded {len(content)} bytes")
        
        # Extract text
        logger.info(f"📝 Extracting text from {file_name}...")
        doc = Document(io.BytesIO(content))
        text = ''
        for paragraph in doc.paragraphs:
            text += paragraph.text + '\n'
        
        text = text.strip()
        logger.info(f"✅ Extracted {len(text)} characters")
        
        if not text:
            logger.warning(f"⚠️ No text extracted from {file_name}")
            return None
        
        # Take first 500 characters as single chunk
        chunk_text = text[:500] + "..." if len(text) > 500 else text
        logger.info(f"📄 Created chunk with {len(chunk_text)} characters")
        
        return {
            'text': chunk_text,
            'file_id': file_id,
            'file_name': file_name,
            'mime_type': file_metadata.get('mimeType', ''),
            'modified_time': file_metadata.get('modifiedTime', '')
        }
        
    except Exception as e:
        logger.error(f"❌ Error processing {file_name}: {e}")
        import traceback
        logger.error(traceback.format_exc())
        return None

def generate_embedding(text, openai_client):
    """Generate embedding with detailed logging."""
    logger.info(f"🧠 Generating embedding for text of length {len(text)}...")
    
    try:
        response = openai_client.embeddings.create(
            model="text-embedding-3-small",
            input=text
        )
        
        embedding = response.data[0].embedding
        logger.info(f"✅ Generated embedding with {len(embedding)} dimensions")
        
        return embedding
        
    except Exception as e:
        logger.error(f"❌ Error generating embedding: {e}")
        import traceback
        logger.error(traceback.format_exc())
        return None

def upsert_to_pinecone(vector, index):
    """Upsert vector to Pinecone with detailed logging."""
    logger.info(f"📤 Upserting vector to Pinecone...")
    logger.info(f"   Vector ID: {vector['id']}")
    logger.info(f"   Metadata keys: {list(vector['metadata'].keys())}")
    
    try:
        index.upsert(vectors=[vector], namespace='site')
        logger.info("✅ Successfully upserted to Pinecone")
        return True
        
    except Exception as e:
        logger.error(f"❌ Error upserting to Pinecone: {e}")
        import traceback
        logger.error(traceback.format_exc())
        return False

def test_query(index, openai_client):
    """Test query to verify ingestion worked."""
    logger.info("🔍 Testing query...")
    
    try:
        query = "process safety"
        response = openai_client.embeddings.create(
            model="text-embedding-3-small",
            input=query
        )
        query_embedding = response.data[0].embedding
        
        results = index.query(
            vector=query_embedding,
            top_k=5,
            namespace='site',
            include_metadata=True
        )
        
        logger.info(f"🔍 Query returned {len(results.matches)} results")
        for match in results.matches:
            logger.info(f"  - {match.metadata['file_name']} (Score: {match.score:.4f})")
        
        return True
        
    except Exception as e:
        logger.error(f"❌ Error testing query: {e}")
        import traceback
        logger.error(traceback.format_exc())
        return False

def main():
    """Main function with step-by-step logging."""
    logger.info("🚀 Starting minimal ingestion test")
    
    try:
        # Setup
        drive_service, openai_client, index = setup_clients()
        
        # Get files
        folder_id = os.getenv('GDRIVE_FOLDER_ID')
        files = get_docx_files(drive_service, folder_id)
        
        if not files:
            logger.error("❌ No DOCX files found")
            return
        
        # Process first 3 files only
        files_to_process = files[:3]
        logger.info(f"📊 Processing {len(files_to_process)} files")
        
        successful_uploads = 0
        
        for i, file_metadata in enumerate(files_to_process, 1):
            logger.info(f"\n{'='*50}")
            logger.info(f"📄 Processing file {i}/{len(files_to_process)}: {file_metadata['name']}")
            logger.info(f"{'='*50}")
            
            # Process file
            chunk_data = process_single_docx(file_metadata, drive_service)
            if not chunk_data:
                logger.error(f"❌ Failed to process {file_metadata['name']}")
                continue
            
            # Generate embedding
            embedding = generate_embedding(chunk_data['text'], openai_client)
            if embedding is None:
                logger.error(f"❌ Failed to generate embedding for {file_metadata['name']}")
                continue
            
            # Prepare vector
            vector = {
                'id': f"{chunk_data['file_id']}_minimal",
                'values': embedding,
                'metadata': {
                    'text': chunk_data['text'],
                    'file_id': chunk_data['file_id'],
                    'file_name': chunk_data['file_name'],
                    'folder_path': 'test',
                    'mime_type': chunk_data['mime_type'],
                    'modified_time': chunk_data['modified_time']
                }
            }
            
            # Upsert to Pinecone
            if upsert_to_pinecone(vector, index):
                successful_uploads += 1
                logger.info(f"✅ Successfully processed {file_metadata['name']}")
            else:
                logger.error(f"❌ Failed to upsert {file_metadata['name']}")
        
        # Test query
        logger.info(f"\n{'='*50}")
        logger.info("🧪 Testing query functionality")
        logger.info(f"{'='*50}")
        test_query(index, openai_client)
        
        # Summary
        logger.info(f"\n{'='*50}")
        logger.info("📊 MINIMAL INGESTION SUMMARY")
        logger.info(f"{'='*50}")
        logger.info(f"📁 Files attempted: {len(files_to_process)}")
        logger.info(f"✅ Files successful: {successful_uploads}")
        logger.info(f"❌ Files failed: {len(files_to_process) - successful_uploads}")
        
    except Exception as e:
        logger.error(f"❌ Pipeline failed: {e}")
        import traceback
        logger.error(traceback.format_exc())

if __name__ == "__main__":
    main()

