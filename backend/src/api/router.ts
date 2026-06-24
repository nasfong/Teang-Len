import { Router } from "express";
import { validate } from "../middleware/validate";
import { CreateRoomSchema } from "../types/schemas";
import { requireAuth } from "../modules/auth/auth.middleware";
import { authRouter } from "../modules/auth/auth.routes";
import { userRouter } from "../modules/user/user.routes";
import { walletRouter } from "../modules/wallet/wallet.routes";
import { listRooms, createRoom, getRoom, joinRoom, leaveRoom } from "./roomController";

const router = Router();

// ─── Auth / User / Wallet modules ───────────
router.use("/auth", authRouter);
router.use("/users", userRouter);
router.use("/wallet", walletRouter);

// ─── Rooms (all require an authenticated user) ───
router.get(
  "/rooms",
  requireAuth,
  listRooms
);

router.post(
  "/rooms",
  requireAuth,
  validate(CreateRoomSchema),
  createRoom
);

router.get(
  "/rooms/:roomId",
  requireAuth,
  getRoom
);

router.post(
  "/rooms/:roomId/join",
  requireAuth,
  joinRoom
);

router.post(
  "/rooms/:roomId/leave",
  requireAuth,
  leaveRoom
);

export { router as apiRouter };
