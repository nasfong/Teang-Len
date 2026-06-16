import { useState } from 'react';
import { C, FONT, stroke } from './tokens';
import { GemBarIcon, UsersIcon } from './icons';
import { Avatar } from './Avatar';

interface TopHUDProps {
  /** Whose turn it is right now — shown in the centre badge. */
  turnPlayerName: string;
  /** Visual-only placeholders until the backend exposes balances. */
  gems?: string;
  spectators?: number;
  onLeave: () => void;
}

function Stat({ icon, value, label }: { icon: React.ReactNode; value: string; label: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      {icon}
      <div style={{ lineHeight: 1.05 }}>
        <div style={{ fontFamily: FONT, fontSize: 15, color: '#fff', textShadow: '0 1px 2px rgba(0,0,0,0.6)' }}>
          {value}
        </div>
        <div style={{ fontFamily: FONT, fontSize: 9, letterSpacing: 1, color: 'rgba(255,255,255,0.55)' }}>
          {label}
        </div>
      </div>
    </div>
  );
}

export function TopHUD({ turnPlayerName, gems = '50K', spectators = 30, onLeave }: TopHUDProps) {
  const [pressed, setPressed] = useState(false);

  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 64,
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        padding: '10px 14px',
        boxSizing: 'border-box',
        zIndex: 20,
        pointerEvents: 'none',
      }}
    >
      {/* Left — stat pill */}
      <div
        style={{
          pointerEvents: 'auto',
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          padding: '8px 16px',
          borderRadius: 16,
          background: C.panelDark,
          border: '1.5px solid rgba(255,255,255,0.12)',
          boxShadow: '0 4px 10px rgba(0,0,0,0.35)',
        }}
      >
        <Stat icon={<GemBarIcon />} value={gems} label="GEMS" />
        <div style={{ width: 1, height: 26, background: 'rgba(255,255,255,0.15)' }} />
        <Stat icon={<UsersIcon />} value={String(spectators)} label="SPECTATORS" />
      </div>

      {/* Centre — current turn player */}
      <div
        style={{
          pointerEvents: 'auto',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 2,
        }}
      >
        <Avatar name={turnPlayerName} size={46} active />
        <div
          style={{
            fontFamily: FONT,
            fontSize: 15,
            color: '#fff',
            textShadow: stroke(C.textStroke, 1.5),
          }}
        >
          {turnPlayerName}
        </div>
      </div>

      {/* Right — leave button */}
      <button
        onClick={onLeave}
        onMouseDown={() => setPressed(true)}
        onMouseUp={() => setPressed(false)}
        onMouseLeave={() => setPressed(false)}
        style={{
          pointerEvents: 'auto',
          padding: '10px 22px',
          borderRadius: 14,
          border: `3px solid ${C.leaveRim}`,
          background: `linear-gradient(180deg, ${C.leaveTop} 0%, ${C.leaveMid} 100%)`,
          boxShadow: pressed
            ? 'inset 0 2px 4px rgba(0,0,0,0.3)'
            : `0 4px 0 ${C.leaveRim}, 0 6px 10px rgba(0,0,0,0.35)`,
          transform: `translateY(${pressed ? 3 : 0}px)`,
          transition: 'transform 100ms, box-shadow 100ms',
          cursor: 'pointer',
          color: '#fff',
          fontFamily: FONT,
          fontSize: 17,
          letterSpacing: 1,
          textShadow: stroke(C.leaveRim, 1.5),
          outline: 'none',
        }}
      >
        LEAVE
      </button>
    </div>
  );
}
