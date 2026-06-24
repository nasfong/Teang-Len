import { request } from './http';

// ─── Auth/account types ─────────────────────────────────────────────────────────

export interface PublicUser {
  id: string;
  username: string;
  displayName: string;
  createdAt: number;
}

export interface WalletBalances {
  coin: number;
  gem: number;
}

export interface AuthResult {
  token: string;
  user: PublicUser;
  wallet: WalletBalances;
}

export interface MeResult {
  user: PublicUser;
  wallet: WalletBalances;
}

// ─── Auth API ─────────────────────────────────────────────────────────────────

export const authApi = {
  /** POST /api/auth/register — create account (+ wallet), returns a token. */
  register(username: string, password: string, displayName?: string): Promise<AuthResult> {
    return request<AuthResult>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ username, password, displayName }),
    });
  },

  /** POST /api/auth/login — authenticate, returns a token. */
  login(username: string, password: string): Promise<AuthResult> {
    return request<AuthResult>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
  },

  /** GET /api/users/me — current profile + balances (requires token). */
  me(): Promise<MeResult> {
    return request<MeResult>('/api/users/me');
  },
};
