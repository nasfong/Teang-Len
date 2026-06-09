import { rules, isGameLogEnabled } from '../rules/rules';
import { makeDeck, shuffleDeck, sortCards, isThree, isTwo } from './cards';
import { classifyHand, canBeat } from './hands';
import type { Card, GameState, Hand, PlayerId, Player, Trick, EngineResult } from '../types';

// ─── HELPERS ─────────────────────────────────────────────────────────────────

function makePlayer(id: PlayerId, name: string, hand: Card[]): Player {
  return { id, name, hand: sortCards(hand), skipped: false, rank: null };
}

function log(state: GameState, message: string): GameState {
  if (!isGameLogEnabled()) return state;
  return { ...state, log: [...state.log, message] };
}

function playerName(state: GameState, id: PlayerId): string {
  return state.players[id].name;
}

/** Returns the next PlayerId in clockwise order who is still playing */
function nextActivePlayer(state: GameState, from: PlayerId): PlayerId {
  const n = state.players.length;
  let id = ((from + 1) % n) as PlayerId;
  for (let i = 0; i < n; i++) {
    const p = state.players[id];
    if (p.rank === null) return id;
    id = ((id + 1) % n) as PlayerId;
  }
  return from; // fallback (shouldn't happen if game isn't over)
}

/** Count players who are still in the game (not yet ranked) — reserved for future use */
// function activePlayers(state: GameState): Player[] {
//   return state.players.filter(p => p.rank === null);
// }

/** Count players in current trick who haven't skipped and are still active */
function notSkippedActivePlayers(state: GameState): Player[] {
  return state.players.filter(p => p.rank === null && !p.skipped);
}

function removeCardsFromHand(hand: Card[], played: Card[]): Card[] {
  const ids = new Set(played.map(c => c.id));
  return hand.filter(c => !ids.has(c.id));
}

// ─── DEAL ────────────────────────────────────────────────────────────────────

// ─── DEAL (CORRECTED — tracks 3♠ before stripping) ──────────────────────────

const FALLBACK_NAMES = ['Player 1', 'Player 2', 'Player 3', 'Player 4'];

export function dealGame(numPlayers: number = 4, playerNames?: string[]): GameState {
  const deck = shuffleDeck(makeDeck());
  const n = rules.deck.cardsPerPlayer;
  const names = playerNames ?? FALLBACK_NAMES;

  // Deal only to the active seats; remaining cards are unplayed
  const rawHands: Card[][] = Array.from({ length: numPlayers }, (_, i) =>
    deck.slice(i * n, (i + 1) * n),
  );

  // Find who had 3♠ among dealt players; default to seat 0 if undealt
  let starterId = 0 as PlayerId;
  if (rules.threes.starterHoldsThreeOfSpades) {
    for (let i = 0; i < numPlayers; i++) {
      if (rawHands[i].some(c => c.rank === '3' && c.suit === '♠')) {
        starterId = i as PlayerId;
        break;
      }
    }
  }

  const logLines: string[] = [];
  if (isGameLogEnabled()) {
    logLines.push('Cards dealt.');
  }

  const players: Player[] = rawHands.map((hand, i) => {
    const threes = hand.filter(isThree);
    const stripped = hand.filter(c => !isThree(c));
    if (isGameLogEnabled() && threes.length > 0) {
      logLines.push(`${names[i] ?? FALLBACK_NAMES[i]} discards 3s: ${threes.map(c => c.id).join(' ')}`);
    }
    return makePlayer(i as PlayerId, names[i] ?? FALLBACK_NAMES[i], stripped);
  });

  if (isGameLogEnabled()) {
    logLines.push(`${players[starterId].name} starts (held 3♠).`);
  }

  return {
    phase: 'playing',
    players,
    currentTrick: { plays: [], currentHand: null, winnerId: null },
    currentPlayer: starterId,
    rankedOrder: [],
    log: logLines,
  };
}

// ─── PLAY ACTION ─────────────────────────────────────────────────────────────

export function playCards(state: GameState, cardIds: string[]): EngineResult {
  if (state.phase !== 'playing') {
    return { state, error: 'Game is not in playing phase.' };
  }

  const player = state.players[state.currentPlayer];

  // Validate cards belong to player
  const played: Card[] = [];
  for (const id of cardIds) {
    const card = player.hand.find(c => c.id === id);
    if (!card) return { state, error: `Card ${id} not in hand.` };
    played.push(card);
  }

  // Classify the hand
  const hand = classifyHand(played);
  if (!hand) return { state, error: 'Invalid hand combination.' };

  // Must beat current trick hand if one exists
  if (state.currentTrick.currentHand !== null) {
    if (!canBeat(hand, state.currentTrick.currentHand)) {
      return { state, error: 'This hand does not beat the current play.' };
    }
  }

  // Remove played cards from player's hand
  const updatedHand = removeCardsFromHand(player.hand, played);

  // Build updated players
  let updatedPlayers = state.players.map(p =>
    p.id === player.id ? { ...p, hand: updatedHand, skipped: false } : p
  );

  const newPlay = { playerId: player.id, hand };
  const newTrick: Trick = {
    plays: [...state.currentTrick.plays, newPlay],
    currentHand: hand,
    winnerId: player.id,
  };

  let newState: GameState = {
    ...state,
    players: updatedPlayers,
    currentTrick: newTrick,
  };

  newState = log(newState, `${player.name} plays: ${played.map(c => c.id).join(' ')} [${hand.type}]`);

  // Check if player finished their hand
  if (updatedHand.length === 0) {
    newState = rankPlayer(newState, player.id);
  }

  // Auto-rank the last remaining player — they don't need to play out their cards
  const unranked = newState.players.filter(p => p.rank === null);
  if (unranked.length === 1) {
    newState = rankPlayer(newState, unranked[0].id);
    newState = log(newState, `${unranked[0].name} is the last remaining player and is automatically assigned final place.`);
  }

  // Check game over
  if (newState.rankedOrder.length === newState.players.length) {
    return { state: { ...newState, phase: 'game_over' } };
  }

  // Advance turn
  newState = advanceTurn(newState);

  return { state: newState };
}

