import { Request, Response } from "express";
import { AuthedRequest } from "../auth/auth.middleware";
import { userService } from "./user.service";
import { walletService } from "../wallet/wallet.service";

// GET /api/users/me — the authenticated player's profile + current balances.
export function getMe(req: Request, res: Response): void {
  const userId = (req as AuthedRequest).userId!;

  const userResult = userService.getById(userId);
  if (!userResult.ok) {
    res.status(userResult.code).json({ ok: false, error: userResult.error });
    return;
  }

  const walletResult = walletService.getBalances(userId);
  if (!walletResult.ok) {
    res.status(walletResult.code).json({ ok: false, error: walletResult.error });
    return;
  }

  res.json({
    ok: true,
    data: {
      user: userService.toPublicUser(userResult.data),
      wallet: walletResult.data,
    },
  });
}
