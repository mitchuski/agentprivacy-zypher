'use client';

import { motion } from 'framer-motion';
import { Attestation } from '@/lib/soulbae';

interface AttestationBadgeProps {
  attestation: Attestation | null;
  isLoading?: boolean;
}

export default function AttestationBadge({ attestation, isLoading }: AttestationBadgeProps) {
  if (isLoading) {
    return (
      <div className="flex items-center gap-2 px-4 py-2 bg-surface/50 border border-surface/50 rounded-lg">
        <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        <span className="text-sm text-text-muted">Verifying TEE attestation...</span>
      </div>
    );
  }

  if (!attestation) {
    return (
      <div className="flex items-center gap-2 px-4 py-2 bg-red-500/10 border border-red-500/30 rounded-lg">
        <span className="text-red-400">⚠️</span>
        <span className="text-sm text-red-400">TEE attestation unavailable</span>
      </div>
    );
  }

  const shortAttestation = attestation.attestation.substring(0, 16) + '...';

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/30 rounded-lg"
    >
      <span className="text-primary">🛡️</span>
      <div className="flex flex-col">
        <span className="text-xs text-text-muted">TEE Attested</span>
        <span className="text-sm font-mono text-primary">{shortAttestation}</span>
      </div>
      {attestation.verification_url && (
        <a
          href={attestation.verification_url}
          target="_blank"
          rel="noopener noreferrer"
          className="ml-auto text-xs text-primary hover:text-primary/80 underline"
        >
          Verify
        </a>
      )}
    </motion.div>
  );
}

