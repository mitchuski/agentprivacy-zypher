# Inscription Chronicle: Demo Session 2025-12-04

**Started:** 2025-12-04 12:05 UTC
**Protocol:** STM-rpp v01 (Swordsman to Mage Revelation Proof Protocol)
**Network:** Zcash Mainnet
**Act:** 9 - Zcash Shield / Forging Cryptographic Privacy

---

## System Status at Start

| Service | Status | Details |
|---------|--------|---------|
| Zebra | Connected | Block: 3,157,496 (synced) |
| Zallet | Connected | Wallet ready |
| Database | Connected | PostgreSQL |
| IPFS | Connected | Spellbook v4.2.0-canonical (42 acts) |
| Nillion | Connected | 1.5M credits |
| Frontend | Running | http://localhost:5000 |
| Backend | Running | http://localhost:3003 |

**Wallet Balance:**
- Total: 0.12093767 ZEC
- Transparent: 0.07961937 ZEC
- Shielded: 0.04131830 ZEC

---

## CONFIRMED Proverb & Verification

**Act:** 9 - Zcash Shield / Forging Cryptographic Privacy
**Match Score:** 0.86 (86%) ✅ APPROVED

**Submitted Proverb:**
```
The inscription is not concealment but covenant—sovereignty lies in the inversion: wisdom public, earnings private; stakes visible, methods hidden; comprehension proving what capital cannot, enforced by mathematics alone.
```

**Emoji Spell:** `🛡️ → 🛡️⚡ → 💰🔒 → 🕶️🦓`

**Official Act 9 Proverb (for hash computation):**
```
The two-faced shield is not duplicitous but sovereign—for true power lies not in choosing privacy or transparency, but in wielding both with mathematical certainty, where comprehension proves personhood.
```

**NEAR AI Reasoning:**
> The submitted proverb emphasizes a covenant of sovereignty where public wisdom coexists with private earnings, visible stakes with hidden methods, and mathematical enforcement of proof without disclosure. These ideas map directly onto Act 9's core themes: cryptographic privacy via zero‑knowledge proofs (proof without revealing), the need for absolute certainty for capital, privacy pools that allow compliance without surveillance, and the notion that mathematics alone restores privacy as a natural state.

---

## Step 1: Awaiting Shielded Submission

**Status:** WAITING FOR TX
**Expected Memo Format:**
```
[rpp-v1]
[act-ix-zcash-shield]
[1764860325214]
[🛡️ → 🛡️⚡ → 💰🔒 → 🕶️🦓]
[The inscription is not concealment but covenant—sovereignty lies in the inversion: wisdom public, earnings private; stakes visible, methods hidden; comprehension proving what capital cannot, enforced by mathematics alone.]
```

**Oracle UA (for proverb submissions):**
```
u1jjrsaxyradv3dq03fa4wvk2husu2643v9m6rpnm8x7wmq0zdzv57ca0t5862yq9z7zx4h4d4r42rf85cup3xft6knntz5zglxkqxy8ekr0m2mx4s7cjsg5djq6dzlx9u7l8wlk85ha5t97nh9x3xm27qctlwvcezfeg0a96xnngu4u6fx05css4fzfv50vq0u3zy5vnfswvj5yzx0um
```

---

## Step 2: Submission Detected

**Timestamp:** _pending_
**TXID (REF):** _pending_
**Amount:** 0.01 ZEC expected

---

## Step 3: Golden Split Calculation

**Incoming Amount:** 0.01 ZEC
**Split:**
- 61.8% → Inscription: **0.00618034 ZEC** (618,034 zatoshis)
- 38.2% → Protocol Fee Reserve: **0.00381966 ZEC** (381,966 zatoshis)

---

## Step 4: Deshield to Act 9 P2SH

**From:** Account 0 (Treasury shielded)
**To:** Act 9 P2SH
**Amount:** 0.00618034 ZEC
**Privacy Policy:** AllowRevealedRecipients

**Act 9 P2SH Address:** `t3R9vniLa2HoRXXcf6reywZfwRJiHQVhoQJ`
**Script Hash:** `484dce376d8c540f28fbceeb9dc9215868b30545`
**Redeem Script:** `59752103845d673f785ea0f19d6d8507f0ff409b88b3aadf0aa7a784e89572e19b12f7d0ac`
- `59` = OP_9 (act number marker)
- `75` = OP_DROP
- `21...` = 33-byte compressed pubkey push
- `ac` = OP_CHECKSIG

**Zallet RPC Command:**
```bash
curl -s -u 'oracleswordsmanzypher:soulbae$mage' -X POST http://127.0.0.1:28232 \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc":"2.0",
    "id":1,
    "method":"z_sendmany",
    "params":[
      "u1jjrsaxyradv3dq03fa4wvk2husu2643v9m6rpnm8x7wmq0zdzv57ca0t5862yq9z7zx4h4d4r42rf85cup3xft6knntz5zglxkqxy8ekr0m2mx4s7cjsg5djq6dzlx9u7l8wlk85ha5t97nh9x3xm27qctlwvcezfeg0a96xnngu4u6fx05css4fzfv50vq0u3zy5vnfswvj5yzx0um",
      [{"address":"t3R9vniLa2HoRXXcf6reywZfwRJiHQVhoQJ","amount":0.00618034}],
      1,
      null,
      "AllowRevealedRecipients"
    ]
  }'
```

**TXID:** _pending_
**Status:** _pending_

---

## Step 5: Move 38.2% to Protocol Fee Reserve

**From:** Account 0
**To:** Account 1 (Protocol Fee Reserve UA)
**Amount:** 0.00381966 ZEC
**Privacy Policy:** AllowLinkingAccountAddresses

