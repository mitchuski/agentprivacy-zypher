'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import SwordsmanPanel from '@/components/SwordsmanPanel';
import UAddressDisplay from '@/components/UAddressDisplay';
import TAddressDisplay from '@/components/TAddressDisplay';
import { getTaleIdFromAct } from '@/lib/zcash-memo';
import { getInscriptions } from '@/lib/oracle-api';

// On-chain inscription from the inscription indexer
interface Inscription {
  txid: string;
  blockHeight: number;
  blockTime: number;
  actNumber: number;
  actTitle: string;
  proverb: string;
  emojiSpell: string;
  matchScore: number;
  contentHash: string;
  refTxid: string;
  rawContent: string;
  sourceAddress: string;
  confirmations: number;
}

// Spell mappings for Story spellbook
const spellMappings: { [actNumber: number]: string } = {
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
  12: '🔮 → 📖 → ∞',
};

// Act titles
const actTitles: { [actNumber: number]: string } = {
  1: "Venice, 1494 / The Drake's First Whisper",
  2: 'The Dual Ceremony / Sovereignty Divided to Be Extended',
  3: "The Drake's Teaching / A Tale of Conditions",
  4: 'The Blade Alone / First Adventures',
  5: 'Light Armor / Multi-Site Coordination',
  6: 'Trust Graph Plane / Where Agents Gather',
  7: 'The Mirror That Never Completes / The Anti-Mirror',
  8: 'The Ancient Rule / Two-of-Three Locks',
  9: 'Zcash Shield / Forging Cryptographic Privacy',
  10: 'Topology of Revelation / Triangle Geometry',
  11: 'Balanced Spiral of Sovereignty / The Golden Ratio',
  12: 'The Forgetting / Proverbiogenesis',
};

// Helper to get Roman numeral
function getRomanNumeral(num: number): string {
  const roman: { [key: number]: string } = {
    1: 'I', 2: 'II', 3: 'III', 4: 'IV', 5: 'V', 6: 'VI',
    7: 'VII', 8: 'VIII', 9: 'IX', 10: 'X', 11: 'XI', 12: 'XII',
  };
  return roman[num] || String(num);
}

