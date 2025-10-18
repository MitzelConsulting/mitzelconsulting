#!/usr/bin/env python3
"""
Test script to check the setup status of the ingestion pipeline.
Shows what's configured and what still needs to be set up.
"""

import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv(".env.local")

def check_setup_status():
    """Check the setup status of all required components."""
    
    print("🔍 INGESTION PIPELINE SETUP STATUS")
    print("=" * 50)
    
    # Check environment variables
    print("\n📋 Environment Variables:")
    
    openai_key = os.getenv("OPENAI_API_KEY")
    pinecone_key = os.getenv("PINECONE_API_KEY")
    folder_id = os.getenv("GDRIVE_FOLDER_ID")
    
    print(f"  ✅ OPENAI_API_KEY: {'Set' if openai_key and openai_key != 'your_openai_api_key' else '❌ Needs setup'}")
    print(f"  {'✅' if pinecone_key and pinecone_key != 'your_pinecone_api_key_here' else '❌'} PINECONE_API_KEY: {'Set' if pinecone_key and pinecone_key != 'your_pinecone_api_key_here' else 'Needs setup'}")
    print(f"  {'✅' if folder_id and folder_id != 'your_google_drive_folder_id_here' else '❌'} GDRIVE_FOLDER_ID: {'Set' if folder_id and folder_id != 'your_google_drive_folder_id_here' else 'Needs setup'}")
    
    # Check service account file
    print(f"\n📁 Service Account File:")
    service_account_exists = os.path.exists("service-account.json")
    print(f"  {'✅' if service_account_exists else '❌'} service-account.json: {'Found' if service_account_exists else 'Missing'}")
    
    # Check Python environment
    print(f"\n🐍 Python Environment:")
    venv_exists = os.path.exists("venv")
    print(f"  {'✅' if venv_exists else '❌'} Virtual environment: {'Found' if venv_exists else 'Missing'}")
    
    # Summary
    print(f"\n📊 SETUP SUMMARY:")
    all_ready = (
        openai_key and openai_key != 'your_openai_api_key' and
        pinecone_key and pinecone_key != 'your_pinecone_api_key_here' and
        folder_id and folder_id != 'your_google_drive_folder_id_here' and
        service_account_exists
    )
    
    if all_ready:
        print("  🎉 All components are ready! You can run the full tests.")
    else:
        print("  ⚠️  Some components need setup. See details above.")
    
    print(f"\n🔧 NEXT STEPS:")
    if not (openai_key and openai_key != 'your_openai_api_key'):
        print("  1. Set your actual OpenAI API key in .env.local")
    if not (pinecone_key and pinecone_key != 'your_pinecone_api_key_here'):
        print("  2. Set your Pinecone API key in .env.local")
    if not (folder_id and folder_id != 'your_google_drive_folder_id_here'):
        print("  3. Set your Google Drive folder ID in .env.local")
    if not service_account_exists:
        print("  4. Add your service-account.json file to the project root")
    
    if all_ready:
        print("  🚀 Run: python test_drive.py")
        print("  🚀 Run: python test_pinecone.py")
        print("  🚀 Run: python ingest.py")

if __name__ == "__main__":
    check_setup_status()
