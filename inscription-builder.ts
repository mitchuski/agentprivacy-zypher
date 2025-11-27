/**
 * Inscription Builder
 * 
 * Creates inscriptions for the transparent portion of the golden split.
 * These inscriptions serve as "sanctuary signals" - visible proof that
 * a proverb-verified donation occurred without revealing donor identity.
 * 
 * Inspired by Zerdinals protocol for Zcash inscriptions.
 * 
 * OP_RETURN allows up to 80 bytes of arbitrary data in Bitcoin/Zcash.
 * We use this space efficiently to encode:
 * - Protocol identifier
 * - Act ID (which spellbook story)
 * - Proverb hash (proof of understanding)
 * - Amount (in zatoshis)
 * - Timestamp
 */

interface InscriptionData {
  actId: string;          // Spellbook act (1-12)
  proverbHash: string;    // SHA256 of submitted proverb
  originalTxid: string;   // Reference to shielded donation
  amount: number;         // Sanctuary amount in ZEC
  timestamp: number;      // Unix timestamp
}

// Protocol constants
const PROTOCOL_ID = 'STS';  // Signal-to-Sanctuary
const VERSION = '01';       // Protocol version

export class InscriptionBuilder {
  
  /**
   * Build inscription string for memo field
   * This is a human-readable format for z-to-t transactions
   */
  build(data: InscriptionData): string {
    // Format: STS|v01|ACT:X|HASH:xxxx|AMT:xxxx|TS:xxxx
    return [
      PROTOCOL_ID,
      `v${VERSION}`,
      `ACT:${data.actId}`,
      `H:${data.proverbHash.slice(0, 16)}`,  // First 16 chars of hash
      `A:${this.formatAmount(data.amount)}`,
      `T:${Math.floor(data.timestamp / 1000)}`  // Unix timestamp in seconds
    ].join('|');
  }

  /**
   * Build binary inscription for OP_RETURN
   * Maximum 80 bytes for standard OP_RETURN
   */
  buildBinary(data: InscriptionData): Buffer {
    const buffer = Buffer.alloc(80);
    let offset = 0;

    // Protocol ID (3 bytes)
    buffer.write(PROTOCOL_ID, offset, 3, 'ascii');
    offset += 3;

    // Version (1 byte)
    buffer.writeUInt8(parseInt(VERSION), offset);
    offset += 1;

    // Act ID (1 byte, 1-12)
    buffer.writeUInt8(parseInt(data.actId), offset);
    offset += 1;

    // Proverb hash (first 32 bytes = 256 bits)
    const hashBytes = Buffer.from(data.proverbHash.slice(0, 64), 'hex');
    hashBytes.copy(buffer, offset, 0, 32);
    offset += 32;

    // Amount in zatoshis (8 bytes)
    const zatoshis = BigInt(Math.floor(data.amount * 100_000_000));
    buffer.writeBigUInt64BE(zatoshis, offset);
    offset += 8;

    // Timestamp (4 bytes)
    buffer.writeUInt32BE(Math.floor(data.timestamp / 1000), offset);
    offset += 4;

    // Original txid reference (first 16 bytes)
    const txidBytes = Buffer.from(data.originalTxid.slice(0, 32), 'hex');
    txidBytes.copy(buffer, offset, 0, 16);
    offset += 16;

    // Padding/reserved (remaining bytes)
    // Can be used for future extensions

    return buffer.slice(0, offset);
  }

  /**
   * Parse inscription from memo string
   */
  parse(inscription: string): Partial<InscriptionData> | null {
    try {
      const parts = inscription.split('|');
      
      if (parts[0] !== PROTOCOL_ID) {
        return null;
      }

      const result: Partial<InscriptionData> = {};

      for (const part of parts) {
        if (part.startsWith('ACT:')) {
          result.actId = part.slice(4);
        } else if (part.startsWith('H:')) {
          result.proverbHash = part.slice(2);
        } else if (part.startsWith('A:')) {
          result.amount = this.parseAmount(part.slice(2));
        } else if (part.startsWith('T:')) {
          result.timestamp = parseInt(part.slice(2)) * 1000;
        }
      }

      return result;
    } catch {
      return null;
    }
  }

  /**
   * Parse binary inscription from OP_RETURN
   */
  parseBinary(buffer: Buffer): Partial<InscriptionData> | null {
    try {
      let offset = 0;

      // Protocol ID
      const protocolId = buffer.toString('ascii', offset, offset + 3);
      if (protocolId !== PROTOCOL_ID) return null;
      offset += 3;

      // Version
      const version = buffer.readUInt8(offset);
      offset += 1;

      // Act ID
      const actId = buffer.readUInt8(offset).toString();
      offset += 1;

      // Proverb hash
      const proverbHash = buffer.slice(offset, offset + 32).toString('hex');
      offset += 32;

      // Amount
      const zatoshis = buffer.readBigUInt64BE(offset);
      const amount = Number(zatoshis) / 100_000_000;
      offset += 8;

      // Timestamp
      const timestamp = buffer.readUInt32BE(offset) * 1000;
      offset += 4;

      // Original txid
      const originalTxid = buffer.slice(offset, offset + 16).toString('hex');
      offset += 16;

      return {
        actId,
        proverbHash,
        amount,
        timestamp,
        originalTxid
      };
    } catch {
      return null;
    }
  }

