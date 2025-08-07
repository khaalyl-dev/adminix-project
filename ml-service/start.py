#!/usr/bin/env python3
"""
ML Service Startup Script
This script starts the FastAPI ML service for the AdminiX dashboard
"""

import uvicorn
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

if __name__ == "__main__":
    # Get port from environment or default to 3000
    port = int(os.getenv("ML_SERVICE_PORT", 3000))
    host = os.getenv("ML_SERVICE_HOST", "0.0.0.0")
    
    print(f"🚀 Starting ML Service on {host}:{port}")
    print("📊 ML-powered task prediction and assignment system")
    print("🗄️  Connected to database for CSV workers")
    print(f"🔗 API Documentation: http://localhost:{port}/docs")
    
    uvicorn.run(
        "api:app",
        host=host,
        port=port,
        reload=True,
        log_level="info",
        timeout_keep_alive=30,
        timeout_graceful_shutdown=30
    ) 