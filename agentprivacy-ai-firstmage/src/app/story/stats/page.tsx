'use client';

import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import SwordsmanPanel from '@/components/SwordsmanPanel';
import { getTaleIdFromAct } from '@/lib/zcash-memo';

// Spell mappings for both spellbooks - must match inscriptions
const spellMappings: { [key: string]: { [actNumber: number]: string } } = {
  story: {
    1: '📖💰 → 🐉⏳ → ⚔️🔮',
    2: '🗡️🔮 ← 👤✓ → 🔒📝 → 🤝📜 → 🕸️',
    3: '👤✓ → ⚔️📖 → 🔒📝 → 🤝📜 → 🕸️✓ → 🌐🏛️',
    4: '🗡️ → 🍪⚔️ → 🔒 → 📖📝 → 🤝📜₁',
    5: '🗡️📖 + 🤝📜₃ → 🛡️ → ⚔️⚔️⚔️ → 🔒📝₊',
    6: '🤝📜 + 🤝📜 + 🤝📜 = 🚪🌐',
    7: '1️⃣🤖 → 🪞→👤\n2️⃣🤖 → 🪞→✨ + 👤',
    8: '🗡️📖 + 🤝📜₁₅ → 🛡️🛡️ → 💎🏛️',
    9: '🛡️ → 🛡️⚡ → 💰🔒 → 🕶️🦓',
    10: '🌳 ⊥ 🐦‍⬛🧠 → 🐦‍⬛💭 → △{🌳, 🐦‍⬛💭, 🐦‍⬛🧠}',
    11: '⚔️ ➗ 📖 = 🌀',
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

interface ActStats {
  actNumber: number;
  actName: string;
  spellbook: 'story' | 'zero';
  displayInscriptions: number; // 1 ZEC donations (max 100 per act)
  learnedProverbs: number; // 0.01 ZEC donations (unlimited)
  totalDisplayValue: number; // displayInscriptions * 1.0
  totalLearnValue: number; // learnedProverbs * 0.01
  lastDonation?: string; // timestamp
}

// Mock data - in production, this would come from blockchain/VRC tracking
const mockStats: ActStats[] = [
  // Story Spellbook
  { actNumber: 1, actName: 'Act I: Venice', spellbook: 'story', displayInscriptions: 0, learnedProverbs: 0, totalDisplayValue: 0, totalLearnValue: 0 },
  { actNumber: 2, actName: 'Act II: Dual Ceremony', spellbook: 'story', displayInscriptions: 0, learnedProverbs: 0, totalDisplayValue: 0, totalLearnValue: 0 },
  { actNumber: 3, actName: 'Act III: Drake\'s Teaching', spellbook: 'story', displayInscriptions: 0, learnedProverbs: 0, totalDisplayValue: 0, totalLearnValue: 0 },
  { actNumber: 4, actName: 'Act IV: Blade Alone', spellbook: 'story', displayInscriptions: 0, learnedProverbs: 0, totalDisplayValue: 0, totalLearnValue: 0 },
  { actNumber: 5, actName: 'Act V: Light Armour', spellbook: 'story', displayInscriptions: 0, learnedProverbs: 0, totalDisplayValue: 0, totalLearnValue: 0 },
  { actNumber: 6, actName: 'Act VI: Trust Graph Plane', spellbook: 'story', displayInscriptions: 0, learnedProverbs: 0, totalDisplayValue: 0, totalLearnValue: 0 },
  { actNumber: 7, actName: 'Act VII: Mirror Enhanced', spellbook: 'story', displayInscriptions: 0, learnedProverbs: 0, totalDisplayValue: 0, totalLearnValue: 0 },
  { actNumber: 8, actName: 'Act VIII: Ancient Rule', spellbook: 'story', displayInscriptions: 0, learnedProverbs: 0, totalDisplayValue: 0, totalLearnValue: 0 },
  { actNumber: 9, actName: 'Act IX: Zcash Shield', spellbook: 'story', displayInscriptions: 0, learnedProverbs: 0, totalDisplayValue: 0, totalLearnValue: 0 },
  { actNumber: 10, actName: 'Act X: Topology of Revelation', spellbook: 'story', displayInscriptions: 0, learnedProverbs: 0, totalDisplayValue: 0, totalLearnValue: 0 },
  { actNumber: 11, actName: 'Act XI: Balanced Spiral', spellbook: 'story', displayInscriptions: 0, learnedProverbs: 0, totalDisplayValue: 0, totalLearnValue: 0 },
  
  // Zero Spellbook
  { actNumber: 1, actName: 'Zero: The Beginning', spellbook: 'zero', displayInscriptions: 0, learnedProverbs: 0, totalDisplayValue: 0, totalLearnValue: 0 },
  { actNumber: 2, actName: 'Zero: The Void', spellbook: 'zero', displayInscriptions: 0, learnedProverbs: 0, totalDisplayValue: 0, totalLearnValue: 0 },
];


export default function StoryStatsPage() {
  const [stats, setStats] = useState<ActStats[]>(mockStats);
  const [selectedSpellbook, setSelectedSpellbook] = useState<'all' | 'story' | 'zero'>('all');
  const [totalDisplayValue, setTotalDisplayValue] = useState(0);
  const [totalLearnValue, setTotalLearnValue] = useState(0);
  const [totalDisplayInscriptions, setTotalDisplayInscriptions] = useState(0);
  const [totalLearnedProverbs, setTotalLearnedProverbs] = useState(0);
  const [donationAct, setDonationAct] = useState<number | null>(null);
  const [donationSpellbook, setDonationSpellbook] = useState<'story' | 'zero'>('story');
  
  // Calculate totals by spellbook
  const storyStats = stats.filter(s => s.spellbook === 'story');
  const zeroStats = stats.filter(s => s.spellbook === 'zero');
  
  const storyDisplayTotal = storyStats.reduce((sum, act) => sum + act.totalDisplayValue, 0);
  const storyLearnTotal = storyStats.reduce((sum, act) => sum + act.totalLearnValue, 0);
  const storyDisplayCount = storyStats.reduce((sum, act) => sum + act.displayInscriptions, 0);
  const storyLearnCount = storyStats.reduce((sum, act) => sum + act.learnedProverbs, 0);
  
  const zeroDisplayTotal = zeroStats.reduce((sum, act) => sum + act.totalDisplayValue, 0);
  const zeroLearnTotal = zeroStats.reduce((sum, act) => sum + act.totalLearnValue, 0);
  const zeroDisplayCount = zeroStats.reduce((sum, act) => sum + act.displayInscriptions, 0);
  const zeroLearnCount = zeroStats.reduce((sum, act) => sum + act.learnedProverbs, 0);

  useEffect(() => {
    // Calculate totals based on selected spellbook
    const filteredStats = selectedSpellbook === 'all' 
      ? stats 
      : stats.filter(s => s.spellbook === selectedSpellbook);
    
    const displayTotal = filteredStats.reduce((sum, act) => sum + act.totalDisplayValue, 0);
    const learnTotal = filteredStats.reduce((sum, act) => sum + act.totalLearnValue, 0);
    const displayCount = filteredStats.reduce((sum, act) => sum + act.displayInscriptions, 0);
    const learnCount = filteredStats.reduce((sum, act) => sum + act.learnedProverbs, 0);
    setTotalDisplayValue(displayTotal);
    setTotalLearnValue(learnTotal);
    setTotalDisplayInscriptions(displayCount);
    setTotalLearnedProverbs(learnCount);
  }, [stats, selectedSpellbook]);

  const filteredStats = selectedSpellbook === 'all' 
    ? stats 
    : stats.filter(s => s.spellbook === selectedSpellbook);

  // Get act info for donation
  const donationActInfo = donationAct ? {
    actNumber: donationAct,
    actName: stats.find(s => s.actNumber === donationAct && s.spellbook === donationSpellbook)?.actName || `Act ${donationAct}`,
    spell: spellMappings[donationSpellbook]?.[donationAct],
    taleId: donationSpellbook === 'story' ? getTaleIdFromAct(donationAct) : `zero-tale-${donationAct}`,
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
                  className="text-primary border-b-2 border-primary pb-1 font-medium"
                >
                  stats
                </Link>
                <Link
                  href="/proverbs"
                  className="text-text hover:text-primary transition-colors font-medium"
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
            <h1 className="text-4xl md:text-5xl font-bold text-text mb-4">Spellbook Stats</h1>
            <p className="text-text-muted text-lg">
              Protection statistics split by Story and Zero spellbooks
            </p>
            
            {/* Spellbook Filter */}
            <div className="mt-4 flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm text-text-muted">Filter by Spellbook:</span>
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
              
              {/* Learn a Spell Selection */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-text-muted">Learn a Spell:</span>
                <select
                  value={donationSpellbook}
                  onChange={(e) => {
                    setDonationSpellbook(e.target.value as 'story' | 'zero');
                    setDonationAct(null);
                  }}
                  className="px-2 py-1 bg-background border border-secondary/50 rounded text-text text-xs focus:outline-none focus:ring-2 focus:ring-secondary"
                >
                  <option value="story">Story</option>
                  <option value="zero">Zero</option>
                </select>
                <select
                  value={donationAct || ''}
                  onChange={(e) => setDonationAct(e.target.value ? parseInt(e.target.value) : null)}
                  className="px-2 py-1 bg-background border border-secondary/50 rounded text-text text-xs focus:outline-none focus:ring-2 focus:ring-secondary"
                >
                  <option value="">Select Act...</option>
                  {stats
                    .filter(s => s.spellbook === donationSpellbook)
                    .map(act => (
                      <option key={`${act.spellbook}-${act.actNumber}`} value={act.actNumber}>
                        {act.actName}
                      </option>
                    ))
                  }
                </select>
                {donationAct && (
                  <button
                    onClick={() => setDonationAct(null)}
                    className="text-xs text-text-muted hover:text-text"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>
          </motion.div>

          {/* Donation Stats Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="card bg-surface border-surface/50 mb-8"
          >
            <h2 className="text-2xl font-bold text-text mb-6 flex items-center gap-2">
              <span>📊</span>
              <span>Spellbook Statistics</span>
            </h2>
            <div className="mb-6 p-4 bg-accent/10 border border-accent/30 rounded-lg text-xs">
              <h3 className="font-semibold text-text mb-2">(⚔️⊥🧙‍♂️)🙂 Progressive Relationship Trust System (VRC)</h3>
              <p className="text-text-muted mb-3 pb-3 border-b border-accent/20">
                <strong className="text-text">VRCs (Verifiable Relationship Credentials)</strong> are bilateral trust relationships established through demonstrated comprehension. Each learning signal builds your trust portfolio, enabling progressive trust and network coordination.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                <div className="bg-secondary/10 border-2 border-secondary/40 rounded p-3">
                  <div className="font-semibold text-secondary mb-1 flex items-center gap-2">
                    <span>🧙‍♂️</span>
                    <span>Learning the Spell (0.01 ZEC) - Active</span>
                    <span className="text-xs bg-secondary/30 text-secondary px-1.5 py-0.5 rounded ml-auto">Focus</span>
                  </div>
                  <p className="text-text-muted"><strong className="text-text">Public:</strong> Proverb commitment</p>
                  <p className="text-text-muted"><strong className="text-text">Private:</strong> Fees in treasury</p>
                  <p className="text-xs text-secondary mt-2 pt-2 border-t border-secondary/20">
                    <strong>VRC Foundation:</strong> Each signal demonstrates understanding and enables VRC formation with other learners
                  </p>
                </div>
                <div className="bg-surface/20 border border-surface/40 rounded p-3 opacity-60">
                  <div className="font-semibold text-text-muted mb-1 flex items-center gap-2">
                    <span>⚔️</span>
                    <span>Protecting the Spell (1 ZEC) - Locked</span>
                    <span className="text-xs bg-surface/30 text-text-muted px-1.5 py-0.5 rounded ml-auto">🔒</span>
                  </div>
                  <p className="text-text-muted"><strong className="text-text-muted">Private:</strong> Proverb in spellbook</p>
                  <p className="text-text-muted"><strong className="text-text-muted">Public:</strong> 1 ZEC stake proof</p>
                  <p className="text-xs text-text-muted mt-2 pt-2 border-t border-surface/20">
                    <strong>VRC Enhancement:</strong> Protection signals strengthen existing VRCs and demonstrate commitment
                  </p>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-accent/20">
                <p className="text-text-muted mb-2"><strong className="text-text">How VRCs Build Progressive Trust:</strong></p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-text-muted">
                  <div>
                    <p>• <strong className="text-text">Signals</strong> → Prove comprehension</p>
                    <p>• <strong className="text-text">Bilateral proverbs</strong> → VRC formation</p>
                  </div>
                  <div>
                    <p>• <strong className="text-text">VRC portfolio</strong> → Trust Graph entry</p>
                    <p>• <strong className="text-text">Progressive armor</strong> → Guardian candidacy</p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Summary Cards - Story Spellbook */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-primary mb-3">Story Spellbook</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-surface/20 border border-surface/40 rounded-lg p-4 opacity-60 relative">
                  <div className="absolute top-2 right-2">
                    <span className="text-xs bg-surface/90 text-text-muted px-2 py-1 rounded border border-surface/50">🔒 Locked</span>
                  </div>
                  <div className="flex items-center gap-2 mb-1">
                    <span>⚔️</span>
                    <div className="text-text-muted text-sm">Protecting the Spell</div>
                  </div>
                  <div className="text-3xl font-bold text-text-muted">{storyDisplayCount} / 1100</div>
                  <div className="text-xs text-text-muted mt-1">{storyDisplayTotal.toFixed(2)} ZEC (1 ZEC each)</div>
                  <div className="text-xs text-text-muted mt-2">Guardians per act • Proverb stored privately • Public stake proof</div>
                  <div className="text-xs text-text-muted/60 mt-2 border-t border-surface/20 pt-2">
                    <strong>Available later:</strong> In future versions after experimenting with learning and signaling
                  </div>
                </div>
                <div className="bg-secondary/10 border border-secondary/30 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <span>🧙‍♂️</span>
                    <div className="text-text-muted text-sm">Learning the Spell</div>
                  </div>
                  <div className="text-3xl font-bold text-secondary">{storyLearnCount}</div>
                  <div className="text-xs text-text-muted mt-1">{storyLearnTotal.toFixed(2)} ZEC (0.01 ZEC each)</div>
                  <div className="text-xs text-secondary mt-2">Publish to public address • Unlimited</div>
                  <div className="text-xs text-secondary/80 mt-2 border-t border-secondary/20 pt-2">
                    <strong>Public:</strong> Proverb commitment • <strong>Private:</strong> Fees in treasury
                  </div>
                </div>
              </div>
            </div>

            {/* Summary Cards - Zero Spellbook */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-accent mb-3">Zero Spellbook</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-surface/20 border border-surface/40 rounded-lg p-4 opacity-60 relative">
                  <div className="absolute top-2 right-2">
                    <span className="text-xs bg-surface/90 text-text-muted px-2 py-1 rounded border border-surface/50">🔒 Locked</span>
                  </div>
                  <div className="flex items-center gap-2 mb-1">
                    <span>⚔️</span>
                    <div className="text-text-muted text-sm">Protecting the Spell</div>
                  </div>
                  <div className="text-3xl font-bold text-text-muted">{zeroDisplayCount} / 3000</div>
                  <div className="text-xs text-text-muted mt-1">{zeroDisplayTotal.toFixed(2)} ZEC (1 ZEC each)</div>
                  <div className="text-xs text-text-muted mt-2">Guardians per tale • Proverb stored privately • Public stake proof</div>
                  <div className="text-xs text-text-muted/60 mt-2 border-t border-surface/20 pt-2">
                    <strong>Available later:</strong> In future versions after experimenting with learning and signaling
                  </div>
                </div>
                <div className="bg-secondary/10 border border-secondary/30 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <span>🧙‍♂️</span>
                    <div className="text-text-muted text-sm">Learning the Spell</div>
                  </div>
                  <div className="text-3xl font-bold text-secondary">{zeroLearnCount}</div>
                  <div className="text-xs text-text-muted mt-1">{zeroLearnTotal.toFixed(2)} ZEC (0.01 ZEC each)</div>
                  <div className="text-xs text-secondary mt-2">Publish to public address • Unlimited</div>
                  <div className="text-xs text-secondary/80 mt-2 border-t border-secondary/20 pt-2">
                    <strong>Public:</strong> Proverb commitment • <strong>Private:</strong> Fees in treasury
                  </div>
                </div>
              </div>
            </div>
            
            {/* Total Value */}
            <div className="mb-6 p-4 bg-accent/10 border border-accent/30 rounded-lg text-center">
              <div className="text-text-muted text-sm mb-1">Total Value</div>
              <div className="text-2xl font-bold text-accent">{((storyDisplayTotal + storyLearnTotal) + (zeroDisplayTotal + zeroLearnTotal)).toFixed(2)} ZEC</div>
            </div>


            {/* Acts Breakdown */}
            <div>
              <h3 className="text-lg font-semibold text-text mb-4">
                {selectedSpellbook === 'all' ? 'All Acts' : selectedSpellbook === 'story' ? 'Story Spellbook Acts' : 'Zero Spellbook Acts'}
              </h3>
              <div className="space-y-3">
                {filteredStats.map((act) => (
                  <div
                    key={`${act.spellbook}-${act.actNumber}`}
                    className="p-4 bg-background/50 border border-surface/50 rounded-lg hover:border-primary/30 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-text">{act.actName}</span>
                          <span className={`px-2 py-1 text-xs font-semibold rounded ${
                            act.spellbook === 'story'
                              ? 'bg-primary/20 text-primary border border-primary/30'
                              : 'bg-accent/20 text-accent border border-accent/30'
                          }`}>
                            {act.spellbook === 'story' ? 'Story' : 'Zero'}
                          </span>
                        </div>
                        <div className="text-sm text-text-muted">
                          {act.displayInscriptions} displayed • {act.learnedProverbs} published
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-primary">{(act.totalDisplayValue + act.totalLearnValue).toFixed(2)} ZEC</div>
                        <div className="text-xs text-text-muted">
                          {act.totalDisplayValue.toFixed(2)} + {act.totalLearnValue.toFixed(2)}
                        </div>
                      </div>
                    </div>
                    
                    {/* Story Supporters Progress */}
                    <div className="mb-2">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-text-muted">Spellbook Supporters: {act.displayInscriptions} / 100</span>
                        <span className="text-primary font-semibold">{act.totalDisplayValue.toFixed(2)} ZEC</span>
                      </div>
                      <div className="h-2 bg-background rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${(act.displayInscriptions / 100) * 100}%` }}
                          className="h-full bg-primary"
                        />
                      </div>
                    </div>
                    
                    {/* Published Proverbs Count */}
                    <div className="text-xs text-text-muted">
                      Published: {act.learnedProverbs} proverbs ({act.totalLearnValue.toFixed(2)} ZEC) • Linked to public addresses
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Link to Proverbs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="card bg-surface border-surface/50 text-center"
          >
            <p className="text-text-muted mb-3">
              View all published proverb proofs and inscriptions of meaning
            </p>
            <Link
              href="/proverbs"
              className="btn-primary inline-block"
            >
              View All Proverbs →
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  );
}