  /**
   * Create OP_RETURN script
   * Format: OP_RETURN <data>
   */
  buildOpReturnScript(data: InscriptionData): Buffer {
    const payload = this.buildBinary(data);
    
    // OP_RETURN = 0x6a
    // Length prefix for data
    const script = Buffer.alloc(payload.length + 2);
    script.writeUInt8(0x6a, 0);  // OP_RETURN
    script.writeUInt8(payload.length, 1);  // Data length
    payload.copy(script, 2);
    
    return script;
  }

  /**
   * Format amount for inscription
   */
  private formatAmount(amount: number): string {
    // Convert to zatoshis for compact representation
    const zatoshis = Math.floor(amount * 100_000_000);
    return zatoshis.toString(16); // Hex for compactness
  }

  /**
   * Parse amount from inscription
   */
  private parseAmount(hex: string): number {
    const zatoshis = parseInt(hex, 16);
    return zatoshis / 100_000_000;
  }

  /**
   * Validate inscription data
   */
  validate(data: InscriptionData): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Act ID must be 1-12
    const actNum = parseInt(data.actId);
    if (isNaN(actNum) || actNum < 1 || actNum > 12) {
      errors.push('Invalid act ID (must be 1-12)');
    }

    // Proverb hash must be valid hex
    if (!/^[a-f0-9]{64}$/i.test(data.proverbHash)) {
      errors.push('Invalid proverb hash (must be 64 hex chars)');
    }

    // Original txid must be valid hex
    if (!/^[a-f0-9]{64}$/i.test(data.originalTxid)) {
      errors.push('Invalid txid (must be 64 hex chars)');
    }

    // Amount must be positive
    if (data.amount <= 0) {
      errors.push('Amount must be positive');
    }

    // Timestamp must be reasonable
    const now = Date.now();
    if (data.timestamp > now + 60000 || data.timestamp < now - 365 * 24 * 60 * 60 * 1000) {
      errors.push('Timestamp out of reasonable range');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
}

/**
 * Zerdinals-style inscription format
 * Based on https://zerdinals.com/ protocol
 */
export class ZerdinalsInscription {
  
  /**
   * Create a Zerdinals-compatible inscription
   * Format follows the ZRC-20 / NFT inscription pattern
   */
  static create(data: {
    protocol: 'zrc-20' | 'nft' | 'sanctuary';
    operation: 'mint' | 'transfer' | 'signal';
    data: Record<string, any>;
  }): string {
    return JSON.stringify({
      p: data.protocol,
      op: data.operation,
      ...data.data
    });
  }

  /**
   * Create sanctuary signal inscription
   */
  static createSanctuarySignal(data: InscriptionData): string {
    return this.create({
      protocol: 'sanctuary',
      operation: 'signal',
      data: {
        act: data.actId,
        hash: data.proverbHash.slice(0, 16),
        amt: data.amount,
        ts: Math.floor(data.timestamp / 1000),
        ref: data.originalTxid.slice(0, 16)
      }
    });
  }
}

/**
 * Example usage
 */
if (require.main === module) {
  const builder = new InscriptionBuilder();
  
  const testData: InscriptionData = {
    actId: '5',
    proverbHash: 'a'.repeat(64),
    originalTxid: 'b'.repeat(64),
    amount: 0.618,
    timestamp: Date.now()
  };

  console.log('Inscription Builder Test');
  console.log('========================\n');

  // Text inscription
  const textInsc = builder.build(testData);
  console.log('Text inscription:', textInsc);
  console.log('Text length:', textInsc.length, 'bytes\n');

  // Binary inscription
  const binaryInsc = builder.buildBinary(testData);
  console.log('Binary inscription:', binaryInsc.toString('hex'));
  console.log('Binary length:', binaryInsc.length, 'bytes\n');

  // Parse back
  console.log('Parsed text:', builder.parse(textInsc));
  console.log('Parsed binary:', builder.parseBinary(binaryInsc));

  // Zerdinals format
  const zerdinals = ZerdinalsInscription.createSanctuarySignal(testData);
  console.log('\nZerdinals format:', zerdinals);
  console.log('Zerdinals length:', zerdinals.length, 'bytes');

  // Validation
  console.log('\nValidation:', builder.validate(testData));
}
