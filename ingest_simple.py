#!/usr/bin/env python3
"""
Simplified ingestion script that processes files one by one.
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
import tiktoken

load_dotenv('.env.local')

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def setup_clients():
    """Initialize clients."""
    # Google Drive
    credentials = service_account.Credentials.from_service_account_file(
        'service-account.json',
        scopes=['https://www.googleapis.com/auth/drive.readonly']
    )
    drive_service = build('drive', 'v3', credentials=credentials)
    
    # OpenAI
    openai_client = OpenAI(api_key=os.getenv('OPENAI_API_KEY'))
    
    # Pinecone
    pc = Pinecone(api_key=os.getenv('PINECONE_API_KEY'))
    index = pc.Index('mizelconsulting')
    
    return drive_service, openai_client, index

def get_supported_files(drive_service, folder_id):
    """Get list of supported files from Google Drive."""
    files = []
    page_token = None
    
    while True:
        try:
            results = drive_service.files().list(
                q=f"'{folder_id}' in parents and trashed=false",
                fields="nextPageToken, files(id, name, mimeType, modifiedTime, size)",
                pageToken=page_token
            ).execute()
            
            items = results.get('files', [])
            
            for item in items:
                mime_type = item.get('mimeType', '')
                
                # Only process supported file types
                if mime_type in [
                    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',  # DOCX
                    'application/pdf',  # PDF
                    'text/plain'  # TXT
                ]:
                    files.append(item)
            
            page_token = results.get('nextPageToken')
            if not page_token:
                break
                
        except Exception as e:
            logger.error(f"Error listing files: {e}")
            break
    
    return files

def process_docx(file_id, file_metadata, drive_service):
    """Process DOCX file."""
    try:
        request = drive_service.files().get_media(fileId=file_id)
        fh = io.BytesIO()
        downloader = MediaIoBaseDownload(fh, request)
        done = False
        while done is False:
            status, done = downloader.next_chunk()
        
        content = fh.getvalue()
        doc = Document(io.BytesIO(content))
        text = ''
        for paragraph in doc.paragraphs:
            text += paragraph.text + '\n'
        
        return text.strip()
    except Exception as e:
        logger.error(f"Error processing DOCX {file_metadata['name']}: {e}")
        return None

def chunk_text(text, chunk_size=700, overlap=150):
    """Simple text chunking."""
    if not text.strip():
        return []
    
    encoding = tiktoken.get_encoding("cl100k_base")
    tokens = encoding.encode(text)
    
    chunks = []
    start = 0
    
    while start < len(tokens):
        end = min(start + chunk_size, len(tokens))
        chunk_tokens = tokens[start:end]
        chunk_text = encoding.decode(chunk_tokens)
        
        if chunk_text.strip():
            chunks.append({
                'text': chunk_text.strip(),
                'start_token': start,
                'end_token': end
            })
        
        start = end - overlap
        if start >= len(tokens):
            break
    
    return chunks

def process_file(file_metadata, drive_service, openai_client, index):
    """Process a single file."""
    file_id = file_metadata['id']
    file_name = file_metadata['name']
    mime_type = file_metadata['mimeType']
    
    logger.info(f"🔄 Processing: {file_name}")
    
    # Extract text based on file type
    text = None
    if mime_type == 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
        text = process_docx(file_id, file_metadata, drive_service)
    # Add other file type handlers here if needed
    
    if not text:
        logger.warning(f"⚠️ No text extracted from: {file_name}")
        return 0
    
    # Chunk the text
    chunks = chunk_text(text)
    if not chunks:
        logger.warning(f"⚠️ No chunks created from: {file_name}")
        return 0
    
    logger.info(f"📝 Created {len(chunks)} chunks from {file_name}")
    
    # Process chunks in batches
    batch_size = 10
    total_vectors = 0
    
    for i in range(0, len(chunks), batch_size):
        batch_chunks = chunks[i:i + batch_size]
        
        # Prepare texts for embedding
        texts = [chunk['text'] for chunk in batch_chunks]
        
        try:
            # Generate embeddings
            logger.info(f"🧠 Generating embeddings for batch {i//batch_size + 1}...")
            response = openai_client.embeddings.create(
                model="text-embedding-3-small",
                input=texts
            )
            
            # Prepare vectors for Pinecone
            vectors = []
            for j, chunk in enumerate(batch_chunks):
                vector_id = f"{file_id}_{chunk['start_token']}_{chunk['end_token']}"
                
                vectors.append({
                    'id': vector_id,
                    'values': response.data[j].embedding,
                    'metadata': {
                        'text': chunk['text'],
                        'file_id': file_id,
                        'file_name': file_name,
                        'folder_path': 'site',
                        'mime_type': mime_type,
                        'modified_time': file_metadata.get('modifiedTime', ''),
                        'start_token': chunk['start_token'],
                        'end_token': chunk['end_token']
                    }
                })
            
            # Upsert to Pinecone
            logger.info(f"📤 Upserting {len(vectors)} vectors to Pinecone...")
            index.upsert(vectors=vectors, namespace='site')
            total_vectors += len(vectors)
            
            logger.info(f"✅ Successfully upserted batch {i//batch_size + 1}")
            
        except Exception as e:
            logger.error(f"❌ Error processing batch: {e}")
            continue
    
    logger.info(f"✅ Completed {file_name} - {total_vectors} vectors")
    return total_vectors

def main():
    """Main ingestion function."""
    try:
        drive_service, openai_client, index = setup_clients()
        logger.info("✅ Clients initialized")
        
        folder_id = os.getenv('GDRIVE_FOLDER_ID')
        logger.info(f"📁 Processing folder: {folder_id}")
        
        # Get supported files
        files = get_supported_files(drive_service, folder_id)
        logger.info(f"📊 Found {len(files)} supported files to process")
        
        total_vectors = 0
        processed_files = 0
        
        for file_metadata in files:
            try:
                vectors = process_file(file_metadata, drive_service, openai_client, index)
                total_vectors += vectors
                processed_files += 1
                
                logger.info(f"📊 Progress: {processed_files}/{len(files)} files, {total_vectors} vectors")
                
            except Exception as e:
                logger.error(f"❌ Error processing file {file_metadata['name']}: {e}")
                continue
        
        logger.info("=" * 50)
        logger.info("📊 INGESTION COMPLETE")
        logger.info("=" * 50)
        logger.info(f"✅ Files processed: {processed_files}/{len(files)}")
        logger.info(f"🧩 Total vectors created: {total_vectors}")
        logger.info("=" * 50)
        
    except Exception as e:
        logger.error(f"❌ Pipeline failed: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()


