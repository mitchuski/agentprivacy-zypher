# Zallet Wallet Reflection - Oracle Swordsman Protocol

**Date:** 2025-12-03
**Context:** Post-hackathon reflection on Zallet integration for STM-rpp inscription flow

---

## What We Built

The Oracle Swordsman protocol uses Zallet as the shielded wallet backend for receiving proverb submissions and managing the golden split distribution. The flow involves:

1. **Receive** - Shielded proverbs arrive at Oracle UA with encrypted memos
2. **Verify** - NEAR AI validates proverb alignment with spellbook
3. **Split** - Golden ratio (61.8%/38.2%) divides funds
4. **Deshield** - 61.8% moves to transparent Act P2SH for inscription
5. **Reserve** - 38.2% stays shielded in Protocol Fee Reserve account

---

## Key Discoveries & Pain Points

### 1. Memo Decryption Confusion

**Problem:** We spent significant time trying to read memos. `z_listunspent` returned garbled hex (`f6000...`) instead of decrypted text.

**Discovery:** `z_listtransactions` with Account UUID returns fully decrypted memos, but:
- Requires UUID, not account number
- Not obvious from documentation
- `z_listreceivedbyaddress` also works but different output format

**Improvement Suggestion:**
- Zallet should have a dedicated `z_getmemo` RPC call that takes txid
- Or standardize memo decryption across all listing methods
- Document which methods return decrypted vs encrypted memos

### 2. z_sendmany Parameter Confusion

**Problem:** Multiple failed attempts with different parameter combinations:
- Account number `0` → "invalid type: integer 0, expected a string"
- Account UUID → "Invalid from address: should be a taddr, zaddr, UA"
- Fee parameter → "fee field must be null"

**Discovery:** Must use FULL UA address as `from`, and fee MUST be `null`.

**Improvement Suggestions:**
- Accept account number OR UUID for convenience (internally resolve to UA)
- Better error messages: "Use z_getaddressforaccount to get the UA for sending"
- Document the exact parameter types expected

### 3. No Re-shielding Path for Treasury t1

**Problem:** After inscription, funds land at treasury t1 address (`t1aMR9MKx3xLso9c4Uq4MYX3cRvnDTp42av`). This is a transparent address managed by Zebra, NOT Zallet.

**Current State:**
- Zallet manages shielded accounts (Account 0, Account 1, etc.)
- Treasury t1 is a separate key in Zebra wallet
- No easy way to re-shield these funds back into Zallet

**Improvement Suggestions:**
1. **Import t1 into Zallet** - Allow importing transparent keys into Zallet accounts
2. **Unified Wallet** - Single wallet managing both shielded and transparent
3. **Auto-reshield** - Option to automatically shield incoming t1 funds to an account
4. **Cross-wallet RPC** - Command to shield from Zebra t-addr to Zallet UA

### 4. Account Address Rotation

**Problem:** Zallet rotates UA addresses internally for privacy. This initially confused us when addresses didn't match expectations.

**Discovery:** Use `z_getaddressforaccount` to get current UA for any account by UUID.

**Improvement Suggestion:**
- Clearer documentation on address rotation behavior
- Option to "pin" a specific address for receiving (opt-out of rotation)
- Show address history per account

### 5. Two-Wallet Architecture Friction

**Current Architecture:**
```
Zallet (port 28232)          Zebra (port 8233)
├── Account 0 (Treasury UA)   ├── t1aMR9MKx3xLso9c4Uq4MYX3cRvnDTp42av
├── Account 1 (Fee Reserve)   └── (raw tx broadcast only)
└── Shielded pools
```

**Pain Points:**
- Must track which wallet owns which keys
- Different RPC ports and auth methods
- Funds get "stuck" in t1 without re-shield path
- Have to manually coordinate between both

**Improvement Suggestions:**
1. **Single RPC endpoint** - Zallet proxies Zebra for transparent operations
2. **Unified key management** - Import/export between the two
3. **Flow-aware commands** - e.g., `z_inscribe` that handles the full deshield→P2SH→inscription→reshield flow

---

## Security Considerations

### Current Separation (Good)
- TEE key ceremony generated fresh keys in isolation
- WIF stored separately in `t_keys_zypher/`
- Zallet seed phrase separate from inscription keys
- P2SH scripts use dedicated pubkey, not Zallet keys

### Potential Improvements

1. **Hardware Wallet Integration**
   - Sign inscription transactions with hardware wallet
   - Zallet manages viewing, hardware signs spending

2. **Multi-sig P2SH**
   - Require 2-of-3 for high-value inscriptions
   - Oracle + Protocol + Emergency key

3. **Time-locked Re-shielding**
   - Automatic sweep of t1 funds after N blocks
   - Reduces transparent exposure window

4. **Viewing-only Mode**
   - Zallet instance that can decrypt memos but not spend
   - Separate spending instance with stricter access

---

## Convenience Features Wishlist

### 1. `z_getmemo <txid>`
Get decrypted memo for any transaction in wallet.
```javascript
z_getmemo("809c2535d1c5ddb18f13492227bcf024ae31867bd0fbb81d36b377fccebfaaaa")
// Returns: "[rpp-v1]\n[act-xi-balanced-spiral-of-sovereignty]..."
```

### 2. `z_shield <from_taddr> <to_account>`
Shield funds from any transparent address to Zallet account.
```javascript
z_shield("t1aMR9MKx3xLso9c4Uq4MYX3cRvnDTp42av", "0b8919a5-441b-4b63-a40f-fb0163e369a2")
```

