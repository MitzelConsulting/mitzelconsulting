import os
from dotenv import load_dotenv
load_dotenv(".env.local")

from openai import OpenAI
from pinecone import Pinecone

def main():
    OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
    PINECONE_API_KEY = os.getenv("PINECONE_API_KEY")
    PINECONE_INDEX = os.getenv("PINECONE_INDEX", "mizelconsulting")

    assert OPENAI_API_KEY, "Missing OPENAI_API_KEY"
    assert PINECONE_API_KEY, "Missing PINECONE_API_KEY"

    print("🔍 Testing Pinecone connectivity...")
    
    client = OpenAI(api_key=OPENAI_API_KEY)
    
    # Initialize Pinecone
    pc = Pinecone(api_key=PINECONE_API_KEY)
    
    # Connect to index
    try:
        index = pc.Index(PINECONE_INDEX)
        print(f"✅ Successfully connected to index: {PINECONE_INDEX}")
    except Exception as e:
        print(f"❌ Failed to connect to index '{PINECONE_INDEX}': {e}")
        return

    q = "List core topics in OSHA-10."
    print(f"🧠 Generating embedding for: '{q}'")
    
    emb = client.embeddings.create(model="text-embedding-3-large", input=q).data[0].embedding
    print(f"✅ Generated embedding with {len(emb)} dimensions")

    # This will succeed even if there are no vectors yet—just returns no matches.
    print("🔍 Querying Pinecone index...")
    res = index.query(vector=emb, top_k=3, include_metadata=True, namespace=os.getenv("DEFAULT_NAMESPACE","site"))
    
    print(f"[Pinecone Test] top_k=3 results:")
    if res.matches:
        for m in res.matches:
            print(f"- score={m.score:.4f} file={m.metadata.get('file_name')} page={m.metadata.get('page')}")
    else:
        print("- No results found (index is empty - this is normal for a new index)")
    
    # Get index stats
    try:
        stats = index.describe_index_stats()
        print(f"\n📊 Index Statistics:")
        print(f"   Total vectors: {stats.total_vector_count}")
        print(f"   Dimension: {stats.dimension}")
        print(f"   Index fullness: {stats.index_fullness}")
    except Exception as e:
        print(f"⚠️ Could not get index stats: {e}")

if __name__ == "__main__":
    main()
