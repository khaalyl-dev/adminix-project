#!/bin/bash
# Automatic installer for adminix-project backend and client

set -e

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Install client dependencies
if [ -d "$SCRIPT_DIR/client" ]; then
  echo "Installing client dependencies..."
  cd "$SCRIPT_DIR/client"
  npm install
else
  echo "Client directory not found!"
  exit 1
fi

# Install backend dependencies
if [ -d "$SCRIPT_DIR/backend" ]; then
  echo "Installing backend dependencies..."
  cd "$SCRIPT_DIR/backend"
  npm install
  echo "Reinstalling backend dependencies..."
  rm -rf node_modules package-lock.json
  npm install
else
  echo "Backend directory not found!"
  exit 1
fi



echo "All dependencies installed successfully!"
echo "Starting backend dev server in a new terminal..."
(cd "$SCRIPT_DIR/backend" && nohup npm run dev > backend-dev.log 2>&1 &)

echo "Starting client dev server in a new terminal..."
(cd "$SCRIPT_DIR/client" && nohup npm run dev > client-dev.log 2>&1 &)
