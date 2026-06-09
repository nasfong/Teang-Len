import { create } from 'zustand';
import { dealGame, playCards, skipTurn } from '../game/engine/engine';
import type { GameState } from '../game/types';
import { socketService } from '../services/socket';
import { useLobbyStore } from './lobbyStore';

// ─── STORE INTERFACE ─────────────────────────────────────────────────────────

interface GameStore {
  game: GameState | null;
  error: string | null;
  selectedCardIds: string[];

  // Actions
  startGame: () => void;
  selectCard: (cardId: string) => void;
  playSelectedCards: () => void;
  skipCurrentTurn: () => void;
  clearError: () => void;
  resetGame: () => void;
  /** Apply a GameState received from the server (game:update event). */
  syncFromServer: (gameState: GameState) => void;
}

// ─── STORE ───────────────────────────────────────────────────────────────────

export const useGameStore = create<GameStore>((set, get) => ({
  game: null,
  error: null,
  selectedCardIds: [],

  startGame() {
    const { roomId, playerId, room } = useLobbyStore.getState();
    if (!room) return;

    // Only deal to players who are actually seated — never generate ghost players.
    const sortedSeats = [...room.players]
      .filter(rp => rp.seatIndex !== null)
      .sort((a, b) => (a.seatIndex as number) - (b.seatIndex as number));

    const numPlayers = sortedSeats.length;
    const names      = sortedSeats.map(rp => rp.name);

    const game = dealGame(numPlayers, names);

    set({ game, error: null, selectedCardIds: [] });

    if (roomId && playerId) {
      socketService.emitGameStart({ roomId, playerId, initialGameState: game });
    }
  },

  selectCard(cardId: string) {
    const { selectedCardIds } = get();
    if (selectedCardIds.includes(cardId)) {
      set({ selectedCardIds: selectedCardIds.filter(id => id !== cardId) });
    } else {
      set({ selectedCardIds: [...selectedCardIds, cardId] });
    }
  },

  playSelectedCards() {
    const { game, selectedCardIds } = get();
    if (!game) return;

    const result = playCards(game, selectedCardIds);

    if (result.error) {
      set({ error: result.error });
      return;
    }

    set({ game: result.state, error: null, selectedCardIds: [] });

    // game:play — { roomId, playerId, gameState, playerFinished?, finishedRank?, gameOver?, rankings? }
    // rankings must be { playerId: UUID, rank: number }[] — uses seatToPlayerId to map seat → UUID.
    const { roomId, playerId, seatToPlayerId } = useLobbyStore.getState();
    if (!roomId || !playerId) return;

    const prevState = game;
    const nextState = result.state;
    const movedSeat = prevState.currentPlayer;

    const justFinished =
      prevState.players[movedSeat].rank === null &&
      nextState.players[movedSeat].rank !== null;

    const payload: Parameters<typeof socketService.emitGamePlay>[0] = {
      roomId,
      playerId,
      gameState: nextState,
    };

    if (justFinished) {
      payload.playerFinished = true;
      payload.finishedRank = nextState.players[movedSeat].rank ?? undefined;
    }

    if (nextState.phase === 'game_over') {
      payload.gameOver = true;
      // rankedOrder is PlayerId[] (seat indices); map to { playerId: UUID, rank: number }[]
      payload.rankings = nextState.rankedOrder.map((seatId, idx) => ({
        playerId: seatToPlayerId[seatId] ?? String(seatId),
        rank: idx + 1,
      }));
    }

    socketService.emitGamePlay(payload);
  },

  skipCurrentTurn() {
    const { game } = get();
    if (!game) return;

    const result = skipTurn(game);

    if (result.error) {
      set({ error: result.error });
      return;
    }

    set({ game: result.state, error: null });

    // game:skip — { roomId, playerId, gameState }
    const { roomId, playerId } = useLobbyStore.getState();
    if (roomId && playerId) {
      socketService.emitGameSkip({ roomId, playerId, gameState: result.state });
    }
  },

  clearError() {
    set({ error: null });
  },

  resetGame() {
    set({ game: null, error: null, selectedCardIds: [] });
    // Clear room so "Play Again" routes to room list, not a finished room's waiting view.
    useLobbyStore.getState().clearRoom();
  },

  syncFromServer(gameState: GameState) {
    set({ game: gameState, error: null, selectedCardIds: [] });
  },
}));

// ─── SELECTORS ───────────────────────────────────────────────────────────────

export const selectCurrentPlayer = (state: GameStore) =>
  state.game ? state.game.players[state.game.currentPlayer] : null;

export const selectActivePlayers = (state: GameStore) =>
  state.game?.players.filter(p => p.rank === null) ?? [];
