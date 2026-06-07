import { Router } from "express";
import { validate } from "../middleware/validate";
import {
  CreateGuestPlayerSchema,
  CreateRoomSchema,
  JoinRoomSchema,
  LeaveRoomSchema,
} from "../types/schemas";
import { createGuestPlayer } from "./playerController";
import { listRooms, createRoom, getRoom, joinRoom, leaveRoom } from "./roomController";

const router = Router();

// ─── Players ────────────────────────────────
router.post(
  "/players/guest",
  validate(CreateGuestPlayerSchema),
  createGuestPlayer
);

// ─── Rooms ──────────────────────────────────
router.get(
  "/rooms",
  listRooms
);

router.post(
  "/rooms",
  validate(CreateRoomSchema),
  createRoom
);

router.get(
  "/rooms/:roomId",
  getRoom
);

router.post(
  "/rooms/:roomId/join",
  validate(JoinRoomSchema),
  joinRoom
);

router.post(
  "/rooms/:roomId/leave",
  validate(LeaveRoomSchema),
  leaveRoom
);

export { router as apiRouter };
