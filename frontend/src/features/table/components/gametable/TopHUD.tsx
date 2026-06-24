import { useState } from 'react';
import { C, FONT, stroke } from './tokens';
import { Avatar } from './Avatar';

interface TopHUDProps {
  /** Whose turn it is right now — shown in the centre badge. */
  turnPlayerName: string;
  onLeave: () => void;
}

export function TopHUD({ turnPlayerName, onLeave }: TopHUDProps) {
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
      {/* Left — spacer to keep the turn badge centred */}
      <div style={{ width: 90 }} />

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
