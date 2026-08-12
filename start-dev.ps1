$nodeExe = "$PSScriptRoot\node-bin\node-v20.18.0-win-x64\node.exe"
$env:PATH = "$PSScriptRoot\node-bin\node-v20.18.0-win-x64;$env:PATH"

$backendTsNode = "`"$PSScriptRoot\backend\node_modules\ts-node\dist\bin.js`""
$backendIndex = "`"$PSScriptRoot\backend\src\index.ts`""

$frontendVite = "`"$PSScriptRoot\frontend\node_modules\vite\bin\vite.js`""

Write-Host "Starting Backend API Server on port 5000..."
Start-Process -FilePath $nodeExe -ArgumentList "$backendTsNode", "$backendIndex" -WorkingDirectory "$PSScriptRoot\backend" -NoNewWindow

Write-Host "Starting Frontend Dev Server on port 3000..."
Start-Process -FilePath $nodeExe -ArgumentList "$frontendVite" -WorkingDirectory "$PSScriptRoot\frontend" -NoNewWindow

Write-Host "Both Backend and Frontend servers launched!"
