// ─────────────────────────────────────────────
// User domain types
//
// A User is the persistent account identity. It is intentionally lean: things
// that grow independently (wallet, inventory, cosmetics, stats, progression)
// live in their own modules keyed by `id`, so this type stays stable as the
// platform expands.
// ─────────────────────────────────────────────

export interface User {
  id: string;
  username: string;       // unique login handle (stored normalised, lowercase)
  displayName: string;    // shown in-game
  passwordHash: string;   // scrypt "salt:hash" — never serialised to clients
  createdAt: number;
  updatedAt: number;
}

/** Safe public projection — never includes the password hash. */
export interface PublicUser {
  id: string;
  username: string;
  displayName: string;
  createdAt: number;
}

export interface CreateUserInput {
  username: string;       // already normalised by the caller (auth service)
  displayName: string;
  passwordHash: string;
}
