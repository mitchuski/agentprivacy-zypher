# Start Address Monitor
# Monitors a T-address for new transactions every 10 minutes

param(
    [Parameter(Mandatory=$true)]
    [string]$Address,
    
    [switch]$AutoImport
)

$scriptPath = Join-Path $PSScriptRoot "monitor-address-periodic.ts"
$args = @($Address)

if ($AutoImport) {
    $args += "--auto-import"
}

Write-Host "Starting address monitor..." -ForegroundColor Green
Write-Host "Address: $Address" -ForegroundColor Cyan
Write-Host "Auto-import: $($AutoImport.IsPresent)" -ForegroundColor Cyan
Write-Host ""

# Run with ts-node
npx ts-node $scriptPath $args

