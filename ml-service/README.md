# AdminiX ML Service

This is the ML-powered microservice for the AdminiX dashboard, providing advanced task prediction and assignment capabilities using Formula Y algorithm.

## Features

- **Task Complexity Prediction**: ML models predict task complexity, risk, and priority
- **Sprint Planning**: AI-powered sprint planning with capacity optimization
- **Worker Assignment**: Formula Y algorithm for optimal task-worker matching
- **Project Estimation**: Complete project breakdown with time estimates
- **Worker Management**: Upload and manage team member skills and availability

## Quick Start

1. **Install Dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

2. **Start the Service**:
   ```bash
   python start.py
   ```

3. **Access API Documentation**:
   - Swagger UI: http://localhost:8000/docs
   - ReDoc: http://localhost:8000/redoc

## API Endpoints

### Task Prediction
- `POST /predict/task` - Predict single task complexity, risk, and priority
- `POST /predict/batch` - Predict multiple tasks at once

### Project Planning
- `POST /predict/project/sprints` - Generate sprint plan for a project
- `POST /predict/project` - Complete project breakdown with worker assignments

### Worker Management
- `GET /workers` - Get all workers
- `POST /workers/upload` - Upload workers CSV file
- `GET /workers/utilization` - Get worker utilization statistics
- `POST /workers/reset-utilization` - Reset worker utilization

### Model Management
- `POST /models/train` - Train ML models with new data
- `GET /models/status` - Get training status
- `POST /models/reload` - Reload trained models

## Formula Y Algorithm

The Formula Y algorithm optimizes task assignment using three key factors:

1. **Skill Match Score (S)**: Technical compatibility between worker and task
2. **Workload Factor (W)**: Resource availability and overload prevention
3. **Complexity Fit Factor (C)**: Experience-complexity alignment

Final Score: `Y = S × W × C`

## Environment Variables

- `ML_SERVICE_PORT`: Service port (default: 8000)
- `ML_SERVICE_HOST`: Service host (default: 0.0.0.0)
- `GOOGLE_API_KEY`: Google Gemini API key for task suggestions

## Integration with AdminiX Dashboard

This service is designed to work seamlessly with the AdminiX dashboard backend. The Node.js backend communicates with this Python service through HTTP requests.

## Development

- **Training Models**: `python -c "from ml import train_models; train_models()"`
- **Testing**: `python -c "import api; print('Service loaded successfully')"`

## Author

Mohamed Taher Ben Slama - Digixi Intern 