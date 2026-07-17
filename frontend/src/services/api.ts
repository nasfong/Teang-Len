// Barrel for the service layer. Prefer importing the dedicated modules
// (authApi / roomApi / walletApi) in new code; this re-export keeps existing
// `import { RoomSnapshot } from '../services/api'` paths working.

export { getToken, setToken, clearToken, setUnauthorizedHandler } from './http';

export { authApi } from './authApi';
export type { PublicUser, WalletBalances, AuthResult, MeResult } from './authApi';

export { walletApi } from './walletApi';

export { roomApi } from './roomApi';
export type { RoomSnapshot, PlayerSnapshot, CreateRoomInput, RoomEntryResult } from './roomApi';
