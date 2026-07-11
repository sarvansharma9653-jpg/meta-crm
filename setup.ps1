# setup.ps1
# This script downloads portable Node.js for Windows (x64) and extracts it locally.

$ErrorActionPreference = "Stop"

$nodeVersion = "v22.13.0"
$zipUrl = "https://nodejs.org/dist/$nodeVersion/node-$nodeVersion-win-x64.zip"
$zipPath = Join-Path $PSScriptRoot "node.zip"
$tempExtractPath = Join-Path $PSScriptRoot "node-temp"
$finalNodePath = Join-Path $PSScriptRoot "node"

# 1. Download Node.js zip if not already downloaded
if (Test-Path $finalNodePath) {
    Write-Host "Node.js directory already exists. Skipping download." -ForegroundColor Green
} else {
    Write-Host "Downloading portable Node.js $nodeVersion from $zipUrl..." -ForegroundColor Cyan
    [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
    Invoke-WebRequest -Uri $zipUrl -OutFile $zipPath -UseBasicParsing

    Write-Host "Extracting Node.js package..." -ForegroundColor Cyan
    if (Test-Path $tempExtractPath) {
        Remove-Item -Path $tempExtractPath -Recurse -Force
    }
    Expand-Archive -Path $zipPath -DestinationPath $tempExtractPath

    Write-Host "Configuring local directories..." -ForegroundColor Cyan
    $extractedFolder = Join-Path $tempExtractPath "node-$nodeVersion-win-x64"
    Move-Item -Path $extractedFolder -Destination $finalNodePath

    Write-Host "Cleaning up temporary files..." -ForegroundColor Cyan
    Remove-Item -Path $zipPath -Force
    Remove-Item -Path $tempExtractPath -Recurse -Force
    Write-Host "Node.js setup completed successfully!" -ForegroundColor Green
}

# Verify node can execute
$localNodeExe = Join-Path $finalNodePath "node.exe"
if (Test-Path $localNodeExe) {
    $versionOutput = & $localNodeExe -v
    Write-Host "Verified portable Node.js: $versionOutput" -ForegroundColor Green
} else {
    throw "Verification failed. node.exe not found at $localNodeExe"
}
