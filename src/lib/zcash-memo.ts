// Zcash Memo Formatting Utilities
// Formats proverbs for Zcash shielded transaction memos

export interface ZcashMemo {
  protocol: string;
  taleId: string;
  timestamp: number;
  proverb: string;
}

/**
 * Format proverb into Zcash memo (rpp-v1 format)
 */
export function formatZcashMemo(
  taleId: string,
  proverb: string
): string {
  const timestamp = Date.now();
  return `[rpp-v1]
[${taleId}]
[${timestamp}]
[${proverb}]`;
}

/**
 * Parse Zcash memo back into components
 */
export function parseZcashMemo(memo: string): ZcashMemo | null {
  const lines = memo.trim().split('\n');
  
  if (lines.length < 4) {
    return null;
  }

  const protocol = lines[0].replace(/[\[\]]/g, '');
  const taleId = lines[1].replace(/[\[\]]/g, '');
  const timestamp = parseInt(lines[2].replace(/[\[\]]/g, ''), 10);
  const proverb = lines[3].replace(/[\[\]]/g, '');

  if (protocol !== 'rpp-v1' || isNaN(timestamp)) {
    return null;
  }

  return {
    protocol,
    taleId,
    timestamp,
    proverb,
  };
}

/**
 * Validate proverb length (must fit in 512 bytes)
 */
export function validateProverb(proverb: string): { valid: boolean; length: number; maxLength: number } {
  const encoded = new TextEncoder().encode(proverb);
  const maxLength = 512;
  return {
    valid: encoded.length <= maxLength,
    length: encoded.length,
    maxLength,
  };
}

/**
 * Get tale ID from act number
 */
export function getTaleIdFromAct(act: number): string {
  const taleMap: { [key: number]: string } = {
    1: 'act-i-venice',
    2: 'act-ii-dual-ceremony',
    3: 'act-iii-drakes-teaching',
    4: 'act-iv-blade-alone',
    5: 'act-v-light-armour',
    6: 'act-vi-trust-graph-plane',
    7: 'act-vii-mirror-enhanced',
    8: 'act-viii-ancient-rule',
    9: 'act-ix-zcash-shield',
    10: 'topology-of-revelation',
    11: 'act-xi-balanced-spiral-of-sovereignty',
  };
  return taleMap[act] || `act-${act}`;
}

