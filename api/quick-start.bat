@echo off
REM Quick Start Script - Run this first time
REM Downloads win-acme, generates certs, builds, and starts server

echo ========================================
echo   HKGD Quick Start for Windows
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

REM Get domain and email
set /p DOMAIN="Enter your domain (e.g., hkgdl.ddns.net): "
set /p EMAIL="Enter your email for Let's Encrypt: "

if "%DOMAIN%"=="" (
    echo ERROR: Domain is required!
    pause
    exit /b 1
)

if "%EMAIL%"=="" (
    echo ERROR: Email is required!
    pause
    exit /b 1
)

echo.
echo Domain: %DOMAIN%
echo Email: %EMAIL%
echo.
echo Make sure:
echo 1. DNS points to THIS computer's IP
echo 2. Port 80 is open (for certificate generation)
echo 3. Port 443 is open (for HTTPS)
echo.
pause

REM Install dependencies
echo.
echo [Step 1/5] Installing dependencies...
call npm install
if errorlevel 1 (
    echo ERROR: npm install failed!
    pause
    exit /b 1
)

REM Download win-acme if not exists
echo.
echo [Step 2/5] Setting up win-acme...
if not exist "win-acme\wacs.exe" (
    echo Downloading win-acme...
    powershell -Command "Invoke-WebRequest -Uri 'https://github.com/win-acme/win-acme/releases/download/v2.2.8.1/win-acme.v2.2.8.1635.x64.pluggable.zip' -OutFile 'win-acme.zip'"
    powershell -Command "Expand-Archive -Path 'win-acme.zip' -DestinationPath 'win-acme' -Force"
    del win-acme.zip
    echo win-acme downloaded!
) else (
    echo win-acme already exists!
)

REM Create certs folder
if not exist "certs" mkdir certs

REM Generate certificates
echo.
echo [Step 3/5] Generating SSL certificate...
echo This requires port 80 to be accessible.
echo.
cd /d "%~dp0win-acme"
wacs.exe --source manual --host %DOMAIN% --webroot "%~dp0dist" --store pemfiles --pemfilespath "%~dp0certs" --emailaddress %EMAIL% --accepttos --installation none --verbose
cd /d "%~dp0"

REM Rename cert files
if exist "certs\%DOMAIN%-crt.pem" (
    copy /Y "certs\%DOMAIN%-crt.pem" "certs\cert.pem"
    copy /Y "certs\%DOMAIN%-key.pem" "certs\key.pem"
    echo Certificates generated!
) else (
    echo WARNING: Certificate files not found. Check win-acme output.
)

REM Build frontend
echo.
echo [Step 4/5] Building frontend...
call npm run build
if errorlevel 1 (
    echo ERROR: Build failed!
    pause
    exit /b 1
)

REM Update .env
echo.
echo [Step 5/5] Updating .env file...
(
    echo SSL_KEY_PATH=%~dp0certs\key.pem
    echo SSL_CERT_PATH=%~dp0certs\cert.pem
    echo PORT=443
    echo NODE_ENV=production
) > .env

echo.
echo ========================================
echo   Setup Complete!
echo ========================================
echo.
echo Starting server...
echo.

node server.js

pause
