# Developer Guide - Proverb Revelation Protocol

**Complete guide for developers, contributors, and collaborators**

Version 4.0.0-canonical | December 2024

---

## Welcome

Thank you for your interest in the Proverb Revelation Protocol! This guide provides everything you need to understand, build with, or contribute to the project.

**What is this?** A privacy-first protocol where users prove understanding of privacy concepts by submitting AI-verified proverbs that are permanently inscribed on the Zcash blockchain, with hardware-enforced key isolation via Nillion TEE.

---

## Quick Links

**For Specific Teams**:
- [Pinata/IPFS Developers](./briefs/PINATA_BRIEF.md) - Immutable knowledge storage
- [Nillion Developers](./briefs/NILLION_BRIEF.md) - TEE and SecretSigner integration
- [Zcash Developers](./briefs/ZCASH_BRIEF.md) - Light client and transactions

**For Implementation**:
- [Setup Guide](../docs/01-SETUP.md) - Installation and prerequisites
- [Architecture](../docs/02-ARCHITECTURE.md) - System design
- [Build Guide](../docs/03-BUILD_GUIDE.md) - Step-by-step implementation
- [API Reference](../docs/04-API_REFERENCE.md) - Code patterns

**Quick Start**: [QUICKSTART.md](../QUICKSTART.md) - 30 minutes to running

---

## Project Overview

### The Problem

AI agents need to prove they understand privacy concepts without revealing sensitive information. Traditional approaches either:
- Rely on centralized verification (trust issue)
- Require full transparency (privacy issue)
- Lack verifiable security (proof issue)

### The Solution

A protocol that combines:
1. **Hardware-Enforced Privacy** (Nillion TEE) - Keys mathematically protected
2. **AI-Powered Verification** (NEAR Cloud AI) - Intelligent quality assessment
3. **Blockchain Permanence** (Zcash) - Immutable public record
4. **Decentralized Knowledge** (IPFS) - Censorship-resistant reference

### The Innovation

**Dual-Layer Economics**: 61.8% to t-address (transparency) + 38.2% to z-address (sustainability)

This balances:
- Public good (inscriptions are visible proof)
- Economic incentive (private pool sustains operation)
- Privacy guarantee (majority stays private)

---

## System Architecture

### High-Level Overview

```
┌────────────────────────────────────────────────────┐
│               USER (Mage Agent)                    │
│   Web interface → Write proverb → Pay 0.01 ZEC    │
└────────────────────┬───────────────────────────────┘
                     │
                     ▼
┌────────────────────────────────────────────────────┐
│              ZCASH NETWORK                         │
│   Light Client → Fast sync → Transaction monitor  │
└────────────────────┬───────────────────────────────┘
                     │
                     ▼
┌────────────────────────────────────────────────────┐
│         ORACLE SWORDSMAN (Nillion TEE)             │
│  ┌──────────────────────────────────────────────┐  │
│  │  AMD SEV-SNP Confidential Compute            │  │
│  │  ├─ Fetch Spellbook (IPFS/Pinata)           │  │
│  │  ├─ Verify Proverb (NEAR Cloud AI)           │  │
│  │  ├─ Sign Transactions (SecretSigner)        │  │
│  │  └─ Broadcast (61.8% public, 38.2% private)     │  │
│  └──────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────┘
```

### Three Security Layers

**Layer 1: TEE (Nillion)** 🔴 CRITICAL
- Purpose: Hardware isolation for Zcash keys
- Technology: AMD SEV-SNP + distributed MPC
- Guarantee: Keys mathematically cannot be extracted
- Integration: SecretSigner for threshold ECDSA signing

**Layer 2: AI (NEAR Cloud AI)** 🟡 ENHANCEMENT
- Purpose: Intelligent proverb verification
- Technology: Claude 3.5 Sonnet via API
- Benefit: Beyond simple pattern matching
- Security: No access to keys (called from within TEE)

