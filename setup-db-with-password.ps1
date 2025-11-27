# PostgreSQL Setup Script with Password Parameters
# Usage: .\setup-db-with-password.ps1 -PostgresPassword "your_postgres_pwd" -DbPassword "your_db_pwd"

param(
    [Parameter(Mandatory=$true)]
    [string]$PostgresPassword,
    
    [Parameter(Mandatory=$true)]
    [string]$DbPassword
)

$PG_BIN = "C:\Program Files\PostgreSQL\18\bin"
$psqlPath = "$PG_BIN\psql.exe"
$DB_USER = "proverb_user"
$DB_NAME = "proverb_protocol"

Write-Host "=== PostgreSQL Database Setup ===" -ForegroundColor Cyan
Write-Host ""

# Check if psql exists
if (-not (Test-Path $psqlPath)) {
    Write-Host "ERROR: psql not found at: $psqlPath" -ForegroundColor Red
    exit 1
}

Write-Host "PostgreSQL found: $psqlPath" -ForegroundColor Green
Write-Host ""

# Set password in environment for psql
$env:PGPASSWORD = $PostgresPassword

Write-Host "Creating user and database..." -ForegroundColor Green

# Create user (ignore if exists)
$createUserCmd = "CREATE USER $DB_USER WITH PASSWORD '$DbPassword';"
& $psqlPath -U postgres -c $createUserCmd 2>&1 | Out-Null
if ($LASTEXITCODE -eq 0) {
    Write-Host "[OK] User created" -ForegroundColor Green
} else {
    Write-Host "[WARN] User might already exist (continuing...)" -ForegroundColor Yellow
}

# Create database (ignore if exists)
$createDbCmd = "CREATE DATABASE $DB_NAME OWNER $DB_USER;"
& $psqlPath -U postgres -c $createDbCmd 2>&1 | Out-Null
if ($LASTEXITCODE -eq 0) {
    Write-Host "[OK] Database created" -ForegroundColor Green
} else {
    Write-Host "[WARN] Database might already exist (continuing...)" -ForegroundColor Yellow
}

# Grant privileges
$grantCmd = "GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;"
& $psqlPath -U postgres -c $grantCmd 2>&1 | Out-Null
Write-Host "[OK] Privileges granted" -ForegroundColor Green

# Apply schema
$schemaPath = "scripts\schema.sql"
if (Test-Path $schemaPath) {
    Write-Host ""
    Write-Host "Applying database schema..." -ForegroundColor Green
    $env:PGPASSWORD = $DbPassword
    & $psqlPath -U $DB_USER -d $DB_NAME -f $schemaPath
    if ($LASTEXITCODE -eq 0) {
        Write-Host "[OK] Schema applied successfully!" -ForegroundColor Green
    } else {
        Write-Host "[WARN] Schema application had some warnings" -ForegroundColor Yellow
    }
} else {
    Write-Host "[WARN] Schema file not found: $schemaPath" -ForegroundColor Yellow
}

# Verify
Write-Host ""
Write-Host "Verifying tables..." -ForegroundColor Green
$tables = & $psqlPath -U $DB_USER -d $DB_NAME -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" 2>&1
Write-Host "Tables created: $tables" -ForegroundColor Cyan

# Clean up
$env:PGPASSWORD = $null

Write-Host ""
Write-Host "=== Setup Complete! ===" -ForegroundColor Green
Write-Host ""
Write-Host "Database connection string:" -ForegroundColor Cyan
Write-Host "DATABASE_URL=postgresql://$DB_USER`:$DbPassword@localhost:5432/$DB_NAME" -ForegroundColor White
Write-Host ""
Write-Host "Add this to oracle-swordsman/.env file" -ForegroundColor Yellow
Write-Host ""

