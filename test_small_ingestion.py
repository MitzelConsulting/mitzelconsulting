#!/usr/bin/env python3
"""
Small test ingestion to debug the issue.
"""

import os
import json
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

def process_single_docx(file_id, drive_service, openai_client, index):
    """Process a single DOCX file."""
    print(f"🔄 Processing file ID: {file_id}")
    
    # Get file metadata
    file_metadata = drive_service.files().get(fileId=file_id, fields='id,name,mimeType,modifiedTime,size').execute()
    print(f"📄 File: {file_metadata['name']}")
    
    # Download file
    request = drive_service.files().get_media(fileId=file_id)
    fh = io.BytesIO()
    downloader = MediaIoBaseDownload(fh, request)
    done = False
    while done is False:
        status, done = downloader.next_chunk()
    
    content = fh.getvalue()
    print(f"📥 Downloaded {len(content)} bytes")
    
    # Extract text
    doc = Document(io.BytesIO(content))
    text = ''
    for paragraph in doc.paragraphs:
        text += paragraph.text + '\n'
    
    print(f"📝 Extracted {len(text)} characters")
    
    if not text.strip():
        print("⚠️ No text extracted")
        return
    
    # Create a simple chunk (no chunking for test)
    chunk = {
        'text': text.strip(),
        'file_id': file_id,
        'file_name': file_metadata['name'],
        'folder_path': 'test',
        'mime_type': file_metadata.get('mimeType', ''),
        'modified_time': file_metadata.get('modifiedTime', '')
    }
    
    print("🧠 Generating embedding...")
    
    # Generate embedding
    response = openai_client.embeddings.create(
        model="text-embedding-3-small",
        input=chunk['text']
    )
    
    embedding = response.data[0].embedding
    print(f"✅ Generated embedding with {len(embedding)} dimensions")
    
    # Prepare vector for Pinecone
    vector = {
        'id': f"{file_id}_0",
        'values': embedding,
        'metadata': {
            'text': chunk['text'],
            'file_id': chunk['file_id'],
            'file_name': chunk['file_name'],
            'folder_path': chunk['folder_path'],
            'mime_type': chunk['mime_type'],
            'modified_time': chunk['modified_time']
        }
    }
    
    print("📤 Upserting to Pinecone...")
    
    # Upsert to Pinecone
    index.upsert(vectors=[vector], namespace='site')
    
    print("✅ Successfully processed and upserted!")

def main():
    """Test with a single DOCX file."""
    try:
        drive_service, openai_client, index = setup_clients()
        
        # Test with Process Safety Management Quiz.docx
        file_id = '1okqxOemjd8YG3dsmkniSrPLEH2fTWINZ'
        process_single_docx(file_id, drive_service, openai_client, index)
        
        print("\n🧪 Testing query...")
        
        # Test query
        query = "process safety management"
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
        
        print(f"🔍 Found {len(results.matches)} results:")
        for match in results.matches:
            print(f"  - {match.metadata['file_name']} (Score: {match.score:.4f})")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()



