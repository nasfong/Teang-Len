import { Request, Response } from "express";
import { AuthedRequest } from "../auth/auth.middleware";
import { walletService } from "./wallet.service";

// GET /api/wallet — the authenticated player's balances.
// Mutating endpoints (rewards, shop, purchases) will be added here later and
// will route through walletService.credit / walletService.debit.
export function getMyWallet(req: Request, res: Response): void {
  const userId = (req as AuthedRequest).userId!;

  const result = walletService.getBalances(userId);
  if (!result.ok) {
    res.status(result.code).json({ ok: false, error: result.error });
    return;
  }

  res.json({ ok: true, data: result.data });
}
