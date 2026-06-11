import { Server, Socket } from "socket.io";
import { CLIENT_EVENTS } from "../types/events";
import {
  SocketRoomJoinSchema,
  SocketRoomLeaveSchema,
  SocketPlayerReadySchema,
  SocketRoomQueueLeaveSchema,
  SocketRoomCancelQueueLeaveSchema,
} from "../types/schemas";
import { roomService } from "../services/roomService";
import { playerService } from "../services/playerService";
import { parsePayload } from "./parsePayload";
import { broadcastRoomUpdate, emitError } from "./emit";

export function registerRoomHandlers(io: Server, socket: Socket): void {
  // ── room:join ────────────────────────────────
  socket.on(CLIENT_EVENTS.ROOM_JOIN, (raw: unknown) => {
    const payload = parsePayload(socket, SocketRoomJoinSchema, raw);
    if (!payload) return;

    const { roomId, playerId } = payload;

    // Attach socket to the room channel
    void socket.join(roomId);

    // Update player's socketId
    playerService.setSocketId(playerId, socket.id);

    // Reconnect path: player already exists in room
    const existing = roomService.getSnapshot(roomId);
    if (existing.ok) {
      const alreadyInRoom = existing.data.players.some((p) => p.playerId === playerId);
      if (alreadyInRoom) {
        roomService.reconnectPlayer(roomId, playerId, socket.id);
      }
    }

    // Ensure player is in the room (idempotent join)
    const result = roomService.join(roomId, playerId);
    if (!result.ok) {
      emitError(socket, result.error);
      return;
    }

    broadcastRoomUpdate(io, roomId, { room: result.data });
  });

  // ── room:leave ───────────────────────────────
  socket.on(CLIENT_EVENTS.ROOM_LEAVE, (raw: unknown) => {
    const payload = parsePayload(socket, SocketRoomLeaveSchema, raw);
    if (!payload) return;

    const { roomId, playerId } = payload;

    // During an active game, queue the departure instead of removing immediately
    const snapshot = roomService.getSnapshot(roomId);
    if (snapshot.ok && snapshot.data.status === "playing") {
      const result = roomService.queueLeave(roomId, playerId);
      if (!result.ok) { emitError(socket, result.error); return; }
      broadcastRoomUpdate(io, roomId, { room: result.data });
      return;
    }

    void socket.leave(roomId);
    playerService.setSocketId(playerId, null);

    const result = roomService.leave(roomId, playerId);
    if (!result.ok) {
      emitError(socket, result.error);
      return;
    }

    broadcastRoomUpdate(io, roomId, { room: result.data });
  });

  // ── room:queue-leave ─────────────────────────
  socket.on(CLIENT_EVENTS.ROOM_QUEUE_LEAVE, (raw: unknown) => {
    const payload = parsePayload(socket, SocketRoomQueueLeaveSchema, raw);
    if (!payload) return;

    const { roomId, playerId } = payload;
    const result = roomService.queueLeave(roomId, playerId);
    if (!result.ok) { emitError(socket, result.error); return; }
    broadcastRoomUpdate(io, roomId, { room: result.data });
  });

  // ── room:cancel-queue-leave ──────────────────
  socket.on(CLIENT_EVENTS.ROOM_CANCEL_QUEUE_LEAVE, (raw: unknown) => {
    const payload = parsePayload(socket, SocketRoomCancelQueueLeaveSchema, raw);
    if (!payload) return;

    const { roomId, playerId } = payload;
    const result = roomService.cancelQueueLeave(roomId, playerId);
    if (!result.ok) { emitError(socket, result.error); return; }
    broadcastRoomUpdate(io, roomId, { room: result.data });
  });

  // ── player:ready ─────────────────────────────
  socket.on(CLIENT_EVENTS.PLAYER_READY, (raw: unknown) => {
    const payload = parsePayload(socket, SocketPlayerReadySchema, raw);
    if (!payload) return;

    const { roomId, playerId } = payload;
    const result = roomService.setPlayerReady(roomId, playerId);
    if (!result.ok) {
      emitError(socket, result.error);
      return;
    }

    broadcastRoomUpdate(io, roomId, { room: result.data });
  });
}
