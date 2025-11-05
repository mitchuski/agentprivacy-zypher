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
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [githubLink, setGithubLink] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<{ type: 'success' | 'error' | null; message: string }>({ type: null, message: '' });

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus({ type: null, message: '' });

    // Use mailto: link which works immediately without any backend setup
    const introText = "im just another mage looking to share their spellbook";
    const fullMessage = `${introText} ${message}`;
    const subject = encodeURIComponent('Contribution from agentprivacy.ai');
    const body = encodeURIComponent(
      `${fullMessage}${githubLink ? `\n\nGitHub Link: ${githubLink}` : ''}`
    );
    const mailtoLink = `mailto:mage@agentprivacy.ai?subject=${subject}&body=${body}`;
    
    // Open mailto link
    window.location.href = mailtoLink;
    
    // Show success message
    setSubmitStatus({ type: 'success', message: 'Opening your email client...' });
    setMessage('');
    setGithubLink('');
    
    setTimeout(() => {
      setIsModalOpen(false);
      setSubmitStatus({ type: null, message: '' });
      setIsSubmitting(false);
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/5 to-background">
      {/* Navigation Header */}
      <nav className="sticky top-0 z-50 bg-background/80 backdrop-blur-sm border-b border-surface/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-8">
              <a href="/" className="text-xl font-bold text-text hover:text-primary transition-colors">
                agentprivacy
              </a>
              <div className="flex items-center gap-6">
                <a
                  href="/story"
                  className="text-text-muted hover:text-text transition-colors font-medium"
                >
                  Story
                </a>
              </div>
            </div>
          </div>
        </div>
      </nav>

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
              <motion.button
                onClick={() => setIsModalOpen(true)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="btn-primary px-8 py-4 text-lg"
              >
                Contribute
              </motion.button>
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
                and so are you. 🤝
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
            <h2 className="text-4xl font-bold text-text mb-4">features</h2>
            <p className="text-text-muted text-lg">
            cypherpunk systems, protocols, standards, apps and primitives for private sovereign AI agents.
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
                Privacy-preserving agent focused on slashing cookies, the autonomous negotiation of privacy terms, standards and protocols.
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
                Knowledge and information privacy agent for managing storage, identity, confidential compute, ZK credential composition.
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
                Cookie slashing and privacy negotiation. Maintain sovereignty over your data.
              </p>
            </motion.div>
          </div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="text-center mt-12"
          >
            <p className="text-lg text-text-muted max-w-3xl mx-auto text-center">
              ⚔️ Protecting privacy, collecting value, experience and knowledge along the way.
              <br />
              <br />
              🧙‍♂️ Share loot and knowledge in privacy pools with allies.
              <br />
              <br />
              🤝 Use the results to cast more powerful spells or buy more powerful gear.
            </p>
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
                    <p className="text-sm text-text-muted">Identity, Association Sets, Privacy Pools, Intel Pools, x402, EIP8004</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-4 bg-surface/50 rounded-lg border border-surface/50 hover:border-primary/30 transition-colors">
                  <div className="text-2xl">🖥️</div>
                  <div>
                    <p className="font-semibold text-text mb-1">Facilitator Server</p>
                    <p className="text-sm text-text-muted">Server User-Agents</p>
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

            {/* Privacy Pools Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="card bg-primary/10 border-primary/30 mt-8"
            >
              <div className="text-center mb-8">
                <div className="text-5xl mb-4">🕸️</div>
                <h2 className="text-3xl font-bold text-text mb-4">just another adventure</h2>
                <p className="text-lg text-text-muted max-w-3xl mx-auto">
                The blade slashes cookies. The swordsman keeps no trail. The mage builds a spellbook.
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
            join us?
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

      {/* Contribute Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            >
              {/* Modal */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                onClick={(e) => e.stopPropagation()}
                className="card bg-surface border-surface/50 max-w-lg w-full max-h-[90vh] overflow-y-auto"
              >
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-text">Share Your Spellbook</h2>
                  <button
                    onClick={() => setIsModalOpen(false)}
                    className="text-text-muted hover:text-text text-2xl leading-none"
                  >
                    ×
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-text-muted mb-2">
                      im just another mage looking to share their spellbook
                    </label>
                    <textarea
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="...finish your thought here"
                      required
                      rows={4}
                      className="w-full px-4 py-3 bg-background border border-surface/50 rounded-lg text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-text-muted mb-2">
                      GitHub Link (optional)
                    </label>
                    <input
                      type="url"
                      value={githubLink}
                      onChange={(e) => setGithubLink(e.target.value)}
                      placeholder="https://github.com/..."
                      className="w-full px-4 py-3 bg-background border border-surface/50 rounded-lg text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                  </div>

                  {submitStatus.type && (
                    <div
                      className={`p-3 rounded-lg ${
                        submitStatus.type === 'success'
                          ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                          : 'bg-red-500/20 text-red-400 border border-red-500/30'
                      }`}
                    >
                      {submitStatus.message}
                    </div>
                  )}

                  <div className="flex gap-4">
                    <button
                      type="button"
                      onClick={() => setIsModalOpen(false)}
                      className="flex-1 btn-secondary py-3"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting || !message.trim()}
                      className="flex-1 btn-primary py-3 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSubmitting ? 'Sending...' : 'Send'}
                    </button>
                  </div>
                </form>
              </motion.div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

