import { request } from './http';
import type { WalletBalances } from './authApi';

// Wallet is read-only for now. Spend/earn/gem/shop will add methods here later,
// all flowing through the same authenticated request helper.
export const walletApi = {
  /** GET /api/wallet — current balances (requires token). */
  get(): Promise<WalletBalances> {
    return request<WalletBalances>('/api/wallet');
  },
};
