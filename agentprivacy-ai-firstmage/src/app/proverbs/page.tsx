'use client';

import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import SwordsmanPanel from '@/components/SwordsmanPanel';
import { getTaleIdFromAct } from '@/lib/zcash-memo';
import { getStats } from '@/lib/oracle-api';

// Tale metadata from zero spellbook (for spell matching)
const taleData: { [key: number]: { title: string; spell: string; proverb: string } } = {
  1: { title: "The Monastery of Hidden Knowledge", spell: "🏛️(🧙‍♂️³) → ZKP = {✓complete, ✓sound, ✓zero-knowledge}", proverb: "Three properties guard the gate of honest proof: completeness lets truth enter, soundness bars deception, zero-knowledge preserves mystery." },
  2: { title: "The Three Trials of Truth", spell: "🎲(random) → CRS → 🌍(public)", proverb: "The foundation laid in public view creates no vulnerability if built with many hands—trust distributed becomes trust earned." },
  3: { title: "The Silent Messenger", spell: "🎭(interactive) + 🔮(hash-oracle) → 🔇(non-interactive)", proverb: "The oracle that answers all questions truthfully but learns nothing in return—this is the heart of non-interactive proof." },
  4: { title: "The Fields of Finite Wisdom", spell: "𝔽_q = {0, 1, ..., q-1} → ➕ ✖️ (mod q)", proverb: "In finite fields, infinity loops back to zero. On elliptic curves, addition draws lines through space. In pairings, multiplication becomes verifiable—these are the foundations of invisible proof." },
  5: { title: "The Constraint Forge", spell: "🔨(claim) → 🔗(gates) → {a ⊗ b = c}ⁿ", proverb: "Break the complex into atomic truths. Each multiplication is a checkpoint; each constraint is a promise. The forge transforms tangled knowledge into verifiable form." },
  6: { title: "The Polynomial Riddle", spell: "{a⊗b=c}ⁿ → {A(x), B(x), C(x)} → A·B - C = Z·H", proverb: "When a million truths must be checked, transform them into one equation. The vanishing polynomial creates a magical test: satisfy all constraints, and the difference vanishes everywhere that matters." },
  7: { title: "The Witness and the Instance", spell: "claim → {instance(🌍) + witness(🗝️)}", proverb: "Guard the witness as you guard your sovereignty. Reveal the instance as you reveal your boundary. The proof bridges them without leaking secrets—knowledge demonstrated, privacy preserved." },
  8: { title: "The Plonkish Revolution", spell: "PlonK: Σqᵢ·wᵢ + q·(w₁⊗w₂) = 0 (flexible)", proverb: "The rigid hammer serves many purposes, but the specialized tool excels at its craft. Custom gates are to constraints what a master key is to lockpicking—elegant efficiency through thoughtful design." },
  9: { title: "The Pairing Dance", spell: "e: G₁ × G₂ → GT (bilinear)", proverb: "Two groups dance separately until the pairing unites them. In that union, addition becomes multiplication, and encrypted polynomials become verifiable." },
  10: { title: "The Commitment Ceremony", spell: "commit(🗝️) → 🔒(binding + hiding)", proverb: "The commitment binds your future choices yet hides your current knowledge. Choose your ceremony by what matters most: tiny proofs, transparent trust, or quantum survival." },
  11: { title: "The FRI Oracle", spell: "FRI: φ → φ' → φ'' → ... → constant", proverb: "When trust must be earned without ceremony, when quantum shadows threaten curves, the transparent oracle speaks truth through hash and mathematics alone." },
  12: { title: "The Folding Path", spell: "proof₁ + proof₂ →(fold @ r)→ proof₃", proverb: "Don't verify each step—fold them together. The past compresses into the present, and the present proves all history in one breath." },
  13: { title: "The Sumcheck Riddle", spell: "S = Σ g(x₁,...,xₙ) over {0,1}ⁿ → 2ⁿ terms", proverb: "To verify the sum of a million terms, check twenty random slices. Each challenge halves the space; randomness guarantees honesty." },
  14: { title: "The IPA Chronicle", spell: "⟨a, b⟩ = Σ aᵢbᵢ → inner product", proverb: "When trust ceremonies are unavailable but tiny proofs unneeded, the inner product argument walks the middle path—transparent by construction, logarithmic in size." },
  15: { title: "The Mirror Within Mirrors", spell: "proof → verify(proof) → proof_of_proof → verify → ... ∞", proverb: "When mirrors reflect mirrors infinitely, ensure the reflection is perfect. Pasta pairs the curves; STARKs need no pairing; folding skips verification entirely." },
  16: { title: "The Cyclic Ceremony", spell: "Circuit C → verify(C's proof) → paradox(vk_C unknown)", proverb: "The snake that devours itself seems paradoxical until you realize it grows from both ends. Circuit verifying itself requires identity confirmation—the structure proves the structure." },
  17: { title: "The Universal Setup", spell: "Ceremony(τ) → {g^1, g^τ, ..., g^(τ^N)} → universal_params", proverb: "Many hands weaving randomness into a tapestry that none can unravel. The universal ceremony performed once serves forever." },
  18: { title: "The Toxic Waste Dragon", spell: "🐉 Head 1: τ leaked → forge_proofs(∞) → 🚨", proverb: "Four heads guard four failure modes. Defense requires eternal vigilance across all four fronts: setup, parameters, circuits, and cryptographic assumptions." },
  19: { title: "The zkVM Kingdom", spell: "program(any_language) → compile(ISA) → execute → trace[cycles]", proverb: "When every program becomes provable, the VM becomes the universal judge. Write once in familiar language, prove anywhere with mathematical certainty." },
  20: { title: "The Cairo Scribes", spell: "Cairo: language(felt) → AIR(direct) → STARK → StarkNet", proverb: "When the language itself speaks in field elements, the program becomes its own proof. Cairo scribes don't compile to constraints—they write constraints directly." },
  21: { title: "The Circom Workshops", spell: "Circom: template(signals) → constraints(R1CS) → Groth16/PlonK", proverb: "The master craftsman knows each constraint intimately. Circom demands precision but rewards with efficiency." },
  22: { title: "The zkEVM Empire", spell: "EVM(140 opcodes + state) → zkEVM → proof → L1(verify)", proverb: "To prove the world computer is to recursively verify every computation layer. Perfect equivalence costs proving time; custom bytecode gains speed." },
  23: { title: "The Private Coin of ZCash", spell: "ZCash: private(from, to, amount) + proof(valid, no_double_spend)", proverb: "The first private coin proved privacy possible. Privacy Pools showed the synthesis: hide transactions from surveillance, prove compliance to regulators." },
  24: { title: "The Tornado's Eye", spell: "Tornado: deposit(cm) → pool → withdraw(proof, nf) → unlinked", proverb: "The mixer that hides all equally protects innocent and guilty alike. This is the nature of privacy tools—neutral in construction, moral in application." },
  25: { title: "The Rollup Realms", spell: "zkRollup: execute(L2) → prove → L1(verify + data)", proverb: "The rollup kingdoms scale Ethereum by proving rather than re-executing. Each kingdom trades different properties." },
  26: { title: "The Vulnerability Codex", spell: "Vulnerabilities: setup + parameters + circuits + implementation + protocol + upgrades", proverb: "The Hall of Scars teaches humility. Every vulnerability inscribed prevents ten more. The price of sovereignty is eternal vigilance." },
  27: { title: "The Data Availability Prophecy", spell: "EIP-4844: blobs(128KB, 18 days, 1 gas/byte) → 16x cheaper", proverb: "Execution needs proof; reconstruction needs data. Blobs separate these concerns, making data temporary and cheap while proofs remain permanent." },
  28: { title: "The Bridge Between Worlds", spell: "Bridge: prove(chain_A_state) → verify(chain_B) → trustless", proverb: "The bridge built on trust crumbles under coordinated attack. The bridge built on proof stands eternal, limited only by mathematics." },
  29: { title: "The Intelligence Proof", spell: "zkML: model(committed) + data(private) + inference → proof(correct) + output", proverb: "Intelligence that cannot be verified is intelligence that cannot be trusted. Machine learning becomes machine proving." },
  30: { title: "The Eternal Sovereignty", spell: "Sovereign Agent = {Identity, Swordsman, Mage, Reflect, Connect, Capital, Intelligence}", proverb: "The complete sovereignty system is a symphony of zero-knowledge proofs. Every component modular, every interaction provable, every privacy preserved." },
};

