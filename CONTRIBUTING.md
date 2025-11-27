# Contributing to Proverb Revelation Protocol

Thank you for your interest in contributing! This document provides guidelines for contributing to the project.

---

## Code of Conduct

- Be respectful and inclusive
- Welcome newcomers
- Focus on constructive feedback
- Keep discussions on topic
- Respect privacy and security concerns

---

## How to Contribute

### Reporting Bugs

1. Check if the bug has already been reported
2. Include:
   - Clear description
   - Steps to reproduce
   - Expected vs actual behavior
   - Environment details (OS, versions)
   - Logs (remove sensitive data!)

### Suggesting Features

1. Check existing feature requests
2. Describe the problem it solves
3. Propose implementation approach
4. Consider security implications

### Code Contributions

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/your-feature`
3. **Make your changes**
4. **Test thoroughly**
5. **Commit with clear messages**
6. **Push to your fork**
7. **Open a Pull Request**

---

## Development Guidelines

### Code Style

**TypeScript/JavaScript**:
- Use TypeScript for type safety
- Follow ESLint configuration
- Use async/await over callbacks
- Meaningful variable names
- Comment complex logic

**Example**:
```typescript
// ✅ Good
async function verifyProverb(proverb: string): Promise<VerificationResult> {
  const spellbook = await fetchSpellbook();
  return await ai.verify(proverb, spellbook);
}

// ❌ Bad
function vp(p: string, cb: Function) {
  fs(function(sb) {
    ai.v(p, sb, cb);
  });
}
```

### Commit Messages

Follow conventional commits:

```
feat: add AI verification retry logic
fix: handle Zcash connection timeout
docs: update architecture diagram
test: add unit tests for memo parsing
refactor: simplify database queries
```

### Testing

- Write tests for new features
- Ensure existing tests pass
- Test on testnet first
- Include integration tests

### Security

- Never commit API keys
- Never log private keys
- Validate all inputs
- Use parameterized queries
- Review security checklist

---

## Pull Request Process

1. **Update documentation** if needed
2. **Add tests** for new features
3. **Ensure CI passes** (when available)
4. **Request review** from maintainers
5. **Address feedback** promptly

### PR Template

```markdown
## Description
[Brief description of changes]

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Documentation update
- [ ] Refactoring

## Testing
- [ ] Tested locally
- [ ] Added unit tests
- [ ] Tested on testnet

## Checklist
- [ ] Code follows style guidelines
- [ ] Documentation updated
- [ ] No new warnings
- [ ] Tests pass
```

---

## Project Structure

```
proverb-protocol/
├── docs/                      # Documentation
│   ├── 01-SETUP.md
│   ├── 02-ARCHITECTURE.md
│   ├── 03-BUILD_GUIDE.md
│   ├── 04-API_REFERENCE.md
│   └── 05-ROADMAP.md
├── oracle-swordsman/         # Backend (TEE worker)
│   ├── src/
│   │   ├── config.ts
│   │   ├── database.ts
│   │   ├── zcash-client.ts
│   │   ├── ipfs-client.ts
│   │   ├── near-verifier.ts
│   │   ├── nillion-signer.ts
│   │   └── index.ts
│   └── tests/
├── mage-agent/               # Frontend (Next.js)
│   ├── app/
│   │   ├── api/
│   │   └── page.tsx
│   └── components/
├── scripts/                  # Utility scripts
│   ├── install-all.sh
│   └── schema.sql
└── spellbook/               # Knowledge base
    └── spellbook-acts.json
```

---

## Areas Needing Contribution

### High Priority

- [ ] **Testing**: More comprehensive test coverage
- [ ] **Documentation**: Usage examples and tutorials
- [ ] **Performance**: Optimization opportunities
- [ ] **Security**: Security audits and hardening

### Medium Priority

- [ ] **Features**: Additional spellbook acts
- [ ] **UI/UX**: Frontend improvements
- [ ] **Monitoring**: Better observability
- [ ] **CLI**: Command-line tools

### Low Priority

- [ ] **Integrations**: Additional blockchain support
- [ ] **Analytics**: Usage statistics dashboard
- [ ] **Mobile**: Mobile-responsive improvements

---

## Development Setup

### Prerequisites

- Ubuntu 20.04+ or macOS
- Node.js 20+
- PostgreSQL 12+
- Rust (for zecwallet-cli)

### Quick Setup

```bash
# Clone repo
git clone https://github.com/yourusername/proverb-protocol
cd proverb-protocol

# Install dependencies
./scripts/install-all.sh

# Setup environment
cp .env.example .env
# Edit .env with your API keys

# Setup database
psql -U proverb_user -d proverb_protocol -h localhost < scripts/schema.sql

# Start development
cd oracle-swordsman && npm run dev
```

---

## Testing Guidelines

### Unit Tests

```typescript
// test/utils.test.ts
import { describe, it, expect } from '@jest/globals';
import { parseMemo } from '../src/utils';

describe('parseMemo', () => {
  it('should parse valid memo', () => {
    const result = parseMemo('TRACK:ABC|proverb text');
    expect(result.tracking_code).toBe('ABC');
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

- Keep README.md up to date
- Update examples when APIs change
- Add links to new documentation
- Include version changes

---

## Release Process

1. **Version bump**: Update version in package.json
2. **Changelog**: Document changes
3. **Testing**: Full integration test
4. **Tag release**: `git tag v1.0.0`
5. **Publish**: Push tags and release

---

## Questions?

- **Technical**: Open a GitHub issue
- **Security**: Email security@proverbprotocol.com
- **General**: Join community Discord

---

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

## Acknowledgments

Contributors will be added to:
- README.md acknowledgments section
- Release notes
- Project website (if applicable)

---

**Thank you for contributing to privacy-first infrastructure!** 🗡️🪄
