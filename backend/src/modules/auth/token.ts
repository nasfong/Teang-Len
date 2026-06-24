import { createHmac, timingSafeEqual } from "node:crypto";

// ─────────────────────────────────────────────
// Minimal HS256 JWT — signed with Node's crypto, no external dependency.
// Swap for a library/asymmetric keys later without changing callers.
// ─────────────────────────────────────────────

const SECRET = process.env.AUTH_SECRET ?? "dev-insecure-secret-change-me";
const TTL_SECONDS = 60 * 60 * 24 * 7; // 7 days

if (!process.env.AUTH_SECRET) {
  // eslint-disable-next-line no-console
  console.warn("[auth] AUTH_SECRET is not set — using an insecure dev secret. Set AUTH_SECRET in production.");
}

export interface TokenPayload {
  sub: string; // userId
  iat: number;
  exp: number;
}

function base64url(input: Buffer | string): string {
  return Buffer.from(input).toString("base64url");
}

function sign(data: string): Buffer {
  return createHmac("sha256", SECRET).update(data).digest();
}

export function signToken(userId: string): string {
  const now = Math.floor(Date.now() / 1000);
  const header = base64url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const payload = base64url(JSON.stringify({ sub: userId, iat: now, exp: now + TTL_SECONDS }));
  const data = `${header}.${payload}`;
  return `${data}.${base64url(sign(data))}`;
}

export function verifyToken(token: string): TokenPayload | null {
  const parts = token.split(".");
  if (parts.length !== 3) return null;

  const [header, payload, signature] = parts;
  const expected = sign(`${header}.${payload}`);
  const actual = Buffer.from(signature, "base64url");
  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) {
    return null;
  }

  try {
    const decoded = JSON.parse(Buffer.from(payload, "base64url").toString()) as TokenPayload;
    if (typeof decoded.sub !== "string" || typeof decoded.exp !== "number") return null;
    if (decoded.exp < Math.floor(Date.now() / 1000)) return null;
    return decoded;
  } catch {
    return null;
  }
}
