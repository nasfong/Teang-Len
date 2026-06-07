import "node:http";
import express from "express";
import cors from "cors";
import { createServer } from "http";
import { apiRouter } from "./api/router";
import { errorHandler } from "./middleware/errorHandler";
import { createSocketServer } from "./sockets";
import { logger } from "./utils/logger";

const PORT   = Number(process.env.PORT   ?? 4000);
const ORIGIN = process.env.CLIENT_ORIGIN ?? "*";

// ─────────────────────────────────────────────
// Express app
// ─────────────────────────────────────────────
const app = express();

app.use(cors({ origin: ORIGIN }));
app.use(express.json());

// Health check
app.get("/health", (_req, res) => {
  res.json({ ok: true, service: "teang-len-server", ts: Date.now() });
});

// REST API
app.use("/api", apiRouter);

// Error handling (must be last)
app.use(errorHandler);

// ─────────────────────────────────────────────
// HTTP + Socket.IO
// ─────────────────────────────────────────────
const httpServer = createServer(app);
const _io = createSocketServer(httpServer);   // io available if needed later

httpServer.listen(PORT, () => {
  logger.info(`Teang Len server running on port ${PORT}`);
  logger.info(`CORS origin: ${ORIGIN}`);
});

// Graceful shutdown
process.on("SIGTERM", () => {
  logger.info("SIGTERM received — shutting down");
  httpServer.close(() => process.exit(0));
});
