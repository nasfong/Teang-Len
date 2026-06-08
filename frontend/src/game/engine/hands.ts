import { rules } from '../rules/rules';
import { compareCards, rankIndex, suitIndex, isTwo, sortCards } from './cards';
import type { Card, Hand, Rank } from '../types';

// ─── CLASSIFIERS ─────────────────────────────────────────────────────────────

function isSingle(cards: Card[]): boolean {
  return cards.length === 1;
}

function isPair(cards: Card[]): boolean {
  return cards.length === 2 && cards[0].rank === cards[1].rank;
}

function isTriple(cards: Card[]): boolean {
  return cards.length === 3 && cards[0].rank === cards[1].rank && cards[1].rank === cards[2].rank;
}

function isQuad(cards: Card[]): boolean {
  return cards.length === 4 && cards.every(c => c.rank === cards[0].rank);
}

/**
 * Check whether sorted cards form consecutive ranks (no gaps).
 * 2 is forbidden in straights per rules.
 */
function hasConsecutiveRanks(sorted: Card[]): boolean {
  if (rules.straights.twoForbidden && sorted.some(isTwo)) return false;
  for (let i = 1; i < sorted.length; i++) {
    const prev = rankIndex(sorted[i - 1].rank);
    const curr = rankIndex(sorted[i].rank);
    if (curr - prev !== 1) return false;
  }
  return true;
}

function isStraight(cards: Card[]): boolean {
  if (cards.length < rules.handSizes.straight.min) return false;
  const sorted = sortCards(cards);
  return hasConsecutiveRanks(sorted);
}

function isFlushStraight(cards: Card[]): boolean {
  if (cards.length < rules.handSizes.flush_straight.min) return false;
  const sorted = sortCards(cards);
  const sameSuit = sorted.every(c => c.suit === sorted[0].suit);
  return sameSuit && hasConsecutiveRanks(sorted);
}

/**
 * Full house (Fulu): exactly 5 cards — one triple + one pair.
 * Comparison is triple-rank first, pair-rank second.
 */
function isFullHouse(cards: Card[]): boolean {
  if (!rules.features.allowFulu) return false;
  if (cards.length !== 5) return false;
  const counts = new Map<string, number>();
  for (const c of cards) counts.set(c.rank, (counts.get(c.rank) ?? 0) + 1);
  const groups = Array.from(counts.values()).sort((a, b) => a - b);
  return groups.length === 2 && groups[0] === 2 && groups[1] === 3;
}

/** Extract the triple/pair ranks from a confirmed full_house Hand */
function getFullHouseRanks(hand: Hand): { tripleRank: Rank; pairRank: Rank } {
  const counts = new Map<Rank, number>();
  for (const c of hand.cards) counts.set(c.rank, (counts.get(c.rank) ?? 0) + 1);
  let tripleRank = hand.cards[0].rank; // safe fallback — never reached on valid full_house
  let pairRank   = hand.cards[0].rank;
  for (const [rank, count] of counts) {
    if (count === 3) tripleRank = rank;
    else             pairRank   = rank;
  }
  return { tripleRank, pairRank };
}

/**
 * Double sequence: minimum 2 consecutive pairs.
 * Cards must come in pairs of matching rank, consecutive ranks.
 * 2 is forbidden.
 */
function isDoubleSequence(cards: Card[]): boolean {
  if (cards.length < rules.handSizes.double_sequence.min) return false;
  if (cards.length % 2 !== 0) return false;
  if (rules.twos.forbiddenInDoubleSequence && cards.some(isTwo)) return false;

  const sorted = sortCards(cards);

  // Group into pairs
  const pairs: Card[][] = [];
  for (let i = 0; i < sorted.length; i += 2) {
    const a = sorted[i];
    const b = sorted[i + 1];
    if (!b || a.rank !== b.rank) return false;
    pairs.push([a, b]);
  }

  // Pairs must be consecutive ranks
  for (let i = 1; i < pairs.length; i++) {
    const prevRank = rankIndex(pairs[i - 1][0].rank);
    const currRank = rankIndex(pairs[i][0].rank);
    if (currRank - prevRank !== 1) return false;
  }

  return true;
}

// ─── PUBLIC API ──────────────────────────────────────────────────────────────

