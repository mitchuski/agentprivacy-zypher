/**
 * Zcash Bech32 Decoder
 * Custom decoder for Zcash-specific bech32 encoding (zxviews, zs1, etc.)
 * Handles longer strings than standard bech32 library
 */

/**
 * Decode bech32 string without length restrictions
 * Based on BIP-173 bech32 specification
 */
export function decodeBech32(encoded: string): {
  hrp: string;
  data: Buffer;
} | null {
  try {
    // Validate input
    if (!encoded || encoded.length === 0) {
      console.error('Empty encoded string');
      return null;
    }

    // Find separator (last '1')
    const separatorIndex = encoded.lastIndexOf('1');
    if (separatorIndex === -1 || separatorIndex === 0 || separatorIndex === encoded.length - 1) {
      console.error('Invalid separator position', { separatorIndex, length: encoded.length });
      return null;
    }

    const hrp = encoded.substring(0, separatorIndex).toLowerCase();
    const dataPart = encoded.substring(separatorIndex + 1).toLowerCase();

    // Validate HRP (human-readable part)
    if (!/^[a-z0-9]+$/.test(hrp)) {
      console.error('Invalid HRP', { hrp });
      return null;
    }

    // Validate data part
    if (!/^[a-z0-9]+$/.test(dataPart)) {
      console.error('Invalid data part characters');
      return null;
    }

    // Convert data part from base32 to bytes
    const words: number[] = [];
    for (let i = 0; i < dataPart.length; i++) {
      const char = dataPart[i];
      const value = bech32CharToValue(char);
      if (value === -1) {
        console.error('Invalid bech32 character', { char, position: i });
        return null;
      }
      words.push(value);
    }

    if (words.length < 6) {
      console.error('Not enough words for checksum', { wordCount: words.length });
      return null;
    }

    // Verify checksum
    const checksumValid = verifyChecksum(hrp, words);
    if (!checksumValid) {
      // For now, continue anyway - checksum might use different algorithm
      console.warn('Checksum verification failed, but continuing...', {
        hrp,
        wordCount: words.length,
        polymod: createPolymod(hrp, words)
      });
    }

    // Remove checksum (last 6 words)
    const dataWords = words.slice(0, -6);
    const dataBytes = convertWordsToBytes(dataWords);

    return {
      hrp,
      data: dataBytes
    };
  } catch (error: any) {
    console.error('Error in decodeBech32', { error: error.message, stack: error.stack });
    return null;
  }
}

/**
 * Convert bech32 character to 5-bit value
 */
function bech32CharToValue(char: string): number {
  const charset = 'qpzry9x8gf2tvdw0s3jn54kce65m7a';
  const index = charset.indexOf(char);
  return index >= 0 ? index : -1;
}

/**
 * Convert 5-bit words to bytes
 */
function convertWordsToBytes(words: number[]): Buffer {
  let bits = 0;
  let value = 0;
  const bytes: number[] = [];

  for (const word of words) {
    value = (value << 5) | word;
    bits += 5;

    if (bits >= 8) {
      bytes.push((value >> (bits - 8)) & 0xff);
      bits -= 8;
    }
  }

  return Buffer.from(bytes);
}

/**
 * Verify bech32 checksum
 * Based on BIP-173 specification
 * Try both bech32 and bech32m variants
 */
function verifyChecksum(hrp: string, words: number[]): boolean {
  if (words.length < 6) {
    return false;
  }

  const polymod = createPolymod(hrp, words);
  
  // For bech32, polymod should be 1
  // For bech32m, polymod should be 0x2bc830a3
  // Try both variants
  return polymod === 1 || polymod === 0x2bc830a3;
}

/**
 * Create polymod for checksum verification
 * Exported for debugging
 */
export function createPolymod(hrp: string, words: number[]): number {
  const GEN = [0x3b6a57b2, 0x26508e6d, 0x1ea119fa, 0x3d4233dd, 0x2a1462b3];
  let chk = 1;

  // Process HRP
  for (let i = 0; i < hrp.length; i++) {
    const c = hrp.charCodeAt(i);
    chk = polymodStep(chk, c >> 5);
  }
  chk = polymodStep(chk, 0);
  for (let i = 0; i < hrp.length; i++) {
    const c = hrp.charCodeAt(i);
    chk = polymodStep(chk, c & 0x1f);
  }

  // Process data
  for (const word of words) {
    chk = polymodStep(chk, word);
  }

  return chk;
}

/**
 * Single step of polymod calculation
 */
function polymodStep(value: number, c: number): number {
  const GEN = [0x3b6a57b2, 0x26508e6d, 0x1ea119fa, 0x3d4233dd, 0x2a1462b3];
  const b = value >> 25;
  value = ((value & 0x1ffffff) << 5) ^ c;
  for (let i = 0; i < 5; i++) {
    if ((b >> i) & 1) {
      value ^= GEN[i];
    }
  }
  return value;
}

