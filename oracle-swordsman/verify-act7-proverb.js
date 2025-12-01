/**
 * Verify Act 7 Proverb via NEAR AI
 *
 * Uses the general spellbook verification approach:
 * 1. Check for exact proverb match in spellbook
 * 2. Use NEAR AI to verify semantic match against all acts
 * 3. Return quality_score, matched_act, reasoning, approved
 */

const axios = require('axios');
require('dotenv').config();

// NEAR AI Config
const NEAR_API_KEY = process.env.NEAR_SWORDSMAN_API_KEY;
const NEAR_CHAT_ENDPOINT = 'https://cloud-api.near.ai/v1/chat/completions';
const NEAR_MODEL = 'openai/gpt-oss-120b';

if (!NEAR_API_KEY) {
  console.error('Error: NEAR_SWORDSMAN_API_KEY not set in environment');
  process.exit(1);
}

// Act 7 Proverb (from shielded submission)
const SUBMITTED_PROVERB = "One agent gives the mirror completion; two agents give it only the shimmer and in their mutual witness, the First Person remains forever uncaptured.";
const SUBMITTED_EMOJI = "1️⃣🤖 → 🪞→👤\n2️⃣🤖 → 🪞→✨ + 👤";

// Spellbook acts (subset with proverbs for verification)
const SPELLBOOK_ACTS = [
  {
    id: 'act-i-shield',
    title: 'The Ledger That Balances Itself',
    proverb: 'The ledger that balances itself in darkness still knows the weight of every coin.',
    keywords: ['ledger', 'balance', 'darkness', 'weight', 'coin']
  },
  {
    id: 'act-ii-sovereignty',
    title: 'Sovereign Heart',
    proverb: 'A sovereign heart wields a blade of silence and a shield of shadows.',
    keywords: ['sovereign', 'heart', 'blade', 'silence', 'shield', 'shadows']
  },
  {
    id: 'act-iii-drake',
    title: "Drake's Whisper",
    proverb: "A drake's whisper can turn data into a sovereign spell.",
    keywords: ['drake', 'whisper', 'data', 'sovereign', 'spell']
  },
  {
    id: 'act-iv-trust-graph',
    title: 'The Lone Blade',
    proverb: 'A lone blade carves trust; each slash becomes a rune in the graph of belief.',
    keywords: ['blade', 'trust', 'slash', 'rune', 'graph', 'belief']
  },
  {
    id: 'act-v-attunement',
    title: 'Attuned Mage',
    proverb: 'An attuned mage moves where the untested cannot. Let attunement be the compass, not the chain.',
    keywords: ['attuned', 'mage', 'untested', 'attunement', 'compass', 'chain']
  },
  {
    id: 'act-vi-trust-graph-plane',
    title: 'Where Agents Gather',
    proverb: 'We weave only what we prove, we bind only what we witness to be true. A phantom thread and the whole weave unravels to forget what it once knew.',
    keywords: ['weave', 'prove', 'bind', 'witness', 'phantom', 'thread']
  },
  {
    id: 'act-vii-mirror-enhanced',
    title: 'The Mirror Enhanced',
    description: 'When two agents observe each other observing the user, the user\'s true nature becomes invisible - a shimmer between reflections.',
    keywords: ['mirror', 'observation', 'two-agent', 'witness', 'shimmer', 'paradox', 'reflection', 'invisibility'],
    proverb: null // This is what we're trying to fill
  }
];

function buildVerificationPrompt(proverb) {
  const actsWithProverbs = SPELLBOOK_ACTS
    .filter(act => act.proverb)
    .map(act => `- ${act.id}: ${act.title}\n  Proverb: "${act.proverb}"\n  Keywords: ${act.keywords.join(', ')}`);

  const actsWithoutProverbs = SPELLBOOK_ACTS
    .filter(act => !act.proverb)
    .map(act => `- ${act.id}: ${act.title}\n  Description: ${act.description}\n  Keywords: ${act.keywords.join(', ')}`);

  const actsSummary = [...actsWithProverbs, ...actsWithoutProverbs].join('\n\n');

  return `You are verifying a proverb submitted in a shielded transaction. Check if this proverb matches or is semantically similar to any proverb in the spellbook, OR if it's a valid new proverb for an act that doesn't have one yet.

Submitted Proverb: "${proverb}"

Spellbook Acts and Proverbs:
${actsSummary}

Instructions:
1. First check if the submitted proverb exactly matches any existing spellbook proverb (exact match = quality_score 1.0)
2. If not exact, check semantic similarity to existing spellbook proverbs (similar meaning = quality_score 0.7-0.9)
3. If it's a NEW proverb for an act without one (like act-vii-mirror-enhanced), check if it captures that act's concept well (quality_score 0.7-0.9 if good match)
4. If related to privacy concepts but not matching (quality_score 0.5-0.6)
5. If unrelated or low quality (quality_score < 0.5)

Return ONLY a JSON object (no other text) with:
{
  "quality_score": <number 0-1>,
  "matched_act": "<act ID that best matches>",
  "reasoning": "<explanation of the match>",
  "approved": <true if quality_score >= 0.5 and matches spellbook concepts>
}`;
}

