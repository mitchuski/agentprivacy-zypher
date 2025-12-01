# Format spellbook addresses from zecwallet-cli export
# This script helps format the exported addresses into the address file format

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Format Spellbook Addresses" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "This script helps format addresses from zecwallet-cli export." -ForegroundColor White
Write-Host ""
Write-Host "After generating addresses with zecwallet-cli:" -ForegroundColor Yellow
Write-Host "  1. Run 'export' in zecwallet-cli" -ForegroundColor Gray
Write-Host "  2. Copy the mnemonic and addresses" -ForegroundColor Gray
Write-Host "  3. Update zcash-addresses-controlled.json" -ForegroundColor Gray
Write-Host ""

Write-Host "Address Mapping:" -ForegroundColor Cyan
Write-Host ""
Write-Host "  Story Spellbook (12 acts):" -ForegroundColor White
Write-Host "    Act 1:  z-address[0], t-address[0]" -ForegroundColor Gray
Write-Host "    Act 2:  z-address[1], t-address[1]" -ForegroundColor Gray
Write-Host "    ..." -ForegroundColor Gray
Write-Host "    Act 12: z-address[11], t-address[11]" -ForegroundColor Gray
Write-Host ""
Write-Host "  Zero Knowledge Spellbook (6 addresses):" -ForegroundColor White
Write-Host "    Address 1: z-address[12], t-address[12]" -ForegroundColor Gray
Write-Host "    Address 2: z-address[13], t-address[13]" -ForegroundColor Gray
Write-Host "    ..." -ForegroundColor Gray
Write-Host "    Address 6: z-address[17], t-address[17]" -ForegroundColor Gray
Write-Host ""

Write-Host "The addresses will be added to zcash-addresses-controlled.json" -ForegroundColor Yellow
Write-Host "with labels indicating which spellbook and act they belong to." -ForegroundColor Yellow
Write-Host ""

