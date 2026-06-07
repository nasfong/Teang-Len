import { Request, Response } from "express";
import { playerService } from "../services/playerService";

export function createGuestPlayer(req: Request, res: Response): void {
  const { name } = req.body as { name: string };
  const result = playerService.createGuest(name);

  if (!result.ok) {
    res.status(result.code).json({ ok: false, error: result.error });
    return;
  }

  res.status(201).json({ ok: true, data: result.data });
}
