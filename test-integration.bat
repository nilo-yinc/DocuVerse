@echo off
echo ================================================
echo n8n Integration Testing Guide
echo ================================================
echo.

echo [STEP 1] Check Docker Status
echo ================================================
docker --version >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Docker is NOT installed
    echo.
    echo To test the full integration:
    echo 1. Install Docker Desktop: https://docker.com/products/docker-desktop
    echo 2. Restart your computer
    echo 3. Run this test again
    echo.
    echo OR test backend only (without Docker):
    echo    cd backend
    echo    node ..\test-n8n-integration.js
    echo.
    goto :end
) else (
    echo ✅ Docker is installed
)
echo.

echo [STEP 2] Check if Docker is Running
echo ================================================
docker ps >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Docker is NOT running
    echo.
    echo Please start Docker Desktop and try again
    echo.
    goto :end
) else (
    echo ✅ Docker is running
)
echo.

echo [STEP 3] Check if n8n Container Exists
echo ================================================
docker ps -a --filter "name=n8n" --format "{{.Names}}" | findstr "n8n" >nul
if %ERRORLEVEL% NEQ 0 (
    echo ⚠️  n8n container not found
    echo.
    echo Starting n8n with docker-compose...
    docker-compose up -d
    echo.
    echo ⏳ Waiting for n8n to start (10 seconds)...
    timeout /t 10 /nobreak >nul
    echo.
) else (
    echo ✅ n8n container exists
    
    docker ps --filter "name=n8n" --format "{{.Status}}" | findstr "Up" >nul
    if %ERRORLEVEL% NEQ 0 (
        echo ⚠️  n8n container stopped, starting...
        docker-compose start n8n
        timeout /t 5 /nobreak >nul
    ) else (
        echo ✅ n8n is running
    )
)
echo.

echo [STEP 4] Test n8n Web Interface
echo ================================================
echo Opening n8n dashboard...
start http://localhost:5678
echo.
echo ✅ If browser opened, n8n is accessible!
echo.

echo [STEP 5] Check Backend Configuration
echo ================================================
type .env | findstr "N8N_"
echo.

echo [STEP 6] Test Backend Connection (Optional)
echo ================================================
echo To test backend webhook service:
echo   cd backend
echo   node ..\test-n8n-integration.js
echo.

echo [STEP 7] Next Steps
echo ================================================
echo 1. ✅ n8n should be open in browser (http://localhost:5678)
echo 2. 📥 Create n8n account (if first time)
echo 3. 📥 Import workflows from: n8n_workflows\
echo 4. ⚡ Activate all workflows
echo 5. 🚀 Start backend: cd backend ^&^& npm run dev
echo 6. 🧪 Generate an SRS to test webhooks!
echo.

:end
pause
