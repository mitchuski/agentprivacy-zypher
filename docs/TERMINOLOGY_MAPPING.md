# Terminology Mapping Guide

**Updating Implementation Documentation to Canonical Standards**

**Reference**: [Glossary v2.1], [Whitepaper v4.3], [Tokenomics v2.0]

---

## Critical Terminology Changes

### Per [Glossary v2.1, §13 Forbidden Terms]

| ❌ Old Term | ✅ Canonical Term | Context | Reason |
|------------|------------------|---------|--------|
| user | **First Person** | All contexts | "User" implies being used by system |
| customer | **First Person** | All contexts | Implies commercial relationship |
| account | **First Person** | All contexts | Reduces to database entry |
| donation | **Signal** | 0.01 ZEC payment | Signal implies proof of comprehension |
| donation address | **Signal address** | z-address for receiving | Consistency with signal terminology |
| donation flow | **Signal flow** | UI component | Consistency |
| DonationFlow.tsx | **SignalFlow.tsx** | Component name | Code consistency |
| SwordsmanPanel | **SignalPanel** | Component name | More accurate to function |
| log | **Chronicle** | Record keeping | Adds narrative quality |
| transaction | **Signal** | When 0.01 ZEC | Only for comprehension proofs |
| Agent 1/Agent 2 | **Swordsman/Mage** | Agent naming | Preserves architectural meaning |
| validator | **Guardian** | Infrastructure | Guardian implies protection |

---

## Economic Parameters

### Standardized Values [Tokenomics v2.0]

| Parameter | Value | Usage |
|-----------|-------|-------|
| **Signal Fee** | 0.01 ZEC ($5) | Ongoing proof of comprehension |
| **Ceremony Fee** | 1 ZEC ($500) | One-time agent pair genesis |
| **ZEC Price Basis** | $500 USD | Standardized for calculations |
| **Transparent Split** | 61.8% | Golden ratio (1/φ) |
| **Shielded Split** | 38.2% | Remainder (1 - 1/φ) |
| **Compression Base** | 70:1 | Variable per context |

### Fee Split Terminology

| ❌ Old | ✅ Canonical | Purpose |
|-------|-------------|---------|
| public portion | **Transparent Pool** | Public blockchain inscription |
| private portion | **Shielded Pool** | Protocol operations |
| sanctuary | **Transparent Pool** | More precise terminology |
| fee | **Shielded Pool** | Consistent with tokenomics |

---

## Trust Tier Names

### Per [Tokenomics v2.0, §5]

| Symbol | Tier Name | Signals | Note |
|--------|-----------|---------|------|
| 🗡️ | **Blade** | 0-50 | NOT "Blade Armor" |
| 🛡️ | **Light** | 50-150 | NOT "Light Armor" |
| ⚔️ | **Heavy** | 150-500 | NOT "Heavy Armor" |
| 🐉 | **Dragon** | 500+ | NOT "Dragon Armor" |

---

## Agent Naming

### Dual-Agent Architecture [Whitepaper v4.3, §3]

| Technical | Narrative | Symbol | Role |
|-----------|-----------|--------|------|
| Agent S | **Soulbis** | ⚔️ | Privacy enforcement, boundaries |
| Agent M | **Soulbae** | 🧙‍♂️ | Delegation, projection |

**Usage Guidelines:**
- Use **Swordsman/Mage** in technical/architectural contexts
- Use **Soulbis/Soulbae** in narrative contexts
- Always clarify which layer you're referencing

---

## Code-Level Changes

### Component Renames

```
src/components/
├── DonationFlow.tsx      → SignalFlow.tsx
├── SwordsmanPanel.tsx    → SignalPanel.tsx (or keep if appropriate)
└── DonationStatus.tsx    → SignalStatus.tsx
```

### Variable Renames

```typescript
// Old
const donationAddress = "zs1...";
const donationAmount = 0.01;
const user = getCurrentUser();

// New
const signalAddress = "zs1...";
const signalAmount = 0.01;  // Per [Tokenomics v2.0]
const firstPerson = getCurrentFirstPerson();
```

