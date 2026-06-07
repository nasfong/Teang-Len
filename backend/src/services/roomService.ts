import { Room, Player, RoomSnapshot, ServiceResult } from "../types";
import { roomStore } from "../rooms/roomStore";
import {
  createRoom,
  toRoomSnapshot,
  bumpVersion,
  nextAvailableSeat,
} from "../rooms/roomFactory";
import { playerService } from "./playerService";

// ─────────────────────────────────────────────
// Room service
// ─────────────────────────────────────────────

function create(
  hostPlayerId: string,
  maxPlayers: number
): ServiceResult<RoomSnapshot> {
  const playerResult = playerService.getById(hostPlayerId);
  if (!playerResult.ok) return playerResult;

  const room = createRoom(playerResult.data, maxPlayers);
  roomStore.set(room);
  return { ok: true, data: toRoomSnapshot(room) };
}

function getSnapshot(roomId: string): ServiceResult<RoomSnapshot> {
  const room = roomStore.get(roomId);
  if (!room) return { ok: false, error: "Room not found", code: 404 };
  return { ok: true, data: toRoomSnapshot(room) };
}

function list(): RoomSnapshot[] {
  return roomStore.all()
    .filter(r => r.status === "waiting")
    .map(toRoomSnapshot);
}

function join(
  roomId: string,
  playerId: string
): ServiceResult<RoomSnapshot> {
  const room = roomStore.get(roomId);
  if (!room) return { ok: false, error: "Room not found", code: 404 };
  if (room.status !== "waiting")
    return { ok: false, error: "Game already started", code: 409 };
  if (room.players.length >= room.maxPlayers)
    return { ok: false, error: "Room is full", code: 409 };

  const alreadyIn = room.players.some((p) => p.playerId === playerId);
  if (alreadyIn) return { ok: true, data: toRoomSnapshot(room) }; // idempotent

  const playerResult = playerService.getById(playerId);
  if (!playerResult.ok) return playerResult;

  const seat = nextAvailableSeat(room);
  if (seat === null)
    return { ok: false, error: "No seats available", code: 409 };

  const updatedPlayer: Player = { ...playerResult.data, seatIndex: seat, status: "waiting" };
  const updated: Room = bumpVersion({
    ...room,
    players: [...room.players, updatedPlayer],
  });

  roomStore.set(updated);
  return { ok: true, data: toRoomSnapshot(updated) };
}

function leave(
  roomId: string,
  playerId: string
): ServiceResult<RoomSnapshot> {
  const room = roomStore.get(roomId);
  if (!room) return { ok: false, error: "Room not found", code: 404 };

  const remaining = room.players.filter((p) => p.playerId !== playerId);

  // Room is empty — clean up
  if (remaining.length === 0) {
    roomStore.delete(roomId);
    return { ok: true, data: toRoomSnapshot({ ...room, players: [] }) };
  }

  // Transfer host if host left
  const newHostId =
    remaining.find((p) => p.playerId === room.hostPlayerId)?.playerId ??
    remaining[0].playerId;

  const updated: Room = bumpVersion({
    ...room,
    players: remaining,
    hostPlayerId: newHostId,
  });

  roomStore.set(updated);
  return { ok: true, data: toRoomSnapshot(updated) };
}

function setPlayerReady(
  roomId: string,
  playerId: string
): ServiceResult<RoomSnapshot> {
  const room = roomStore.get(roomId);
  if (!room) return { ok: false, error: "Room not found", code: 404 };

  const updated: Room = bumpVersion({
    ...room,
    players: room.players.map((p) =>
      p.playerId === playerId ? { ...p, status: "ready" } : p
    ),
  });

  roomStore.set(updated);
  return { ok: true, data: toRoomSnapshot(updated) };
}

function startGame(
  roomId: string,
  hostPlayerId: string,
  initialGameState: unknown
): ServiceResult<RoomSnapshot> {
  const room = roomStore.get(roomId);
  if (!room) return { ok: false, error: "Room not found", code: 404 };
  if (room.hostPlayerId !== hostPlayerId)
    return { ok: false, error: "Only host can start the game", code: 403 };
  if (room.status !== "waiting")
    return { ok: false, error: "Game already started", code: 409 };
  if (room.players.length < 2)
    return { ok: false, error: "Need at least 2 players", code: 409 };

  const updated: Room = bumpVersion({
    ...room,
    status:    "playing",
    gameState: initialGameState,
    players:   room.players.map((p) => ({ ...p, status: "playing" })),
  });

  roomStore.set(updated);
  return { ok: true, data: toRoomSnapshot(updated) };
}

// Called by socket handlers when frontend sends a new game state snapshot
function applyGameState(
  roomId: string,
  playerId: string,
  gameState: unknown
): ServiceResult<RoomSnapshot> {
  const room = roomStore.get(roomId);
  if (!room) return { ok: false, error: "Room not found", code: 404 };
  if (room.status !== "playing")
    return { ok: false, error: "Game is not in progress", code: 409 };

  const isPlayer = room.players.some((p) => p.playerId === playerId);
  if (!isPlayer)
    return { ok: false, error: "Player not in room", code: 403 };

  // Backend stores opaque state — no interpretation
  const updated: Room = bumpVersion({ ...room, gameState });
  roomStore.set(updated);
  return { ok: true, data: toRoomSnapshot(updated) };
}

function markPlayerFinished(
  roomId: string,
  playerId: string
): ServiceResult<{ snapshot: RoomSnapshot; rank: number }> {
  const room = roomStore.get(roomId);
  if (!room) return { ok: false, error: "Room not found", code: 404 };

  const finishedCount = room.players.filter(
    (p) => p.status === "finished"
  ).length;
  const rank = finishedCount + 1;

  const updatedPlayers = room.players.map((p) =>
    p.playerId === playerId ? { ...p, status: "finished" as const } : p
  );

  const allDone = updatedPlayers.every((p) => p.status === "finished");

  const updated: Room = bumpVersion({
    ...room,
    players: updatedPlayers,
    status:  allDone ? "finished" : "playing",
  });

  roomStore.set(updated);
  return { ok: true, data: { snapshot: toRoomSnapshot(updated), rank } };
}

function markPlayerDisconnected(
  roomId: string,
  playerId: string
): ServiceResult<RoomSnapshot> {
  const room = roomStore.get(roomId);
  if (!room) return { ok: false, error: "Room not found", code: 404 };

  const updated: Room = bumpVersion({
    ...room,
    players: room.players.map((p) =>
      p.playerId === playerId
        ? { ...p, socketId: null, status: "disconnected" as const }
        : p
    ),
  });

  roomStore.set(updated);
  return { ok: true, data: toRoomSnapshot(updated) };
}

function reconnectPlayer(
  roomId: string,
  playerId: string,
  socketId: string
): ServiceResult<RoomSnapshot> {
  const room = roomStore.get(roomId);
  if (!room) return { ok: false, error: "Room not found", code: 404 };

  const updated: Room = bumpVersion({
    ...room,
    players: room.players.map((p) =>
      p.playerId === playerId
        ? {
            ...p,
            socketId,
            status:         p.status === "disconnected" ? "playing" : p.status,
            reconnectedAt:  Date.now(),
          }
        : p
    ),
  });

  roomStore.set(updated);
  return { ok: true, data: toRoomSnapshot(updated) };
}

export const roomService = {
  create,
  list,
  getSnapshot,
  join,
  leave,
  setPlayerReady,
  startGame,
  applyGameState,
  markPlayerFinished,
  markPlayerDisconnected,
  reconnectPlayer,
};
