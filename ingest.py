#!/usr/bin/env python3
"""
Google Drive → Embeddings → Pinecone Ingestion Pipeline
for Mizel Consulting Safety Training Website

This script:
1. Authenticates with Google Drive using service account
2. Recursively walks a shared Drive folder
3. Exports Google Docs/Slides/Sheets to text/CSV
4. Extracts text from PDFs, DOCX, and TXT files
5. Chunks text (~700 tokens with 150 overlap)
6. Embeds with OpenAI text-embedding-3-large
7. Upserts to Pinecone index with rich metadata
8. Tracks processed files in manifest.json for incremental runs
9. Supports optional NAMESPACE per course
"""

import os
import json
import hashlib
import logging
from pathlib import Path
from typing import List, Dict, Any, Optional, Tuple
from datetime import datetime
import io
import csv

# Google Drive API
from google.oauth2 import service_account
from googleapiclient.discovery import build
from googleapiclient.http import MediaIoBaseDownload

# OpenAI
import openai
from openai import OpenAI

# Pinecone
from pinecone import Pinecone

# Document processing
import PyPDF2
from docx import Document
import tiktoken

# Utilities
from dotenv import load_dotenv

# Load environment variables
load_dotenv('.env.local')

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('ingestion.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

class DriveIngestionPipeline:
    def __init__(self):
        """Initialize the ingestion pipeline with API clients."""
        self.setup_clients()
        self.manifest_file = 'manifest.json'
        self.manifest = self.load_manifest()
        
        # Chunking configuration
        self.chunk_size = 700  # tokens
        self.chunk_overlap = 150  # tokens
        self.encoding = tiktoken.get_encoding("cl100k_base")
        
        # Batch processing
        self.batch_size = 100
        
    def setup_clients(self):
        """Initialize Google Drive, OpenAI, and Pinecone clients."""
        try:
            # Google Drive API
            if not os.path.exists('service-account.json'):
                raise FileNotFoundError("service-account.json not found in project root")
            
            credentials = service_account.Credentials.from_service_account_file(
                'service-account.json',
                scopes=['https://www.googleapis.com/auth/drive.readonly']
            )
            self.drive_service = build('drive', 'v3', credentials=credentials)
            logger.info("✅ Google Drive API client initialized")
            
            # OpenAI client
            openai_api_key = os.getenv('OPENAI_API_KEY')
            if not openai_api_key:
                raise ValueError("OPENAI_API_KEY not found in environment")
            self.openai_client = OpenAI(api_key=openai_api_key)
            logger.info("✅ OpenAI client initialized")
            
            # Pinecone client
            pinecone_api_key = os.getenv('PINECONE_API_KEY')
            if not pinecone_api_key:
                raise ValueError("PINECONE_API_KEY not found in environment")
            
            # Initialize Pinecone with the correct host
            self.pc = Pinecone(api_key=pinecone_api_key)
            self.index_name = os.getenv('PINECONE_INDEX', 'mizelconsulting')
            self.namespace = os.getenv('NAMESPACE', os.getenv('DEFAULT_NAMESPACE', 'site'))
            
            # Connect to the existing index using the host URL
            logger.info(f"🔗 Connecting to index: {self.index_name}")
            try:
                self.index = self.pc.Index(self.index_name)
                # Test the connection with a simple query
                test_result = self.index.describe_index_stats()
                logger.info(f"✅ Successfully connected to index: {self.index_name}")
                logger.info(f"📊 Index stats: {test_result}")
            except Exception as e:
                logger.error(f"❌ Failed to connect to index '{self.index_name}': {e}")
                raise ValueError(f"Cannot connect to index '{self.index_name}'. Please verify it exists and is accessible.")
            logger.info(f"✅ Pinecone client initialized - Index: {self.index_name}, Namespace: {self.namespace}")
            
        except Exception as e:
            logger.error(f"❌ Failed to initialize clients: {e}")
            raise
    
    def load_manifest(self) -> Dict[str, Any]:
        """Load the manifest file to track processed files."""
        if os.path.exists(self.manifest_file):
            with open(self.manifest_file, 'r') as f:
                manifest = json.load(f)
                # Handle both old format (flat dict) and new format (nested dict)
                if 'processed_files' not in manifest:
                    # Convert old format to new format
                    processed_files = {}
                    for file_id, file_data in manifest.items():
                        if isinstance(file_data, dict) and 'name' in file_data:
                            processed_files[file_id] = file_data
                    manifest = {
                        'processed_files': processed_files,
                        'last_run': None,
                        'total_files': len(processed_files),
                        'total_chunks': sum(f.get('chunks', 0) for f in processed_files.values())
                    }
                return manifest
        return {
            'processed_files': {},
            'last_run': None,
            'total_files': 0,
            'total_chunks': 0
        }
    
    def save_manifest(self):
        """Save the manifest file."""
        self.manifest['last_run'] = datetime.now().isoformat()
        with open(self.manifest_file, 'w') as f:
            json.dump(self.manifest, f, indent=2)
    
    def get_file_hash(self, file_metadata: Dict[str, Any]) -> str:
        """Generate a hash for file change detection."""
        # Use modified time and size for change detection
        modified_time = file_metadata.get('modifiedTime', '')
        size = str(file_metadata.get('size', 0))
        return hashlib.md5(f"{modified_time}_{size}".encode()).hexdigest()
    
    def list_drive_files(self, folder_id: str) -> List[Dict[str, Any]]:
        """Recursively list all files in a Google Drive folder."""
        files = []
        page_token = None
        
        while True:
            try:
                # List files in current folder
                results = self.drive_service.files().list(
                    q=f"'{folder_id}' in parents and trashed=false",
                    fields="nextPageToken, files(id, name, mimeType, modifiedTime, size, parents)",
                    pageToken=page_token
                ).execute()
                
                items = results.get('files', [])
                
                for item in items:
                    mime_type = item.get('mimeType', '')
                    
                    # Handle folders recursively
                    if mime_type == 'application/vnd.google-apps.folder':
                        logger.info(f"📁 Processing folder: {item['name']}")
                        subfolder_files = self.list_drive_files(item['id'])
                        files.extend(subfolder_files)
                    else:
                        # Add file metadata
                        item['folder_path'] = self.get_folder_path(item['id'])
                        files.append(item)
                
                page_token = results.get('nextPageToken')
                if not page_token:
                    break
                    
            except Exception as e:
                logger.error(f"❌ Error listing files: {e}")
                break
        
        return files
    
    def get_folder_path(self, file_id: str) -> str:
        """Get the folder path for a file."""
        try:
            file_metadata = self.drive_service.files().get(
                fileId=file_id,
                fields="parents"
            ).execute()
            
            parents = file_metadata.get('parents', [])
            if not parents:
                return "root"
            
            # Get parent folder name
            parent = self.drive_service.files().get(
                fileId=parents[0],
                fields="name, parents"
            ).execute()
            
            parent_name = parent.get('name', 'Unknown')
            parent_parents = parent.get('parents', [])
            
            if parent_parents:
                return f"{self.get_folder_path(parents[0])}/{parent_name}"
            else:
                return parent_name
                
        except Exception as e:
            logger.warning(f"Could not get folder path for {file_id}: {e}")
            return "unknown"
    
    def extract_text_from_file(self, file_id: str, file_metadata: Dict[str, Any]) -> Optional[str]:
        """Extract text from various file types."""
        mime_type = file_metadata.get('mimeType', '')
        file_name = file_metadata.get('name', '')
        
        try:
            # Google Workspace files
            if mime_type in [
                'application/vnd.google-apps.document',
                'application/vnd.google-apps.presentation',
                'application/vnd.google-apps.spreadsheet'
            ]:
                return self.export_google_file(file_id, mime_type)
            
            # Download and process other files
            elif mime_type in [
                'application/pdf',
                'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                'text/plain'
            ]:
                return self.download_and_extract(file_id, mime_type, file_name)
            
            else:
                logger.warning(f"⚠️ Unsupported file type: {mime_type} for {file_name}")
                return None
                
        except Exception as e:
            logger.error(f"❌ Error extracting text from {file_name}: {e}")
            return None
    
    def export_google_file(self, file_id: str, mime_type: str) -> Optional[str]:
        """Export Google Workspace files to text."""
        try:
            if mime_type == 'application/vnd.google-apps.document':
                # Export as plain text
                request = self.drive_service.files().export_media(
                    fileId=file_id,
                    mimeType='text/plain'
                )
            elif mime_type == 'application/vnd.google-apps.presentation':
                # Export as plain text
                request = self.drive_service.files().export_media(
                    fileId=file_id,
                    mimeType='text/plain'
                )
            elif mime_type == 'application/vnd.google-apps.spreadsheet':
                # Export as CSV
                request = self.drive_service.files().export_media(
                    fileId=file_id,
                    mimeType='text/csv'
                )
            else:
                return None
            
            # Download content
            fh = io.BytesIO()
            downloader = MediaIoBaseDownload(fh, request)
            done = False
            while done is False:
                status, done = downloader.next_chunk()
            
            content = fh.getvalue().decode('utf-8')
            
            # For spreadsheets, convert CSV to readable text
            if mime_type == 'application/vnd.google-apps.spreadsheet':
                content = self.csv_to_text(content)
            
            return content
            
        except Exception as e:
            logger.error(f"❌ Error exporting Google file {file_id}: {e}")
            return None
    
    def csv_to_text(self, csv_content: str) -> str:
        """Convert CSV content to readable text."""
        try:
            csv_reader = csv.reader(io.StringIO(csv_content))
            rows = list(csv_reader)
            
            text_parts = []
            for row in rows:
                if row:  # Skip empty rows
                    text_parts.append(' | '.join(cell for cell in row if cell.strip()))
            
            return '\n'.join(text_parts)
        except Exception as e:
            logger.warning(f"Could not parse CSV: {e}")
            return csv_content
    
    def download_and_extract(self, file_id: str, mime_type: str, file_name: str) -> Optional[str]:
        """Download and extract text from files."""
        try:
            # Download file
            request = self.drive_service.files().get_media(fileId=file_id)
            fh = io.BytesIO()
            downloader = MediaIoBaseDownload(fh, request)
            done = False
            while done is False:
                status, done = downloader.next_chunk()
            
            content = fh.getvalue()
            
            # Extract text based on file type
            if mime_type == 'application/pdf':
                return self.extract_pdf_text(content)
            elif mime_type == 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
                return self.extract_docx_text(content)
            elif mime_type == 'text/plain':
                return content.decode('utf-8')
            else:
                return None
                
        except Exception as e:
            logger.error(f"❌ Error downloading/extracting {file_name}: {e}")
            return None
    
    def extract_pdf_text(self, pdf_content: bytes) -> str:
        """Extract text from PDF content."""
        try:
            pdf_reader = PyPDF2.PdfReader(io.BytesIO(pdf_content))
            text = ""
            for page in pdf_reader.pages:
                text += page.extract_text() + "\n"
            return text
        except Exception as e:
            logger.error(f"❌ Error extracting PDF text: {e}")
            return ""
    
    def extract_docx_text(self, docx_content: bytes) -> str:
        """Extract text from DOCX content."""
        try:
            doc = Document(io.BytesIO(docx_content))
            text = ""
            for paragraph in doc.paragraphs:
                text += paragraph.text + "\n"
            return text
        except Exception as e:
            logger.error(f"❌ Error extracting DOCX text: {e}")
            return ""
    
    def chunk_text(self, text: str, file_metadata: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Chunk text into overlapping segments."""
        if not text.strip():
            return []
        
        # Tokenize text
        tokens = self.encoding.encode(text)
        
        chunks = []
        start = 0
        
        while start < len(tokens):
            # Get chunk tokens
            end = min(start + self.chunk_size, len(tokens))
            chunk_tokens = tokens[start:end]
            
            # Decode back to text
            chunk_text = self.encoding.decode(chunk_tokens)
            
            if chunk_text.strip():
                chunks.append({
                    'text': chunk_text.strip(),
                    'start_token': start,
                    'end_token': end,
                    'file_id': file_metadata['id'],
                    'file_name': file_metadata['name'],
                    'folder_path': file_metadata.get('folder_path', ''),
                    'mime_type': file_metadata.get('mimeType', ''),
                    'modified_time': file_metadata.get('modifiedTime', '')
                })
            
            # Move start position with overlap
            start = end - self.chunk_overlap
            if start >= len(tokens):
                break
        
        return chunks
    
    def embed_chunks(self, chunks: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Generate embeddings for text chunks."""
        if not chunks:
            return []
        
        try:
            # Prepare texts for embedding
            texts = [chunk['text'] for chunk in chunks]
            
            # Generate embeddings
            response = self.openai_client.embeddings.create(
                model="text-embedding-3-small",
                input=texts
            )
            
            # Add embeddings to chunks
            for i, chunk in enumerate(chunks):
                chunk['embedding'] = response.data[i].embedding
            
            return chunks
            
        except Exception as e:
            logger.error(f"❌ Error generating embeddings: {e}")
            return []
    
    def upsert_to_pinecone(self, chunks: List[Dict[str, Any]]):
        """Upsert chunks to Pinecone in batches."""
        if not chunks:
            return
        
        try:
            # Prepare vectors for Pinecone
            vectors = []
            for i, chunk in enumerate(chunks):
                vector_id = f"{chunk['file_id']}_{chunk['start_token']}_{chunk['end_token']}"
                
                vectors.append({
                    'id': vector_id,
                    'values': chunk['embedding'],
                    'metadata': {
                        'text': chunk['text'],
                        'file_id': chunk['file_id'],
                        'file_name': chunk['file_name'],
                        'folder_path': chunk['folder_path'],
                        'mime_type': chunk['mime_type'],
                        'modified_time': chunk['modified_time'],
                        'start_token': chunk['start_token'],
                        'end_token': chunk['end_token']
                    }
                })
            
            # Upsert in batches
            for i in range(0, len(vectors), self.batch_size):
                batch = vectors[i:i + self.batch_size]
                self.index.upsert(vectors=batch, namespace=self.namespace)
                logger.info(f"📤 Upserted batch {i//self.batch_size + 1}/{(len(vectors)-1)//self.batch_size + 1}")
            
            logger.info(f"✅ Successfully upserted {len(vectors)} vectors to Pinecone")
            
        except Exception as e:
            logger.error(f"❌ Error upserting to Pinecone: {e}")
            raise
    
    def process_files(self, folder_id: str):
        """Main processing function."""
        logger.info(f"🚀 Starting ingestion pipeline for folder: {folder_id}")
        logger.info(f"📊 Namespace: {self.namespace}")
        
        # Get all files
        files = self.list_drive_files(folder_id)
        logger.info(f"📁 Found {len(files)} files to process")
        
        processed_count = 0
        skipped_count = 0
        total_chunks = 0
        
        for file_metadata in files:
            file_id = file_metadata['id']
            file_name = file_metadata['name']
            file_hash = self.get_file_hash(file_metadata)
            
            # Check if file was already processed and hasn't changed
            if (file_id in self.manifest['processed_files'] and 
                self.manifest['processed_files'][file_id].get('hash') == file_hash):
                logger.info(f"⏭️ Skipping unchanged file: {file_name}")
                skipped_count += 1
                continue
            
            logger.info(f"🔄 Processing: {file_name}")
            
            # Extract text
            text = self.extract_text_from_file(file_id, file_metadata)
            if not text:
                logger.warning(f"⚠️ No text extracted from: {file_name}")
                continue
            
            # Chunk text
            chunks = self.chunk_text(text, file_metadata)
            if not chunks:
                logger.warning(f"⚠️ No chunks created from: {file_name}")
                continue
            
            # Generate embeddings
            embedded_chunks = self.embed_chunks(chunks)
            if not embedded_chunks:
                logger.warning(f"⚠️ No embeddings generated for: {file_name}")
                continue
            
            # Upsert to Pinecone
            self.upsert_to_pinecone(embedded_chunks)
            
            # Update manifest
            self.manifest['processed_files'][file_id] = {
                'name': file_name,
                'hash': file_hash,
                'chunks': len(embedded_chunks),
                'processed_at': datetime.now().isoformat()
            }
            
            processed_count += 1
            total_chunks += len(embedded_chunks)
            
            logger.info(f"✅ Processed {file_name} - {len(embedded_chunks)} chunks")
        
        # Update manifest totals
        self.manifest['total_files'] = len(self.manifest['processed_files'])
        self.manifest['total_chunks'] = total_chunks
        self.save_manifest()
        
        # Print summary
        logger.info("=" * 50)
        logger.info("📊 INGESTION SUMMARY")
        logger.info("=" * 50)
        logger.info(f"📁 Total files found: {len(files)}")
        logger.info(f"✅ Files processed: {processed_count}")
        logger.info(f"⏭️ Files skipped (unchanged): {skipped_count}")
        logger.info(f"🧩 Total chunks created: {total_chunks}")
        logger.info(f"📊 Namespace: {self.namespace}")
        logger.info(f"🗂️ Index: {self.index_name}")
        logger.info("=" * 50)

def main():
    """Main entry point."""
    try:
        # Debug: Check environment loading
        print(f"🔍 Debug: Current working directory: {os.getcwd()}")
        print(f"🔍 Debug: .env.local exists: {os.path.exists('.env.local')}")
        
        # Get folder ID from environment
        folder_id = os.getenv('GDRIVE_FOLDER_ID')
        print(f"🔍 Debug: GDRIVE_FOLDER_ID = {repr(folder_id)}")
        
        if not folder_id:
            raise ValueError("GDRIVE_FOLDER_ID not found in environment")
        
        # Initialize and run pipeline
        pipeline = DriveIngestionPipeline()
        pipeline.process_files(folder_id)
        
    except Exception as e:
        logger.error(f"❌ Pipeline failed: {e}")
        raise

if __name__ == "__main__":
    main()