### API Endpoint Updates

```typescript
// Old
POST /api/donate
GET /api/donations

// New
POST /api/signal
GET /api/signals
```

---

## Document Version Citations

### Format

When referencing across documents, use:

```markdown
[Whitepaper v4.3, §Section]
[Research Paper v3.2, Theorem 2.2]
[Glossary v2.1, Term Name]
[Spellbook v4.0.1, Act N]
[Tokenomics v2.0, §Section]
```

### Example Usage

```markdown
The golden split follows the canonical parameters [Tokenomics v2.0, §2]:
- 61.8% to Transparent Pool
- 38.2% to Shielded Pool
```

---

## Status Indicators

### Per [Glossary v2.1, §Status Indicators]

| Indicator | Meaning | Usage |
|-----------|---------|-------|
| ✅ PROVEN | Mathematically established | Research paper claims |
| 🔧 IMPLEMENTED | Working in reference implementation | Code status |
| 🚧 WIP | Under active development | In-progress features |
| 📋 PLANNED | Designed but not yet built | Roadmap items |
| 🔬 SPECULATIVE | Hypothesis requiring validation | Conjectures |

---

## Search & Replace Patterns

### Global Replacements (Case-Sensitive)

```
user → First Person
User → First Person
users → First Persons
donation → signal
Donation → Signal
donations → signals
```

### Context-Aware Replacements

```
# Only when referring to 0.01 ZEC payment
"donation flow" → "signal flow"
"donation address" → "signal address"
"donation amount" → "signal amount"

# Keep "donation" if referring to general concept
# Replace with "contribution" or "signal" based on context
```

### Code Replacements

```typescript
// File names
DonationFlow.tsx → SignalFlow.tsx

// Class/function names
processDonation() → processSignal()
DonationStatus → SignalStatus

// Variables
donationTx → signalTx
donationMemo → signalMemo
```

---

## Verification Checklist

After updates, verify:

- [ ] No instances of "user" (except in technical contexts like "user agent")
- [ ] No instances of "donation" referring to 0.01 ZEC
- [ ] All economic parameters match [Tokenomics v2.0]
- [ ] Trust tiers use correct names (no "Armor" suffix)
- [ ] Version citations present in key sections
- [ ] Master inscription appears: `⚔️ ⊥ 🧙‍♂️ | 😊`

---

## Files Requiring Updates

### High Priority

1. `README.md` - Main project readme
2. `PROJECT_STATE_AND_REVIEW.md` - Comprehensive status
3. `PROJECT_OVERVIEW.md` - Hackathon submission
4. `QUICKSTART.md` - Setup guide
5. `HOW_IT_WORKS.md` - Technical flow

### Medium Priority

1. `01-SETUP.md` - Installation guide
2. `02-ARCHITECTURE.md` - System design
3. `03-BUILD_GUIDE.md` - Build instructions
4. `04-API_REFERENCE.md` - API docs
5. `05-ROADMAP.md` - Implementation roadmap

### Low Priority (Code Comments)

1. Component files in `src/components/`
2. Backend files in `oracle-swordsman/src/`
3. Test files

---

## Quick Reference Card

```
┌─────────────────────────────────────────────────────┐
│              TERMINOLOGY QUICK REFERENCE            │
├─────────────────────────────────────────────────────┤
│  user          →  First Person                      │
│  donation      →  Signal (0.01 ZEC)                 │
│  ceremony      →  Ceremony (1 ZEC, one-time)        │
│  public split  →  Transparent Pool (61.8%)          │
│  private split →  Shielded Pool (38.2%)             │
│  tiers         →  Blade → Light → Heavy → Dragon    │
│  agents        →  Swordsman (⚔️) / Mage (🧙)         │
├─────────────────────────────────────────────────────┤
│  Master Inscription: ⚔️ ⊥ 🧙‍♂️ | 😊                   │
│  "Separation preserves the First Person"            │
└─────────────────────────────────────────────────────┘
```

---

*"Privacy is Value. Take back the 7th Capital."*
