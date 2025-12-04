# Zcash Inscription Key Rotation Process

## Overview

This document records the key rotation process performed on 2024-12-02 for the Zypher Oracle inscription system. The rotation moved from a compromised/exposed key to a new isolated key architecture designed for TEE (Trusted Execution Environment) deployment.

## Why Key Rotation Was Needed

The original inscription key was potentially exposed during development. While no funds were at risk (the key only controlled inscription P2SH addresses, not the treasury), rotating to a fresh key with proper isolation was the correct security practice.

## Architecture Design

### Security Model: Isolated Signing Keys

```
┌─────────────────────────────────────────────────────────────────────┐
│                        TREASURY LAYER                                │
│                                                                      │
│   Zallet Wallet (HD Mnemonic)                                       │
│   ├── Unified Address (u1...)  ← Receives payments                  │
│   ├── Shielded Pool (zs1...)   ← Private funds                      │
│   └── Transparent (t1...)      ← Change destination                 │
│                                                                      │
│   Protection: 24-word mnemonic, offline backup, age-encrypted       │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              │ Deshield to P2SH (one-way funding)
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     INSCRIPTION LAYER (TEE)                          │
│                                                                      │
│   Standalone WIF Key                                                │
│   ├── NOT derived from mnemonic                                     │
│   ├── Stored in Nillion TEE                                         │
│   ├── Used ONLY for P2SH inscription signing                        │
│   └── Public key creates P2SH addresses                             │
│                                                                      │
│   P2SH Addresses (t3...)                                            │
│   ├── Ephemeral, one-time use per inscription                       │
│   ├── Funded by deshielding from treasury                           │
│   └── Spent to create inscriptions                                  │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              │ Change output
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      CHANGE RETURNS TO TREASURY                      │
│                                                                      │
│   All change → Treasury t1 address                                  │
│   TEE key CANNOT spend from treasury - only Zallet controls it      │
└─────────────────────────────────────────────────────────────────────┘
```

### Key Isolation Benefits

**If TEE is compromised:**
- Attacker gets inscription WIF only
- Can sign P2SH spends (inscription transactions)
- CANNOT access treasury funds
- CANNOT derive mnemonic
- Change still goes to treasury (attacker can't redirect)

**If mnemonic is compromised:**
- Attacker gets full treasury access
- Inscription key remains safe in TEE
- (Less critical since treasury is the main asset)

## Step-by-Step Process

### Step 1: Generate New Keypair

Created `generate-inscription-key.js` using Node.js with:
- `crypto.randomBytes(32)` for entropy
- `elliptic` library for secp256k1 operations
- Proper WIF encoding with Zcash mainnet prefix (0x80)
- Compressed public key format

```javascript
// Key generation (conceptual - actual script in generate-inscription-key.js)
const privateKey = crypto.randomBytes(32);
const keyPair = ec.keyFromPrivate(privateKey);
const publicKey = keyPair.getPublic(true, 'array'); // compressed
```

### Step 2: Create WIF Format

Zcash mainnet WIF encoding:
1. Prepend version byte: `0x80`
2. Append compression flag: `0x01`
3. Double SHA256 for checksum
4. Base58Check encode

Output: Private key in WIF format for secure storage

### Step 3: Derive Addresses

**Simple P2SH Address (for inscriptions):**
```
Redeem Script: OP_DROP <pubkey> OP_CHECKSIG
              0x75    <33 bytes>  0xac
```

**Per-Act P2SH Addresses:**
Each act (1-12) gets a unique P2SH by embedding the act number:
```
Redeem Script: OP_<act_num> OP_DROP <pubkey> OP_CHECKSIG
```

This creates 12 distinct P2SH addresses, one per spellbook act.

### Step 4: Generate Address Files

Created the following files:
- `wif.txt` - Private key (NEVER commit to git)
- `pubkey.txt` - Public key hex (safe to share)
- `p2sh-simple.json` - Simple P2SH details
- `act-p2sh-addresses.json` - All 12 act-specific P2SH addresses

### Step 5: Update Inscription Scripts

Updated `oracle-swordsman/inscribe-act*.js` files:
1. Replaced old WIF with new WIF
2. Replaced old redeem script with new redeem script
3. Updated output scriptPubKey to new treasury t1 address
4. Updated comments to reference new key architecture

Files updated:
- inscribe-act1.js through inscribe-act7.js (existing scripts)
- inscribe-act8.js through inscribe-act12.js (newly generated)

### Step 6: Create Legacy Address Mapping

For the inscription indexer, created dual-address lookup:
- `ACT_P2SH_ADDRESSES` - New primary addresses for future inscriptions
- `LEGACY_ACT_P2SH_ADDRESSES` - Old addresses for historical indexing
- `ALL_ACT_P2SH_ADDRESSES` - Combined for complete indexing
- `isLegacyAddress()` - Helper to identify old vs new

### Step 7: Sweep Legacy Funds (Optional)

Created `sweep-legacy-t1.js` to move any remaining funds from the old t1 address to the new treasury. Left 0.001337 ZEC as a "canary" bounty - if it moves, we know someone has the old key.

## Files Created

```
t_keys_zypher/
├── .gitignore              # Excludes wif.txt
├── generate-inscription-key.js
├── INSCRIPTION_KEY_ARCHITECTURE.md
├── inscription-indexer-addresses-update.ts
├── act-p2sh-addresses.json
├── p2sh-simple.json
├── pubkey.txt
├── t1-reference.txt
└── wif.txt                 # NEVER COMMIT - TEE only
```

## Address Reference

| Type | Purpose | Security |
|------|---------|----------|
| Treasury UA | Receive payments | Mnemonic protected |
| Treasury t1 | Change destination | Mnemonic protected |
| Simple P2SH | Inscription source | WIF in TEE |
| Act P2SH (1-12) | Per-act inscriptions | WIF in TEE |

## Inscription Flow (Post-Rotation)

1. **User submits proverb** → Sends ZEC + memo to Treasury UA
2. **Oracle detects** → Reads shielded memo, validates proverb
3. **Funding** → `z_sendmany` from treasury to Act-specific P2SH
4. **Inscription signing** → TEE signs P2SH spend with isolated WIF
5. **Change returns** → Output goes back to Treasury t1
6. **Broadcast** → Raw transaction sent via Zebra RPC

## Security Checklist

- [x] New key generated with cryptographic randomness
- [x] WIF stored separately from mnemonic
- [x] WIF excluded from git via .gitignore
- [x] Change address points to treasury (not inscription key's t1)
- [x] Legacy addresses preserved for historical indexing
- [x] Legacy t1 swept (with canary bounty left)
- [x] All inscription scripts updated
- [x] Documentation created

## Future: Nillion TEE Integration

The WIF key will be stored as a Nillion SecretBlob:
- Encrypted at rest in TEE
- Decrypted only during signing operations
- Access controlled by TEE attestation
- Never leaves TEE boundary in plaintext

See: `oracle-swordsman/docs/integration/NILLION_INTEGRATION_OPTIONS.md`

---

*Process completed: 2024-12-02*
*Architecture: Isolated inscription signing with TEE*
