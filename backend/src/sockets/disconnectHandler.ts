import { Server, Socket } from "socket.io";
import { roomStore } from "../rooms/roomStore";
import { roomService } from "../services/roomService";
import { playerService } from "../services/playerService";
import { broadcastPlayerDisconnected, broadcastRoomUpdate } from "./emit";

export function registerDisconnectHandler(io: Server, socket: Socket): void {
  socket.on("disconnect", () => {
    console.log(`[socket] disconnect ${socket.id}`);

    // Find which room this socket belongs to
    const allRooms = roomStore.all();
    for (const room of allRooms) {
      const player = room.players.find((p) => p.socketId === socket.id);
      if (!player) continue;

      playerService.setSocketId(player.playerId, null);
      roomService.markPlayerDisconnected(room.roomId, player.playerId);

      broadcastPlayerDisconnected(io, room.roomId, {
        roomId:   room.roomId,
        playerId: player.playerId,
      });

      // Also send updated room snapshot
      const snapshot = roomService.getSnapshot(room.roomId);
      if (snapshot.ok) {
        broadcastRoomUpdate(io, room.roomId, { room: snapshot.data });
      }

      break; // A socket can only be in one room at a time
    }
  });
}
