import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { classifyHand, canBeat } from './hands';
import { makeCard } from './cards';
import { rules } from '../rules/rules';
import type { Card } from '../types';

// ── Helpers ───────────────────────────────────────────────────────────────────

function cards(...specs: string[]): Card[] {
  return specs.map(s => {
    const suit = s.slice(-1) as Card['suit'];
    const rank = s.slice(0, -1) as Card['rank'];
    return makeCard(rank, suit);
  });
}

// ── Full House detection ──────────────────────────────────────────────────────

describe('classifyHand — full_house', () => {
  it('detects 333♠44♣♦ (triple 3, pair 4)', () => {
    const hand = classifyHand(cards('3♠', '3♣', '3♦', '4♣', '4♦'));
    expect(hand?.type).toBe('full_house');
  });

  it('detects 555♠66♣♦ (triple 5, pair 6)', () => {
    const hand = classifyHand(cards('5♠', '5♣', '5♦', '6♣', '6♦'));
    expect(hand?.type).toBe('full_house');
  });

  it('detects 666♠77♣♦ (triple 6, pair 7)', () => {
    const hand = classifyHand(cards('6♠', '6♣', '6♦', '7♣', '7♦'));
    expect(hand?.type).toBe('full_house');
  });

  it('detects 888♠AA♣♦ (triple 8, pair A)', () => {
    const hand = classifyHand(cards('8♠', '8♣', '8♦', 'A♣', 'A♦'));
    expect(hand?.type).toBe('full_house');
  });

  it('rejects 333♠45♣♦ (triple + two different ranks)', () => {
    const hand = classifyHand(cards('3♠', '3♣', '3♦', '4♣', '5♦'));
    expect(hand?.type).not.toBe('full_house');
  });

  it('rejects 333♠444♣ (two triples — 6 cards)', () => {
    const hand = classifyHand(cards('3♠', '3♣', '3♦', '4♠', '4♣', '4♦'));
    expect(hand?.type).not.toBe('full_house');
  });

  it('rejects 3334♣♦ (four 3s + a 4 — quad + single)', () => {
    const hand = classifyHand(cards('3♠', '3♣', '3♦', '3♥', '4♣'));
    expect(hand?.type).not.toBe('full_house');
  });
});

// ── Full House comparison ─────────────────────────────────────────────────────

describe('canBeat — full_house', () => {
  it('77766 beats 666AA (higher triple wins)', () => {
    const high = classifyHand(cards('7♠', '7♣', '7♦', '6♠', '6♣'))!;
    const low  = classifyHand(cards('6♦', '6♥', '6♣', 'A♠', 'A♣'))!;
    expect(high.type).toBe('full_house');
    expect(low.type).toBe('full_house');
    expect(canBeat(high, low)).toBe(true);
    expect(canBeat(low, high)).toBe(false);
  });

  it('77755 beats 77744 (same triple, higher pair wins)', () => {
    const high = classifyHand(cards('7♠', '7♣', '7♦', '5♠', '5♣'))!;
    const low  = classifyHand(cards('7♥', '7♦', '7♣', '4♠', '4♣'))!;
    expect(canBeat(high, low)).toBe(true);
    expect(canBeat(low, high)).toBe(false);
  });

  it('88833 beats 777KK (higher triple wins regardless of pair)', () => {
    const high = classifyHand(cards('8♠', '8♣', '8♦', '3♣', '3♦'))!;
    const low  = classifyHand(cards('7♠', '7♣', '7♦', 'K♠', 'K♣'))!;
    expect(canBeat(high, low)).toBe(true);
  });

  it('equal full houses cannot beat each other', () => {
    const a = classifyHand(cards('7♠', '7♣', '7♦', '5♠', '5♣'))!;
    const b = classifyHand(cards('7♥', '7♦', '7♣', '5♦', '5♥'))!;
    expect(canBeat(a, b)).toBe(false);
    expect(canBeat(b, a)).toBe(false);
  });

  it('full_house cannot beat a triple', () => {
    const fh     = classifyHand(cards('7♠', '7♣', '7♦', '5♠', '5♣'))!;
    const triple = classifyHand(cards('5♠', '5♣', '5♦'))!;
    expect(canBeat(fh, triple)).toBe(false);
  });

  it('a triple cannot beat a full_house', () => {
    const fh     = classifyHand(cards('7♠', '7♣', '7♦', '5♠', '5♣'))!;
    const triple = classifyHand(cards('8♠', '8♣', '8♦'))!;
    expect(canBeat(triple, fh)).toBe(false);
  });
});

// ── allowFulu = false ─────────────────────────────────────────────────────────

describe('classifyHand — allowFulu disabled', () => {
  beforeEach(() => { (rules.features as { allowFulu: boolean }).allowFulu = false; });
  afterEach(()  => { (rules.features as { allowFulu: boolean }).allowFulu = true;  });

  it('33344 is not classified as full_house when Fulu is disabled', () => {
    const hand = classifyHand(cards('3♠', '3♣', '3♦', '4♣', '4♦'));
    expect(hand?.type).not.toBe('full_house');
  });

  it('55566 is not classified as full_house when Fulu is disabled', () => {
    const hand = classifyHand(cards('5♠', '5♣', '5♦', '6♣', '6♦'));
    expect(hand?.type).not.toBe('full_house');
  });

  it('33344 returns null (no other 5-card type matches)', () => {
    // triple 3 + pair 4 is not a straight, flush, double_sequence, or quad
    const hand = classifyHand(cards('3♠', '3♣', '3♦', '4♣', '4♦'));
    expect(hand).toBeNull();
  });
});
