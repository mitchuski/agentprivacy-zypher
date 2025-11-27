'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { checkStatus, type SubmissionStatus as Status } from '@/lib/oracle-api';

interface SubmissionStatusProps {
  trackingCode: string;
  onStatusUpdate?: (status: Status) => void;
}

export default function SubmissionStatus({ trackingCode, onStatusUpdate }: SubmissionStatusProps) {
  const [status, setStatus] = useState<Status | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!trackingCode) return;

    const fetchStatus = async () => {
      try {
        setLoading(true);
        const result = await checkStatus(trackingCode);
        setStatus(result);
        if (onStatusUpdate) {
          onStatusUpdate(result);
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchStatus();

    // Poll for updates if status is pending
    if (status?.status === 'pending' || !status) {
      const interval = setInterval(fetchStatus, 5000); // Poll every 5 seconds
      return () => clearInterval(interval);
    }
  }, [trackingCode, status?.status, onStatusUpdate]);

  if (!trackingCode) return null;

  if (loading && !status) {
    return (
      <div className="p-4 bg-surface/50 border border-surface/50 rounded-lg">
        <div className="flex items-center gap-2 text-text-muted">
          <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <span className="text-sm">Checking status...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-500/20 border border-red-500/30 rounded-lg text-red-400 text-sm">
        Error: {error}
      </div>
    );
  }

  if (!status) return null;

  const statusConfig = {
    pending: {
      label: 'Pending',
      color: 'text-yellow-400',
      bg: 'bg-yellow-500/20',
      border: 'border-yellow-500/30',
      icon: '⏳',
    },
    verified: {
      label: 'Verified',
      color: 'text-blue-400',
      bg: 'bg-blue-500/20',
      border: 'border-blue-500/30',
      icon: '✓',
    },
    inscribed: {
      label: 'Inscribed',
      color: 'text-green-400',
      bg: 'bg-green-500/20',
      border: 'border-green-500/30',
      icon: '✓✓',
    },
    rejected: {
      label: 'Rejected',
      color: 'text-red-400',
      bg: 'bg-red-500/20',
      border: 'border-red-500/30',
      icon: '✗',
    },
    failed: {
      label: 'Failed',
      color: 'text-red-400',
      bg: 'bg-red-500/20',
      border: 'border-red-500/30',
      icon: '⚠',
    },
  };

  const config = statusConfig[status.status] || statusConfig.pending;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`p-4 ${config.bg} border ${config.border} rounded-lg`}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-lg">{config.icon}</span>
          <span className={`font-semibold ${config.color}`}>
            {config.label}
          </span>
        </div>
        {status.status === 'pending' && (
          <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        )}
      </div>

      {status.quality_score !== null && status.quality_score !== undefined && (
        <div className="mb-2">
          <div className="flex items-center justify-between text-sm mb-1">
            <span className="text-text-muted">Quality Score:</span>
            <span className="font-semibold text-text">
              {(status.quality_score * 100).toFixed(1)}%
            </span>
          </div>
          <div className="w-full bg-background/50 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all ${
                status.quality_score >= 0.7
                  ? 'bg-green-500'
                  : status.quality_score >= 0.5
                  ? 'bg-yellow-500'
                  : 'bg-red-500'
              }`}
              style={{ width: `${status.quality_score * 100}%` }}
            />
          </div>
        </div>
      )}

      {status.matched_act && (
        <div className="mb-2 text-sm">
          <span className="text-text-muted">Matched Act: </span>
          <span className="font-semibold text-text">{status.matched_act}</span>
        </div>
      )}

      {status.reasoning && (
        <div className="mb-2 text-xs text-text-muted italic">
          {status.reasoning}
        </div>
      )}

      {status.txid && (
        <div className="mt-3 pt-3 border-t border-surface/30">
          <div className="text-xs text-text-muted mb-1">Transaction ID:</div>
          <div className="text-xs font-mono text-text break-all">{status.txid}</div>
        </div>
      )}

      {status.created_at && (
        <div className="mt-2 text-xs text-text-muted">
          Submitted: {new Date(status.created_at).toLocaleString()}
        </div>
      )}
    </motion.div>
  );
}

