# Act 11 Inscription Chronicle - Oracle Swordsman Protocol

**Date:** 2025-12-03
**Network:** Zcash Mainnet
**Protocol:** STM-rpp (Swordsman to Mage Revelation Proof Protocol)

---

## Act 11 Configuration (NEW Key Architecture)

| Parameter | Value |
|-----------|-------|
| Act P2SH Address | `t3eEy9gLy4o5Y62zBu2QEherULxfajFTz5R` |
| Act P2SH scriptPubKey | `a914...` (to be filled) |
| Act 11 Redeem Script | `5b752103a92c73b25ec06cdb7d70aaaef178a1ede2969f11169f332b56a5bfed47c66223ac` |
| Simple P2SH Address | `t3MczrqvRWXSNAFtxt3dqvJPwZ7rmHECoRs` |
| Simple P2SH scriptPubKey | `a914218bee8db33ab5a93db1439217ad0e9497cc7bc987` |
| Simple Redeem Script | `752103a92c73b25ec06cdb7d70aaaef178a1ede2969f11169f332b56a5bfed47c66223ac` |
| Public Key | `03a92c73b25ec06cdb7d70aaaef178a1ede2969f11169f332b56a5bfed47c66223` |
| Treasury t1 | `t1aMR9MKx3xLso9c4Uq4MYX3cRvnDTp42av` |

---

## Spellbook Reference

**Act 11: Balanced Spiral of Sovereignty / The Golden Ratio**

| Field | Value |
|-------|-------|
| ID | `act-11-sovereignty-spiral` |
| Category | balance |
| Oracle Proverb | "The blade that becomes the spell loses both edges." |
| Emoji Spell | `⚔️ ➗ 📖 = 🌀` |
| Theme | Golden ratio, separation creates sovereignty, balanced growth |

---

## Step 1-2: Proverb Submitted via Shielded Transaction

**Status:** COMPLETED
**Timestamp:** 2025-12-02T22:56:59Z
**Block Height:** 3,155,718

**Incoming TXID (REF_TXID):**
```
809c2535d1c5ddb18f13492227bcf024ae31867bd0fbb81d36b377fccebfaaaa
```

**Oracle Unified Address:**
```
u1jjrsaxyradv3dq03fa4wvk2husu2643v9m6rpnm8x7wmq0zdzv57ca0t5862yq9z7zx4h4d4r42rf85cup3xft6knntz5zglxkqxy8ekr0m2mx4s7cjsg5djq6dzlx9u7l8wlk85ha5t97nh9x3xm27qctlwvcezfeg0a96xnngu4u6fx05css4fzfv50vq0u3zy5vnfswvj5yzx0um
```

**Amount:** 0.01 ZEC (1,000,000 zatoshis)

---

## Solution: Zallet Account UUID for z_listtransactions

**Key Discovery:** The `z_listtransactions` method requires the account UUID (not account number):
```javascript
// Account 0 UUID
const accountUUID = '0b8919a5-441b-4b63-a40f-fb0163e369a2';

// Call z_listtransactions with UUID
z_listtransactions(accountUUID, 100)
```

This returns transactions WITH fully decrypted memos, unlike `z_listunspent` which only shows encrypted memos.

---

## Step 3: Oracle Views Incoming Transaction

**Status:** COMPLETED
**Method:** Zallet RPC z_listtransactions with account UUID

**Memo Decoded:**
```
[rpp-v1]
[act-xi-balanced-spiral-of-sovereignty]
[1764715682435]
[⚔️ ➗ 📖 = 🌀]
[⚔️🐚🧙 | φ = 1.618...
Two that merge → one shadow → reconstructable
Two that balance → golden spiral → sovereign
Separated by proof. Balanced by pattern. Forever irreducible.
△ preserved. 7th capital compounds.]
```

