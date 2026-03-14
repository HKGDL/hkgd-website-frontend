@echo off
REM HKGD Server Start Script for Windows
REM Run this to start the HTTPS server

echo ========================================
echo   HKGD Server
echo ========================================
echo.

REM Check for Node.js
node --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Node.js is not installed!
    echo Please install Node.js LTS from https://nodejs.org/
    pause
    exit /b 1
)

REM Check for certificates
if not exist "certs\cert.pem" (
    echo ERROR: SSL certificate not found!
    echo Please run generate-cert.bat first to generate certificates.
    echo.
    pause
    exit /b 1
)

if not exist "certs\key.pem" (
    echo ERROR: SSL private key not found!
    echo Please run generate-cert.bat first to generate certificates.
    echo.
    pause
    exit /b 1
)

REM Check for dist folder
if not exist "dist" (
    echo [1/2] Building frontend...
    call npm run build
    if errorlevel 1 (
        echo Build failed!
        pause
        exit /b 1
    )
) else (
    echo [1/2] Frontend ready.
)

REM Install dependencies if needed
if not exist "node_modules" (
    echo Installing dependencies...
    call npm install
    if errorlevel 1 (
        echo npm install failed!
        pause
        exit /b 1
    )
)

REM Update .env with cert paths
echo.
echo [2/2] Configuring environment...
(
    echo SSL_KEY_PATH=%~dp0certs\key.pem
    echo SSL_CERT_PATH=%~dp0certs\cert.pem
    echo PORT=443
    echo NODE_ENV=production
) > .env

echo.
echo ========================================
echo   Starting HTTPS Server
echo ========================================
echo.
echo Server will run on:
echo   - https://localhost:443
echo   - https://yourdomain.com (if DNS configured)
echo.
echo Press Ctrl+C to stop the server
echo.

node server.js

pause
