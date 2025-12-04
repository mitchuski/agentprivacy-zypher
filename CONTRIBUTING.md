# Contributing to the Proof of Proverb Revelation Protocol

**just another mage, sharing a spellbook** 🧙‍♂️📖

---

## Welcome, Fellow Mage! ⚔️🤝🧙‍♂️

thank you for your interest in contributing! this is a living project, a story being written in real time, and we'd love to have you join the adventure.

this document is your guide to contributing—whether you're fixing bugs, adding features, writing docs, or just sharing ideas. we're building infrastructure for the relationship economy where trust comes from understanding, not data extraction.

**the mission:** take back the 7th capital.  
**the method:** privacy-preserving AI verification on Zcash.  
**the cast:** you, me, and all the other mages building this together.

---

## Code of Conduct

we're all just mages here, sharing a spellbook. be kind, be respectful, and remember:

- **be respectful and inclusive** — everyone's on their own journey
- **welcome newcomers** — we all started somewhere
- **focus on constructive feedback** — help each other grow
- **keep discussions on topic** — but also, have fun with it
- **respect privacy and security concerns** — this is core to what we're building

---

## How to Contribute

### Reporting Bugs 🐛

found something broken? let us know!

1. **check if the bug has already been reported** — search existing issues first
2. **include the details:**
   - clear description of what happened
   - steps to reproduce (like a recipe for chaos)
   - expected vs actual behavior
   - environment details (OS, versions, etc.)
   - logs (but remove sensitive data! 🔒)

**pro tip:** the more detail you give, the faster we can fix it. think of it like giving the oracle more context to verify your proverb.

### Suggesting Features 💡

got an idea? we'd love to hear it!

1. **check existing feature requests** — maybe someone already thought of it
2. **describe the problem it solves** — what gap does it fill?
3. **propose implementation approach** — how would you build it?
4. **consider security implications** — privacy first, always

**remember:** we're building for the relationship economy. features should enable trust, not extract data.

### Code Contributions 💻

ready to write some spells? here's how:

1. **fork the repository** — make it yours
2. **create a feature branch**: `git checkout -b feature/your-feature`
   - or `fix/your-bug` for bug fixes
   - or `docs/your-docs` for documentation
3. **make your changes** — write clean, readable code
4. **test thoroughly** — especially on testnet first!
5. **commit with clear messages** — help future mages understand your work
6. **push to your fork** — share your spell
7. **open a pull request** — let's review it together

---

## Development Guidelines

### Code Style