export default function ProverbsPage() {
  const [inscriptions, setInscriptions] = useState<Inscription[]>([]);
  const [inscriptionsLoading, setInscriptionsLoading] = useState(true);
  const [inscriptionCountByAct, setInscriptionCountByAct] = useState<Record<number, number>>({});
  const [expandedActs, setExpandedActs] = useState<Set<number>>(new Set([1, 2, 3, 4, 5, 6])); // Expand acts with inscriptions by default
  const [donationAct, setDonationAct] = useState<number | null>(null);

  // Fetch on-chain inscriptions
  useEffect(() => {
    const loadInscriptions = async () => {
      try {
        setInscriptionsLoading(true);
        const data = await getInscriptions();
        if (data) {
          setInscriptions(data.inscriptions || []);
          setInscriptionCountByAct(data.countByAct || {});
        }
      } catch (error) {
        console.error('Error loading inscriptions:', error);
      } finally {
        setInscriptionsLoading(false);
      }
    };

    loadInscriptions();
  }, []);

  const toggleAct = (actNumber: number) => {
    setExpandedActs((prev) => {
      const next = new Set(prev);
      if (next.has(actNumber)) {
        next.delete(actNumber);
      } else {
        next.add(actNumber);
      }
      return next;
    });
  };

  // Get act info for donation panel
  const donationActInfo = donationAct ? {
    actNumber: donationAct,
    actName: `Act ${getRomanNumeral(donationAct)}: ${actTitles[donationAct]?.split(' / ')[0] || ''}`,
    spell: spellMappings[donationAct],
    taleId: getTaleIdFromAct(donationAct),
  } : null;

  // Calculate totals
  const totalInscriptions = inscriptions.length;
  const actsWithInscriptions = Object.keys(inscriptionCountByAct).length;

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/5 to-background">
      {/* Swordsman Panel */}
      {donationActInfo && (
        <SwordsmanPanel
          taleId={donationActInfo.taleId}
          actNumber={donationActInfo.actNumber}
          spellbook="story"
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
                <Link href="/story" className="text-text hover:text-primary transition-colors font-medium">
                  story
                </Link>
                <Link href="/zero" className="text-text hover:text-primary transition-colors font-medium">
                  zero
                </Link>
                <Link href="/proverbs" className="text-primary border-b-2 border-primary pb-1 font-medium">
                  proverbs
                </Link>
                <Link href="/mage" className="text-text hover:text-primary transition-colors font-medium">
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
          {/* Header */}
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

          {/* Address Display Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="mb-8"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <UAddressDisplay variant="proverb-button" />
              <TAddressDisplay variant="proverb-button" label="inscription address" />
            </div>
          </motion.div>

          {/* VRC System Info */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-8"
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
                  <p className="text-secondary/80"><strong>Progressive Trust:</strong> Signals accumulate → VRCs form → Armor earned → Guardian candidacy</p>
                </div>
              </div>
            </div>

            {/* VRC System Card */}
            <div className="card bg-accent/10 border-accent/30">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-text">(⚔️⊥🧙‍♂️)🙂 Progressive Relationship Trust System (VRC)</h3>
              </div>
              <div className="text-xs text-text-muted mb-3 pb-3 border-b border-accent/20">
                <p><strong className="text-text">VRCs (Verifiable Relationship Credentials)</strong> are bilateral trust relationships established through demonstrated comprehension. Each learning signal builds your trust portfolio.</p>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs text-text-muted">
                <p>• Signals prove comprehension</p>
                <p>• Bilateral proverbs → VRC formation</p>
                <p>• VRC portfolio → Trust Graph entry</p>
                <p>• Progressive armor → Guardian candidacy</p>
              </div>
            </div>
          </motion.div>

          {/* Stats Summary */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="mb-8 grid grid-cols-2 md:grid-cols-4 gap-4"
          >
            <div className="text-center p-4 bg-primary/10 border border-primary/30 rounded-lg">
              <div className="text-3xl font-bold text-primary mb-1">{totalInscriptions}</div>
              <div className="text-xs text-text-muted">Total Inscriptions</div>
            </div>
            <div className="text-center p-4 bg-secondary/10 border border-secondary/30 rounded-lg">
              <div className="text-3xl font-bold text-secondary mb-1">{actsWithInscriptions}</div>
              <div className="text-xs text-text-muted">Acts with Proofs</div>
            </div>
            <div className="text-center p-4 bg-accent/10 border border-accent/30 rounded-lg">
              <div className="text-3xl font-bold text-accent mb-1">12</div>
              <div className="text-xs text-text-muted">Total Acts</div>
            </div>
            <div className="text-center p-4 bg-surface/50 border border-surface/50 rounded-lg">
              <div className="text-3xl font-bold text-text mb-1">{(totalInscriptions * 0.01).toFixed(2)}</div>
              <div className="text-xs text-text-muted">ZEC Committed</div>
            </div>
          </motion.div>

          {/* Learn a Spell Selection */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-8 p-4 bg-secondary/10 border border-secondary/30 rounded-lg"
          >
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-secondary">🧙‍♂️ Learn a Spell:</span>
                <select
                  value={donationAct || ''}
                  onChange={(e) => setDonationAct(e.target.value ? parseInt(e.target.value) : null)}
                  className="px-3 py-1 bg-background border border-secondary/50 rounded text-text text-sm focus:outline-none focus:ring-2 focus:ring-secondary"
                >
                  <option value="">Select Act...</option>
                  {Array.from({ length: 12 }, (_, i) => i + 1).map(actNum => (
                    <option key={actNum} value={actNum}>
                      Act {getRomanNumeral(actNum)}: {actTitles[actNum]?.split(' / ')[0] || `Act ${actNum}`}
                    </option>
                  ))}
                </select>
                {donationAct && (
                  <button
                    onClick={() => setDonationAct(null)}
                    className="text-xs text-text-muted hover:text-text px-2"
                  >
                    Clear
                  </button>
                )}
              </div>
              <p className="text-xs text-text-muted">
                Select an act to open the Swordsman Panel and submit your proverb proof (0.01 ZEC)
              </p>
            </div>
          </motion.div>

          {/* On-Chain Inscriptions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="mb-8"
          >
            <h2 className="text-2xl font-bold text-text mb-4">On-Chain Proof Inscriptions</h2>

            {inscriptionsLoading ? (
              <div className="text-center py-12 text-text-muted">
                Loading inscriptions from blockchain...
              </div>
            ) : inscriptions.length === 0 ? (
              <div className="text-center py-12 text-text-muted bg-surface/20 rounded-lg border border-surface/30">
                No inscriptions found yet. Be the first to inscribe your proverb proof!
              </div>
            ) : (
              <div className="space-y-4">
                {/* Group inscriptions by act */}
                {Array.from({ length: 12 }, (_, i) => i + 1).map((actNum) => {
                  const actInscriptions = inscriptions.filter(i => i.actNumber === actNum);
                  const isExpanded = expandedActs.has(actNum);
                  const hasInscriptions = actInscriptions.length > 0;

                  return (
                    <motion.div
                      key={`act-${actNum}`}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`p-4 rounded-lg border transition-colors ${
                        hasInscriptions
                          ? 'bg-gradient-to-r from-primary/10 to-secondary/10 border-primary/30 hover:border-primary/50'
                          : 'bg-surface/20 border-surface/30 opacity-60'
                      }`}
                    >
                      {/* Act Header */}
                      <div
                        className="flex items-center justify-between cursor-pointer"
                        onClick={() => toggleAct(actNum)}
                      >
                        <div className="flex items-center gap-3">
                          <span className={`text-lg font-bold ${hasInscriptions ? 'text-primary' : 'text-text-muted'}`}>
                            Act {getRomanNumeral(actNum)}
                          </span>
                          <span className="text-text-muted">•</span>
                          <span className={`text-sm ${hasInscriptions ? 'text-text' : 'text-text-muted'}`}>
                            {actTitles[actNum]?.split(' / ')[0] || `Act ${actNum}`}
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={`px-2 py-1 text-xs font-semibold rounded ${
                            hasInscriptions
                              ? 'bg-primary/20 text-primary border border-primary/30'
                              : 'bg-surface/30 text-text-muted border border-surface/30'
                          }`}>
                            {actInscriptions.length} inscription{actInscriptions.length !== 1 ? 's' : ''}
                          </span>
                          <span className="text-text-muted text-sm">
                            {isExpanded ? '▼' : '▶'}
                          </span>
                        </div>
                      </div>

                      {/* Spell */}
                      {spellMappings[actNum] && (
                        <div className="mt-2 text-xs font-mono text-text-muted">
                          {spellMappings[actNum]}
                        </div>
                      )}

                      {/* Expanded Inscriptions */}
                      <AnimatePresence>
                        {isExpanded && hasInscriptions && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.3 }}
                            className="overflow-hidden"
                          >
                            <div className="mt-4 pt-4 border-t border-surface/30 space-y-3">
                              {actInscriptions.map((inscription) => (
                                <div
                                  key={inscription.txid}
                                  className="p-3 bg-background/60 border border-surface/40 rounded-lg"
                                >
                                  <div className="flex items-start gap-3">
                                    {inscription.emojiSpell && (
                                      <span className="text-2xl flex-shrink-0" title="Emoji Spell">
                                        {inscription.emojiSpell}
                                      </span>
                                    )}
                                    <div className="flex-1 min-w-0">
                                      <p className="text-text italic mb-2 leading-relaxed">
                                        "{inscription.proverb}"
                                      </p>
                                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-text-muted">
                                        {inscription.matchScore > 0 && (
                                          <span title="Match Score">
                                            Score: {(inscription.matchScore * 100).toFixed(0)}%
                                          </span>
                                        )}
                                        <span title="Block Height">
                                          Block: {inscription.blockHeight.toLocaleString()}
                                        </span>
                                        <span title="Confirmations">
                                          {inscription.confirmations.toLocaleString()} conf.
                                        </span>
                                        <a
                                          href={`https://mainnet.zcashexplorer.app/transactions/${inscription.txid}`}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="font-mono text-primary hover:text-primary/80 transition-colors"
                                          title={inscription.txid}
                                          onClick={(e) => e.stopPropagation()}
                                        >
                                          {inscription.txid.substring(0, 12)}...
                                        </a>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {/* Empty state for acts without inscriptions */}
                      <AnimatePresence>
                        {isExpanded && !hasInscriptions && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.3 }}
                            className="overflow-hidden"
                          >
                            <div className="mt-4 pt-4 border-t border-surface/30 text-center py-4 text-sm text-text-muted">
                              No inscriptions yet for this act.{' '}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setDonationAct(actNum);
                                }}
                                className="text-secondary hover:text-secondary/80 underline"
                              >
                                Be the first to inscribe!
                              </button>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </motion.div>

          {/* Footer Info */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-center text-xs text-text-muted pt-8 border-t border-surface/30"
          >
            <p className="mb-2">
              All inscriptions are permanently stored on the Zcash blockchain.
            </p>
            <p>
              Privacy-preserving: Only proverb content shown. Wallet addresses remain private through shielded transactions.
            </p>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
