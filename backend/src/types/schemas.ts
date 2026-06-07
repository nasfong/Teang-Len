import { z } from "zod";

// ─────────────────────────────────────────────
// REST body schemas
// ─────────────────────────────────────────────

export const CreateGuestPlayerSchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .max(24, "Name must be 24 characters or fewer")
    .trim(),
});

export const CreateRoomSchema = z.object({
  playerId:   z.string().uuid("Invalid playerId"),
  maxPlayers: z.number().int().min(2).max(4).default(4),
});

export const JoinRoomSchema = z.object({
  playerId: z.string().uuid("Invalid playerId"),
});

export const LeaveRoomSchema = z.object({
  playerId: z.string().uuid("Invalid playerId"),
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