**Layer 3: Knowledge (IPFS)** 🟢 INFRASTRUCTURE
- Purpose: Immutable spellbook storage
- Technology: IPFS with Pinata pinning
- Benefit: Decentralized, censorship-resistant
- Security: Content-addressed, no key access

---

## Data Flow (10 Steps)

```
1. USER → Mage Agent
   "Privacy requires separation, not mere policy."
   
2. Mage Agent → User Wallet
   Instructions: Send 0.01 ZEC via SHIELDED transaction (z→z) to oracle's z-addr
   Memo: Encrypted proverb in memo field
   
3. User Wallet → Zcash Network (SHIELDED)
   Shielded transaction (z→z) broadcast with encrypted memo
   Transaction is private
   
4. Zcash Network → Oracle (SHIELDED POOL)
   Oracle monitors shielded pool, detects transaction (within 30s)
   Decrypts memo to extract proverb
   
5. Oracle → IPFS (via Pinata)
   Fetch spellbook acts (<2s)
   
6. Oracle → NEAR Cloud AI
   Verify proverb against spellbook (<5s)
   Response: { quality: 0.85, act: "act-02-delegation", approved: true }
   
7. Oracle → Database
   Record verification result
   
8. Oracle → Nillion SecretSigner
   Request signatures for public inscription:
   - Public: 0.00618 ZEC to transparent address (spellbook)
   - OP_RETURN: Proverb + proof of revelation
   - Private: 0.00382 ZEC to shielded pool
   
9. Oracle → Zcash Network
   Broadcast public inscription to spellbook's transparent address
   (Proverb + proof now visible on blockchain)
   
10. Oracle → User (via Mage Agent)
    Display: "Quality score: 0.85, Inscribed! View: [blockchain link]"
    (Link shows public inscription on spellbook address)
```

**Total Time**: ~2-3 minutes from submission to confirmation

---

## Technology Stack

### Core Components

| Component | Technology | Purpose | Status |
|-----------|-----------|---------|--------|
| **Blockchain** | Zcash (testnet/mainnet) | Transaction layer | ✅ Stable |
| **Light Client** | zecwallet-cli | Fast sync | ✅ Production |
| **TEE** | Nillion nilCC | Key isolation | 🔄 Integration |
| **Signing** | SecretSigner | Distributed MPC | 🔄 Integration |
| **AI** | NEAR Cloud AI | Verification | ✅ API Ready |
| **Storage** | IPFS/Pinata | Knowledge base | ✅ Available |
| **Database** | PostgreSQL | Operations | ✅ Standard |
| **Backend** | TypeScript/Node.js | Oracle logic | 🔨 Building |
| **Frontend** | Next.js + React | User interface | 🔨 Building |

### Infrastructure

- **VPS**: DigitalOcean/AWS/Hetzner (Ubuntu 20.04+)
- **Memory**: 8GB+ RAM
- **Storage**: 50GB+ available
- **Network**: Stable connection, egress to APIs

---

## Development Phases

### Phase 0: Prerequisites (1-2 days) ⬜

**Goal**: Environment ready to build

Tasks:
- [ ] Install Rust, Node.js 20, PostgreSQL
- [ ] Request API keys (Nillion, NEAR Cloud AI, Pinata)
- [ ] Set up development environment
- [ ] Create project structure

**Deliverable**: All tools installed, API keys obtained

---

### Phase 1: Foundation (Week 1) ⬜

**Goal**: Zcash + Database operational

Tasks:
- [ ] Install zecwallet-cli
- [ ] Sync light client with testnet
- [ ] Set up PostgreSQL database
- [ ] Create wallet addresses
- [ ] Get testnet ZEC from faucet
- [ ] Create basic transaction monitor
- [ ] Test memo extraction

**Deliverable**: Can detect transactions with memos

**Critical Path**: Zcash light client must sync (4-6 hours)

---

### Phase 2: Backend (Week 2) 🔴

**Goal**: Complete Oracle with TEE + AI

