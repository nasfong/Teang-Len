import { useState } from 'react';

// ── Cartoon design tokens ─────────────────────────────────────────────────────
const C = {
  panelTop: '#6CC3FF',
  panelMid: '#3C93DB',
  panelDeep: '#2B7FC9',
  edge: '#1B4E86',
  fieldBg: 'rgba(0,0,0,0.22)',
  accent: '#FFD27A',
  // green button
  gOuter: '#2F6614',
  gTop: '#8FE04A',
  gMid: '#6FCB33',
  gBot: '#5BB528',
  gBase: '#3F861C',
  gBaseDark: '#2F6614',
  // blue button
  bOuter: '#15406F',
  bTop: '#65B7F2',
  bMid: '#3C93DB',
  bBot: '#2B7FC9',
  bBase: '#1E5FA0',
  bBaseDark: '#15406F',
} as const;

const FONT = "'Lilita One', 'Fredoka', 'Comic Sans MS', cursive";
const DEPTH = 6;

const STROKE = (color: string, w = 2) =>
  `${-w}px ${-w}px 0 ${color}, ${w}px ${-w}px 0 ${color}, ${-w}px ${w}px 0 ${color}, ${w}px ${w}px 0 ${color}`;

// Backend supports 2–4 seats (PlayerId 0–3). The mockup's 6/8 are not valid here.
const MAX_PLAYER_OPTIONS = [2, 3, 4] as const;

// ── Chunky pill button ────────────────────────────────────────────────────────
type Variant = 'green' | 'blue';

function PillButton({
  label,
  variant,
  disabled,
  onClick,
}: {
  label: string;
  variant: Variant;
  disabled?: boolean;
  onClick: () => void;
}) {
  const [pressed, setPressed] = useState(false);
  const [hovered, setHovered] = useState(false);
  const v =
    variant === 'green'
      ? { outer: C.gOuter, top: C.gTop, mid: C.gMid, bot: C.gBot, base: C.gBase, baseDark: C.gBaseDark }
      : { outer: C.bOuter, top: C.bTop, mid: C.bMid, bot: C.bBot, base: C.bBase, baseDark: C.bBaseDark };

  return (
    <div
      style={{
        borderRadius: 24,
        background: `linear-gradient(180deg, ${v.base} 0%, ${v.baseDark} 100%)`,
        padding: `0 0 ${DEPTH}px 0`,
        border: `3px solid ${v.outer}`,
        opacity: disabled ? 0.6 : 1,
        filter: 'drop-shadow(0 6px 8px rgba(0,0,0,0.32))',
      }}
    >
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
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
          padding: '11px 40px',
          borderRadius: 26,
          border: `3px solid ${v.outer}`,
          borderBottom: 'none',
          background: `linear-gradient(180deg, ${v.top} 0%, ${v.mid} 55%, ${v.bot} 100%)`,
          boxShadow: 'inset 0 3px 0 rgba(255,255,255,0.4), inset 0 -3px 0 rgba(0,0,0,0.22)',
          transform: `translateY(${pressed ? DEPTH : hovered && !disabled ? -1.5 : 0}px)`,
          transition: 'transform 130ms cubic-bezier(0.34, 1.4, 0.64, 1)',
          cursor: disabled ? 'default' : 'pointer',
          outline: 'none',
          color: '#fff',
          fontFamily: FONT,
          fontSize: 22,
          textShadow: `${STROKE(v.outer, 2)}, 0 3px 3px rgba(0,0,0,0.35)`,
        }}
      >
        {label}
      </button>
    </div>
  );
}

// ── Small square toggle (game mode + max players) ─────────────────────────────
function SquareToggle({
  children,
  active,
  onClick,
  width = 56,
}: {
  children: React.ReactNode;
  active: boolean;
  onClick: () => void;
  width?: number;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        minWidth: width,
        padding: '8px 6px',
        borderRadius: 14,
        border: `3px solid ${active ? C.gOuter : C.edge}`,
        background: active
          ? `linear-gradient(180deg, ${C.gTop} 0%, ${C.gBot} 100%)`
          : 'rgba(255,255,255,0.16)',
        color: '#fff',
        fontFamily: FONT,
        fontSize: 17,
        cursor: 'pointer',
        outline: 'none',
        boxShadow: active
          ? 'inset 0 2px 0 rgba(255,255,255,0.45), 0 0 10px rgba(143,224,74,0.6)'
          : 'inset 0 2px 0 rgba(255,255,255,0.2)',
        textShadow: STROKE(active ? C.gOuter : C.edge, 1.5),
        transition: 'background 120ms, border-color 120ms',
      }}
    >
      {children}
    </button>
  );
}

