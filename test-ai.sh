#!/bin/bash
# Simple AI integration test

echo "🧪 Testing AI Integration..."
echo "============================"

# Test ML Service
echo "1. Testing ML Service..."
if curl -s http://localhost:3000/health > /dev/null; then
    echo "✅ ML Service is running on port 3000"
else
    echo "❌ ML Service is not running on port 3000"
fi

# Test Backend
echo "2. Testing Backend..."
if curl -s http://localhost:8000/api/health > /dev/null 2>&1; then
    echo "✅ Backend is running on port 8000"
else
    echo "❌ Backend is not running on port 8000"
fi

# Test Client
echo "3. Testing Client..."
if curl -s http://localhost:5173 > /dev/null 2>&1; then
    echo "✅ Client is running on port 5173"
else
    echo "❌ Client is not running on port 5173"
fi

# Test AI API
echo "4. Testing AI API..."
response=$(curl -s -X POST http://localhost:3000/predict/task \
  -H "Content-Type: application/json" \
  -d '{"task_text": "Create a simple contact form"}' 2>/dev/null)

if [ $? -eq 0 ] && [ -n "$response" ]; then
    echo "✅ AI API is working"
    echo "Response: $response"
else
    echo "❌ AI API is not working"
fi

echo ""
echo "🎯 Next Steps:"
echo "1. Open http://localhost:5173"
echo "2. Login to AdminiX"
echo "3. Go to any project's Analytics tab"
echo "4. Test the AI-Powered Analytics features" 