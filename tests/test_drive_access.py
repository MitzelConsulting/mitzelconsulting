#!/usr/bin/env python3
"""
Smoke test for Google Drive API access.
Lists the first 10 files in the specified folder to verify authentication and permissions.
"""

import os
import sys
from pathlib import Path

# Add parent directory to path for imports
sys.path.append(str(Path(__file__).parent.parent))

from google.oauth2 import service_account
from googleapiclient.discovery import build
from dotenv import load_dotenv

# Load environment variables
load_dotenv('.env.local')

def test_drive_access():
    """Test Google Drive API access and list files."""
    print("🔍 Testing Google Drive API access...")
    
    try:
        # Check for service account file
        if not os.path.exists('service-account.json'):
            raise FileNotFoundError("❌ service-account.json not found in project root")
        
        # Get folder ID from environment
        folder_id = os.getenv('GDRIVE_FOLDER_ID')
        if not folder_id:
            raise ValueError("❌ GDRIVE_FOLDER_ID not found in environment")
        
        print(f"📁 Testing access to folder ID: {folder_id}")
        
        # Initialize Google Drive API
        credentials = service_account.Credentials.from_service_account_file(
            'service-account.json',
            scopes=['https://www.googleapis.com/auth/drive.readonly']
        )
        drive_service = build('drive', 'v3', credentials=credentials)
        
        # List files in the folder
        results = drive_service.files().list(
            q=f"'{folder_id}' in parents and trashed=false",
            fields="files(id, name, mimeType, modifiedTime, size)",
            pageSize=10
        ).execute()
        
        files = results.get('files', [])
        
        if not files:
            print("⚠️ No files found in the specified folder")
            print("💡 Make sure:")
            print("   - The folder ID is correct")
            print("   - The service account has access to the folder")
            print("   - The folder is shared with the service account email")
            return False
        
        print(f"✅ Successfully accessed Google Drive!")
        print(f"📊 Found {len(files)} files (showing first 10):")
        print("-" * 80)
        
        for i, file in enumerate(files, 1):
            file_id = file.get('id', 'N/A')
            name = file.get('name', 'N/A')
            mime_type = file.get('mimeType', 'N/A')
            modified = file.get('modifiedTime', 'N/A')
            size = file.get('size', 'N/A')
            
            print(f"{i:2d}. {name}")
            print(f"    ID: {file_id}")
            print(f"    Type: {mime_type}")
            print(f"    Modified: {modified}")
            print(f"    Size: {size} bytes")
            print()
        
        print("✅ Google Drive access test PASSED")
        return True
        
    except Exception as e:
        print(f"❌ Google Drive access test FAILED: {e}")
        print("\n💡 Troubleshooting tips:")
        print("1. Ensure service-account.json is in the project root")
        print("2. Verify the service account has Drive API access")
        print("3. Check that the folder is shared with the service account email")
        print("4. Confirm GDRIVE_FOLDER_ID is set correctly in .env.local")
        return False

if __name__ == "__main__":
    success = test_drive_access()
    sys.exit(0 if success else 1)
