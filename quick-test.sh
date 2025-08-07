#!/bin/bash
# Quick test script for AI integration

set -e

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🧪 Quick AI Integration Test${NC}"
echo -e "${BLUE}===========================${NC}"

# Function to check if a service is running
check_service() {
    local service_name=$1
    local port=$2
    local url=$3
    
    echo -e "${YELLOW}Checking $service_name on port $port...${NC}"
    
    if curl -s "$url" > /dev/null 2>&1; then
        echo -e "${GREEN}✅ $service_name is running on port $port${NC}"
        return 0
    else
        echo -e "${RED}❌ $service_name is not running on port $port${NC}"
        return 1
    fi
}

# Function to test API endpoint
test_api() {
    local endpoint=$1
    local data=$2
    local description=$3
    
    echo -e "${YELLOW}Testing $description...${NC}"
    
    if [ -n "$data" ]; then
        response=$(curl -s -X POST "http://localhost:3000$endpoint" \
            -H "Content-Type: application/json" \
            -d "$data" 2>/dev/null)
    else
        response=$(curl -s "http://localhost:3000$endpoint" 2>/dev/null)
    fi
    
    if [ $? -eq 0 ] && [ -n "$response" ]; then
        echo -e "${GREEN}✅ $description successful${NC}"
        echo -e "${BLUE}Response: $response${NC}"
        return 0
    else
        echo -e "${RED}❌ $description failed${NC}"
        return 1
    fi
}

# Check if services are running
echo -e "${BLUE}Step 1: Checking services...${NC}"

ml_running=false
backend_running=false
client_running=false

if check_service "ML Service" 3000 "http://localhost:3000/health"; then
    ml_running=true
fi

if check_service "Backend" 8000 "http://localhost:8000/api/health"; then
    backend_running=true
fi

if check_service "Client" 5173 "http://localhost:5173"; then
    client_running=true
fi

# If ML service is not running, try to start it
if [ "$ml_running" = false ]; then
    echo -e "${YELLOW}ML Service not running. Attempting to start it...${NC}"
    
    if [ -d "ml-service" ]; then
        cd ml-service
        
        # Check if virtual environment exists
        if [ ! -d "venv" ]; then
            echo -e "${YELLOW}Creating virtual environment...${NC}"
            python3 -m venv venv
        fi
        
        # Activate virtual environment and install dependencies
        echo -e "${YELLOW}Installing dependencies...${NC}"
        source venv/bin/activate
        pip install -r requirements.txt > /dev/null 2>&1
        
        # Start ML service in background
        echo -e "${YELLOW}Starting ML service...${NC}"
        python start.py > /dev/null 2>&1 &
        ML_PID=$!
        
        # Wait for service to start
        sleep 5
        
        # Check if it's running now
        if check_service "ML Service" 8000 "http://localhost:8000/health"; then
            ml_running=true
            echo $ML_PID > .ml_service.pid
        fi
        
        cd ..
    else
        echo -e "${RED}ML service directory not found!${NC}"
    fi
fi

# Test API endpoints if ML service is running
if [ "$ml_running" = true ]; then
    echo -e "${BLUE}Step 2: Testing API endpoints...${NC}"
    
    # Test health endpoint
    test_api "/health" "" "Health check"
    
    # Test task prediction
    test_api "/predict/task" '{"task_text": "Create a simple contact form"}' "Task prediction"
    
    # Test sprint planning
    test_api "/predict/project/sprints" '{
        "project_title": "Test Project",
        "project_description": "A simple test project for validation",
        "sprint_capacity": 40,
        "max_sprints": 3
    }' "Sprint planning"
    
    # Test project analysis
    test_api "/predict/project" '{
        "project_title": "Test Mobile App",
        "project_description": "A simple mobile application",
        "max_workers_per_task": 2
    }' "Project analysis"
    
else
    echo -e "${RED}❌ Cannot test API endpoints - ML service is not running${NC}"
fi

# Summary
echo -e "${BLUE}Step 3: Test Summary${NC}"
echo -e "${BLUE}===================${NC}"

echo -e "Services Status:"
echo -e "  ML Service (Port 3000): $([ "$ml_running" = true ] && echo "✅ Running" || echo "❌ Not Running")"
echo -e "  Backend (Port 8000): $([ "$backend_running" = true ] && echo "✅ Running" || echo "❌ Not Running")"
echo -e "  Client (Port 5173): $([ "$client_running" = true ] && echo "✅ Running" || echo "❌ Not Running")"

echo -e ""
echo -e "${BLUE}Next Steps:${NC}"
echo -e "1. If all services are running, open http://localhost:5173"
echo -e "2. Login to AdminiX and navigate to any project"
echo -e "3. Go to the Analytics tab to test the AI features"
echo -e "4. Try the Task Prediction, Sprint Planning, and Project Analysis tabs"

if [ "$ml_running" = true ] && [ "$client_running" = true ]; then
    echo -e ""
    echo -e "${GREEN}🎉 AI Integration is ready for testing!${NC}"
    echo -e "${GREEN}Open http://localhost:5173 to access the AdminiX dashboard${NC}"
else
    echo -e ""
    echo -e "${RED}⚠️  Some services are not running. Please check the setup.${NC}"
    echo -e "${YELLOW}Run './start-all.sh' to start all services${NC}"
fi

# Cleanup
if [ -n "$ML_PID" ]; then
    echo -e "${YELLOW}Note: ML service was started in background (PID: $ML_PID)${NC}"
    echo -e "${YELLOW}To stop it later: kill $ML_PID${NC}"
fi 