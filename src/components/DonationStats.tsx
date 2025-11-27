'use client';

import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';

interface ActStats {
  actNumber: number;
  actName: string;
  totalDonated: number; // in ZEC
  mageCount: number; // number of unique proverbs
  lastDonation?: string; // timestamp
}

// Mock data - in production, this would come from blockchain/VRC tracking
const mockStats: ActStats[] = [
  { actNumber: 1, actName: 'Act I: Venice', totalDonated: 0, mageCount: 0 },
  { actNumber: 2, actName: 'Act II: Dual Ceremony', totalDonated: 0, mageCount: 0 },
  { actNumber: 3, actName: 'Act III: Drake\'s Teaching', totalDonated: 0, mageCount: 0 },
  { actNumber: 4, actName: 'Act IV: Blade Alone', totalDonated: 0, mageCount: 0 },
  { actNumber: 5, actName: 'Act V: Light Armour', totalDonated: 0, mageCount: 0 },
  { actNumber: 6, actName: 'Act VI: Trust Graph Plane', totalDonated: 0, mageCount: 0 },
  { actNumber: 7, actName: 'Act VII: Mirror Enhanced', totalDonated: 0, mageCount: 0 },
  { actNumber: 8, actName: 'Act VIII: Ancient Rule', totalDonated: 0, mageCount: 0 },
  { actNumber: 9, actName: 'Act IX: Zcash Shield', totalDonated: 0, mageCount: 0 },
  { actNumber: 10, actName: 'Act X: Topology of Revelation', totalDonated: 0, mageCount: 0 },
  { actNumber: 11, actName: 'Act XI: Balanced Spiral', totalDonated: 0, mageCount: 0 },
];

interface DonationStatsProps {
  currentAct?: number;
}

export default function DonationStats({ currentAct }: DonationStatsProps) {
  const [stats, setStats] = useState<ActStats[]>(mockStats);
  const [totalDonated, setTotalDonated] = useState(0);
  const [totalMages, setTotalMages] = useState(0);

  useEffect(() => {
    // Calculate totals
    const total = stats.reduce((sum, act) => sum + act.totalDonated, 0);
    const mages = stats.reduce((sum, act) => sum + act.mageCount, 0);
    setTotalDonated(total);
    setTotalMages(mages);
  }, [stats]);

  const currentActStats = currentAct ? stats.find(s => s.actNumber === currentAct) : null;

  return (
    <div className="w-full max-w-4xl mx-auto mb-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card bg-surface border-surface/50 shadow-xl"
      >
        {/* Header */}
        <div className="mb-4 pb-4 border-b border-surface/50">
          <h3 className="text-lg font-bold text-text mb-2 flex items-center gap-2">
            <span>📊</span>
            <span>Spellbook Stats</span>
          </h3>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="bg-primary/10 border border-primary/30 rounded p-2">
              <div className="text-text-muted text-xs mb-1">Total Donated</div>
              <div className="text-primary font-semibold">{totalDonated.toFixed(2)} ZEC</div>
            </div>
            <div className="bg-secondary/10 border border-secondary/30 rounded p-2">
              <div className="text-text-muted text-xs mb-1">Mages Learned</div>
              <div className="text-secondary font-semibold">{totalMages} proverbs</div>
            </div>
          </div>
        </div>

        {/* Current Act Highlight - Only show if viewing a specific act */}
        {currentActStats && currentAct && (
          <div className="mb-4 p-3 bg-accent/10 border border-accent/30 rounded-lg">
            <div className="text-xs text-text-muted mb-1">Current Act</div>
            <div className="text-sm font-semibold text-text mb-2">{currentActStats.actName}</div>
            <div className="flex gap-3 text-xs">
              <div>
                <span className="text-text-muted">Donated: </span>
                <span className="text-accent font-semibold">{currentActStats.totalDonated.toFixed(2)} ZEC</span>
              </div>
              <div>
                <span className="text-text-muted">Mages: </span>
                <span className="text-accent font-semibold">{currentActStats.mageCount}</span>
              </div>
            </div>
          </div>
        )}

        {/* All Acts List */}
        <div className="max-h-[400px] overflow-y-auto">
          <div className="text-xs text-text-muted mb-2 font-semibold">By Act</div>
          <div className="space-y-2">
            {stats.map((act) => (
              <motion.div
                key={act.actNumber}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className={`p-2 rounded border ${
                  currentAct === act.actNumber
                    ? 'bg-accent/20 border-accent/50'
                    : 'bg-background/50 border-surface/50'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium text-text">
                    Act {act.actNumber}
                  </span>
                  <span className="text-xs text-text-muted">
                    {act.mageCount} {act.mageCount === 1 ? 'mage' : 'mages'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-text-muted">{act.actName.split(':')[1]?.trim() || act.actName}</span>
                  <span className="text-xs text-primary font-semibold">
                    {act.totalDonated.toFixed(2)} ZEC
                  </span>
                </div>
                {/* Progress bar */}
                <div className="mt-1 h-1 bg-background rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${(act.totalDonated / totalDonated) * 100}%` }}
                    className="h-full bg-primary"
                  />
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-4 pt-4 border-t border-surface/50 text-xs text-text-muted text-center">
          <p>Privacy-preserving stats</p>
          <p className="mt-1">Amounts hidden, proverbs verified</p>
        </div>
      </motion.div>
    </div>
  );
}

