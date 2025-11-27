/**
 * Oracle Swordsman API Client
 * Connects frontend to Oracle backend for submission tracking
 */

const ORACLE_API_URL = process.env.NEXT_PUBLIC_ORACLE_API_URL || 'http://localhost:3001';

export interface SubmissionStatus {
  status: 'pending' | 'verified' | 'inscribed' | 'rejected' | 'failed';
  tracking_code: string;
  quality_score?: number | null;
  matched_act?: string | null;
  reasoning?: string | null;
  txid?: string;
  created_at?: string;
  verified_at?: string | null;
}

export interface SubmissionResponse {
  success: boolean;
  payment_address: string;
  amount: number;
  memo: string;
  tracking_code: string;
  tale_id: string;
  instructions?: {
    step1: string;
    step2: string;
    step3: string;
    step4: string;
    step5: string;
  };
}

/**
 * Submit proverb for processing
 */
export async function submitProverb(
  proverb: string,
  taleId: string,
  trackingCode?: string
): Promise<SubmissionResponse> {
  try {
    const response = await fetch(`${ORACLE_API_URL}/api/submit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        proverb,
        taleId,
        trackingCode,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    return await response.json();
  } catch (error: any) {
    console.error('Error submitting proverb:', error);
    throw error;
  }
}

/**
 * Check submission status
 */
export async function checkStatus(trackingCode: string): Promise<SubmissionStatus> {
  try {
    const response = await fetch(`${ORACLE_API_URL}/api/status/${trackingCode}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        return {
          status: 'pending',
          tracking_code: trackingCode,
        };
      }
      throw new Error(`HTTP ${response.status}`);
    }

    return await response.json();
  } catch (error: any) {
    console.error('Error checking status:', error);
    // Return pending status on error
    return {
      status: 'pending',
      tracking_code: trackingCode,
    };
  }
}

/**
 * Get statistics
 */
export async function getStats(): Promise<any> {
  try {
    const response = await fetch(`${ORACLE_API_URL}/api/stats`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      // Silently return null for non-200 responses
      return null;
    }

    return await response.json();
  } catch (error: any) {
    // Silently handle network errors (API endpoint may not be available)
    // Don't log to console to avoid cluttering error output
    return null;
  }
}

