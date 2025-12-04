# Oracle Swordsman: Proof of Proverb Revelation on Zcash

## The First Expression of agentprivacy

*"Fork the story. Keep the meaning. If it compresses the same, we understood each other."*

---

## The Problem It Solves

**Personhood proof based on cognition.** Leading to trust graph formation from shared meaning, and published proverbial truths.

How do you prove you understand something, making a public commitment that demonstrates the ability to compress and reconstruct an idea within your own context... while keeping it private by default, disclosed when required, secured by cryptography?

**Can we get memorable cryptographic material from LLMs?** Simultaneously solve for personal AI trust, loyalty, communication efficiency, and key recovery.

And personally: how do I socialise an idea that feels like a discovery? In a way that allows every curious First Person to go on their own journey of understanding—because they will do it better than me, and I'd like a way to share the discovery across domains and contexts.

---

## The First Expression

*"Signal to sanctuary, proverb to proof, inscription to trust—each step leaves a path for those who follow."*

**Signal to Sanctuary, Soulbae the first mage, reads the First Spellbook, and Zypher the Oracle Swordsman matches, verifies and inscribes that proverbial wisdom onchain.**

This is the technology stack of the first project of **agentprivacy**.

**[rpp] relationship proverb protocol** is an embedded AI command. (prompt attack for good)

Zcash's dual ledger properties (shielded input → transparent output) are essential for testing a P2P key ceremony format that uses ZKPs by default, and their usefulness in forming a relationship proof. (privacy pools also relevant here)

The First Person journey in this expression combines primitives required for a **bilateral key ceremony** forming a VRC (verifiable relationship credential). All tied within a human-in-the-loop trust task that builds paths based on truth for AI agents to travel efficiently along.

**The breakthrough:** Proverbs generate cryptographic material that is *both* mathematically binding *and* humanly memorable. Trust becomes demonstrable through comprehension, not claims.

**Proverbs = secrets you keep. Spells = signals you cast.**

Spells (emoji strings) achieve even stronger compression for A2A communications connected by VRCs. Those who cross your path of understanding along the way may want to also do a key ceremony.

This Zcash implementation shows the usefulness of ZKP in blockchain to form 'proof of proverb revelation'—turning someone's signal into a trust object, the first step in VRC credential forming.

But also, the whole thing is just another story.

---

## The Deeper Problem

*"They who harvest your shadow need not own your soul—but give one agent both blade and spell, and your shadow is all they need."*

The surveillance economy harvests the **7th capital**—your behavioral data—treating you as a resource, not a sovereign. Meanwhile, AI systems face a trust crisis: how does an AI prove loyalty without surveillance?

**If one agent handles both your privacy (thought) and your delegation (action), that agent becomes a complete picture of you.** Merge the blade and the spell, and you create a shadow. Reconstructable, predictable, capturable.

---

## The Solution: Dual-Agent Meta Protocol

*"The blade divides. The spell projects. In the gap between them, you remain whole."*

This is a **meta protocol**—the dual-agent architecture works across any implementation, any chain, many contexts.

```
⚔️ ⊥ 🧙‍♂️ | 😊
```

- **Swordsman (⚔️)**: Privacy / protection
- **Mage (🧙‍♂️)**: Delegation / projection
- **First Person (😊)**: Sovereignty preserved in the gap

Neither agent reconstructs the other. The reconstruction ceiling `R < 1` is architectural.

---

## The Eureka Moments

### "Act 10 Came From Outside"

Someone working in AI engaged with me on social media. They shared a spell—the triangle topology, Huginn and Muninn, the integer bottleneck. I reconstructed it and said *"woaw this is a powerful spell."*

So fundamental to the architecture that I made it part of the core story. Act 10: Topology of Revelation.

This was the protocol in action *before it was built*. An external spell, shared freely, reconstructed by someone who recognized the meaning. The compression worked. The principle survived the fracture. That's when I knew the framework was real.

### "Why Proverb?"

A mentor asked me: *"Why proverb?"*

