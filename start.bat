@echo off
title MetaCRM Startup Console
echo ==========================================
echo   MetaCRM System Local Launch Console
echo ==========================================
echo.
echo Adding portable Node.js to PATH environment...
SET PATH=%~dp0node;%PATH%
echo Verified Node version:
node -v
echo.
echo Launching Backend server (Port 5000)...
start cmd /k "title MetaCRM Backend && cd backend && node server.js"
echo.
echo Launching Frontend client (Vite Dev Server)...
start cmd /k "title MetaCRM Frontend && cd frontend && npm run dev"
echo.
echo ==========================================
echo   Both servers launched successfully!
echo   - Backend API: http://localhost:5000
echo   - Webhook endpoint: http://localhost:5000/api/webhook/facebook
echo   - Frontend Panel: check the terminal output for the Vite dev port (usually http://localhost:5173)
echo ==========================================
pause
