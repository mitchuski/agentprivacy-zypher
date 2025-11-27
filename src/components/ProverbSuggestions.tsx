'use client';

import { motion } from 'framer-motion';
import { useState } from 'react';
import { validateProverb } from '@/lib/zcash-memo';

interface ProverbSuggestionsProps {
  suggestions: string[];
  onSelect: (proverb: string) => void;
  onCopy?: (proverb: string) => void;
}

export default function ProverbSuggestions({
  suggestions,
  onSelect,
  onCopy,
}: ProverbSuggestionsProps) {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const handleCopy = async (proverb: string, index: number) => {
    try {
      await navigator.clipboard.writeText(proverb);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
      onCopy?.(proverb);
    } catch (err) {
      console.error('Failed to copy proverb:', err);
    }
  };

  if (suggestions.length === 0) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-4 p-4 bg-secondary/10 border border-secondary/30 rounded-lg"
    >
      <h3 className="text-sm font-semibold text-text mb-3 flex items-center gap-2">
        <span>✨</span>
        <span>Proverb Suggestions</span>
      </h3>
      <div className="space-y-3">
        {suggestions.map((proverb, index) => {
          const validation = validateProverb(proverb);
          return (
            <div
              key={index}
              className="p-3 bg-background/50 border border-surface/50 rounded-lg"
            >
              <p className="text-text-muted mb-2 italic">"{proverb}"</p>
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-xs">
                  <span
                    className={`px-2 py-1 rounded ${
                      validation.valid
                        ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                        : 'bg-red-500/20 text-red-400 border border-red-500/30'
                    }`}
                  >
                    {validation.length}/{validation.maxLength} bytes
                  </span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => onSelect(proverb)}
                    className="px-3 py-1 text-xs bg-primary/10 hover:bg-primary/20 border border-primary/30 rounded text-primary transition-colors"
                  >
                    Use This
                  </button>
                  <button
                    onClick={() => handleCopy(proverb, index)}
                    className="px-3 py-1 text-xs bg-surface hover:bg-surface/80 border border-surface/50 rounded text-text-muted transition-colors"
                  >
                    {copiedIndex === index ? (
                      <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="text-primary"
                      >
                        Copied!
                      </motion.span>
                    ) : (
                      'Copy'
                    )}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}

