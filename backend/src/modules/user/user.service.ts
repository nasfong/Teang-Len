import { v4 as uuidv4 } from "uuid";
import { ServiceResult } from "../../types";
import { CreateUserInput, PublicUser, User } from "./user.types";
import { userStore } from "./user.store";

// ─────────────────────────────────────────────
// User service — account identity only.
//
// This service does NOT create wallets or any other side resource; the auth
// service orchestrates account + wallet creation so each concern stays in its
// own module.
// ─────────────────────────────────────────────

export function normaliseUsername(username: string): string {
  return username.trim().toLowerCase();
}

function create(input: CreateUserInput): ServiceResult<User> {
  const username = normaliseUsername(input.username);
  if (userStore.hasUsername(username)) {
    return { ok: false, error: "Username already taken", code: 409 };
  }

  const now = Date.now();
  const user: User = {
    id: uuidv4(),
    username,
    displayName: input.displayName.trim() || username,
    passwordHash: input.passwordHash,
    createdAt: now,
    updatedAt: now,
  };
  userStore.set(user);
  return { ok: true, data: user };
}

function getById(id: string): ServiceResult<User> {
  const user = userStore.get(id);
  if (!user) return { ok: false, error: "User not found", code: 404 };
  return { ok: true, data: user };
}

function getByUsername(username: string): ServiceResult<User> {
  const user = userStore.getByUsername(normaliseUsername(username));
  if (!user) return { ok: false, error: "User not found", code: 404 };
  return { ok: true, data: user };
}

function toPublicUser(user: User): PublicUser {
  return {
    id: user.id,
    username: user.username,
    displayName: user.displayName,
    createdAt: user.createdAt,
  };
}

export const userService = {
  create,
  getById,
  getByUsername,
  toPublicUser,
};
