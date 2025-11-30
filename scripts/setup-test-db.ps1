# Setup Test Database for Integration Tests
# This script sets up the test database required for integration tests

Write-Host "🔧 Setting up test database for integration tests..." -ForegroundColor Cyan
Write-Host ""

# Step 1: Start database container
Write-Host "Step 1: Starting database container..." -ForegroundColor Yellow
docker-compose -f docker-compose.dev.yml up -d db

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to start database container. Make sure Docker Desktop is running." -ForegroundColor Red
    exit 1
}

# Step 2: Wait for database to be ready
Write-Host "Step 2: Waiting for database to be ready..." -ForegroundColor Yellow
Start-Sleep -Seconds 15

# Step 3: Create test database
Write-Host "Step 3: Creating test database 'procurement_db_test'..." -ForegroundColor Yellow
$createDbResult = docker exec procurement-db-dev psql -U postgres -c "SELECT 1 FROM pg_database WHERE datname='procurement_db_test';" 2>&1

if ($createDbResult -match "procurement_db_test") {
    Write-Host "   Test database already exists, skipping creation..." -ForegroundColor Gray
} else {
    docker exec procurement-db-dev psql -U postgres -c "CREATE DATABASE procurement_db_test;" 2>&1 | Out-Null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   ✅ Test database created successfully" -ForegroundColor Green
    } else {
        Write-Host "   ⚠️  Database might already exist (this is okay)" -ForegroundColor Yellow
    }
}

# Step 4: Run migrations
Write-Host "Step 4: Running database migrations..." -ForegroundColor Yellow
$env:DATABASE_URL = "postgresql://postgres:postgres@localhost:5434/procurement_db_test?schema=public"
npx prisma migrate deploy 2>&1 | Out-Null

if ($LASTEXITCODE -eq 0) {
    Write-Host "   ✅ Migrations completed successfully" -ForegroundColor Green
} else {
    Write-Host "   ⚠️  Migration might have failed. Check the output above." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "✅ Test database setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "You can now run integration tests:" -ForegroundColor Cyan
Write-Host "  npm run test:integration" -ForegroundColor White
Write-Host ""

