#!/bin/bash
# Complete startup script for adminix-project including ML service

set -e

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo -e "${BLUE}🚀 Starting AdminiX Project with AI Analytics${NC}"
echo -e "${BLUE}=============================================${NC}"

# Function to check if a port is in use
check_port() {
    local port=$1
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null ; then
        return 0
    else
        return 1
    fi
}

# Function to start ML service
start_ml_service() {
    echo -e "${YELLOW}🤖 Starting ML Service...${NC}"
    cd "$SCRIPT_DIR/ml-service"
    
    # Check if Python virtual environment exists
    if [ ! -d "venv" ]; then
        echo -e "${YELLOW}Creating Python virtual environment...${NC}"
        python3 -m venv venv
    fi
    
    # Activate virtual environment and install dependencies
    echo -e "${YELLOW}Installing ML service dependencies...${NC}"
    source venv/bin/activate
    pip install -r requirements.txt
    
    # Start ML service in background
    echo -e "${GREEN}Starting ML service on port 8000...${NC}"
    python start.py &
    ML_PID=$!
    echo $ML_PID > .ml_service.pid
    
    # Wait a moment for the service to start
    sleep 3
    
    # Check if ML service is running
    if check_port 3000; then
        echo -e "${GREEN}✅ ML Service started successfully on http://localhost:3000${NC}"
        echo -e "${BLUE}📊 API Documentation: http://localhost:3000/docs${NC}"
    else
        echo -e "${RED}❌ Failed to start ML service${NC}"
        exit 1
    fi
}

# Function to start backend
start_backend() {
    echo -e "${YELLOW}🔧 Starting Backend...${NC}"
    cd "$SCRIPT_DIR/backend"
    
    # Check if node_modules exists
    if [ ! -d "node_modules" ]; then
        echo -e "${YELLOW}Installing backend dependencies...${NC}"
        npm install
    fi
    
    # Start backend in background
    echo -e "${GREEN}Starting backend on port 5000...${NC}"
    npm run dev &
    BACKEND_PID=$!
    echo $BACKEND_PID > .backend.pid
    
    # Wait a moment for the service to start
    sleep 3
    
    # Check if backend is running
    if check_port 8000; then
        echo -e "${GREEN}✅ Backend started successfully on http://localhost:8000${NC}"
    else
        echo -e "${RED}❌ Failed to start backend${NC}"
        exit 1
    fi
}

# Function to start client
start_client() {
    echo -e "${YELLOW}🎨 Starting Client...${NC}"
    cd "$SCRIPT_DIR/client"
    
    # Check if node_modules exists
    if [ ! -d "node_modules" ]; then
        echo -e "${YELLOW}Installing client dependencies...${NC}"
        npm install
    fi
    
    # Start client in background
    echo -e "${GREEN}Starting client on port 5173...${NC}"
    npm run dev &
    CLIENT_PID=$!
    echo $CLIENT_PID > .client.pid
    
    # Wait a moment for the service to start
    sleep 3
    
    # Check if client is running
    if check_port 5173; then
        echo -e "${GREEN}✅ Client started successfully on http://localhost:5173${NC}"
    else
        echo -e "${RED}❌ Failed to start client${NC}"
        exit 1
    fi
}

# Function to cleanup on exit
cleanup() {
    echo -e "${YELLOW}🛑 Shutting down services...${NC}"
    
    # Kill ML service
    if [ -f "$SCRIPT_DIR/ml-service/.ml_service.pid" ]; then
        ML_PID=$(cat "$SCRIPT_DIR/ml-service/.ml_service.pid")
        kill $ML_PID 2>/dev/null || true
        rm -f "$SCRIPT_DIR/ml-service/.ml_service.pid"
    fi
    
    # Kill backend
    if [ -f "$SCRIPT_DIR/backend/.backend.pid" ]; then
        BACKEND_PID=$(cat "$SCRIPT_DIR/backend/.backend.pid")
        kill $BACKEND_PID 2>/dev/null || true
        rm -f "$SCRIPT_DIR/backend/.backend.pid"
    fi
    
    # Kill client
    if [ -f "$SCRIPT_DIR/client/.client.pid" ]; then
        CLIENT_PID=$(cat "$SCRIPT_DIR/client/.client.pid")
        kill $CLIENT_PID 2>/dev/null || true
        rm -f "$SCRIPT_DIR/client/.client.pid"
    fi
    
    echo -e "${GREEN}✅ All services stopped${NC}"
    exit 0
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM

# Check if services are already running
if check_port 3000; then
    echo -e "${YELLOW}⚠️  ML Service is already running on port 3000${NC}"
else
    start_ml_service
fi

if check_port 8000; then
    echo -e "${YELLOW}⚠️  Backend is already running on port 8000${NC}"
else
    start_backend
fi

if check_port 5173; then
    echo -e "${YELLOW}⚠️  Client is already running on port 5173${NC}"
else
    start_client
fi

echo -e "${GREEN}🎉 All services started successfully!${NC}"
echo -e "${BLUE}=============================================${NC}"
echo -e "${GREEN}📊 AdminiX Dashboard: http://localhost:5173${NC}"
echo -e "${GREEN}🔧 Backend API: http://localhost:8000${NC}"
echo -e "${GREEN}🤖 ML Service: http://localhost:3000${NC}"
echo -e "${GREEN}📚 ML API Docs: http://localhost:3000/docs${NC}"
echo -e "${BLUE}=============================================${NC}"
echo -e "${YELLOW}Press Ctrl+C to stop all services${NC}"

# Keep the script running
while true; do
    sleep 1
done 