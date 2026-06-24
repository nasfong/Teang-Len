import { ServiceResult } from "../../types";
import { Currency, Wallet, WalletBalances, WALLET_DEFAULTS } from "./wallet.types";
import { walletStore } from "./wallet.store";

// ─────────────────────────────────────────────
// Wallet service
//
// All balance changes go through credit()/debit() so that future features —
// daily rewards, shop purchases, rewarded ads, gifts, match payouts — share a
// single, auditable money path. This service deliberately knows nothing about
// rooms or game logic; game/room code must call these primitives rather than
// mutate balances directly.
// ─────────────────────────────────────────────

function toBalances(wallet: Wallet): WalletBalances {
  return { coin: wallet.coin, gem: wallet.gem };
}

/** Create the wallet that backs a new account, seeded with default balances. */
function createForUser(userId: string): ServiceResult<Wallet> {
  if (walletStore.has(userId)) {
    return { ok: false, error: "Wallet already exists", code: 409 };
  }
  const now = Date.now();
  const wallet: Wallet = {
    userId,
    coin: WALLET_DEFAULTS.coin,
    gem: WALLET_DEFAULTS.gem,
    createdAt: now,
    updatedAt: now,
  };
  walletStore.set(wallet);
  return { ok: true, data: wallet };
}

function get(userId: string): ServiceResult<Wallet> {
  const wallet = walletStore.get(userId);
  if (!wallet) return { ok: false, error: "Wallet not found", code: 404 };
  return { ok: true, data: wallet };
}

function getBalances(userId: string): ServiceResult<WalletBalances> {
  const result = get(userId);
  if (!result.ok) return result;
  return { ok: true, data: toBalances(result.data) };
}

/** Add funds. amount must be a positive integer. */
function credit(userId: string, currency: Currency, amount: number): ServiceResult<Wallet> {
  if (!Number.isInteger(amount) || amount <= 0) {
    return { ok: false, error: "Credit amount must be a positive integer", code: 400 };
  }
  const result = get(userId);
  if (!result.ok) return result;

  const updated: Wallet = {
    ...result.data,
    [currency]: result.data[currency] + amount,
    updatedAt: Date.now(),
  };
  walletStore.set(updated);
  return { ok: true, data: updated };
}

/** Remove funds, rejecting the operation if the balance is insufficient. */
function debit(userId: string, currency: Currency, amount: number): ServiceResult<Wallet> {
  if (!Number.isInteger(amount) || amount <= 0) {
    return { ok: false, error: "Debit amount must be a positive integer", code: 400 };
  }
  const result = get(userId);
  if (!result.ok) return result;
  if (result.data[currency] < amount) {
    return { ok: false, error: `Insufficient ${currency} balance`, code: 409 };
  }

  const updated: Wallet = {
    ...result.data,
    [currency]: result.data[currency] - amount,
    updatedAt: Date.now(),
  };
  walletStore.set(updated);
  return { ok: true, data: updated };
}

/** Non-mutating affordability check, useful before starting a bet-gated action. */
function canAfford(userId: string, currency: Currency, amount: number): boolean {
  const wallet = walletStore.get(userId);
  return wallet !== undefined && wallet[currency] >= amount;
}

export const walletService = {
  createForUser,
  get,
  getBalances,
  toBalances,
  credit,
  debit,
  canAfford,
};
