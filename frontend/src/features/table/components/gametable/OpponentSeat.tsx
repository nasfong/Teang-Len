import type { Player } from '../../../../game/types';
import { C, FONT, stroke } from './tokens';
import { Avatar } from './Avatar';
import { GameCard } from './GameCard';

interface OpponentSeatProps {
  player: Player | null;
  position: 'top' | 'left' | 'right';
  isCurrentTurn: boolean;
  secondsLeft?: number | null;
  isUrgent?: boolean;
  /** Visual-only coin balance placeholder. */
  coins?: string;
}

const RANK_LABEL: Record<number, string> = { 1: '🥇 1st', 2: '🥈 2nd', 3: '🥉 3rd', 4: '🏅 4th' };

/** Stacked card-backs fanned to show how many cards an opponent holds. */
function CardBacks({ count, vertical }: { count: number; vertical: boolean }) {
  const show = Math.min(count, 8);
  const step = 9;
  return (
    <div style={{ position: 'relative', width: vertical ? 50 : 30 + show * step, height: vertical ? 40 + show * step : 56 }}>
      {Array.from({ length: show }).map((_, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: vertical ? 0 : i * step,
            top: vertical ? i * step : 0,
            transform: vertical ? 'scale(0.7)' : 'scale(0.62)',
            transformOrigin: 'top left',
          }}
        >
          <GameCard faceDown />
        </div>
      ))}
    </div>
  );
}

export function OpponentSeat({
  player,
  position,
  isCurrentTurn,
  secondsLeft = null,
  isUrgent = false,
  coins,
}: OpponentSeatProps) {
  // Empty / closed seat
  if (!player) {
    return (
      <div
        style={{
          width: 56,
          height: 56,
          borderRadius: '50%',
          border: '2px dashed rgba(255,255,255,0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: FONT,
          color: 'rgba(255,255,255,0.4)',
          fontSize: 11,
        }}
      >
        EMPTY
      </div>
    );
  }

  const finished = player.rank !== null;
  const vertical = position === 'left' || position === 'right';

  const statusLine = finished
    ? RANK_LABEL[player.rank!]
    : player.skipped
      ? '⏭ Passed'
      : `${player.hand.length} cards`;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 5,
        opacity: finished ? 0.6 : 1,
      }}
    >
      <div style={{ position: 'relative' }}>
        <Avatar name={player.name} size={54} active={isCurrentTurn && !finished} dimmed={finished || player.skipped} />
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

      {/* Name plate */}
      <div
        style={{
          fontFamily: FONT,
          fontSize: 14,
          color: '#fff',
          textShadow: stroke(C.textStroke, 1.5),
        }}
      >
        {player.name}
      </div>

      {/* Coins */}
      {coins && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            padding: '2px 10px',
            borderRadius: 11,
            background: C.panelDark,
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
          {coins}
        </div>
      )}

      {/* Cards held / status */}
      {finished || player.skipped ? (
        <div style={{ fontFamily: FONT, fontSize: 12, color: 'rgba(255,255,255,0.75)' }}>{statusLine}</div>
      ) : (
        <CardBacks count={player.hand.length} vertical={vertical} />
      )}
    </div>
  );
}
