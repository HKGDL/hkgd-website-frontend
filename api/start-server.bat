@echo off
REM HKGD Server Start Script for Windows
REM This script builds the frontend and starts the HTTPS server

echo === HKGD Server Starter ===
echo.

REM Check if dist folder exists, if not build it
if not exist "dist" (
    echo [1/2] Building frontend...
    call npm run build
    if errorlevel 1 (
        echo Build failed!
        pause
        exit /b 1
    )
) else (
    echo [1/2] Frontend already built. Skipping build.
    echo       Run "npm run build" to rebuild if needed.
)

echo.
echo [2/2] Starting HTTPS server...
echo       Server will run on https://localhost:443
echo       Or https://yourdomain.com if configured
echo.
echo Press Ctrl+C to stop the server
echo.

REM Start the server
node server.js

pause
