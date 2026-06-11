import { io, Socket } from 'socket.io-client';
import type { GameState } from '../game/types';

const SOCKET_URL = (import.meta.env.VITE_SOCKET_URL as string | undefined) ?? 'http://localhost:4000';

// ─── Event name constants (mirror of backend src/types/events.ts) ─────────────
// Must stay in sync with backend CLIENT_EVENTS / SERVER_EVENTS.

export const CLIENT_EVENTS = {
  ROOM_JOIN:               'room:join',
  ROOM_LEAVE:              'room:leave',
  ROOM_QUEUE_LEAVE:        'room:queue-leave',
  ROOM_CANCEL_QUEUE_LEAVE: 'room:cancel-queue-leave',
  PLAYER_READY:            'player:ready',
  GAME_START:              'game:start',
  GAME_PLAY:               'game:play',
  GAME_SKIP:               'game:skip',
} as const;

export const SERVER_EVENTS = {
  ROOM_UPDATE:         'room:update',
  ROOM_LIST_UPDATE:    'room:list:update',    // broadcast when any room changes
  GAME_UPDATE:         'game:update',
  TURN_UPDATE:         'turn:update',
  TURN_TIMEOUT:        'turn:timeout',
  PLAYER_FINISHED:     'player:finished',
  PLAYER_JOINED:       'player:joined',
  PLAYER_LEFT:         'player:left',
  GAME_END:            'game:end',
  PLAYER_DISCONNECTED: 'player:disconnected',
  ERROR:               'error',
} as const;

// ─── Payload types — match backend Zod schemas exactly ───────────────────────

/** SocketRoomJoinSchema: { roomId: string, playerId: UUID } */
export interface RoomJoinPayload {
  roomId: string;
  playerId: string;
}

/** SocketRoomLeaveSchema: { roomId: string, playerId: UUID } */
export interface RoomLeavePayload {
  roomId: string;
  playerId: string;
}

/** SocketPlayerReadySchema: { roomId: string, playerId: UUID } */
export interface PlayerReadyPayload {
  roomId: string;
  playerId: string;
}

/** SocketGameStartSchema: { roomId: string, playerId: UUID, initialGameState: unknown, secondsPerTurn?: number } */
export interface GameStartPayload {
  roomId: string;
  playerId: string;
  initialGameState: GameState;
  secondsPerTurn?: number;
}

/**
 * SocketGamePlaySchema base: { roomId, playerId, gameState }
 * Extended optional signals (GamePlayPayloadExtended):
 *   playerFinished, finishedRank, gameOver, rankings, currentPlayerId
 */
export interface GamePlayPayload {
  roomId: string;
  playerId: string;
  gameState: GameState;
  // Optional signals — backend reads these to broadcast secondary events
  playerFinished?: boolean;
  finishedRank?: number;
  gameOver?: boolean;
  rankings?: { playerId: string; rank: number }[];
  currentPlayerId?: string;
}

/** SocketGameSkipSchema: { roomId, playerId, gameState } */
export interface GameSkipPayload {
  roomId: string;
  playerId: string;
  gameState: GameState;
}

/** SocketRoomQueueLeaveSchema: { roomId, playerId } */
export interface RoomQueueLeavePayload {
  roomId: string;
  playerId: string;
}

/** SocketRoomCancelQueueLeaveSchema: { roomId, playerId } */
export interface RoomCancelQueueLeavePayload {
  roomId: string;
  playerId: string;
}

// ─── Singleton socket service ─────────────────────────────────────────────────

class SocketService {
  readonly socket: Socket;

  constructor() {
    this.socket = io(SOCKET_URL, { autoConnect: true });
  }

  // ── Client → Server emits ────────────────────────────────────────────────

  emitRoomJoin(payload: RoomJoinPayload): void {
    this.socket.emit(CLIENT_EVENTS.ROOM_JOIN, payload);
  }

  emitRoomLeave(payload: RoomLeavePayload): void {
    this.socket.emit(CLIENT_EVENTS.ROOM_LEAVE, payload);
  }

  emitPlayerReady(payload: PlayerReadyPayload): void {
    this.socket.emit(CLIENT_EVENTS.PLAYER_READY, payload);
  }

  /**
   * game:start — host only.
   * initialGameState is the output of dealGame() from the frontend engine.
   * Backend stores it opaquely and broadcasts it to all room members.
   */
  emitGameStart(payload: GameStartPayload): void {
    this.socket.emit(CLIENT_EVENTS.GAME_START, payload);
  }

  /**
   * game:play — current player only.
   * gameState is the full updated GameState after playCards().
   * Include playerFinished + finishedRank when the player just emptied their hand.
   * Include gameOver + rankings when phase === 'game_over'.
   * rankings must be { playerId: UUID, rank: number }[] — not seat indices.
   */
  emitGamePlay(payload: GamePlayPayload): void {
    this.socket.emit(CLIENT_EVENTS.GAME_PLAY, payload);
  }

  /**
   * game:skip — current player only.
   * gameState is the full updated GameState after skipTurn().
   */
  emitGameSkip(payload: GameSkipPayload): void {
    this.socket.emit(CLIENT_EVENTS.GAME_SKIP, payload);
  }

  /** Queue to leave the room after the current match ends. */
  emitRoomQueueLeave(payload: RoomQueueLeavePayload): void {
    this.socket.emit(CLIENT_EVENTS.ROOM_QUEUE_LEAVE, payload);
  }

  /** Cancel a previously queued room departure. */
  emitRoomCancelQueueLeave(payload: RoomCancelQueueLeavePayload): void {
    this.socket.emit(CLIENT_EVENTS.ROOM_CANCEL_QUEUE_LEAVE, payload);
  }
}

export const socketService = new SocketService();
