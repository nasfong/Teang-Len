import { classifyHand, canBeat } from './hands';
import type { Card, Hand } from '../types';

export interface PlayValidation {
  canPlay: boolean;
  reason: string;
}

export function validatePlay(cards: Card[], currentHand: Hand | null): PlayValidation {
  if (cards.length === 0) {
    return { canPlay: false, reason: 'Select cards to play' };
  }

  const hand = classifyHand(cards);
  if (!hand) {
    return { canPlay: false, reason: 'Invalid combination' };
  }

  if (currentHand === null) {
    return { canPlay: true, reason: '' };
  }

  if (canBeat(hand, currentHand)) {
    return { canPlay: true, reason: '' };
  }

  // Triple 2 is unbeatable — no play can beat it
  if (currentHand.type === 'triple' && currentHand.cards.every(c => c.rank === '2')) {
    return { canPlay: false, reason: 'Cannot beat triple 2' };
  }

  // Type mismatch (and not a bomb that would have passed canBeat)
  if (hand.type !== currentHand.type) {
    return { canPlay: false, reason: 'Must play the same combination type' };
  }

  // Same type but wrong card count
  if (hand.cards.length !== currentHand.cards.length) {
    return { canPlay: false, reason: 'Must match the number of cards played' };
  }

  return { canPlay: false, reason: 'Selected cards are too low' };
}