interface ProverbProof {
  id: string;
  actNumber: number;
  actName: string;
  spellbook: 'story' | 'zero';
  proverb: string;
  spell?: string; // Compression spell (emoji string)
  timestamp: number;
  length: number;
  hash: string; // Privacy-preserving hash
  type: 'display' | 'learn'; // 1 ZEC (display) or 0.01 ZEC (learn)
}

// Spell mappings by spellbook and act number
const spellMappings: { [key: string]: { [actNumber: number]: string } } = {
  story: {
    1: '🗡️🛡️ → ⚔️ (boundaries preserve sovereignty)',
    2: '📖🔮 → ✨ (delegation without surrender)',
    3: '🐉💎 → 🏰 (progressive trust builds castles)',
    4: '⚔️💧 → 🔪 (solo combat proves the swordsman)',
    5: '🛡️⚡ → 🌐 (light armor enables coordination)',
    6: '🔐✋✋✋ → 🚪 (three attestations open the door)',
    7: '🪞🪞 → 👁️ (two mirrors preserve dignity)',
    8: '📜✋×15 → 🏛️ (fifteen attestations earn Heavy)',
    9: '🛡️💰 → 🔒 (privacy shield becomes certainty)',
    10: '🔺🧠 → 🌳 (triangle steers through discrete thought)',
    11: '⚔️/🔮 = φ = 👑 (blade divided by spell equals sovereignty)',
  },
  zero: {
    1: '🏛️(🧙‍♂️³) → ZKP = {✓complete, ✓sound, ✓zero-knowledge}',
    2: '🎲(random) → CRS → 🌍(public)',
    3: '🎭(interactive) + 🔮(hash-oracle) → 🔇(non-interactive)',
    4: '𝔽_q = {0, 1, ..., q-1} → ➕ ✖️ (mod q)',
    5: '🔨(claim) → 🔗(gates) → {a ⊗ b = c}ⁿ',
    6: '{a⊗b=c}ⁿ → {A(x), B(x), C(x)} → A·B - C = Z·H',
    7: 'claim → {instance(🌍) + witness(🗝️)}',
    8: 'PlonK: Σqᵢ·wᵢ + q·(w₁⊗w₂) = 0 (flexible)',
    9: 'e: G₁ × G₂ → GT (bilinear)',
    10: 'commit(🗝️) → 🔒(binding + hiding)',
    11: 'FRI: φ → φ\' → φ\'\' → ... → constant',
    12: 'proof₁ + proof₂ →(fold @ r)→ proof₃',
    13: 'S = Σ g(x₁,...,xₙ) over {0,1}ⁿ → 2ⁿ terms',
    14: '⟨a, b⟩ = Σ aᵢbᵢ → inner product',
    15: 'proof → verify(proof) → proof_of_proof → verify → ... ∞',
    16: 'Circuit C → verify(C\'s proof) → paradox(vk_C unknown)',
    17: 'Ceremony(τ) → {g^1, g^τ, ..., g^(τ^N)} → universal_params',
    18: '🐉 Head 1: τ leaked → forge_proofs(∞) → 🚨',
    19: 'program(any_language) → compile(ISA) → execute → trace[cycles]',
    20: 'Cairo: language(felt) → AIR(direct) → STARK → StarkNet',
    21: 'Circom: template(signals) → constraints(R1CS) → Groth16/PlonK',
    22: 'EVM(140 opcodes + state) → zkEVM → proof → L1(verify)',
    23: 'ZCash: private(from, to, amount) + proof(valid, no_double_spend)',
    24: 'Tornado: deposit(cm) → pool → withdraw(proof, nf) → unlinked',
    25: 'zkRollup: execute(L2) → prove → L1(verify + data)',
    26: 'Vulnerabilities: setup + parameters + circuits + implementation + protocol + upgrades',
    27: 'EIP-4844: blobs(128KB, 18 days, 1 gas/byte) → 16x cheaper',
    28: 'Bridge: prove(chain_A_state) → verify(chain_B) → trustless',
    29: 'zkML: model(committed) + data(private) + inference → proof(correct) + output',
    30: 'Sovereign Agent = {Identity, Swordsman, Mage, Reflect, Connect, Capital, Intelligence}',
  },
};

