import type { Trick } from '../../../../game/types';
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
  straight: 'STRAIGHT', flush_straight: 'FLUSH STRAIGHT', double_sequence: 'DOUBLE SEQ', quad: '💣 QUAD',
};

const OCTAGON = 'polygon(28% 0, 72% 0, 100% 28%, 100% 72%, 72% 100%, 28% 100%, 0 72%, 0 28%)';

/** Decorative casino-style chip stack in the table centre. */
function ChipPile() {
  const chips = ['#E8584F', '#56B82E', '#2B7FC9', '#F5C24B', '#E8584F'];
  return (
    <div style={{ position: 'relative', width: 46, height: 34 }}>
      {chips.map((col, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: (i % 2) * 16,
            bottom: i * 5,
            width: 30,
            height: 12,
            borderRadius: '50%',
            background: `radial-gradient(circle at 50% 30%, #ffffff66, ${col})`,
            border: '2px solid rgba(255,255,255,0.7)',
            boxShadow: '0 2px 3px rgba(0,0,0,0.4)',
          }}
        />
      ))}
    </div>
  );
}

export function FeltTable({ trick, playerNames, children }: FeltTableProps) {
  const lastPlay = trick.plays[trick.plays.length - 1] ?? null;
  const typeLabel = trick.currentHand ? TYPE_LABEL[trick.currentHand.type] ?? trick.currentHand.type : null;

  return (
    <div style={{ position: 'relative', width: 'min(640px, 80vw)', maxWidth: 640 }}>
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
            {/* Hand-type badge */}
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

            {/* Played cards + chips */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 18, minHeight: 84 }}>
              {lastPlay ? (
                <>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                    <div style={{ display: 'flex', gap: 5 }}>
                      {lastPlay.hand.cards.map(card => (
                        <GameCard key={card.id} card={card} />
                      ))}
                    </div>
                    <div style={{ fontFamily: FONT, fontSize: 12, color: 'rgba(255,255,255,0.8)' }}>
                      {playerNames[lastPlay.playerId]}
                    </div>
                  </div>
                  <ChipPile />
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
