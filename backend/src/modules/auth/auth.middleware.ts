import { Request, Response, NextFunction } from "express";
import { verifyToken } from "./token";

// ─────────────────────────────────────────────
// Auth middleware — extracts and verifies a Bearer token, attaching the
// resolved userId to the request for downstream controllers.
// ─────────────────────────────────────────────

export interface AuthedRequest extends Request {
  userId?: string;
}

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    res.status(401).json({ ok: false, error: "Authentication required" });
    return;
  }

  const payload = verifyToken(header.slice("Bearer ".length).trim());
  if (!payload) {
    res.status(401).json({ ok: false, error: "Invalid or expired token" });
    return;
  }

  (req as AuthedRequest).userId = payload.sub;
  next();
}
