'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';

export default function LandingPage() {
  const carouselItems = [
    { text: 'swordsman ⚔️ privacy is my blade.', emoji: '⚔️' },
    { text: 'mage 🧙‍♂️ knowledge is my spellbook.', emoji: '🧙‍♂️' },
    { text: 'agent 🤖 expanding our universe.', emoji: '🤖' },
    { text: 'person 😊 looking for shared meaning', emoji: '😊' },
  ];

  const ctaCarouselItems = [
    { text: 'swordsman ⚔️', emoji: '⚔️' },
    { text: 'mage 🧙‍♂️', emoji: '🧙‍♂️' },
    { text: 'agent 🤖', emoji: '🤖' },
    { text: 'person 😊', emoji: '😊' },
  ];

  const [currentIndex, setCurrentIndex] = useState(0);
  const [ctaCurrentIndex, setCtaCurrentIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % carouselItems.length);
    }, 3000); // Change every 3 seconds

    return () => clearInterval(interval);
  }, [carouselItems.length]);

  useEffect(() => {
    const interval = setInterval(() => {
      setCtaCurrentIndex((prevIndex) => (prevIndex + 1) % ctaCarouselItems.length);
    }, 3000); // Change every 3 seconds

    return () => clearInterval(interval);
  }, [ctaCarouselItems.length]);
  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/5 to-background">
      {/* Hero Section */}
      <section className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <h1 className="text-5xl md:text-6xl font-bold text-text mb-6">
              agentprivacy
            </h1>
            <p className="text-xl md:text-2xl text-text-muted mb-8">
              privacy-first personal payment and knowledge for AI agents
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
              {/* Hide Get Started for now */}
              <motion.a
                href="https://sync.soulbis.com/s/privacy-is-value"
                target="_blank"
                rel="noopener noreferrer"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="btn-secondary px-8 py-4 text-lg"
              >
                Learn More
              </motion.a>
            </div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="max-w-3xl mx-auto"
            >
              <p className="text-2xl md:text-3xl font-medium text-text mb-6">
                i'm just another
              </p>
              <div className="relative h-12 md:h-16 flex items-center justify-center">
                <AnimatePresence mode="wait">
                  <motion.p
                    key={currentIndex}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.5 }}
                    className="text-2xl md:text-3xl text-text-muted absolute"
                  >
                    {carouselItems[currentIndex].text}
                  </motion.p>
                </AnimatePresence>
              </div>
              <p className="text-primary font-medium pt-4 text-xl md:text-2xl">
                And so are you. 🤝
              </p>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-text mb-4">Features</h2>
            <p className="text-text-muted text-lg">
              Building the Infrastructure for Private, Sovereign AI Agents
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="card bg-primary/10 border-primary/30"
            >
              <div className="text-4xl mb-4">⚔️</div>
              <h3 className="text-xl font-semibold text-text mb-3">Swordsman Agent</h3>
              <p className="text-text-muted">
                Financial privacy agent specialized in payment processing, privacy pool management, 
                and autonomous negotiation. Handles x402 protocol integration and private transactions.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="card bg-secondary/10 border-secondary/30"
            >
              <div className="text-4xl mb-4">🧙‍♂️</div>
              <h3 className="text-xl font-semibold text-text mb-3">Mage Agent</h3>
              <p className="text-text-muted">
                Knowledge and data privacy agent for managing decentralized storage, 
                confidential compute, and ZK credential composition.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="card bg-accent/10 border-accent/30"
            >
              <div className="text-4xl mb-4">🤝</div>
              <h3 className="text-xl font-semibold text-text mb-3">MyTerms</h3>
              <p className="text-text-muted">
                Cookie slashing and privacy negotiation with earnings routed to privacy pools. 
                Maintain sovereignty over your data.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Privacy Pools Section */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-surface/20">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="card bg-primary/10 border-primary/30"
          >
            <div className="text-center mb-8">
              <div className="text-5xl mb-4">🕸️</div>
              <h2 className="text-3xl font-bold text-text mb-4">Privacy Pools</h2>
              <p className="text-lg text-text-muted max-w-3xl mx-auto">
                Privacy pools powered by ERC-8004, x402 protocol, and verifiable relationship credentials (VRCs). 
                The blade slashes cookies. The agent keeps no trail.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
              <div className="card bg-surface/50">
                <div className="text-2xl mb-2">💰</div>
                <h4 className="font-semibold text-text mb-2">Privacy Pools</h4>
                <p className="text-sm text-text-muted">
                  Private transactions with zero-knowledge proofs
                </p>
              </div>
              <div className="card bg-surface/50">
                <div className="text-2xl mb-2">🧠</div>
                <h4 className="font-semibold text-text mb-2">Intel Pools</h4>
                <p className="text-sm text-text-muted">
                  Knowledge sharing with privacy guarantees
                </p>
              </div>
              <div className="card bg-surface/50">
                <div className="text-2xl mb-2">📊</div>
                <h4 className="font-semibold text-text mb-2">Data Pools</h4>
                <p className="text-sm text-text-muted">
                  Decentralized data storage and access
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-text mb-4">0xagentprivacy</h2>
            <p className="text-text-muted text-lg max-w-4xl mx-auto">
              A unified infrastructure for privacy-preserving agent payments and information sharing combining smart contracts, facilitator servers, agent SDKs, zero-knowledge circuits, and MyTerms integration.
            </p>
          </motion.div>

          <div className="space-y-8">
            {/* Components Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="card bg-gradient-to-br from-primary/10 via-secondary/5 to-accent/10 border-primary/30"
            >
              <h3 className="text-xl font-semibold text-text mb-6">Components:</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-start gap-3 p-4 bg-surface/50 rounded-lg border border-surface/50 hover:border-primary/30 transition-colors">
                  <div className="text-2xl">📜</div>
                  <div>
                    <p className="font-semibold text-text mb-1">Smart Contracts</p>
                    <p className="text-sm text-text-muted">Identity, Association Sets, Privacy Pools, Intel Pools</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-4 bg-surface/50 rounded-lg border border-surface/50 hover:border-primary/30 transition-colors">
                  <div className="text-2xl">🖥️</div>
                  <div>
                    <p className="font-semibold text-text mb-1">Facilitator Server</p>
                    <p className="text-sm text-text-muted">x402 payment facilitator</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-4 bg-surface/50 rounded-lg border border-surface/50 hover:border-primary/30 transition-colors">
                  <div className="text-2xl">🛠️</div>
                  <div>
                    <p className="font-semibold text-text mb-1">Agent SDK</p>
                    <p className="text-sm text-text-muted">TypeScript integration & data sharing</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-4 bg-surface/50 rounded-lg border border-surface/50 hover:border-primary/30 transition-colors">
                  <div className="text-2xl">🔐</div>
                  <div>
                    <p className="font-semibold text-text mb-1">ZK Circuits</p>
                    <p className="text-sm text-text-muted">Private withdrawals & data sharing</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-4 bg-surface/50 rounded-lg border border-surface/50 hover:border-primary/30 transition-colors">
                  <div className="text-2xl">🤝</div>
                  <div>
                    <p className="font-semibold text-text mb-1">MyTerms Integration</p>
                    <p className="text-sm text-text-muted">Cookie slashing & Intel pool agreements</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-4 bg-surface/50 rounded-lg border border-surface/50 hover:border-primary/30 transition-colors">
                  <div className="text-2xl">⚔️</div>
                  <div>
                    <p className="font-semibold text-text mb-1">Duel Agent System</p>
                    <p className="text-sm text-text-muted">Swordsman & Mage</p>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Enables Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="card bg-gradient-to-br from-accent/10 via-primary/5 to-secondary/10 border-accent/30"
            >
              <h3 className="text-xl font-semibold text-text mb-6">Enables:</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-start gap-3 p-4 bg-surface/50 rounded-lg border border-surface/50 hover:border-accent/30 transition-colors">
                  <div className="text-2xl">🤖</div>
                  <div>
                    <p className="font-semibold text-text mb-1">Agents negotiating privacy terms autonomously</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-4 bg-surface/50 rounded-lg border border-surface/50 hover:border-accent/30 transition-colors">
                  <div className="text-2xl">💰</div>
                  <div>
                    <p className="font-semibold text-text mb-1">Private onchain payments for agents</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-4 bg-surface/50 rounded-lg border border-surface/50 hover:border-accent/30 transition-colors">
                  <div className="text-2xl">💎</div>
                  <div>
                    <p className="font-semibold text-text mb-1">Earning from consensual data sharing</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-4 bg-surface/50 rounded-lg border border-surface/50 hover:border-accent/30 transition-colors">
                  <div className="text-2xl">🧠</div>
                  <div>
                    <p className="font-semibold text-text mb-1">Knowledge sharing and AI community participation</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-4 bg-surface/50 rounded-lg border border-surface/50 hover:border-accent/30 transition-colors">
                  <div className="text-2xl">🔒</div>
                  <div>
                    <p className="font-semibold text-text mb-1">Financial privacy without surveillance</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-4 bg-surface/50 rounded-lg border border-surface/50 hover:border-accent/30 transition-colors">
                  <div className="text-2xl">✅</div>
                  <div>
                    <p className="font-semibold text-text mb-1">Compliance through association sets</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="card bg-gradient-to-r from-primary/20 to-secondary/20 border-primary/30 text-center"
          >
            <h2 className="text-3xl font-bold text-text mb-4">
              Ready to Get Started?
            </h2>
            <div className="mb-8">
              <p className="text-text-muted mb-4 text-lg">
                Create your:
              </p>
              <div className="relative h-12 md:h-16 flex items-center justify-center">
                <AnimatePresence mode="wait">
                  <motion.p
                    key={ctaCurrentIndex}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.5 }}
                    className="text-2xl md:text-3xl text-text absolute"
                  >
                    {ctaCarouselItems[ctaCurrentIndex].text}
                  </motion.p>
                </AnimatePresence>
              </div>
            </div>
            <div className="flex justify-center">
              <motion.a
                href="https://sync.soulbis.com/s/privacy-is-value"
                target="_blank"
                rel="noopener noreferrer"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="btn-secondary px-8 py-4 text-lg"
              >
                Learn More
              </motion.a>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}