Tasks:
- [ ] Integrate IPFS client (fetch spellbook)
- [ ] Integrate NEAR Cloud AI verifier
- [ ] Integrate Nillion SecretSigner
- [ ] Build main Oracle loop
- [ ] Implement transaction signing
- [ ] Add error handling + retry logic
- [ ] Test end-to-end locally

**Deliverable**: Working Oracle that verifies and inscribes

**Critical Path**: Nillion integration is key blocker

---

### Phase 3: Frontend (Week 3) ⬜

**Goal**: User interface complete

Tasks:
- [ ] Create Next.js application
- [ ] Build submission form
- [ ] Display payment info + QR codes
- [ ] Implement status tracking
- [ ] Show quality scores
- [ ] Add blockchain links
- [ ] Mobile responsive design
- [ ] Error handling + UX polish

**Deliverable**: Functional web interface

---

### Phase 4: Production (Week 4) ⬜

**Goal**: Live system processing proverbs

Tasks:
- [ ] Security hardening (input validation, rate limiting)
- [ ] Production deployment (Oracle + Frontend)
- [ ] Monitoring setup (logs, alerts, metrics)
- [ ] Backup procedures (database, wallet)
- [ ] Documentation (deployment guide, runbook)
- [ ] Load testing (10+ concurrent proverbs)
- [ ] Mainnet migration (new keys, production config)

**Deliverable**: Production-ready system

---

## Economic Model

### Transaction Breakdown

```
User Pays: 0.01 ZEC (~$0.40 USD)
    ↓
┌─────────────────────────────────┐
│  Public Inscription (61.8%)       │
│  Amount: 0.00618 ZEC              │
│  Method: OP_RETURN               │
│  Content: PROVERB:CODE:text...  │
│  Purpose: Permanent public proof │
└─────────────────────────────────┘
    ↓
┌─────────────────────────────────┐
│  Private Pool (38.2%)              │
│  Amount: 0.00382 ZEC              │
│  Method: Shielded transfer       │
│  Content: [encrypted]            │
│  Purpose: Economic sustainability│
└─────────────────────────────────┘

Network Fee: ~0.0001 ZEC
```

### Cost Structure (Production)

**Monthly Fixed**:
- VPS hosting: $24
- Nillion TEE: $50
- Pinata IPFS: $20
- **Total**: $94/month

**Variable Per Proverb**:
- NEAR Cloud AI: $0.03
- Zcash fee: $0.004

**Break-Even Analysis**:
- At 100 proverbs/month: ~$97 total cost
- Revenue: 1.0 ZEC (~$40)
- Requires ~240 proverbs/month to break even at current ZEC price
- Sustainable with 500+ proverbs/month

---

## Security Model

### Threat Model

**What We Protect Against** ✅:
- Key extraction from TEE
- AI provider accessing keys
- IPFS provider accessing keys  
- Database compromise revealing keys
- Network eavesdropping
- Malicious insiders
- Oracle compromise

**What We Don't Protect Against** ⚠️:
- Zcash protocol vulnerabilities (trust Zcash Foundation)
- AMD SEV-SNP hardware bugs (trust AMD)
- Nillion network compromise (trust distributed MPC)
- User's device security
- Social engineering

### Security Guarantees

**Hardware-Enforced**:
```
Zcash Private Key (256-bit)
         ↓
Split via MPC (threshold ECDSA)
         ↓
Distributed across n Nillion nodes
         ↓
Requires t nodes to sign (t < n)
         ↓
No single node has complete key
         ↓
AMD SEV-SNP encrypts memory
         ↓
Remote attestation proves environment
         ↓
RESULT: Mathematical impossibility to extract key
```

**Architectural Isolation**:
- NEAR Cloud AI called via HTTPS from within TEE
- Only proverb text sent (no keys)
- IPFS fetched via HTTPS from within TEE  
- Only spellbook data received (no keys)
- PostgreSQL stores only public data
- Private key never leaves SecretSigner

**Verification**:
- Nillion provides attestation proof
- Users can verify TEE authenticity
- Blockchain provides public audit trail
- 38.2% remains private forever (shielded pool)

