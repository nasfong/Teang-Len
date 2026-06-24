// ─────────────────────────────────────────────
// Wallet domain types
// A wallet belongs to exactly one user and tracks every spendable currency.
// Coin is live today; gem is reserved for future monetisation (purchases,
// premium shop, gifts). Add new currencies here and they flow through the
// generic credit/debit primitives without touching call sites.
// ─────────────────────────────────────────────

export type Currency = "coin" | "gem";

export interface Wallet {
  userId: string;
  coin: number;
  gem: number;
  createdAt: number;
  updatedAt: number;
}

/** Public balance projection — the only wallet shape exposed to clients. */
export interface WalletBalances {
  coin: number;
  gem: number;
}

/** Starting balances for a freshly created account. */
export const WALLET_DEFAULTS: WalletBalances = {
  coin: 10_000,
  gem: 0,
};
