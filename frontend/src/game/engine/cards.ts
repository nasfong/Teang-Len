import { rules } from '../rules/rules';
import type { Card, Rank, Suit } from '../types';

export function rankIndex(rank: Rank): number {
  return rules.rankOrder.indexOf(rank);
}

export function suitIndex(suit: Suit): number {
  return rules.suitOrder.indexOf(suit);
}

/** Compare two cards. Returns negative if a < b, 0 if equal, positive if a > b */
export function compareCards(a: Card, b: Card): number {
  const rankDiff = rankIndex(a.rank) - rankIndex(b.rank);
  if (rankDiff !== 0) return rankDiff;
  return suitIndex(a.suit) - suitIndex(b.suit);
}

export function isTwo(card: Card): boolean {
  return card.rank === '2';
}

export function isThree(card: Card): boolean {
  return card.rank === '3';
}

export function makeCard(rank: Rank, suit: Suit): Card {
  return { rank, suit, id: `${rank}${suit}` };
}

export function makeDeck(): Card[] {
  const deck: Card[] = [];
  for (const rank of rules.deck.ranks) {
    for (const suit of rules.deck.suits) {
      deck.push(makeCard(rank, suit));
    }
  }
  return deck;
}

export function shuffleDeck(deck: Card[]): Card[] {
  const d = [...deck];
  for (let i = d.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [d[i], d[j]] = [d[j], d[i]];
  }
  return d;
}

/** Sort cards in ascending order (weakest to strongest) */
export function sortCards(cards: Card[]): Card[] {
  return [...cards].sort(compareCards);
}

/** The highest card in an array */
export function highCard(cards: Card[]): Card {
  return [...cards].sort(compareCards)[cards.length - 1];
}
