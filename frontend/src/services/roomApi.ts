import { request } from './http';

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

// ─── Room API ─────────────────────────────────────────────────────────────────
// The owner/joiner/leaver is always derived from the JWT on the backend — these
// calls never send a playerId.

export const roomApi = {
  /** POST /api/rooms — body: { name, betCoin, maxPlayers }. */
  create(input: CreateRoomInput): Promise<RoomSnapshot> {
    return request<RoomSnapshot>('/api/rooms', {
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

  /** POST /api/rooms/:roomId/join */
  join(roomId: string): Promise<RoomSnapshot> {
    return request<RoomSnapshot>(`/api/rooms/${roomId}/join`, { method: 'POST' });
  },

  /** POST /api/rooms/:roomId/leave */
  leave(roomId: string): Promise<RoomSnapshot> {
    return request<RoomSnapshot>(`/api/rooms/${roomId}/leave`, { method: 'POST' });
  },
};