/** Classify a set of cards into a Hand, or null if invalid */
export function classifyHand(cards: Card[]): Hand | null {
  if (cards.length === 0) return null;

  const sorted = sortCards(cards);

  if (isFlushStraight(sorted))  return { type: 'flush_straight',  cards: sorted };
  if (isQuad(sorted))           return { type: 'quad',            cards: sorted };
  if (isDoubleSequence(sorted)) return { type: 'double_sequence', cards: sorted };
  if (isFullHouse(sorted))      return { type: 'full_house',      cards: sorted };
  if (isStraight(sorted))       return { type: 'straight',        cards: sorted };
  if (isTriple(sorted)) return { type: 'triple', cards: sorted };
  if (isPair(sorted)) return { type: 'pair', cards: sorted };
  if (isSingle(sorted)) return { type: 'single', cards: sorted };

  return null;
}

// ─── COMPARISON ──────────────────────────────────────────────────────────────

/**
 * The "representative" card for comparison purposes is the highest card.
 * For pairs/triples/quads the rank is uniform; for sequences we use the top.
 */
function topCard(hand: Hand): Card {
  return hand.cards[hand.cards.length - 1]; // cards are sorted ascending
}

/**
 * Check if `challenger` is a valid bomb against `current`.
 * Bomb rules: quad cuts single-2, double_sequence(4-pair) cuts pair-2.
 */
function isBombPlay(challenger: Hand, current: Hand): boolean {
  // Square (quad) bomb: cuts single 2
  if (
    rules.features.allowSquareBomb &&
    challenger.type === 'quad' &&
    current.type === 'single' &&
    isTwo(topCard(current))
  ) return true;

  // Flush straight (exactly 5 cards, same suit) bomb: cuts single 2
  if (
    rules.features.allowFlushStraightBomb &&
    challenger.type === 'flush_straight' &&
    challenger.cards.length === 5 &&
    current.type === 'single' &&
    isTwo(topCard(current))
  ) return true;

  // 4 consecutive pairs vs pair of 2s
  if (
    rules.features.allowFourPairBomb &&
    challenger.type === 'double_sequence' &&
    challenger.cards.length >= 8 &&
    current.type === 'pair' &&
    current.cards.every(isTwo)
  ) return true;

  return false;
}

/** Returns true if triple-2 exists in current hand and is protected */
function isTripleTwo(hand: Hand): boolean {
  return (
    rules.twos.tripleIsUnbeatable &&
    hand.type === 'triple' &&
    hand.cards.every(isTwo)
  );
}

/**
 * Can `challenger` beat `current`?
 * Returns true if it's a valid, winning play.
 */
export function canBeat(challenger: Hand, current: Hand): boolean {
  // Triple 2 is unbeatable
  if (isTripleTwo(current)) return false;

  // Bomb override
  if (isBombPlay(challenger, current)) return true;

  // Normal play: types must match
  if (challenger.type !== current.type) return false;

  // Must have same card count (except bombs handled above)
  if (challenger.cards.length !== current.cards.length) return false;

  // flush_straight beats straight of same length
  if (
    rules.straights.flushBeatsNormal &&
    challenger.type === 'flush_straight' &&
    current.type === 'straight'
  ) {
    return true;
  }

  // Full house (Fulu): triple rank wins; pair rank breaks ties
  if (challenger.type === 'full_house' && current.type === 'full_house') {
    const ch = getFullHouseRanks(challenger);
    const cu = getFullHouseRanks(current);
    const tripleDiff = rankIndex(ch.tripleRank) - rankIndex(cu.tripleRank);
    if (tripleDiff !== 0) return tripleDiff > 0;
    return rankIndex(ch.pairRank) > rankIndex(cu.pairRank);
  }

  // Compare top cards
  return compareCards(topCard(challenger), topCard(current)) > 0;
}

/** Suit-break tie among cards with the same rank */
export function compareHandsByTopCard(a: Hand, b: Hand): number {
  return compareCards(
    a.cards[a.cards.length - 1],
    b.cards[b.cards.length - 1]
  );
}

/** Compute the suit index of the highest card of a hand (for display) */
export function handSuitStrength(hand: Hand): number {
  const top = topCard(hand);
  return suitIndex(top.suit);
}
