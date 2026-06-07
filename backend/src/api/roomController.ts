import { Request, Response } from "express";
import { roomService } from "../services/roomService";

export function listRooms(_req: Request, res: Response): void {
  res.json({ ok: true, data: roomService.list() });
}

export function createRoom(req: Request, res: Response): void {
  const { playerId, maxPlayers } = req.body as { playerId: string; maxPlayers: number };
  const result = roomService.create(playerId, maxPlayers);

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
  const { playerId } = req.body as { playerId: string };
  const result = roomService.join(roomId, playerId);

  if (!result.ok) {
    res.status(result.code).json({ ok: false, error: result.error });
    return;
  }

  res.json({ ok: true, data: result.data });
}

export function leaveRoom(req: Request, res: Response): void {
  const { roomId } = req.params;
  const { playerId } = req.body as { playerId: string };
  const result = roomService.leave(roomId, playerId);

  if (!result.ok) {
    res.status(result.code).json({ ok: false, error: result.error });
    return;
  }

  res.json({ ok: true, data: result.data });
}
