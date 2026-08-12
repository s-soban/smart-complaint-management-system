$zipPath = "$PSScriptRoot\node.zip"
$extractPath = "$PSScriptRoot\node-bin"

Write-Host "Downloading standalone Node.js v20.18.0..."
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
Invoke-WebRequest -Uri "https://nodejs.org/dist/v20.18.0/node-v20.18.0-win-x64.zip" -OutFile $zipPath

Write-Host "Extracting Node.js package..."
Expand-Archive -Path $zipPath -DestinationPath $extractPath -Force
Remove-Item $zipPath -Force

$nodeFolder = Get-ChildItem -Path $extractPath | Select-Object -First 1
Write-Host "Node.js ready at: $($nodeFolder.FullName)"
