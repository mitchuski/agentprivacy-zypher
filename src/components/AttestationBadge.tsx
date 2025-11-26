'use client';

import { motion } from 'framer-motion';
import { Attestation } from '@/lib/soulbae';

interface AttestationBadgeProps {
  attestation: Attestation | null;
}

export default function AttestationBadge({ attestation }: AttestationBadgeProps) {
  if (!attestation || !attestation.signing_address) {
    return null;
  }

  // Use signing_address (NEAR Cloud AI format) or fallback to legacy attestation field
  const signingAddress = attestation.signing_address || attestation.attestation || '';
  
  // If no signing address, show as unavailable
  if (!signingAddress) {
    return (
      <div className="flex flex-col gap-2 px-4 py-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
        <div className="flex items-center gap-2">
          <span className="text-yellow-400">⚠️</span>
          <span className="text-sm text-yellow-400 font-medium">TEE attestation incomplete</span>
        </div>
        <p className="text-xs text-yellow-400/80 ml-6">
          Attestation received but missing signing address. Check console for details.
        </p>
      </div>
    );
  }
  
  const shortAddress = signingAddress.length > 16 
    ? `${signingAddress.substring(0, 10)}...${signingAddress.substring(signingAddress.length - 6)}`
    : signingAddress;
  const nodeCount = attestation.all_attestations?.length || 0;
  const hasNvidia = !!attestation.nvidia_payload;
  const hasIntel = !!attestation.intel_quote;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col gap-2 px-4 py-3 bg-primary/10 border border-primary/30 rounded-lg"
    >
      <div className="flex items-center gap-2">
        <span className="text-primary">🛡️</span>
        <div className="flex flex-col flex-1">
          <span className="text-xs text-text-muted">NEAR Cloud AI TEE Attested</span>
          <span className="text-sm font-mono text-primary">{shortAddress}</span>
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
      </div>
      
      {/* Attestation Details */}
      <div className="flex items-center gap-4 text-xs text-text-muted pt-1 border-t border-primary/20">
        {nodeCount > 0 && (
          <span className="flex items-center gap-1">
            <span>🌐</span>
            <span>{nodeCount} node{nodeCount !== 1 ? 's' : ''}</span>
          </span>
        )}
        {hasNvidia && (
          <span className="flex items-center gap-1">
            <span>🎮</span>
            <span>NVIDIA TEE</span>
          </span>
        )}
        {hasIntel && (
          <span className="flex items-center gap-1">
            <span>🔒</span>
            <span>Intel SGX</span>
          </span>
        )}
        {!hasNvidia && !hasIntel && (
          <span className="text-text-muted/70">TEE verification active</span>
        )}
      </div>
    </motion.div>
  );
}

