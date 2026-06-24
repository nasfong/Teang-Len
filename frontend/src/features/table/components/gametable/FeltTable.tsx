import type { Hand, Trick, TrickPlay } from '../../../../game/types';
import { C, FONT } from './tokens';
import { GameCard } from './GameCard';

interface FeltTableProps {
  trick: Trick;
  playerNames: string[];
  /** Action buttons (PASS/BEAT) rendered below the played cards. */
  children?: React.ReactNode;
}

const TYPE_LABEL: Record<string, string> = {
  single: 'SINGLE', pair: 'PAIR', triple: 'TRIPLE', full_house: 'FULL HOUSE',
  straight: 'STRAIGHT', flush_straight: 'FLUSH STRAIGHT', double_sequence: 'DOUBLE SEQ', quad: 'QUAD',
};

const OCTAGON = 'polygon(28% 0, 72% 0, 100% 28%, 100% 72%, 72% 100%, 28% 100%, 0 72%, 0 28%)';

// Center-table animations: smooth entrance for the new current play and a brief
// glow when the play is a bomb. Injected once via a <style> tag (matches the
// project's existing keyframe approach in WaitingTable).
const TRICK_ANIM = `
@keyframes trick-enter {
  0%   { transform: translateY(-12px) scale(0.82); opacity: 0; }
  60%  { transform: translateY(0) scale(1.05); opacity: 1; }
  100% { transform: translateY(0) scale(1); opacity: 1; }
}
@keyframes trick-prev-settle {
  0%   { transform: scale(1); opacity: 0.85; }
  100% { transform: scale(0.9); opacity: 0.42; }
}
@keyframes bomb-pulse {
  0%, 100% { box-shadow: 0 0 0 rgba(245,194,75,0); }
  35%      { box-shadow: 0 0 26px 6px rgba(245,194,75,0.9); }
  70%      { box-shadow: 0 0 14px 2px rgba(245,194,75,0.5); }
}`;

/** Frontend heuristic for "this play is a bomb" — drives the highlight only. */
function isBombHand(hand: Hand): boolean {
  if (hand.type === 'quad') return true;
  if (hand.type === 'flush_straight' && hand.cards.length === 5) return true;
  if (hand.type === 'double_sequence' && hand.cards.length >= 8) return true;
  return false;
}

/** The most recent play — emphasized, animated, optionally bomb-highlighted. */
function CurrentPlay({ play, name }: { play: TrickPlay; name: string }) {
  const bomb = isBombHand(play.hand);
  // Re-key on the card identity so each new beat re-triggers the entrance anim.
  const key = play.hand.cards.map(c => c.id).join('-');
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
      <div
        key={key}
        style={{
          display: 'flex',
          gap: 5,
          padding: 4,
          borderRadius: 12,
          animation: bomb
            ? 'trick-enter 260ms ease-out, bomb-pulse 750ms ease-out 120ms'
            : 'trick-enter 260ms ease-out',
        }}
      >
        {play.hand.cards.map(card => (
          <GameCard key={card.id} card={card} />
        ))}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ fontFamily: FONT, fontSize: 12, color: '#fff', textShadow: '0 1px 2px rgba(0,0,0,0.6)' }}>
          {name}
        </span>
        {bomb && (
          <span style={{ fontFamily: FONT, fontSize: 11, color: C.gold }}>💣 BOMB</span>
        )}
      </div>
    </div>
  );
}

/** The play that was just beaten — faded, smaller, non-interactive reference. */
function PreviousPlay({ play, name }: { play: TrickPlay; name: string }) {
  const key = play.hand.cards.map(c => c.id).join('-');
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 5,
        pointerEvents: 'none',
        transformOrigin: 'center',
      }}
    >
      <div
        key={key}
        style={{
          display: 'flex',
          gap: 4,
          opacity: 0.42,
          transform: 'scale(0.9)',
          animation: 'trick-prev-settle 260ms ease-out',
        }}
      >
        {play.hand.cards.map(card => (
          <GameCard key={card.id} card={card} />
        ))}
      </div>
      <span style={{ fontFamily: FONT, fontSize: 10, letterSpacing: 1, color: 'rgba(255,255,255,0.55)' }}>
        BEATEN · {name}
      </span>
    </div>
  );
}

export function FeltTable({ trick, playerNames, children }: FeltTableProps) {
  const plays = trick.plays;
  const current = plays[plays.length - 1] ?? null;
  const previous = plays[plays.length - 2] ?? null;
  const typeLabel = current ? TYPE_LABEL[current.hand.type] ?? current.hand.type : null;

  return (
    <div style={{ position: 'relative', width: 'min(640px, 80vw)', maxWidth: 640 }}>
      <style>{TRICK_ANIM}</style>
      {/* Wood frame */}
      <div
        style={{
          padding: 16,
          clipPath: OCTAGON,
          background: `linear-gradient(180deg, ${C.woodLight} 0%, ${C.woodMid} 50%, ${C.woodDark} 100%)`,
          boxShadow: '0 14px 30px rgba(0,0,0,0.45)',
        }}
      >
        {/* Gold trim ring */}
        <div style={{ padding: 4, clipPath: OCTAGON, background: C.woodTrim }}>
          {/* Felt surface */}
          <div
            style={{
              clipPath: OCTAGON,
              background: `radial-gradient(ellipse 70% 70% at 50% 45%, ${C.feltTop} 0%, ${C.feltMid} 55%, ${C.feltDeep} 85%, ${C.feltEdge} 100%)`,
              boxShadow: 'inset 0 0 40px rgba(0,0,0,0.45)',
              minHeight: 240,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 10,
              padding: '28px 20px',
              boxSizing: 'border-box',
            }}
          >
            {/* Hand-type badge (for the current play) */}
            <div style={{ height: 20 }}>
              {typeLabel && (
                <div
                  style={{
                    padding: '3px 14px',
                    borderRadius: 10,
                    background: 'rgba(0,0,0,0.3)',
                    fontFamily: FONT,
                    fontSize: 12,
                    letterSpacing: 1.5,
                    color: C.gold,
                  }}
                >
                  {typeLabel}
                </div>
              )}
            </div>

            {/* Previous (faded) → Current (primary) */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 14, minHeight: 100 }}>
              {current ? (
                <>
                  {previous && (
                    <>
                      <PreviousPlay play={previous} name={playerNames[previous.playerId]} />
                      <span style={{ fontSize: 18, color: 'rgba(255,255,255,0.55)' }}>→</span>
                    </>
                  )}
                  <CurrentPlay play={current} name={playerNames[current.playerId]} />
                </>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, opacity: 0.7 }}>
                  <div style={{ fontSize: 30 }}>🃏</div>
                  <div style={{ fontFamily: FONT, fontSize: 12, letterSpacing: 1, color: 'rgba(255,255,255,0.75)' }}>
                    OPEN THE TRICK
                  </div>
                </div>
              )}
            </div>

            {/* Action buttons */}
            <div style={{ marginTop: 4 }}>{children}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
