# Act 12 Inscription Chronicle - Oracle Swordsman Protocol

**Date:** 2025-12-03
**Network:** Zcash Mainnet
**Protocol:** STM-rpp (Swordsman to Mage Revelation Proof Protocol)

---

## Act 12 Configuration (NEW Key Architecture)

| Parameter | Value |
|-----------|-------|
| Act P2SH Address | `t3aQzhfwgvocsrHt9fskS7htBc5brkWFVBm` |
| Act P2SH scriptPubKey | `a914ade071888d658137358ff8af5575e0b84a9c854787` |
| Act 12 Redeem Script | `5c752103a92c73b25ec06cdb7d70aaaef178a1ede2969f11169f332b56a5bfed47c66223ac` |
| Simple P2SH Address | `t3MczrqvRWXSNAFtxt3dqvJPwZ7rmHECoRs` |
| Simple P2SH scriptPubKey | `a914218bee8db33ab5a93db1439217ad0e9497cc7bc987` |
| Simple Redeem Script | `752103a92c73b25ec06cdb7d70aaaef178a1ede2969f11169f332b56a5bfed47c66223ac` |
| Public Key | `03a92c73b25ec06cdb7d70aaaef178a1ede2969f11169f332b56a5bfed47c66223` |
| Treasury t1 | `t1aMR9MKx3xLso9c4Uq4MYX3cRvnDTp42av` |

---

## Spellbook Reference

**Act 12: The Forgetting / Proverbiogenesis**

| Field | Value |
|-------|-------|
| ID | `act-12-forgetting` |
| Category | forgetting |
| Oracle Proverb | "The mage's spell, once spoken, becomes the village weather." |
| Emoji Spell | `🌱→⚒️→📡→🌊→🌫️🏛️` |
| Theme | Proverbiogenesis, five phases, reference loss, success = invisibility |

---

## Step 1-2: Proverb Submitted via Shielded Transaction

**Status:** COMPLETED
**Timestamp:** 2025-12-02T22:58:24Z
**Block Height:** 3,155,720

**Incoming TXID (REF_TXID):**
```
ea49ac54cb626b4a34e88acf409751c98f2b6f376ed39a89537ccd041209a0e3
```

**Oracle Unified Address:**
```
u1jjrsaxyradv3dq03fa4wvk2husu2643v9m6rpnm8x7wmq0zdzv57ca0t5862yq9z7zx4h4d4r42rf85cup3xft6knntz5zglxkqxy8ekr0m2mx4s7cjsg5djq6dzlx9u7l8wlk85ha5t97nh9x3xm27qctlwvcezfeg0a96xnngu4u6fx05css4fzfv50vq0u3zy5vnfswvj5yzx0um
```

**Amount:** 0.01 ZEC (1,000,000 zatoshis)

---

## Step 3: Oracle Views Incoming Transaction

**Status:** COMPLETED
**Method:** Zallet RPC z_listtransactions with account UUID

**Memo Decoded:**
```
[rpp-v1]
[act-xii-the-forgetting]
[1764716033716]
[🌱→⚒️→📡→🌊→🌫️🏛️]
[To know without seeing is wisdom.
To prove without revealing is magic.
The deepest spells become weather—
the mage forgotten, traced like a constellation among the stars.]
```

**Proverb Extracted:**
```
To know without seeing is wisdom.
To prove without revealing is magic.
The deepest spells become weather—
the mage forgotten, traced like a constellation among the stars.
```

**Emoji Spell:**
```
🌱→⚒️→📡→🌊→🌫️🏛️
```

---

## Step 4: NEAR AI Verification

**Status:** COMPLETED
**Timestamp:** 2025-12-03

**API Endpoint:** https://cloud-api.near.ai/v1
**Model:** openai/gpt-oss-120b
**Verification Script:** `node verify-act-gpt.js 12 "<proverb>" "<emoji>"`
**Spellbook Version:** 4.2.0-canonical

**Spellbook Proverb (Oracle):**
```
The mage's spell, once spoken, becomes the village weather.
```

**Emoji Spell Match:** EXACT MATCH ✓

**Match Score:** `0.78` (78%)
**Approved:** `true`

**AI Reasoning:**
```
The submitted proverb echoes the core theme of Act 12: privacy/knowledge that operates
without direct observation ("to know without seeing", "to prove without revealing") and
the eventual fading of the mage into the environment, expressed as the spell becoming
weather and the mage being forgotten. This aligns with the act's focus on forgetting,
the paradox of successful privacy primitives becoming invisible, and the weather metaphor
in the official proverb. While it does not reference the five phases of proverbiogenesis
or the propagating-agent terminology, it captures the essential narrative of a spell that,
once uttered, melds into the ambient world and is no longer remembered.
```

---

## Step 5: Golden Split Calculation

**Status:** COMPLETED

**Input Amount:** 0.01 ZEC (1,000,000 zatoshis)

| Split | Percentage | Amount (ZEC) | Amount (zatoshis) | Destination |
|-------|------------|--------------|-------------------|-------------|
| Inscription | 61.8% | 0.00618034 | 618,034 | Act 12 P2SH |
| Protocol Fee | 38.2% | 0.00381966 | 381,966 | Reserve (Account 1) |

