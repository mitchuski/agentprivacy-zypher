'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';

interface TAddressDisplayProps {
  /** Optional custom label */
  label?: string;
  /** Visual variant */
  variant?: 'compact' | 'full' | 'proverb-button';
  /** Custom class for container */
  className?: string;
}

// Treasury t1 address that receives inscription outputs
const INSCRIPTION_T_ADDRESS = process.env.NEXT_PUBLIC_INSCRIPTION_T_ADDRESS ||
  't1aMR9MKx3xLso9c4Uq4MYX3cRvnDTp42av';

export default function TAddressDisplay({
  label = 'Inscription Address',
  variant = 'proverb-button',
  className = ''
}: TAddressDisplayProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(INSCRIPTION_T_ADDRESS);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch (err) {
      console.error('Failed to copy address:', err);
    }
  };

  // Truncate address for display
  const truncatedAddress = `${INSCRIPTION_T_ADDRESS.slice(0, 12)}...${INSCRIPTION_T_ADDRESS.slice(-8)}`;

  if (variant === 'proverb-button') {
    return (
      <button
        onClick={handleCopy}
        className={`w-full px-4 py-3 bg-primary/5 hover:bg-primary/10 border border-primary/20 rounded-lg transition-all duration-200 text-left group ${className}`}
        title="Click to copy full address"
      >
        <div className="text-primary font-semibold text-xs mb-2">
          {copied ? (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="text-primary"
            >
              copied
            </motion.span>
          ) : (
            <span className="group-hover:text-primary/80 transition-colors">
              {label}
            </span>
          )}
        </div>
        <div className="text-text-muted text-sm font-mono break-all">
          {truncatedAddress}
        </div>
      </button>
    );
  }

  if (variant === 'compact') {
    return (
      <div className={`${className}`}>
        <div className="flex items-center justify-between mb-1">
          <p className="text-xs text-text-muted">
            <strong className="text-text">{label}:</strong>
          </p>
          <button
            onClick={handleCopy}
            className="text-xs text-secondary hover:text-secondary/80 transition-colors flex items-center gap-1"
            title="Copy address"
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
                <span>Copied</span>
              </>
            ) : (
              <>
                <span>copy</span>
              </>
            )}
          </button>
        </div>
        <div
          onClick={handleCopy}
          className="p-2 bg-secondary/5 border border-secondary/20 rounded text-xs font-mono text-text break-all cursor-pointer hover:bg-secondary/10 transition-colors"
          title="Click to copy"
        >
          {INSCRIPTION_T_ADDRESS}
        </div>
      </div>
    );
  }

  // Full variant (default)
  return (
    <div className={`bg-secondary/10 border border-secondary/30 rounded-lg p-4 ${className}`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <h4 className="font-semibold text-text text-sm">{label}</h4>
        </div>
        <button
          onClick={handleCopy}
          className="text-xs text-secondary hover:text-secondary/80 transition-colors flex items-center gap-1 px-2 py-1 rounded hover:bg-secondary/10"
          title="Copy address"
        >
          {copied ? (
            <>
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
              >
                ✓
              </motion.span>
              <span>Copied!</span>
            </>
          ) : (
            <>
              <span>Copy</span>
            </>
          )}
        </button>
      </div>

      <div
        onClick={handleCopy}
        className="p-3 bg-background/50 border border-secondary/20 rounded text-xs font-mono text-text-muted break-all cursor-pointer hover:bg-background/70 hover:border-secondary/40 transition-all"
        title="Click to copy full address"
      >
        {INSCRIPTION_T_ADDRESS}
      </div>
    </div>
  );
}

// Export the address constant for use elsewhere
export { INSCRIPTION_T_ADDRESS };