const Label = ({ children }: { children: React.ReactNode }) => (
  <span
    style={{
      fontFamily: FONT,
      fontSize: 18,
      color: '#fff',
      textShadow: STROKE(C.edge, 1.5),
      whiteSpace: 'nowrap',
    }}
  >
    {children}
  </span>
);

// ── Modal ─────────────────────────────────────────────────────────────────────
export interface CreateRoomOptions {
  /** Sent to the backend (the only persisted field). */
  maxPlayers: number;
  /** UI-only for now — backend has no field for these yet. */
  roomName: string;
  betAmount: number;
}

interface CreateRoomModalProps {
  open: boolean;
  creating: boolean;
  defaultName?: string;
  onCancel: () => void;
  onCreate: (opts: CreateRoomOptions) => void;
}

export function CreateRoomModal({ open, creating, defaultName, onCancel, onCreate }: CreateRoomModalProps) {
  const [roomName, setRoomName] = useState(defaultName ?? '');
  const [betAmount, setBetAmount] = useState(5000);
  const [maxPlayers, setMaxPlayers] = useState(4);

  if (!open) return null;

  return (
    <div
      onMouseDown={e => {
        if (e.target === e.currentTarget && !creating) onCancel();
      }}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
        background: 'rgba(0,20,45,0.55)',
        backdropFilter: 'blur(2px)',
      }}
    >
      {/* Modal card */}
      <div
        style={{
          width: '100%',
          maxWidth: 460,
          padding: '26px 26px 28px',
          borderRadius: 30,
          background: `linear-gradient(180deg, ${C.panelTop} 0%, ${C.panelMid} 55%, ${C.panelDeep} 100%)`,
          border: `3px solid ${C.edge}`,
          boxShadow: [
            'inset 0 3px 0 rgba(255,255,255,0.4)',
            'inset 0 -3px 0 rgba(0,0,0,0.25)',
            'inset 3px 0 0 rgba(255,255,255,0.2)',
            'inset -3px 0 0 rgba(0,0,0,0.2)',
            '0 16px 40px rgba(0,0,0,0.45)',
          ].join(', '),
        }}
      >
        {/* Title */}
        <h2
          style={{
            margin: '0 0 22px',
            textAlign: 'center',
            fontFamily: FONT,
            fontSize: 30,
            color: '#fff',
            letterSpacing: '0.5px',
            textShadow: `${STROKE(C.edge, 2.5)}, 0 5px 5px rgba(0,0,0,0.35)`,
          }}
        >
          🃏 CREATE ROOM 🔑
        </h2>

        {/* Room name */}
        <div style={{ position: 'relative', marginBottom: 20 }}>
          <span
            style={{
              position: 'absolute',
              left: 16,
              top: '50%',
              transform: 'translateY(-50%)',
              fontSize: 18,
              pointerEvents: 'none',
            }}
          >
            ✏️
          </span>
          <input
            type="text"
            value={roomName}
            placeholder="Room name"
            maxLength={24}
            onChange={e => setRoomName(e.target.value)}
            style={{
              width: '100%',
              boxSizing: 'border-box',
              padding: '13px 16px 13px 46px',
              fontSize: 18,
              fontFamily: FONT,
              color: '#fff',
              background: C.fieldBg,
              border: `3px solid ${C.edge}`,
              borderRadius: 16,
              outline: 'none',
              boxShadow: 'inset 0 3px 6px rgba(0,0,0,0.35)',
            }}
          />
        </div>

        {/* Bet amount */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 18 }}>
          <div style={{ width: 86 }}>
            <Label>Bet Amount</Label>
          </div>
          <span style={{ fontSize: 18 }}>🪙</span>
          <input
            type="range"
            min={1000}
            max={50000}
            step={1000}
            value={betAmount}
            onChange={e => setBetAmount(Number(e.target.value))}
            style={{ flex: 1, accentColor: C.accent, cursor: 'pointer' }}
          />
          <span
            style={{
              fontFamily: FONT,
              fontSize: 15,
              color: C.accent,
              minWidth: 92,
              textAlign: 'right',
              textShadow: STROKE(C.edge, 1.5),
            }}
          >
            {betAmount.toLocaleString()} Coins
          </span>
        </div>

        {/* Max players */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 26 }}>
          <div style={{ width: 86 }}>
            <Label>Max Players</Label>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {MAX_PLAYER_OPTIONS.map(n => (
              <SquareToggle key={n} active={maxPlayers === n} onClick={() => setMaxPlayers(n)} width={48}>
                {n}
              </SquareToggle>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 18 }}>
          <PillButton label="Cancel" variant="blue" disabled={creating} onClick={onCancel} />
          <PillButton
            label={creating ? 'Creating…' : 'Create'}
            variant="green"
            disabled={creating}
            onClick={() => onCreate({ maxPlayers, roomName: roomName.trim(), betAmount })}
          />
        </div>
      </div>
    </div>
  );
}
