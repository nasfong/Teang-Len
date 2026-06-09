import React from 'react';
import type { Player, Card } from '../../../game/types';
import { CardView } from './CardView';

interface PlayerZoneProps {
  player: Player;
  isCurrentTurn: boolean;
  isHuman: boolean;
  selectedCardIds?: string[];
  onCardClick?: (cardId: string) => void;
  position: 'bottom' | 'left' | 'top' | 'right';
}

const RANK_EMOJI: Record<number, string> = { 1: '🥇', 2: '🥈', 3: '🥉', 4: '🏅' };
const RANK_LABEL: Record<number, string> = { 1: '1st', 2: '2nd', 3: '3rd', 4: '4th' };

export function PlayerZone({
  player,
  isCurrentTurn,
  isHuman,
  selectedCardIds = [],
  onCardClick,
  position,
}: PlayerZoneProps) {
  const isFinished = player.rank !== null;
  const isVertical = position === 'left' || position === 'right';

  return (
    <div
      className={[
        'pzone',
        `pzone--${position}`,
        isCurrentTurn && !isFinished ? 'pzone--active' : '',
        isFinished ? 'pzone--finished' : '',
        player.skipped ? 'pzone--skipped' : '',
      ].filter(Boolean).join(' ')}
    >
      {/* Seat card — opponents only; local player info lives in the HUD */}
      {!isHuman && (
        <div className="pzone__info">
          <div className="pzone__avatar">
            {player.name[0].toUpperCase()}
            {isCurrentTurn && !isFinished && <span className="pzone__pulse" />}
          </div>
          <div className="pzone__meta">
            <span className="pzone__name">{player.name}</span>
            <span className="pzone__cards-left">
              {isFinished
                ? `${RANK_EMOJI[player.rank!]} ${RANK_LABEL[player.rank!]}`
                : player.skipped
                  ? '⏭ Skipped'
                  : `${player.hand.length} cards`}
            </span>
          </div>
          {isCurrentTurn && !isFinished && (
            <div className="pzone__turn-arrow">▶</div>
          )}
        </div>
      )}

      {isHuman ? (
        <HumanHand
          cards={player.hand}
          selectedCardIds={selectedCardIds}
          onCardClick={onCardClick}
        />
      ) : (
        <OpponentHand
          count={player.hand.length}
          isVertical={isVertical}
          isActive={isCurrentTurn}
        />
      )}
    </div>
  );
}

interface HumanHandProps {
  cards: Card[];
  selectedCardIds: string[];
  onCardClick?: (cardId: string) => void;
}

function HumanHand({ cards, selectedCardIds, onCardClick }: HumanHandProps) {
  const total = cards.length;
  const overlapPx = Math.max(18, Math.min(40, Math.floor(340 / Math.max(total, 1))));

  return (
    <div className="hand-fan" style={{ '--card-count': total } as React.CSSProperties}>
      <div
        className="hand-fan__inner"
        style={{ width: total > 0 ? `${(total - 1) * overlapPx + 72}px` : '0px' }}
      >
        {cards.map((card, i) => {
          const selected = selectedCardIds.includes(card.id);
          return (
            <div
              key={card.id}
              className={`hand-fan__slot${selected ? ' hand-fan__slot--selected' : ''}`}
              style={{ left: `${i * overlapPx}px` }}
            >
              <CardView
                card={card}
                selected={selected}
                onClick={() => onCardClick?.(card.id)}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

function OpponentHand({
  count,
  isVertical,
  isActive,
}: {
  count: number;
  isVertical: boolean;
  isActive: boolean;
}) {
  const show = Math.min(count, 10);
  return (
    <div className={`opp-hand${isVertical ? ' opp-hand--vertical' : ''}`}>
      {Array.from({ length: show }).map((_, i) => (
        <div
          key={i}
          className={`opp-card${isActive ? ' opp-card--active' : ''}`}
          style={{ '--idx': i } as React.CSSProperties}
        />
      ))}
      {count > 10 && <span className="opp-hand__extra">+{count - 10}</span>}
    </div>
  );
}
