# Hyperlocal Marketplace - PowerShell Server Launcher
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "  Starting Hyperlocal Delivery & Errand Marketplace" -ForegroundColor Green
Write-Host "========================================================" -ForegroundColor Cyan

$root = $PSScriptRoot

Write-Host "Launching Backend Server on http://localhost:5000..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$root\backend'; Write-Host 'Starting Backend (Port 5000)...' -ForegroundColor Cyan; node node_modules/tsx/dist/cli.mjs watch src/server.ts"

Write-Host "Launching Frontend Server on http://localhost:3000..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$root\frontend'; Write-Host 'Starting Frontend (Port 3000)...' -ForegroundColor Cyan; node node_modules/next/dist/bin/next dev -p 3000"

Write-Host "`nAll servers launched in separate windows!" -ForegroundColor Green
Write-Host "Backend API:  http://localhost:5000" -ForegroundColor Cyan
Write-Host "Frontend App: http://localhost:3000" -ForegroundColor Cyan
Write-Host "========================================================" -ForegroundColor Cyan