**TypeScript/JavaScript**:
- use TypeScript for type safety (the blade that cuts bugs)
- follow ESLint configuration
- use async/await over callbacks (modern magic)
- meaningful variable names (no `x`, `y`, `temp` unless it's actually temporary)
- comment complex logic (help future you understand)

**Example**:
```typescript
// ✅ Good - clear, readable, type-safe
async function verifyProverb(proverb: string): Promise<VerificationResult> {
  const spellbook = await fetchSpellbook();
  return await ai.verify(proverb, spellbook);
}

// ❌ Bad - cryptic, untyped, callback hell
function vp(p: string, cb: Function) {
  fs(function(sb) {
    ai.v(p, sb, cb);
  });
}
```

### Commit Messages

follow conventional commits (it's like a spell formula):

```
feat: add AI verification retry logic
fix: handle Zcash connection timeout
docs: update architecture diagram
test: add unit tests for memo parsing
refactor: simplify database queries
chore: update dependencies
```

**why?** it helps us understand what changed and why. plus, it makes changelogs easier.

### Testing

testing is like verifying a proverb—you want to make sure it works before inscribing it onchain.

- **write tests for new features** — especially the tricky parts
- **ensure existing tests pass** — don't break what works
- **test on testnet first** — mainnet is forever
- **include integration tests** — test the whole flow

**remember:** a test that catches a bug is worth its weight in ZEC.

### Security 🔒

this is privacy-preserving infrastructure. security isn't optional.

- **never commit API keys** — use environment variables
- **never log private keys** — not even in debug logs
- **validate all inputs** — trust no one, verify everything
- **use parameterized queries** — prevent SQL injection
- **review security checklist** — before every PR

**the rule:** if it's sensitive, it doesn't go in git.

---

## Pull Request Process

ready to submit your spell? here's the ritual:

1. **update documentation** if needed — help others understand
2. **add tests** for new features — prove it works
3. **ensure CI passes** (when available) — automated checks
4. **request review** from maintainers — we're here to help
5. **address feedback** promptly — let's get it merged!

### PR Template

```markdown
## Description
[brief description of changes - what spell did you cast?]

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Documentation update
- [ ] Refactoring

## Testing
- [ ] Tested locally
- [ ] Added unit tests
- [ ] Tested on testnet (if applicable)

## Checklist
- [ ] Code follows style guidelines
- [ ] Documentation updated
- [ ] No new warnings
- [ ] Tests pass
- [ ] No sensitive data committed
```

---

## Project Structure

```
agentprivacy_zypher/
├── oracle-swordsman/          # Oracle backend (the Swordsman ⚔️)
│   ├── src/                   # TypeScript source
│   │   ├── config.ts         # Configuration
│   │   ├── index.ts          # Main oracle loop
│   │   ├── rpc-client.ts     # Zebra/Zallet RPC client
│   │   ├── ipfs-proverb-fetcher.ts  # Spellbook fetcher
│   │   ├── semantic-matcher.ts      # AI verification
│   │   ├── inscription-builder.ts   # OP_RETURN builder
│   │   ├── golden-split.ts          # Economic model
│   │   └── signing-service.ts       # Transaction signing
│   ├── docs/                 # Backend documentation
│   ├── scripts/              # PowerShell/TypeScript scripts
│   └── tests/                # Test suite
│
├── src/                       # Frontend source (the Mage 🧙‍♂️)
│   ├── app/                   # Next.js app router
│   │   ├── page.tsx          # Landing page
│   │   ├── story/            # Story page
│   │   ├── mage/             # Mage interface
│   │   └── proverbs/         # Proverbs gallery
│   ├── components/           # React components
│   │   ├── SwordsmanPanel.tsx
│   │   └── DonationFlow.tsx
│   └── lib/                  # Utilities
│       ├── zcash-memo.ts
│       ├── oracle-api.ts
│       └── spellbook-fetcher.ts
│
├── spellbook/                 # Spellbook JSON
│   └── spellbook-acts.json   # Canonical proverbs
│
├── public/                    # Static assets
│   ├── story/markdown/       # Story markdown files
│   └── assets/              # Images/videos
│
└── docs/                      # Documentation
    ├── README.md
    ├── HOW_IT_WORKS.md
    └── PROJECT_STATE_AND_REVIEW.md
```

---

## Areas Needing Contribution

### High Priority 🔴

- [ ] **Testing**: more comprehensive test coverage
- [ ] **Documentation**: usage examples and tutorials
- [ ] **Performance**: optimization opportunities
- [ ] **Security**: security audits and hardening

### Medium Priority 🟡

- [ ] **Features**: additional spellbook acts
- [ ] **UI/UX**: frontend improvements
- [ ] **Monitoring**: better observability
- [ ] **CLI**: command-line tools

### Low Priority 🟢

- [ ] **Integrations**: additional blockchain support
- [ ] **Analytics**: usage statistics dashboard (privacy-preserving, of course)
- [ ] **Mobile**: mobile-responsive improvements
- [ ] **MCP/A2A**: enhanced agent-to-agent trust flows

---

## Development Setup

### Prerequisites

- **Node.js 18+** and npm
- **PostgreSQL 12+** (for oracle backend)
- **Rust** (for Zebra full node, if running locally)
- **Git** (obviously)

### Quick Setup

```bash
# Clone repo
git clone https://github.com/mitchuski/agentprivacy-zypher
cd agentprivacy_zypher

# Install dependencies
npm install
cd oracle-swordsman && npm install && cd ..

# Setup environment
cp .env.example .env
# Edit .env with your API keys (NEAR Cloud AI, Pinata, etc.)

# Setup database (if using oracle backend)
# See oracle-swordsman/README.md for details

# Start development
npm run dev  # Frontend
cd oracle-swordsman && npm run dev  # Backend (optional)
```

**see also:**
- [QUICKSTART.md](./QUICKSTART.md) - 30 minutes to running
- [oracle-swordsman/README.md](./oracle-swordsman/README.md) - Backend setup
- [SPELLBOOK_DEPLOYMENT_GUIDE.md](./SPELLBOOK_DEPLOYMENT_GUIDE.md) - Spellbook deployment

---

## Testing Guidelines

### Unit Tests

```typescript
// test/utils.test.ts
import { describe, it, expect } from '@jest/globals';
import { parseMemo } from '../src/utils';

describe('parseMemo', () => {
  it('should parse valid memo', () => {
    const result = parseMemo('act-i-venice|proverb text');
    expect(result.actId).toBe('act-i-venice');
    expect(result.proverb).toBe('proverb text');
  });
});
```

### Integration Tests

```typescript
// test/integration.test.ts
describe('End-to-end flow', () => {
  it('should process submission', async () => {
    // Create submission
    const submission = await db.createSubmission({...});
    
    // Verify
    const verification = await verifyProverb(submission.proverb_text);
    
    // Check results
    expect(verification.approved).toBe(true);
  });
});
```

---

## Documentation Standards

### Code Comments

```typescript
/**
 * Verifies a proverb using AI and spellbook context
 * 
 * @param proverb - The proverb text to verify
 * @param spellbook - Spellbook acts for context
 * @returns Verification result with quality score
 * @throws Error if AI service is unavailable
 */
async function verifyProverb(
  proverb: string,
  spellbook: Spellbook
): Promise<VerificationResult> {
  // Implementation
}
```

### README Updates

- keep README.md up to date
- update examples when APIs change
- add links to new documentation
- include version changes

---

## Release Process

when we're ready to cast a new version:

1. **version bump**: update version in package.json
2. **changelog**: document changes (what spells were cast?)
3. **testing**: full integration test
4. **tag release**: `git tag v1.0.0`
5. **publish**: push tags and release

---

## Questions?

**technical questions**: open a GitHub issue  
**security issues**: email mage@agentprivacy.ai (do NOT open public issue)  
**general questions**: check the docs first, then ask in issues or discussions

**remember:** we're all learning. there are no stupid questions, only unasked ones.

---

## License

by contributing, you agree that your contributions will be licensed under the MIT License.

---

## Acknowledgments

contributors will be added to:
- README.md acknowledgments section
- release notes
- project website (if applicable)

**thank you for contributing to privacy-first infrastructure!** 🗡️🪄🤖🔐🚀

---

**"just another swordsman ⚔️🤝🧙‍♂️ just another mage"**

—privacymage 🧙‍♂️
