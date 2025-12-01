# Quick script to get wallet address list
# This creates a temporary script file that zecwallet-cli can execute

Write-Host "Connecting to zecwallet-cli to get address list..." -ForegroundColor Yellow
Write-Host ""

# Create a temporary command file
$cmdFile = "$env:TEMP\zecwallet-list-commands.txt"
@"
list
exit
"@ | Out-File -FilePath $cmdFile -Encoding ASCII

# Try to run zecwallet-cli with commands piped
try {
    $output = Get-Content $cmdFile | & zecwallet-cli --server http://127.0.0.1:9067 2>&1
    
    if ($LASTEXITCODE -eq 0 -or $output) {
        Write-Host "Address List:" -ForegroundColor Green
        Write-Host $output
    } else {
        Write-Host "Could not get address list. Try running manually:" -ForegroundColor Yellow
        Write-Host "  zecwallet-cli --server http://127.0.0.1:9067" -ForegroundColor Gray
        Write-Host "  Then type: list" -ForegroundColor Gray
    }
} catch {
    Write-Host "Error connecting to zecwallet-cli:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    Write-Host ""
    Write-Host "Make sure:" -ForegroundColor Yellow
    Write-Host "  1. lightwalletd is running and synced" -ForegroundColor White
    Write-Host "  2. Wait a few more seconds for lightwalletd to sync" -ForegroundColor White
    Write-Host "  3. Try running zecwallet-cli manually in a terminal" -ForegroundColor White
}

# Cleanup
Remove-Item $cmdFile -ErrorAction SilentlyContinue


