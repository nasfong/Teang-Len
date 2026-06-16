import { useState } from 'react';
import type { RoomSnapshot } from '../../../services/api';

// ── Cartoon design tokens (shared chunky blue identity) ───────────────────────
const C = {
  cardTop: '#5FB4F2',
  cardMid: '#3C93DB',
  cardDeep: '#2B7FC9',
  cardEdge: '#1B4E86',
  seatEmpty: 'rgba(20,60,110,0.45)',
  seatEdge: '#1B4E86',
  accent: '#FFD27A',
  btnOuter: '#2F6614',
  btnFaceTop: '#8FE04A',
  btnFaceMid: '#6FCB33',
  btnFaceBot: '#5BB528',
  btnBase: '#3F861C',
  btnBaseDark: '#2F6614',
} as const;

const FONT = "'Lilita One', 'Fredoka', 'Comic Sans MS', cursive";
const DEPTH = 5;

// Deterministic friendly-ish label derived from the real roomId (no fake data).
function roomLabel(room: RoomSnapshot): string {
  const host = room.players.find(p => p.playerId === room.hostPlayerId);
  if (host?.name) return `${host.name}'s Room`;
  return `Room ${room.roomId.slice(0, 4).toUpperCase()}`;
}

const SeatAvatar = () => (
  <div
    style={{
      width: 44,
      height: 44,
      borderRadius: 14,
      background: 'linear-gradient(180deg, #FFE08A 0%, #FFB23E 100%)',
      border: `3px solid ${C.cardEdge}`,
      overflow: 'hidden',
      flexShrink: 0,
      boxShadow: 'inset 0 2px 0 rgba(255,255,255,0.45)',
    }}
  >
    <img
      src="/profile.png"
      alt="player"
      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
    />
  </div>
);

const SeatEmpty = ({ plus }: { plus: boolean }) => (
  <div
    style={{
      width: 44,
      height: 44,
      borderRadius: 14,
      background: C.seatEmpty,
      border: `3px solid ${C.seatEdge}`,
      flexShrink: 0,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      boxShadow: 'inset 0 3px 6px rgba(0,0,0,0.35)',
    }}
  >
    {plus && (
      <span
        style={{
          fontFamily: FONT,
          fontSize: 26,
          lineHeight: 1,
          color: '#fff',
          textShadow: '0 2px 2px rgba(0,0,0,0.4)',
        }}
      >
        +
      </span>
    )}
  </div>
);

interface RoomCardProps {
  room: RoomSnapshot;
  joiningRoomId: string | null;
  isBusy: boolean;
  onJoin: (roomId: string) => void;
}

export function RoomCard({ room, joiningRoomId, isBusy, onJoin }: RoomCardProps) {
  const [pressed, setPressed] = useState(false);
  const [hovered, setHovered] = useState(false);

  const filled = room.players.length;
  const full = filled >= room.maxPlayers;
  const isJoiningThis = joiningRoomId === room.roomId;

  // Render maxPlayers seats: filled → avatar, first empty → "+", rest → blank.
  const seats = Array.from({ length: room.maxPlayers }, (_, i) => {
    if (i < filled) return <SeatAvatar key={i} />;
    return <SeatEmpty key={i} plus={i === filled && !full} />;
  });

  return (
    <div
      style={{
        borderRadius: 22,
        padding: '14px 16px 16px',
        background: `linear-gradient(180deg, ${C.cardTop} 0%, ${C.cardMid} 55%, ${C.cardDeep} 100%)`,
        border: `3px solid ${C.cardEdge}`,
        boxShadow: [
          'inset 0 3px 0 rgba(255,255,255,0.4)',
          'inset 0 -3px 0 rgba(0,0,0,0.25)',
          'inset 3px 0 0 rgba(255,255,255,0.18)',
          'inset -3px 0 0 rgba(0,0,0,0.18)',
          '0 8px 16px rgba(0,0,0,0.28)',
        ].join(', '),
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 12,
      }}
    >
      {/* Title */}
      <div
        style={{
          fontFamily: FONT,
          fontSize: 19,
          color: '#fff',
          textAlign: 'center',
          letterSpacing: '0.3px',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          maxWidth: '100%',
          textShadow: `
            -2px -2px 0 ${C.cardEdge}, 2px -2px 0 ${C.cardEdge},
            -2px 2px 0 ${C.cardEdge}, 2px 2px 0 ${C.cardEdge},
            0 3px 3px rgba(0,0,0,0.3)
          `,
        }}
      >
        {roomLabel(room)}
      </div>

      {/* Seat row */}
      <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>{seats}</div>

      {/* Join button — chunky pill */}
      <div
        style={{
          borderRadius: 22,
          background: `linear-gradient(180deg, ${C.btnBase} 0%, ${C.btnBaseDark} 100%)`,
          padding: `0 0 ${DEPTH}px 0`,
          border: `3px solid ${C.btnOuter}`,
          opacity: full && !isJoiningThis ? 0.55 : 1,
          filter: 'drop-shadow(0 5px 7px rgba(30,70,15,0.35))',
        }}
      >
        <button
          type="button"
          onClick={() => !full && onJoin(room.roomId)}
          disabled={isBusy || full}
          onMouseDown={() => setPressed(true)}
          onMouseUp={() => setPressed(false)}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => {
            setHovered(false);
            setPressed(false);
          }}
          onTouchStart={() => setPressed(true)}
          onTouchEnd={() => setPressed(false)}
          style={{
            display: 'block',
            margin: -3,
            padding: '8px 38px',
            borderRadius: 24,
            border: `3px solid ${C.btnOuter}`,
            borderBottom: 'none',
            background: `linear-gradient(180deg, ${C.btnFaceTop} 0%, ${C.btnFaceMid} 55%, ${C.btnFaceBot} 100%)`,
            boxShadow: [
              'inset 0 3px 0 rgba(255,255,255,0.4)',
              'inset 0 -3px 0 rgba(0,0,0,0.25)',
            ].join(', '),
            transform: `translateY(${pressed ? DEPTH : hovered && !full ? -1.5 : 0}px)`,
            transition: 'transform 130ms cubic-bezier(0.34, 1.4, 0.64, 1)',
            cursor: isBusy || full ? 'default' : 'pointer',
            outline: 'none',
            color: '#fff',
            fontFamily: FONT,
            fontSize: 18,
            textShadow: `
              -1.5px -1.5px 0 ${C.btnOuter}, 1.5px -1.5px 0 ${C.btnOuter},
              -1.5px 1.5px 0 ${C.btnOuter}, 1.5px 1.5px 0 ${C.btnOuter}
            `,
          }}
        >
          {isJoiningThis ? 'Joining…' : full ? 'Full' : 'Join'}
        </button>
      </div>
    </div>
  );
}
