import type { Rank, Suit } from '../types';

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

  // ── Feature Flags ────────────────────────────────────────────────────────────
  // All values typed as boolean (not literal) so they can be toggled in tests at runtime.
  // This is the single source of truth for optional/house-rule behaviour.
  features: {
    // Fulu (Full House): triple + pair of exactly 5 cards.
    // Beats only another Fulu; triple rank is primary, pair rank secondary.
    allowFulu: true as boolean,

    // Square bomb: quad (4-of-a-kind) cuts a single 2.
    allowSquareBomb: true as boolean,

    // Flush straight bomb: exactly 5 same-suit consecutive cards cuts a single 2.
    allowFlushStraightBomb: true as boolean,

    // Four-pair bomb: 4 consecutive pairs (8 cards) cuts a pair of 2s.
    allowFourPairBomb: true as boolean,

    // Game log: when false, no log entries are appended and the log UI is hidden.
    // Set to true to re-enable without any other code changes.
    enableGameLog: false as boolean,
  },

} as const;

// ─── FEATURE HELPERS ─────────────────────────────────────────────────────────

export function isGameLogEnabled(): boolean {
  return rules.features.enableGameLog;
}
