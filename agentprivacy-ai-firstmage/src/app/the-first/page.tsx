'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';

export default function TheFirstPage() {
  // All stats set to 0 for coming soon
  const totalContributors = 0;
  const totalSpellsProtected = 0;
  const totalProverbsProduced = 0;
  const totalValue = 0;

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/5 to-background">
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
                  className="text-text hover:text-primary transition-colors font-medium"
                >
                  proverbs
                </Link>
                <Link
                  href="/the-first"
                  className="text-primary border-b-2 border-primary pb-1 font-medium"
                >
                  the first
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
            <h1 className="text-4xl md:text-5xl font-bold text-text mb-4">the first</h1>
            <p className="text-text-muted text-lg">
              Leaderboard of mages and swordsmen who have protected spells or produced proverbs
            </p>
          </motion.div>

          {/* Summary Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8"
          >
            <div className="card bg-primary/10 border-primary/30 p-4">
              <div className="text-text-muted text-sm mb-1">Total Contributors</div>
              <div className="text-3xl font-bold text-primary">{totalContributors}</div>
            </div>
            <div className="card bg-accent/10 border-accent/30 p-4">
              <div className="text-text-muted text-sm mb-1">Spells Protected</div>
              <div className="text-3xl font-bold text-accent">{totalSpellsProtected}</div>
            </div>
            <div className="card bg-secondary/10 border-secondary/30 p-4">
              <div className="text-text-muted text-sm mb-1">Proverbs Produced</div>
              <div className="text-3xl font-bold text-secondary">{totalProverbsProduced}</div>
            </div>
            <div className="card bg-surface border-surface/50 p-4">
              <div className="text-text-muted text-sm mb-1">Total Value</div>
              <div className="text-3xl font-bold text-text">{totalValue.toFixed(2)} ZEC</div>
            </div>
          </motion.div>

          {/* Coming Soon Message */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="card bg-surface border-surface/50 text-center py-12"
          >
            <h2 className="text-2xl md:text-3xl font-bold text-text mb-4">Coming Soon</h2>
            <p className="text-text-muted text-lg">
              The leaderboard will be available soon.
            </p>
          </motion.div>
        </div>
      </section>
    </div>
  );
}

