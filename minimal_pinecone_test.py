#!/usr/bin/env python3
"""
Minimal Pinecone test to check available indexes
"""

import os
from dotenv import load_dotenv
import pinecone

load_dotenv('.env.local')

def main():
    PINECONE_API_KEY = os.getenv('PINECONE_API_KEY')
    
    if not PINECONE_API_KEY:
        print("❌ PINECONE_API_KEY not found")
        return
    
    print("🔍 Minimal Pinecone connectivity test...")
    
    try:
        # Initialize Pinecone
        pinecone.init(api_key=PINECONE_API_KEY)
        print("✅ Pinecone initialized successfully")
        
        # Try to list indexes (this uses minimal RUs)
        print("📋 Attempting to list indexes...")
        indexes = pinecone.list_indexes()
        print(f"Available indexes: {indexes}")
        
        if indexes:
            # Try to connect to the first available index
            first_index = indexes[0]
            print(f"🔗 Testing connection to: {first_index}")
            
            try:
                index = pinecone.Index(first_index)
                stats = index.describe_index_stats()
                print(f"✅ Successfully connected to {first_index}")
                print(f"📊 Stats: {stats}")
            except Exception as e:
                print(f"❌ Failed to connect to {first_index}: {e}")
        else:
            print("⚠️ No indexes found")
            
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    main()