// ─── SKIP ACTION ─────────────────────────────────────────────────────────────

export function skipTurn(state: GameState): EngineResult {
  if (state.phase !== 'playing') {
    return { state, error: 'Game is not in playing phase.' };
  }

  const player = state.players[state.currentPlayer];

  // Cannot skip if you're the trick opener (no current hand)
  if (state.currentTrick.currentHand === null) {
    return { state, error: 'Cannot skip — you must open the trick.' };
  }

  const updatedPlayers = state.players.map(p =>
    p.id === player.id ? { ...p, skipped: true } : p
  );

  let newState: GameState = {
    ...state,
    players: updatedPlayers,
  };

  newState = log(newState, `${player.name} skips.`);

  // Check if trick ends (all but one active player have skipped)
  const stillPlaying = notSkippedActivePlayers(newState);

  if (stillPlaying.length <= 1) {
    newState = resolveTrick(newState);
  } else {
    newState = advanceTurn(newState);
  }

  return { state: newState };
}

// ─── TRICK RESOLUTION ────────────────────────────────────────────────────────

function resolveTrick(state: GameState): GameState {
  const winnerId = state.currentTrick.winnerId;
  if (winnerId === null) return state;

  let newState = log(state, `${playerName(state, winnerId)} wins the trick.`);

  // Reset skips for active players
  const updatedPlayers = newState.players.map(p =>
    p.rank === null ? { ...p, skipped: false } : p
  );

  newState = {
    ...newState,
    players: updatedPlayers,
    currentTrick: { plays: [], currentHand: null, winnerId: null },
    currentPlayer: winnerId,
    phase: 'playing',
  };

  // If winner is ranked (finished), pass to next active
  if (newState.players[winnerId].rank !== null) {
    newState = { ...newState, currentPlayer: nextActivePlayer(newState, winnerId) };
  }

  return newState;
}

// ─── TURN ADVANCEMENT ────────────────────────────────────────────────────────

function advanceTurn(state: GameState): GameState {
  let next = nextActivePlayer(state, state.currentPlayer);

  // Skip over players who have already skipped this trick
  let loops = 0;
  while (state.players[next].skipped && loops < state.players.length) {
    next = nextActivePlayer(state, next);
    loops++;
  }

  return { ...state, currentPlayer: next };
}

// ─── RANKING ─────────────────────────────────────────────────────────────────

function rankPlayer(state: GameState, playerId: PlayerId): GameState {
  const position = state.rankedOrder.length + 1;
  const updatedPlayers = state.players.map(p =>
    p.id === playerId ? { ...p, rank: position } : p
  );
  const newState = {
    ...state,
    players: updatedPlayers,
    rankedOrder: [...state.rankedOrder, playerId],
  };
  return log(newState, `${playerName(state, playerId)} finishes in position #${position}!`);
}

// ─── AI TURN ─────────────────────────────────────────────────────────────────

/**
 * Simple AI: tries to play the lowest valid hand matching the current type.
 * Falls back to skip.
 */
export function aiPlayTurn(state: GameState): EngineResult {
  const player = state.players[state.currentPlayer];
  const currentHand = state.currentTrick.currentHand;

  if (currentHand === null) {
    // Must open — play lowest single card
    const lowest = player.hand[0];
    return playCards(state, [lowest.id]);
  }

  // Try to find a winning hand of the same type
  const validPlay = findBestPlay(player.hand, currentHand);
  if (validPlay) {
    return playCards(state, validPlay.map(c => c.id));
  }

  // Nothing can beat — skip
  return skipTurn(state);
}

/** Find the lowest-ranked valid hand of the matching type that beats `current` */
function findBestPlay(hand: Card[], current: Hand): Card[] | null {
  const { type, cards } = current;
  const n = cards.length;

  // Brute-force subsets of size n
  const subsets = getSubsets(hand, n);

  for (const subset of subsets) {
    const classified = classifyHand(subset);
    if (classified && canBeat(classified, current)) {
      return subset;
    }
  }

  // Try bombs: quad vs single-2, double_sequence vs pair-2
  if (type === 'single' && isTwo(cards[0])) {
    const quads = getSubsets(hand, 4).filter(s => {
      const h = classifyHand(s);
      return h?.type === 'quad';
    });
    if (quads.length > 0) return quads[0];
  }

  return null;
}

/** Generate all combinations of `size` cards from `hand` */
function getSubsets(hand: Card[], size: number): Card[][] {
  if (size > hand.length) return [];
  if (size === hand.length) return [hand];

  const result: Card[][] = [];

  function combine(start: number, current: Card[]) {
    if (current.length === size) {
      result.push([...current]);
      return;
    }
    for (let i = start; i < hand.length; i++) {
      current.push(hand[i]);
      combine(i + 1, current);
      current.pop();
    }
  }

  combine(0, []);
  return result;
}

// ─── GAME-OVER CHECK ─────────────────────────────────────────────────────────

export function isGameOver(state: GameState): boolean {
  return state.rankedOrder.length >= state.players.length;
}