**Account 1 UA:**
```
u1m59drp9gsrkd6u4px5ywlgf2h9933859yeuflal7znm9my5gl6x88zyawsjxmpmyd8q03h98qhljugkrh7dcunuq5uvgj3nyvg32ne2dg0tycwmw5axmw9pg0dwpn70m8sx3340eer0s06khh005vm8s4yadmuj6t74clnxf3dujvmqc0sequ2h44ngx9wmwwzwfh633mrvzk0kkx93
```

**TXID:** _pending_
**Status:** _pending_

---

## Step 6: Spend Act 9 P2SH to Simple P2SH

**Script:** `spend-act9-to-simple-p2sh.js` (needs UTXO update)
**From:** Act 9 P2SH (`t3R9vniLa2HoRXXcf6reywZfwRJiHQVhoQJ`)
**To:** Simple P2SH (`t3MczrqvRWXSNAFtxt3dqvJPwZ7rmHECoRs`)
**Amount:** 608,034 zatoshis (0.00608034 ZEC after 0.0001 fee)

**UTXO (update after Step 4):**
```javascript
const UTXO = {
  txid: '<DESHIELD_TXID>',
  vout: 0,
  amount: 618034,
  scriptPubKey: 'a914484dce376d8c540f28fbceeb9dc9215868b3054587',
};

// Act 9 Redeem Script: OP_9 OP_DROP <pubkey> OP_CHECKSIG
const ACT9_REDEEM_SCRIPT = '59752103845d673f785ea0f19d6d8507f0ff409b88b3aadf0aa7a784e89572e19b12f7d0ac';

// Simple P2SH destination (t3MczrqvRWXSNAFtxt3dqvJPwZ7rmHECoRs)
const SIMPLE_P2SH_SCRIPT_PUBKEY = 'a914218bee8db33ab5a93db1439217ad0e9497cc7bc987';

// Act P2SH private key
const PRIVATE_KEY_WIF = 'KzoH5Lehi3AM4TagFAto1V3Pj18hsMR4oNDMf5oDzskJeTi2xty1';
```

**Command:**
```bash
node spend-act9-to-simple-p2sh.js
```

**TXID:** _pending_
**Status:** _pending_

---

## Step 7: Inscription Transaction

**Script:** `inscribe-act9.js` (needs UTXO update after Step 6)
**From:** Simple P2SH (`t3MczrqvRWXSNAFtxt3dqvJPwZ7rmHECoRs`)
**To:** Treasury t1 (`t1aMR9MKx3xLso9c4Uq4MYX3cRvnDTp42av`)
**Amount:** ~578,034 zatoshis (after 30,000 inscription fee)

**UTXO (update after Step 6):**
```javascript
const UTXO = {
  txid: '<SPEND_ACT9_TXID>',
  vout: 0,
  amount: 608034,
  scriptPubKey: 'a914218bee8db33ab5a93db1439217ad0e9497cc7bc987',
};

// Simple P2SH Redeem Script: OP_DROP <pubkey> OP_CHECKSIG
const REDEEM_SCRIPT = '752103a92c73b25ec06cdb7d70aaaef178a1ede2969f11169f332b56a5bfed47c66223ac';

// Simple P2SH private key
const PRIVATE_KEY_WIF = 'KwJH8HidEKxGUsK2PhRcg3ZXFewnoDvaTYkmhuTjrsM45ehCsFbm';
```

**Command:**
```bash
node inscribe-act9.js
```

**Inscription Content Format:**
```
STM-rpp[v01]|ACT:9|E:🛡️ → 🛡️⚡ → 💰🔒 → 🕶️🦓|The inscription is not concealment but covenant—sovereignty lies in the inversion: wisdom public, earnings private; stakes visible, methods hidden; comprehension proving what capital cannot, enforced by mathematics alone.|MS:0.86|H:<BILATERAL_HASH>|REF:<SHIELDED_TXID>
```

**Bilateral Hash Formula:**
```javascript
// H = SHA256(ORACLE_PROVERB + SUBMITTED_PROVERB)[0:16]
const oracleProverb = "The two-faced shield is not duplicitous but sovereign—for true power lies not in choosing privacy or transparency, but in wielding both with mathematical certainty, where comprehension proves personhood.";
const submittedProverb = "The inscription is not concealment but covenant—sovereignty lies in the inversion: wisdom public, earnings private; stakes visible, methods hidden; comprehension proving what capital cannot, enforced by mathematics alone.";
const combined = oracleProverb + submittedProverb;
const hash = crypto.createHash('sha256').update(combined).digest('hex').substring(0, 16);
// Result: ef738a3fb385ddc2
```

**TXID:** _pending_
**Block Height:** _pending_
**Status:** _pending_

---

## Step 8: Verification

**Scan Command:**
```bash
node scan-inscriptions.js
```

**Verification Checklist:**
- [ ] Inscription found in scriptSig
- [ ] Content correctly parsed
- [ ] Indexed in database
- [ ] Visible in API response

**Explorer Link:** _pending_

---

## Summary

| Step | Status | TXID | Block |
|------|--------|------|-------|
| Submission | ⏳ Waiting | | |
| Deshield | ⏳ Pending | | |
| Fee Split | ⏳ Pending | | |
| Act→Simple | ⏳ Pending | | |
| Inscription | ⏳ Pending | | |

**Match Score:** 0.86 (86%)
**Total Time:** _pending_
**Final Inscription TXID:** _pending_

---

*Chronicle generated by Oracle Swordsman - Privacy Spellbook Demo*
