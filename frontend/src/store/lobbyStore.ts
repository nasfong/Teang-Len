import { create } from 'zustand';
import type { RoomSnapshot } from '../services/api';

// ─── Store interface ──────────────────────────────────────────────────────────

interface LobbyStore {
  /** Backend UUID assigned by POST /api/players/guest */
  playerId: string | null;
  playerName: string | null;

  /** Backend UUID assigned by POST /api/rooms or POST /api/rooms/:id/join */
  roomId: string | null;

  /** Latest RoomSnapshot from room:update or REST response */
  room: RoomSnapshot | null;

  /**
   * Maps engine seat index (0–3) → backend playerId UUID.
   * Required to build game:play rankings payload:
   *   rankings: { playerId: UUID, rank: number }[]
   * Rebuilt whenever setRoom() is called.
   */
  seatToPlayerId: Record<number, string>;

  /**
   * The local player's seat index (0–3) within the room.
   * Engine seat i === backend seatIndex i.
   * Used by GamePage to rotate the table so local player is always at bottom.
   */
  localSeatIndex: number | null;

  // ── Actions ────────────────────────────────────────────────────────────────

  setPlayer(playerId: string, name: string): void;
  setRoom(room: RoomSnapshot): void;
  clearRoom(): void;
  reset(): void;
}

// ─── Store ────────────────────────────────────────────────────────────────────

export const useLobbyStore = create<LobbyStore>((set, get) => ({
  playerId: null,
  playerName: null,
  roomId: null,
  room: null,
  seatToPlayerId: {},
  localSeatIndex: null,

  setPlayer(playerId, name) {
    set({ playerId, playerName: name });
  },

  setRoom(room) {
    const { playerId } = get();
    const seatToPlayerId: Record<number, string> = {};
    let localSeatIndex: number | null = null;

    for (const p of room.players) {
      if (p.seatIndex !== null) {
        seatToPlayerId[p.seatIndex] = p.playerId;
        if (p.playerId === playerId) localSeatIndex = p.seatIndex;
      }
    }

    set({ room, roomId: room.roomId, seatToPlayerId, localSeatIndex });
  },

  clearRoom() {
    set({ room: null, roomId: null, seatToPlayerId: {}, localSeatIndex: null });
  },

  reset() {
    set({
      playerId: null,
      playerName: null,
      room: null,
      roomId: null,
      seatToPlayerId: {},
      localSeatIndex: null,
    });
  },
}));
