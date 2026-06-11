import type { PlayerId } from '../../../game/types';
import type { RoomSnapshot } from '../../../services/api';
import { WaitSeat } from './WaitSeat';

interface WaitingTableProps {
  room: RoomSnapshot | null;
  playerId: string | null;
  maxSeats: number;
  seats: { bottom: PlayerId; right: PlayerId | null; top: PlayerId | null; left: PlayerId | null };
  playerCount: number;
  isHost: boolean;
  onStart: () => void;
  onLeave: () => void;
}

export function WaitingTable({
  room,
  playerId,
  maxSeats,
  seats,
  playerCount,
  isHost,
  onStart,
  onLeave,
}: WaitingTableProps) {
  const tableClass = [
    'table',
    'table--waiting',
    maxSeats === 2 ? 'table--two-player' : '',
  ].filter(Boolean).join(' ');

  return (
    <div className="game-root">
      <button className="wait-leave" onClick={onLeave} aria-label="Leave table">← Leave</button>

      <div className={tableClass}>

        <div className="table__top">
          <WaitSeat seatIdx={seats.top} room={room} playerId={playerId} closed={seats.top === null} />
        </div>

        <div className="table__middle">
          <div className="table__side table__side--left">
            <WaitSeat seatIdx={seats.left} room={room} playerId={playerId} closed={seats.left === null} />
          </div>

          <div className="table__center">
            <div className="wait-center">
              {isHost ? (
                <button
                  className="btn btn--deal"
                  onClick={onStart}
                  disabled={playerCount < 2}
                >
                  {playerCount < 2 ? `Need ${2 - playerCount} more` : 'START GAME ▶'}
                </button>
              ) : (
                <div className="wait-center__waiting">
                  <span className="wait-center__waiting-text">Waiting for host</span>
                  <div className="wait-dots">
                    <span /><span /><span />
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="table__side table__side--right">
            <WaitSeat seatIdx={seats.right} room={room} playerId={playerId} closed={seats.right === null} />
          </div>
        </div>

        <div className="table__bottom">
          <WaitSeat seatIdx={seats.bottom} room={room} playerId={playerId} closed={false} />
        </div>

      </div>
    </div>
  );
}
