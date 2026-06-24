import { z } from "zod";

// ─────────────────────────────────────────────
// REST body schemas
// ─────────────────────────────────────────────

// Room owner comes from the authenticated user (Bearer token), never the body.
export const CreateRoomSchema = z.object({
  name:       z.string().min(1, "Room name is required").max(24, "Room name must be 24 characters or fewer").trim(),
  betCoin:    z.number().int().min(0, "Bet cannot be negative"),
  maxPlayers: z.number().int().min(2).max(4).default(4),
});

// ─────────────────────────────────────────────
// Socket payload schemas
// ─────────────────────────────────────────────

export const SocketRoomJoinSchema = z.object({
  roomId:   z.string().min(1),
  playerId: z.string().uuid(),
});

export const SocketRoomLeaveSchema = z.object({
  roomId:   z.string().min(1),
  playerId: z.string().uuid(),
});

export const SocketPlayerReadySchema = z.object({
  roomId:   z.string().min(1),
  playerId: z.string().uuid(),
});

export const SocketGameStartSchema = z.object({
  roomId:           z.string().min(1),
  playerId:         z.string().uuid(),
  initialGameState: z.unknown(),
  secondsPerTurn:   z.number().int().min(5).max(120).optional(),
});

export const SocketGamePlaySchema = z.object({
  roomId:    z.string().min(1),
  playerId:  z.string().uuid(),
  gameState: z.unknown(),
});

export const SocketGameSkipSchema = z.object({
  roomId:    z.string().min(1),
  playerId:  z.string().uuid(),
  gameState: z.unknown(),
});

export const SocketRoomQueueLeaveSchema = z.object({
  roomId:   z.string().min(1),
  playerId: z.string().uuid(),
});

export const SocketRoomCancelQueueLeaveSchema = z.object({
  roomId:   z.string().min(1),
  playerId: z.string().uuid(),
});
