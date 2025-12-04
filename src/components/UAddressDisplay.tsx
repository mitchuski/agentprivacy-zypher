'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';

interface UAddressDisplayProps {
  /** Optional custom label - defaults to "Oracle Address" */
  label?: string;
  /** Visual variant for different contexts */
  variant?: 'compact' | 'full' | 'inline' | 'proverb-button' | 'small-button';
  /** Show description text */
  showDescription?: boolean;
  /** Custom class for container */
  className?: string;
}

// Treasury UA (Account 0) - where proverbs are sent
const ORACLE_ADDRESS = process.env.NEXT_PUBLIC_SPELLBOOK_ADDRESS ||
  'u1jjrsaxyradv3dq03fa4wvk2husu2643v9m6rpnm8x7wmq0zdzv57ca0t5862yq9z7zx4h4d4r42rf85cup3xft6knntz5zglxkqxy8ekr0m2mx4s7cjsg5djq6dzlx9u7l8wlk85ha5t97nh9x3xm27qctlwvcezfeg0a96xnngu4u6fx05css4fzfv50vq0u3zy5vnfswvj5yzx0um';

export default function UAddressDisplay({
  label = 'Oracle Address',
  variant = 'full',
  showDescription = true,
  className = ''
}: UAddressDisplayProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(ORACLE_ADDRESS);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch (err) {
      console.error('Failed to copy address:', err);
    }
  };

  // Truncate address for display
  const truncatedAddress = `${ORACLE_ADDRESS.slice(0, 12)}...${ORACLE_ADDRESS.slice(-8)}`;

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
              cast
            </motion.span>
          ) : (
            <span className="group-hover:text-primary/80 transition-colors flex items-center gap-2">
              <span>🔮</span>
              <span>spellbook address</span>
            </span>
          )}
        </div>
        <div className="text-text-muted text-sm font-mono break-all">
          {truncatedAddress}
        </div>
      </button>
    );
  }

  if (variant === 'inline') {
    return (
      <span
        onClick={handleCopy}
        className={`inline-flex items-center gap-1 cursor-pointer group ${className}`}
        title={`Click to copy: ${ORACLE_ADDRESS}`}
      >
        <code className="text-xs font-mono text-secondary bg-secondary/10 px-1.5 py-0.5 rounded group-hover:bg-secondary/20 transition-colors">
          {truncatedAddress}
        </code>
        {copied ? (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="text-secondary text-xs"
          >
            copied!
          </motion.span>
        ) : (
          <span className="text-text-muted text-xs opacity-0 group-hover:opacity-100 transition-opacity">
            copy
          </span>
        )}
      </span>
    );
  }

  if (variant === 'small-button') {
    return (
      <button
        onClick={handleCopy}
        className={`w-full px-3 py-2 bg-primary/5 hover:bg-primary/10 border border-primary/20 rounded-lg text-left group ${className}`}
        title={`Click to copy: ${ORACLE_ADDRESS}`}
      >
        <div className="text-primary font-semibold text-xs mb-1">
          {copied ? (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="text-primary"
            >
              cast
            </motion.span>
          ) : (
            <span className="group-hover:text-primary/80 transition-colors flex items-center gap-1.5">
              <span>🔮</span>
              <span>{label || 'zec'}</span>
            </span>
          )}
        </div>
        <div className="text-text-muted text-xs font-mono leading-tight">
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
                  +
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
          {ORACLE_ADDRESS}
        </div>
      </div>
    );
  }

  // Full variant (default)
  return (
    <div className={`bg-secondary/10 border border-secondary/30 rounded-lg p-4 ${className}`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-lg">zec</span>
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
                +
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
        {ORACLE_ADDRESS}
      </div>

      {showDescription && (
        <p className="text-xs text-text-muted mt-2">
          Send your shielded proverb transaction (0.01 ZEC) to this Unified Address.
          Use a z-to-z transaction in Zashi or any Zcash wallet.
        </p>
      )}
    </div>
  );
}

// Export the address constant for use elsewhere
export { ORACLE_ADDRESS };
