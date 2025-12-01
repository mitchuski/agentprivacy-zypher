# Project Status

**Proof of Proverb Revelation Protocol** (AgentPrivacy's Zypherpunk Implementation) | Zypherpunk Hack 2025

---

## Infrastructure

| Service | Port | Status |
|---------|------|--------|
| Zebra (Full Node) | 8233 | Running |
| Zallet (Wallet) | 28232 | Running |
| Backend API | 3001 | Running |
| Frontend | 5000 | Running |

---

## Component Status

| Component | Status | Notes |
|-----------|--------|-------|
| Zcash integration | ✅ Complete | Zebra + Zallet architecture |
| Inscription scripts (Acts 1-12) | ✅ Complete | ZIP-244 sighash, P2SH, Ordinals-style |
| AI verification | ✅ Complete | NEAR Cloud AI integrated |
| Spellbook (IPFS) | ✅ Complete | v4.0.0-canonical |
| Frontend | ✅ Complete | Next.js app (port 5000) |
| Backend API | ✅ Complete | Express/TypeScript (port 3001) |
| Database | ✅ Complete | PostgreSQL schema |
| Proverbs Gallery | ✅ Complete | On-chain inscription viewer |
| MCP Agent Actions | ✅ Complete | Human-in-the-loop mechanism |
| A2A Trust Flows | ✅ Complete | Agent-to-agent information flows |
| End-to-end flow | ✅ Complete | Production-ready |

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│              Backend (Oracle Swordsman)                  │
│                    Port: 3001                            │
└──────────────┬──────────────────────┬───────────────────┘
               │                      │
       ┌───────▼────────┐      ┌──────▼────────┐
       │  Zallet RPC    │      │  Zebra RPC    │
       │  (Wallet)      │      │  (Blockchain) │
       │  Port: 28232   │      │  Port: 8233   │
       └───────┬────────┘      └───────┬───────┘
               │                       │
               └───────────┬───────────┘
                           ▼
                   ┌───────────────┐
                   │    Zebra      │
                   │  (Full Node)  │
                   └───────────────┘
```

---

## Key Files

### Frontend (`src/`)
- `app/page.tsx` - Landing page
- `app/story/page.tsx` - Story reader (12 acts + 30 zero tales)
- `app/mage/page.tsx` - Soulbae chat (Mage agent)
- `app/proverbs/page.tsx` - Proverbs gallery (on-chain inscriptions)
- `components/SwordsmanPanel.tsx` - Donation UI
- `components/DonationFlow.tsx` - 5-step donation flow

### Backend (`oracle-swordsman/src/`)
- `api.ts` - Express API server
- `database.ts` - PostgreSQL connection
- `transaction-monitor.ts` - Event-based transaction scanning
- `memo-parser.ts` - Multi-format memo parsing
- `nearcloudai-verifier.ts` - AI verification
- `golden-split.ts` - Golden ratio calculator
- `inscription-builder.ts` - Inscription creation
- `signing-service.ts` - Transaction signing
- `rpc-client.ts` - Zcash RPC client

---

## Quick Commands

```powershell
# Check backend health
Invoke-WebRequest -Uri http://localhost:3001/health

# Check ports
netstat -ano | findstr ":8233"
netstat -ano | findstr ":28232"

# Start backend
cd oracle-swordsman && npm run dev

# Start frontend
npm run dev
```

---

## Spellbook

- **Version**: 4.0.0-canonical
- **IPFS CID**: `bafkreiesrv2eolghj6mpbfpqwnff66fl5glevqmps3q6bzlhg5gtyf5jz4`
- **Acts**: 12 (with proverbs for each)

---

## Related Docs

- `README.md` - Project overview
- `PROJECT_STATE_AND_REVIEW.md` - Comprehensive project state and review
- `QUICKSTART.md` - Setup guide
- `HOW_IT_WORKS.md` - Technical deep dive
- `PROJECT_OVERVIEW.md` - Full architecture
- `oracle-swordsman/README.md` - Backend docs

## Project Context

**Proof of Proverb Revelation Protocol** is the Zypherpunk Hack 2025 implementation of the broader **AgentPrivacy** project. This is the first concrete expression of AgentPrivacy's dual-agent architecture, demonstrating privacy-preserving AI verification through a novel proof-of-understanding donation protocol.
