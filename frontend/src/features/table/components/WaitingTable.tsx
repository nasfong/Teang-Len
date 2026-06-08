import type { RoomSnapshot } from '../../../services/api';
import { WaitSeat } from './WaitSeat';

interface WaitingTableProps {
  roomIdParam: string;
  room: RoomSnapshot | null;
  playerId: string | null;
  maxSeats: number;
  seats: { bottom: number; right: number; top: number; left: number };
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
  return (
    <div className="game-root">
      <div className="table">
        <div className="table__top">
          <WaitSeat seatIdx={seats.top} room={room} playerId={playerId} closed={seats.top >= maxSeats} />
        </div>

        <div className="table__middle">
          <div className="table__side table__side--left">
            <WaitSeat seatIdx={seats.left} room={room} playerId={playerId} closed={seats.left >= maxSeats} />
          </div>

          <div className="table__center">
            <div style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14,
              padding: '18px 20px',
              background: 'rgba(0,0,0,0.58)',
              borderRadius: 12,
              border: '1px solid rgba(255,255,255,0.09)',
              minWidth: 160,
            }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 10, opacity: 0.4, letterSpacing: 1.5, marginBottom: 4 }}>TABLE</div>
                <div style={{ fontWeight: 700, fontSize: 14, letterSpacing: 1 }}>
                  {roomIdParam.slice(0, 8).toUpperCase()}
                </div>
                <div style={{ opacity: 0.45, fontSize: 12, marginTop: 5 }}>
                  {playerCount}/{maxSeats} seated
                </div>
              </div>

              {isHost ? (
                <button
                  className="btn btn--deal"
                  onClick={onStart}
                  disabled={playerCount < 2}
                  style={{ width: '100%', fontSize: 13 }}
                >
                  {playerCount < 2 ? `Need ${2 - playerCount} more` : 'Start Game ▶'}
                </button>
              ) : (
                <div style={{ opacity: 0.45, fontSize: 12, textAlign: 'center', lineHeight: 1.5 }}>
                  Waiting for host<br />to start…
                </div>
              )}

              <button
                className="btn"
                onClick={onLeave}
                style={{ width: '100%', fontSize: 12 }}
              >
                Leave Table
              </button>
            </div>
          </div>

          <div className="table__side table__side--right">
            <WaitSeat seatIdx={seats.right} room={room} playerId={playerId} closed={seats.right >= maxSeats} />
          </div>
        </div>

        <div className="table__bottom">
          <WaitSeat seatIdx={seats.bottom} room={room} playerId={playerId} closed={seats.bottom >= maxSeats} />
        </div>
      </div>
    </div>
  );
}
