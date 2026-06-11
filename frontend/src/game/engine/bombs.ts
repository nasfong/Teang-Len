import { rules } from '../rules/rules';
import { sortCards, rankIndex } from './cards';
import type { Card, Rank } from '../types';

/** Returns the IDs of all cards that participate in at least one bomb combination in the hand. */
export function findBombCardIds(hand: Card[]): Set<string> {
  const ids = new Set<string>();
  const sorted = sortCards(hand);

  // ── 1. Quad (4-of-a-kind) ─────────────────────────────────────────────────
  if (rules.features.allowSquareBomb) {
    const byRank = new Map<Rank, Card[]>();
    for (const c of sorted) {
      const g = byRank.get(c.rank) ?? [];
      g.push(c);
      byRank.set(c.rank, g);
    }
    for (const cards of byRank.values()) {
      if (cards.length >= 4) cards.slice(0, 4).forEach(c => ids.add(c.id));
    }
  }

  // ── 2. Flush straight of exactly 5 (same suit, consecutive, no 2s) ────────
  if (rules.features.allowFlushStraightBomb) {
    const bySuit = new Map<string, Card[]>();
    for (const c of sorted) {
      if (c.rank === '2') continue;
      const g = bySuit.get(c.suit) ?? [];
      g.push(c);
      bySuit.set(c.suit, g);
    }
    for (const suitCards of bySuit.values()) {
      if (suitCards.length < 5) continue;
      for (let i = 0; i <= suitCards.length - 5; i++) {
        const window = suitCards.slice(i, i + 5);
        if (isConsecutive(window)) window.forEach(c => ids.add(c.id));
      }
    }
  }

  // ── 3. Four-pair sequence (≥4 consecutive pairs = ≥8 cards, no 2s) ────────
  if (rules.features.allowFourPairBomb) {
    const byRank2 = new Map<Rank, Card[]>();
    for (const c of sorted) {
      if (c.rank === '2') continue;
      const g = byRank2.get(c.rank) ?? [];
      g.push(c);
      byRank2.set(c.rank, g);
    }
    const pairGroups = [...byRank2.entries()]
      .filter(([, cards]) => cards.length >= 2)
      .sort((a, b) => rankIndex(a[0]) - rankIndex(b[0]));

    let run: typeof pairGroups = [];
    for (const entry of pairGroups) {
      if (run.length === 0) {
        run = [entry];
      } else {
        const gap = rankIndex(entry[0]) - rankIndex(run[run.length - 1][0]);
        if (gap === 1) {
          run.push(entry);
        } else {
          if (run.length >= 4) markPairs(run, ids);
          run = [entry];
        }
      }
    }
    if (run.length >= 4) markPairs(run, ids);
  }

  return ids;
}

function isConsecutive(cards: Card[]): boolean {
  for (let i = 1; i < cards.length; i++) {
    if (rankIndex(cards[i].rank) - rankIndex(cards[i - 1].rank) !== 1) return false;
  }
  return true;
}

function markPairs(groups: [Rank, Card[]][], ids: Set<string>): void {
  for (const [, cards] of groups) {
    cards.slice(0, 2).forEach(c => ids.add(c.id));
  }
}
