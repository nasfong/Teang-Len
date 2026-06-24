import { Request, Response } from "express";
import { authService } from "./auth.service";
import { RegisterBody, LoginBody } from "./auth.schemas";

export function register(req: Request, res: Response): void {
  const result = authService.register(req.body as RegisterBody);
  if (!result.ok) {
    res.status(result.code).json({ ok: false, error: result.error });
    return;
  }
  res.status(201).json({ ok: true, data: result.data });
}

export function login(req: Request, res: Response): void {
  const result = authService.login(req.body as LoginBody);
  if (!result.ok) {
    res.status(result.code).json({ ok: false, error: result.error });
    return;
  }
  res.status(200).json({ ok: true, data: result.data });
}
