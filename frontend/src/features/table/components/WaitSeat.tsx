import type { RoomSnapshot } from '../../../services/api';

interface WaitSeatProps {
  seatIdx: number | null;
  room: RoomSnapshot | null;
  playerId: string | null;
  closed: boolean;
}

export function WaitSeat({ seatIdx, room, playerId, closed }: WaitSeatProps) {
  if (closed || seatIdx === null) {
    return (
      <div className="wait-seat wait-seat--closed">
        <div className="wait-seat__card">
          <div className="wait-seat__avatar wait-seat--empty">—</div>
          <span className="wait-seat__waiting">Closed</span>
        </div>
      </div>
    );
  }

  const p         = room?.players.find(rp => rp.seatIndex === seatIdx);
  const isLocal   = p?.playerId === playerId;
  const isHost    = room !== null && p?.playerId === room.hostPlayerId;

  if (!p) {
    return (
      <div className="wait-seat wait-seat--empty">
        <div className="wait-seat__card">
          <div className="wait-seat__avatar">⏳</div>
          <span className="wait-seat__waiting">Waiting…</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`wait-seat${isLocal ? ' wait-seat--local' : ''}`}>
      <div className="wait-seat__card">
        <div className={`wait-seat__avatar${isLocal ? ' wait-seat__avatar--local' : ''}`}>
          {p.name[0].toUpperCase()}
          <span className={`wait-seat__online-dot${p.isOnline ? ' wait-seat__online-dot--on' : ''}`} />
        </div>
        <div className="wait-seat__meta">
          <span className="wait-seat__name">{p.name}</span>
          <div className="wait-seat__badges">
            {isHost  && <span className="wait-seat__badge wait-seat__badge--host">HOST</span>}
            {isLocal && <span className="wait-seat__badge wait-seat__badge--you">YOU</span>}
          </div>
          {isLocal && <span className="wait-seat__coins">💰 0</span>}
        </div>
      </div>
    </div>
  );
}
