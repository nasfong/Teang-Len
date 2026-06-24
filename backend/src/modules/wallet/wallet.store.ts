import { Wallet } from "./wallet.types";

// ─────────────────────────────────────────────
// In-memory wallet registry (userId → Wallet)
// One wallet per user. Swap this Map for a DB-backed repository later
// without changing the wallet service contract.
// ─────────────────────────────────────────────

const wallets = new Map<string, Wallet>();

export const walletStore = {
  get(userId: string): Wallet | undefined {
    return wallets.get(userId);
  },

  set(wallet: Wallet): void {
    wallets.set(wallet.userId, wallet);
  },

  has(userId: string): boolean {
    return wallets.has(userId);
  },

  delete(userId: string): boolean {
    return wallets.delete(userId);
  },
};
