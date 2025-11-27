/**
 * Memo Parser Module
 * Parses proverb submissions from Zcash transaction memos
 * Supports multiple memo formats for the Proverb Revelation Protocol
 */

export interface ParsedMemo {
  format: 'rpp-v1' | 'track' | 'legacy' | 'unknown';
  trackingCode?: string;
  taleId?: string;
  proverbText?: string;
  timestamp?: number;
  valid: boolean;
  error?: string;
}

export interface SubmissionData {
  trackingCode: string;
  proverbText: string;
  taleId?: string;
  timestamp?: number;
  format: string;
}

/**
 * Parse memo from Zcash transaction
 * Supports multiple formats:
 * 
 * RPP-v1 format (primary):
 * Line 1: rpp-v1
 * Line 2: tale:[tale_id]
 * Line 3: proverb text
 * 
 * TRACK format (legacy):
 * TRACK:[code]|proverb text
 * 
 * Single-line RPP format:
 * rpp-v1:tale:[tale_id]|proverb text
 */
export function parseMemo(memo: string): ParsedMemo {
  if (!memo || memo.trim().length === 0) {
    return {
      format: 'unknown',
      valid: false,
      error: 'Empty memo'
    };
  }

  const trimmedMemo = memo.trim();

  // Try RPP-v1 multi-line format
  const rppMultiLine = parseRPPv1MultiLine(trimmedMemo);
  if (rppMultiLine.valid) {
    return rppMultiLine;
  }

  // Try RPP-v1 single-line format
  const rppSingleLine = parseRPPv1SingleLine(trimmedMemo);
  if (rppSingleLine.valid) {
    return rppSingleLine;
  }

  // Try legacy TRACK format
  const legacyTrack = parseTrackFormat(trimmedMemo);
  if (legacyTrack.valid) {
    return legacyTrack;
  }

  // Unknown format
  return {
    format: 'unknown',
    valid: false,
    error: 'Unrecognized memo format'
  };
}

/**
 * Parse RPP-v1 multi-line format
 * Expected format:
 * Line 1: rpp-v1
 * Line 2: tale:[tale_id]
 * Line 3+: proverb text
 */
function parseRPPv1MultiLine(memo: string): ParsedMemo {
  const lines = memo.split('\n').map(line => line.trim()).filter(line => line.length > 0);
  
  if (lines.length < 3) {
    return { format: 'unknown', valid: false, error: 'Insufficient lines for RPP-v1 format' };
  }

  // Check first line
  if (lines[0].toLowerCase() !== 'rpp-v1') {
    return { format: 'unknown', valid: false, error: 'First line must be "rpp-v1"' };
  }

  // Parse tale ID
  const taleMatch = lines[1].match(/^tale:([a-zA-Z0-9_-]+)$/i);
  if (!taleMatch) {
    return { format: 'unknown', valid: false, error: 'Second line must be "tale:[id]"' };
  }

  const taleId = taleMatch[1];
  const proverbText = lines.slice(2).join(' ');

  if (proverbText.length === 0) {
    return { format: 'unknown', valid: false, error: 'Proverb text is empty' };
  }

  // Generate tracking code from tale ID + timestamp
  const timestamp = Date.now();
  const trackingCode = generateTrackingCode(taleId, timestamp);

  return {
    format: 'rpp-v1',
    trackingCode,
    taleId,
    proverbText,
    timestamp,
    valid: true
  };
}

/**
 * Parse RPP-v1 single-line format
 * Expected format:
 * rpp-v1:tale:[tale_id]|proverb text
 */
function parseRPPv1SingleLine(memo: string): ParsedMemo {
  const match = memo.match(/^rpp-v1:tale:([a-zA-Z0-9_-]+)\|(.+)$/i);
  
  if (!match) {
    return { format: 'unknown', valid: false, error: 'Not RPP-v1 single-line format' };
  }

  const taleId = match[1];
  const proverbText = match[2].trim();

  if (proverbText.length === 0) {
    return { format: 'unknown', valid: false, error: 'Proverb text is empty' };
  }

  // Generate tracking code from tale ID + timestamp
  const timestamp = Date.now();
  const trackingCode = generateTrackingCode(taleId, timestamp);

  return {
    format: 'rpp-v1',
    trackingCode,
    taleId,
    proverbText,
    timestamp,
    valid: true
  };
}

