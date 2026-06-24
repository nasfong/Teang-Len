// ─────────────────────────────────────────────
// Player
// ─────────────────────────────────────────────

export type PlayerStatus = "waiting" | "ready" | "playing" | "finished" | "disconnected";

// A room participant — the in-room session for an authenticated user.
// `playerId` is the user's account id (User.id); identity/wallet live in the
// user/wallet modules, this shape only carries transient room session state.
export interface Player {
  playerId: string;             // === User.id
  name: string;                 // User.displayName at join time
  socketId: string | null;
  status: PlayerStatus;
  seatIndex: number | null;     // 0-3 seat in the room
  connectedAt: number;
  reconnectedAt: number | null;
}

// ─────────────────────────────────────────────
// Room
// ─────────────────────────────────────────────

export type RoomStatus = "waiting" | "starting" | "playing" | "finished";

export interface Room {
  roomId: string;
  name: string;                       // display label chosen at creation
  hostPlayerId: string;               // === host User.id
  betCoin: number;                    // coin stake for the table (0 = free)
  players: Player[];                  // max 4
  status: RoomStatus;
  gameState: unknown;                 // opaque — backend never interprets this
  version: number;                    // increments on every state update
  createdAt: number;
  updatedAt: number;
  maxPlayers: number;
  turnStartedAt: number | null;       // epoch ms when current turn timer started
  turnDurationMs: number;             // timer per turn (set from game:start payload)
  pendingLeavePlayerIds: string[];    // playerIds queued to leave after match ends
}

// ─────────────────────────────────────────────
// API request/response shapes (validated by Zod in routes)
// ─────────────────────────────────────────────

// Room creation body — the owner is derived from the authenticated user, not
// passed in the body. Join/leave carry no body (also derived from the token).
export interface CreateRoomBody {
  name: string;
  betCoin: number;
  maxPlayers?: number;
}

// ─────────────────────────────────────────────
// Socket payloads  (Client → Server)
// ─────────────────────────────────────────────

export interface SocketRoomJoinPayload {
  roomId: string;
  playerId: string;
}

export interface SocketRoomLeavePayload {
  roomId: string;
  playerId: string;
}

export interface SocketPlayerReadyPayload {
  roomId: string;
  playerId: string;
}

export interface SocketGameStartPayload {
  roomId: string;
  playerId: string;         // must be host
  initialGameState: unknown; // frontend engine sends initial state
}

export interface SocketGamePlayPayload {
  roomId: string;
  playerId: string;
  gameState: unknown;        // full updated state from frontend engine
}

export interface SocketGameSkipPayload {
  roomId: string;
  playerId: string;
  gameState: unknown;
}

// ─────────────────────────────────────────────
// Socket payloads  (Server → Client)
// ─────────────────────────────────────────────

export interface RoomUpdatePayload {
  room: RoomSnapshot;
}

export interface GameUpdatePayload {
  roomId: string;
  gameState: unknown;
  version: number;
  triggeredBy: string;       // playerId
  turnStartedAt?: number;    // epoch ms — included when a new turn begins
}

export interface TurnUpdatePayload {
  roomId: string;
  currentPlayerId: string;
  version: number;
}

export interface PlayerFinishedPayload {
  roomId: string;
  playerId: string;
  rank: number;
}

export interface GameEndPayload {
  roomId: string;
  rankings: { playerId: string; rank: number }[];
  gameState: unknown;
}

export interface PlayerDisconnectedPayload {
  roomId: string;
  playerId: string;
}

export interface TurnTimeoutPayload {
  roomId: string;
}

// ─────────────────────────────────────────────
// Room snapshot (safe public shape for API/sockets)
// ─────────────────────────────────────────────

export interface RoomSnapshot {
  roomId: string;
  name: string;
  hostPlayerId: string;
  betCoin: number;
  players: PlayerSnapshot[];
  status: RoomStatus;
  gameState: unknown;
  version: number;
  maxPlayers: number;
  createdAt: number;
  updatedAt: number;
  turnStartedAt: number | null;
  turnDurationMs: number;
  pendingLeavePlayerIds: string[];
}

export interface PlayerSnapshot {
  playerId: string;
  name: string;
  status: PlayerStatus;
  seatIndex: number | null;
  isOnline: boolean;           // derived: socketId !== null
}

// ─────────────────────────────────────────────
// Service result wrapper
// ─────────────────────────────────────────────

export type ServiceResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string; code: number };
