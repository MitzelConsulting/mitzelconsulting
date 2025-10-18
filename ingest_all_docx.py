#!/usr/bin/env python3
"""
Ingest all DOCX files using the working minimal approach.
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

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler('ingest_all_docx.log')
    ]
)
logger = logging.getLogger(__name__)

def setup_clients():
    """Initialize clients."""
    logger.info("🔧 Setting up clients...")
    
    credentials = service_account.Credentials.from_service_account_file(
        'service-account.json',
        scopes=['https://www.googleapis.com/auth/drive.readonly']
    )
    drive_service = build('drive', 'v3', credentials=credentials)
    
    openai_client = OpenAI(api_key=os.getenv('OPENAI_API_KEY'))
    
    pc = Pinecone(api_key=os.getenv('PINECONE_API_KEY'))
    index = pc.Index('mizelconsulting')
    
    logger.info("✅ Clients initialized")
    return drive_service, openai_client, index

def get_all_docx_files(drive_service, folder_id):
    """Get all DOCX files from the folder."""
    logger.info(f"📁 Getting all DOCX files from folder: {folder_id}")
    
    try:
        results = drive_service.files().list(
            q=f"'{folder_id}' in parents and trashed=false and mimeType='application/vnd.openxmlformats-officedocument.wordprocessingml.document'",
            fields="files(id, name, mimeType, modifiedTime, size)"
        ).execute()
        
        files = results.get('files', [])
        logger.info(f"📊 Found {len(files)} DOCX files")
        
        return files
        
    except Exception as e:
        logger.error(f"❌ Error getting files: {e}")
        return []

def process_docx_file(file_metadata, drive_service):
    """Process a single DOCX file and extract all text."""
    file_id = file_metadata['id']
    file_name = file_metadata['name']
    
    logger.info(f"🔄 Processing: {file_name}")
    
    try:
        # Download file
        request = drive_service.files().get_media(fileId=file_id)
        fh = io.BytesIO()
        downloader = MediaIoBaseDownload(fh, request)
        done = False
        while done is False:
            status, done = downloader.next_chunk()
        
        content = fh.getvalue()
        logger.info(f"✅ Downloaded {len(content)} bytes")
        
        # Extract text
        doc = Document(io.BytesIO(content))
        text = ''
        for paragraph in doc.paragraphs:
            text += paragraph.text + '\n'
        
        text = text.strip()
        logger.info(f"✅ Extracted {len(text)} characters")
        
        if not text:
            logger.warning(f"⚠️ No text extracted from {file_name}")
            return None
        
        return {
            'text': text,
            'file_id': file_id,
            'file_name': file_name,
            'mime_type': file_metadata.get('mimeType', ''),
            'modified_time': file_metadata.get('modifiedTime', '')
        }
        
    except Exception as e:
        logger.error(f"❌ Error processing {file_name}: {e}")
        return None

def chunk_text(text, chunk_size=500, overlap=100):
    """Simple text chunking."""
    if not text.strip():
        return []
    
    chunks = []
    start = 0
    
    while start < len(text):
        end = min(start + chunk_size, len(text))
        chunk_text = text[start:end].strip()
        
        if chunk_text:
            chunks.append({
                'text': chunk_text,
                'start_char': start,
                'end_char': end
            })
        
        start = end - overlap
        if start >= len(text):
            break
    
    return chunks

def process_file_with_chunks(file_data, openai_client, index):
    """Process file text into chunks and upsert to Pinecone."""
    file_id = file_data['file_id']
    file_name = file_data['file_name']
    
    # Create chunks
    chunks = chunk_text(file_data['text'])
    logger.info(f"📄 Created {len(chunks)} chunks from {file_name}")
    
    if not chunks:
        logger.warning(f"⚠️ No chunks created from {file_name}")
        return 0
    
    # Process chunks in small batches
    batch_size = 5
    total_vectors = 0
    
    for i in range(0, len(chunks), batch_size):
        batch_chunks = chunks[i:i + batch_size]
        
        # Prepare texts for embedding
        texts = [chunk['text'] for chunk in batch_chunks]
        
        try:
            # Generate embeddings
            logger.info(f"🧠 Generating embeddings for batch {i//batch_size + 1}/{(len(chunks)-1)//batch_size + 1}...")
            response = openai_client.embeddings.create(
                model="text-embedding-3-small",
                input=texts
            )
            
            # Prepare vectors for Pinecone
            vectors = []
            for j, chunk in enumerate(batch_chunks):
                vector_id = f"{file_id}_{chunk['start_char']}_{chunk['end_char']}"
                
                vectors.append({
                    'id': vector_id,
                    'values': response.data[j].embedding,
                    'metadata': {
                        'text': chunk['text'],
                        'file_id': file_id,
                        'file_name': file_name,
                        'folder_path': 'site',
                        'mime_type': file_data['mime_type'],
                        'modified_time': file_data['modified_time'],
                        'start_char': chunk['start_char'],
                        'end_char': chunk['end_char']
                    }
                })
            
            # Upsert to Pinecone
            logger.info(f"📤 Upserting {len(vectors)} vectors...")
            index.upsert(vectors=vectors, namespace='site')
            total_vectors += len(vectors)
            
            logger.info(f"✅ Successfully upserted batch {i//batch_size + 1}")
            
        except Exception as e:
            logger.error(f"❌ Error processing batch: {e}")
            continue
    
    logger.info(f"✅ Completed {file_name} - {total_vectors} vectors")
    return total_vectors

def main():
    """Main function."""
    logger.info("🚀 Starting DOCX ingestion")
    
    try:
        drive_service, openai_client, index = setup_clients()
        
        folder_id = os.getenv('GDRIVE_FOLDER_ID')
        files = get_all_docx_files(drive_service, folder_id)
        
        if not files:
            logger.error("❌ No DOCX files found")
            return
        
        total_vectors = 0
        processed_files = 0
        
        for i, file_metadata in enumerate(files, 1):
            logger.info(f"\n{'='*60}")
            logger.info(f"📄 Processing file {i}/{len(files)}: {file_metadata['name']}")
            logger.info(f"{'='*60}")
            
            # Process file
            file_data = process_docx_file(file_metadata, drive_service)
            if not file_data:
                logger.error(f"❌ Failed to process {file_metadata['name']}")
                continue
            
            # Process chunks and upsert
            vectors = process_file_with_chunks(file_data, openai_client, index)
            total_vectors += vectors
            processed_files += 1
            
            logger.info(f"📊 Progress: {processed_files}/{len(files)} files, {total_vectors} vectors total")
        
        # Test query
        logger.info(f"\n{'='*60}")
        logger.info("🧪 Testing query functionality")
        logger.info(f"{'='*60}")
        
        query = "safety training requirements"
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
        
        logger.info(f"🔍 Query returned {len(results.matches)} results:")
        for match in results.matches:
            logger.info(f"  - {match.metadata['file_name']} (Score: {match.score:.4f})")
        
        # Summary
        logger.info(f"\n{'='*60}")
        logger.info("📊 DOCX INGESTION SUMMARY")
        logger.info(f"{'='*60}")
        logger.info(f"📁 Files attempted: {len(files)}")
        logger.info(f"✅ Files successful: {processed_files}")
        logger.info(f"❌ Files failed: {len(files) - processed_files}")
        logger.info(f"🧩 Total vectors created: {total_vectors}")
        logger.info(f"{'='*60}")
        
    except Exception as e:
        logger.error(f"❌ Pipeline failed: {e}")
        import traceback
        logger.error(traceback.format_exc())

if __name__ == "__main__":
    main()

