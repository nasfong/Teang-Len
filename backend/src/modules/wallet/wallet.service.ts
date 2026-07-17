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

// ─────────────────────────────────────────────
// Domain money operations
//
// Higher layers (room create/join) express intent through these named helpers
// rather than calling debit/credit with magic arguments. Refunds, winner
// payouts and daily rewards will each earn a sibling here and route through the
// same credit()/debit() core — keeping every coin movement in one module.
// ─────────────────────────────────────────────

/**
 * Charge a table's entry fee against the coin balance. A 0 stake (free table)
 * is a no-op that simply returns the current balances. Insufficient funds map
 * to a 402 with a player-friendly message.
 */
function chargeEntryFee(userId: string, amount: number): ServiceResult<WalletBalances> {
  if (!Number.isInteger(amount) || amount < 0) {
    return { ok: false, error: "Invalid entry fee", code: 400 };
  }
  if (amount === 0) return getBalances(userId);

  const result = debit(userId, "coin", amount);
  if (!result.ok) {
    // Surface the affordability failure as a friendly, HTTP-appropriate error.
    if (result.code === 409) return { ok: false, error: "Not enough coins.", code: 402 };
    return result;
  }
  return { ok: true, data: toBalances(result.data) };
}

/**
 * Pay match winnings (the pot) into a player's coin balance. A non-positive
 * amount is a no-op that returns current balances, so free tables and empty
 * pots settle cleanly. Winner payouts, refunds and rewards all land here.
 */
function awardWinnings(userId: string, amount: number): ServiceResult<WalletBalances> {
  if (amount <= 0) return getBalances(userId);

  const result = credit(userId, "coin", amount);
  if (!result.ok) return result;
  return { ok: true, data: toBalances(result.data) };
}

export const walletService = {
  createForUser,
  get,
  getBalances,
  toBalances,
  credit,
  debit,
  canAfford,
  chargeEntryFee,
  awardWinnings,
};
