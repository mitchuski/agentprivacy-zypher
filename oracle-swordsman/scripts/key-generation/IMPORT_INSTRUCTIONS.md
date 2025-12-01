# Import zecwallet-cli Export Instructions

## Quick Import

You've generated all 36 addresses (18 z-addresses + 18 t-addresses). Now import them:

### Step 1: Save Export to File

Copy the export JSON from zecwallet-cli and save it to:
```
oracle-swordsman/scripts/key-generation/export.json
```

The export should be a JSON array starting with `[` and containing objects with:
- `address` (zs1... or t1...)
- `private_key` (for z-addresses: secret-extended-key..., for t-addresses: Kx...)
- `viewing_key` (for z-addresses only: zxviews...)

### Step 2: Run Import Script

```powershell
cd oracle-swordsman
.\scripts\key-generation\parse-zecwallet-export.ps1 -ExportFile scripts\key-generation\export.json
```

### Step 3: Verify

Check `zcash-addresses-controlled.json` - it should now have:
- 12 z-addresses + 12 t-addresses for Story Spellbook (Acts 1-12)
- 6 z-addresses + 6 t-addresses for Zero Knowledge Spellbook
- Total: 36 addresses with proper labels

---

## Alternative: Interactive Mode

If you prefer to paste directly:

```powershell
.\scripts\key-generation\parse-zecwallet-export.ps1 -Interactive
```

Then paste the export JSON when prompted (press Enter twice when done).

---

## Address Mapping

The script will automatically map:

**Story Spellbook (12 acts):**
- Act 1: z-address[0], t-address[0]
- Act 2: z-address[1], t-address[1]
- ...
- Act 12: z-address[11], t-address[11]

**Zero Knowledge Spellbook (6 addresses):**
- Address 1: z-address[12], t-address[12]
- Address 2: z-address[13], t-address[13]
- ...
- Address 6: z-address[17], t-address[17]

---

## After Import

1. **Update mnemonic** (if you have it from export)
2. **Restart Oracle service** (if running)
3. **Check wallet interface:** http://localhost:3000/wallet
4. **Verify addresses appear** with correct labels

---

**Ready to import!** Save your export JSON and run the script.

