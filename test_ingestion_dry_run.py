#!/usr/bin/env python3
"""
Dry run test of the ingestion pipeline without Pinecone
"""

import os
from dotenv import load_dotenv
from google.oauth2 import service_account
from googleapiclient.discovery import build
import logging

load_dotenv('.env.local')

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def test_google_drive_access():
    """Test Google Drive API access and list files."""
    try:
        # Google Drive setup
        SERVICE_ACCOUNT_PATH = "service-account.json"
        SCOPES = ["https://www.googleapis.com/auth/drive.readonly"]
        FOLDER_ID = os.getenv("GDRIVE_FOLDER_ID")
        
        if not FOLDER_ID:
            raise ValueError("GDRIVE_FOLDER_ID not found in environment")
        
        logger.info(f"🔍 Testing Google Drive access for folder: {FOLDER_ID}")
        
        # Authenticate
        creds = service_account.Credentials.from_service_account_file(
            SERVICE_ACCOUNT_PATH, scopes=SCOPES
        )
        service = build("drive", "v3", credentials=creds)
        
        # List files in the folder
        query = f"'{FOLDER_ID}' in parents and trashed = false"
        results = service.files().list(
            q=query,
            fields="files(id,name,mimeType,modifiedTime,size)",
            pageSize=20
        ).execute()
        
        files = results.get("files", [])
        logger.info(f"📁 Found {len(files)} files in Google Drive folder")
        
        if not files:
            logger.warning("⚠️ No files found in the specified folder")
            return
        
        # Show file details
        logger.info("📋 Files found:")
        total_size = 0
        for file in files:
            size = int(file.get('size', 0)) if file.get('size') else 0
            total_size += size
            size_mb = size / (1024 * 1024)
            logger.info(f"  📄 {file['name']} ({file['mimeType']}) - {size_mb:.2f} MB")
        
        logger.info(f"📊 Total folder size: {total_size / (1024 * 1024):.2f} MB")
        
        # Test file export for a few files
        logger.info("\n🧪 Testing file export capabilities:")
        for file in files[:3]:  # Test first 3 files
            file_id = file['id']
            file_name = file['name']
            mime_type = file['mimeType']
            
            try:
                if 'google-apps' in mime_type:
                    # Google Docs/Sheets/Slides
                    export_mime_type = 'text/plain'
                    if 'spreadsheet' in mime_type:
                        export_mime_type = 'text/csv'
                    
                    content = service.files().export(
                        fileId=file_id,
                        mimeType=export_mime_type
                    ).execute()
                    
                    content_size = len(content)
                    logger.info(f"  ✅ {file_name}: Exported {content_size} bytes as {export_mime_type}")
                    
                elif mime_type in ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']:
                    # PDF or DOCX - would need to download and process
                    logger.info(f"  📄 {file_name}: Ready for download and text extraction")
                    
                else:
                    logger.info(f"  ℹ️ {file_name}: Unsupported format ({mime_type})")
                    
            except Exception as e:
                logger.error(f"  ❌ {file_name}: Export failed - {e}")
        
        logger.info("✅ Google Drive access test completed successfully!")
        return True
        
    except Exception as e:
        logger.error(f"❌ Google Drive test failed: {e}")
        return False

def test_openai_embedding():
    """Test OpenAI embedding generation."""
    try:
        from openai import OpenAI
        
        OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
        if not OPENAI_API_KEY:
            raise ValueError("OPENAI_API_KEY not found")
        
        logger.info("🧠 Testing OpenAI embedding generation...")
        
        client = OpenAI(api_key=OPENAI_API_KEY)
        
        # Test embedding
        test_text = "OSHA 10-hour construction safety training covers fall protection, electrical safety, and hazard recognition."
        
        response = client.embeddings.create(
            model="text-embedding-3-large",
            input=test_text
        )
        
        embedding = response.data[0].embedding
        logger.info(f"✅ Generated embedding: {len(embedding)} dimensions")
        logger.info(f"📊 First 5 values: {embedding[:5]}")
        
        return True
        
    except Exception as e:
        logger.error(f"❌ OpenAI embedding test failed: {e}")
        return False

def main():
    """Run all tests."""
    logger.info("🚀 Starting ingestion pipeline dry run tests...")
    logger.info("=" * 60)
    
    # Test Google Drive
    drive_ok = test_google_drive_access()
    
    logger.info("\n" + "=" * 60)
    
    # Test OpenAI
    openai_ok = test_openai_embedding()
    
    logger.info("\n" + "=" * 60)
    logger.info("📋 Test Summary:")
    logger.info(f"  Google Drive: {'✅ PASS' if drive_ok else '❌ FAIL'}")
    logger.info(f"  OpenAI Embeddings: {'✅ PASS' if openai_ok else '❌ FAIL'}")
    logger.info(f"  Pinecone: ⏸️ SKIP (quota issue)")
    
    if drive_ok and openai_ok:
        logger.info("\n🎉 All available tests passed! Ready for ingestion once Pinecone quota is resolved.")
    else:
        logger.info("\n⚠️ Some tests failed. Please check the errors above.")

if __name__ == "__main__":
    main()
