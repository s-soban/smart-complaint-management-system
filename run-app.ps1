$nodePath = Resolve-Path "$PSScriptRoot\node-bin\node-v20.18.0-win-x64"
if (-not (Test-Path "$nodePath\node.exe")) {
  Write-Host "Node executable not found at $nodePath. Please ensure setup-node completed."
  exit 1
}

$env:PATH = "$nodePath;$env:PATH"
Write-Host "Using Node: $(node -v)"
Write-Host "Using NPM:  $(npm -v)"

# Install backend dependencies & Seed
Write-Host "Installing backend dependencies..."
Push-Location "$PSScriptRoot\backend"
npm install
Write-Host "Seeding database with demo complaints..."
npm run seed
Pop-Location

# Install frontend dependencies
Write-Host "Installing frontend dependencies..."
Push-Location "$PSScriptRoot\frontend"
npm install
Pop-Location

Write-Host "Starting Backend and Frontend Servers..."
$backendJob = Start-Job -ScriptBlock {
  param($dir, $path)
  $env:PATH = "$path;$env:PATH"
  Set-Location $dir
  npm run dev
} -ArgumentList "$PSScriptRoot\backend", "$nodePath"

$frontendJob = Start-Job -ScriptBlock {
  param($dir, $path)
  $env:PATH = "$path;$env:PATH"
  Set-Location $dir
  npm run dev
} -ArgumentList "$PSScriptRoot\frontend", "$nodePath"

Write-Host "=========================================================="
Write-Host "🚀 Smart Complaint Management System is running!"
Write-Host "🌐 Frontend Portal: http://localhost:3000"
Write-Host "⚙️ Backend API:      http://localhost:5000/api"
Write-Host "=========================================================="