### 3. `z_sendmany` with Account Reference
Accept account number or UUID directly, not just full UA.
```javascript
z_sendmany(0, [...])  // Use account 0
z_sendmany("0b8919a5-441b-4b63-a40f-fb0163e369a2", [...])  // Use UUID
```

### 4. `z_listpending`
Show all pending/unprocessed incoming transactions with memos.
```javascript
z_listpending()
// Returns only transactions not yet "processed" by oracle
```

### 5. `z_inscriptionflow`
High-level command for the full inscription workflow.
```javascript
z_inscriptionflow({
  incoming_txid: "809c25...",
  act_number: 11,
  act_p2sh: "t3eEy9gLy4o5Y62zBu2QEherULxfajFTz5R",
  simple_p2sh: "t3MczrqvRWXSNAFtxt3dqvJPwZ7rmHECoRs",
  treasury_t1: "t1aMR9MKx3xLso9c4Uq4MYX3cRvnDTp42av",
  inscription_content: "STM-rpp[v01]|ACT:11|..."
})
// Handles: deshield → Act P2SH → Simple P2SH → inscription → returns txid
```

---

## Architecture Diagram

```
                                    ┌─────────────────────┐
                                    │   Seeker Wallet     │
                                    │   (Any Zcash)       │
                                    └──────────┬──────────┘
                                               │
                                    0.01 ZEC + Memo (Proverb)
                                               │
                                               ▼
┌──────────────────────────────────────────────────────────────────────┐
│                         ZALLET (Port 28232)                          │
│  ┌────────────────────────────────────────────────────────────────┐  │
│  │ Account 0 - Treasury UA                                        │  │
│  │ UUID: 0b8919a5-441b-4b63-a40f-fb0163e369a2                     │  │
│  │ Receives: Incoming proverbs (shielded)                         │  │
│  │ Sends: 61.8% to Act P2SH, 38.2% to Account 1                  │  │
│  └────────────────────────────────────────────────────────────────┘  │
│  ┌────────────────────────────────────────────────────────────────┐  │
│  │ Account 1 - Protocol Fee Reserve                               │  │
│  │ UUID: 1092061e-c983-4b2d-a30f-3e07648e42f6                     │  │
│  │ Receives: 38.2% golden split (shielded)                        │  │
│  │ Purpose: Future protocol development, gas reserve              │  │
│  └────────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────────┘
                                               │
                              61.8% Deshield to Act P2SH
                                               │
                                               ▼
┌──────────────────────────────────────────────────────────────────────┐
│                    TRANSPARENT LAYER (P2SH Chain)                    │
│                                                                      │
│   Act P2SH ──────────► Simple P2SH ──────────► Treasury t1          │
│   (OP_N OP_DROP        (OP_DROP                (P2PKH)              │
│    <pk> CHECKSIG)       <pk> CHECKSIG)                              │
│                              │                                       │
│                    Inscription Envelope                              │
│                    in scriptSig                                      │
└──────────────────────────────────────────────────────────────────────┘
                                               │
                                               ▼
                              ┌─────────────────────────┐
                              │   Treasury t1           │
                              │   t1aMR9MKx...          │
                              │   (ZEBRA - Port 8233)   │
                              │                         │
                              │   ⚠️ NO RE-SHIELD PATH  │
                              │   Funds accumulate here │
                              └─────────────────────────┘
```

---

## Note: Treasury t1 as Transparent Commitment Pool

The treasury t1 address accumulating inscription change is actually a **feature, not just a limitation**. It serves as a **transparent commitment pool** - publicly verifiable proof that:

1. **Inscriptions occurred** - Every inscription leaves a trace in t1
2. **Funds are accounted** - Golden split distributions are auditable onchain
3. **Protocol revenue is real** - Anyone can verify the treasury balance

This transparency is valuable for protocol legitimacy. However, the **re-shielding capability** becomes critical for the next phase:

### Guardian Fee Distribution (Future)

When redistributing protocol fees to Spellbook Guardians (maintainers), we'll need:

```
Treasury t1 ──► Shield to Zallet ──► Distribute to Guardian UAs (shielded)
```

**Why shielded distribution matters:**
- Guardian identities stay private
- Individual payment amounts hidden
- Only total outflow visible (if even that)

**Current blocker:** No `z_shield` command to bring t1 funds back into Zallet.

**Workarounds to explore:**
1. Import t1 private key into Zallet (if supported)
2. Use Zebra's `z_shieldcoinbase` or similar (if it works for t-addr)
3. Manual: Send t1 → new Zallet UA via raw transaction
4. Build custom shielding script using librustzcash

This is a key infrastructure piece for the Guardian economics layer.

---

## Summary

Zallet is a powerful shielded wallet but the integration required significant trial-and-error to understand:
- RPC parameter expectations (UA not account number)
- Memo decryption methods (z_listtransactions with UUID)
- Account rotation behavior
- Two-wallet coordination (Zallet + Zebra)

The main limitation is the **lack of re-shielding path** from treasury t1 back to Zallet. This creates a growing pool of transparent funds that breaks the privacy loop.

For a production Oracle system, we'd want:
1. Single unified wallet managing both shielded and transparent
2. Automatic or one-command re-shielding
3. Better documentation on RPC parameter types
4. Higher-level commands for common flows

Despite the friction, the system works. Three Acts inscribed successfully today, proving the protocol is viable. The improvements above would make it faster and more secure.

---

*Reflection written after completing Acts 10, 11, 12 inscriptions*
*Protocol: STM-rpp v01 | Oracle Swordsman | Privacy Spellbook*
