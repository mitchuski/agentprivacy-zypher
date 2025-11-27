/**
 * Golden Split Calculator
 * 
 * Implements the phi (φ) ratio split for donations:
 * - 61.8% → Sanctuary (transparent, inscribed)
 * - 38.2% → Protocol Fee (shielded)
 * 
 * The golden ratio (φ ≈ 1.618) appears throughout nature and
 * represents optimal distribution patterns. By using this ratio,
 * the protocol aligns its economics with natural growth patterns.
 * 
 * Mathematical basis:
 * φ = (1 + √5) / 2 ≈ 1.618033988749895
 * 1/φ ≈ 0.618033988749895 (61.8%)
 * 1 - 1/φ ≈ 0.381966011250105 (38.2%)
 */

// Golden ratio constant
const PHI = (1 + Math.sqrt(5)) / 2; // ≈ 1.618033988749895
const GOLDEN_RATIO = 1 / PHI;       // ≈ 0.618033988749895

// Zcash precision (8 decimal places, zatoshis)
const ZATOSHI_PER_ZEC = 100_000_000;
const MIN_OUTPUT = 0.00000546; // Dust threshold for transparent outputs

export interface SplitResult {
  sanctuary: number;    // 61.8% - goes to transparent address
  fee: number;          // 38.2% - stays shielded
  totalInput: number;   // Original amount
  networkFee: number;   // Estimated transaction fee
  precision: number;    // Rounding adjustment
}

export class GoldenSplit {
  private networkFee: number;

  /**
   * Create golden split calculator
   * @param estimatedNetworkFee Estimated fee per transaction in ZEC
   */
  constructor(estimatedNetworkFee: number = 0.0001) {
    this.networkFee = estimatedNetworkFee;
  }

  /**
   * Calculate the golden split for a donation amount
   */
  calculate(amount: number): SplitResult {
    if (amount <= 0) {
      throw new Error('Amount must be positive');
    }

    // Account for network fees (two transactions: sanctuary + fee)
    const totalFees = this.networkFee * 2;
    const distributable = amount - totalFees;

    if (distributable <= 0) {
      throw new Error(`Amount ${amount} too small after fees (${totalFees})`);
    }

    // Calculate golden split
    const sanctuaryRaw = distributable * GOLDEN_RATIO;
    const feeRaw = distributable * (1 - GOLDEN_RATIO);

    // Round to zatoshi precision
    const sanctuary = this.roundToZatoshi(sanctuaryRaw);
    const fee = this.roundToZatoshi(feeRaw);

    // Handle rounding remainder
    const total = sanctuary + fee;
    const precision = distributable - total;

    // Validate outputs meet dust threshold
    if (sanctuary < MIN_OUTPUT) {
      throw new Error(`Sanctuary output ${sanctuary} below dust threshold`);
    }
    if (fee < MIN_OUTPUT) {
      throw new Error(`Fee output ${fee} below dust threshold`);
    }

    return {
      sanctuary,
      fee,
      totalInput: amount,
      networkFee: totalFees,
      precision
    };
  }

  /**
   * Round to 8 decimal places (zatoshi precision)
   */
  private roundToZatoshi(amount: number): number {
    return Math.floor(amount * ZATOSHI_PER_ZEC) / ZATOSHI_PER_ZEC;
  }

  /**
   * Get the golden ratio used
   */
  getGoldenRatio(): { phi: number; sanctuary: number; fee: number } {
    return {
      phi: PHI,
      sanctuary: GOLDEN_RATIO,
      fee: 1 - GOLDEN_RATIO
    };
  }

  /**
   * Verify a split was calculated correctly
   */
  verify(split: SplitResult): boolean {
    const expectedSanctuary = split.totalInput * GOLDEN_RATIO;
    const expectedFee = split.totalInput * (1 - GOLDEN_RATIO);

    // Allow for fee and rounding adjustments
    const sanctuaryDiff = Math.abs(split.sanctuary - expectedSanctuary);
    const feeDiff = Math.abs(split.fee - expectedFee);
    const tolerance = this.networkFee * 2 + 0.00001; // Fees + rounding

    return sanctuaryDiff < tolerance && feeDiff < tolerance;
  }

  /**
   * Calculate minimum viable donation
   */
  getMinimumDonation(): number {
    // Must cover:
    // - Network fees for both transactions
    // - Dust threshold for both outputs
    const minFees = this.networkFee * 2;
    const minOutputs = MIN_OUTPUT * 2;
    
    // Work backwards from minimum outputs
    // fee = amount * 0.382, so amount = fee / 0.382
    const minFromFeeOutput = MIN_OUTPUT / (1 - GOLDEN_RATIO);
    
    return Math.max(minFees + minOutputs, minFromFeeOutput + minFees);
  }
}

/**
 * Utility: Format split for display
 */
export function formatSplit(split: SplitResult): string {
  const sanctuaryPct = ((split.sanctuary / split.totalInput) * 100).toFixed(2);
  const feePct = ((split.fee / split.totalInput) * 100).toFixed(2);
  
  return [
    `Input:     ${split.totalInput.toFixed(8)} ZEC`,
    `Sanctuary: ${split.sanctuary.toFixed(8)} ZEC (${sanctuaryPct}%)`,
    `Fee:       ${split.fee.toFixed(8)} ZEC (${feePct}%)`,
    `Network:   ${split.networkFee.toFixed(8)} ZEC`,
    `Rounding:  ${split.precision.toFixed(8)} ZEC`
  ].join('\n');
}

/**
 * Example usage and verification
 */
if (require.main === module) {
  const calculator = new GoldenSplit();
  
  console.log('Golden Split Calculator');
  console.log('=======================\n');
  
  console.log('Golden Ratio:', calculator.getGoldenRatio());
  console.log('Minimum donation:', calculator.getMinimumDonation().toFixed(8), 'ZEC\n');

  // Test various amounts
  const testAmounts = [0.01, 0.1, 1, 10, 100];
  
  for (const amount of testAmounts) {
    console.log(`\nSplit for ${amount} ZEC:`);
    console.log('-'.repeat(40));
    
    try {
      const split = calculator.calculate(amount);
      console.log(formatSplit(split));
      console.log('Valid:', calculator.verify(split) ? '✓' : '✗');
    } catch (error: any) {
      console.log('Error:', error.message);
    }
  }
}
