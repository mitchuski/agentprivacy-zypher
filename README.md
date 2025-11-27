# Proverb Revelation Protocol

**Privacy-first proverb inscription protocol with AI verification and TEE-enforced security**

Version 4.0 | November 2024

---

## Overview

A protocol where users prove understanding of privacy concepts by submitting wisdom (proverbs), verified by AI, and permanently inscribed on the Zcash blockchain with hardware-enforced privacy guarantees.

### Core Components

- **Zcash**: Shielded transactions + on-chain inscriptions
- **Nillion**: TEE (Trusted Execution Environment) for key isolation
- **NEAR Cloud AI**: AI-powered intelligent verification
- **IPFS/Pinata**: Decentralized, immutable knowledge storage
- **PostgreSQL**: Operational data tracking

### Architecture

```
USER → Mage Agent (web UI)
         ↓
       Zcash SHIELDED (z→z) to Oracle z-addr
       (0.01 ZEC + encrypted proverb memo)
         ↓
       Oracle Swordsman (Nillion TEE)
         ├→ Decrypt memo, extract proverb
         ├→ Fetch Spellbook → IPFS/Pinata
         ├→ Verify Proverb → NEAR Cloud AI
         └→ Sign Transaction → SecretSigner
         ↓
       Blockchain (PUBLIC inscription on t-addr for spellbook)
       (Proverb + proof of revelation)
```

### Economic Model

**61.8/38.2 Split**:
- User sends 0.01 ZEC via SHIELDED transaction (z→z) to oracle
- Oracle verifies proverb matches spellbook
- Oracle creates PUBLIC inscription on transparent address (spellbook):
  - **61.8%** (0.00618 ZEC) → **t-address** with OP_RETURN inscription (proverb + proof)
  - **38.2%** (0.00382 ZEC) → **z-address** (shielded pool)
- Mathematical balance between transparency and privacy

---

## Signal-to-Sanctuary Donation Flow

The protocol implements a complete donation flow with cryptographic key separation:

1. **User Journey**: Read story → Form proverb → Copy → Paste → Copy memo → Send via Zashi
2. **Oracle (Viewing Key)**: Detects transaction, reads memo, fetches canonical proverb from IPFS, performs semantic match
3. **Signer (Spending Key)**: Upon verification, executes golden split:
   - **61.8%** → **t-address** with OP_RETURN inscription (visible signal)
   - **38.2%** → **z-address** (shielded protocol fee)

**Key Separation**: Viewing key (Oracle) can see but cannot spend. Spending key (Signer) can spend but only upon verified signal. Mathematical separation, not policy-based trust.

**Implementation**: See `PRODUCTION_TEST_GUIDE.md` for complete testing instructions with zebrad node.

---

## Quick Start

### For Developers

```bash
# 1. Clone repository
git clone https://github.com/mitchuski/agentprivacy-zypher
cd agentprivacy-zypher

# 2. Read setup guide
cat 01-SETUP.md

# 3. Install prerequisites (see 01-SETUP.md for details)
# Install Rust, Node.js 20, PostgreSQL, zecwallet-cli

# 4. Configure environment
# Create .env file with API keys (see 01-SETUP.md)

# 5. Start building
cat 03-BUILD_GUIDE.md

# 6. Run frontend (development)
cd agentprivacy-ai-firstmage
npm install
npm run dev  # Runs on http://localhost:5000
```

### For AI Coding Agents

The documentation is structured for sequential processing:

1. **Start here**: `01-SETUP.md` - Installation and prerequisites
2. **Then read**: `02-ARCHITECTURE.md` - System design and data flow
3. **Then follow**: `03-BUILD_GUIDE.md` - Step-by-step implementation
4. **Reference**: `04-API_REFERENCE.md` - Code patterns and APIs
5. **Track progress**: `05-ROADMAP.md` - Integration checklist
6. **Complete guide**: `DEVELOPER_GUIDE.md` - Comprehensive developer reference

---

## Documentation Structure