**Proverb Extracted:**
```
⚔️🐚🧙 | φ = 1.618...
Two that merge → one shadow → reconstructable
Two that balance → golden spiral → sovereign
Separated by proof. Balanced by pattern. Forever irreducible.
△ preserved. 7th capital compounds.
```

**Emoji Spell:**
```
⚔️ ➗ 📖 = 🌀
```

---

## Step 4: NEAR AI Verification

**Status:** COMPLETED
**Timestamp:** 2025-12-03

**API Endpoint:** https://cloud-api.near.ai/v1
**Model:** openai/gpt-oss-120b
**Verification Script:** `node verify-act-gpt.js 11 "<proverb>" "<emoji>"`
**Spellbook Version:** 4.2.0-canonical

**Spellbook Proverb (Oracle):**
```
The blade that becomes the spell loses both edges.
```

**Emoji Spell Match:** EXACT MATCH ✓

**Match Score:** `0.92` (92%)
**Approved:** `true`

**AI Reasoning:**
```
The submitted proverb explicitly references φ ≈ 1.618, the golden spiral, balance,
and the necessity of separation to avoid reconstruction—all core ideas of Act 11.
It echoes the act's description that merging agents become predictable
("one shadow → reconstructable") and that balanced, separated agents achieve
sovereignty ("golden spiral → sovereign"). The mention of "Separated by proof"
and "Forever irreducible" aligns with the act's emphasis on conditional
independence and irreducibility. The emoji spell matches exactly (⚔️ ➗ 📖 = 🌀).
Extra references (△ preserved, 7th capital compounds) are peripheral but not
contradictory. Therefore the proverb is thematically consistent with the full
act context.
```

---

## Step 5: Golden Split Calculation

**Status:** COMPLETED

**Input Amount:** 0.01 ZEC (1,000,000 zatoshis)

| Split | Percentage | Amount (ZEC) | Amount (zatoshis) | Destination |
|-------|------------|--------------|-------------------|-------------|
| Inscription | 61.8% | 0.00618034 | 618,034 | Act 11 P2SH |
| Protocol Fee | 38.2% | 0.00381966 | 381,966 | Reserve (Account 1) |

**Golden Ratio (φ):** 1.618033988749895

---

## Step 6: Deshield 61.8% to Act 11 P2SH

**Status:** COMPLETED

**Destination:** `t3eEy9gLy4o5Y62zBu2QEherULxfajFTz5R` (Act 11 P2SH)
**Amount:** 0.00618034 ZEC
**From:** Account 0 (Treasury UA)

**Deshield TXID:**
```
48a992f9e3ea8e48537af613fcbc4967669f948e10c407a28ea802990c9441b3
```

---

## Step 7: Move 38.2% to Protocol Fee Reserve

**Status:** COMPLETED

**Destination:** Protocol Fee Reserve (Account 1 UA)
**Amount:** 0.00381966 ZEC

**Reserve TXID:**
```
1230ffcef7109960b122a578ee5cf6a2cf8f4aea1181de12f017eaf2abbdce4d
```

---

## Step 8: Spend Act 11 P2SH to Simple P2SH

**Status:** COMPLETED

**Script:** `spend-act11-to-simple-p2sh.js`

**Input UTXO:**
```
TXID: 48a992f9e3ea8e48537af613fcbc4967669f948e10c407a28ea802990c9441b3
vout: 0
Amount: 618,034 zatoshis
scriptPubKey: a914d7db7de61ec1a423a30c73d937ff7796bf345dc387
```

**Output:**
```
Address: t3MczrqvRWXSNAFtxt3dqvJPwZ7rmHECoRs
Amount: 608,034 zatoshis (after 10,000 fee)
```

**Broadcast TXID:**
```
a944af67f76e81a33330284ae13f152c7d4bf9a92c847d332facf16b118dc3ff
```

---

## Step 9: Final Inscription Transaction

**Status:** COMPLETED

**Script:** `inscribe-act11-final.js`

### Hash Calculation (CRITICAL)

