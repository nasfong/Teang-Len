import { request } from './http';
import type { WalletBalances } from './authApi';

// ─── Room types ─────────────────────────────────────────────────────────────────

export interface PlayerSnapshot {
  playerId: string;
  name: string;
  status: string;
  seatIndex: number | null;
  isOnline: boolean;
}

export interface RoomSnapshot {
  roomId: string;
  name: string;
  hostPlayerId: string;
  betCoin: number;
  players: PlayerSnapshot[];
  status: 'waiting' | 'starting' | 'playing' | 'finished';
  gameState: unknown;
  version: number;
  maxPlayers: number;
  createdAt: number;
  updatedAt: number;
  turnStartedAt: number | null;
  turnDurationMs: number;
  pendingLeavePlayerIds: string[];
}

export interface CreateRoomInput {
  name: string;
  betCoin: number;
  maxPlayers?: number;
}

// Entry to a room settles the stake on the backend, so create/join return the
// room alongside the payer's fresh wallet balances for an immediate UI update.
export interface RoomEntryResult {
  room: RoomSnapshot;
  wallet: WalletBalances;
}

// ─── Room API ─────────────────────────────────────────────────────────────────
// The owner/joiner/leaver is always derived from the JWT on the backend — these
// calls never send a playerId.

export const roomApi = {
  /** POST /api/rooms — body: { name, betCoin, maxPlayers }. Charges the host's stake. */
  create(input: CreateRoomInput): Promise<RoomEntryResult> {
    return request<RoomEntryResult>('/api/rooms', {
      method: 'POST',
      body: JSON.stringify({ maxPlayers: 4, ...input }),
    });
  },

  /** GET /api/rooms — waiting rooms. */
  list(): Promise<RoomSnapshot[]> {
    return request<RoomSnapshot[]>('/api/rooms');
  },

  /** GET /api/rooms/:roomId */
  get(roomId: string): Promise<RoomSnapshot> {
    return request<RoomSnapshot>(`/api/rooms/${roomId}`);
  },

  /** POST /api/rooms/:roomId/join — charges the entry fee on a new seat. */
  join(roomId: string): Promise<RoomEntryResult> {
    return request<RoomEntryResult>(`/api/rooms/${roomId}/join`, { method: 'POST' });
  },

  /** POST /api/rooms/:roomId/leave */
  leave(roomId: string): Promise<RoomSnapshot> {
    return request<RoomSnapshot>(`/api/rooms/${roomId}/leave`, { method: 'POST' });
  },
};
