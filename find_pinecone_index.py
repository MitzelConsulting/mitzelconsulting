#!/usr/bin/env python3
"""
Try to find the correct Pinecone index name
"""

import os
from dotenv import load_dotenv
import pinecone

load_dotenv('.env.local')

def test_index_connection(index_name):
    """Test if we can connect to a specific index."""
    try:
        index = pinecone.Index(index_name)
        stats = index.describe_index_stats()
        print(f"✅ Found working index: {index_name}")
        print(f"📊 Stats: {stats}")
        return True
    except Exception as e:
        print(f"❌ {index_name}: {e}")
        return False

def main():
    PINECONE_API_KEY = os.getenv('PINECONE_API_KEY')
    
    if not PINECONE_API_KEY:
        print("❌ PINECONE_API_KEY not found")
        return
    
    print("🔍 Searching for Pinecone index...")
    
    try:
        # Initialize Pinecone
        pinecone.init(api_key=PINECONE_API_KEY)
        print("✅ Pinecone initialized successfully")
        
        # Try different possible index names
        possible_names = [
            "mizelconsulting",
            "mizel-consulting", 
            "mizel_consulting",
            "mizel",
            "safety-training",
            "safety_training",
            "safetytraining"
        ]
        
        print("🧪 Testing possible index names...")
        found_index = None
        
        for name in possible_names:
            print(f"Testing: {name}")
            if test_index_connection(name):
                found_index = name
                break
        
        if found_index:
            print(f"\n🎉 Success! Use this index name: {found_index}")
            print(f"Update your .env.local: PINECONE_INDEX={found_index}")
        else:
            print("\n⚠️ No working index found with common names")
            print("💡 You may need to:")
            print("   1. Check the exact index name in Pinecone console")
            print("   2. Verify you're using the correct API key")
            print("   3. Check if the index is in a different project")
            
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    main()
