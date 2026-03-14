@echo off
REM HKGD Certificate Renewal Script for Windows
REM Run this script monthly to renew Let's Encrypt certificates

echo === HKGD Certificate Renewal ===
echo.

set DOMAINS=
set EMAIL=
set CERTS_PATH=%~dp0certs

REM Read domain from user
if "%DOMAINS%"=="" (
    set /p DOMAINS="Enter your domain (e.g., hkgdl.ddns.net): "
)

if "%EMAIL%"=="" (
    set /p EMAIL="Enter your email for Let's Encrypt: "
)

echo.
echo Renewing certificate for: %DOMAINS%
echo Email: %EMAIL%
echo.

cd /d "%~dp0win-acme"

wacs.exe --source manual --host %DOMAINS% --webroot "%~dp0dist" --store pemfiles --pemfilespath %CERTS_PATH% --emailaddress %EMAIL% --accepttos --installation none --verbose

cd /d "%~dp0"

REM Rename the files
if exist "%CERTS_PATH%\%DOMAINS%-crt.pem" (
    copy /Y "%CERTS_PATH%\%DOMAINS%-crt.pem" "%CERTS_PATH%\cert.pem"
    copy /Y "%CERTS_PATH%\%DOMAINS%-key.pem" "%CERTS_PATH%\key.pem"
    echo.
    echo Certificate renewed successfully!
    echo.
    echo Please restart the server to use the new certificate.
) else (
    echo.
    echo Certificate renewal may have failed. Check the output above.
)

echo.
pause
