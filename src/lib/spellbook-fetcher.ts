/**
 * Fetches spellbook from IPFS and formats it for copying
 */

const SPELLBOOK_IPFS_URL = 'https://red-acute-chinchilla-216.mypinata.cloud/ipfs/bafkreiesrv2eolghj6mpbfpqwnff66fl5glevqmps3q6bzlhg5gtyf5jz4';

interface SpellbookData {
  version: string;
  created_at: string;
  description: string;
  spellbooks?: {
    story?: {
      name: string;
      description: string;
      opening?: {
        spell: string;
        proverb: string;
      };
      acts?: Array<{
        id: string;
        act_number: number;
        tale_id: string;
        title: string;
        description: string;
        category: string;
        keywords: string[];
        spell: string;
        proverb: string;
      }>;
    };
    zero?: {
      name: string;
      description: string;
      parts?: Array<{
        part_number: string;
        part_name: string;
        description: string;
        tales?: Array<{
          number: number;
          title: string;
          spell: string;
          proverb: string;
        }>;
      }>;
    };
  };
}

let spellbookCache: SpellbookData | null = null;
let cacheTimestamp: number = 0;
const CACHE_TTL = 3600000; // 1 hour

/**
 * Fetches the spellbook from IPFS
 */
async function fetchSpellbook(): Promise<SpellbookData> {
  const now = Date.now();
  
  // Return cached version if still valid
  if (spellbookCache && (now - cacheTimestamp) < CACHE_TTL) {
    return spellbookCache;
  }

  try {
    const response = await fetch(SPELLBOOK_IPFS_URL, {
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch spellbook: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    spellbookCache = data;
    cacheTimestamp = now;
    
    return data;
  } catch (error: any) {
    console.error('Error fetching spellbook from IPFS:', error);
    throw new Error(`Failed to fetch spellbook: ${error.message}`);
  }
}

/**
 * Formats the story spellbook for copying
 */
export async function getStorySpellbookText(): Promise<string> {
  try {
    const spellbook = await fetchSpellbook();
    const story = spellbook.spellbooks?.story;
    
    if (!story) {
      throw new Error('Story spellbook not found in IPFS data');
    }

    let text = `# ${story.name}\n\n`;
    if (story.description) {
      text += `${story.description}\n\n`;
    }

    // Add opening if present
    if (story.opening) {
      text += `## Opening\n\n`;
      text += `**Spell:** ${story.opening.spell}\n\n`;
      text += `**Proverb:** ${story.opening.proverb}\n\n`;
      text += `---\n\n`;
    }

    // Add acts
    if (story.acts && story.acts.length > 0) {
      text += `## Acts\n\n`;
      for (const act of story.acts) {
        text += `### Act ${act.act_number}: ${act.title}\n\n`;
        if (act.description) {
          text += `${act.description}\n\n`;
        }
        if (act.spell) {
          text += `**Spell:** ${act.spell}\n\n`;
        }
        if (act.proverb) {
          text += `**Proverb:** ${act.proverb}\n\n`;
        }
        text += `---\n\n`;
      }
    }

    return text;
  } catch (error: any) {
    console.error('Error formatting story spellbook:', error);
    throw error;
  }
}

/**
 * Formats the zero spellbook for copying
 */
export async function getZeroSpellbookText(): Promise<string> {
  try {
    const spellbook = await fetchSpellbook();
    const zero = spellbook.spellbooks?.zero;
    
    if (!zero) {
      throw new Error('Zero spellbook not found in IPFS data');
    }

    let text = `# ${zero.name}\n\n`;
    if (zero.description) {
      text += `${zero.description}\n\n`;
    }

    // Add parts and tales
    if (zero.parts && zero.parts.length > 0) {
      for (const part of zero.parts) {
        text += `## ${part.part_number}: ${part.part_name}\n\n`;
        if (part.description) {
          text += `${part.description}\n\n`;
        }

        if (part.tales && part.tales.length > 0) {
          for (const tale of part.tales) {
            text += `### Tale ${tale.number}: ${tale.title}\n\n`;
            if (tale.spell) {
              text += `**Spell:** ${tale.spell}\n\n`;
            }
            if (tale.proverb) {
              text += `**Proverb:** ${tale.proverb}\n\n`;
            }
            text += `---\n\n`;
          }
        }
      }
    }

    return text;
  } catch (error: any) {
    console.error('Error formatting zero spellbook:', error);
    throw error;
  }
}

/**
 * Clears the spellbook cache (useful for testing or forced refresh)
 */
export function clearSpellbookCache(): void {
  spellbookCache = null;
  cacheTimestamp = 0;
}

