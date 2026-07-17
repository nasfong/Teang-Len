import { Request, Response } from "express";
import { roomService } from "../services/roomService";
import { walletService } from "../modules/wallet/wallet.service";
import { AuthedRequest } from "../modules/auth/auth.middleware";
import { CreateRoomBody } from "../types";

export function listRooms(_req: Request, res: Response): void {
  res.json({ ok: true, data: roomService.list() });
}

// Create + join both settle the entry fee here: the controller orchestrates
// room lifecycle (roomService) and money (walletService), while neither service
// reaches into the other. All coin math lives in walletService — the controller
// only sequences the two and returns the fresh balances so the client wallet
// can update without a second request.
export function createRoom(req: Request, res: Response): void {
  const userId = (req as AuthedRequest).userId!;
  const { name, betCoin, maxPlayers } = req.body as Required<CreateRoomBody>;

  // Fail fast before a room is ever created if the host can't cover the stake.
  if (!walletService.canAfford(userId, "coin", betCoin)) {
    res.status(402).json({ ok: false, error: "Not enough coins." });
    return;
  }

  const result = roomService.create(userId, { name, betCoin, maxPlayers });
  if (!result.ok) {
    res.status(result.code).json({ ok: false, error: result.error });
    return;
  }

  // Host is seated on creation, so the host pays the stake now. canAfford above
  // guarantees this succeeds (single-threaded, no interleaving debit).
  const charge = walletService.chargeEntryFee(userId, betCoin);
  if (!charge.ok) {
    res.status(charge.code).json({ ok: false, error: charge.error });
    return;
  }

  res.status(201).json({ ok: true, data: { room: result.data, wallet: charge.data } });
}

export function getRoom(req: Request, res: Response): void {
  const { roomId } = req.params;
  const result = roomService.getSnapshot(roomId);

  if (!result.ok) {
    res.status(result.code).json({ ok: false, error: result.error });
    return;
  }

  res.json({ ok: true, data: result.data });
}

export function joinRoom(req: Request, res: Response): void {
  const { roomId } = req.params;
  const userId = (req as AuthedRequest).userId!;

  const snapshot = roomService.getSnapshot(roomId);
  if (!snapshot.ok) {
    res.status(snapshot.code).json({ ok: false, error: snapshot.error });
    return;
  }

  // A re-join (already seated) is idempotent and must not charge a second time.
  const alreadySeated = snapshot.data.players.some((p) => p.playerId === userId);
  const betCoin = snapshot.data.betCoin;

  if (!alreadySeated && !walletService.canAfford(userId, "coin", betCoin)) {
    res.status(402).json({ ok: false, error: "Not enough coins." });
    return;
  }

  const result = roomService.join(roomId, userId);
  if (!result.ok) {
    res.status(result.code).json({ ok: false, error: result.error });
    return;
  }

  // Only a newly-taken seat pays the entry fee; re-joins return current balances.
  const charge = alreadySeated
    ? walletService.getBalances(userId)
    : walletService.chargeEntryFee(userId, betCoin);
  if (!charge.ok) {
    res.status(charge.code).json({ ok: false, error: charge.error });
    return;
  }

  res.json({ ok: true, data: { room: result.data, wallet: charge.data } });
}

export function leaveRoom(req: Request, res: Response): void {
  const { roomId } = req.params;
  const userId = (req as AuthedRequest).userId!;
  const result = roomService.leave(roomId, userId);

  if (!result.ok) {
    res.status(result.code).json({ ok: false, error: result.error });
    return;
  }

  res.json({ ok: true, data: result.data });
}
