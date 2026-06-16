import type { Card } from '../../../../game/types';
import { GameCard } from './GameCard';

interface PlayerHandProps {
  cards: Card[];
  selectedCardIds: string[];
  onCardClick?: (cardId: string) => void;
}

/** The local player's fanned, clickable hand pinned to the bottom of the table. */
export function PlayerHand({ cards, selectedCardIds, onCardClick }: PlayerHandProps) {
  const total = cards.length;
  // Tighten the overlap as the hand grows so it stays on-screen.
  const overlap = Math.max(24, Math.min(48, Math.floor(620 / Math.max(total, 1))));
  const innerW = total > 0 ? (total - 1) * overlap + 56 : 0;

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        width: '100%',
        paddingBottom: 'env(safe-area-inset-bottom, 6px)',
      }}
    >
      <div style={{ position: 'relative', width: innerW, height: 92 }}>
        {cards.map((card, i) => (
          <div
            key={card.id}
            style={{
              position: 'absolute',
              left: i * overlap,
              bottom: 0,
              zIndex: selectedCardIds.includes(card.id) ? 100 : i,
            }}
          >
            <GameCard
              card={card}
              selected={selectedCardIds.includes(card.id)}
              onClick={onCardClick}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