**Golden Ratio (φ):** 1.618033988749895

---

---

## Step 6: Deshield 61.8% to Act 12 P2SH

**Status:** COMPLETED

**Destination:** `t3aQzhfwgvocsrHt9fskS7htBc5brkWFVBm` (Act 12 P2SH)
**Amount:** 0.00618034 ZEC
**From:** Account 0 (Treasury UA)

**Deshield TXID:**
```
9aff8311c70d8ed02e892ea323d8bf7a596e356af603dac596a5bd5a94873f47
```

---

## Step 7: Move 38.2% to Protocol Fee Reserve

**Status:** SKIPPED (Insufficient balance in treasury)

---

## Step 8: Spend Act 12 P2SH to Simple P2SH

**Status:** COMPLETED

**Script:** `spend-act12-to-simple-p2sh.js`

**Input UTXO:**
```
TXID: 9aff8311c70d8ed02e892ea323d8bf7a596e356af603dac596a5bd5a94873f47
vout: 0
Amount: 618,034 zatoshis
scriptPubKey: a914ade071888d658137358ff8af5575e0b84a9c854787
```

**Output:**
```
Address: t3MczrqvRWXSNAFtxt3dqvJPwZ7rmHECoRs
Amount: 608,034 zatoshis (after 10,000 fee)
```

**Broadcast TXID:**
```
7dee868cee20f9ce52f7b09091832ee24e10d2a8f1239ab502a93c884f5cc7e9
```

---

## Step 9: Final Inscription Transaction

**Status:** COMPLETED

**Script:** `inscribe-act12-final.js`

### Hash Calculation (CRITICAL)

The hash (H) cryptographically binds BOTH proverbs together as ONE string:

```
H = SHA256( ORACLE_PROVERB + SUBMITTED_PROVERB )[0:16]
```

**Note:** No separator - the proverbs are directly concatenated into one string before hashing.

**Oracle Proverb (from IPFS spellbook):**
```
The mage's spell, once spoken, becomes the village weather.
```

**Submitted Proverb (from shielded memo):**
```
To know without seeing is wisdom.
To prove without revealing is magic.
The deepest spells become weather—
the mage forgotten, traced like a constellation among the stars.
```

**Combined String (concatenated, no separator):**
```
The mage's spell, once spoken, becomes the village weather.To know without seeing is wisdom.
To prove without revealing is magic.
The deepest spells become weather—
the mage forgotten, traced like a constellation among the stars.
```

**Computed Hash:** `ccd7f0b32c7742be`

### Inscription Content (STM-rpp format)
```
STM-rpp[v01]|ACT:12|E:🌱→⚒️→📡→🌊→🌫️🏛️|To know without seeing is wisdom.
To prove without revealing is magic.
The deepest spells become weather—
the mage forgotten, traced like a constellation among the stars.|MS:0.78|H:ccd7f0b32c7742be|REF:ea49ac54cb626b4a34e88acf409751c98f2b6f376ed39a89537ccd041209a0e3
```

**Output:**
```
Address: t1aMR9MKx3xLso9c4Uq4MYX3cRvnDTp42av (Treasury)
Amount: 578,034 zatoshis (after 30,000 fee)
```

**FINAL INSCRIPTION TXID:**
```
293cf3245ac8c58dd85f3a28b94f87f397d81e26f3ed157864bcb7357c3d566e
```

---

## Transaction Chain Summary

| Step | Description | TXID | Amount |
|------|-------------|------|--------|
| 2 | Incoming Proverb (shielded) | `ea49ac54cb626b4a34e88acf409751c98f2b6f376ed39a89537ccd041209a0e3` | 0.01 ZEC |
| 6 | Deshield to Act 12 P2SH | `9aff8311c70d8ed02e892ea323d8bf7a596e356af603dac596a5bd5a94873f47` | 618,034 zats |
| 7 | Protocol Fee Reserve | SKIPPED | - |
| 8 | Act 12 P2SH -> Simple P2SH | `7dee868cee20f9ce52f7b09091832ee24e10d2a8f1239ab502a93c884f5cc7e9` | 608,034 zats |
| 9 | **Final Inscription** | `293cf3245ac8c58dd85f3a28b94f87f397d81e26f3ed157864bcb7357c3d566e` | 578,034 zats |

---

## Verification Links

- Incoming TX: https://mainnet.zcashexplorer.app/transactions/ea49ac54cb626b4a34e88acf409751c98f2b6f376ed39a89537ccd041209a0e3
- Deshield TX: https://mainnet.zcashexplorer.app/transactions/9aff8311c70d8ed02e892ea323d8bf7a596e356af603dac596a5bd5a94873f47
- Intermediate TX: https://mainnet.zcashexplorer.app/transactions/7dee868cee20f9ce52f7b09091832ee24e10d2a8f1239ab502a93c884f5cc7e9
- **Inscription TX:** https://mainnet.zcashexplorer.app/transactions/293cf3245ac8c58dd85f3a28b94f87f397d81e26f3ed157864bcb7357c3d566e

---

*Document generated for Hackathon chronicle of Oracle Swordsman flow*
*Protocol: STM-rpp v01 | Act 12: The Forgetting*