// Helper function to get spell for a proverb
const getSpellForProverb = (spellbook: 'story' | 'zero', actNumber: number): string | undefined => {
  return spellMappings[spellbook]?.[actNumber];
};

// Mock proverb proofs - in production, these would come from blockchain memos
// Display inscriptions (1 ZEC) are limited to 100 per act
// Learn proverbs (0.01 ZEC) are unlimited
const mockProverbProofs: ProverbProof[] = [];

export default function ProverbsPage() {
  const [proverbProofs, setProverbProofs] = useState<ProverbProof[]>(mockProverbProofs);
  const [selectedAct, setSelectedAct] = useState<number | null>(null);
  const [selectedSpellbook, setSelectedSpellbook] = useState<'all' | 'story' | 'zero'>('all');
  const [proofTypeFilter, setProofTypeFilter] = useState<'all' | 'learn'>('all');
  const [donationAct, setDonationAct] = useState<number | null>(null);
  const [donationSpellbook, setDonationSpellbook] = useState<'story' | 'zero'>('story');
  const [stats, setStats] = useState<any>(null);
  const [loadingStats, setLoadingStats] = useState(true);

  // Fetch stats from Oracle (optional - API may not be available)
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const oracleStats = await getStats();
        if (oracleStats) {
          setStats(oracleStats);
        }
      } catch (error) {
        // Silently handle errors - Oracle API may not be configured
        // Stats are optional and not critical for the page to function
      } finally {
        setLoadingStats(false);
      }
    };

    fetchStats();
  }, []);

  const filteredProofs = proverbProofs.filter(p => {
    const actMatch = !selectedAct || p.actNumber === selectedAct;
    const spellbookMatch = selectedSpellbook === 'all' || p.spellbook === selectedSpellbook;
    const typeMatch = proofTypeFilter === 'all' || p.type === proofTypeFilter;
    return actMatch && spellbookMatch && typeMatch;
  });

  // Get unique acts for filter
  const uniqueActs = Array.from(new Set(proverbProofs.map(p => p.actNumber))).sort((a, b) => a - b);

  // Get act info for donation
  const donationActInfo = donationAct ? {
    actNumber: donationAct,
    actName: donationSpellbook === 'story' 
      ? `Act ${donationAct}: ${proverbProofs.find(p => p.actNumber === donationAct && p.spellbook === 'story')?.actName || ''}`
      : `Tale ${donationAct}: ${proverbProofs.find(p => p.actNumber === donationAct && p.spellbook === 'zero')?.actName || taleData[donationAct]?.title || ''}`,
    spell: getSpellForProverb(donationSpellbook, donationAct),
    taleId: donationSpellbook === 'story' 
      ? getTaleIdFromAct(donationAct)
      : `zero-tale-${donationAct}`,
  } : null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/5 to-background">
      {/* Swordsman Panel */}
      {donationActInfo && (
        <SwordsmanPanel
          taleId={donationActInfo.taleId}
          actNumber={donationActInfo.actNumber}
          spellbook={donationSpellbook}
          actName={donationActInfo.actName}
          spell={donationActInfo.spell}
        />
      )}
      
      {/* Navigation Header */}
      <nav className="sticky top-0 z-50 bg-background/80 backdrop-blur-sm border-b border-surface/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-8">
              <Link href="/" className="text-xl font-bold text-text hover:text-primary transition-colors">
                agentprivacy
              </Link>
              <div className="flex items-center gap-6">
                <Link
                  href="/story"
                  className="text-text hover:text-primary transition-colors font-medium"
                >
                  story
                </Link>
                <Link
                  href="/zero"
                  className="text-text hover:text-primary transition-colors font-medium"
                >
                  zero
                </Link>
                <Link
                  href="/story/stats"
                  className="text-text hover:text-primary transition-colors font-medium"
                >
                  stats
                </Link>
                <Link
                  href="/proverbs"
                  className="text-primary border-b-2 border-primary pb-1 font-medium"
                >
                  proverbs
                </Link>
                <Link
                  href="/mage"
                  className="text-text hover:text-primary transition-colors font-medium"
                >
                  mage
                </Link>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <section className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <h1 className="text-4xl md:text-5xl font-bold text-text mb-4">Proverb Revelation Proofs</h1>
            <p className="text-text-muted text-lg mb-4">
              All published inscriptions of shared meaning. Unique compressions demonstrating deep engagement with each tale, agentic trust task primitives.
            </p>
            <p className="text-text-muted">
              A <strong className="text-text">public proverb proof</strong> is a published inscription that serves as a commitment to understanding. A verifiable demonstration of deep engagement with each tale. While proverb proofs can be used locally in peer-to-peer private exchanges, the public proof makes your engagement visible and verifiable on the blockchain, creating a permanent record that contributes to the collective wisdom of the community.
            </p>
          </motion.div>

          {/* Filters */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="card bg-surface border-surface/50 mb-8"
          >
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm text-text-muted">Spellbook:</span>
                <select
                  value={selectedSpellbook}
                  onChange={(e) => setSelectedSpellbook(e.target.value as 'all' | 'story' | 'zero')}
                  className="px-3 py-1 bg-background border border-surface/50 rounded text-text text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="all">All Spellbooks</option>
                  <option value="story">Story Spellbook</option>
                  <option value="zero">Zero Spellbook</option>
                </select>
              </div>
              
              <div className="flex items-center gap-2">
                <span className="text-sm text-text-muted">Act:</span>
                <select
                  value={selectedAct || ''}
                  onChange={(e) => setSelectedAct(e.target.value ? parseInt(e.target.value) : null)}
                  className="px-3 py-1 bg-background border border-surface/50 rounded text-text text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">All Acts</option>
                  {uniqueActs.map((actNum) => {
                    const actProof = proverbProofs.find(p => p.actNumber === actNum);
                    return (
                      <option key={actNum} value={actNum}>
                        {actProof?.actName || `Act ${actNum}`}
                      </option>
                    );
                  })}
                </select>
              </div>
              
              <div className="flex items-center gap-2">
                <span className="text-sm text-text-muted">Type:</span>
                <select
                  value={proofTypeFilter}
                  onChange={(e) => setProofTypeFilter(e.target.value as 'all' | 'learn')}
                  className="px-3 py-1 bg-background border border-surface/50 rounded text-text text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="all">All Types</option>
                  <option value="learn">[🧙‍♂️] Proverb Proofs (0.01 ZEC)</option>
                </select>
              </div>
            </div>
            
            {/* Donation Act Selection - Locked (Future Release) */}
            <div className="mt-4 pt-4 border-t border-surface/50 opacity-50 pointer-events-none">
              <p className="text-sm font-semibold text-text mb-2">Protect a Spell: <span className="text-xs text-text-muted italic">(Future Release)</span></p>
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-text-muted">Spellbook:</span>
                  <select
                    value={donationSpellbook}
                    onChange={(e) => {
                      setDonationSpellbook(e.target.value as 'story' | 'zero');
                      setDonationAct(null);
                    }}
                    disabled
                    className="px-2 py-1 bg-background border border-surface/50 rounded text-text text-xs focus:outline-none focus:ring-2 focus:ring-primary cursor-not-allowed"
                  >
                    <option value="story">Story</option>
                    <option value="zero">Zero</option>
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-text-muted">Act:</span>
                  <select
                    value={donationAct || ''}
                    onChange={(e) => setDonationAct(e.target.value ? parseInt(e.target.value) : null)}
                    disabled
                    className="px-2 py-1 bg-background border border-surface/50 rounded text-text text-xs focus:outline-none focus:ring-2 focus:ring-primary cursor-not-allowed"
                  >
                    <option value="">Select Act...</option>
                    {donationSpellbook === 'story' 
                      ? Array.from({ length: 11 }, (_, i) => i + 1).map(actNum => {
                          const actProof = proverbProofs.find(p => p.actNumber === actNum && p.spellbook === 'story');
                          return (
                            <option key={actNum} value={actNum}>
                              Act {actNum}: {actProof?.actName.replace(`Act ${actNum}: `, '') || `Act ${actNum}`}
                            </option>
                          );
                        })
                      : Array.from({ length: 30 }, (_, i) => i + 1).map(actNum => {
                          const tale = taleData[actNum];
                          return (
                            <option key={actNum} value={actNum}>
                              Tale {actNum}: {tale?.title || `Tale ${actNum}`}
                            </option>
                          );
                        })
                    }
                  </select>
                </div>
                {donationAct && (
                  <button
                    onClick={() => setDonationAct(null)}
                    className="text-xs text-text-muted hover:text-text"
                    disabled
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>
          </motion.div>

          {/* Info Box */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="mb-6 p-4 bg-background/50 border border-surface/50 rounded-lg"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs mb-4">
              <div className="bg-primary/10 border border-primary/30 rounded p-3 opacity-50">
                <div className="font-semibold text-primary mb-1 flex items-center gap-2">
                  <span>⚔️</span>
                  <span>Protecting the Spell (1 ZEC)</span>
                  <span className="text-xs text-text-muted italic ml-auto">(Future Release)</span>
                </div>
                <div className="text-text-muted mb-2">Swordsmen stake 1 ZEC to protect the spellbook. Guardians store their proverb privately in the spellbook, with public stake proof.</div>
                <div className="text-xs text-primary/80 border-t border-primary/20 pt-2 mt-2">
                  <strong>Private:</strong> Proverb in spellbook • <strong>Public:</strong> 1 ZEC stake proof
                </div>
                <div className="text-xs mt-2 pt-2 border-t border-primary/20 text-text-muted">
                  <p className="mb-1"><strong className="text-text">VRC Enhancement:</strong> Protection signals strengthen existing VRCs and demonstrate commitment to the network.</p>
                  <p className="italic text-xs mt-1 text-primary/80">"We prove the guard is posted, but keep the guard's instructions secret."</p>
                </div>
              </div>
              <div className="bg-secondary/10 border border-secondary/30 rounded p-3">
                <div className="font-semibold text-secondary mb-1 flex items-center gap-2">
                  <span>🧙‍♂️</span>
                  <span>Learning the Spell (0.01 ZEC)</span>
                </div>
                <div className="text-text-muted mb-2">Publish proverb linked to public Zcash address after shielded proverb share. Unlimited supply.</div>
                <div className="text-xs text-secondary/80 border-t border-secondary/20 pt-2 mt-2">
                  <strong>Public:</strong> Proverb commitment • <strong>Private:</strong> Fees in treasury
                </div>
                <div className="text-xs mt-2 pt-2 border-t border-secondary/20 text-text-muted">
                  <p className="mb-1"><strong className="text-text">VRC Foundation:</strong> Each signal demonstrates understanding. When you meet others who've learned, you can form bilateral VRCs.</p>
                  <p className="text-secondary/80"><strong>Progressive Trust:</strong> Signals accumulate → VRCs form → Armor earned → Guardian candidacy</p>
                  <p className="italic text-xs mt-1 text-secondary/80">"We announce the spell exists, but keep the earnings shielded."</p>
                </div>
              </div>
            </div>
            
            {/* VRC System Card - Future Release */}
            <div className="card bg-accent/10 border-accent/30 mt-4 opacity-75">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-text">(⚔️⊥🧙‍♂️)🙂 Progressive Relationship Trust System (VRC)</h3>
                <span className="text-xs text-accent/80 font-medium italic">(Future Release)</span>
              </div>
              <div className="text-xs text-text-muted mb-3 pb-3 border-b border-accent/20">
                <p><strong className="text-text">VRCs (Verifiable Relationship Credentials)</strong> are bilateral trust relationships established through demonstrated comprehension. Each learning signal builds your trust portfolio.</p>
              </div>
              <div className="mt-3 pt-3 border-t border-accent/20 text-xs text-text-muted">
                <p><strong className="text-text">How VRCs Build Trust:</strong></p>
                <ul className="list-disc list-inside space-y-1 mt-1 ml-2">
                  <li>Signals prove comprehension → Foundation for relationships</li>
                  <li>Bilateral proverbs → VRC formation with other learners</li>
                  <li>VRC portfolio → Entry to Trust Graph Planes</li>
                  <li>Progressive armor → Guardian candidacy through verified behavior</li>
                </ul>
              </div>
            </div>
          </motion.div>

          {/* Proverb Proofs List */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-4"
          >
            {filteredProofs.length === 0 ? (
              <div className="text-center py-12 text-text-muted card bg-surface border-surface/50">
                No proverb proofs found for the selected filters.
              </div>
            ) : (
              filteredProofs.map((proof, index) => (
                <motion.div
                  key={proof.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="card bg-surface border-surface/50 hover:border-primary/30 transition-colors"
                >
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2 flex-wrap">
                          <span className={`px-2 py-1 text-xs font-semibold rounded ${
                            proof.spellbook === 'story'
                              ? 'bg-primary/20 text-primary border border-primary/30'
                              : 'bg-accent/20 text-accent border border-accent/30'
                          }`}>
                            {proof.spellbook === 'story' ? 'Story' : 'Zero'} Spellbook
                          </span>
                          <span className="px-2 py-1 bg-primary/10 text-primary text-xs font-semibold rounded">
                            Act {proof.actNumber}
                          </span>
                          <span className="text-xs text-text-muted">
                            {proof.actName}
                          </span>
                          <span className="px-2 py-1 text-xs font-semibold rounded bg-secondary/20 text-secondary border border-secondary/30">
                            [🧙‍♂️] Proverb Proofs (0.01 ZEC)
                          </span>
                        </div>
                        <p className="text-text italic mb-2 text-lg leading-relaxed">
                          "{proof.proverb}"
                        </p>
                        {proof.spell && (
                          <div className="mb-2 p-2 bg-primary/5 border border-primary/20 rounded text-sm">
                            <div className="text-xs text-text-muted mb-1">Compression Spell:</div>
                            <div className="text-text font-mono text-base">{proof.spell}</div>
                          </div>
                        )}
                        <div className="flex items-center gap-4 text-xs text-text-muted">
                          <span>{proof.length} bytes</span>
                          <span>•</span>
                          <span>{new Date(proof.timestamp).toLocaleDateString()}</span>
                          <span>•</span>
                          <span className="font-mono">{proof.hash}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </motion.div>

          {/* Stats Footer */}
          <div className="mt-6 pt-6 border-t border-surface/50">
            {stats && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div className="text-center p-4 bg-surface/50 rounded-lg">
                  <div className="text-2xl font-bold text-primary mb-1">
                    {stats.total_submissions || 0}
                  </div>
                  <div className="text-xs text-text-muted">Total Submissions</div>
                </div>
                <div className="text-center p-4 bg-surface/50 rounded-lg">
                  <div className="text-2xl font-bold text-green-400 mb-1">
                    {stats.completed || 0}
                  </div>
                  <div className="text-xs text-text-muted">Inscribed</div>
                </div>
                <div className="text-center p-4 bg-surface/50 rounded-lg">
                  <div className="text-2xl font-bold text-yellow-400 mb-1">
                    {stats.avg_quality_score ? (stats.avg_quality_score * 100).toFixed(1) + '%' : 'N/A'}
                  </div>
                  <div className="text-xs text-text-muted">Avg Quality Score</div>
                </div>
              </div>
            )}
            <div className="text-center">
              <p className="text-xs text-text-muted">
                Showing {filteredProofs.length} of {proverbProofs.length} proverb proofs
                {selectedSpellbook !== 'all' && ` from ${selectedSpellbook} spellbook`}
                {selectedAct && ` in ${proverbProofs.find(p => p.actNumber === selectedAct)?.actName || `Act ${selectedAct}`}`}
              </p>
              <p className="text-xs text-text-muted mt-2">
                Privacy-preserving: Only proverb content and metadata shown. No wallet addresses or amounts.
              </p>
              {loadingStats && (
                <p className="text-xs text-text-muted mt-2">
                  Loading statistics from Oracle...
                </p>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

