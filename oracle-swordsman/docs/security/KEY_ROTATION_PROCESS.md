# Zcash Inscription Key Rotation Process

## Overview

This document records the key rotation process performed on 2025-12-02 for the Zypher Oracle inscription system. The rotation moved from a potentially exposed key to a new isolated key architecture designed for TEE (Trusted Execution Environment) deployment.

## Why Key Rotation Was Needed

The original inscription key was potentially exposed during development. While no funds were at risk (the key only controlled inscription P2SH addresses, not the treasury), rotating to a fresh key with proper isolation was the correct security practice.

**Key insight:** Because we use isolated keys, rotating the inscription key:
- Does NOT require changing the treasury mnemonic
- Does NOT affect funds in shielded pool
- Only requires updating inscription scripts and indexer addresses

## Architecture Design

### Security Model: Isolated Signing Keys

```
+---------------------------------------------------------------------+
|                        TREASURY LAYER                                |
|                                                                      |
|   Zallet Wallet (HD Mnemonic)                                       |
|   |-- Unified Address (u1...)  <- Receives payments                 |
|   |-- Shielded Pool (zs1...)   <- Private funds                     |
|   +-- Transparent (t1...)      <- Change destination                |
|                                                                      |
|   Protection: 24-word mnemonic, offline backup, age-encrypted       |
+---------------------------------------------------------------------+
                              |
                              | Deshield to P2SH (one-way funding)
                              v
+---------------------------------------------------------------------+
|                     INSCRIPTION LAYER (TEE)                          |
|                                                                      |
|   Standalone WIF Key                                                |
|   |-- NOT derived from mnemonic                                     |
|   |-- Stored in Nillion TEE                                         |
|   |-- Used ONLY for P2SH inscription signing                        |
|   +-- Public key creates P2SH addresses                             |
|                                                                      |
|   P2SH Addresses (t3...)                                            |
|   |-- Ephemeral, one-time use per inscription                       |
|   |-- Funded by deshielding from treasury                           |
|   +-- Spent to create inscriptions                                  |
+---------------------------------------------------------------------+
                              |
                              | Change output
                              v
+---------------------------------------------------------------------+
|                      CHANGE RETURNS TO TREASURY                      |
|                                                                      |
|   All change -> Treasury t1 address                                 |
|   TEE key CANNOT spend from treasury - only Zallet controls it      |
+---------------------------------------------------------------------+
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
// Key generation (conceptual)
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
|-- .gitignore              # Excludes wif.txt
|-- generate-inscription-key.js
|-- INSCRIPTION_KEY_ARCHITECTURE.md
|-- inscription-indexer-addresses-update.ts
|-- act-p2sh-addresses.json
|-- p2sh-simple.json
|-- pubkey.txt
|-- t1-reference.txt
+-- wif.txt                 # NEVER COMMIT - TEE only
```

## Address Reference

### New Primary Addresses (2025-12-02)

| Act | P2SH Address |
|-----|--------------|
| 1 | t3gLXGanUTif8WLpX7EZXtR3kX5f1ZoWuUT |
| 2 | t3UpuXZq8CrX2EubNYVDKo4nWRXbyZ5wVUV |
| 3 | t3PPLb9EbeqSyzQwQgKwF9ugQNeFBxHtfeX |
| 4 | t3hiQfbJ5K45qmm4H1Q6N6CZD3AoppyS63g |
| 5 | t3fepr2dZh1xPEtZLf575kBBGNQa1U4AhuC |
| 6 | t3UrTbeMjjUUbccNKCSEn9qfBRB3jJVF7A6 |
| 7 | t3cnddicBRoJDHPqU2NbHdArz7Cd9xEZ9Hs |
| 8 | t3V4tmaxC48diu8qvQT8kPP2Kcr4btXEoDD |
| 9 | t3cY6cRjiba4k3vu2vnKEGBBZWwA21zn6tg |
| 10 | t3MYZJnESAw7tqwcECB611NLEZA6N51YPLj |
| 11 | t3eEy9gLy4o5Y62zBu2QEherULxfajFTz5R |
| 12 | t3aQzhfwgvocsrHt9fskS7htBc5brkWFVBm |

### Legacy Addresses (Rotated - Historical Only)

| Act | P2SH Address |
|-----|--------------|
| 1 | t3VRbiCNhtiWjVcbSEhxnrThDqnYHPGegU2 |
| 2 | t3bj1ifQRvdvgrg5d7a58HCjoPsrzRVWBen |
| 3 | t3dfk8Wnz9NCx2W3hLXixopwUHv8XFgoN6D |
| 4 | t3ZQBTvGzrjNQFMnXwLrL7ex9MiLh9cknv4 |
| 5 | t3RvMXm9Bqiqi85Hz3DNYmjkeEGM7Cm3qFd |
| 6 | t3WPtezEEP3vqFREcDcAFngdR5Gbe1Aafyp |
| 7 | t3eju1hQKU2qNiJzsHZZ8aBcAy7ZpBFRiYF |
| 8 | t3UYAbyaHQsR5qCquvugxJ8DCJoDXSHmjV6 |
| 9 | t3R9vniLa2HoRXXcf6reywZfwRJiHQVhoQJ |
| 10 | t3NUNi662nPNcafpzR2GJFntGnCRx6TRaYu |
| 11 | t3cTVUehSQom21SojguNPgVhRfzeUhkGc6M |
| 12 | t3dVXHBYp2EAj9ZhkmwKMrwdSiRDD1suC51 |

### Treasury Addresses

| Type | Address | Purpose |
|------|---------|---------|
| Treasury t1 | t1aMR9MKx3xLso9c4Uq4MYX3cRvnDTp42av | Change destination (current) |
| Legacy t1 #2 | t1J6DrkJKovnYfvQoYBWCEAakScdJ8bHBCJ | Rotated 2025-12-02 |
| Legacy t1 | t1Ko5s5CrSnAPxg3kq6JUwsz4paxzLBJY2Q | Rotated out (canary bounty left) |

## Inscription Flow (Post-Rotation)

1. **User submits proverb** -> Sends ZEC + memo to Treasury UA
2. **Oracle detects** -> Reads shielded memo, validates proverb
3. **Funding** -> `z_sendmany` from treasury to Act-specific P2SH
4. **Inscription signing** -> TEE signs P2SH spend with isolated WIF
5. **Change returns** -> Output goes back to Treasury t1
6. **Broadcast** -> Raw transaction sent via Zebra RPC

## Security Checklist

- [x] New key generated with cryptographic randomness
- [x] WIF stored separately from mnemonic
- [x] WIF excluded from git via .gitignore
- [x] Change address points to treasury (not inscription key's t1)
- [x] Legacy addresses preserved for historical indexing
- [x] Legacy t1 swept (with canary bounty left)
- [x] All inscription scripts updated
- [x] Indexer updated with dual-address support
- [x] Documentation created

## Future: Nillion TEE Integration

The WIF key will be stored as a Nillion SecretBlob:
- Encrypted at rest in TEE
- Decrypted only during signing operations
- Access controlled by TEE attestation
- Never leaves TEE boundary in plaintext

See: `docs/integration/NILLION_INTEGRATION_OPTIONS.md`

## When to Rotate Keys Again

Rotate the inscription key if:
- Any suspicion of key compromise
- TEE environment changes
- Moving to new deployment infrastructure
- Periodic rotation policy (recommended: annually)

Remember: Rotation is cheap with isolated keys. Don't hesitate to rotate.

---

*Process completed: 2025-12-02*
*Architecture: Isolated inscription signing with TEE*
