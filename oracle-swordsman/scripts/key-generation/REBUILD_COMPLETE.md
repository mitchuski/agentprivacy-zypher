# Complete Address File Rebuild Guide

## ✅ Security Status

**All private keys have been removed from files:**
- ✅ `zcash-addresses-controlled.json` - Private keys removed
- ✅ `export.json` - Deleted (contained private keys)
- ✅ Mnemonic removed from address file
- ✅ No private keys in any tracked files

## 🔄 Rebuild Address File with All 36 Addresses

You've generated all 36 addresses (18 z-addresses + 18 t-addresses). Now rebuild the address file with proper act mappings:

### Step 1: Save Export JSON

Copy the complete export JSON from zecwallet-cli and save it to:
```
oracle-swordsman/scripts/key-generation/export.json
```

The export should be a JSON array with all 36 addresses.

### Step 2: Run Rebuild Script

```powershell
cd oracle-swordsman
.\scripts\key-generation\rebuild-address-file-complete.ps1 -ExportFile scripts\key-generation\export.json
```

### Step 3: Verify

The script will:
- ✅ Parse all 36 addresses from export
- ✅ Map z-addresses to Story Spellbook Acts 1-12 (for receiving donations)
- ✅ Map t-addresses to Story Spellbook Acts 1-12 (for tracking inscriptions)
- ✅ Map 6 z-addresses + 6 t-addresses to Zero Knowledge Spellbook
- ✅ Remove all private keys (secure)
- ✅ Add act_id, act_number, act_title for frontend integration
- ✅ Add purpose labels (receive_donations / track_inscriptions)

## 🎨 Frontend Integration

### Wallet UI (`/wallet`)

The wallet UI now displays:
- **Address Cards** with:
  - Act titles (e.g., "Venice, 1494 / The Drake's First Whisper")
  - Spellbook (Story / Zero Knowledge)
  - Purpose (📥 Receives donations / 📊 Tracks inscriptions)
  - Balance for each address

- **Proverb Tracking** with:
  - T-address for each proverb
  - Balance on t-address
  - Memo data
  - Act mapping
  - Amount received

### API Endpoints

- `GET /api/wallet/addresses` - All addresses with act mappings
- `GET /api/wallet/addresses/z` - All z-addresses mapped to acts
- `GET /api/wallet/addresses/z/:actId` - Get z-address for specific act
- `GET /api/wallet/proverbs` - Proverbs with t-address tracking
- `GET /api/wallet/balances` - Balances with act metadata

### Frontend Story Pages

Each story act can now:
- Display its z-address for donations
- Show where to send ZEC with memo
- Link to wallet UI for tracking

## 🔒 Secure Key Storage

Private keys should be stored:
- Environment variables (`.env` file, NOT in git)
- Secret management service (AWS Secrets Manager, etc.)
- Encrypted key file (NOT in git)

See: `SECURE_KEY_STORAGE.md` for details.

## ✅ Ready to Rebuild

Once you save the export JSON and run the rebuild script, you'll have:
- All 36 addresses properly mapped
- No private keys in files
- Frontend-ready structure
- Wallet UI showing all addresses with act mappings