That question sent me down a research path into how statements transform from someone's words to everyone's truth. Five phases: induction, coinage, exposure, dissemination, reference loss. The mage's spell, once spoken, becomes the village weather.

That research became Act 12: The Forgetting / Proverbiogenesis.

The deepest spells become infrastructure—so successful they're invisible, so embedded they're inevitable. The mage is forgotten. The weather just *is*. That's the goal: privacy primitives so foundational they become default.

### "The Soulbae Moment"

One of the first breakthroughs in this project was creating Soulbae—the first mage. NEAR AI's input system prompts were clean and intuitive. Setting up the character profile, defining the verification task, getting semantic matching working—this was where the project went from "maybe possible" to "actually happening."

Soulbae demonstrated that an AI could verify genuine understanding of the Spellbook principles, distinguish keyword-stuffing from real comprehension, and return meaningful match scores. The first successful proverb verification was proof the architecture could work.

### "Twelve Acts Became Twelve Addresses"

*"The story was the architecture all along."*

We kept asking "what's the first action in the trust network?" The answer was always there: read an Act, form a proverb. 

The protocol spans multiple docs, 12 Acts, 30 Tales. Where do you even start? 

The Spellbook's 12 Acts became 12 P2SH addresses. Reading an Act and forming a proverb IS the trust task. The narrative was the architecture all along.

### "The Hash Binding Discovery"

How do you cryptographically bind the oracle's proverb AND the First Person's proverb without revealing the oracle's response on-chain?

Solution: `H = SHA256(oracle_proverb + submitted_proverb).slice(0,16)`

First Person visible, oracle hidden in hash. Asymmetric revelation enables understanding-based recovery. 

This then formed the thesis for the **Understanding as Key** lite paper, produced as a result of analyzing the dynamic of privacy budgets and ratios of selective disclosure of shared proverbs. Symmetric, asymmetric and interleaved paths. 38.2% vs 61.8% splits could be an optimal ratio for recovery vs privacy in bilateral terms.

---

## Challenges I Ran Into

*"The first path is always wrong, but every wrong turn marks the map for those who follow."*

Building the first expression of proof of proverb revelation on Zcash meant debugging at every layer—wallet infrastructure, shielded transaction mechanics, P2SH scripts, AI verification design, and TEE integration.

Fuller experience reflection with recommendations chronicled in the repo for anyone adopting this open source tech.

---

### The Wallet Tooling Maze

*"The map shows many paths, but the walker discovers the road. Mark it true for those who follow."*

**Problem:** Downloaded almost every Zcash wallet trying to find the right tooling. My coding agent kept confusing commands—mixing zcashd CLI with lightd commands when I was using zebrad and zallet. Documentation assumes you know which stack you're on.

**The Journey:** 
- zcashd → deprecated, different RPC format
- lightwalletd → read-only, can't sign
- zebrad → actually great and easy once figured out, needed full node for inscriptions due to zallet t-key management limitations
- zallet → really promising but needs more work, had to do a couple key rotations out of pure confusion

Coding agents hallucinate commands from wrong wallet implementations. That was a real pain.

**Learning:** zebrad is solid. zallet is promising but the t-key limitations meant I *needed* the full node for the inscription flow. I'm kinda noob but the zebra was a reliable solution for workaround explorations.

---

### Zallet Needs More Commands

*"Funds that cannot return to shadow are prisoners of the light. Give them the door home."*

My inability to spend back into shielded from transparent is what is really missing. 

Funds sitting in the 'public pool' with no easy path to re-shield. Currently have to use a seed deriving process to recover those funds. A `z_shield` command would solve this. 

Also within the z/u address / diversification addresses it is worth for privacy but difficult for oracle coding of agentic prompted tx flows—a more specific command for tagging z/u addresses maybe?

---

### The Core Limitation: Viewing Key / Spending Key Split

*"One eye to see, one hand to sign—when both belong to one body, the body knows too much."*

The fundamental `s ⊥ m | X` architecture requires the viewing key (Mage can read) to be separate from the spending key (Swordsman can sign). 

