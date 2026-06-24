import { Room, Player, RoomSnapshot, ServiceResult } from "../types";
import { roomStore } from "../rooms/roomStore";
import {
  createRoom,
  createParticipant,
  toRoomSnapshot,
  bumpVersion,
  nextAvailableSeat,
  CreateRoomOptions,
} from "../rooms/roomFactory";
import { userService } from "../modules/user/user.service";

// ─────────────────────────────────────────────
// Room service
//
// Identity comes from the user module (accounts); this service only manages
// room lifecycle and never touches wallets directly.
// ─────────────────────────────────────────────

function create(
  hostUserId: string,
  opts: CreateRoomOptions
): ServiceResult<RoomSnapshot> {
  const userResult = userService.getById(hostUserId);
  if (!userResult.ok) return userResult;

  const host = createParticipant(userResult.data.id, userResult.data.displayName, 0);
  const room = createRoom(host, opts);
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
  userId: string,
  socketId: string | null = null
): ServiceResult<RoomSnapshot> {
  const room = roomStore.get(roomId);
  if (!room) return { ok: false, error: "Room not found", code: 404 };
  if (room.status === "playing")
    return { ok: false, error: "Game already started", code: 409 };
  if (room.players.length >= room.maxPlayers)
    return { ok: false, error: "Room is full", code: 409 };

  const alreadyIn = room.players.some((p) => p.playerId === userId);
  if (alreadyIn) return { ok: true, data: toRoomSnapshot(room) }; // idempotent

  const userResult = userService.getById(userId);
  if (!userResult.ok) return userResult;

  const seat = nextAvailableSeat(room);
  if (seat === null)
    return { ok: false, error: "No seats available", code: 409 };

  const participant: Player = createParticipant(
    userResult.data.id,
    userResult.data.displayName,
    seat,
    socketId,
  );
  const updated: Room = bumpVersion({
    ...room,
    players: [...room.players, participant],
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
  if (room.status === "playing")
    return { ok: false, error: "Game already in progress", code: 409 };
  if (room.players.length < 2)
    return { ok: false, error: "Need at least 2 players", code: 409 };

  const updated: Room = bumpVersion({
    ...room,
    status:                "playing",
    gameState:             initialGameState,
    turnStartedAt:         null,
    pendingLeavePlayerIds: [],
    players:               room.players.map((p) => ({ ...p, status: "playing" })),
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

function queueLeave(
  roomId: string,
  playerId: string
): ServiceResult<RoomSnapshot> {
  const room = roomStore.get(roomId);
  if (!room) return { ok: false, error: "Room not found", code: 404 };

  if (room.pendingLeavePlayerIds.includes(playerId)) {
    return { ok: true, data: toRoomSnapshot(room) }; // idempotent
  }

  const updated: Room = bumpVersion({
    ...room,
    pendingLeavePlayerIds: [...room.pendingLeavePlayerIds, playerId],
  });
  roomStore.set(updated);
  return { ok: true, data: toRoomSnapshot(updated) };
}

function cancelQueueLeave(
  roomId: string,
  playerId: string
): ServiceResult<RoomSnapshot> {
  const room = roomStore.get(roomId);
  if (!room) return { ok: false, error: "Room not found", code: 404 };

  const updated: Room = bumpVersion({
    ...room,
    pendingLeavePlayerIds: room.pendingLeavePlayerIds.filter(id => id !== playerId),
  });
  roomStore.set(updated);
  return { ok: true, data: toRoomSnapshot(updated) };
}

// Called after game:end — processes queued departures and resets room to waiting.
// Returns null when the room was destroyed (everyone left).
function endGame(
  roomId: string
): ServiceResult<RoomSnapshot | null> {
  const room = roomStore.get(roomId);
  if (!room) return { ok: false, error: "Room not found", code: 404 };

  const pendingSet  = new Set(room.pendingLeavePlayerIds);
  const remaining   = room.players.filter(p => !pendingSet.has(p.playerId));

  if (remaining.length === 0) {
    roomStore.delete(roomId);
    return { ok: true, data: null };
  }

  const hostStays  = remaining.some(p => p.playerId === room.hostPlayerId);
  const newHostId  = hostStays ? room.hostPlayerId : remaining[0].playerId;

  const updated: Room = bumpVersion({
    ...room,
    players:               remaining.map(p => ({ ...p, status: "waiting" as const })),
    hostPlayerId:          newHostId,
    status:                "waiting",
    gameState:             null,
    turnStartedAt:         null,
    pendingLeavePlayerIds: [],
  });

  roomStore.set(updated);
  return { ok: true, data: toRoomSnapshot(updated) };
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
            status:         p.status === "disconnected"
            ? (room.status === "playing" ? "playing" : "waiting")
            : p.status,
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
  queueLeave,
  cancelQueueLeave,
  endGame,
  markPlayerDisconnected,
  reconnectPlayer,
};
