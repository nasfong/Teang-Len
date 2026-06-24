import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

// ─────────────────────────────────────────────
// Password hashing — Node's built-in scrypt (no external dependency).
// Stored format: "<saltHex>:<hashHex>".
// ─────────────────────────────────────────────

const KEY_LENGTH = 64;

export function hashPassword(plain: string): string {
  const salt = randomBytes(16);
  const hash = scryptSync(plain, salt, KEY_LENGTH);
  return `${salt.toString("hex")}:${hash.toString("hex")}`;
}

export function verifyPassword(plain: string, stored: string): boolean {
  const [saltHex, hashHex] = stored.split(":");
  if (!saltHex || !hashHex) return false;

  const salt = Buffer.from(saltHex, "hex");
  const expected = Buffer.from(hashHex, "hex");
  const actual = scryptSync(plain, salt, expected.length);

  return expected.length === actual.length && timingSafeEqual(expected, actual);
}