/**
 * Parse legacy TRACK format
 * Expected format:
 * TRACK:[code]|proverb text
 */
function parseTrackFormat(memo: string): ParsedMemo {
  const match = memo.match(/^TRACK:([A-Z0-9]+)\|(.+)$/i);
  
  if (!match) {
    return { format: 'unknown', valid: false, error: 'Not TRACK format' };
  }

  const trackingCode = match[1].toUpperCase();
  const proverbText = match[2].trim();

  if (proverbText.length === 0) {
    return { format: 'unknown', valid: false, error: 'Proverb text is empty' };
  }

  return {
    format: 'track',
    trackingCode,
    proverbText,
    valid: true
  };
}

/**
 * Generate tracking code from tale ID and timestamp
 * Format: [TALE_PREFIX][TIMESTAMP_SUFFIX]
 * Example: SHIELD7A2B
 */
export function generateTrackingCode(taleId: string, timestamp?: number): string {
  const ts = timestamp || Date.now();
  
  // Extract tale prefix (e.g., "shield" from "tale-01-shield")
  const talePrefix = taleId
    .replace(/^tale-\d+-/, '')  // Remove "tale-XX-" prefix
    .replace(/[^a-zA-Z0-9]/g, '') // Remove non-alphanumeric
    .toUpperCase()
    .substring(0, 6); // Max 6 chars
  
  // Generate timestamp suffix (last 4 chars of timestamp in base36)
  const timestampSuffix = (ts % 1679616).toString(36).toUpperCase().padStart(4, '0');
  
  return `${talePrefix}${timestampSuffix}`;
}

/**
 * Validate proverb text
 */
export function validateProverb(text: string): { valid: boolean; error?: string } {
  if (!text || text.trim().length === 0) {
    return { valid: false, error: 'Proverb text is empty' };
  }

  const trimmed = text.trim();

  // Minimum length (at least a short sentence)
  if (trimmed.length < 10) {
    return { valid: false, error: 'Proverb is too short (minimum 10 characters)' };
  }

  // Maximum length (reasonable proverb length)
  if (trimmed.length > 500) {
    return { valid: false, error: 'Proverb is too long (maximum 500 characters)' };
  }

  // Must contain at least one letter
  if (!/[a-zA-Z]/.test(trimmed)) {
    return { valid: false, error: 'Proverb must contain at least one letter' };
  }

  return { valid: true };
}

/**
 * Validate tracking code
 */
export function validateTrackingCode(code: string): boolean {
  // Must be alphanumeric, 6-12 characters
  return /^[A-Z0-9]{6,12}$/.test(code);
}

/**
 * Extract submission data from parsed memo
 */
export function extractSubmissionData(parsed: ParsedMemo): SubmissionData | null {
  if (!parsed.valid || !parsed.proverbText || !parsed.trackingCode) {
    return null;
  }

  return {
    trackingCode: parsed.trackingCode,
    proverbText: parsed.proverbText,
    taleId: parsed.taleId,
    timestamp: parsed.timestamp,
    format: parsed.format
  };
}

/**
 * Create inscription memo for blockchain
 * Public inscription includes full proverb
 */
export function createInscriptionMemo(
  trackingCode: string,
  proverbText: string,
  taleId?: string
): string {
  if (taleId) {
    return `RPP-PROOF:${trackingCode}|tale:${taleId}|${proverbText}`;
  }
  return `RPP-PROOF:${trackingCode}|${proverbText}`;
}

/**
 * Create private memo (minimal data)
 */
export function createPrivateMemo(trackingCode: string): string {
  return `RPP-PRIVATE:${trackingCode}`;
}

/**
 * Parse inscription memo (for verification)
 */
