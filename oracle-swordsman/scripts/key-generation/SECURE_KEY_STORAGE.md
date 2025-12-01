# Secure Key Storage Guide

## ⚠️ CRITICAL: Private Keys Removed from Files

All private keys have been removed from `zcash-addresses-controlled.json` for security.

## Where to Store Private Keys

### Option 1: Environment Variables (Recommended for Development)

Create a `.env` file (NOT in git):

```bash
# Zcash Private Keys (JSON format)
ZCASH_PRIVATE_KEYS_JSON='{
  "addresses": [
    {
      "address": "zs1...",
      "spendingKey": "secret-extended-key-main1...",
      "viewingKey": "zxviews1..."
    },
    {
      "address": "t1...",
      "privateKey": "Kx..."
    }
  ]
}'
```

### Option 2: Secret Management Service (Production)

- **AWS Secrets Manager**
- **HashiCorp Vault**
- **Azure Key Vault**
- **Google Secret Manager**

### Option 3: Encrypted Key File (Local)

Create `zcash-keys-secure.json.encrypted` (NOT in git):
- Encrypt with GPG or similar
- Store decryption key separately
- Only decrypt when needed for signing

## Current Address File Structure

The `zcash-addresses-controlled.json` file now contains:
- ✅ Addresses (public)
- ✅ Act mappings (for frontend)
- ✅ Labels and descriptions
- ✅ Viewing keys (for viewing transactions)
- ❌ NO private keys
- ❌ NO spending keys
- ❌ NO mnemonic

## Server-Side Key Access

Private keys should only be accessed:
1. Server-side (never exposed to frontend)
2. For transaction signing only
3. Through secure environment variables or secret management
4. With proper access controls

## Frontend Integration

The frontend can now safely:
- Display all addresses with act mappings
- Show balances
- Display t-address tracking with memos and amounts
- Show z-addresses for each act (for donation routing)

All without exposing private keys!

