#!/usr/bin/env python3
import os
from dotenv import load_dotenv
import google.generativeai as genai

# Load environment variables
load_dotenv()

# Configure the API key
api_key = os.getenv("GEMINI_API_KEY")
if not api_key:
    print("❌ GEMINI_API_KEY not found in environment variables")
    exit(1)

print(f"🔑 API Key found: {api_key[:10]}...")

# Configure the model
genai.configure(api_key=api_key)

try:
    print("📋 Listing available models...")
    models = genai.list_models()
    for model in models:
        if 'generateContent' in model.supported_generation_methods:
            print(f"✅ Available: {model.name}")
    
    # Try different model names - focusing on flash models which have higher limits
    model_names = [
        'gemini-1.5-flash',
        'gemini-1.5-flash-latest', 
        'gemini-2.0-flash',
        'gemini-2.0-flash-001',
        'gemini-2.5-flash',
        'gemini-1.5-pro-latest'
    ]
    
    for model_name in model_names:
        try:
            print(f"\n🧪 Testing with model: {model_name}")
            model = genai.GenerativeModel(model_name)
            
            # Simple test prompt
            prompt = "Say 'Hello, Gemini API is working!' in JSON format: {\"message\": \"Hello, Gemini API is working!\"}"
            
            print("📡 Making API call...")
            response = model.generate_content(prompt)
            
            print("✅ API call successful!")
            print(f"📝 Response: {response.text}")
            print(f"🎯 Working model found: {model_name}")
            break
            
        except Exception as e:
            print(f"❌ Failed with {model_name}: {e}")
            continue
    
except Exception as e:
    print(f"❌ API test failed: {e}")
    print("🔍 This could be due to:")
    print("   - Invalid API key")
    print("   - Network connectivity issues")
    print("   - API service unavailable")
    print("   - Rate limiting") 