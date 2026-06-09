import type { PlayerId } from '../../../game/types';

export interface SeatMapping {
  seatBottom: PlayerId;
  seatRight:  PlayerId | null;
  seatTop:    PlayerId | null;
  seatLeft:   PlayerId | null;
}

/**
 * Maps screen positions to engine seat indices for the local player's perspective.
 *
 * 2 players → face-to-face: bottom + top only
 * 3 players → triangle:     bottom + right + top
 * 4 players → all four sides
 *
 * null means no player occupies that screen position.
 */
export function useSeatMapping(localSeatIndex: number | null, numPlayers = 4): SeatMapping {
  const s = localSeatIndex ?? 0;

  if (numPlayers === 2) {
    return {
      seatBottom: s as PlayerId,
      seatRight:  null,
      seatTop:    ((s + 1) % 2) as PlayerId,
      seatLeft:   null,
    };
  }

  if (numPlayers === 3) {
    return {
      seatBottom: s as PlayerId,
      seatRight:  ((s + 1) % 3) as PlayerId,
      seatTop:    ((s + 2) % 3) as PlayerId,
      seatLeft:   null,
    };
  }

  return {
    seatBottom: s as PlayerId,
    seatRight:  ((s + 1) % 4) as PlayerId,
    seatTop:    ((s + 2) % 4) as PlayerId,
    seatLeft:   ((s + 3) % 4) as PlayerId,
  };
}
