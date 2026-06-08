import type { RoomSnapshot } from '../../../services/api';

interface WaitSeatProps {
  seatIdx: number;
  room: RoomSnapshot | null;
  playerId: string | null;
  closed: boolean;
}

export function WaitSeat({ seatIdx, room, playerId, closed }: WaitSeatProps) {
  if (closed) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, opacity: 0.12 }}>
        <div style={{
          width: 36, height: 36, borderRadius: '50%',
          border: '2px solid rgba(255,255,255,0.3)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 13,
        }}>—</div>
        <div style={{ fontSize: 10, letterSpacing: 0.5 }}>Closed</div>
      </div>
    );
  }

  const p         = room?.players.find(rp => rp.seatIndex === seatIdx);
  const isLocal    = p?.playerId === playerId;
  const isHostSeat = room !== null && p?.playerId === room.hostPlayerId;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 }}>
      <div style={{
        position: 'relative',
        width: 40, height: 40, borderRadius: '50%',
        background: p
          ? (isLocal ? 'rgba(99,102,241,0.25)' : 'rgba(255,255,255,0.1)')
          : 'rgba(255,255,255,0.03)',
        border: `2px ${p ? 'solid' : 'dashed'} ${p
          ? (isLocal ? 'rgba(99,102,241,0.55)' : 'rgba(255,255,255,0.2)')
          : 'rgba(255,255,255,0.12)'}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 18, transition: 'all 0.2s',
      }}>
        {p ? (isLocal ? '🧑' : '👤') : '⏳'}
        {p && (
          <div style={{
            position: 'absolute', bottom: 0, right: 0,
            width: 10, height: 10, borderRadius: '50%',
            background: p.isOnline ? '#4ade80' : '#6b7280',
            border: '2px solid rgba(15,20,30,0.8)',
          }} />
        )}
      </div>
      <div style={{ textAlign: 'center', lineHeight: 1.3 }}>
        {p ? (
          <>
            <div style={{ fontSize: 12, fontWeight: 600 }}>
              {p.name}{isHostSeat ? ' 👑' : ''}
            </div>
            {isLocal && <div style={{ fontSize: 10, opacity: 0.5 }}>You</div>}
          </>
        ) : (
          <div style={{ fontSize: 11, opacity: 0.3 }}>Waiting…</div>
        )}
      </div>
    </div>
  );
}
