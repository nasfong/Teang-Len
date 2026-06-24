import { Router } from "express";
import { requireAuth } from "../auth/auth.middleware";
import { getMe } from "./user.controller";

const router = Router();

router.get("/me", requireAuth, getMe);

export { router as userRouter };
