@echo off
echo ==========================================
echo Starting Backend Server (Port 5000)...
echo ==========================================
cd backend
if not exist "node_modules" (
    echo Installing dependencies...
    npm install
)
echo Launching Python Backend (FastAPI)...
start "DocuVerse Python Backend" cmd /k "call ..\venv\Scripts\activate && uvicorn backend.beta.main:app --reload --port 8000"

echo Launching Node.js...
node server.js
if errorlevel 1 (
    echo.
    echo ERROR: Backend crashed. Read the error above.
    echo Common reasons:
    echo 1. Keep this window OPEN.
    echo 2. Port 5000 is already in use (close other node processes).
    echo 3. MongoDB connection failed (check internet/IP whitelist).
    pause
    exit /b 1
)
pause
