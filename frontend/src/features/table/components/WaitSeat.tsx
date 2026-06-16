import type { RoomSnapshot } from '../../../services/api';
import { C, FONT, stroke } from './gametable/tokens';
import { Avatar } from './gametable/Avatar';

interface WaitSeatProps {
  seatIdx: number | null;
  room: RoomSnapshot | null;
  playerId: string | null;
  closed: boolean;
}

function Badge({ label, kind }: { label: string; kind: 'host' | 'you' }) {
  const bg = kind === 'host' ? C.gold : '#6CC3FF';
  const rim = kind === 'host' ? C.goldDeep : '#1E5FA0';
  return (
    <span
      style={{
        padding: '1px 8px',
        borderRadius: 8,
        background: bg,
        border: `1.5px solid ${rim}`,
        fontFamily: FONT,
        fontSize: 10,
        letterSpacing: 0.5,
        color: C.textStroke,
      }}
    >
      {label}
    </span>
  );
}

/** Empty / closed / waiting placeholder ring. */
function PlaceholderSeat({ icon, label }: { icon: string; label: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, opacity: 0.7 }}>
      <div
        style={{
          width: 54,
          height: 54,
          borderRadius: '50%',
          border: '2px dashed rgba(255,255,255,0.35)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 20,
          color: 'rgba(255,255,255,0.6)',
        }}
      >
        {icon}
      </div>
      <span style={{ fontFamily: FONT, fontSize: 12, color: 'rgba(255,255,255,0.7)' }}>{label}</span>
    </div>
  );
}

export function WaitSeat({ seatIdx, room, playerId, closed }: WaitSeatProps) {
  if (closed || seatIdx === null) {
    return <PlaceholderSeat icon="—" label="Closed" />;
  }

  const p = room?.players.find(rp => rp.seatIndex === seatIdx);

  if (!p) {
    return <PlaceholderSeat icon="⏳" label="Waiting…" />;
  }

  const isLocal = p.playerId === playerId;
  const isHost = room !== null && p.playerId === room.hostPlayerId;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
      <div style={{ position: 'relative' }}>
        <Avatar name={p.name} size={56} active={isLocal} />
        <span
          style={{
            position: 'absolute',
            bottom: 2,
            right: 2,
            width: 12,
            height: 12,
            borderRadius: '50%',
            background: p.isOnline ? '#4ade80' : '#888',
            border: '2px solid #0A2A35',
          }}
        />
      </div>

      <span style={{ fontFamily: FONT, fontSize: 15, color: '#fff', textShadow: stroke(C.textStroke, 1.5) }}>
        {p.name}
      </span>

      {(isHost || isLocal) && (
        <div style={{ display: 'flex', gap: 5 }}>
          {isHost && <Badge label="HOST" kind="host" />}
          {isLocal && <Badge label="YOU" kind="you" />}
        </div>
      )}
    </div>
  );
}
