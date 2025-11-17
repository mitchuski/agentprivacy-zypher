'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatZcashMemo, validateProverb } from '@/lib/zcash-memo';

interface SwordsmanPanelProps {
  taleId: string;
  actNumber: number;
  spellbook?: 'story' | 'zero';
  actName?: string;
  spell?: string;
}

export default function SwordsmanPanel({ taleId, actNumber, spellbook, actName, spell }: SwordsmanPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [userProverb, setUserProverb] = useState('');
  const [copied, setCopied] = useState(false);
  const [spellCopied, setSpellCopied] = useState(false);
  const [mageWindow, setMageWindow] = useState<Window | null>(null);
  const [selectedOption, setSelectedOption] = useState<'proverbs' | 'supporters'>('proverbs');

  // Check if proverb is valid
  const validation = userProverb ? validateProverb(userProverb) : null;

  // Handle opening mage page
  const handleTalkToSoulbae = () => {
    const mageUrl = `/mage?tale_id=${taleId}&context=donation`;
    const newWindow = window.open(mageUrl, '_blank', 'width=800,height=900');
    setMageWindow(newWindow);
  };

  // Handle copy to Zashi
  const handleCopyToZashi = async () => {
    if (!userProverb.trim()) return;

    const memo = formatZcashMemo(taleId, userProverb.trim());
    
    try {
      await navigator.clipboard.writeText(memo);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch (err) {
      console.error('Failed to copy memo:', err);
    }
  };

  // Handle copy spell
  const handleCopySpell = async () => {
    if (!spell) return;

    try {
      await navigator.clipboard.writeText(spell);
      setSpellCopied(true);
      setTimeout(() => setSpellCopied(false), 3000);
    } catch (err) {
      console.error('Failed to copy spell:', err);
    }
  };

  // Listen for messages from mage window (if user copies proverb there)
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // Only accept messages from same origin
      if (event.origin !== window.location.origin) return;
      
      if (event.data.type === 'PROVERB_COPIED' && event.data.proverb) {
        setUserProverb(event.data.proverb);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  return (
    <>
      {/* Toggle Button - Fixed on right side */}
      {!isOpen && (
        <motion.button
          initial={{ x: 100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 100, opacity: 0 }}
          onClick={() => setIsOpen(!isOpen)}
          className="fixed right-0 top-1/2 z-[60] transform -translate-y-1/2"
          data-swordsman-toggle
        >
          <div className="bg-primary/90 hover:bg-primary text-white px-4 py-6 rounded-l-lg shadow-lg flex items-center gap-2 transition-all">
            <span className="text-xl">⚔️</span>
            <span className="font-medium hidden sm:inline">Swordsman</span>
          </div>
        </motion.button>
      )}

      {/* Panel */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black/50 z-[55] md:hidden"
            />

            {/* Panel */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 h-full w-full sm:w-96 bg-surface border-l border-surface/50 z-[60] shadow-2xl overflow-y-auto"
            >
              <div className="p-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">⚔️</span>
                    <div>
                      <h2 className="text-xl font-bold text-text">Swordsman</h2>
                      <p className="text-sm text-text-muted">Your wallet, your control</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="text-text-muted hover:text-text text-2xl leading-none"
                  >
                    ×
                  </button>
                </div>

                {/* Info Card */}
                <div className="card bg-primary/10 border-primary/30 mb-6">
                  <p className="text-sm text-text-muted mb-2">
                    <strong className="text-text">The Swordsman</strong> is your wallet. You control the transaction amount, verify privacy, and approve spending.
                  </p>
                  <p className="text-xs text-text-muted">
                    Soulbae (the Mage) helps craft your proverb but never sees your amount or wallet.
                  </p>
                </div>

                {/* (⚔️⊥🧙‍♂️)🙂 Card */}
                <div className="card bg-accent/10 border-accent/30 mb-6">
                  <h3 className="text-sm font-semibold text-text mb-3">(⚔️⊥🧙‍♂️)🙂</h3>
                  <div className="space-y-3 text-xs">
                    <div className="bg-secondary/10 border border-secondary/30 rounded p-3">
                      <div className="font-semibold text-secondary mb-1 flex items-center gap-2">
                        <span>🧙‍♂️</span>
                        <span>Learning the Spell (0.01 ZEC)</span>
                      </div>
                      <div className="text-text-muted space-y-1">
                        <p><strong className="text-text">Public:</strong> The proverb commitment (so other agents can discover and verify the knowledge)</p>
                        <p><strong className="text-text">Private:</strong> The fees collected in the spellbook treasury</p>
                        <p className="italic text-xs mt-1">"We announce the spell exists, but keep the earnings shielded."</p>
                      </div>
                    </div>
                    <div className="bg-primary/10 border border-primary/30 rounded p-3">
                      <div className="font-semibold text-primary mb-1 flex items-center gap-2">
                        <span>⚔️</span>
                        <span>Protecting the Spell (1 ZEC)</span>
                      </div>
                      <div className="text-text-muted space-y-1">
                        <p><strong className="text-text">Private:</strong> The proverb itself (stored secretly in the spellbook, only available to authorized parties)</p>
                        <p><strong className="text-text">Public:</strong> The 1 ZEC amount (moved to the spellbook's public treasury address as proof of protection)</p>
                        <p className="italic text-xs mt-1">"We prove the guard is posted, but keep the guard's instructions secret."</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Option Selection */}
                <div className="mb-6 space-y-3">
                  {/* Published Proverbs Option */}
                  <button
                    onClick={() => setSelectedOption('proverbs')}
                    className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                      selectedOption === 'proverbs'
                        ? 'border-secondary bg-secondary/10'
                        : 'border-surface/50 bg-surface/30 hover:border-secondary/50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span>🧙‍♂️</span>
                        <h3 className="font-semibold text-text">Learning the Spell</h3>
                      </div>
                      {selectedOption === 'proverbs' && (
                        <span className="text-secondary text-lg">✓</span>
                      )}
                    </div>
                    <div className="text-2xl font-bold text-secondary mb-1">0</div>
                    <div className="text-sm text-text-muted mb-2">0.00 ZEC (0.01 ZEC each)</div>
                    <div className="text-xs text-text-muted mb-2">Publish to public address • Unlimited</div>
                    <div className="text-xs text-secondary/80 border-t border-secondary/20 pt-2 mt-2">
                      <strong>Public:</strong> Proverb commitment • <strong>Private:</strong> Fees in treasury
                    </div>
                  </button>

                  {/* Spellbook Supporters Option */}
                  <button
                    onClick={() => setSelectedOption('supporters')}
                    className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                      selectedOption === 'supporters'
                        ? 'border-primary bg-primary/10'
                        : 'border-surface/50 bg-surface/30 hover:border-primary/50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span>⚔️</span>
                        <h3 className="font-semibold text-text">Protecting the Spell</h3>
                      </div>
                      {selectedOption === 'supporters' && (
                        <span className="text-primary text-lg">✓</span>
                      )}
                    </div>
                    <div className="text-2xl font-bold text-primary mb-1">0 / 100</div>
                    <div className="text-sm text-text-muted mb-2">0.00 ZEC (1 ZEC each)</div>
                    <div className="text-xs text-text-muted mb-2">First 100 guardians per act • Proverb stored privately • Public stake proof</div>
                    <div className="text-xs text-primary/80 border-t border-primary/20 pt-2 mt-2">
                      <strong>Private:</strong> Proverb in spellbook • <strong>Public:</strong> 1 ZEC stake proof
                    </div>
                  </button>
                </div>

                {/* Step 1: Talk to Soulbae */}
                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-text mb-3 flex items-center gap-2">
                    <span className="text-lg">🧙‍♀️</span>
                    <span>Step 1: Derive Your Proverb</span>
                  </h3>
                  <button
                    onClick={handleTalkToSoulbae}
                    className="w-full btn-primary py-3 flex items-center justify-center gap-2"
                  >
                    <span>Talk to Soulbae</span>
                    <span className="text-sm">→</span>
                  </button>
                  <p className="text-xs text-text-muted mt-2">
                    You may derive your proverb from your own memory and context—Soulbae (the first mage) is an optional helper. Opens in new window.
                  </p>
                </div>

                {/* Step 2: Paste Proverb */}
                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-text mb-3 flex items-center gap-2">
                    <span className="text-lg">📝</span>
                    <span>Step 2: Paste Your Proverb</span>
                  </h3>
                  <textarea
                    value={userProverb}
                    onChange={(e) => setUserProverb(e.target.value)}
                    placeholder="Paste your proverbial wisdom here..."
                    rows={4}
                    className="w-full px-4 py-3 bg-background border border-surface/50 rounded-lg text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                  />
                  {validation && (
                    <div className={`mt-2 text-xs px-3 py-2 rounded ${
                      validation.valid
                        ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                        : 'bg-red-500/20 text-red-400 border border-red-500/30'
                    }`}>
                      {validation.valid ? (
                        <span>✓ {validation.length}/{validation.maxLength} bytes - Valid</span>
                      ) : (
                        <span>⚠ Proverb too long ({validation.length}/{validation.maxLength} bytes)</span>
                      )}
                    </div>
                  )}
                </div>

                {/* Step 3: Copy to Zashi */}
                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-text mb-3 flex items-center gap-2">
                    <span className="text-lg">💰</span>
                    <span>Step 3: Copy to Zashi</span>
                  </h3>
                  <button
                    onClick={handleCopyToZashi}
                    disabled={!userProverb.trim() || (validation !== null && !validation.valid)}
                    className="w-full btn-primary py-3 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {copied ? (
                      <>
                        <motion.span
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="text-lg"
                        >
                          ✓
                        </motion.span>
                        <span>Copied to Clipboard!</span>
                      </>
                    ) : (
                      <>
                        <span>📋</span>
                        <span>Copy to Zashi</span>
                      </>
                    )}
                  </button>
                  <p className="text-xs text-text-muted mt-2">
                    Paste the memo into your Zashi wallet, set your amount, and send.
                  </p>
                </div>

                {/* Instructions */}
                <div className="card bg-secondary/10 border-secondary/30">
                  <h4 className="text-sm font-semibold text-text mb-2">Next Steps:</h4>
                  <ol className="text-xs text-text-muted space-y-1 list-decimal list-inside">
                    <li>Open your Zashi wallet</li>
                    <li>Create a new z→z transaction</li>
                    <li>Paste the memo into the memo field</li>
                    <li>Set your protection amount</li>
                    <li>Send the transaction</li>
                  </ol>
                  <p className="text-xs text-text-muted mt-3 italic">
                    Your wallet is your Swordsman. You have final control. ⚔️
                  </p>
                </div>

                {/* Act/Spell Matching Info */}
                <div className="mt-6 pt-6 border-t border-surface/50 space-y-3">
                  {actName && (
                    <div>
                      <p className="text-xs text-text-muted mb-1">
                        <strong className="text-text">Act Name:</strong>
                      </p>
                      <p className="text-sm font-semibold text-text">{actName}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-xs text-text-muted mb-1">
                      <strong className="text-text">Act Number:</strong>
                    </p>
                    <p className="text-sm font-semibold text-text">Act {actNumber}</p>
                  </div>
                  {spellbook && (
                    <div>
                      <p className="text-xs text-text-muted mb-1">
                        <strong className="text-text">Spellbook:</strong>
                      </p>
                      <p className={`text-sm font-semibold ${
                        spellbook === 'story' ? 'text-primary' : 'text-accent'
                      }`}>
                        {spellbook === 'story' ? 'Story' : 'Zero'} Spellbook
                      </p>
                    </div>
                  )}
                  {spell && (
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-xs text-text-muted">
                          <strong className="text-text">Compression Spell:</strong>
                        </p>
                        <button
                          onClick={handleCopySpell}
                          className="text-xs text-primary hover:text-primary/80 transition-colors flex items-center gap-1"
                          title="Copy spell"
                        >
                          {spellCopied ? (
                            <>
                              <span className="text-lg">✓</span>
                              <span>Copied</span>
                            </>
                          ) : (
                            <>
                              <span>📋</span>
                              <span>Copy</span>
                            </>
                          )}
                        </button>
                      </div>
                      <div className="p-2 bg-primary/5 border border-primary/20 rounded text-xs font-mono text-text break-all cursor-pointer hover:bg-primary/10 transition-colors" onClick={handleCopySpell} title="Click to copy">
                        {spell}
                      </div>
                    </div>
                  )}
                  <div>
                    <p className="text-xs text-text-muted mb-1">
                      <strong className="text-text">Tale ID:</strong>
                    </p>
                    <p className="text-xs font-mono text-text-muted break-all">{taleId}</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