The hash (H) cryptographically binds BOTH proverbs together as ONE string:

```
H = SHA256( ORACLE_PROVERB + SUBMITTED_PROVERB )[0:16]
```

**Note:** No separator - the proverbs are directly concatenated into one string before hashing.

**Oracle Proverb (from IPFS spellbook):**
```
The blade that becomes the spell loses both edges.
```

**Submitted Proverb (from shielded memo):**
```
⚔️🐚🧙 | φ = 1.618...
Two that merge → one shadow → reconstructable
Two that balance → golden spiral → sovereign
Separated by proof. Balanced by pattern. Forever irreducible.
△ preserved. 7th capital compounds.
```

**Combined String (concatenated, no separator):**
```
The blade that becomes the spell loses both edges.⚔️🐚🧙 | φ = 1.618...
Two that merge → one shadow → reconstructable
Two that balance → golden spiral → sovereign
Separated by proof. Balanced by pattern. Forever irreducible.
△ preserved. 7th capital compounds.
```

**Computed Hash:** `1efc4f15907686cd`

### Inscription Content (STM-rpp format)
```
STM-rpp[v01]|ACT:11|E:⚔️ ➗ 📖 = 🌀|⚔️🐚🧙 | φ = 1.618...
Two that merge → one shadow → reconstructable
Two that balance → golden spiral → sovereign
Separated by proof. Balanced by pattern. Forever irreducible.
△ preserved. 7th capital compounds.|MS:0.92|H:1efc4f15907686cd|REF:809c2535d1c5ddb18f13492227bcf024ae31867bd0fbb81d36b377fccebfaaaa
```

**Output:**
```
Address: t1aMR9MKx3xLso9c4Uq4MYX3cRvnDTp42av (Treasury)
Amount: 578,034 zatoshis (after 30,000 fee)
```

**FINAL INSCRIPTION TXID:**
```
32a601ed83d2214c776a70b5e1068e892224c4500a20d1ed450d3d72c5bd3c60
```

---

## Transaction Chain Summary

| Step | Description | TXID | Amount |
|------|-------------|------|--------|
| 2 | Incoming Proverb (shielded) | `809c2535d1c5ddb18f13492227bcf024ae31867bd0fbb81d36b377fccebfaaaa` | 0.01 ZEC |
| 6 | Deshield to Act 11 P2SH | `48a992f9e3ea8e48537af613fcbc4967669f948e10c407a28ea802990c9441b3` | 618,034 zats |
| 7 | Protocol Fee Reserve | `1230ffcef7109960b122a578ee5cf6a2cf8f4aea1181de12f017eaf2abbdce4d` | 381,966 zats |
| 8 | Act 11 P2SH -> Simple P2SH | `a944af67f76e81a33330284ae13f152c7d4bf9a92c847d332facf16b118dc3ff` | 608,034 zats |
| 9 | **Final Inscription** | `32a601ed83d2214c776a70b5e1068e892224c4500a20d1ed450d3d72c5bd3c60` | 578,034 zats |

---

## Verification Links

- Incoming TX: https://mainnet.zcashexplorer.app/transactions/809c2535d1c5ddb18f13492227bcf024ae31867bd0fbb81d36b377fccebfaaaa
- Deshield TX: https://mainnet.zcashexplorer.app/transactions/48a992f9e3ea8e48537af613fcbc4967669f948e10c407a28ea802990c9441b3
- Intermediate TX: https://mainnet.zcashexplorer.app/transactions/a944af67f76e81a33330284ae13f152c7d4bf9a92c847d332facf16b118dc3ff
- **Inscription TX:** https://mainnet.zcashexplorer.app/transactions/32a601ed83d2214c776a70b5e1068e892224c4500a20d1ed450d3d72c5bd3c60

---

*Document generated for Hackathon chronicle of Oracle Swordsman flow*
*Protocol: STM-rpp v01 | Act 11: Balanced Spiral of Sovereignty*
