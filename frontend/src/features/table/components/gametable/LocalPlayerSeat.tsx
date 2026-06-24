import { C, FONT, stroke } from './tokens';
import { Avatar } from './Avatar';

interface LocalPlayerSeatProps {
  name: string;
  isCurrentTurn: boolean;
  secondsLeft?: number | null;
  isUrgent?: boolean;
  cardCount: number;
  rank: number | null;
  skipped: boolean;
  isHost: boolean;
  /** Live coin balance from the authenticated user's wallet. */
  coin: number;
}

const RANK_LABEL: Record<number, string> = { 1: '🥇 1st', 2: '🥈 2nd', 3: '🥉 3rd', 4: '🏅 4th' };

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

/**
 * The local player's own profile, pinned to the front (bottom-left) of the table
 * during gameplay. Mirrors the waiting-room seat (avatar + online dot + name +
 * YOU/HOST badges) and adds the in-game status (turn timer, cards left / rank).
 */
export function LocalPlayerSeat({
  name,
  isCurrentTurn,
  secondsLeft = null,
  isUrgent = false,
  cardCount,
  rank,
  skipped,
  isHost,
  coin,
}: LocalPlayerSeatProps) {
  const finished = rank !== null;
  const statusLine = finished ? RANK_LABEL[rank!] : skipped ? '⏭ Passed' : `${cardCount} cards`;

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '8px 14px 8px 8px',
        borderRadius: 18,
        background: C.panelDark,
        border: isCurrentTurn && !finished ? `2px solid ${C.gold}` : '1.5px solid rgba(255,255,255,0.12)',
        boxShadow: isCurrentTurn && !finished
          ? `0 0 14px ${C.gold}, 0 4px 10px rgba(0,0,0,0.4)`
          : '0 4px 10px rgba(0,0,0,0.35)',
        opacity: finished ? 0.7 : 1,
      }}
    >
      <div style={{ position: 'relative' }}>
        <Avatar name={name} size={54} active={isCurrentTurn && !finished} dimmed={finished || skipped} />
        {/* Online dot — the local player is always connected. */}
        <span
          style={{
            position: 'absolute',
            bottom: 2,
            right: 2,
            width: 12,
            height: 12,
            borderRadius: '50%',
            background: '#4ade80',
            border: '2px solid #0A2A35',
          }}
        />
        {isCurrentTurn && !finished && secondsLeft !== null && (
          <div
            style={{
              position: 'absolute',
              bottom: -6,
              right: -6,
              minWidth: 22,
              height: 22,
              padding: '0 4px',
              borderRadius: 11,
              background: isUrgent ? C.passMid : C.feltDeep,
              border: `2px solid ${C.gold}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: FONT,
              fontSize: 12,
              color: '#fff',
              boxShadow: '0 2px 4px rgba(0,0,0,0.4)',
            }}
          >
            {String(secondsLeft).padStart(2, '0')}
          </div>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <span style={{ fontFamily: FONT, fontSize: 15, color: '#fff', textShadow: stroke(C.textStroke, 1.5) }}>
          {name}
        </span>

        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <Badge label="YOU" kind="you" />
          {isHost && <Badge label="HOST" kind="host" />}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              fontFamily: FONT,
              fontSize: 12,
              color: C.coin,
            }}
          >
            <span
              style={{
                width: 12,
                height: 12,
                borderRadius: '50%',
                background: `radial-gradient(circle at 35% 30%, #fff6c0, ${C.coin})`,
                border: `1px solid ${C.goldDeep}`,
              }}
            />
            {coin.toLocaleString()}
          </span>
          <span style={{ fontFamily: FONT, fontSize: 12, color: 'rgba(255,255,255,0.8)' }}>{statusLine}</span>
        </div>
      </div>
    </div>
  );
}
