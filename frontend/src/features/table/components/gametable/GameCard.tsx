import type { Card } from '../../../../game/types';
import { C, FONT, isRedSuit } from './tokens';

interface GameCardProps {
  card?: Card;
  faceDown?: boolean;
  selected?: boolean;
  /** Smaller footprint for played-card/history rendering. */
  small?: boolean;
  onClick?: (cardId: string) => void;
}

/**
 * A single cartoon playing card. Face-down renders the patterned back.
 * Selected cards lift up and gain a gold glow.
 */
export function GameCard({ card, faceDown, selected, small, onClick }: GameCardProps) {
  const w = small ? 38 : 56;
  const h = small ? 54 : 80;
  const clickable = !!onClick && !!card;

  if (faceDown || !card) {
    return (
      <div
        style={{
          width: w,
          height: h,
          borderRadius: small ? 5 : 8,
          background: `repeating-linear-gradient(45deg, ${C.feltMid} 0 6px, ${C.feltDeep} 6px 12px)`,
          border: '2px solid #fff',
          boxShadow: '0 2px 4px rgba(0,0,0,0.4), inset 0 0 0 2px rgba(255,255,255,0.15)',
        }}
      />
    );
  }

  const red = isRedSuit(card.suit);
  const color = red ? '#D6332B' : '#1A1A1A';

  return (
    <div
      onClick={clickable ? () => onClick!(card.id) : undefined}
      style={{
        position: 'relative',
        width: w,
        height: h,
        borderRadius: small ? 5 : 9,
        background: 'linear-gradient(180deg, #ffffff 0%, #F2F4F7 100%)',
        border: `2px solid ${selected ? C.gold : '#E2E6EC'}`,
        boxShadow: selected
          ? `0 0 0 2px ${C.gold}, 0 10px 18px rgba(0,0,0,0.45)`
          : '0 3px 6px rgba(0,0,0,0.35)',
        cursor: clickable ? 'pointer' : 'default',
        transform: selected ? 'translateY(-22px)' : 'none',
        transition: 'transform 120ms cubic-bezier(0.34,1.4,0.64,1), box-shadow 120ms',
        userSelect: 'none',
        flexShrink: 0,
      }}
    >
      {/* Top-left rank + suit */}
      <div
        style={{
          position: 'absolute',
          top: small ? 2 : 4,
          left: small ? 3 : 5,
          lineHeight: 1,
          textAlign: 'center',
          color,
          fontFamily: FONT,
        }}
      >
        <div style={{ fontSize: small ? 12 : 17, fontWeight: 700 }}>{card.rank}</div>
        <div style={{ fontSize: small ? 11 : 15 }}>{card.suit}</div>
      </div>

      {/* Center suit */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: small ? 20 : 34,
          color,
          opacity: 0.92,
        }}
      >
        {card.suit}
      </div>

      {/* Bottom-right rank + suit (rotated) */}
      {!small && (
        <div
          style={{
            position: 'absolute',
            bottom: 4,
            right: 5,
            lineHeight: 1,
            textAlign: 'center',
            color,
            fontFamily: FONT,
            transform: 'rotate(180deg)',
          }}
        >
          <div style={{ fontSize: 17, fontWeight: 700 }}>{card.rank}</div>
          <div style={{ fontSize: 15 }}>{card.suit}</div>
        </div>
      )}
    </div>
  );
}
