import { Server } from "socket.io";
import { SERVER_EVENTS } from "../types/events";
import { roomStore } from "../rooms/roomStore";

// Map<roomId, NodeJS timeout handle>
// Kept outside Room because NodeJS.Timeout is not serializable.
const timers = new Map<string, ReturnType<typeof setTimeout>>();

/**
 * Start (or restart) the turn timer for a room.
 *
 * - Clears any running timer for this room.
 * - Stores `turnStartedAt` and (optionally) `turnDurationMs` on the Room for
 *   page-refresh recovery via RoomSnapshot.
 * - Emits `turn:timeout` to the room channel when the timer fires.
 *
 * Returns the `turnStartedAt` timestamp so the caller can include it in the
 * `game:update` broadcast. Returns `null` if the room is not found or
 * `turnDurationMs` is 0 (timer disabled).
 */
export function startTurnTimer(
  io: Server,
  roomId: string,
  durationMsOverride?: number,
): number | null {
  clearTurnTimer(roomId);

  const room = roomStore.get(roomId);
  if (!room) return null;

  const durationMs = durationMsOverride ?? room.turnDurationMs;
  if (durationMs <= 0) return null;

  const turnStartedAt = Date.now();

  // Persist on room so page-refresh clients can recover via RoomSnapshot
  roomStore.set({ ...room, turnStartedAt, turnDurationMs: durationMs });

  const handle = setTimeout(() => {
    timers.delete(roomId);
    io.to(roomId).emit(SERVER_EVENTS.TURN_TIMEOUT, { roomId });
  }, durationMs);

  timers.set(roomId, handle);
  return turnStartedAt;
}

/** Cancel the running turn timer for a room, if any. */
export function clearTurnTimer(roomId: string): void {
  const handle = timers.get(roomId);
  if (handle !== undefined) {
    clearTimeout(handle);
    timers.delete(roomId);
  }
}
