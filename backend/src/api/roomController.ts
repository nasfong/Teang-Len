import { Request, Response } from "express";
import { roomService } from "../services/roomService";
import { AuthedRequest } from "../modules/auth/auth.middleware";
import { CreateRoomBody } from "../types";

export function listRooms(_req: Request, res: Response): void {
  res.json({ ok: true, data: roomService.list() });
}

export function createRoom(req: Request, res: Response): void {
  const userId = (req as AuthedRequest).userId!;
  const { name, betCoin, maxPlayers } = req.body as Required<CreateRoomBody>;
  const result = roomService.create(userId, { name, betCoin, maxPlayers });

  if (!result.ok) {
    res.status(result.code).json({ ok: false, error: result.error });
    return;
  }

  res.status(201).json({ ok: true, data: result.data });
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
  const result = roomService.join(roomId, userId);

  if (!result.ok) {
    res.status(result.code).json({ ok: false, error: result.error });
    return;
  }

  res.json({ ok: true, data: result.data });
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
