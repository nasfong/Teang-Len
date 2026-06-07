import type { Card } from '../game/types';

interface CardViewProps {
  card: Card;
  selected?: boolean;
  faceDown?: boolean;
  onClick?: (card: Card) => void;
  small?: boolean;
  dimmed?: boolean;
}

const RED_SUITS = new Set(['♦', '♥']);

const SUIT_SYMBOL: Record<string, string> = {
  '♠': '♠', '♣': '♣', '♦': '♦', '♥': '♥',
};

export function CardView({ card, selected, faceDown, onClick, small, dimmed }: CardViewProps) {
  const isRed = RED_SUITS.has(card.suit);
  const clickable = !!onClick;

  if (faceDown) {
    return (
      <div
        className={`card card--back${small ? ' card--small' : ''}`}
        onClick={() => onClick?.(card)}
        style={{ cursor: clickable ? 'pointer' : 'default' }}
      />
    );
  }

  return (
    <div
      className={[
        'card',
        isRed ? 'card--red' : 'card--black',
        selected ? 'card--selected' : '',
        small ? 'card--small' : '',
        dimmed ? 'card--dimmed' : '',
        clickable ? 'card--clickable' : '',
      ].filter(Boolean).join(' ')}
      onClick={() => onClick?.(card)}
    >
      {/* Top-left pip */}
      <div className="card__corner card__corner--tl">
        <span className="card__rank">{card.rank}</span>
        <span className="card__suit-sm">{SUIT_SYMBOL[card.suit]}</span>
      </div>

      {/* Center suit */}
      <div className="card__center">{SUIT_SYMBOL[card.suit]}</div>

      {/* Bottom-right pip (rotated) */}
      <div className="card__corner card__corner--br">
        <span className="card__rank">{card.rank}</span>
        <span className="card__suit-sm">{SUIT_SYMBOL[card.suit]}</span>
      </div>

      {selected && <div className="card__selected-glow" />}
    </div>
  );
}
