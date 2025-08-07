# AI-Powered Analytics Integration

This document describes the AI integration that has been added to the AdminiX project, providing intelligent task prediction, sprint planning, and project analysis capabilities.

## 🚀 Quick Start

### 1. Start All Services
```bash
./start-all.sh
```

This script will automatically:
- Start the ML service on port 8000
- Start the backend on port 5000  
- Start the client on port 5173
- Install all necessary dependencies

### 2. Access the AI Features
Navigate to any project's Analytics tab in the AdminiX dashboard to access the AI-powered features.

## 🤖 AI Features Overview

### 1. Task Prediction
- **Purpose**: Analyze individual tasks to predict complexity, risk, and priority
- **Input**: Task description text
- **Output**: 
  - Complexity score (0-10)
  - Risk percentage (0-100%)
  - Priority percentage (0-100%)

### 2. Sprint Planning
- **Purpose**: Generate comprehensive sprint plans for projects
- **Input**: 
  - Project title and description
  - Sprint capacity (hours)
  - Maximum number of sprints
- **Output**: 
  - Detailed sprint breakdown
  - Task assignments with time estimates
  - Role requirements for each task

### 3. Project Analysis
- **Purpose**: Complete project analysis with worker assignment
- **Input**: 
  - Project title and description
  - Maximum workers per task
- **Output**: 
  - Task assignments with worker recommendations
  - Worker utilization analysis
  - Project timeline estimates

## 🏗️ Architecture

### ML Service (Port 8000)
- **Framework**: FastAPI
- **Models**: 
  - Task complexity prediction
  - Risk assessment
  - Priority scoring
  - Formula Y assignment algorithm
- **API Documentation**: http://localhost:8000/docs

### Integration Points
- **Frontend**: Enhanced analytics component in `client/src/components/workspace/project/project-analytics.tsx`
- **Backend**: Existing AdminiX backend (port 5000)
- **ML Service**: New AI service (port 8000)

## 📊 API Endpoints

### Health Check
```bash
GET http://localhost:8000/health
```

### Task Prediction
```bash
POST http://localhost:8000/predict/task
Content-Type: application/json

{
  "task_text": "Implement user authentication system"
}
```

### Sprint Planning
```bash
POST http://localhost:8000/predict/project/sprints
Content-Type: application/json

{
  "project_title": "E-commerce Platform",
  "project_description": "Build a complete e-commerce platform with user management, product catalog, and payment processing",
  "sprint_capacity": 40,
  "max_sprints": 10
}
```

### Project Analysis
```bash
POST http://localhost:8000/predict/project
Content-Type: application/json

{
  "project_title": "Mobile App Development",
  "project_description": "Develop a cross-platform mobile application with real-time features",
  "max_workers_per_task": 3
}
```

## 🛠️ Development Setup

### Prerequisites
- Node.js 18+
- Python 3.9+
- npm

### Manual Setup

1. **Install Client Dependencies**
```bash
cd client
npm install
```

2. **Install Backend Dependencies**
```bash
cd backend
npm install
```

3. **Setup ML Service**
```bash
cd ml-service
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

4. **Start Services**
```bash
# Terminal 1: ML Service
cd ml-service
source venv/bin/activate
python start.py

# Terminal 2: Backend
cd backend
npm run dev

# Terminal 3: Client
cd client
npm run dev
```

## 📁 File Structure

```
adminix-project/
├── client/
│   └── src/
│       └── components/
│           └── workspace/
│               └── project/
│                   └── project-analytics.tsx  # Enhanced with AI features
├── ml-service/
│   ├── api.py              # FastAPI application
│   ├── model.py            # Formula Y assignment engine
│   ├── ml.py               # ML prediction models
│   ├── gemini.py           # AI task suggestions
│   ├── start.py            # Service startup script
│   └── requirements.txt    # Python dependencies
├── start-all.sh            # Complete startup script
└── AI_INTEGRATION.md       # This documentation
```

## 🎯 Usage Examples

### Example 1: Task Prediction
1. Navigate to a project's Analytics tab
2. Go to the "Task Prediction" section
3. Enter a task description like: "Implement user authentication with JWT tokens"
4. Click "Predict Task"
5. View the complexity, risk, and priority scores

### Example 2: Sprint Planning
1. Go to the "Sprint Planning" section
2. Enter project details:
   - Title: "E-commerce Platform"
   - Description: "Build a complete online store with user management, product catalog, shopping cart, and payment processing"
3. Set sprint capacity to 40 hours
4. Click "Generate Sprint Plan"
5. Review the detailed sprint breakdown

### Example 3: Project Analysis
1. Go to the "Project Analysis" section
2. Enter project details:
   - Title: "Mobile App Development"
   - Description: "Develop a cross-platform mobile application with real-time messaging, push notifications, and offline capabilities"
3. Set max workers per task to 3
4. Click "Analyze Project"
5. Review task assignments and worker utilization

## 🔧 Configuration

### ML Service Configuration
The ML service can be configured via environment variables:

```bash
# ml-service/.env
ML_SERVICE_PORT=8000
ML_SERVICE_HOST=0.0.0.0
```

### API Base URL
The frontend connects to the ML service via the `ML_API_BASE_URL` constant in the analytics component. By default, it's set to `http://localhost:8000`.

## 🐛 Troubleshooting

### Common Issues

1. **ML Service Not Starting**
   - Check if Python 3.9+ is installed
   - Ensure virtual environment is created
   - Verify all dependencies are installed

2. **CORS Errors**
   - The ML service includes CORS middleware
   - Ensure the frontend is making requests to the correct URL

3. **Port Conflicts**
   - ML Service: 8000
   - Backend: 5000
   - Client: 5173
   - Check if any of these ports are already in use

4. **Model Loading Issues**
   - Ensure the ML models are properly trained
   - Check the model files exist in `ml-service/models/`

### Debug Mode
To run the ML service in debug mode:
```bash
cd ml-service
source venv/bin/activate
python -m uvicorn api:app --reload --host 0.0.0.0 --port 8000
```

## 📈 Performance

### Model Performance
- **Task Prediction**: ~1-2 seconds per prediction
- **Sprint Planning**: ~5-10 seconds for complex projects
- **Project Analysis**: ~10-15 seconds for large projects

### Scalability
- The ML service can handle multiple concurrent requests
- Models are loaded once at startup for optimal performance
- Background processing for heavy computations

## 🔮 Future Enhancements

### Planned Features
- [ ] Real-time task complexity monitoring
- [ ] Integration with existing task management
- [ ] Automated sprint suggestions
- [ ] Worker skill matching improvements
- [ ] Historical performance analysis

### API Extensions
- [ ] Batch task prediction
- [ ] Custom model training
- [ ] Export analysis reports
- [ ] Integration with external project management tools

## 🤝 Contributing

### Adding New AI Features
1. Extend the ML service API in `ml-service/api.py`
2. Add corresponding UI components in the analytics component
3. Update this documentation
4. Test thoroughly with different project types

### Model Improvements
1. Collect more training data
2. Retrain models with new data
3. Validate model performance
4. Deploy updated models

## 📞 Support

For issues related to:
- **AI Features**: Check the ML service logs and API documentation
- **Frontend Integration**: Review the analytics component code
- **General AdminiX**: Refer to the main project documentation

---

**Note**: The AI integration is designed to enhance project management capabilities while maintaining the existing AdminiX functionality. All AI predictions are suggestions and should be reviewed by project managers before implementation. 