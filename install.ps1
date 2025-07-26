# PowerShell installer for adminix-project backend and client
# Usage: Right-click and 'Run with PowerShell' or run from terminal

$ErrorActionPreference = "Stop"

# Get script directory
$SCRIPT_DIR = Split-Path -Parent $MyInvocation.MyCommand.Definition

# Install backend dependencies
$backendPath = Join-Path $SCRIPT_DIR "backend"
if (Test-Path $backendPath) {
    Write-Host "Installing backend dependencies..."
    Push-Location $backendPath
    npm install
    Pop-Location
} else {
    Write-Host "Backend directory not found!"
    exit 1
}

# Install client dependencies
 $clientPath = Join-Path $SCRIPT_DIR "client"
if (Test-Path $clientPath) {
    Write-Host "Installing client dependencies..."
    Push-Location $clientPath
    npm install
    Pop-Location
} else {
    Write-Host "Client directory not found!"
    exit 1
}

Write-Host "All dependencies installed successfully!"
