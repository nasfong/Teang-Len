import { useEffect, useRef, useState } from 'react';
import type { GameState } from '../../../game/types';
import { findBombCardIds } from '../../../game/engine/bombs';

export type DealPhase = 'idle' | 'dealing' | 'playing' | 'reconnected';

export interface DealAnimationResult {
  dealPhase:    DealPhase;
  revealedCount: number;     // 0 → hand.length, increments during 'dealing'
  dealOrder:    number[];    // shuffled card indices (random reveal sequence)
  bombCardIds:  Set<string>;
  isLocked:     boolean;
  showBanner:   boolean;
}

const REVEAL_INTERVAL_MS = 80;  // ms per card — 13 cards ≈ 1.04 s
const BANNER_MS          = 950; // "GAME START" overlay duration
const DEAL_FP_KEY        = 'tl_deal_fp'; // sessionStorage key

function shuffleIndices(n: number): number[] {
  const a = Array.from({ length: n }, (_, i) => i);
  for (let i = n - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function useDealAnimation(
  game: GameState | null,
  localSeatIndex: number | null,
): DealAnimationResult {
  const [dealPhase,    setDealPhase]    = useState<DealPhase>('idle');
  const [revealedCount, setRevealedCount] = useState(0);
  const [dealOrder,    setDealOrder]    = useState<number[]>([]);
  const [bombCardIds,  setBombCardIds]  = useState<Set<string>>(new Set());
  const [showBanner,   setShowBanner]   = useState(false);

  const prevWasNull  = useRef(true);
  const intervalRef  = useRef<ReturnType<typeof setInterval> | null>(null);
  const bannerRef    = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Clean up on unmount only — does not fire on dep changes
  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (bannerRef.current)   clearTimeout(bannerRef.current);
    };
  }, []);

  useEffect(() => {
    const wasNull = prevWasNull.current;
    prevWasNull.current = game === null;

    // ── Game ended / reset ────────────────────────────────────────────────────
    if (game === null) {
      if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
      if (bannerRef.current)   { clearTimeout(bannerRef.current);    bannerRef.current   = null; }
      setDealPhase('idle');
      setRevealedCount(0);
      setDealOrder([]);
      setBombCardIds(new Set());
      setShowBanner(false);
      return;
    }

    // ── Opponent move / normal state update — let interval run ───────────────
    if (!wasNull) return;

    // ── null → non-null (game start or page refresh) ──────────────────────────
    if (localSeatIndex === null) return;

    const hand = game.players[localSeatIndex]?.hand ?? [];
    if (hand.length === 0) return;

    // Fingerprint = sorted card IDs joined. Same deal ↔ same string.
    const fingerprint = hand.map(c => c.id).join(',');
    const stored      = sessionStorage.getItem(DEAL_FP_KEY);

    if (stored === fingerprint) {
      // Page refresh / reconnect — show cards immediately, no animation
      const n = hand.length;
      setDealPhase('reconnected');
      setRevealedCount(n);
      setDealOrder(Array.from({ length: n }, (_, i) => i));
      setBombCardIds(findBombCardIds(hand));
      return;
    }

    // New game — play the reveal sequence
    sessionStorage.setItem(DEAL_FP_KEY, fingerprint);

    const order = shuffleIndices(hand.length);
    setDealOrder(order);
    setRevealedCount(0);
    setDealPhase('dealing');
    setShowBanner(true);
    setBombCardIds(new Set());

    // Clear any stale timers from a prior game
    if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
    if (bannerRef.current)   { clearTimeout(bannerRef.current);    bannerRef.current   = null; }

    const totalCards = hand.length;
    let count        = 0;

    // Interval is stored in a ref so it survives re-renders caused by opponent
    // moves (which change `game` without triggering the null→non-null branch).
    intervalRef.current = setInterval(() => {
      count++;
      setRevealedCount(count);

      if (count >= totalCards) {
        clearInterval(intervalRef.current!);
        intervalRef.current = null;
        setDealPhase('playing');
        setBombCardIds(findBombCardIds(hand));
      }
    }, REVEAL_INTERVAL_MS);

    bannerRef.current = setTimeout(() => {
      setShowBanner(false);
      bannerRef.current = null;
    }, BANNER_MS);

    // No cleanup returned — the interval must survive subsequent game updates.
    // Cleanup is handled by the unmount effect above and by the game===null branch.
  }, [game, localSeatIndex]);

  return {
    dealPhase,
    revealedCount,
    dealOrder,
    bombCardIds,
    isLocked: dealPhase === 'dealing',
    showBanner,
  };
}
