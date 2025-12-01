/**
 * IPFS Proverb Store
 * 
 * Fetches and caches canonical proverbs from the First Person Spellbook
 * stored on IPFS/Pinata.
 * 
 * The spellbook contains 12 acts, each with:
 * - Narrative text (Soulbae & Soulbis stories)
 * - Canonical proverb
 * - Act metadata
 */

interface Act {
  id: string;
  title: string;
  narrative: string;
  proverb: string;
  zAddress: string; // Each act has its own donation address
  metadata: {
    theme: string;
    soulbae: string; // Mage's teaching
    soulbis: string; // Swordsman's teaching
  };
}

interface Spellbook {
  version: string;
  acts: Act[];
  updatedAt: string;
}

export class IPFSProverbStore {
  private gateway: string;
  private cid: string;
  private spellbook: Spellbook | null = null;
  private proverbCache: Map<string, string> = new Map();

  constructor(gateway: string, cid: string) {
    this.gateway = gateway.replace(/\/$/, ''); // Remove trailing slash
    this.cid = cid;
  }

  /**
   * Load the spellbook from IPFS
   */
  async loadSpellbook(): Promise<void> {
    const url = `${this.gateway}/ipfs/${this.cid}`;
    
    console.log(`[IPFS] Loading spellbook from ${url}`);
    
    try {
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch spellbook: ${response.status}`);
      }

      this.spellbook = await response.json() as Spellbook;
      
      // Build proverb cache
      for (const act of this.spellbook.acts) {
        this.proverbCache.set(act.id, act.proverb);
      }

      console.log(`[IPFS] Loaded spellbook v${this.spellbook.version} with ${this.spellbook.acts.length} acts`);
    } catch (error) {
      console.error('[IPFS] Error loading spellbook:', error);
      throw error;
    }
  }

  /**
   * Get canonical proverb for an act
   */
  async getProverb(actId: string): Promise<string | null> {
    if (!this.spellbook) {
      await this.loadSpellbook();
    }
    
    return this.proverbCache.get(actId) || null;
  }

  /**
   * Get all proverbs with their act IDs
   */
  getAllProverbs(): Array<{ actId: string; proverb: string }> {
    if (!this.spellbook) {
      throw new Error('Spellbook not loaded');
    }

    return this.spellbook.acts.map(act => ({
      actId: act.id,
      proverb: act.proverb
    }));
  }

  /**
   * Get act details
   */
  getAct(actId: string): Act | null {
    if (!this.spellbook) return null;
    return this.spellbook.acts.find(a => a.id === actId) || null;
  }

  /**
   * Get z-address for an act (for routing donations)
   */
  getActZAddress(actId: string): string | null {
    const act = this.getAct(actId);
    return act?.zAddress || null;
  }

  /**
   * Get count of acts
   */
  getActCount(): number {
    return this.spellbook?.acts.length || 0;
  }

  /**
   * Verify spellbook integrity
   */
  async verifyIntegrity(): Promise<boolean> {
    if (!this.spellbook) return false;

    // Verify each act has required fields
    for (const act of this.spellbook.acts) {
      if (!act.id || !act.proverb || !act.zAddress) {
        console.error(`[IPFS] Invalid act: ${act.id}`);
        return false;
      }
    }

    // Verify no duplicate act IDs
    const ids = new Set(this.spellbook.acts.map(a => a.id));
    if (ids.size !== this.spellbook.acts.length) {
      console.error('[IPFS] Duplicate act IDs detected');
      return false;
    }

    return true;
  }
}

/**
 * Example spellbook structure for IPFS upload
 */
export const EXAMPLE_SPELLBOOK: Spellbook = {
  version: '1.0.0',
  updatedAt: new Date().toISOString(),
  acts: [
    {
      id: '1',
      title: 'The First Boundary',
      narrative: 'Soulbis stood at the threshold, blade drawn against the shadow of surveillance...',
      proverb: 'A boundary drawn with intention becomes a door, not a wall.',
      zAddress: 'zs1act1xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
      metadata: {
        theme: 'Boundaries enable rather than restrict',
        soulbis: 'The Swordsman teaches that clear boundaries create safe spaces for growth.',
        soulbae: 'The Mage understands that limits define the shape of possibility.'
      }
    },
    {
      id: '2',
      title: 'The Delegation Spell',
      narrative: 'Soulbae wove threads of trust into the pattern, each strand a conscious choice...',
      proverb: 'To delegate is not to diminish, but to multiply your reach through chosen hands.',
      zAddress: 'zs1act2xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
      metadata: {
        theme: 'Conscious delegation preserves agency',
        soulbis: 'The Swordsman guards the delegation, ensuring the hands remain chosen.',
        soulbae: 'The Mage channels power through trusted conduits, amplifying without controlling.'
      }
    },
    {
      id: '3',
      title: 'The Reconstruction Ceiling',
      narrative: 'Together they built a fortress not of stone, but of mathematical certainty...',
      proverb: 'Separation maintained in architecture cannot be breached by intention.',
      zAddress: 'zs1act3xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
      metadata: {
        theme: 'Information-theoretic bounds over policy',
        soulbis: 'The Swordsman enforces the separation, not because he chooses, but because the math demands.',
        soulbae: 'The Mage sees that true privacy comes from architecture, not from promises.'
      }
    },
    // ... Acts 4-12 would follow the same pattern
    {
      id: '4',
      title: 'The Golden Proportion',
      narrative: 'In the flow of value, Soulbae traced the spiral that nature herself draws...',
      proverb: 'What grows in golden ratio grows in harmony with all that lives.',
      zAddress: 'zs1act4xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
      metadata: {
        theme: 'Natural economics follows phi',
        soulbis: 'The Swordsman divides the bounty as the spiral divides the shell.',
        soulbae: 'The Mage recognizes that 61.8 and 38.2 are not arbitrary, but inevitable.'
      }
    },
    {
      id: '5',
      title: 'The Viewing Eye',
      narrative: 'Soulbae\'s eye could see all, yet her hands remained still...',
      proverb: 'To see without the power to act is wisdom; to act without seeing is folly.',
      zAddress: 'zs1act5xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
      metadata: {
        theme: 'Separation of viewing and spending authority',
        soulbis: 'The Swordsman acts only when the Mage has seen and verified.',
        soulbae: 'The Mage\'s sight grants verification, not control.'
      }
    },
    {
      id: '6',
      title: 'The Shielded Path',
      narrative: 'Through the forest of watchers, a path wound unseen...',
      proverb: 'Privacy is not hiding; it is choosing who may walk beside you.',
      zAddress: 'zs1act6xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
      metadata: {
        theme: 'Shielded transactions as selective disclosure',
        soulbis: 'The Swordsman guards the path, not by blocking all, but by requiring invitation.',
        soulbae: 'The Mage weaves the shield that makes walking together a choice.'
      }
    },
    {
      id: '7',
      title: 'The Inscription',
      narrative: 'On the transparent stone, Soulbis carved the mark of passage...',
      proverb: 'What is inscribed in transparency anchors what flows through shadow.',
      zAddress: 'zs1act7xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
      metadata: {
        theme: 'OP_RETURN as proof without surveillance',
        soulbis: 'The Swordsman\'s mark proves the deed without revealing the doer.',
        soulbae: 'The Mage understands that some truths must be visible to be trusted.'
      }
    },
    {
      id: '8',
      title: 'The Semantic Key',
      narrative: 'Words held power, but only when truly understood...',
      proverb: 'Understanding cannot be stolen; it must be earned through attention.',
      zAddress: 'zs1act8xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
      metadata: {
        theme: 'Proverb matching as proof of engagement',
        soulbis: 'The Swordsman tests the seeker\'s understanding before opening the gate.',
        soulbae: 'The Mage knows that comprehension is the only key that cannot be forged.'
      }
    },
    {
      id: '9',
      title: 'The Trusted Enclave',
      narrative: 'Within the sanctuary, code ran pure, untouched by outer influence...',
      proverb: 'Trust placed in silicon exceeds trust placed in promises.',
      zAddress: 'zs1act9xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
      metadata: {
        theme: 'TEE as trustless verification',
        soulbis: 'The Swordsman trusts the enclave because its walls are hardware, not hope.',
        soulbae: 'The Mage\'s spells run in sanctuaries where even she cannot interfere.'
      }
    },
    {
      id: '10',
      title: 'The Immutable Record',
      narrative: 'In the crystalline network, knowledge once placed could never be altered...',
      proverb: 'What is pinned to the permanent cannot be revised by the powerful.',
      zAddress: 'zs1act10xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
      metadata: {
        theme: 'IPFS as immutable knowledge store',
        soulbis: 'The Swordsman values permanence, for it makes betrayal impossible.',
        soulbae: 'The Mage stores the spellbook where no hand can change its pages.'
      }
    },
    {
      id: '11',
      title: 'The Agent\'s Oath',
      narrative: 'Bound by code, the agents served, each knowing only their portion...',
      proverb: 'An agent that knows everything protects nothing; division is strength.',
      zAddress: 'zs1act11xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
      metadata: {
        theme: 'Dual-agent architecture for sovereignty',
        soulbis: 'The Swordsman and Mage are powerful apart, invincible together.',
        soulbae: 'The Mage\'s knowledge and the Swordsman\'s action, separate yet aligned.'
      }
    },
    {
      id: '12',
      title: 'The Sovereign\'s Return',
      narrative: 'And so the cycle completes, value returning to its rightful source...',
      proverb: 'Sovereignty begins when you own your data; it ends when you rent your identity.',
      zAddress: 'zs1act12xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
      metadata: {
        theme: 'Data dignity and self-sovereign identity',
        soulbis: 'The Swordsman\'s final lesson: you are not a product.',
        soulbae: 'The Mage\'s final gift: the keys to your own kingdom.'
      }
    }
  ]
};