---

## API Integration

### External APIs Used

**Nillion** (Critical):
```typescript
POST /v1/secretsigner/store
POST /v1/secretsigner/sign
GET  /v1/attestation
```

**NEAR Cloud AI** (Enhancement):
```typescript
POST https://cloud.near.ai/v1/verify
Body: { model, proverb, spellbook_acts, context }
Response: { quality_score, matched_act, reasoning, approved }
```

**Pinata** (Infrastructure):
```typescript
GET https://gateway.pinata.cloud/ipfs/{CID}
Response: JSON (spellbook)
```

**Zcash** (Foundation):
```bash
# Via zecwallet-cli commands
list      # List transactions
balance   # Check balances  
send      # Send transactions
sync      # Sync blockchain
```

### Internal APIs Exposed

**Mage Agent → Oracle**:
```typescript
POST /api/submit
Body: { proverb, tracking_code }
Response: { payment_address, amount, memo, tracking_code }

GET /api/status/:tracking_code
Response: { 
  status: "pending" | "verified" | "inscribed",
  quality_score?: number,
  matched_act?: string,
  reasoning?: string,
  public_txid?: string,
  private_txid?: string
}
```

---

## Testing Strategy

### Unit Tests

**Coverage Areas**:
- Configuration loading
- Database operations
- Memo parsing
- Transaction creation
- Signature handling
- Error recovery

**Framework**: Jest or Vitest

```typescript
describe('parseMemo', () => {
  it('should extract tracking code and proverb', () => {
    const memo = 'TRACK:ABC123|Privacy requires separation';
    const result = parseMemo(memo);
    expect(result.tracking_code).toBe('ABC123');
    expect(result.proverb).toBe('Privacy requires separation');
  });
});
```

### Integration Tests

**Coverage Areas**:
- Zcash transaction detection
- IPFS spellbook fetching
- AI verification flow
- Database persistence
- End-to-end transaction flow

```typescript
describe('End-to-end submission', () => {
  it('should process complete proverb submission', async () => {
    // 1. Create test submission
    const submission = await createSubmission({...});
    
    // 2. Verify proverb
    const verification = await verifyProverb(submission.proverb);
    expect(verification.approved).toBe(true);
    
    // 3. Create inscriptions
    const inscriptions = await inscribeProverb(submission);
    expect(inscriptions.public_txid).toBeTruthy();
    expect(inscriptions.private_txid).toBeTruthy();
  });
});
```

### Manual Testing Checklist

**Testnet**:
- [ ] Submit proverb via Mage Agent
- [ ] Verify payment info displays correctly
- [ ] Send testnet ZEC with memo
- [ ] Verify Oracle detects transaction
- [ ] Verify AI verification completes
- [ ] Verify inscriptions broadcast
- [ ] Verify 44/56 split is exact
- [ ] Verify status updates correctly
- [ ] Verify quality score displays
- [ ] Verify blockchain links work

**Production**:
- [ ] All testnet checks pass
- [ ] Mainnet wallet funded
- [ ] First real proverb inscribed
- [ ] Monitoring confirms success
- [ ] No errors in logs
- [ ] User receives confirmation

---

## Monitoring & Operations

### Key Metrics

**Health**:
- Zcash sync status (current vs latest block)
- Database connection status
- Nillion TEE attestation validity
- API response times (NEAR Cloud AI, Pinata)

**Performance**:
- Proverbs processed per hour
- Average processing time (submission → inscription)
- Transaction success rate
- AI verification accuracy

**Business**:
- Total ZEC received
- Total inscriptions made
- Average quality score
- User satisfaction (implied by repeat use)

### Logging Strategy

```
Level Usage:
  DEBUG   - Full transaction details, debugging info
  INFO    - Normal operations, successful completions
  WARNING - Recoverable errors, retry attempts
  ERROR   - Failures requiring investigation
  CRITICAL - System-level failures, requires immediate action

Retention:
  Application logs: 30 days rolling
  Database records: Permanent
  Transaction IDs: Forever (on blockchain)
```

