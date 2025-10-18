#!/usr/bin/env python3
"""
Check available OpenAI models and test GPT-4.1 mini
"""

import os
from dotenv import load_dotenv
load_dotenv(".env.local")

from openai import OpenAI

def main():
    OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
    
    if not OPENAI_API_KEY:
        print("❌ OPENAI_API_KEY not found")
        return
    
    print("🔍 Checking available OpenAI models...")
    
    try:
        client = OpenAI(api_key=OPENAI_API_KEY)
        
        # List available models
        print("\n📋 Available Models:")
        models = client.models.list()
        
        # Filter for chat completion models
        chat_models = []
        embedding_models = []
        
        for model in models.data:
            model_id = model.id
            if 'gpt' in model_id.lower() or 'o1' in model_id.lower():
                chat_models.append(model_id)
            elif 'embedding' in model_id.lower():
                embedding_models.append(model_id)
        
        print("\n🤖 Chat Models:")
        for model in sorted(chat_models):
            print(f"  - {model}")
        
        print("\n🧠 Embedding Models:")
        for model in sorted(embedding_models):
            print(f"  - {model}")
        
        # Test GPT-4.1 mini specifically
        print(f"\n🧪 Testing GPT-4.1 mini...")
        
        # Check if gpt-4.1-mini is available
        gpt_4_1_mini_available = any('gpt-4.1-mini' in model for model in chat_models)
        
        if gpt_4_1_mini_available:
            print("✅ GPT-4.1 mini is available!")
            
            # Test a simple completion
            response = client.chat.completions.create(
                model="gpt-4.1-mini",
                messages=[
                    {"role": "user", "content": "What is OSHA 10-hour training?"}
                ],
                max_tokens=100
            )
            
            print(f"✅ Test response: {response.choices[0].message.content[:100]}...")
            
        else:
            print("❌ GPT-4.1 mini not found in available models")
            print("💡 Available GPT models:")
            for model in chat_models:
                if 'gpt-4' in model:
                    print(f"  - {model}")
        
        # Check current embedding model
        print(f"\n🧠 Testing text-embedding-3-large...")
        try:
            embedding_response = client.embeddings.create(
                model="text-embedding-3-large",
                input="Test embedding"
            )
            print(f"✅ Embedding model working - {len(embedding_response.data[0].embedding)} dimensions")
        except Exception as e:
            print(f"❌ Embedding model error: {e}")
        
    except Exception as e:
        print(f"❌ Error checking models: {e}")

if __name__ == "__main__":
    main()
