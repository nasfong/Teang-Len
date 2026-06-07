import { Server as HttpServer } from "http";
import { Server } from "socket.io";
import { registerRoomHandlers } from "./roomHandlers";
import { registerGameHandlers } from "./gameHandlers";
import { registerDisconnectHandler } from "./disconnectHandler";

export function createSocketServer(httpServer: HttpServer): Server {
  const io = new Server(httpServer, {
    cors: {
      origin:  process.env.CLIENT_ORIGIN ?? "*",
      methods: ["GET", "POST"],
    },
    // Reconnection window: client has 10s to reconnect before eviction
    pingTimeout:  10000,
    pingInterval: 5000,
  });

  io.on("connection", (socket) => {
    console.log(`[socket] connected ${socket.id}`);

    registerRoomHandlers(io, socket);
    registerGameHandlers(io, socket);
    registerDisconnectHandler(io, socket);
  });

  return io;
}
