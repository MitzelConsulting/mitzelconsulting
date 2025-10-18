import os
from dotenv import load_dotenv
load_dotenv(".env.local")

from google.oauth2 import service_account
from googleapiclient.discovery import build

SERVICE_ACCOUNT_PATH = "service-account.json"
SCOPES = ["https://www.googleapis.com/auth/drive.readonly"]

def main():
    # Use the correct folder ID (extracted from the URL)
    FOLDER_ID = "1ixMpE1ZjrnCradre2iNQcHZB0C39rVOT"
    
    print("🔍 Testing Google Drive connectivity...")
    print(f"📁 Testing access to folder ID: {FOLDER_ID}")
    
    # Check if service account file exists
    if not os.path.exists(SERVICE_ACCOUNT_PATH):
        print(f"❌ Service account file not found: {SERVICE_ACCOUNT_PATH}")
        return
    
    try:
        creds = service_account.Credentials.from_service_account_file(
            SERVICE_ACCOUNT_PATH, scopes=SCOPES
        )
        svc = build("drive", "v3", credentials=creds)
        
        q = f"'{FOLDER_ID}' in parents and trashed = false"
        resp = svc.files().list(
            q=q,
            fields="files(id,name,mimeType,modifiedTime)",
            pageSize=10
        ).execute()
        files = resp.get("files", [])
        
        print(f"[Drive Test] First {len(files)} file(s):")
        if files:
            for f in files:
                print(f"- {f['id']} | {f['name']} | {f['mimeType']}")
            print("✅ Google Drive access test PASSED!")
        else:
            print("- No files found in the specified folder")
            print("💡 Make sure:")
            print("   - The folder is shared with: pinecone-ingester@mizel-consulting-ingestion.iam.gserviceaccount.com")
            print("   - The service account has 'Viewer' permissions")
            
    except Exception as e:
        print(f"❌ Google Drive access test FAILED: {e}")
        print("\n💡 Troubleshooting tips:")
        print("1. Ensure the folder is shared with the service account email")
        print("2. Check that the service account has 'Viewer' permissions")
        print("3. Verify the folder ID is correct")

if __name__ == "__main__":
    main()
