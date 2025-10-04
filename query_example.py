#!/usr/bin/env python3
"""
Example query utility for the Mizel Consulting Pinecone vector database.
Demonstrates how to query the ingested safety training content for chat integration.
"""

import os
import sys
from typing import List, Dict, Any
from dotenv import load_dotenv
from pinecone import Pinecone
from openai import OpenAI

# Load environment variables
load_dotenv()

class SafetyTrainingQuery:
    def __init__(self):
        """Initialize the query client."""
        self.setup_clients()
    
    def setup_clients(self):
        """Initialize OpenAI and Pinecone clients."""
        try:
            # OpenAI client
            openai_api_key = os.getenv('OPENAI_API_KEY')
            if not openai_api_key:
                raise ValueError("OPENAI_API_KEY not found in environment")
            self.openai_client = OpenAI(api_key=openai_api_key)
            
            # Pinecone client
            pinecone_api_key = os.getenv('PINECONE_API_KEY')
            if not pinecone_api_key:
                raise ValueError("PINECONE_API_KEY not found in environment")
            
            self.pc = Pinecone(api_key=pinecone_api_key)
            self.index_name = os.getenv('PINECONE_INDEX', 'mizel-consulting')
            self.namespace = os.getenv('NAMESPACE', os.getenv('DEFAULT_NAMESPACE', 'site'))
            
            # Get index
            if self.index_name not in self.pc.list_indexes().names():
                raise ValueError(f"Index '{self.index_name}' does not exist")
            
            self.index = self.pc.Index(self.index_name)
            print(f"✅ Query client initialized - Index: {self.index_name}, Namespace: {self.namespace}")
            
        except Exception as e:
            print(f"❌ Failed to initialize query client: {e}")
            raise
    
    def query_safety_content(self, query: str, top_k: int = 5, filters: Dict = None) -> List[Dict[str, Any]]:
        """
        Query safety training content from Pinecone.
        
        Args:
            query: Search query text
            top_k: Number of results to return
            filters: Optional metadata filters
            
        Returns:
            List of relevant content with metadata
        """
        try:
            # Generate query embedding
            response = self.openai_client.embeddings.create(
                model="text-embedding-3-large",
                input=query
            )
            query_embedding = response.data[0].embedding
            
            # Search Pinecone
            search_params = {
                'vector': query_embedding,
                'top_k': top_k,
                'namespace': self.namespace,
                'include_metadata': True
            }
            
            if filters:
                search_params['filter'] = filters
            
            results = self.index.query(**search_params)
            
            # Format results
            formatted_results = []
            for match in results.matches:
                formatted_results.append({
                    'content': match.metadata.get('text', ''),
                    'source_file': match.metadata.get('file_name', 'Unknown'),
                    'folder_path': match.metadata.get('folder_path', ''),
                    'mime_type': match.metadata.get('mime_type', ''),
                    'relevance_score': match.score,
                    'file_id': match.metadata.get('file_id', ''),
                    'modified_time': match.metadata.get('modified_time', '')
                })
            
            return formatted_results
            
        except Exception as e:
            print(f"❌ Query failed: {e}")
            return []
    
    def get_chat_context(self, query: str, max_context_length: int = 4000) -> Dict[str, Any]:
        """
        Get relevant context for chat integration.
        
        Args:
            query: User's question
            max_context_length: Maximum characters of context to return
            
        Returns:
            Dictionary with context and sources
        """
        # Get relevant content
        results = self.query_safety_content(query, top_k=10)
        
        if not results:
            return {
                'context': '',
                'sources': [],
                'message': 'No relevant content found for your query.'
            }
        
        # Build context within character limit
        context_parts = []
        sources = []
        current_length = 0
        
        for result in results:
            content = result['content']
            source = {
                'file': result['source_file'],
                'folder': result['folder_path'],
                'relevance': result['relevance_score']
            }
            
            # Add content if it fits
            if current_length + len(content) <= max_context_length:
                context_parts.append(content)
                sources.append(source)
                current_length += len(content)
            else:
                # Add partial content if there's room
                remaining_space = max_context_length - current_length
                if remaining_space > 100:  # Only add if meaningful space remains
                    truncated_content = content[:remaining_space] + "..."
                    context_parts.append(truncated_content)
                    sources.append(source)
                break
        
        return {
            'context': '\n\n'.join(context_parts),
            'sources': sources,
            'total_results': len(results),
            'context_length': current_length
        }

def main():
    """Example usage of the query utility."""
    try:
        # Initialize query client
        query_client = SafetyTrainingQuery()
        
        # Example queries
        example_queries = [
            "OSHA 30 hour construction safety training requirements",
            "HAZWOPER training for chemical cleanup workers",
            "fall protection safety procedures",
            "confined space entry requirements",
            "personal protective equipment guidelines"
        ]
        
        print("🔍 Safety Training Content Query Examples")
        print("=" * 60)
        
        for i, query in enumerate(example_queries, 1):
            print(f"\n{i}. Query: '{query}'")
            print("-" * 40)
            
            # Get chat context
            context = query_client.get_chat_context(query)
            
            if context['context']:
                print(f"📄 Context ({context['context_length']} chars):")
                print(context['context'][:300] + "..." if len(context['context']) > 300 else context['context'])
                
                print(f"\n📚 Sources ({len(context['sources'])}):")
                for j, source in enumerate(context['sources'][:3], 1):  # Show top 3
                    print(f"   {j}. {source['file']} (Score: {source['relevance']:.3f})")
                    print(f"      Folder: {source['folder']}")
            else:
                print("❌ No relevant content found")
        
        # Interactive mode
        print("\n" + "=" * 60)
        print("💬 Interactive Query Mode (type 'quit' to exit)")
        print("=" * 60)
        
        while True:
            try:
                user_query = input("\n🔍 Enter your safety training question: ").strip()
                
                if user_query.lower() in ['quit', 'exit', 'q']:
                    print("👋 Goodbye!")
                    break
                
                if not user_query:
                    continue
                
                # Get results
                results = query_client.query_safety_content(user_query, top_k=3)
                
                if results:
                    print(f"\n📊 Found {len(results)} relevant results:")
                    for i, result in enumerate(results, 1):
                        print(f"\n{i}. {result['source_file']} (Score: {result['relevance_score']:.3f})")
                        print(f"   📁 {result['folder_path']}")
                        print(f"   📄 {result['content'][:200]}...")
                else:
                    print("❌ No relevant content found for your query.")
                    
            except KeyboardInterrupt:
                print("\n👋 Goodbye!")
                break
            except Exception as e:
                print(f"❌ Error: {e}")
    
    except Exception as e:
        print(f"❌ Failed to initialize query client: {e}")
        print("\n💡 Make sure you have:")
        print("1. Set up your .env.local file with API keys")
        print("2. Run the ingestion pipeline to populate the index")
        print("3. Verified your Pinecone index exists")

if __name__ == "__main__":
    main()
