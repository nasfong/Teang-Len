import type { PlayerId } from '../../../game/types';
import type { RoomSnapshot } from '../../../services/api';
import { TableHUD } from './TableHUD';
import { WaitSeat } from './WaitSeat';

interface WaitingTableProps {
  roomIdParam: string;
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
  roomIdParam,
  room,
  playerId,
  maxSeats,
  seats,
  playerCount,
  isHost,
  onStart,
  onLeave,
}: WaitingTableProps) {
  const localPlayerName = room?.players.find(p => p.playerId === playerId)?.name ?? null;
  const tableClass = maxSeats === 2 ? 'table table--two-player' : 'table';

  return (
    <div className="game-root">
      <div className={tableClass}>

        <div className="table__hud">
          <TableHUD
            playerName={localPlayerName}
            roomId={roomIdParam}
            playerCount={playerCount}
            maxSeats={maxSeats}
          />
        </div>

        <div className="table__top">
          <WaitSeat seatIdx={seats.top} room={room} playerId={playerId} closed={seats.top === null} />
        </div>

        <div className="table__middle">
          <div className="table__side table__side--left">
            <WaitSeat seatIdx={seats.left} room={room} playerId={playerId} closed={seats.left === null} />
          </div>

          <div className="table__center">
            <div className="wait-center">
              <span className="wait-center__label">TABLE</span>
              <span className="wait-center__code">{roomIdParam.slice(0, 8).toUpperCase()}</span>
              <span className="wait-center__count">{playerCount}/{maxSeats} seated</span>
              <div className="wait-center__actions">
                {isHost ? (
                  <button
                    className="btn btn--deal"
                    onClick={onStart}
                    disabled={playerCount < 2}
                    style={{ width: '100%', fontSize: '0.85rem', padding: '12px 20px' }}
                  >
                    {playerCount < 2 ? `Need ${2 - playerCount} more` : 'START GAME ▶'}
                  </button>
                ) : (
                  <div style={{ fontSize: '0.70rem', color: 'var(--text-muted)', textAlign: 'center', lineHeight: 1.5 }}>
                    Waiting for host<br />to start…
                  </div>
                )}
                <button className="btn btn--leave" onClick={onLeave}>
                  Leave Table
                </button>
              </div>
            </div>
          </div>

          <div className="table__side table__side--right">
            <WaitSeat seatIdx={seats.right} room={room} playerId={playerId} closed={seats.right === null} />
          </div>
        </div>

        <div className="table__bottom" style={{ padding: '10px 0 12px' }}>
          <WaitSeat seatIdx={seats.bottom} room={room} playerId={playerId} closed={false} />
        </div>

      </div>
    </div>
  );
}
