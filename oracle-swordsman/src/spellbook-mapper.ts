/**
 * Maps tale IDs to spellbook acts for verification
 */

import { Spellbook, SpellbookAct } from './ipfs-client';

export interface TaleMapping {
  taleId: string;
  actId: string;
  actNumber: number;
  spellbook: 'story' | 'zero';
  title: string;
}

/**
 * Map tale ID to act information
 * This helps match proverbs submitted with tale IDs to the correct spellbook act
 */
export function mapTaleIdToAct(taleId: string, spellbook: Spellbook): TaleMapping | null {
  // Try to find act by tale_id in both spellbooks
  if (spellbook.spellbooks) {
    // Check story spellbook
    if (spellbook.spellbooks.story) {
      const storyAct = spellbook.spellbooks.story.acts.find(
        act => act.tale_id === taleId || act.id.includes(taleId)
      );
      if (storyAct) {
        return {
          taleId: taleId,
          actId: storyAct.id,
          actNumber: storyAct.act_number || 0,
          spellbook: 'story',
          title: storyAct.title,
        };
      }
    }
    
    // Check zero spellbook
    if (spellbook.spellbooks.zero) {
      const zeroAct = spellbook.spellbooks.zero.acts.find(
        act => act.tale_id === taleId || act.id.includes(taleId)
      );
      if (zeroAct) {
        return {
          taleId: taleId,
          actId: zeroAct.id,
          actNumber: zeroAct.act_number || 0,
          spellbook: 'zero',
          title: zeroAct.title,
        };
      }
    }
  }
  
  // Fallback: search all acts
  const act = spellbook.acts.find(
    act => act.tale_id === taleId || act.id.includes(taleId)
  );
  
  if (act) {
    // Determine spellbook from act ID
    const spellbookType = act.id.startsWith('tale-') ? 'zero' : 'story';
    return {
      taleId: taleId,
      actId: act.id,
      actNumber: act.act_number || 0,
      spellbook: spellbookType,
      title: act.title,
    };
  }
  
  return null;
}

/**
 * Get act by tale ID
 */
export function getActByTaleId(taleId: string, spellbook: Spellbook): SpellbookAct | null {
  const mapping = mapTaleIdToAct(taleId, spellbook);
  if (!mapping) return null;
  
  return spellbook.acts.find(act => act.id === mapping.actId) || null;
}

import { Spellbook, SpellbookAct } from './ipfs-client';

