# Quick Start Guide

Get the **Proof of Proverb Revelation Protocol** running locally in under 30 minutes.

**Document Alignment**: [Glossary v2.1], [Whitepaper v4.3], [Tokenomics v2.0]

---

## Prerequisites

- **Node.js 20+** — JavaScript runtime
- **PostgreSQL** — Database for tracking
- **Zcash Infrastructure** — Either:
  - Zebra full node (port 8233) + Zallet wallet (port 28232), OR
  - zecwallet-cli light client
- **API Keys**:
  - NEAR Cloud AI (for proverb verification)
  - Pinata (for IPFS spellbook storage)

---

## 1. Clone & Install (2 min)

```bash
git clone https://github.com/mitchuski/agentprivacy-zypher
cd agentprivacy-zypher
npm install
```

---

## 2. Configure Environment (3 min)

```bash
cp .env.example .env
```

Edit `.env` with your keys:

```env
# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/agentprivacy

# Zcash
ZEBRA_RPC_URL=http://localhost:8233
ZALLET_RPC_URL=http://localhost:28232

# AI Verification (Oracle Swordsman)
NEAR_SWORDSMAN_API_KEY=your_near_cloud_ai_key

# IPFS
PINATA_JWT=your_pinata_jwt_token
SPELLBOOK_CID=bafkreigopjrfwjsz56oft7nmv26q2oddq6j4fexj27zjirzgkdeogm2myq

# Economic Parameters [Tokenomics v2.0]
SIGNAL_COST=0.01         # ZEC per signal
PUBLIC_SPLIT=0.618       # 61.8% to transparent pool
PRIVATE_SPLIT=0.382      # 38.2% to shielded pool
```

---

## 3. Setup Database (2 min)

```bash
# Create database
createdb agentprivacy

# Run migrations (if using schema file)
psql -d agentprivacy -f oracle-swordsman/schema.sql
```

---

## 4. Start Services (5 min)

### Terminal 1: Frontend (Mage Interface)
```bash
npm run dev
# Runs on http://localhost:5000
```

### Terminal 2: Backend (Oracle Swordsman)
```bash
cd oracle-swordsman
npm install
npm run dev
# Runs on http://localhost:3001
```

### Verify
- Frontend: http://localhost:5000
- Backend health: http://localhost:3001/health

---

## 5. Test the Signal Flow

The **Signal Flow** demonstrates the core protocol [Whitepaper v4.3, §RPP]:

1. **Visit** http://localhost:5000/story
2. **Read** a tale from the spellbook
3. **Click** "Learn" button to copy content into your context
4. **Navigate** to /mage to chat with Soulbae (optional assistance)
5. **Craft** a proverb expressing the tale's principle
6. **Copy** the formatted memo
7. **Send** via Zashi wallet (z→z shielded transaction, 0.01 ZEC)

---

## Architecture Overview

```
Frontend (Next.js)          Backend (Oracle Swordsman)
:5000 — Mage Interface      :3001 — Verification & Inscription
   │                           │
   └──> First Person           │
        submits proverb        │
                               │
                    Zebra RPC (:8233) ← Blockchain data
                               │
                    Zallet RPC (:28232) ← Wallet operations
                               │
                    NEAR Cloud AI ← Proverb verification
                               │
                    IPFS/Pinata ← Spellbook retrieval
```

**Dual-Agent Separation** [Whitepaper v4.3, §3]:
- **Swordsman (Oracle)**: Holds viewing key, verifies proverbs
- **Mage (Frontend)**: Helps First Persons craft proverbs, never sees transactions

---

## Key Routes

### Frontend (Mage Interface)
| Route | Purpose |
|-------|---------|
| `/` | Landing page |
| `/story` | Read tales from the spellbook |
| `/mage` | Chat with Soulbae AI |
| `/proverbs` | View inscribed proofs (VRCs) |

### Backend (Oracle Swordsman)
| Endpoint | Purpose |
|----------|---------|
| `GET /health` | Service health check |
| `POST /verify` | Verify a proverb |
| `GET /inscriptions` | List onchain inscriptions |

---

## Terminology Quick Reference

Per [Glossary v2.1]:

| Term | Definition |
|------|------------|
| **First Person** | Human whose sovereignty is protected (not "user") |
| **Signal** | 0.01 ZEC proof of comprehension (not "donation") |
| **Ceremony** | 1 ZEC one-time agent pair genesis |
| **VRC** | Verifiable Relationship Credential |
| **RPP** | Relationship Proverb Protocol |

---

## Troubleshooting

### "Cannot connect to database"
```bash
# Check PostgreSQL is running
pg_isready
# Start if needed
sudo systemctl start postgresql
```

### "Zebra RPC not responding"
```bash
# Check ports
netstat -ano | findstr :8233
netstat -ano | findstr :28232
```

### "NEAR API error"
- Verify your API key is correct
- Check rate limits on your account

---

## Next Steps

- **Deep dive**: Read `HOW_IT_WORKS.md` for architecture details
- **Backend details**: See `oracle-swordsman/README.md`
- **Full overview**: Check `PROJECT_STATE_AND_REVIEW.md`
- **Living docs**: Visit [sync.soulbis.com](https://sync.soulbis.com)

---

## Getting Help

- **Issues**: [GitHub Issues](https://github.com/mitchuski/agentprivacy-zypher/issues)
- **Zcash**: [Zcash Forum](https://forum.zcashcommunity.com/)
- **NEAR**: [NEAR Discord](https://near.chat/)
- **Project**: mage@agentprivacy.ai
