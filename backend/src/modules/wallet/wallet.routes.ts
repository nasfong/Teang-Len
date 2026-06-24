import { Router } from "express";
import { requireAuth } from "../auth/auth.middleware";
import { getMyWallet } from "./wallet.controller";

const router = Router();

router.get("/", requireAuth, getMyWallet);

export { router as walletRouter };
