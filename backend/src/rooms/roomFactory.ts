import { v4 as uuidv4 } from "uuid";
import { Player, Room, RoomSnapshot, PlayerSnapshot, PlayerStatus } from "../types";

// ─────────────────────────────────────────────
// Factories
// ─────────────────────────────────────────────

export interface CreateRoomOptions {
  name: string;
  betCoin: number;
  maxPlayers: number;
}

export function createRoom(hostPlayer: Player, opts: CreateRoomOptions): Room {
  const now = Date.now();
  return {
    roomId:                 uuidv4(),
    name:                   opts.name,
    hostPlayerId:           hostPlayer.playerId,
    betCoin:                opts.betCoin,
    players:                [{ ...hostPlayer, seatIndex: 0 }],
    status:                 "waiting",
    gameState:              null,
    version:                0,
    maxPlayers:             opts.maxPlayers,
    createdAt:              now,
    updatedAt:              now,
    turnStartedAt:          null,
    turnDurationMs:         15_000,
    pendingLeavePlayerIds:  [],
  };
}

// Build an in-room participant from an authenticated user's identity.
export function createParticipant(
  userId: string,
  displayName: string,
  seatIndex: number | null,
  socketId: string | null = null,
  status: PlayerStatus = "waiting",
): Player {
  return {
    playerId:       userId,
    name:           displayName,
    socketId,
    status,
    seatIndex,
    connectedAt:    Date.now(),
    reconnectedAt:  null,
  };
}

// ─────────────────────────────────────────────
// Snapshot projections (safe public shape)
// ─────────────────────────────────────────────

export function toPlayerSnapshot(player: Player): PlayerSnapshot {
  return {
    playerId:  player.playerId,
    name:      player.name,
    status:    player.status,
    seatIndex: player.seatIndex,
    isOnline:  player.socketId !== null,
  };
}

export function toRoomSnapshot(room: Room): RoomSnapshot {
  return {
    roomId:                room.roomId,
    name:                  room.name,
    hostPlayerId:          room.hostPlayerId,
    betCoin:               room.betCoin,
    players:               room.players.map(toPlayerSnapshot),
    status:                room.status,
    gameState:             room.gameState,
    version:               room.version,
    maxPlayers:            room.maxPlayers,
    createdAt:             room.createdAt,
    updatedAt:             room.updatedAt,
    turnStartedAt:         room.turnStartedAt,
    turnDurationMs:        room.turnDurationMs,
    pendingLeavePlayerIds: room.pendingLeavePlayerIds,
  };
}

// ─────────────────────────────────────────────
// Pure room mutation helpers (return new Room)
// ─────────────────────────────────────────────

export function bumpVersion(room: Room): Room {
  return { ...room, version: room.version + 1, updatedAt: Date.now() };
}

export function nextAvailableSeat(room: Room): number | null {
  const taken = new Set(room.players.map((p) => p.seatIndex));
  for (let i = 0; i < room.maxPlayers; i++) {
    if (!taken.has(i)) return i;
  }
  return null;
}
