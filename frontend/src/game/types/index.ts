// ─── CARD ────────────────────────────────────────────────────────────────────

export type Suit = '♠' | '♣' | '♦' | '♥';
export type Rank = '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K' | 'A' | '2';

export interface Card {
  rank: Rank;
  suit: Suit;
  id: string; // e.g. "3♠"
}

// ─── HAND TYPES ──────────────────────────────────────────────────────────────

export type HandType =
  | 'single'
  | 'pair'
  | 'triple'
  | 'straight'
  | 'flush_straight'
  | 'double_sequence'
  | 'quad';

export interface Hand {
  type: HandType;
  cards: Card[];
}

// ─── PLAYER ──────────────────────────────────────────────────────────────────

export type PlayerId = 0 | 1 | 2 | 3;

export interface Player {
  id: PlayerId;
  name: string;
  hand: Card[];
  skipped: boolean;
  rank: number | null; // 1st, 2nd, 3rd, 4th — null = still playing
}

// ─── TRICK ───────────────────────────────────────────────────────────────────

export interface TrickPlay {
  playerId: PlayerId;
  hand: Hand;
}

export interface Trick {
  plays: TrickPlay[];
  currentHand: Hand | null; // The hand that must be beaten
  winnerId: PlayerId | null;
}

// ─── GAME STATE ──────────────────────────────────────────────────────────────

export type GamePhase = 'idle' | 'playing' | 'trick_end' | 'game_over';

export interface GameState {
  phase: GamePhase;
  players: Player[];
  currentTrick: Trick;
  currentPlayer: PlayerId;
  rankedOrder: PlayerId[]; // Players finished in order
  log: string[];
}

// ─── ENGINE RESULT ───────────────────────────────────────────────────────────

export interface EngineResult {
  state: GameState;
  error?: string;
}
