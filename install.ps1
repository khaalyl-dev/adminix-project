# PowerShell installer for adminix-project backend and client
# Usage: Right-click and 'Run with PowerShell' or run from terminal

$ErrorActionPreference = "Stop"

# Get script directory
$SCRIPT_DIR = Split-Path -Parent $MyInvocation.MyCommand.Definition


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


# Install backend dependencies
$backendPath = Join-Path $SCRIPT_DIR "backend"
if (Test-Path $backendPath) {
    Write-Host "Installing backend dependencies..."
    Push-Location $backendPath
    npm install
    Write-Host "Reinstalling backend dependencies..."
    Remove-Item -Recurse -Force node_modules, package-lock.json
    npm install
    Pop-Location
} else {
    Write-Host "Backend directory not found!"
    exit 1
}


Write-Host "All dependencies installed successfully!"
Write-Host "Starting backend dev server in a new terminal..."
Start-Process -WorkingDirectory $backendPath -FilePath "npm" -ArgumentList "run", "dev"

Write-Host "Starting client dev server in a new terminal..."
Start-Process -WorkingDirectory $clientPath -FilePath "npm" -ArgumentList "run", "dev"
