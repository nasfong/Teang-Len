import { User } from "./user.types";

// ─────────────────────────────────────────────
// In-memory user registry.
//   users:         id → User
//   usernameIndex: normalised username → id   (enforces unique logins)
// Replace with a DB repository later; the service contract stays the same.
// ─────────────────────────────────────────────

const users = new Map<string, User>();
const usernameIndex = new Map<string, string>();

export const userStore = {
  get(id: string): User | undefined {
    return users.get(id);
  },

  getByUsername(usernameNormalised: string): User | undefined {
    const id = usernameIndex.get(usernameNormalised);
    return id ? users.get(id) : undefined;
  },

  hasUsername(usernameNormalised: string): boolean {
    return usernameIndex.has(usernameNormalised);
  },

  set(user: User): void {
    users.set(user.id, user);
    usernameIndex.set(user.username, user.id);
  },
};
