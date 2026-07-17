import { create } from 'zustand';
import { authApi, type WalletBalances } from '../services/authApi';
import { walletApi } from '../services/walletApi';
import { getToken, setToken, clearToken, setUnauthorizedHandler } from '../services/http';
import { useLobbyStore } from './lobbyStore';
import { useGameStore } from './gameStore';
import { socketService } from '../services/socket';

// Authenticated account — kept separate from game/lobby state on purpose.
export interface AuthUser {
  id: string;
  username: string;
  displayName: string;
  wallet: WalletBalances;
}

export type AuthStatus = 'idle' | 'loading' | 'authenticated' | 'unauthenticated';

interface AuthStore {
  user: AuthUser | null;
  status: AuthStatus;
  error: string | null;

  register(username: string, password: string, displayName?: string): Promise<boolean>;
  login(username: string, password: string): Promise<boolean>;
  logout(): void;
  restoreSession(): Promise<void>;
  refreshWallet(): Promise<void>;
  setWallet(wallet: WalletBalances): void;
  clearError(): void;
}

// Mirror the authenticated identity into the lobby store + (re)connect the
// socket with the JWT. lobbyStore.playerId stays the socket-facing identity.
function activateSession(user: AuthUser): void {
  useLobbyStore.getState().setPlayer(user.id, user.displayName);
  socketService.connectWithAuth();
}

export const useAuthStore = create<AuthStore>((set, get) => ({
  user: null,
  // Start in 'loading' when a token is present so route guards wait for
  // restoreSession instead of flashing the login screen on refresh.
  status: getToken() ? 'loading' : 'unauthenticated',
  error: null,

  async register(username, password, displayName) {
    set({ status: 'loading', error: null });
    try {
      const res = await authApi.register(username, password, displayName);
      setToken(res.token);
      const user: AuthUser = { ...res.user, wallet: res.wallet };
      set({ user, status: 'authenticated' });
      activateSession(user);
      return true;
    } catch (e) {
      set({ status: 'unauthenticated', error: e instanceof Error ? e.message : 'Registration failed' });
      return false;
    }
  },

  async login(username, password) {
    set({ status: 'loading', error: null });
    try {
      const res = await authApi.login(username, password);
      setToken(res.token);
      const user: AuthUser = { ...res.user, wallet: res.wallet };
      set({ user, status: 'authenticated' });
      activateSession(user);
      return true;
    } catch (e) {
      set({ status: 'unauthenticated', error: e instanceof Error ? e.message : 'Login failed' });
      return false;
    }
  },

  logout() {
    clearToken();
    socketService.disconnect();
    useGameStore.getState().resetGame();
    useLobbyStore.getState().reset();
    set({ user: null, status: 'unauthenticated', error: null });
  },

  async restoreSession() {
    if (!getToken()) {
      set({ status: 'unauthenticated' });
      return;
    }
    set({ status: 'loading' });
    try {
      const me = await authApi.me();
      const user: AuthUser = { ...me.user, wallet: me.wallet };
      set({ user, status: 'authenticated' });
      activateSession(user);
    } catch {
      // Invalid/expired token — drop it silently and require login.
      clearToken();
      set({ user: null, status: 'unauthenticated' });
    }
  },

  async refreshWallet() {
    if (!get().user) return;
    try {
      const wallet = await walletApi.get();
      set(s => (s.user ? { user: { ...s.user, wallet } } : {}));
    } catch {
      // non-fatal
    }
  },

  // Apply authoritative balances returned by a mutating call (room entry today;
  // payouts/refunds later) so every wallet readout updates without a refetch.
  setWallet(wallet) {
    set(s => (s.user ? { user: { ...s.user, wallet } } : {}));
  },

  clearError() {
    set({ error: null });
  },
}));

// A 401 from any request expires the session consistently.
setUnauthorizedHandler(() => {
  if (useAuthStore.getState().status !== 'unauthenticated') {
    useAuthStore.getState().logout();
  }
});
