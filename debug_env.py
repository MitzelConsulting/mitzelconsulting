#!/usr/bin/env python3
import os
from dotenv import load_dotenv

print("🔍 Debugging environment variables...")

# Load .env.local
load_dotenv(".env.local")

# Check all relevant variables
variables = [
    "OPENAI_API_KEY",
    "PINECONE_API_KEY", 
    "PINECONE_INDEX",
    "GDRIVE_FOLDER_ID",
    "DEFAULT_NAMESPACE"
]

print("\n📋 Environment Variables:")
for var in variables:
    value = os.getenv(var)
    if value:
        # Mask sensitive values
        if "KEY" in var or "API" in var:
            masked = value[:10] + "..." + value[-4:] if len(value) > 14 else "***"
            print(f"  ✅ {var}: {masked}")
        else:
            print(f"  ✅ {var}: {value}")
    else:
        print(f"  ❌ {var}: Not found")

print(f"\n📁 Current working directory: {os.getcwd()}")
print(f"📄 .env.local exists: {os.path.exists('.env.local')}")
