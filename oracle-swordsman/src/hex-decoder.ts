/**
 * Hex Decoder for Zcash Inscriptions
 * Backend implementation for decoding hex-encoded proverb text
 */

/**
 * Convert hex string to text
 */
export function hexToText(hexString: string, encoding: BufferEncoding = 'utf-8'): string {
  try {
    // Remove '0x' prefix if present
    let cleanHex = hexString;
    if (hexString.startsWith('0x') || hexString.startsWith('0X')) {
      cleanHex = hexString.slice(2);
    }

    // Remove whitespace
    cleanHex = cleanHex.replace(/\s/g, '');

    // Convert hex to bytes
    if (cleanHex.length % 2 !== 0) {
      throw new Error('Invalid hex string: odd length');
    }

    const bytes = Buffer.from(cleanHex, 'hex');

    // Decode bytes to text
    let text: string;
    try {
      text = bytes.toString(encoding);
    } catch (e) {
      // Fallback to utf-8 if encoding fails
      text = bytes.toString('utf-8');
    }

    // Remove null bytes and trailing whitespace
    text = text.replace(/\x00/g, '').trim();

    return text;
  } catch (error: any) {
    throw new Error(`Failed to decode hex: ${error.message}`);
  }
}

/**
 * Auto-detect and decode hex-encoded proverb text
 * This function tries to detect if text is hex-encoded and decodes it automatically
 */
export function autoDecodeProverb(text: string): string {
  if (!text || text.trim().length === 0) {
    return text;
  }

  // Check if it looks like hex (only hex characters, even length when cleaned)
  const cleanText = text.replace(/\s/g, '').replace(/^0x/i, '');
  const isHex = /^[0-9a-fA-F]+$/.test(cleanText) && cleanText.length >= 4 && cleanText.length % 2 === 0;

  if (!isHex) {
    return text; // Not hex, return as-is
  }

  try {
    const decoded = hexToText(cleanText);
    if (decoded && decoded.length > 0) {
      // Check if decoded text is readable (contains letters)
      if (/[a-zA-Z]/.test(decoded)) {
        return decoded;
      }
    }
  } catch (error) {
    // If decoding fails, return original
    console.warn('Failed to auto-decode hex:', error);
  }

  return text; // Return original if decoding fails or result doesn't look readable
}