```
agentprivacy-zypher/
├── README.md                          # This file - start here
├── 01-SETUP.md                       # Prerequisites and installation
├── 02-ARCHITECTURE.md                # System design and security model
├── 03-BUILD_GUIDE.md                 # Step-by-step implementation
├── 04-API_REFERENCE.md               # Code templates and patterns
├── 05-ROADMAP.md                     # Integration checklist and timeline
├── CONTRIBUTING.md                   # Contribution guidelines
├── DEVELOPER_GUIDE.md                # Complete developer reference
├── QUICKSTART.md                     # 30-minute quick start
├── DOCUMENTATION_COMPARISON_REPORT.md # Documentation audit report
├── agentprivacy-ai-firstmage/        # Frontend (Next.js)
│   └── README.md                     # Frontend-specific guide
├── oracle-swordsman/                 # Backend TEE worker (Nillion)
│   └── README.md                     # Backend-specific guide
├── scripts/                          # Automation scripts
└── spellbook/                        # Knowledge base (IPFS)
```

**Comprehensive Documentation Available**: This repository includes extensive documentation covering setup, architecture, development, production deployment, and integration guides. See the documentation files listed above for complete details.

---

## Key Features

### Privacy-First Architecture

- **Hardware Isolation**: Zcash keys stored in Nillion SecretSigner (distributed MPC)
- **Zero-Trust Design**: AI has no key access, knowledge base has no key access
- **Verifiable Security**: AMD SEV-SNP attestation + threshold ECDSA signing

### AI-Powered Verification

- **openai/gpt-oss-120b**: Sophisticated natural language understanding via NEAR Cloud AI
- **Quality Scoring**: Contextual wisdom assessment
- **Spellbook Matching**: Validates understanding of privacy concepts

### Production-Ready Patterns

- **Light Client**: 4-hour sync (vs 48-hour full node)
- **Error Handling**: Robust retry logic and status tracking
- **Monitoring**: Comprehensive logging and alerting

---

## Tech Stack

### Blockchain & Privacy
- **Zcash**: Mainnet for production, testnet for development
- **zecwallet-cli**: Light client from ZyberQuest patterns
- **Privacy Pools**: Future enhancement for compliance

### Trusted Execution
- **Nillion nilCC**: AMD SEV-SNP confidential VMs
- **SecretSigner**: Distributed key storage and threshold signing
- **Attestation**: Verifiable remote attestation

### AI & Knowledge
- **NEAR Cloud AI**: AI verification API
- **IPFS/Pinata**: Content-addressed storage
- **Notion**: Optional archival and management

### Infrastructure
- **PostgreSQL**: Operational database
- **Next.js**: Frontend framework
- **FastAPI/Express**: Backend API
- **Docker**: Optional containerization

---

## Costs

### Development (Testnet)
- VPS: $24/month
- All else: Free tiers
- **Total: ~$24/month**

### Production (Mainnet)
- VPS: $24/month
- Nillion: ~$50/month (TEE compute)
- NEAR Cloud AI: ~$0.03/proverb (AI API)
- Pinata: $20/month (IPFS pinning)
- **Total: ~$94/month + $0.03/proverb**

At 100 proverbs/month: ~$97/month total

---

## Timeline

| Phase | Duration | Outcome |
|-------|----------|---------|
| **Setup** | 1-2 days | Environment ready |
| **Foundation** | 1 week | Zcash + DB working |
| **Backend** | 1-2 weeks | TEE + AI integrated |
| **Frontend** | 1 week | Complete system |
| **Testing** | 3-5 days | Production-ready |
| **Launch** | 1 day | Live! |

**Total**: 3-4 weeks from start to production

---

## Security Model

### Three-Layer Isolation

**Layer 1: TEE (Nillion)**
- Zcash spending keys in SecretSigner
- AMD SEV-SNP hardware isolation
- Distributed MPC (no single point of compromise)
- Verifiable attestation

**Layer 2: AI (NEAR Cloud AI)**
- Receives verification requests
- Returns quality scores
- **NO access to keys**

**Layer 3: Knowledge (IPFS)**
- Stores spellbook acts
- Content-addressed (immutable)
- **NO access to keys**

### Mathematical Guarantees

- Keys cannot be extracted from TEE (hardware enforced)
- AI cannot reconstruct keys (architectural separation)
- 38.2% funds remain private forever (Zcash shielded pool)

---

## Use Cases

### Primary
- **Privacy advocates**: Prove understanding of privacy concepts
- **Developers**: Build reputation systems on privacy-first rails
- **Researchers**: Study privacy-preserving architectures

### Future
- **AI agents**: Demonstrate privacy comprehension
- **DAOs**: Gate membership by knowledge verification
- **Education**: Certify privacy training completion

