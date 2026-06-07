import { create } from 'zustand';
import type { RoomSnapshot } from '../services/api';

const LS_ID   = 'tl_playerId';
const LS_NAME = 'tl_playerName';

// ─── Store interface ──────────────────────────────────────────────────────────

interface LobbyStore {
  playerId:   string | null;
  playerName: string | null;
  roomId:     string | null;
  room:       RoomSnapshot | null;
  seatToPlayerId: Record<number, string>;
  localSeatIndex: number | null;

  setPlayer(playerId: string, name: string): void;
  setRoom(room: RoomSnapshot): void;
  clearRoom(): void;
  reset(): void;
}

// ─── Store ────────────────────────────────────────────────────────────────────
// playerId + playerName are seeded from localStorage on first render.
// This means RequireAuth guards pass immediately on refresh without a
// bootstrap effect — no flash of the login page.

export const useLobbyStore = create<LobbyStore>((set, get) => ({
  playerId:       localStorage.getItem(LS_ID),
  playerName:     localStorage.getItem(LS_NAME),
  roomId:         null,
  room:           null,
  seatToPlayerId: {},
  localSeatIndex: null,

  setPlayer(playerId, name) {
    localStorage.setItem(LS_ID, playerId);
    localStorage.setItem(LS_NAME, name);
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
    localStorage.removeItem(LS_ID);
    localStorage.removeItem(LS_NAME);
    set({
      playerId:       null,
      playerName:     null,
      room:           null,
      roomId:         null,
      seatToPlayerId: {},
      localSeatIndex: null,
    });
  },
}));