### Alerting

**Critical Alerts** (immediate response):
- Oracle stopped processing
- Zcash wallet balance < 0.1 ZEC
- Database connection failed
- Nillion TEE attestation invalid
- >50% transaction failures

**Warning Alerts** (response within 24h):
- Sync lag > 10 blocks
- API response time > 10 seconds
- Error rate > 5%
- Disk space < 10GB

---

## Troubleshooting Guide

### Common Issues

**Zcash sync stuck**:
```bash
# Check sync status
zecwallet-cli --data-dir ~/proverb-protocol/zcash-wallet --command "sync"

# Try different server
zecwallet-cli --server https://mainnet.lightwalletd.com:9067

# Last resort: resync from scratch
rm -rf ~/proverb-protocol/zcash-wallet
# Re-initialize
```

**Nillion signing fails**:
```typescript
// Check attestation
const attestation = await client.getAttestation();
const valid = await client.verifyAttestation(attestation);
console.log('Attestation valid:', valid);

// Reinitialize if needed
if (!valid) {
  await nillionSigner.initializeKey(privateKey);
}
```

**AI verification timeout**:
```typescript
// Implement retry with fallback
try {
  return await nearVerifier.verify(proverb, spellbook);
} catch (error) {
  console.error('AI verification failed, using fallback');
  return fallbackVerification(proverb, spellbook);
}
```

**Database connection refused**:
```bash
# Check PostgreSQL status
sudo systemctl status postgresql

# Restart if needed
sudo systemctl restart postgresql

# Check firewall
sudo ufw allow 5432/tcp
```

---

## Deployment Guide

### Development Environment

```bash
# Local machine
- PostgreSQL (Docker or native)
- Oracle Swordsman (npm run dev)
- Mage Agent (npm run dev)
- Zcash light client (testnet)

# Access
- Frontend: http://localhost:3000
- API: http://localhost:3001
- Database: localhost:5432
```

### Production Environment

```bash
# VPS (Ubuntu 20.04+)
- Nginx (reverse proxy + SSL)
- PostgreSQL (managed or local)
- Oracle Swordsman (systemd service → deployed to Nillion nilCC)
- Mage Agent (Next.js production build)
- Zcash light client (mainnet)

# Access
- Frontend: https://yourdomain.com
- API: https://api.yourdomain.com
- Database: Internal only
```

### Deployment Steps

1. **Prepare VPS**:
   ```bash
   # Update system
   sudo apt update && sudo apt upgrade -y
   
   # Install dependencies
   ./scripts/install-all.sh
   
   # Configure firewall
   sudo ufw allow 22,80,443/tcp
   sudo ufw enable
   ```

2. **Deploy Oracle**:
   ```bash
   cd oracle-swordsman
   npm run build
   
   # Create systemd service
   sudo cp oracle-swordsman.service /etc/systemd/system/
   sudo systemctl enable oracle-swordsman
   sudo systemctl start oracle-swordsman
   ```

3. **Deploy Frontend**:
   ```bash
   cd mage-agent
   npm run build
   
   # Configure Nginx
   sudo cp nginx.conf /etc/nginx/sites-available/proverb-protocol
   sudo ln -s /etc/nginx/sites-available/proverb-protocol /etc/nginx/sites-enabled/
   sudo systemctl reload nginx
   ```

4. **Configure SSL**:
   ```bash
   sudo apt install certbot python3-certbot-nginx
   sudo certbot --nginx -d yourdomain.com
   ```

---

## Contributing

We welcome contributions! See [CONTRIBUTING.md](../CONTRIBUTING.md) for guidelines.

**Areas Needing Help**:
- Testing (unit + integration)
- Documentation (tutorials, examples)
- Performance optimization
- Security auditing
- UI/UX improvements
- Additional spellbook acts

**How to Contribute**:
1. Fork the repository
2. Create feature branch
3. Make changes + add tests
4. Submit pull request
5. Address review feedback

