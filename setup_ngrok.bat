@echo off
echo ========================================
echo n8n Public Webhook Setup with ngrok
echo ========================================
echo.

:: Check if ngrok is installed
where ngrok >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] ngrok is not installed!
    echo.
    echo Please install ngrok:
    echo 1. Visit: https://ngrok.com/download
    echo 2. Download and extract ngrok.exe
    echo 3. Add it to your PATH or place in this directory
    echo 4. Sign up at ngrok.com and run: ngrok authtoken YOUR_TOKEN
    echo.
    pause
    exit /b 1
)

echo [INFO] Starting ngrok tunnel on port 5678...
echo.
echo Your n8n webhook will be accessible at:
echo https://[random].ngrok-free.app/webhook/YOUR_PATH
echo.
echo Copy the HTTPS URL and update docker-compose.yml
echo Then restart n8n: docker-compose restart
echo.
echo Press Ctrl+C to stop the tunnel
echo.

ngrok http 5678