export function parseInscriptionMemo(memo: string): {
  trackingCode?: string;
  taleId?: string;
  proverbText?: string;
  type: 'proof' | 'private' | 'unknown';
} {
  // Try proof format
  const proofMatch = memo.match(/^RPP-PROOF:([A-Z0-9]+)\|(?:tale:([a-z0-9_-]+)\|)?(.+)$/i);
  if (proofMatch) {
    return {
      type: 'proof',
      trackingCode: proofMatch[1],
      taleId: proofMatch[2],
      proverbText: proofMatch[3]
    };
  }

  // Try private format
  const privateMatch = memo.match(/^RPP-PRIVATE:([A-Z0-9]+)$/i);
  if (privateMatch) {
    return {
      type: 'private',
      trackingCode: privateMatch[1]
    };
  }

  return { type: 'unknown' };
}

/**
 * Generate submission memo for user (to include in payment)
 */
export function generateSubmissionMemo(taleId: string, proverbText: string): string {
  return `rpp-v1\ntale:${taleId}\n${proverbText}`;
}

/**
 * Clean proverb text (remove extra whitespace, etc.)
 */
export function cleanProverbText(text: string): string {
  return text
    .trim()
    .replace(/\s+/g, ' ')  // Collapse multiple spaces
    .replace(/\n+/g, ' ')  // Replace newlines with spaces
    .substring(0, 500);     // Enforce max length
}

/**
 * Check if memo looks like a proverb submission
 */
export function looksLikeSubmission(memo: string): boolean {
  if (!memo) return false;
  
  const lower = memo.toLowerCase();
  return lower.includes('rpp-v1') || 
         lower.includes('track:') || 
         lower.startsWith('tale:');
}

/**
 * Get tale ID from various memo formats
 */
export function extractTaleId(memo: string): string | null {
  const parsed = parseMemo(memo);
  return parsed.taleId || null;
}

/**
 * Statistics: Parse multiple memos
 */
export function parseMultipleMemos(memos: string[]): {
  total: number;
  valid: number;
  invalid: number;
  byFormat: Record<string, number>;
} {
  const stats = {
    total: memos.length,
    valid: 0,
    invalid: 0,
    byFormat: {} as Record<string, number>
  };

  for (const memo of memos) {
    const parsed = parseMemo(memo);
    
    if (parsed.valid) {
      stats.valid++;
    } else {
      stats.invalid++;
    }
    
    stats.byFormat[parsed.format] = (stats.byFormat[parsed.format] || 0) + 1;
  }

  return stats;
}

/**
 * Test memo format
 */
export function testMemoFormat(memo: string): {
  isValid: boolean;
  format?: string;
  suggestions?: string[];
} {
  const parsed = parseMemo(memo);
  
  if (parsed.valid) {
    return {
      isValid: true,
      format: parsed.format
    };
  }

  // Provide suggestions
  const suggestions: string[] = [];
  
  if (memo.toLowerCase().includes('tale') && !memo.includes('rpp-v1')) {
    suggestions.push('Add "rpp-v1" as the first line');
  }
  
  if (!memo.includes('tale:')) {
    suggestions.push('Include tale ID in format: tale:[id]');
  }
  
  if (memo.length < 10) {
    suggestions.push('Memo seems too short - include full proverb text');
  }

  return {
    isValid: false,
    format: parsed.format,
    suggestions: suggestions.length > 0 ? suggestions : ['Use format: rpp-v1\\ntale:[id]\\n[proverb text]']
  };
}

/**
 * Example memo generators for testing
 */
export const exampleMemos = {
  rppMultiLine: (taleId: string, proverb: string) => 
    `rpp-v1\ntale:${taleId}\n${proverb}`,
  
  rppSingleLine: (taleId: string, proverb: string) =>
    `rpp-v1:tale:${taleId}|${proverb}`,
  
  track: (trackingCode: string, proverb: string) =>
    `TRACK:${trackingCode}|${proverb}`,
  
  inscription: (trackingCode: string, taleId: string, proverb: string) =>
    `RPP-PROOF:${trackingCode}|tale:${taleId}|${proverb}`,
  
  private: (trackingCode: string) =>
    `RPP-PRIVATE:${trackingCode}`
};
