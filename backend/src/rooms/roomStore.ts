import { Room } from "../types";

// ─────────────────────────────────────────────
// In-memory store
// Map<roomId, Room>
// ─────────────────────────────────────────────

const rooms = new Map<string, Room>();

export const roomStore = {
  get(roomId: string): Room | undefined {
    return rooms.get(roomId);
  },

  set(room: Room): void {
    rooms.set(room.roomId, room);
  },

  delete(roomId: string): boolean {
    return rooms.delete(roomId);
  },

  all(): Room[] {
    return Array.from(rooms.values());
  },

  has(roomId: string): boolean {
    return rooms.has(roomId);
  },

  size(): number {
    return rooms.size;
  },
};
