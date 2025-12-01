# Zcash Keys Generated - Summary

## ⚠️ SECURITY NOTICE: Keys Removed

**This file previously contained private keys, mnemonics, and spending keys. These have been removed for security.**

**If this file was ever committed to git, those keys are compromised and MUST be rotated immediately.**

## Key Storage

Keys should be stored:
- ✅ In environment variables (`.env` file - NOT in git)
- ✅ In secure secret management services (AWS Secrets Manager, HashiCorp Vault, etc.)
- ✅ Encrypted and stored separately from code
- ❌ NEVER in git repositories
- ❌ NEVER in documentation files
- ❌ NEVER in code files

## What Was Here

This file previously documented:
- Mnemonic (24 words) - **ROTATE IF EXPOSED**
- Spending Key - **ROTATE IF EXPOSED**
- Viewing Key - **ROTATE IF EXPOSED**
- Transparent Private Key - **ROTATE IF EXPOSED**
- Generated addresses

## Next Steps

1. ⚠️ **If keys were exposed**: Generate new keys immediately
2. ✅ **Use environment variables**: Store keys in `.env` (gitignored)
3. ✅ **Use secret management**: For production, use proper secret management
4. ✅ **Never commit keys**: Add key files to `.gitignore`

## Security Notes

- **Never share these keys** - They control your Zcash funds
- **Store mnemonic separately** - Can recover all keys from mnemonic
- **Use spending key only in TEE** - Store in Nillion workload or secure environment
- **Viewing key is safer** - Can share for transaction monitoring (but still be careful)

## File Status

**Keys have been removed from this file. If this file was in git, assume keys are compromised.**