---

## Project Status

**Current**: v4.0.0-canonical - Complete architecture with integrations
**Stage**: ~85% Complete - Core integrations working, testing in progress
**Spellbook**: Version 4.0.0-canonical (IPFS CID: `bafkreiesrv2eolghj6mpbfpqwnff66fl5glevqmps3q6bzlhg5gtyf5jz4`)
**License**: MIT (open source)
**Hackathon**: Integrates ZyberQuest, Nillion, NEAR Cloud AI ecosystem

### Current Integration Status

✅ **Complete**:
- Zcash light client integration (fixed for Windows compatibility)
- PostgreSQL database with full schema
- IPFS/Pinata spellbook storage (v4.0.0-canonical)
- NEAR Cloud AI verification configured
- Memo parser (multi-format support)
- Transaction monitor and builder
- Comprehensive utilities and logging

⏳ **In Progress**:
- Nillion TEE integration (API key pending, optional for now)
- End-to-end testing
- Frontend-backend integration

**Last Updated**: Nov 26 2025

---

## Getting Started

### For Humans

1. Read `01-SETUP.md` to understand prerequisites
2. Read `02-ARCHITECTURE.md` to understand the system
3. Follow `03-BUILD_GUIDE.md` to implement step-by-step
4. Reference `04-API_REFERENCE.md` when coding
5. Track progress with `05-ROADMAP.md`
6. See `DEVELOPER_GUIDE.md` for complete reference

### For AI Agents

Process documents sequentially (01 → 02 → 03 → 04 → 05). Each document provides explicit instructions and code templates. Use `04-API_REFERENCE.md` as your primary code generation reference.

---

## Key Innovations

### 1. Dual-Agent Architecture
- **Swordsman** (Oracle): Privacy and boundary enforcement
- **Mage** (Agent): Delegation and user interface
- Mathematical separation guarantees

### 2. Hardware-Enforced Privacy
- Not just software isolation
- Actual hardware guarantees (AMD SEV-SNP)
- Verifiable through attestation

### 3. AI-Powered Verification
- Sophisticated NLP understanding
- Context-aware quality scoring
- Scales beyond simple pattern matching

### 4. Immutable Knowledge
- IPFS content addressing
- Verifiable spellbook integrity
- Distributed storage

---

## Community & Support

### Resources
- **Documentation**: This repository
- **Nillion**: https://discord.gg/nillion (#developers)
- **ZyberQuest**: https://github.com/Soymaferlopezp/zyberquest
- **NEAR Cloud AI**: https://cloud.near.ai
- **IPFS/Pinata**: https://www.pinata.cloud

### Contact

- **Email**: mage@agentprivacy.ai
- **Security Issues**: security@proverbprotocol.com
- **GitHub**: https://github.com/mitchuski/agentprivacy-zypher

### Contributing

Contributions welcome! Please read contributing guidelines and submit PRs.

---

## License

MIT License - See LICENSE file for details

---

## Acknowledgments

**Built on patterns from**:
- **ZyberQuest**: Production Zcash light client patterns
- **NEAR Cloud AI**: AI verification integration
- **NEAR Cloud AI**: AI verification integration
- **BGIN**: Blockchain governance principles

---

## Next Steps

1. **Read**: `01-SETUP.md` - Get your environment ready
2. **Understand**: `02-ARCHITECTURE.md` - Learn the system
3. **Build**: `03-BUILD_GUIDE.md` - Implement step-by-step
4. **Deploy**: Follow production deployment guide
5. **Launch**: Start inscribing proverbs! 🗡️🪄

---

## Documentation Overview

This repository contains comprehensive documentation:

- **Setup & Installation**: `01-SETUP.md`, `QUICKSTART.md`
- **Architecture & Design**: `02-ARCHITECTURE.md`, `DEVELOPER_GUIDE.md`
- **Implementation**: `03-BUILD_GUIDE.md`, `04-API_REFERENCE.md`
- **Project Management**: `05-ROADMAP.md`, `CONTRIBUTING.md`
- **Frontend**: `agentprivacy-ai-firstmage/README.md`
- **Backend**: `oracle-swordsman/README.md`
- **Production**: `PRODUCTION_READINESS.md`, `PRODUCTION_TEST_GUIDE.md`

**Questions?** Open an issue or check the documentation files listed above.

**Ready to build?** Start with `01-SETUP.md`
