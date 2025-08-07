# AI Integration Testing Guide

This guide will help you test the AI-powered analytics features in the AdminiX project.

## 🚀 Quick Test Setup

### 1. Start All Services
```bash
./start-all.sh
```

This will start:
- ML Service on http://localhost:3000
- Backend on http://localhost:8000
- Client on http://localhost:5173

### 2. Verify Services Are Running
```bash
# Check if services are running
curl http://localhost:3000/health  # ML Service
curl http://localhost:8000/api/health  # Backend (if available)
```

## 🧪 Testing Scenarios

### Test 1: Basic Service Health

#### Step 1: Check ML Service Health
```bash
curl http://localhost:8000/health
```

**Expected Response:**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T12:00:00Z",
  "ml_predictor_ready": true,
  "assignment_engine_ready": true
}
```

#### Step 2: Check API Documentation
Open http://localhost:8000/docs in your browser to see the interactive API documentation.

### Test 2: Task Prediction API

#### Step 1: Test with curl
```bash
curl -X POST http://localhost:8000/predict/task \
  -H "Content-Type: application/json" \
  -d '{
    "task_text": "Implement user authentication with JWT tokens"
  }'
```

**Expected Response:**
```json
{
  "complexity": 7.5,
  "risk": 0.3,
  "priority": 0.8
}
```

#### Step 2: Test Different Task Types
```bash
# Simple task
curl -X POST http://localhost:8000/predict/task \
  -H "Content-Type: application/json" \
  -d '{"task_text": "Create a simple contact form"}'

# Complex task
curl -X POST http://localhost:8000/predict/task \
  -H "Content-Type: application/json" \
  -d '{"task_text": "Build a real-time chat system with WebSocket, user authentication, message encryption, and file sharing capabilities"}'

# High-risk task
curl -X POST http://localhost:8000/predict/task \
  -H "Content-Type: application/json" \
  -d '{"task_text": "Migrate production database with zero downtime and data integrity checks"}'
```

### Test 3: Sprint Planning API

#### Step 1: Test Sprint Planning
```bash
curl -X POST http://localhost:8000/predict/project/sprints \
  -H "Content-Type: application/json" \
  -d '{
    "project_title": "E-commerce Platform",
    "project_description": "Build a complete e-commerce platform with user management, product catalog, shopping cart, payment processing, order management, and admin dashboard",
    "sprint_capacity": 40,
    "max_sprints": 8
  }'
```

**Expected Response:**
```json
{
  "project_title": "E-commerce Platform",
  "total_duration": 320.5,
  "sprints": [
    {
      "sprint_number": 1,
      "total_hours": 38.5,
      "tasks": [
        {
          "task": "Set up project structure and authentication system",
          "duration": 16.0,
          "roles": ["Backend Developer", "Frontend Developer"],
          "prediction": {
            "complexity": 6.2,
            "risk": 0.2,
            "priority": 0.9
          }
        }
      ]
    }
  ]
}
```

### Test 4: Project Analysis API

#### Step 1: Test Project Analysis
```bash
curl -X POST http://localhost:8000/predict/project \
  -H "Content-Type: application/json" \
  -d '{
    "project_title": "Mobile App Development",
    "project_description": "Develop a cross-platform mobile application with real-time messaging, push notifications, offline capabilities, and social media integration",
    "max_workers_per_task": 3
  }'
```

**Expected Response:**
```json
{
  "project_title": "Mobile App Development",
  "project_description": "Develop a cross-platform mobile application...",
  "total_tasks": 15,
  "total_estimated_time": 245.3,
  "assignments": [
    {
      "task_index": 0,
      "task_name": "Set up React Native development environment",
      "required_roles": ["Mobile Developer"],
      "estimated_time": 8.0,
      "complexity": 4.5,
      "risk": 0.1,
      "priority": 0.9,
      "assigned_workers": [
        {
          "name": "John Doe",
          "role": "Mobile Developer",
          "skill_score": 0.85,
          "workload_factor": 0.7,
          "complexity_fit": 0.9,
          "formula_y_score": 0.82,
          "assigned_time": 8.0
        }
      ]
    }
  ],
  "worker_utilization": {
    "John Doe": {
      "total_hours": 45.2,
      "utilization_percent": 75.3,
      "status": "normal"
    }
  }
}
```

## 🎨 Frontend Testing

### Test 1: Access AI Features in AdminiX

1. **Start the application**:
   ```bash
   ./start-all.sh
   ```

2. **Navigate to AdminiX**:
   - Open http://localhost:5173
   - Login to your account
   - Navigate to any workspace and project

3. **Access Analytics Tab**:
   - Click on the "Analytics" tab in any project
   - You should see the new "AI-Powered Analytics" section

### Test 2: Task Prediction UI

1. **Go to Task Prediction Tab**:
   - Click on "Task Prediction" in the AI analytics section
   - You should see a text area for task description

2. **Test Different Tasks**:
   ```
   Simple Task: "Create a contact form"
   Medium Task: "Implement user authentication with JWT"
   Complex Task: "Build a real-time chat system with WebSocket and encryption"
   ```

3. **Verify Results**:
   - Check that complexity, risk, and priority scores appear
   - Verify progress bars are working
   - Ensure scores are reasonable (complexity 0-10, risk/priority 0-100%)

### Test 3: Sprint Planning UI

1. **Go to Sprint Planning Tab**:
   - Click on "Sprint Planning" in the AI analytics section

2. **Test with Sample Project**:
   ```
   Project Title: "E-commerce Platform"
   Project Description: "Build a complete online store with user management, product catalog, shopping cart, payment processing, order management, and admin dashboard"
   Sprint Capacity: 40
   Max Sprints: 8
   ```

3. **Verify Results**:
   - Check that sprints are generated
   - Verify task breakdowns
   - Ensure time estimates are reasonable
   - Check role assignments

### Test 4: Project Analysis UI

1. **Go to Project Analysis Tab**:
   - Click on "Project Analysis" in the AI analytics section

2. **Test with Sample Project**:
   ```
   Project Title: "Mobile App Development"
   Project Description: "Develop a cross-platform mobile application with real-time messaging, push notifications, offline capabilities, and social media integration"
   Max Workers per Task: 3
   ```

3. **Verify Results**:
   - Check project overview statistics
   - Verify task assignments
   - Review worker utilization
   - Ensure all data is displayed correctly

## 🐛 Troubleshooting Tests

### Common Issues and Solutions

#### Issue 1: ML Service Not Starting
```bash
# Check if Python is installed
python3 --version

