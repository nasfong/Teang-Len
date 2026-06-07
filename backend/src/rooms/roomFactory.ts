import { v4 as uuidv4 } from "uuid";
import { Player, Room, RoomSnapshot, PlayerSnapshot } from "../types";

// ─────────────────────────────────────────────
// Factories
// ─────────────────────────────────────────────

export function createRoom(hostPlayer: Player, maxPlayers: number): Room {
  return {
    roomId:       uuidv4(),
    hostPlayerId: hostPlayer.playerId,
    players:      [{ ...hostPlayer, seatIndex: 0 }],
    status:       "waiting",
    gameState:    null,
    version:      0,
    maxPlayers,
    createdAt:    Date.now(),
    updatedAt:    Date.now(),
  };
}

export function createPlayer(name: string): Player {
  return {
    playerId:       uuidv4(),
    name:           name.trim(),
    socketId:       null,
    status:         "waiting",
    seatIndex:      null,
    isGuest:        true,
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
    roomId:       room.roomId,
    hostPlayerId: room.hostPlayerId,
    players:      room.players.map(toPlayerSnapshot),
    status:       room.status,
    gameState:    room.gameState,
    version:      room.version,
    maxPlayers:   room.maxPlayers,
    createdAt:    room.createdAt,
    updatedAt:    room.updatedAt,
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
