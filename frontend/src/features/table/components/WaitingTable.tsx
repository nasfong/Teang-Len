import { useState } from 'react';
import type { PlayerId } from '../../../game/types';
import type { RoomSnapshot } from '../../../services/api';
import { WaitSeat } from './WaitSeat';
import { C, FONT, stroke } from './gametable/tokens';

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

const OCTAGON = 'polygon(28% 0, 72% 0, 100% 28%, 100% 72%, 72% 100%, 28% 100%, 0 72%, 0 28%)';

function LeaveButton({ onClick }: { onClick: () => void }) {
  const [pressed, setPressed] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => setPressed(false)}
      onMouseLeave={() => setPressed(false)}
      style={{
        padding: '10px 22px',
        borderRadius: 14,
        border: `3px solid ${C.leaveRim}`,
        background: `linear-gradient(180deg, ${C.leaveTop} 0%, ${C.leaveMid} 100%)`,
        boxShadow: pressed ? 'inset 0 2px 4px rgba(0,0,0,0.3)' : `0 4px 0 ${C.leaveRim}, 0 6px 10px rgba(0,0,0,0.35)`,
        transform: `translateY(${pressed ? 3 : 0}px)`,
        transition: 'transform 100ms, box-shadow 100ms',
        cursor: 'pointer',
        color: '#fff',
        fontFamily: FONT,
        fontSize: 16,
        letterSpacing: 1,
        textShadow: stroke(C.leaveRim, 1.5),
        outline: 'none',
      }}
    >
      LEAVE
    </button>
  );
}

function StartButton({ disabled, label, onClick }: { disabled: boolean; label: string; onClick: () => void }) {
  const [pressed, setPressed] = useState(false);
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => setPressed(false)}
      onMouseLeave={() => setPressed(false)}
      style={{
        padding: '15px 36px',
        borderRadius: 18,
        border: `3px solid ${C.beatRim}`,
        background: `linear-gradient(180deg, ${C.beatTop} 0%, ${C.beatMid} 55%, ${C.beatDeep} 100%)`,
        boxShadow: disabled
          ? 'none'
          : pressed
            ? 'inset 0 2px 5px rgba(0,0,0,0.35)'
            : `0 5px 0 ${C.beatRim}, 0 8px 14px rgba(0,0,0,0.4)`,
        transform: `translateY(${disabled ? 0 : pressed ? 4 : 0}px)`,
        transition: 'transform 100ms, box-shadow 100ms',
        opacity: disabled ? 0.55 : 1,
        cursor: disabled ? 'default' : 'pointer',
        color: '#fff',
        fontFamily: FONT,
        fontSize: 22,
        letterSpacing: 1,
        textShadow: stroke(C.beatRim, 2),
        outline: 'none',
      }}
    >
      {label}
    </button>
  );
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
  const twoPlayer = maxSeats === 2;

  const centre = isHost ? (
    <StartButton
      disabled={playerCount < 2}
      label={playerCount < 2 ? `Need ${2 - playerCount} more` : 'START GAME ▶'}
      onClick={onStart}
    />
  ) : (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
      <span style={{ fontFamily: FONT, fontSize: 16, color: '#fff', textShadow: stroke(C.textStroke, 1.5) }}>
        Waiting for host…
      </span>
      <div style={{ display: 'flex', gap: 6 }}>
        {[0, 1, 2].map(i => (
          <span
            key={i}
            style={{
              width: 9,
              height: 9,
              borderRadius: '50%',
              background: C.gold,
              animation: `wait-bounce 1s ${i * 0.15}s infinite ease-in-out`,
            }}
          />
        ))}
      </div>
    </div>
  );

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        backgroundImage: "url('/table-bg.png')",
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <style>{'@keyframes wait-bounce{0%,80%,100%{transform:translateY(0);opacity:.5}40%{transform:translateY(-7px);opacity:1}}'}</style>

      {/* Top bar — room label left, leave right */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 16px',
          zIndex: 20,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div
            style={{
              padding: '8px 16px',
              borderRadius: 14,
              background: C.panelDark,
              fontFamily: FONT,
              fontSize: 14,
              color: '#fff',
            }}
          >
            ROOM · {playerCount}/{maxSeats}
          </div>
          {room && room.betCoin > 0 && (
            <div
              style={{
                padding: '8px 14px',
                borderRadius: 14,
                background: C.panelDark,
                fontFamily: FONT,
                fontSize: 14,
                color: C.gold,
                textShadow: stroke(C.textStroke, 1.2),
              }}
            >
              BET · 🪙 {room.betCoin.toLocaleString()}
            </div>
          )}
        </div>
        <LeaveButton onClick={onLeave} />
      </div>

      {/* Top seat */}
      <div style={{ position: 'absolute', top: 72, left: '50%', transform: 'translateX(-50%)', zIndex: 10 }}>
        <WaitSeat seatIdx={seats.top} room={room} playerId={playerId} closed={seats.top === null} />
      </div>

      {/* Side seats */}
      {!twoPlayer && (
        <>
          <div style={{ position: 'absolute', top: '44%', left: 24, transform: 'translateY(-50%)', zIndex: 10 }}>
            <WaitSeat seatIdx={seats.left} room={room} playerId={playerId} closed={seats.left === null} />
          </div>
          <div style={{ position: 'absolute', top: '44%', right: 24, transform: 'translateY(-50%)', zIndex: 10 }}>
            <WaitSeat seatIdx={seats.right} room={room} playerId={playerId} closed={seats.right === null} />
          </div>
        </>
      )}

      {/* Centre felt table */}
      <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 5 }}>
        <div
          style={{
            width: 'min(560px, 74vw)',
            padding: 16,
            clipPath: OCTAGON,
            background: `linear-gradient(180deg, ${C.woodLight} 0%, ${C.woodMid} 50%, ${C.woodDark} 100%)`,
            boxShadow: '0 14px 30px rgba(0,0,0,0.45)',
          }}
        >
          <div style={{ padding: 4, clipPath: OCTAGON, background: C.woodTrim }}>
            <div
              style={{
                clipPath: OCTAGON,
                background: `radial-gradient(ellipse 70% 70% at 50% 45%, ${C.feltTop} 0%, ${C.feltMid} 55%, ${C.feltDeep} 85%, ${C.feltEdge} 100%)`,
                boxShadow: 'inset 0 0 40px rgba(0,0,0,0.45)',
                minHeight: 220,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 14,
                padding: '36px 24px',
                boxSizing: 'border-box',
              }}
            >
              <div style={{ fontFamily: FONT, fontSize: 22, color: C.gold, textShadow: stroke(C.textStroke, 2) }}>
                TEANG LEN
              </div>
              {centre}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom seat (local player) */}
      <div style={{ position: 'absolute', bottom: 24, left: '50%', transform: 'translateX(-50%)', zIndex: 15 }}>
        <WaitSeat seatIdx={seats.bottom} room={room} playerId={playerId} closed={false} />
      </div>
    </div>
  );
}
