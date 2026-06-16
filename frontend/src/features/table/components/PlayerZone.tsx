import React from 'react';
import type { Player, Card } from '../../../game/types';
import type { DealPhase } from '../hooks/useDealAnimation';
import { CardView } from './CardView';

interface PlayerZoneProps {
  player: Player;
  isCurrentTurn: boolean;
  isHuman: boolean;
  selectedCardIds?: string[];
  onCardClick?: (cardId: string) => void;
  position: 'bottom' | 'left' | 'top' | 'right';
  dealPhase?: DealPhase;
  revealedCount?: number;
  dealOrder?: number[];
  bombCardIds?: Set<string>;
  turnSecondsLeft?: number | null;
  isUrgent?: boolean;
  isEndgame?: boolean;
  /** Visual-only placeholder until the backend exposes balances (see TablePage). */
  coins?: string;
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
  dealPhase,
  revealedCount = 0,
  dealOrder = [],
  bombCardIds,
  turnSecondsLeft = null,
  isUrgent = false,
  isEndgame = false,
  coins,
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
        isEndgame ? 'pzone--endgame' : '',
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
            turnSecondsLeft !== null
              ? <div className={`pzone__timer${isUrgent ? ' pzone__timer--urgent' : ''}`}>{String(turnSecondsLeft).padStart(2, '0')}</div>
              : <div className="pzone__turn-arrow">▶</div>
          )}
          {coins && (
            <div className="pzone__coins">
              <span className="pzone__coins-icon">🪙</span>
              {coins}
            </div>
          )}
        </div>
      )}

      {isHuman ? (
        <HumanHand
          cards={player.hand}
          selectedCardIds={selectedCardIds}
          onCardClick={onCardClick}
          dealPhase={dealPhase}
          revealedCount={revealedCount}
          dealOrder={dealOrder}
          bombCardIds={bombCardIds}
        />
      ) : (
        <OpponentHand
          count={player.hand.length}
          isVertical={isVertical}
          isActive={isCurrentTurn}
        />
      )}

      {isEndgame && player.rank !== null && (
        <div className="pzone__endgame-badge">
          <span className="pzone__endgame-badge__emoji">{RANK_EMOJI[player.rank]}</span>
          <span className="pzone__endgame-badge__label">{RANK_LABEL[player.rank]}</span>
        </div>
      )}
    </div>
  );
}

interface HumanHandProps {
  cards: Card[];
  selectedCardIds: string[];
  onCardClick?: (cardId: string) => void;
  dealPhase?: DealPhase;
  revealedCount: number;
  dealOrder: number[];
  bombCardIds?: Set<string>;
}

function HumanHand({ cards, selectedCardIds, onCardClick, dealPhase, revealedCount, dealOrder, bombCardIds }: HumanHandProps) {
  const total     = cards.length;
  const overlapPx = Math.max(18, Math.min(40, Math.floor(340 / Math.max(total, 1))));
  const innerW    = total > 0 ? `${(total - 1) * overlapPx + 72}px` : '0px';

  // ── Progressive reveal (dealing phase) ─────────────────────────────────────
  if (dealPhase === 'dealing') {
    const revealedSet      = new Set(dealOrder.slice(0, revealedCount));
    const justRevealedId   = revealedCount > 0
      ? (cards[dealOrder[revealedCount - 1]]?.id ?? null)
      : null;

    // Revealed cards appear in their final sorted order (cards[] is pre-sorted).
    // Pending backs fill the remaining positions to the right.
    const revealedCards = cards.filter((_, i) => revealedSet.has(i));
    const pendingCards  = cards.filter((_, i) => !revealedSet.has(i));

    return (
      <div className="hand-fan hand-fan--dealing" style={{ '--card-count': total } as React.CSSProperties}>
        <div className="hand-fan__inner" style={{ width: innerW }}>

          {revealedCards.map((card, pos) => (
            <div
              key={card.id}
              className={`hand-fan__slot${card.id === justRevealedId ? ' hand-fan__slot--just-revealed' : ''}`}
              style={{ left: `${pos * overlapPx}px` }}
            >
              <CardView card={card} />
            </div>
          ))}

          {pendingCards.map((card, idx) => (
            <div
              key={card.id}
              className="hand-fan__slot"
              style={{ left: `${(revealedCount + idx) * overlapPx}px` }}
            >
              <CardView card={card} faceDown={true} />
            </div>
          ))}

        </div>
      </div>
    );
  }

  // ── Normal play (playing / reconnected / idle) ──────────────────────────────
  return (
    <div className="hand-fan" style={{ '--card-count': total } as React.CSSProperties}>
      <div className="hand-fan__inner" style={{ width: innerW }}>
        {cards.map((card, i) => {
          const selected = selectedCardIds.includes(card.id);
          const isBomb   = bombCardIds?.has(card.id) ?? false;
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
                bombGlow={isBomb}
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
