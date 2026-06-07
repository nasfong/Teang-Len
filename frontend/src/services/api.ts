// Backend base URL — override via VITE_API_URL env var
const BASE = (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:4000';

// ─── Backend response shapes ──────────────────────────────────────────────────

export interface PlayerData {
  playerId: string;
  name: string;
  status: string;
  seatIndex: number | null;
  isGuest: boolean;
  connectedAt: number;
  reconnectedAt: number | null;
}

export interface PlayerSnapshot {
  playerId: string;
  name: string;
  status: string;
  seatIndex: number | null;
  isOnline: boolean;
}

export interface RoomSnapshot {
  roomId: string;
  hostPlayerId: string;
  players: PlayerSnapshot[];
  status: 'waiting' | 'starting' | 'playing' | 'finished';
  gameState: unknown;
  version: number;
  maxPlayers: number;
  createdAt: number;
  updatedAt: number;
}

// ─── Internal fetch helper ────────────────────────────────────────────────────

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  });
  const body = (await res.json()) as { ok: boolean; data?: T; error?: string };
  if (!body.ok) throw new Error(body.error ?? `Request failed: ${res.status}`);
  return body.data as T;
}

// ─── API surface ──────────────────────────────────────────────────────────────

export const api = {
  /**
   * POST /api/players/guest
   * Schema: CreateGuestPlayerSchema — { name: string (1-24 chars, trimmed) }
   */
  createGuest(name: string): Promise<PlayerData> {
    return request<PlayerData>('/api/players/guest', {
      method: 'POST',
      body: JSON.stringify({ name }),
    });
  },

  /**
   * POST /api/rooms
   * Schema: CreateRoomSchema — { playerId: UUID, maxPlayers?: 2-4 (default 4) }
   */
  createRoom(playerId: string, maxPlayers: number = 4): Promise<RoomSnapshot> {
    return request<RoomSnapshot>('/api/rooms', {
      method: 'POST',
      body: JSON.stringify({ playerId, maxPlayers }),
    });
  },

  /**
   * GET /api/rooms — returns all waiting rooms
   */
  listRooms(): Promise<RoomSnapshot[]> {
    return request<RoomSnapshot[]>('/api/rooms');
  },

  /**
   * GET /api/rooms/:roomId
   */
  getRoom(roomId: string): Promise<RoomSnapshot> {
    return request<RoomSnapshot>(`/api/rooms/${roomId}`);
  },

  /**
   * POST /api/rooms/:roomId/join
   * Schema: JoinRoomSchema — { playerId: UUID }
   */
  joinRoom(roomId: string, playerId: string): Promise<RoomSnapshot> {
    return request<RoomSnapshot>(`/api/rooms/${roomId}/join`, {
      method: 'POST',
      body: JSON.stringify({ playerId }),
    });
  },

  /**
   * POST /api/rooms/:roomId/leave
   * Schema: LeaveRoomSchema — { playerId: UUID }
   */
  leaveRoom(roomId: string, playerId: string): Promise<RoomSnapshot> {
    return request<RoomSnapshot>(`/api/rooms/${roomId}/leave`, {
      method: 'POST',
      body: JSON.stringify({ playerId }),
    });
  },
};
