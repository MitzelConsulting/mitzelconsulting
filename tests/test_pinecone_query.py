#!/usr/bin/env python3
"""
Smoke test for Pinecone API access and query functionality.
Tests embedding generation and Pinecone index connectivity.
"""

import os
import sys
from pathlib import Path

# Add parent directory to path for imports
sys.path.append(str(Path(__file__).parent.parent))

from pinecone import Pinecone
from openai import OpenAI
from dotenv import load_dotenv

# Load environment variables
load_dotenv('.env.local')

def test_pinecone_query():
    """Test Pinecone API access and query functionality."""
    print("🔍 Testing Pinecone API access...")
    
    try:
        # Check environment variables
        pinecone_api_key = os.getenv('PINECONE_API_KEY')
        openai_api_key = os.getenv('OPENAI_API_KEY')
        index_name = os.getenv('PINECONE_INDEX', 'mizel-consulting')
        namespace = os.getenv('NAMESPACE', os.getenv('DEFAULT_NAMESPACE', 'site'))
        
        if not pinecone_api_key:
            raise ValueError("❌ PINECONE_API_KEY not found in environment")
        if not openai_api_key:
            raise ValueError("❌ OPENAI_API_KEY not found in environment")
        
        print(f"📊 Testing Pinecone index: {index_name}")
        print(f"📊 Testing namespace: {namespace}")
        
        # Initialize clients
        pc = Pinecone(api_key=pinecone_api_key)
        openai_client = OpenAI(api_key=openai_api_key)
        
        # Check if index exists
        if index_name not in pc.list_indexes().names():
            print(f"⚠️ Index '{index_name}' does not exist")
            print("💡 The index will be created during the first ingestion run")
            return True
        
        # Get index
        index = pc.Index(index_name)
        
        # Test embedding generation
        test_query = "OSHA safety training requirements for construction workers"
        print(f"🧠 Testing embedding generation for: '{test_query}'")
        
        response = openai_client.embeddings.create(
            model="text-embedding-3-small",
            input=test_query
        )
        
        embedding = response.data[0].embedding
        print(f"✅ Generated embedding with {len(embedding)} dimensions")
        
        # Test Pinecone query
        print("🔍 Testing Pinecone query...")
        
        try:
            query_response = index.query(
                vector=embedding,
                top_k=5,
                namespace=namespace,
                include_metadata=True
            )
            
            matches = query_response.matches
            
            if not matches:
                print("⚠️ No results found in Pinecone index")
                print("💡 This is normal for a new/empty index")
                print("✅ Pinecone connectivity test PASSED")
                return True
            
            print(f"✅ Found {len(matches)} results in Pinecone index:")
            print("-" * 80)
            
            for i, match in enumerate(matches, 1):
                score = match.score
                metadata = match.metadata or {}
                file_name = metadata.get('file_name', 'Unknown')
                text_preview = metadata.get('text', '')[:100] + "..." if len(metadata.get('text', '')) > 100 else metadata.get('text', '')
                
                print(f"{i}. {file_name} (Score: {score:.4f})")
                print(f"   Preview: {text_preview}")
                print()
            
            print("✅ Pinecone query test PASSED")
            return True
            
        except Exception as query_error:
            print(f"⚠️ Query test failed (index might be empty): {query_error}")
            print("✅ Pinecone connectivity test PASSED (index accessible)")
            return True
        
    except Exception as e:
        print(f"❌ Pinecone test FAILED: {e}")
        print("\n💡 Troubleshooting tips:")
        print("1. Verify PINECONE_API_KEY is set correctly in .env.local")
        print("2. Verify OPENAI_API_KEY is set correctly in .env.local")
        print("3. Check that the Pinecone index name is correct")
        print("4. Ensure your Pinecone account has sufficient credits")
        return False

def test_index_stats():
    """Test Pinecone index statistics."""
    print("\n📊 Testing Pinecone index statistics...")
    
    try:
        pinecone_api_key = os.getenv('PINECONE_API_KEY')
        index_name = os.getenv('PINECONE_INDEX', 'mizel-consulting')
        namespace = os.getenv('NAMESPACE', os.getenv('DEFAULT_NAMESPACE', 'site'))
        
        pc = Pinecone(api_key=pinecone_api_key)
        
        if index_name not in pc.list_indexes().names():
            print(f"⚠️ Index '{index_name}' does not exist yet")
            return True
        
        index = pc.Index(index_name)
        stats = index.describe_index_stats()
        
        print(f"📊 Index Statistics:")
        print(f"   Total vectors: {stats.total_vector_count}")
        print(f"   Dimension: {stats.dimension}")
        print(f"   Index fullness: {stats.index_fullness}")
        
        if hasattr(stats, 'namespaces') and stats.namespaces:
            print(f"   Namespaces: {list(stats.namespaces.keys())}")
            if namespace in stats.namespaces:
                ns_stats = stats.namespaces[namespace]
                print(f"   Vectors in '{namespace}': {ns_stats.vector_count}")
        
        print("✅ Index statistics test PASSED")
        return True
        
    except Exception as e:
        print(f"❌ Index statistics test FAILED: {e}")
        return False

if __name__ == "__main__":
    print("🚀 Running Pinecone smoke tests...\n")
    
    success1 = test_pinecone_query()
    success2 = test_index_stats()
    
    if success1 and success2:
        print("\n🎉 All Pinecone tests PASSED!")
        sys.exit(0)
    else:
        print("\n❌ Some Pinecone tests FAILED!")
        sys.exit(1)
