# Zcash Key Generation Guide

## Generated Keys (Production)

**⚠️ IMPORTANT: Save these keys securely!**

### Mnemonic (24 words):
```
cable broken what wool treat envelope clean vapor frost connect mother stairs iron valley lazy dad radio together dance relax only window tribe farm
```

### Seed Fingerprint:
```
zip32seedfp79056752
```

### Keys (Partial - Full keys in JSON file):
- **Spending Key**: `fc73e9b36165f8506ce16b0f644b3057...` (full key in JSON)
- **Viewing Key**: `47a666056a8ee947a32782eb70afd46a...` (full key in JSON)
- **Transparent Private Key**: `effc7cd4e389009f0c13748e1963ea25...` (full key in JSON)

## How to Generate Keys

### Option 1: Using the Script

```bash
cd oracle-swordsman
npx ts-node generate-keys-secure.ts
```

The script will:
1. Generate a new mnemonic (24 words)
2. Derive Zcash keys using BIP32 paths
3. Save to `temp/zcash-keys-[timestamp].json`
4. Display keys on screen
5. Wait 30 seconds before auto-deleting (press Ctrl+C to keep)

### Option 2: Using Zallet (When RPC is Fixed)

```bash
# Stop zallet
# Export mnemonic
zallet export-mnemonic

# Import to get addresses
zallet import-mnemonic "your mnemonic here"
```

### Option 3: Using Zcash CLI Tools

```bash
# If zcash-cli is available
zcash-cli getnewaddress
zcash-cli z_getnewaddress
zcash-cli z_exportviewingkey <address>
```

## Key Storage

### For Production:
1. **Save mnemonic**: Write down the 24 words on paper, store securely
2. **Save JSON file**: Encrypt and store in secure location
3. **Backup**: Create multiple encrypted backups
4. **Never share**: These keys control your Zcash funds

### For Oracle Swordsman:
- Store spending key in Nillion TEE workload
- Use viewing key for transaction monitoring
- Keep transparent key for transparent transactions

## Next Steps

1. ✅ Keys generated
2. ⏳ Save keys securely
3. ⏳ Store spending key in Nillion workload
4. ⏳ Configure Oracle Swordsman with addresses
5. ⏳ Test transaction signing

## Security Notes

- **Mnemonic**: Can recover all keys - keep extremely secure
- **Spending Key**: Can spend funds - store in TEE only
- **Viewing Key**: Can view transactions - safer to share
- **Transparent Key**: For transparent addresses - use carefully

## File Location

Keys are saved to:
```
oracle-swordsman/temp/zcash-keys-[timestamp].json
```

**Copy this file to a secure location before it's deleted!**

