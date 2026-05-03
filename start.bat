@echo off
REM DocuVerse Quick Start Script for Windows

echo ========================================
echo DocuVerse Quick Start
echo ========================================
echo.

REM Check if virtual environment exists
if not exist "venv\" (
    echo Creating virtual environment...
    python -m venv venv
    if errorlevel 1 (
        echo ERROR: Failed to create virtual environment
        pause
        exit /b 1
    )
    echo Virtual environment created!
    echo.
)

REM Activate virtual environment
echo Activating virtual environment...
call venv\Scripts\activate
if errorlevel 1 (
    echo ERROR: Failed to activate virtual environment
    pause
    exit /b 1
)

REM Check if dependencies are installed
pip show fastapi >nul 2>&1
if errorlevel 1 (
    echo Installing Python dependencies...
    pip install -r requirements.txt
    if errorlevel 1 (
        echo ERROR: Failed to install dependencies
        pause
        exit /b 1
    )
    echo Dependencies installed!
    echo.
)

REM Check if .env exists
if not exist ".env" (
    echo WARNING: .env file not found!
    echo Please copy .env.example to .env and add your API keys
    echo.
    pause
    exit /b 1
)

REM Mermaid CLI optional when TEXT_ONLY=1 in .env
where mmdc >nul 2>&1
if errorlevel 1 (
    echo NOTE: Mermaid CLI not found. OK if TEXT_ONLY=1 in .env (text-only mode).
    echo.
)

echo ========================================
echo Starting DocuVerse server...
echo ========================================
echo Server will be available at: http://127.0.0.1:8000
echo Press Ctrl+C to stop the server
echo.

start "DocuVerse Node Backend" cmd /k "echo Starting Backend... && cd backend && npm install && node server.js || echo BACKEND FAILED - CHECK ERROR ABOVE"

uvicorn backend.beta.main:app --reload

pause
