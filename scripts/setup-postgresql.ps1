# PostgreSQL Setup Script for Windows
# Run this after PostgreSQL is installed

param(
    [string]$PG_BIN = "C:\Program Files\PostgreSQL\15\bin",
    [string]$DB_USER = "proverb_user",
    [string]$DB_PASSWORD = "",
    [string]$DB_NAME = "proverb_protocol"
)

Write-Host "=== PostgreSQL Database Setup ===" -ForegroundColor Cyan
Write-Host ""

# Check if PostgreSQL bin directory exists
if (-not (Test-Path $PG_BIN)) {
    Write-Host "PostgreSQL not found at: $PG_BIN" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Please install PostgreSQL first:" -ForegroundColor Yellow
    Write-Host "1. Download from: https://www.postgresql.org/download/windows/" -ForegroundColor Yellow
    Write-Host "2. Or use Docker: docker run --name proverb-postgres -e POSTGRES_PASSWORD=postgres -p 5432:5432 -d postgres:15" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "After installation, run this script again with:" -ForegroundColor Yellow
    Write-Host "  .\scripts\setup-postgresql.ps1 -PG_BIN 'C:\Program Files\PostgreSQL\XX\bin' -DB_PASSWORD 'your_password'" -ForegroundColor Yellow
    exit 1
}

# Check if psql exists
$psqlPath = Join-Path $PG_BIN "psql.exe"
if (-not (Test-Path $psqlPath)) {
    Write-Host "psql.exe not found at: $psqlPath" -ForegroundColor Red
    exit 1
}

# Prompt for password if not provided
if ([string]::IsNullOrEmpty($DB_PASSWORD)) {
    $securePassword = Read-Host "Enter password for database user '$DB_USER'" -AsSecureString
    $BSTR = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($securePassword)
    $DB_PASSWORD = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($BSTR)
}

if ([string]::IsNullOrEmpty($DB_PASSWORD)) {
    Write-Host "Password is required!" -ForegroundColor Red
    exit 1
}

Write-Host "Creating database user and database..." -ForegroundColor Green

# Create user
Write-Host "Creating user: $DB_USER" -ForegroundColor Yellow
$createUserCmd = "CREATE USER $DB_USER WITH PASSWORD '$DB_PASSWORD';"
& $psqlPath -U postgres -c $createUserCmd
if ($LASTEXITCODE -ne 0) {
    Write-Host "Warning: User might already exist, continuing..." -ForegroundColor Yellow
}

# Create database
Write-Host "Creating database: $DB_NAME" -ForegroundColor Yellow
$createDbCmd = "CREATE DATABASE $DB_NAME OWNER $DB_USER;"
& $psqlPath -U postgres -c $createDbCmd
if ($LASTEXITCODE -ne 0) {
    Write-Host "Warning: Database might already exist, continuing..." -ForegroundColor Yellow
}

# Grant privileges
Write-Host "Granting privileges..." -ForegroundColor Yellow
$grantCmd = "GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;"
& $psqlPath -U postgres -c $grantCmd

# Apply schema
$schemaPath = Join-Path $PSScriptRoot "schema.sql"
if (Test-Path $schemaPath) {
    Write-Host "Applying database schema..." -ForegroundColor Yellow
    & $psqlPath -U $DB_USER -d $DB_NAME -f $schemaPath
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Schema applied successfully!" -ForegroundColor Green
    } else {
        Write-Host "Warning: Schema application had errors" -ForegroundColor Yellow
    }
} else {
    Write-Host "Schema file not found: $schemaPath" -ForegroundColor Yellow
    Write-Host "Skipping schema application" -ForegroundColor Yellow
}

# Verify tables
Write-Host ""
Write-Host "Verifying database setup..." -ForegroundColor Green
$verifyCmd = "\dt"
$verifyResult = & $psqlPath -U $DB_USER -d $DB_NAME -c "SELECT tablename FROM pg_tables WHERE schemaname = 'public';"
Write-Host $verifyResult

Write-Host ""
Write-Host "=== Setup Complete! ===" -ForegroundColor Green
Write-Host ""
Write-Host "Add this to your .env file:" -ForegroundColor Cyan
Write-Host "DATABASE_URL=postgresql://$DB_USER`:$DB_PASSWORD@localhost:5432/$DB_NAME" -ForegroundColor White
Write-Host ""
Write-Host "Or use this format (escape special characters in password):" -ForegroundColor Yellow
Write-Host "DATABASE_URL=postgresql://$DB_USER`:[YOUR_PASSWORD]@localhost:5432/$DB_NAME" -ForegroundColor White
Write-Host ""