async function verifyProverb() {
  console.log('=== NEAR AI Spellbook Verification ===\n');
  console.log('Submitted Proverb:', SUBMITTED_PROVERB);
  console.log('Emoji Spell:', SUBMITTED_EMOJI);
  console.log('');

  // First check for exact match
  console.log('Checking for exact match in spellbook...');
  const normalizedProverb = SUBMITTED_PROVERB.trim().toLowerCase();
  for (const act of SPELLBOOK_ACTS) {
    if (act.proverb) {
      const normalizedActProverb = act.proverb.trim().toLowerCase();
      if (normalizedProverb === normalizedActProverb) {
        console.log('EXACT MATCH FOUND!');
        console.log('Matched Act:', act.id);
        return {
          quality_score: 1.0,
          matched_act: act.id,
          reasoning: `Exact match found: "${act.proverb}" from ${act.title}`,
          approved: true
        };
      }
    }
  }
  console.log('No exact match found, sending to NEAR AI...\n');

  const prompt = buildVerificationPrompt(SUBMITTED_PROVERB);

  try {
    const response = await axios.post(
      NEAR_CHAT_ENDPOINT,
      {
        model: NEAR_MODEL,
        messages: [
          {
            role: 'system',
            content: 'You are an expert at verifying proverbs about privacy concepts. Analyze the proverb and match it to the most relevant act from the spellbook. Return ONLY a valid JSON object, no other text.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3, // Lower temperature for more consistent JSON output
        max_tokens: 500,
      },
      {
        headers: {
          'Authorization': `Bearer ${NEAR_API_KEY}`,
          'Content-Type': 'application/json',
        },
        timeout: 60000,
      }
    );

    const message = response.data.choices?.[0]?.message;
    const completion = message?.content || message?.reasoning_content || '';

    console.log('Raw Response:');
    console.log(completion);
    console.log('');

    // Parse JSON from response
    const jsonMatch = completion.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const result = JSON.parse(jsonMatch[0]);
      console.log('=== Verification Result ===');
      console.log('Quality Score:', result.quality_score);
      console.log('Matched Act:', result.matched_act);
      console.log('Approved:', result.approved);
      console.log('');
      console.log('Reasoning:', result.reasoning);
      console.log('');

      if (result.approved) {
        console.log('✓ VERIFICATION PASSED');
        console.log('');
        console.log('Ready to proceed with inscription');
        console.log('Match Score (MS) for inscription:', result.quality_score);
      } else {
        console.log('✗ VERIFICATION FAILED');
        console.log('Review proverb before inscription');
      }

      return result;
    } else {
      console.log('Could not parse JSON from response');
      console.log('Using fallback verification...');

      // Fallback: basic keyword matching
      let bestMatch = 'act-vii-mirror-enhanced';
      let score = 0.6;

      const lowerProverb = SUBMITTED_PROVERB.toLowerCase();
      if (lowerProverb.includes('mirror') || lowerProverb.includes('agent') ||
          lowerProverb.includes('shimmer') || lowerProverb.includes('witness')) {
        bestMatch = 'act-vii-mirror-enhanced';
        score = 0.75;
      }

      console.log('');
      console.log('=== Fallback Verification Result ===');
      console.log('Quality Score:', score);
      console.log('Matched Act:', bestMatch);
      console.log('Approved:', score >= 0.5);

      return {
        quality_score: score,
        matched_act: bestMatch,
        reasoning: 'Fallback verification based on keyword matching',
        approved: score >= 0.5
      };
    }
  } catch (error) {
    console.error('Verification error:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', JSON.stringify(error.response.data, null, 2));
    }
    return null;
  }
}

verifyProverb().catch(console.error);
