import { useState } from 'react';
import { C, FONT, stroke } from './tokens';

interface ActionButtonsProps {
  isPlayerTurn: boolean;
  canPass: boolean;
  canBeat: boolean;
  selectedCount: number;
  hint?: string;
  currentPlayerName: string;
  onPass: () => void;
  onBeat: () => void;
}

type Variant = 'pass' | 'beat';

function ChunkyButton({
  label,
  variant,
  disabled,
  badge,
  onClick,
}: {
  label: string;
  variant: Variant;
  disabled: boolean;
  badge?: number;
  onClick: () => void;
}) {
  const [pressed, setPressed] = useState(false);
  const top = variant === 'pass' ? C.passTop : C.beatTop;
  const mid = variant === 'pass' ? C.passMid : C.beatMid;
  const deep = variant === 'pass' ? C.passDeep : C.beatDeep;
  const rim = variant === 'pass' ? C.passRim : C.beatRim;

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => setPressed(false)}
      onMouseLeave={() => setPressed(false)}
      style={{
        position: 'relative',
        minWidth: 138,
        padding: '14px 30px',
        borderRadius: 18,
        border: `3px solid ${rim}`,
        background: `linear-gradient(180deg, ${top} 0%, ${mid} 55%, ${deep} 100%)`,
        boxShadow:
          disabled
            ? 'none'
            : pressed
              ? `inset 0 2px 5px rgba(0,0,0,0.35)`
              : `0 5px 0 ${rim}, 0 8px 14px rgba(0,0,0,0.4)`,
        transform: `translateY(${disabled ? 0 : pressed ? 4 : 0}px)`,
        transition: 'transform 100ms, box-shadow 100ms',
        opacity: disabled ? 0.5 : 1,
        cursor: disabled ? 'default' : 'pointer',
        color: '#fff',
        fontFamily: FONT,
        fontSize: 24,
        letterSpacing: 1,
        textShadow: stroke(rim, 2),
        outline: 'none',
      }}
    >
      {label}
      {badge !== undefined && badge > 0 && (
        <span
          style={{
            position: 'absolute',
            top: -8,
            right: -8,
            minWidth: 24,
            height: 24,
            padding: '0 5px',
            borderRadius: 12,
            background: C.gold,
            border: `2px solid ${C.goldDeep}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 13,
            color: C.textStroke,
            boxShadow: '0 2px 4px rgba(0,0,0,0.4)',
          }}
        >
          {badge}
        </span>
      )}
    </button>
  );
}

export function ActionButtons({
  isPlayerTurn,
  canPass,
  canBeat,
  selectedCount,
  hint,
  currentPlayerName,
  onPass,
  onBeat,
}: ActionButtonsProps) {
  if (!isPlayerTurn) {
    return (
      <div
        style={{
          padding: '8px 20px',
          borderRadius: 14,
          background: C.panelDark,
          fontFamily: FONT,
          fontSize: 15,
          color: 'rgba(255,255,255,0.85)',
          textShadow: '0 1px 2px rgba(0,0,0,0.5)',
        }}
      >
        ⌛ {currentPlayerName}'s turn…
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
      <div style={{ display: 'flex', gap: 16 }}>
        <ChunkyButton label="PASS" variant="pass" disabled={!canPass} onClick={onPass} />
        <ChunkyButton label="BEAT" variant="beat" disabled={!canBeat} badge={selectedCount} onClick={onBeat} />
      </div>
      {hint && (
        <div
          style={{
            fontFamily: FONT,
            fontSize: 13,
            color: 'rgba(255,255,255,0.85)',
            textShadow: '0 1px 2px rgba(0,0,0,0.6)',
          }}
        >
          {hint}
        </div>
      )}
    </div>
  );
}
