import type { PlayerId } from '../../../game/types';

interface SeatMapping {
  seatBottom: PlayerId;
  seatRight: PlayerId;
  seatTop: PlayerId;
  seatLeft: PlayerId;
}

export function useSeatMapping(localSeatIndex: number | null): SeatMapping {
  const s = localSeatIndex ?? 0;
  return {
    seatBottom: s as PlayerId,
    seatRight:  ((s + 1) % 4) as PlayerId,
    seatTop:    ((s + 2) % 4) as PlayerId,
    seatLeft:   ((s + 3) % 4) as PlayerId,
  };
}
