@echo off
REM DocuVerse Studio - n8n Setup Script
REM This script helps you set up n8n webhooks for DocuVerse

echo ================================================
echo DocuVerse Studio - n8n Webhook Setup
echo ================================================
echo.

REM Check if Docker is installed
where docker >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Docker is not installed!
    echo.
    echo Please install Docker Desktop first:
    echo https://www.docker.com/products/docker-desktop/
    echo.
    pause
    exit /b 1
)

echo [OK] Docker is installed
echo.

REM Check if Docker is running
docker ps >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Docker is not running!
    echo.
    echo Please start Docker Desktop and try again.
    echo.
    pause
    exit /b 1
)

echo [OK] Docker is running
echo.

REM Check if .env file exists
if not exist ".env" (
    echo [WARNING] .env file not found!
    echo Creating from .env.example...
    copy .env.example .env >nul
    echo.
    echo [ACTION REQUIRED] Please edit .env file and add your API keys
    echo Then run this script again.
    echo.
    pause
    exit /b 1
)

echo [OK] .env file exists
echo.

REM Start n8n
echo Starting n8n with Docker Compose...
docker-compose up -d

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ================================================
    echo SUCCESS! n8n is now running
    echo ================================================
    echo.
    echo Access n8n at: http://localhost:5678
    echo.
    echo Next steps:
    echo 1. Open http://localhost:5678 in your browser
    echo 2. Create your n8n account
    echo 3. Import workflows from n8n_workflows/ directory
    echo 4. Update .env file:
    echo    - Set N8N_ENABLED=true
    echo    - Set N8N_WEBHOOK_SECRET to a random string
    echo 5. Restart your backend: npm run dev
    echo.
    echo For detailed instructions, see:
    echo N8N_INTEGRATION.md
    echo.
    echo To stop n8n: docker-compose down
    echo To view logs: docker-compose logs -f n8n
    echo.
) else (
    echo.
    echo [ERROR] Failed to start n8n
    echo.
    echo Please check:
    echo 1. Docker Desktop is running
    echo 2. Port 5678 is not in use
    echo 3. docker-compose.yml exists
    echo.
    echo For help, see N8N_SETUP.md
    echo.
)

pause
