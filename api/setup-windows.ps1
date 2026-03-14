# HKGD Setup Script for Windows
# Run this script as Administrator

param(
    [string]$Domain = "",
    [string]$Email = ""
)

Write-Host "=== HKGD Windows Setup Script ===" -ForegroundColor Cyan

# Check if running as Administrator
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Host "ERROR: Please run this script as Administrator!" -ForegroundColor Red
    exit 1
}

# Check parameters
if ($Domain -eq "" -or $Email -eq "") {
    Write-Host "Usage: .\setup-windows.ps1 -Domain yourdomain.com -Email your@email.com" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Example: .\setup-windows.ps1 -Domain hkgdl.ddns.net -Email admin@example.com" -ForegroundColor Yellow
    exit 1
}

# Check if Node.js is installed
Write-Host "`n[1/5] Checking Node.js..." -ForegroundColor Yellow
$nodeVersion = node --version 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "Node.js is not installed. Installing via winget..." -ForegroundColor Yellow
    winget install OpenJS.NodeJS.LTS --accept-source-agreements --accept-package-agreements
    Write-Host "Node.js installed. Please restart PowerShell and run this script again." -ForegroundColor Green
    exit 0
}
Write-Host "Node.js version: $nodeVersion" -ForegroundColor Green

# Check if npm is installed
Write-Host "`n[2/5] Checking npm..." -ForegroundColor Yellow
$npmVersion = npm --version 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "npm is not installed properly!" -ForegroundColor Red
    exit 1
}
Write-Host "npm version: $npmVersion" -ForegroundColor Green

# Install project dependencies
Write-Host "`n[3/5] Installing project dependencies..." -ForegroundColor Yellow
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "Failed to install npm dependencies!" -ForegroundColor Red
    exit 1
}
Write-Host "Dependencies installed successfully!" -ForegroundColor Green

# Download and setup win-acme for Let's Encrypt certificates
Write-Host "`n[4/5] Setting up win-acme for SSL certificates..." -ForegroundColor Yellow
$wacsPath = "$PSScriptRoot\win-acme"
$wacsExe = "$wacsPath\wacs.exe"

if (-not (Test-Path $wacsExe)) {
    Write-Host "Downloading win-acme..." -ForegroundColor Yellow
    $wacsUrl = "https://github.com/win-acme/win-acme/releases/download/v2.2.8.1/win-acme.v2.2.8.1635.x64.pluggable.zip"
    $zipPath = "$PSScriptRoot\win-acme.zip"
    
    # Download
    Invoke-WebRequest -Uri $wacsUrl -OutFile $zipPath -UseBasicParsing
    
    # Extract
    Expand-Archive -Path $zipPath -DestinationPath $wacsPath -Force
    Remove-Item $zipPath
    
    Write-Host "win-acme downloaded and extracted!" -ForegroundColor Green
} else {
    Write-Host "win-acme already exists!" -ForegroundColor Green
}

# Create certs directory
$certsPath = "$PSScriptRoot\certs"
if (-not (Test-Path $certsPath)) {
    New-Item -ItemType Directory -Path $certsPath | Out-Null
}

# Generate certificates using win-acme
Write-Host "`n[5/5] Generating SSL certificate for $Domain..." -ForegroundColor Yellow
Write-Host "NOTE: Make sure port 80 is accessible and DNS points to this PC!" -ForegroundColor Cyan

# Run win-acme to generate certificate
$wacsArgs = @(
    "--source", "manual",
    "--host", $Domain,
    "--webroot", "$PSScriptRoot\dist",
    "--store", "pemfiles",
    "--pemfilespath", $certsPath,
    "--emailaddress", $Email,
    "--accepttos",
    "--installation", "none",
    "--verbose"
)

Push-Location $wacsPath
& ".\wacs.exe" @wacsArgs
Pop-Location

# Rename cert files to match expected names
$pemFiles = Get-ChildItem -Path $certsPath -Filter "*.pem" -ErrorAction SilentlyContinue
if ($pemFiles) {
    # win-acme creates files like domain-crt.pem, domain-key.pem, etc.
    $crtFile = $pemFiles | Where-Object { $_.Name -like "*-crt.pem" } | Select-Object -First 1
    $keyFile = $pemFiles | Where-Object { $_.Name -like "*-key.pem" } | Select-Object -First 1
    $chainFile = $pemFiles | Where-Object { $_.Name -like "*-chain.pem" } | Select-Object -First 1
    
    if ($crtFile) { Rename-Item $crtFile.FullName "cert.pem" -Force }
    if ($keyFile) { Rename-Item $keyFile.FullName "key.pem" -Force }
    if ($chainFile) { Rename-Item $chainFile.FullName "chain.pem" -Force }
    
    Write-Host "Certificates generated successfully!" -ForegroundColor Green
} else {
    Write-Host "Certificate generation may have failed. Check the output above." -ForegroundColor Yellow
}

# Update .env file
Write-Host "`nUpdating .env file..." -ForegroundColor Yellow
$envContent = @"
SSL_KEY_PATH=$certsPath\key.pem
SSL_CERT_PATH=$certsPath\cert.pem
PORT=443
NODE_ENV=production
"@

# Check if .env exists and update it
if (Test-Path "$PSScriptRoot\.env") {
    $currentEnv = Get-Content "$PSScriptRoot\.env" -Raw
    # Update SSL paths
    if ($currentEnv -match "SSL_KEY_PATH") {
        $currentEnv = $currentEnv -replace "SSL_KEY_PATH=.*", "SSL_KEY_PATH=$certsPath\key.pem"
    } else {
        $currentEnv += "`nSSL_KEY_PATH=$certsPath\key.pem"
    }
    if ($currentEnv -match "SSL_CERT_PATH") {
        $currentEnv = $currentEnv -replace "SSL_CERT_PATH=.*", "SSL_CERT_PATH=$certsPath\cert.pem"
    } else {
        $currentEnv += "`nSSL_CERT_PATH=$certsPath\cert.pem"
    }
    $currentEnv | Set-Content "$PSScriptRoot\.env"
} else {
    $envContent | Set-Content "$PSScriptRoot\.env"
}
Write-Host ".env file updated!" -ForegroundColor Green

# Build the frontend
Write-Host "`nBuilding frontend..." -ForegroundColor Yellow
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "Build failed!" -ForegroundColor Red
    exit 1
}
Write-Host "Frontend built successfully!" -ForegroundColor Green

Write-Host "`n=== Setup Complete! ===" -ForegroundColor Green
Write-Host "To start the server, run: .\start-server.bat" -ForegroundColor Cyan
Write-Host "Or manually: npm run server" -ForegroundColor Cyan
