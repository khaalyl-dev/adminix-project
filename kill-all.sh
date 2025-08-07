#!/bin/bash
# Kill all processes that might be using our ports

set -e

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🛑 Killing all processes on our ports...${NC}"
echo -e "${BLUE}=========================================${NC}"

# Function to kill processes on a port
kill_port() {
    local port=$1
    local service_name=$2
    
    echo -e "${YELLOW}Checking port $port for $service_name...${NC}"
    
    # Find PIDs using the port
    pids=$(lsof -ti :$port 2>/dev/null)
    
    if [ -n "$pids" ]; then
        echo -e "${YELLOW}Found processes on port $port: $pids${NC}"
        for pid in $pids; do
            echo -e "${YELLOW}Killing process $pid on port $port...${NC}"
            kill -9 $pid 2>/dev/null || true
        done
        echo -e "${GREEN}✅ Killed all processes on port $port${NC}"
    else
        echo -e "${GREEN}✅ No processes found on port $port${NC}"
    fi
}

# Kill processes on our target ports
kill_port 3000 "ML Service"
kill_port 8000 "Backend"
kill_port 6000 "Backend (Alternative)"
kill_port 5173 "Client"

# Kill any Python processes that might be our ML service
echo -e "${YELLOW}Checking for Python processes...${NC}"
python_pids=$(ps aux | grep python | grep -v grep | awk '{print $2}' 2>/dev/null || true)

if [ -n "$python_pids" ]; then
    echo -e "${YELLOW}Found Python processes: $python_pids${NC}"
    for pid in $python_pids; do
        # Check if it's our ML service
        if ps -p $pid -o command= | grep -q "api:app\|start.py"; then
            echo -e "${YELLOW}Killing ML service process $pid...${NC}"
            kill -9 $pid 2>/dev/null || true
        fi
    done
fi

# Kill any Node.js processes that might be our backend/client
echo -e "${YELLOW}Checking for Node.js processes...${NC}"
node_pids=$(ps aux | grep node | grep -v grep | awk '{print $2}' 2>/dev/null || true)

if [ -n "$node_pids" ]; then
    echo -e "${YELLOW}Found Node.js processes: $node_pids${NC}"
    for pid in $node_pids; do
        # Check if it's our backend or client
        if ps -p $pid -o command= | grep -q "npm\|vite\|express"; then
            echo -e "${YELLOW}Killing Node.js process $pid...${NC}"
            kill -9 $pid 2>/dev/null || true
        fi
    done
fi

# Clean up PID files
echo -e "${YELLOW}Cleaning up PID files...${NC}"
rm -f ml-service/.ml_service.pid 2>/dev/null || true
rm -f backend/.backend.pid 2>/dev/null || true
rm -f client/.client.pid 2>/dev/null || true

# Wait a moment for processes to fully terminate
sleep 2

# Final check
echo -e "${BLUE}Final status check:${NC}"
echo -e "Port 3000 (ML Service): $(lsof -i :3000 2>/dev/null | wc -l || echo 0) processes"
echo -e "Port 8000 (Backend): $(lsof -i :8000 2>/dev/null | wc -l || echo 0) processes"
echo -e "Port 6000 (Backend Alt): $(lsof -i :6000 2>/dev/null | wc -l || echo 0) processes"
echo -e "Port 5173 (Client): $(lsof -i :5173 2>/dev/null | wc -l || echo 0) processes"

echo -e "${GREEN}✅ All processes killed!${NC}"
echo -e "${BLUE}You can now run './start-all.sh' to start fresh${NC}" 