# Check if virtual environment exists
ls ml-service/venv/

# Recreate virtual environment if needed
cd ml-service
rm -rf venv
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

#### Issue 2: CORS Errors
- The ML service includes CORS middleware
- Check that requests are going to http://localhost:8000
- Verify the frontend is making requests to the correct URL

#### Issue 3: Port Conflicts
```bash
# Check what's running on each port
lsof -i :8000  # ML Service
lsof -i :5000  # Backend
lsof -i :5173  # Client

# Kill processes if needed
kill -9 <PID>
```

#### Issue 4: Model Loading Issues
```bash
# Check if model files exist
ls ml-service/models/

# Expected files:
# - complexity_model.pkl
# - priority_model.pkl
# - risk_model.pkl
```

### Debug Mode Testing

#### Enable Debug Mode for ML Service
```bash
cd ml-service
source venv/bin/activate
python -m uvicorn api:app --reload --host 0.0.0.0 --port 8000 --log-level debug
```

#### Check Logs
```bash
# ML Service logs will show in the terminal
# Look for:
# - Model loading messages
# - API request logs
# - Error messages
```

## 📊 Performance Testing

### Load Testing
```bash
# Test multiple concurrent requests
for i in {1..10}; do
  curl -X POST http://localhost:8000/predict/task \
    -H "Content-Type: application/json" \
    -d '{"task_text": "Test task $i"}' &
done
wait
```

### Response Time Testing
```bash
# Test response times
time curl -X POST http://localhost:8000/predict/task \
  -H "Content-Type: application/json" \
  -d '{"task_text": "Complex task with many features"}'
```

## 🧪 Automated Testing

### Create Test Script
```bash
# Create test script
cat > test-ai-integration.sh << 'EOF'
#!/bin/bash

echo "🧪 Testing AI Integration..."

# Test health endpoint
echo "1. Testing health endpoint..."
curl -s http://localhost:8000/health | jq .

# Test task prediction
echo "2. Testing task prediction..."
curl -s -X POST http://localhost:8000/predict/task \
  -H "Content-Type: application/json" \
  -d '{"task_text": "Test task"}' | jq .

# Test sprint planning
echo "3. Testing sprint planning..."
curl -s -X POST http://localhost:8000/predict/project/sprints \
  -H "Content-Type: application/json" \
  -d '{
    "project_title": "Test Project",
    "project_description": "Test project description",
    "sprint_capacity": 40,
    "max_sprints": 5
  }' | jq .

echo "✅ All tests completed!"
EOF

chmod +x test-ai-integration.sh
```

### Run Automated Tests
```bash
# Make sure services are running first
./start-all.sh

# Wait for services to start, then run tests
sleep 10
./test-ai-integration.sh
```

## ✅ Success Criteria

### API Tests
- [ ] Health endpoint returns status "healthy"
- [ ] Task prediction returns valid scores (0-10 for complexity, 0-1 for risk/priority)
- [ ] Sprint planning generates reasonable sprint breakdowns
- [ ] Project analysis provides worker assignments and utilization

### Frontend Tests
- [ ] AI analytics section appears in project analytics
- [ ] All three tabs (Task Prediction, Sprint Planning, Project Analysis) work
- [ ] Forms submit successfully and show results
- [ ] Progress bars and visualizations display correctly
- [ ] Error handling works for invalid inputs

### Integration Tests
- [ ] Frontend can communicate with ML service
- [ ] Results are displayed correctly in the UI
- [ ] Loading states work properly
- [ ] Error messages are user-friendly

## 🎯 Test Data Examples

### Sample Tasks for Testing
```
Simple: "Create a contact form"
Medium: "Implement user authentication"
Complex: "Build real-time chat system"
High-Risk: "Migrate production database"
```

### Sample Projects for Testing
```
Small: "Personal Blog"
Medium: "E-commerce Platform"
Large: "Enterprise CRM System"
Complex: "AI-Powered Analytics Dashboard"
```

## 📝 Test Report Template

After running tests, document your results:

```markdown
## Test Report - AI Integration

### Date: [Date]
### Tester: [Name]

### Services Status
- [ ] ML Service (Port 8000)
- [ ] Backend (Port 5000)
- [ ] Client (Port 5173)

### API Tests
- [ ] Health endpoint
- [ ] Task prediction
- [ ] Sprint planning
- [ ] Project analysis

### Frontend Tests
- [ ] AI analytics section loads
- [ ] Task prediction UI works
- [ ] Sprint planning UI works
- [ ] Project analysis UI works

### Issues Found
- [List any issues]

### Performance
- Average response time: [X] seconds
- Concurrent requests handled: [X]

### Recommendations
- [Any improvements needed]
```

This comprehensive testing guide should help you verify that the AI integration is working correctly! 🚀 