# Prisma Studio Helper Script for Windows PowerShell

Write-Host "==================================" -ForegroundColor Cyan
Write-Host "  Prisma Studio Launcher" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""

# Check if .env file exists
if (-not (Test-Path ".env")) {
    Write-Host "ERROR: .env file not found!" -ForegroundColor Red
    Write-Host "Please create a .env file with your DATABASE_URL" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Example:" -ForegroundColor Yellow
    Write-Host 'DATABASE_URL="postgresql://user:pass@host.neon.tech/db?sslmode=require"' -ForegroundColor Gray
    exit 1
}

Write-Host "Starting Prisma Studio..." -ForegroundColor Green
Write-Host ""
Write-Host "Prisma Studio will open at: http://localhost:5555" -ForegroundColor Yellow
Write-Host "Press Ctrl+C to stop" -ForegroundColor Yellow
Write-Host ""

# Run Prisma Studio
npx prisma studio

