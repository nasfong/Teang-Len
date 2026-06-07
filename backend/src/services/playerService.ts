import { Player, ServiceResult } from "../types";
import { createPlayer } from "../rooms/roomFactory";

// ─────────────────────────────────────────────
// In-memory player registry (playerId → Player)
// Players exist independently of rooms so they can reconnect.
// ─────────────────────────────────────────────

const players = new Map<string, Player>();

// ─────────────────────────────────────────────
// Public service methods
// ─────────────────────────────────────────────

function createGuest(name: string): ServiceResult<Player> {
  const player = createPlayer(name);
  players.set(player.playerId, player);
  return { ok: true, data: player };
}

function getById(playerId: string): ServiceResult<Player> {
  const player = players.get(playerId);
  if (!player) {
    return { ok: false, error: "Player not found", code: 404 };
  }
  return { ok: true, data: player };
}

function setSocketId(playerId: string, socketId: string | null): void {
  const player = players.get(playerId);
  if (!player) return;
  players.set(playerId, {
    ...player,
    socketId,
    reconnectedAt: socketId ? Date.now() : player.reconnectedAt,
  });
}

function exists(playerId: string): boolean {
  return players.has(playerId);
}

export const playerService = { createGuest, getById, setSocketId, exists };
