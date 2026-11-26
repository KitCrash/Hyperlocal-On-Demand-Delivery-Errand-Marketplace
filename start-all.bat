@echo off
title Hyperlocal Server Launcher
echo ========================================================
echo   Starting Hyperlocal Delivery & Errand Marketplace
echo ========================================================
echo.
echo Launching Backend Server on http://localhost:5000 ...
start "Hyperlocal Backend (Port 5000)" cmd /k "cd /d "%~dp0backend" && node node_modules\tsx\dist\cli.mjs watch src/server.ts"

echo Launching Frontend Server on http://localhost:3000 ...
start "Hyperlocal Frontend (Port 3000)" cmd /k "cd /d "%~dp0frontend" && node node_modules\next\dist\bin\next dev -p 3000"

echo.
echo All servers launched in separate windows!
echo Backend:  http://localhost:5000
echo Frontend: http://localhost:3000
echo ========================================================
