@echo off
echo ================================================
echo Docker Desktop Installation Helper
echo ================================================
echo.

echo Opening Docker Desktop download page...
start https://www.docker.com/products/docker-desktop/
echo.

echo ================================================
echo INSTALLATION STEPS:
echo ================================================
echo.
echo 1. Download "Docker Desktop for Windows"
echo    (The webpage should open in your browser)
echo.
echo 2. Run the installer (Docker Desktop Installer.exe)
echo.
echo 3. IMPORTANT: During installation
echo    ✅ Enable WSL 2 (recommended)
echo    ✅ Add shortcut to desktop (optional)
echo.
echo 4. Click "Install" and wait (5-10 minutes)
echo.
echo 5. RESTART YOUR COMPUTER when prompted
echo.
echo 6. After restart, launch Docker Desktop
echo    (It will start automatically or from Start Menu)
echo.
echo 7. Wait for Docker to start fully
echo    ✅ Look for green whale icon in system tray
echo    ✅ You may need to accept Terms of Service
echo.
echo 8. Once Docker is running, come back here and run:
echo    cd D:\Desktop\AutoSRS
echo    test-integration.bat
echo.
echo ================================================
echo.

echo Alternative: Install via winget (automated)
echo.
echo If you prefer command-line installation:
echo    winget install Docker.DockerDesktop
echo.
echo Then restart your computer!
echo.
echo ================================================
echo.

pause
