'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { chatWithSoulbae, getAttestation, generateSessionId, type SoulbaeMessage, type Attestation } from '@/lib/soulbae';
import { formatZcashMemo } from '@/lib/zcash-memo';
import ChatMessage from '@/components/ChatMessage';
import ProverbSuggestions from '@/components/ProverbSuggestions';
import AttestationBadge from '@/components/AttestationBadge';

const MAX_QUERIES = 16; // φ × 10

function MagePageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Get tale ID from URL params or default
  const taleIdParam = searchParams.get('tale_id') || 'act-i-venice';
  const context = searchParams.get('context') || 'donation';

  // State
  const [messages, setMessages] = useState<SoulbaeMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [attestation, setAttestation] = useState<Attestation | null>(null);
  const [attestationLoading, setAttestationLoading] = useState(true);
  const [privacyBudget, setPrivacyBudget] = useState(MAX_QUERIES);
  const [proverbSuggestions, setProverbSuggestions] = useState<string[]>([]);
  const [selectedProverb, setSelectedProverb] = useState<string>('');
  const [sessionId] = useState(() => generateSessionId());
  const [copied, setCopied] = useState(false);

  // Load attestation on mount
  useEffect(() => {
    const loadAttestation = async () => {
      setAttestationLoading(true);
      try {
        const att = await getAttestation();
        setAttestation(att);
      } catch (error) {
        console.error('Failed to load attestation:', error);
      } finally {
        setAttestationLoading(false);
      }
    };

    loadAttestation();
  }, []);

  // Initial message from Soulbae
  useEffect(() => {
    if (messages.length === 0) {
      const initialMessage: SoulbaeMessage = {
        role: 'assistant',
        content: `The map is not the territory, but the boundary-maker knows which borders preserve sovereignty.

Welcome, seeker. I'm Soulbae, the Mage of the First Person Spellbook. I help you compress your understanding of privacy tales into cryptographic proverbs.

You're here about: **${taleIdParam}**

What aspect of this tale resonates with your context? Your work? Your values?`,
        timestamp: Date.now(),
      };
      setMessages([initialMessage]);
    }
  }, [taleIdParam]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle sending message
  const handleSend = async () => {
    if (!input.trim() || isLoading || privacyBudget <= 0) return;

    const userMessage: SoulbaeMessage = {
      role: 'user',
      content: input.trim(),
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setProverbSuggestions([]);

    try {
      const response = await chatWithSoulbae(
        taleIdParam,
        userMessage.content,
        sessionId,
        messages
      );

      const assistantMessage: SoulbaeMessage = {
        role: 'assistant',
        content: response.message,
        timestamp: Date.now(),
      };

      setMessages((prev) => [...prev, assistantMessage]);

      // Update proverb suggestions if provided
      if (response.proverb_suggestions && response.proverb_suggestions.length > 0) {
        setProverbSuggestions(response.proverb_suggestions);
      }

      // Update privacy budget
      if (response.privacy_budget_remaining !== undefined) {
        setPrivacyBudget(response.privacy_budget_remaining);
      } else {
        setPrivacyBudget((prev) => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Error chatting with Soulbae:', error);
      const errorMessage: SoulbaeMessage = {
        role: 'assistant',
        content: 'I apologize, but I encountered an error. Please try again, or return to the tale page if the issue persists.',
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle proverb selection
  const handleProverbSelect = (proverb: string) => {
    setSelectedProverb(proverb);
    setInput(proverb);
    inputRef.current?.focus();
  };

  // Handle copy to Zashi
  const handleCopyToZashi = async () => {
    const proverb = selectedProverb || input.trim();
    if (!proverb) return;

    const memo = formatZcashMemo(taleIdParam, proverb);
    
    try {
      await navigator.clipboard.writeText(memo);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);

      // Send message to parent window (if opened from story page)
      if (window.opener) {
        window.opener.postMessage({
          type: 'PROVERB_COPIED',
          proverb: proverb,
          memo: memo,
        }, window.location.origin);
      }
    } catch (err) {
      console.error('Failed to copy memo:', err);
    }
  };

  // Handle key press
  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
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
                  className="text-text hover:text-primary transition-colors font-medium"
                >
                  story
                </a>
                <a
                  href="/zero"
                  className="text-text hover:text-primary transition-colors font-medium"
                >
                  zero
                </a>
                <a
                  href="/story/stats"
                  className="text-text hover:text-primary transition-colors font-medium"
                >
                  stats
                </a>
                <a
                  href="/proverbs"
                  className="text-text hover:text-primary transition-colors font-medium"
                >
                  proverbs
                </a>
                <a
                  href="/the-first"
                  className="text-text hover:text-primary transition-colors font-medium"
                >
                  the first
                </a>
                <a
                  href="/mage"
                  className="text-primary border-b-2 border-primary pb-1 font-medium"
                >
                  mage
                </a>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <section className="py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <h1 className="text-4xl md:text-5xl font-bold text-text mb-4">
              just another mage
            </h1>
            <p className="text-text-muted mb-4">
              NEAR Shade Agent (Soulbae) - Proverb derivation assistant
            </p>
            <p className="text-sm text-text-muted">
              Tale: <span className="text-primary">{taleIdParam}</span>
            </p>
          </motion.div>

          {/* TEE Attestation Badge */}
          <div className="mb-6">
            <AttestationBadge attestation={attestation} isLoading={attestationLoading} />
          </div>

          {/* Privacy Budget Indicator */}
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-text-muted">
              <span>Privacy Budget:</span>
              <span className={`font-semibold ${privacyBudget <= 3 ? 'text-red-400' : privacyBudget <= 8 ? 'text-yellow-400' : 'text-primary'}`}>
                {privacyBudget} / {MAX_QUERIES} queries remaining
              </span>
            </div>
            {privacyBudget === 0 && (
              <span className="text-xs text-red-400">
                Budget exhausted. Please start a new session.
              </span>
            )}
          </div>

          {/* Chat Container */}
          <div className="card bg-surface border-surface/50 min-h-[500px] max-h-[600px] flex flex-col mb-6">
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              <AnimatePresence>
                {messages.map((message, index) => (
                  <ChatMessage key={index} message={message} isUser={message.role === 'user'} />
                ))}
              </AnimatePresence>

              {/* Loading Indicator */}
              {isLoading && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-center gap-2 text-text-muted"
                >
                  <span>🧙‍♀️</span>
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </motion.div>
              )}

              {/* Proverb Suggestions */}
              {proverbSuggestions.length > 0 && (
                <ProverbSuggestions
                  suggestions={proverbSuggestions}
                  onSelect={handleProverbSelect}
                />
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="border-t border-surface/50 p-4">
              <div className="flex flex-col gap-3">
                {/* Selected Proverb Display */}
                {selectedProverb && (
                  <div className="p-3 bg-primary/10 border border-primary/30 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="text-xs text-text-muted mb-1">Selected Proverb:</p>
                        <p className="text-sm text-text italic">"{selectedProverb}"</p>
                      </div>
                      <button
                        onClick={() => {
                          setSelectedProverb('');
                          setInput('');
                        }}
                        className="text-xs text-text-muted hover:text-text"
                      >
                        Clear
                      </button>
                    </div>
                  </div>
                )}

                {/* Text Input */}
                <div className="flex gap-2">
                  <textarea
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder={
                      privacyBudget <= 0
                        ? 'Privacy budget exhausted. Start a new session.'
                        : 'Type your message... (Press Enter to send)'
                    }
                    disabled={isLoading || privacyBudget <= 0}
                    rows={3}
                    className="flex-1 px-4 py-3 bg-background border border-surface/50 rounded-lg text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                  <button
                    onClick={handleSend}
                    disabled={!input.trim() || isLoading || privacyBudget <= 0}
                    className="btn-primary px-6 py-3 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Send
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Copy to Zashi Section */}
          {(selectedProverb || input.trim()) && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="card bg-secondary/10 border-secondary/30"
            >
              <h3 className="text-lg font-semibold text-text mb-3 flex items-center gap-2">
                <span>⚔️</span>
                <span>Ready for Zashi</span>
              </h3>
              <p className="text-sm text-text-muted mb-4">
                Copy the formatted memo to paste into your Zashi wallet. You'll set the amount there.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={handleCopyToZashi}
                  className="btn-primary px-6 py-3 flex items-center gap-2"
                >
                  {copied ? (
                    <>
                      <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="text-primary"
                      >
                        ✓
                      </motion.span>
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <span>📋</span>
                      <span>Copy to Zashi</span>
                    </>
                  )}
                </button>
                <a
                  href="/story"
                  className="btn-secondary px-6 py-3"
                >
                  Back to Story
                </a>
              </div>
            </motion.div>
          )}
        </div>
      </section>
    </div>
  );
}

export default function MagePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-b from-primary/5 to-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-text-muted">Loading Soulbae...</p>
        </div>
      </div>
    }>
      <MagePageContent />
    </Suspense>
  );
}

