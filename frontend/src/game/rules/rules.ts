import type { Rank, Suit, HandType } from '../types';

// ─────────────────────────────────────────────────────────────────────────────
// ALL GAME RULES ARE DEFINED HERE — NO RULE LOGIC LIVES ANYWHERE ELSE
// ─────────────────────────────────────────────────────────────────────────────

export const rules = {
  // ── Deck ────────────────────────────────────────────────────────────────────
  deck: {
    ranks: ['3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A', '2'] as Rank[],
    suits: ['♠', '♣', '♦', '♥'] as Suit[],
    playerCount: 4 as const,
    cardsPerPlayer: 13 as const,
  },

  // ── Card Ordering ────────────────────────────────────────────────────────────
  // Higher index = stronger
  rankOrder: ['3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A', '2'] as Rank[],
  suitOrder: ['♠', '♣', '♦', '♥'] as Suit[],

  // ── Starting Rule ────────────────────────────────────────────────────────────
  startingCard: { rank: '3' as Rank, suit: '♠' as Suit },

  // ── Three Rules ─────────────────────────────────────────────────────────────
  threes: {
    // All 3-rank cards are discarded at the start before play begins
    discardAtStart: true,
    // The player holding 3♠ goes first
    starterHoldsThreeOfSpades: true,
  },

  // ── Two (2) Rules ────────────────────────────────────────────────────────────
  twos: {
    // 2 is the strongest single card
    strongestSingle: true,
    // 2 cannot appear in sequences or double sequences
    forbiddenInSequence: true,
    forbiddenInDoubleSequence: true,
    // Triple 2 is unbeatable — no bomb can cut it
    tripleIsUnbeatable: true,
  },

  // ── Hand Sizes ───────────────────────────────────────────────────────────────
  handSizes: {
    single: 1,
    pair: 2,
    triple: 3,
    quad: 4,
    straight: { min: 3 },        // 3+ cards
    flush_straight: { min: 3 },  // 3+ cards, same suit
    double_sequence: { min: 4 }, // min 2 consecutive pairs = 4 cards
  } as const,

  // ── Bomb (Cut) Rules ─────────────────────────────────────────────────────────
  bombs: {
    // Quad cuts a single 2 only
    quadCutsSingleTwo: true,
    // 4 consecutive pairs (double_sequence of length 4) cuts pair of 2 only
    fourPairsCutsPairTwo: true,
    // Triple 2 is immune to all bombs
    tripleUnbeatable: true,
  },

  // ── Straight Rules ───────────────────────────────────────────────────────────
  straights: {
    // 2 is not allowed in any straight
    twoForbidden: true,
    // Flush straight beats a normal straight of same length
    flushBeatsNormal: true,
  },

  // ── Trick Rules ──────────────────────────────────────────────────────────────
  trick: {
    // A player who skips is locked out until the next trick
    skipLocksUntilNextTrick: true,
    // Trick ends when all active (non-ranked) players except the last have skipped
    endsWhenAllButOneSkip: true,
  },

  // ── Win Condition ────────────────────────────────────────────────────────────
  win: {
    // Game does NOT stop at first winner — all players are ranked 1st to 4th
    continueUntilAllRanked: true,
  },

  // ── Valid bomb targets ────────────────────────────────────────────────────────
  // Maps: bomb hand type → the hand type it is allowed to cut
  bombTargets: {
    quad: 'single' as HandType,           // quad cuts single (only if single is a 2)
    double_sequence: 'pair' as HandType,  // 4-pair sequence cuts pair (only if pair is 2s)
  },
} as const;
