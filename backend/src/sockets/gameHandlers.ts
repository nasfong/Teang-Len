import { Server, Socket } from "socket.io";
import { CLIENT_EVENTS } from "../types/events";
import {
  SocketGameStartSchema,
  SocketGamePlaySchema,
  SocketGameSkipSchema,
} from "../types/schemas";
import { roomService } from "../services/roomService";
import { parsePayload } from "./parsePayload";
import {
  broadcastRoomUpdate,
  broadcastGameUpdate,
  broadcastPlayerFinished,
  broadcastGameEnd,
  emitError,
} from "./emit";
import { startTurnTimer, clearTurnTimer } from "./turnTimer";

// ─────────────────────────────────────────────
// game:start
// Only host can call this. Frontend sends initial gameState.
// ─────────────────────────────────────────────
// ─────────────────────────────────────────────
// game:play / game:skip
// Frontend engine already ran the move; it sends the resulting
// gameState snapshot. Backend stores it opaquely and broadcasts.
// ─────────────────────────────────────────────
// ─────────────────────────────────────────────
// player:finished / game:end are embedded in game:play payloads.
// Frontend signals them via extra fields on the gameState.
// We surface them as separate events for easy client-side handling.
// ─────────────────────────────────────────────

export interface GamePlayPayloadExtended {
  roomId:           string;
  playerId:         string;
  gameState:        unknown;
  // Optional signals from frontend engine
  playerFinished?:  boolean;
  finishedRank?:    number;
  gameOver?:        boolean;
  rankings?:        { playerId: string; rank: number }[];
  currentPlayerId?: string;   // next player's turn
}

export function registerGameHandlers(io: Server, socket: Socket): void {

  // ── game:start ───────────────────────────────
  socket.on(CLIENT_EVENTS.GAME_START, (raw: unknown) => {
    const payload = parsePayload(socket, SocketGameStartSchema, raw);
    if (!payload) return;

    const { roomId, playerId, initialGameState, secondsPerTurn } = payload;
    const result = roomService.startGame(roomId, playerId, initialGameState);
    if (!result.ok) {
      emitError(socket, result.error);
      return;
    }

    // Start the per-turn timer; duration override comes from the host's rules config
    const durationMs = secondsPerTurn !== undefined
      ? Math.max(5, Math.min(120, secondsPerTurn)) * 1000
      : undefined;
    const turnStartedAt = startTurnTimer(io, roomId, durationMs) ?? undefined;

    broadcastRoomUpdate(io, roomId, { room: result.data });
    broadcastGameUpdate(io, roomId, {
      roomId,
      gameState:   result.data.gameState,
      version:     result.data.version,
      triggeredBy: playerId,
      turnStartedAt,
    });
  });

  // ── game:play ────────────────────────────────
  socket.on(CLIENT_EVENTS.GAME_PLAY, (raw: unknown) => {
    const base = parsePayload(socket, SocketGamePlaySchema, raw);
    if (!base) return;

    // Cast to extended shape — frontend may include optional signal fields
    const payload = raw as GamePlayPayloadExtended;
    const { roomId, playerId, gameState } = payload;

    const result = roomService.applyGameState(roomId, playerId, gameState);
    if (!result.ok) {
      emitError(socket, result.error);
      return;
    }

    // Timer: stop on game over, restart otherwise
    let turnStartedAt: number | undefined;
    if (payload.gameOver) {
      clearTurnTimer(roomId);
    } else {
      turnStartedAt = startTurnTimer(io, roomId) ?? undefined;
    }

    // Always broadcast new game state
    broadcastGameUpdate(io, roomId, {
      roomId,
      gameState:   result.data.gameState,
      version:     result.data.version,
      triggeredBy: playerId,
      turnStartedAt,
    });

    // Player finished signal
    if (payload.playerFinished && payload.finishedRank !== undefined) {
      roomService.markPlayerFinished(roomId, playerId);
      broadcastPlayerFinished(io, roomId, {
        roomId,
        playerId,
        rank: payload.finishedRank,
      });
    }

    // Game over signal
    if (payload.gameOver && payload.rankings) {
      broadcastGameEnd(io, roomId, {
        roomId,
        rankings:  payload.rankings,
        gameState: result.data.gameState,
      });

      // Process queued departures, reset room to waiting for next match
      const endResult = roomService.endGame(roomId);
      if (endResult.ok && endResult.data !== null) {
        broadcastRoomUpdate(io, roomId, { room: endResult.data });
      }
    }
  });

  // ── game:skip ────────────────────────────────
  socket.on(CLIENT_EVENTS.GAME_SKIP, (raw: unknown) => {
    const base = parsePayload(socket, SocketGameSkipSchema, raw);
    if (!base) return;

    const { roomId, playerId, gameState } = base;

    const result = roomService.applyGameState(roomId, playerId, gameState);
    if (!result.ok) {
      emitError(socket, result.error);
      return;
    }

    const turnStartedAt = startTurnTimer(io, roomId) ?? undefined;

    broadcastGameUpdate(io, roomId, {
      roomId,
      gameState:   result.data.gameState,
      version:     result.data.version,
      triggeredBy: playerId,
      turnStartedAt,
    });
  });
}
