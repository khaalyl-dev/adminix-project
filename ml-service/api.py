"""
FastAPI Application for Task Prediction and Assignment System
Author: Mohamed Taher Ben Slama - Digixi Intern
"""

from fastapi import FastAPI, HTTPException, UploadFile, File, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Dict, Optional, Any
import json
import pandas as pd
import numpy as np
import os
import joblib
import tempfile
import shutil
from datetime import datetime
import uvicorn
import logging

# Import your existing modules
from ml import TaskPredictorTextOnly
from model import FormulaYAssignmentEngine, calculate_task_times, predict_tasks
from gemini import suggest_task_details
from database import db_connection

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="Task Prediction & Assignment API",
    description="Advanced ML-powered task prediction and assignment system using Formula Y algorithm",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic Models
class TaskPredictionRequest(BaseModel):
    task_text: str = Field(..., description="Task description text")

class TaskPredictionResponse(BaseModel):
    complexity: float = Field(..., description="Predicted complexity score (0-10)")
    risk: float = Field(..., description="Predicted risk score (0-1)")
    priority: float = Field(..., description="Predicted priority score (0-1)")

class SprintTaskPrediction(BaseModel):
    complexity: float
    risk: float
    priority: float

class SprintTask(BaseModel):
    task: str
    duration: float
    roles: List[str]
    prediction: SprintTaskPrediction

class Sprint(BaseModel):
    sprint_number: int
    total_hours: float
    tasks: List[SprintTask]

class SprintPlanRequest(BaseModel):
    project_title: str = Field(..., description="Project title")
    project_description: str = Field(..., description="Detailed project description")
    sprint_capacity: int = Field(default=40, description="Hours per sprint (default: 40)")
    max_sprints: int = Field(default=10, description="Maximum number of sprints")
    workspace_id: str = Field(..., description="Workspace ID to fetch workers from")

class SprintPlanResponse(BaseModel):
    project_title: str
    total_duration: float
    sprints: List[Sprint]

class ProjectRequest(BaseModel):
    project_title: str = Field(..., description="Project title")
    project_description: str = Field(..., description="Detailed project description")
    max_workers_per_task: int = Field(default=3, description="Maximum workers per task")
    workspace_id: str = Field(..., description="Workspace ID to fetch workers from")

class TaskInfo(BaseModel):
    task: str
    duration: Optional[float] = None
    roles: List[str]
    complexity: float
    risk: float
    priority: float
    estimated_time: Optional[float] = None

class WorkerInfo(BaseModel):
    name: str
    role: str
    skill_score: float
    workload_factor: float
    complexity_fit: float
    formula_y_score: float
    assigned_time: float

class TaskAssignment(BaseModel):
    task_index: int
    task_name: str
    required_roles: List[str]
    estimated_time: float
    complexity: float
    risk: float
    priority: float
    assigned_workers: List[WorkerInfo]

class ProjectResponse(BaseModel):
    project_title: str
    project_description: str
    total_tasks: int
    total_estimated_time: float
    assignments: List[TaskAssignment]
    worker_utilization: Dict[str, Dict[str, Any]]

class TrainingRequest(BaseModel):
    csv_path: str = Field(default="big_dataset.csv", description="Path to training dataset")

class TrainingStatus(BaseModel):
    status: str
    message: str
    timestamp: str

# Global variables for model management
ml_predictor = None
assignment_engine = None
training_status = {"status": "idle", "message": "No training in progress", "timestamp": ""}

# Utility functions
def initialize_ml_predictor():
    """Initialize ML predictor with pre-trained models"""
    global ml_predictor
    try:
        ml_predictor = TaskPredictorTextOnly()
        ml_predictor.load_models("models")
        logger.info("ML predictor initialized successfully")
        return True
    except Exception as e:
        logger.error(f"Failed to initialize ML predictor: {e}")
        ml_predictor = None
        return False

def initialize_assignment_engine():
    """Initialize Formula Y assignment engine"""
    global assignment_engine
    try:
        assignment_engine = FormulaYAssignmentEngine("workers.csv")
        logger.info("Assignment engine initialized successfully")
        return True
    except Exception as e:
        logger.error(f"Failed to initialize assignment engine: {e}")
        assignment_engine = None
        return False

# Startup event
@app.on_event("startup")
async def startup_event():
    """Initialize components on startup"""
    logger.info("Starting Task Prediction & Assignment API...")
    initialize_ml_predictor()
    initialize_assignment_engine()

