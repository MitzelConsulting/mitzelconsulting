import os
from dotenv import load_dotenv
load_dotenv(".env.local")

from google.oauth2 import service_account
from googleapiclient.discovery import build

SERVICE_ACCOUNT_PATH = "service-account.json"
SCOPES = ["https://www.googleapis.com/auth/drive.readonly"]
FOLDER_ID = os.getenv("GDRIVE_FOLDER_ID")

def drive_service():
    creds = service_account.Credentials.from_service_account_file(
        SERVICE_ACCOUNT_PATH, scopes=SCOPES
    )
    return build("drive", "v3", credentials=creds)

def main():
    assert FOLDER_ID, "Set GDRIVE_FOLDER_ID in .env.local"
    
    print("🔍 Testing Google Drive connectivity...")
    
    # Check if service account file exists
    if not os.path.exists(SERVICE_ACCOUNT_PATH):
        print(f"❌ Service account file not found: {SERVICE_ACCOUNT_PATH}")
        return
    
    print(f"📁 Testing access to folder ID: {FOLDER_ID}")
    
    svc = drive_service()
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
    else:
        print("- No files found in the specified folder")
        print("💡 Make sure:")
        print("   - The folder ID is correct")
        print("   - The service account has access to the folder")
        print("   - The folder is shared with the service account email")

if __name__ == "__main__":
    main()
