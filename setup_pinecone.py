#!/usr/bin/env python3
"""
Setup Pinecone index for Mizel Consulting
"""

import os
from dotenv import load_dotenv
import pinecone

load_dotenv('.env.local')

def main():
    PINECONE_API_KEY = os.getenv('PINECONE_API_KEY')
    PINECONE_INDEX = os.getenv('PINECONE_INDEX', 'mizelconsulting')
    
    if not PINECONE_API_KEY:
        print("❌ PINECONE_API_KEY not found")
        return
    
    print(f"🔍 Setting up Pinecone index: {PINECONE_INDEX}")
    
    try:
        # Initialize Pinecone
        pinecone.init(api_key=PINECONE_API_KEY)
        
        # List existing indexes
        existing_indexes = pinecone.list_indexes()
        print(f"📋 Existing indexes: {existing_indexes}")
        
        if PINECONE_INDEX in existing_indexes:
            print(f"✅ Index '{PINECONE_INDEX}' already exists!")
            
            # Get index stats
            index = pinecone.Index(PINECONE_INDEX)
            stats = index.describe_index_stats()
            print(f"📊 Index stats: {stats}")
            
        else:
            print(f"🔨 Creating new index: {PINECONE_INDEX}")
            
            try:
                # Try to create the index
                pinecone.create_index(
                    name=PINECONE_INDEX,
                    dimension=3072,  # text-embedding-3-large dimension
                    metric='cosine'
                )
                print(f"✅ Successfully created index: {PINECONE_INDEX}")
                
            except Exception as e:
                print(f"❌ Failed to create index: {e}")
                print("💡 You may need to:")
                print("   1. Upgrade your Pinecone plan")
                print("   2. Delete unused indexes")
                print("   3. Check your quota limits")
                return
        
        # Test the index
        print(f"\n🧪 Testing index: {PINECONE_INDEX}")
        index = pinecone.Index(PINECONE_INDEX)
        
        # Try a simple query (will work even if empty)
        test_vector = [0.1] * 3072  # Dummy vector
        result = index.query(
            vector=test_vector,
            top_k=1,
            include_metadata=True
        )
        print(f"✅ Index is accessible! Query returned {len(result.matches)} results")
        
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    main()