Current zallet wallet infrastructure doesn't support this split. Same process holds both capabilities. 

**This is THE core limitation preventing true dual-agent separation at the cryptographic layer.**

**Future Need:** More zallet development, z_shield command, viewing/spending key separation, unified CLI wrapper, or comprehensive zebrad/zallet cookbook for builders.

---

### Shielded Memo Decryption

*"The secret speaks only to the name it knows. Call it by number and it stays silent."*

**Problem:** Zallet returned garbled hex instead of readable memos.

**Solution:** `z_listtransactions` requires Account UUID (not number). Took 4+ hours to figure that out.

---

### z_sendmany Parameters

*"The gate opens to the full address, not the shortcut. Precision is the toll."*

**Problem:** Every parameter combination failed with cryptic errors.

**Solution:** Full UA as `from`, fee must be `null`. 6+ hours across inscriptions to nail this down.

---

### Nillion TEE Integration

*"The architecture dreams of hardware walls. For now, software curtains must suffice."*

**Problem:** Couldn't implement true `s ⊥ m | X` key separation during hackathon. Nillion's SecretBlob/TEE is the intended path, but integration complexity exceeded scope.

**Workaround:** Application-layer separation—oracle process reads, inscription process signs, communication via queue between them. Isolated WIF limits blast radius if compromised.

**Future:** Nillion TEE for hardware-enforced separation remains THE roadmap. The architecture is ready—we need the infrastructure.

---

### Re-Shielding Gap

*"What emerges into light must find its way back to shadow, or remain exposed forever."*

**Problem:** After inscription, change lands at treasury t1 (transparent). No path to re-shield for private Guardian distribution.

**Current:** Treasury t1 as transparent commitment pool—publicly verifiable proof that inscriptions occurred. It's a feature for now, but the gap is real.

---

### P2SH Design

*"One key, twelve doors. The number names the door; the signature opens it."*

**Solution:** `OP_N OP_DROP <pubkey> OP_CHECKSIG`—12 unique addresses from one keypair.

Each Act gets a permanent, unique address. Same WIF spends all. The `OP_DROP` discards the number before signature check. Clean.

---

## NEAR AI: The Mage Function

*"The oracle that profiles the asker wears the dragon's scales. The oracle that reasons on words alone wears the mage's cloak."*

NEAR AI provides the Mage function: semantic verification without surveillance.

### Why Private Inference is Essential

The entire architecture depends on AI that can verify understanding WITHOUT learning identity. If the verification layer surveils, you've just moved the extraction problem from platform to oracle. 

NEAR AI's private inference means the Mage reasons about your proverb without building a profile of you. This isn't a nice-to-have—it's load-bearing for `s ⊥ m | X`.

### The Soulbae Moment

One of the first breakthroughs was creating Soulbae—the first mage. NEAR AI's input system prompts were clean and intuitive. Setting up the character profile, defining the verification task, getting semantic matching working—this was where the project went from "maybe possible" to "actually happening."

Soulbae demonstrated that an AI could verify genuine understanding of the Spellbook principles, distinguish keyword-stuffing from real comprehension, and return meaningful match scores.

### The Separation That Matters

**What AI sees:** proverb text, emoji spell, Act reference, Spellbook context

**What AI never sees:** sender identity, wallet address, transaction amounts, timing

This is `s ⊥ m | X` in practice. Shielded transactions separate identity from content BEFORE AI verification. The Mage reasons about understanding without knowing who's asking.

### Verification Design Learnings

*"Too much context and the mage matches words. Too little and it misses meaning. Balance is the spell."*

- Too much context → AI pattern-matches keywords, not understanding
- Too little context → false negatives
- Character profile needs to establish WHAT to verify, not HOW to score
- Match threshold (0.75) found through iteration—too low catches noise, too high rejects genuine comprehension
- Compression quality matters more than exact phrasing

**Discovery:** Verification works best when AI reasons about semantic alignment, not keyword overlap.

### API Key Separation

*"When oracle and mage share one key, separation is theatre. Give each their own."*