---

## Community & Support

### Resources

**Documentation**:
- This guide (you are here)
- [Architecture](../docs/02-ARCHITECTURE.md)
- [API Reference](../docs/04-API_REFERENCE.md)

**External**:
- Nillion: https://discord.gg/nillion
- Zcash: https://forum.zcashcommunity.com
- NEAR Cloud AI: https://cloud.near.ai
- Pinata: https://www.pinata.cloud

### Getting Help

**For Bugs**:
1. Check documentation
2. Search existing issues
3. Open new issue with:
   - Clear description
   - Steps to reproduce
   - Expected vs actual behavior
   - Environment details
   - Relevant logs (remove sensitive data)

**For Questions**:
1. Check documentation first
2. Ask in community channels
3. Open discussion on GitHub

**For Security Issues**:
- Email: security@proverbprotocol.com
- Do NOT open public issue
- Provide details privately

---

## Roadmap

### Current: v4.0 (Building)
- Nillion TEE integration
- IPFS/Pinata knowledge storage
- NEAR Cloud AI verification
- 44/56 economic model

### Next: v4.1 (Q1 2025)
- Production hardening
- Performance optimization
- Additional spellbook acts
- Community features

### Future: v5.0 (Q2 2025+)
- Multi-chain support (Ethereum, Solana)
- Agent-to-agent protocol
- Advanced reputation systems
- DAO governance

---

## Success Stories

### ZyberQuest Integration

This project builds on proven patterns from **ZyberQuest**, the 2024 hackathon winner that demonstrated:
- Light client viability for production
- Effective memo-based protocols
- Robust error handling
- Real-world Zcash usage patterns

### Ecosystem Integration

**Complete Hackathon Sweep**:
- ✅ ZyberQuest (Zcash patterns)
- ✅ Nillion (TEE security)
- ✅ NEAR Cloud AI (AI intelligence)
- ✅ Pinata (IPFS storage)

This demonstrates how privacy technologies compose into complete solutions.

---

## FAQ

**Q: Why Zcash instead of Bitcoin/Ethereum?**  
A: Zcash provides shielded pools (privacy), while Bitcoin/Ethereum are fully transparent. The 61.8/38.2 split enables both transparency and privacy.

**Q: Why light client instead of full node?**  
A: 4-6 hour sync vs 48+ hours. Production needs fast deployment and low resource usage.

**Q: Why Nillion instead of other TEEs?**  
A: Distributed MPC (no single point of failure) + part of hackathon ecosystem + SecretSigner is perfect for our use case.

**Q: Can I use this for my own project?**  
A: Yes! MIT license. Fork it, adapt it, build on it.

**Q: How do I verify the Oracle is secure?**  
A: Check the Nillion attestation proof. It cryptographically proves execution in genuine TEE.

**Q: What if NEAR Cloud AI goes down?**  
A: Oracle falls back to basic pattern matching. AI is an enhancement, not a requirement.

**Q: What if Nillion goes down?**  
A: This is critical - signing stops. We need distributed MPC to prevent single point of failure.

**Q: How do I update the spellbook?**  
A: Upload new version to IPFS (gets new CID), update Oracle config, restart. Old versions remain accessible.

---

## License

MIT License - See [LICENSE](../LICENSE) file for details.

---

## Acknowledgments

**Built on patterns from**:
- **ZyberQuest** - Production Zcash light client patterns
- **NEAR Shade Agents** - TEE architecture concepts  
- **NEAR Cloud AI** - AI verification integration
- **BGIN** - Blockchain governance principles

**Thanks to**:
- Nillion team for TEE platform
- Zcash community for protocol + tools
- NEAR Cloud AI for AI API
- Pinata for IPFS infrastructure

---

## Contact

**Project Lead**: [Your Name]  
**Email**: [Your Email]  
**GitHub**: [Your GitHub]  
**Discord**: [Your Discord Handle]

---

**Let's build the privacy-first future together!** 🗡️🪄🤖🔐🚀
