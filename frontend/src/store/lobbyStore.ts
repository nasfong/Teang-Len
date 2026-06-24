import { create } from 'zustand';
import type { RoomSnapshot } from '../services/api';

// ─── Store interface ──────────────────────────────────────────────────────────

interface LobbyStore {
  playerId:   string | null;
  playerName: string | null;
  roomId:     string | null;
  room:       RoomSnapshot | null;
  seatToPlayerId: Record<number, string>;
  localSeatIndex: number | null;
  pendingLeave:   boolean;

  setPlayer(playerId: string, name: string): void;
  setRoom(room: RoomSnapshot): void;
  clearRoom(): void;
  setPendingLeave(val: boolean): void;
  reset(): void;
}

// ─── Store ────────────────────────────────────────────────────────────────────
// Network identity (playerId === authenticated user id) is populated by the auth
// store after a session is restored or established — never persisted here. The
// JWT (services/http.ts) is the only persisted credential.

export const useLobbyStore = create<LobbyStore>((set, get) => ({
  playerId:       null,
  playerName:     null,
  roomId:         null,
  room:           null,
  seatToPlayerId: {},
  localSeatIndex: null,
  pendingLeave:   false,

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
    set({ room: null, roomId: null, seatToPlayerId: {}, localSeatIndex: null, pendingLeave: false });
  },

  setPendingLeave(val) {
    set({ pendingLeave: val });
  },

  reset() {
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
