@echo off
REM HKGD Certificate Generation Script for Windows
REM Run this first to generate Let's Encrypt SSL certificates

echo ========================================
echo   HKGD SSL Certificate Generator
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
echo 2. Port 80 is open (required for certificate generation)
echo.
pause

REM Download win-acme if not exists
echo.
echo Setting up win-acme...
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

REM Build dist folder first (needed for webroot)
echo.
echo Building dist folder for webroot verification...
if not exist "dist" (
    echo dist folder not found. Creating placeholder...
    mkdir dist
    echo ^<html^>^<body^>HKGD^</body^>^</html^> > dist\index.html
)

REM Generate certificates
echo.
echo Generating SSL certificate...
echo This requires port 80 to be accessible from internet.
echo.
cd /d "%~dp0win-acme"
wacs.exe --source manual --host %DOMAIN% --webroot "%~dp0dist" --store pemfiles --pemfilespath "%~dp0certs" --emailaddress %EMAIL% --accepttos --installation none --verbose
cd /d "%~dp0"

REM Rename cert files
if exist "certs\%DOMAIN%-crt.pem" (
    copy /Y "certs\%DOMAIN%-crt.pem" "certs\cert.pem"
    copy /Y "certs\%DOMAIN%-key.pem" "certs\key.pem"
    echo.
    echo ========================================
    echo   Certificate generated successfully!
    echo ========================================
    echo.
    echo Certificates saved to: %~dp0certs\
    echo   - cert.pem (certificate)
    echo   - key.pem (private key)
    echo.
    echo Now run start-server.bat to start the server.
) else (
    echo.
    echo WARNING: Certificate files not found.
    echo Check the win-acme output above for errors.
)

echo.
pause