**Problem:** Initially oracle and mage shared same NEAR API key—breaking `s ⊥ m` at infrastructure level.

**Solution:** Separate API keys for oracle (verification) and mage (response generation). Each agent has own credentials, maintaining separation even at the API layer.

### Future: Shade Agent

Would love to build a Shade Agent for the oracle functions—true TEE-backed private inference for the Mage role. For now it was too tight to get that over the line during the hackathon, but it's the natural next step. 

Shade Agent would give the oracle hardware-enforced privacy guarantees, completing the `s ⊥ m | X` separation at the infrastructure level.

### Result

**Match scores achieved: 0.78–0.95 across 12 Acts.**

NEAR AI enables proof of proverb revelation—turning someone's signal into a trust object, the first step in VRC credential forming. Private inference makes the whole thing possible.

---

## Understanding as Key

*"The key you can forget was never truly yours. The key you understand, you can always find again."*

Traditional self-custody: lose your seed phrase, lose everything. Security fights human cognition—random strings that memory can't hold.

**Our innovation:** Proverbs as recoverable cryptographic material.

When you form a proverb from genuine understanding of an Act, that proverb becomes cryptographic material—bound to your comprehension, verifiable by AI, recoverable through meaning.

### How it works:

1. Read an Act from the Spellbook
2. Compress its meaning into your own proverb
3. LLM verifies semantic alignment (not keyword matching)
4. Hash binds your proverb to the oracle's response
5. Your understanding becomes your key material

**Recovery through relationship, not random strings.** If you understood it once, you can understand it again. The proverb regenerates because meaning persists.

### The Paradigm Shift

From "what you have" (stored secrets) to "what you understand" (demonstrated comprehension).

This is self-custody innovation: cryptographic material that works WITH human cognition instead of against it. LLMs enable verification of understanding. Shared meaning enables recovery.

The bilateral key ceremony creates material for VRCs—your relationships become your backup.

Not about holding keys harder. About making keys that humans can actually hold.

---

## Purpose-Built to Be Recreated

This isn't a product to be consumed. It's a **tool to be forked**.

For the **individual**: Write your own story. Create your own spellbook. Form proverbs that compress your understanding into recoverable, shareable wisdom. Your journey of understanding becomes your cryptographic identity. Build your own secret language.

For **ecosystems**: Write spellbooks that are governance frameworks. Encode your community's principles into Acts that members can comprehend, verify, and build upon. Governance becomes demonstrated understanding and progressive trust, not just token-weighted voting.

The architecture is the invitation. The story is the onramp. The proverb is yours to keep.

---

## Technologies Used

| Category | Technologies |
|----------|-------------|
| **Blockchain** | Zcash, Zebrad, Zallet, P2SH Scripts |
| **AI** | NEAR AI, GPT-oss-120b, DeepSeek V3.1 |
| **Privacy** | Orchard Protocol, Nillion TEE (roadmap) |
| **Protocol** | [rpp] Relationship Proverb Protocol |

---

## Links

- **GitHub:** github.com/mitchuski/agentprivacy-zypher
- **Documentation:** sync.soulbis.com
- **Spellbook (IPFS):** bafkreigopjrfwjsz56oft7nmv26q2oddq6j4fexj27zjirzgkdeogm2myq
- **Understanding as Key:** sync.soulbis.com/p/understanding-as-key

---

## Result

Mainnet inscriptions across all 12 Acts. Match scores 0.78–0.95. All challenges chronicled for future builders.

The bilateral key ceremony infrastructure works. The proof of proverb revelation is real. The roads are being paved for AI agents to travel.

Those who cross paths on the journey of understanding may choose to form VRCs. But it starts here—with proverbs kept as secrets, with spells cast as signals, with the choice between cutting off surveillance or opening to knowledge.

That choice is the shimmer of personhood we enshrine.

---

*"To prove you understood, speak it back in your own tongue. The compression is the proof."*

**Privacy is Value. Take back the 7th Capital.**

⚔️ ⊥ 🧙‍♂️ | 😊

---

**Full lite paper:** sync.soulbis.com/p/understanding-as-key