# Health check endpoint
@app.get("/health", tags=["Health"])
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "ml_predictor_ready": ml_predictor is not None and ml_predictor.is_trained,
        "assignment_engine_ready": assignment_engine is not None
    }

# Task prediction endpoints
@app.post("/predict/task", response_model=TaskPredictionResponse, tags=["Prediction"])
async def predict_single_task(request: TaskPredictionRequest):
    """Predict complexity, risk, and priority for a single task"""
    if not ml_predictor or not ml_predictor.is_trained:
        raise HTTPException(
            status_code=503, 
            detail="ML predictor not available. Please train models first."
        )
    
    try:
        prediction = ml_predictor.predict(request.task_text)
        return TaskPredictionResponse(**prediction)
    except Exception as e:
        logger.error(f"Prediction error: {e}")
        raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")

@app.post("/predict/project/sprints", response_model=SprintPlanResponse, tags=["Sprint Planning"])
async def predict_project_sprints(request: SprintPlanRequest):
    """Generate sprint-organized project plan with task predictions"""
    print(f"🚀 AI Sprint Planning triggered for workspace: {request.workspace_id}")
    
    if not ml_predictor or not ml_predictor.is_trained:
        print("❌ ML predictor not available")
        raise HTTPException(
            status_code=503, 
            detail="ML predictor not available. Please train models first."
        )
    
    print(f"✅ ML predictor ready - Starting sprint planning")
    
    try:
        # Step 1: Generate task details using Gemini
        logger.info(f"Generating sprint plan for project: {request.project_title}")
        gemini_response = suggest_task_details(request.project_description)
        
        if not gemini_response:
            raise HTTPException(status_code=500, detail="Failed to generate tasks from Gemini API")
        
        # Parse Gemini response
        try:
            tasks_info = json.loads(gemini_response)
        except json.JSONDecodeError:
            raise HTTPException(status_code=500, detail="Invalid JSON response from Gemini API")
        
        # Step 2: Process tasks and get ML predictions
        processed_tasks = []
        for task_info in tasks_info:
            task_text = task_info.get("task", "Unknown Task")
            duration = float(task_info.get("duration", 8))  # Default 8 hours if not specified
            roles = task_info.get("roles", [])
            
            # Ensure roles is a list
            if isinstance(roles, str):
                roles = [roles.strip()]
            elif not isinstance(roles, list):
                roles = ["Developer"]  # Default role
            
            # Get ML predictions
            pred = ml_predictor.predict(task_text)
            
            processed_tasks.append({
                "task": task_text,
                "duration": duration,
                "roles": roles,
                "prediction": {
                    "complexity": round(pred['complexity'], 2),
                    "risk": round(pred['risk'], 2),
                    "priority": round(pred['priority'], 2)
                }
            })
        
        # Step 3: Calculate estimated times using database workers
        processed_tasks = calculate_task_times(processed_tasks, request.workspace_id)
        
        # Step 4: Sort tasks by priority (high priority first)
        processed_tasks.sort(key=lambda x: x['prediction']['priority'], reverse=True)
        
        # Step 4: Organize into sprints
        sprints = []
        current_sprint = []
        current_sprint_hours = 0
        sprint_number = 1
        
        for task in processed_tasks:
            task_duration = task['duration']
            
            # Check if task fits in current sprint
            if current_sprint_hours + task_duration <= request.sprint_capacity:
                current_sprint.append(task)
                current_sprint_hours += task_duration
            else:
                # Finalize current sprint if it has tasks
                if current_sprint:
                    sprints.append({
                        "sprint_number": sprint_number,
                        "total_hours": round(current_sprint_hours, 1),
                        "tasks": current_sprint
                    })
                    sprint_number += 1
                
                # Start new sprint with current task
                current_sprint = [task]
                current_sprint_hours = task_duration
                
                # Check max sprints limit
                if len(sprints) >= request.max_sprints:
                    break
        
        # Add final sprint if it has tasks
        if current_sprint and len(sprints) < request.max_sprints:
            sprints.append({
                "sprint_number": sprint_number,
                "total_hours": round(current_sprint_hours, 1),
                "tasks": current_sprint
            })
        
        # Calculate total duration
        total_duration = sum(sprint['total_hours'] for sprint in sprints)
        
        return SprintPlanResponse(
            project_title=request.project_title,
            total_duration=round(total_duration, 1),
            sprints=sprints
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Sprint planning error: {e}")
        raise HTTPException(status_code=500, detail=f"Sprint planning failed: {str(e)}")

@app.post("/predict/project", response_model=ProjectResponse, tags=["Prediction"])
async def predict_project_tasks(request: ProjectRequest):
    """Generate and predict tasks for an entire project using Gemini + ML"""
    print(f"🚀 AI Project Analysis triggered for workspace: {request.workspace_id}")
    print(f"🔍 Request details - Project: {request.project_title}, Workers per task: {request.max_workers_per_task}")
    print(f"🔍 This should only be called when user clicks 'Analyze Project' button")
    
    if not ml_predictor or not ml_predictor.is_trained:
        print("❌ ML predictor not available")
        raise HTTPException(
            status_code=503, 
            detail="ML predictor not available. Please train models first."
        )
    
    print(f"✅ ML predictor ready - Initializing assignment engine")
    # Initialize assignment engine with database workers
    assignment_engine = FormulaYAssignmentEngine(request.workspace_id)
    
    if assignment_engine.workers_df.empty:
        print(f"❌ No CSV workers found for workspace {request.workspace_id}")
        raise HTTPException(
            status_code=400, 
            detail=f"No CSV workers found in database for workspace {request.workspace_id}. Please import workers first."
        )
    
    print(f"✅ Assignment engine ready with {len(assignment_engine.workers_df)} workers")
    
    try:
        # Step 1: Generate task details using Gemini
        logger.info(f"Generating tasks for project: {request.project_title}")
        gemini_response = suggest_task_details(request.project_description)
        
        if not gemini_response:
            raise HTTPException(status_code=500, detail="Failed to generate tasks from Gemini API")
        
        # Parse Gemini response
        try:
            tasks_info = json.loads(gemini_response)
        except json.JSONDecodeError:
            raise HTTPException(status_code=500, detail="Invalid JSON response from Gemini API")
        
        # Step 2: Predict using ML models
        predicted_tasks = []
        for task_info in tasks_info:
            task_text = task_info.get("task", "Unknown Task")
            duration = task_info.get("duration", 0)
            roles = task_info.get("roles", [])
            
            # Ensure roles is a list
            if isinstance(roles, str):
                roles = [roles.strip()]
            elif not isinstance(roles, list):
                roles = []
            
            # Get ML predictions
            pred = ml_predictor.predict(task_text)
            
            predicted_tasks.append({
                "task": task_text,
                "duration": duration,
                "roles": roles,
                "complexity": pred['complexity'],
                "risk": pred['risk'],
                "priority": pred['priority']
            })
        
        # Step 3: Calculate estimated times
        predicted_tasks = calculate_task_times(predicted_tasks, request.workspace_id)
        
        # Step 4: Apply Formula Y assignment
        assignments = assignment_engine.assign_tasks(predicted_tasks, request.max_workers_per_task)
        
        # Step 5: Calculate totals and worker utilization
        total_estimated_time = sum(task.get('estimated_time', 0) for task in predicted_tasks)
        
        worker_utilization = {}
        for worker_name, total_hours in assignment_engine.worker_availability.items():
            utilization_percent = (total_hours / 160) * 100  # 160 hours = 4 weeks capacity
            status = "overloaded" if utilization_percent > 100 else \
                    "high_load" if utilization_percent > 80 else \
                    "normal" if utilization_percent > 50 else "light_load"
            
            worker_utilization[worker_name] = {
                "total_hours": round(total_hours, 2),
                "utilization_percent": round(utilization_percent, 2),
                "status": status
            }
        
        return ProjectResponse(
            project_title=request.project_title,
            project_description=request.project_description,
            total_tasks=len(predicted_tasks),
            total_estimated_time=round(total_estimated_time, 2),
            assignments=assignments,
            worker_utilization=worker_utilization
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Project prediction error: {e}")
        raise HTTPException(status_code=500, detail=f"Project prediction failed: {str(e)}")

# Model management endpoints
@app.post("/models/train", response_model=TrainingStatus, tags=["Model Management"])
async def train_models(background_tasks: BackgroundTasks, request: TrainingRequest):
    """Train ML models in the background"""
    global training_status
    
    if training_status["status"] == "training":
        raise HTTPException(status_code=409, detail="Training already in progress")
    
    # Check if dataset exists
    if not os.path.exists(request.csv_path):
        raise HTTPException(status_code=404, detail=f"Dataset file not found: {request.csv_path}")
    
    # Start background training
    background_tasks.add_task(train_models_background, request.csv_path)
    
    training_status = {
        "status": "training",
        "message": f"Training started with dataset: {request.csv_path}",
        "timestamp": datetime.now().isoformat()
    }
    
    return TrainingStatus(**training_status)

async def train_models_background(csv_path: str):
    """Background task for model training"""
    global ml_predictor, training_status
    
    try:
        logger.info(f"Starting model training with dataset: {csv_path}")
        
        # Initialize new predictor
        predictor = TaskPredictorTextOnly()
        predictor.train(csv_path)
        predictor.save_models("models")
        
        # Replace global predictor
        ml_predictor = predictor
        
        training_status = {
            "status": "completed",
            "message": "Model training completed successfully",
            "timestamp": datetime.now().isoformat()
        }
        
        logger.info("Model training completed successfully")
        
    except Exception as e:
        logger.error(f"Model training failed: {e}")
        training_status = {
            "status": "failed",
            "message": f"Model training failed: {str(e)}",
            "timestamp": datetime.now().isoformat()
        }

@app.get("/models/status", response_model=TrainingStatus, tags=["Model Management"])
async def get_training_status():
    """Get current training status"""
    return TrainingStatus(**training_status)

@app.post("/models/reload", tags=["Model Management"])
async def reload_models():
    """Reload models from disk"""
    success = initialize_ml_predictor()
    if success:
        return {"status": "success", "message": "Models reloaded successfully"}
    else:
        raise HTTPException(status_code=500, detail="Failed to reload models")

# Worker management endpoints
@app.get("/workers/debug", tags=["Workers"])
async def debug_workers():
    """Debug endpoint to check all CSV workers in database"""
    try:
        if db_connection.db is None:
            if not db_connection.connect():
                return {"error": "Could not connect to database"}
        
        # Get all CSV workers
        all_workers = list(db_connection.db.csvworkers.find({}))
        
        # Group by workspace
        workspace_workers = {}
        for worker in all_workers:
            workspace_id = str(worker.get("workspaceId", "unknown"))
            if workspace_id not in workspace_workers:
                workspace_workers[workspace_id] = []
            workspace_workers[workspace_id].append({
                "name": worker.get("name"),
                "role": worker.get("role"),
                "workspaceId": workspace_id
            })
        
        return {
            "total_workers": len(all_workers),
            "workspaces": workspace_workers,
            "message": "Debug information for CSV workers"
        }
    except Exception as e:
        print(f"❌ Debug Error: {e}")
        import traceback
        traceback.print_exc()
        return {"error": str(e)}

@app.get("/workers", tags=["Workers"])
async def get_workers(workspace_id: str = None):
    """Get list of all workers from database"""
    try:
        if not workspace_id:
            return {"workers": [], "total_count": 0, "message": "No workspace_id provided"}
        
        print(f"🔍 API: Fetching workers for workspace {workspace_id}")
        workers_data = db_connection.get_csv_workers(workspace_id)
        
        if not workers_data:
            print(f"⚠️  No workers found for workspace {workspace_id}")
            return {"workers": [], "total_count": 0, "message": f"No workers found for workspace {workspace_id}"}
        
        print(f"✅ API: Retrieved {len(workers_data)} workers successfully")
        return {"workers": workers_data, "total_count": len(workers_data)}
    except Exception as e:
        print(f"❌ API Error in get_workers: {e}")
        return {"workers": [], "total_count": 0, "error": f"Error reading workers: {str(e)}"}

@app.post("/workers/upload", tags=["Workers"])
async def upload_workers_csv(file: UploadFile = File(...)):
    """Upload new workers CSV file"""
    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="File must be a CSV")
    
    try:
        # Save uploaded file
        with tempfile.NamedTemporaryFile(delete=False, suffix='.csv') as tmp_file:
            shutil.copyfileobj(file.file, tmp_file)
            tmp_path = tmp_file.name
        
        # Validate CSV structure
        df = pd.read_csv(tmp_path)
        required_columns = ['Name', 'Role', 'Technologies', 'Experience']
        
        if not all(col in df.columns for col in required_columns):
            os.unlink(tmp_path)
            raise HTTPException(
                status_code=400, 
                detail=f"CSV must contain columns: {required_columns}"
            )
        
        # Replace workers.csv
        shutil.move(tmp_path, "workers.csv")
        
        # Reinitialize assignment engine
        initialize_assignment_engine()
        
        return {
            "status": "success", 
            "message": f"Workers CSV uploaded successfully. {len(df)} workers loaded.",
            "workers_count": len(df)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        if 'tmp_path' in locals():
            os.unlink(tmp_path)
        raise HTTPException(status_code=500, detail=f"Error processing file: {str(e)}")

@app.get("/workers/utilization", tags=["Workers"])
async def get_worker_utilization():
    """Get current worker utilization"""
    if not assignment_engine:
        raise HTTPException(status_code=503, detail="Assignment engine not available")
    
    utilization = {}
    for worker_name, total_hours in assignment_engine.worker_availability.items():
        utilization_percent = (total_hours / 160) * 100
        status = "overloaded" if utilization_percent > 100 else \
                "high_load" if utilization_percent > 80 else \
                "normal" if utilization_percent > 50 else "light_load"
        
        utilization[worker_name] = {
            "total_hours": round(total_hours, 2),
            "utilization_percent": round(utilization_percent, 2),
            "status": status
        }
    
    return {"worker_utilization": utilization}

@app.post("/workers/reset-utilization", tags=["Workers"])
async def reset_worker_utilization():
    """Reset worker utilization (clear all assignments)"""
    if not assignment_engine:
        raise HTTPException(status_code=503, detail="Assignment engine not available")
    
    assignment_engine.worker_availability.clear()
    return {"status": "success", "message": "Worker utilization reset successfully"}

# Dataset management endpoints
@app.post("/dataset/upload", tags=["Dataset"])
async def upload_dataset(file: UploadFile = File(...)):
    """Upload new training dataset"""
    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="File must be a CSV")
    
    try:
        # Save uploaded file
        with open("big_dataset.csv", "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        # Validate dataset structure
        df = pd.read_csv("big_dataset.csv")
        required_columns = ["Task", "Complexity Score", "Risk"]
        
        missing_columns = [col for col in required_columns if col not in df.columns]
        if missing_columns:
            raise HTTPException(
                status_code=400,
                detail=f"Dataset missing required columns: {missing_columns}"
            )
        
        return {
            "status": "success",
            "message": f"Dataset uploaded successfully. {len(df)} records loaded.",
            "records_count": len(df),
            "columns": df.columns.tolist()
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing dataset: {str(e)}")

@app.get("/dataset/info", tags=["Dataset"])
async def get_dataset_info():
    """Get information about the current dataset"""
    try:
        df = pd.read_csv("big_dataset.csv")
        return {
            "records_count": len(df),
            "columns": df.columns.tolist(),
            "file_size_mb": round(os.path.getsize("big_dataset.csv") / (1024*1024), 2)
        }
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="Dataset file not found")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error reading dataset: {str(e)}")

# Batch processing endpoints
@app.post("/predict/batch", tags=["Batch Processing"])
async def predict_batch_tasks(tasks: List[str]):
    """Predict multiple tasks at once"""
    if not ml_predictor or not ml_predictor.is_trained:
        raise HTTPException(
            status_code=503, 
            detail="ML predictor not available. Please train models first."
        )
    
    try:
        predictions = []
        for i, task_text in enumerate(tasks):
            pred = ml_predictor.predict(task_text)
            predictions.append({
                "index": i,
                "task": task_text,
                **pred
            })
        
        return {"predictions": predictions, "total_count": len(predictions)}
        
    except Exception as e:
        logger.error(f"Batch prediction error: {e}")
        raise HTTPException(status_code=500, detail=f"Batch prediction failed: {str(e)}")

# Formula Y specific endpoints
@app.post("/formula-y/assign", tags=["Formula Y"])
async def formula_y_assignment(tasks: List[TaskInfo], max_workers_per_task: int = 3):
    """Run Formula Y assignment algorithm on provided tasks"""
    if not assignment_engine:
        raise HTTPException(status_code=503, detail="Assignment engine not available")
    
    try:
        # Convert TaskInfo to dict format expected by assignment engine
        tasks_data = [task.dict() for task in tasks]
        
        # Calculate estimated times if not provided
        tasks_data = calculate_task_times(tasks_data)
        
        # Run Formula Y assignment
        assignments = assignment_engine.assign_tasks(tasks_data, max_workers_per_task)
        
        return {
            "assignments": assignments,
            "total_tasks": len(assignments),
            "worker_utilization": assignment_engine.worker_availability
        }
        
    except Exception as e:
        logger.error(f"Formula Y assignment error: {e}")
        raise HTTPException(status_code=500, detail=f"Assignment failed: {str(e)}")

# Documentation endpoints
@app.get("/", tags=["Documentation"])
async def root():
    """API Root - Welcome message and links"""
    return {
        "message": "Task Prediction & Assignment API",
        "version": "1.0.0",
        "author": "Mohamed Taher Ben Slama - Digixi Intern",
        "algorithm": "Formula Y Advanced Task Assignment",
        "documentation": "/docs",
        "redoc": "/redoc",
        "health_check": "/health"
    }

if __name__ == "__main__":
    
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)