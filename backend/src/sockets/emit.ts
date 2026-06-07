import { Server, Socket } from "socket.io";
import { SERVER_EVENTS } from "../types/events";
import {
  RoomUpdatePayload,
  GameUpdatePayload,
  TurnUpdatePayload,
  PlayerFinishedPayload,
  GameEndPayload,
  PlayerDisconnectedPayload,
} from "../types";

// Emit to every socket in the room channel
export function broadcastRoomUpdate(io: Server, roomId: string, payload: RoomUpdatePayload): void {
  io.to(roomId).emit(SERVER_EVENTS.ROOM_UPDATE, payload);
}

export function broadcastGameUpdate(io: Server, roomId: string, payload: GameUpdatePayload): void {
  io.to(roomId).emit(SERVER_EVENTS.GAME_UPDATE, payload);
}

export function broadcastTurnUpdate(io: Server, roomId: string, payload: TurnUpdatePayload): void {
  io.to(roomId).emit(SERVER_EVENTS.TURN_UPDATE, payload);
}

export function broadcastPlayerFinished(io: Server, roomId: string, payload: PlayerFinishedPayload): void {
  io.to(roomId).emit(SERVER_EVENTS.PLAYER_FINISHED, payload);
}

export function broadcastGameEnd(io: Server, roomId: string, payload: GameEndPayload): void {
  io.to(roomId).emit(SERVER_EVENTS.GAME_END, payload);
}

export function broadcastPlayerDisconnected(io: Server, roomId: string, payload: PlayerDisconnectedPayload): void {
  io.to(roomId).emit(SERVER_EVENTS.PLAYER_DISCONNECTED, payload);
}

// Emit error only to the originating socket
export function emitError(socket: Socket, message: string): void {
  socket.emit(SERVER_EVENTS.ERROR, { message });
}
