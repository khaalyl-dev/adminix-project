#!/bin/bash
# Automatic installer for adminix-project backend and client

set -e

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

install_deps() {
  local dir="$1"
  if [ -d "$SCRIPT_DIR/$dir" ]; then
    echo -e "${GREEN}Installing $dir dependencies...${NC}"
    cd "$SCRIPT_DIR/$dir"
    npm install
    if [ "$dir" == "backend" ]; then
      echo -e "${GREEN}Reinstalling backend dependencies...${NC}"
      rm -rf node_modules package-lock.json
      npm install
    fi
    cd "$SCRIPT_DIR"
  else
    echo -e "${RED}$dir directory not found!${NC}"
    exit 1
  fi
}

# Install dependencies
install_deps "client"
install_deps "backend"

echo -e "${GREEN}All dependencies installed successfully!${NC}"

# Create tasks.json
mkdir -p "$SCRIPT_DIR/.vscode"

cat > "$SCRIPT_DIR/.vscode/tasks.json" <<EOL
{
  "version": "2.0.0",
  "tasks": [
    {
      "label": "Install Dependencies",
      "type": "shell",
      "command": "./setup.sh",
      "options": {
        "cwd": "${workspaceFolder}"
      },
      "problemMatcher": [],
      "group": "build",
      "presentation": {
        "reveal": "always",
        "panel": "dedicated"
      }
    },
    {
      "label": "Start Backend",
      "type": "shell",
      "command": "npm run dev",
      "options": {
        "cwd": "${workspaceFolder}/backend"
      },
      "problemMatcher": [],
      "group": "build",
      "presentation": {
        "reveal": "always",
        "panel": "shared"
      }
    },
    {
      "label": "Start Client",
      "type": "shell",
      "command": "npm run dev",
      "options": {
        "cwd": "${workspaceFolder}/client"
      },
      "problemMatcher": [],
      "group": "build",
      "presentation": {
        "reveal": "always",
        "panel": "new"
      }
    },
    {
      "label": "Run Adminix Project",
      "dependsOn": [
        "Install Dependencies",
        "Start Backend",
        "Start Client"
      ],
      "dependsOrder": "sequence"
    }
  ]
}
EOL

cat > "$SCRIPT_DIR/.vscode/settings.json" <<EOL
{
  "task.runOnOpen": "Run Adminix Project"
}
EOL

echo -e "${GREEN}.vscode/tasks.json created!${NC}"
echo -e "${GREEN}To run the full setup, open VS Code and run: Tasks: Run Task → Run Adminix Project${NC}"
