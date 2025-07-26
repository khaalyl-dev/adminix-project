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
else
  echo "Backend directory not found!"
  exit 1
fi



echo "All dependencies installed successfully!"
