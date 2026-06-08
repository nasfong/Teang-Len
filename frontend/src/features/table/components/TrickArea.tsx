import { useEffect, useRef, useState } from 'react';
import type { Trick } from '../../../game/types';
import { CardView } from './CardView';

interface TrickAreaProps {
  trick: Trick;
  playerNames: string[];
}

const TYPE_LABEL: Record<string, string> = {
  single:          'SINGLE',
  pair:            'PAIR',
  triple:          'TRIPLE',
  full_house:      'Fulu',
  straight:        'STRAIGHT',
  flush_straight:  'FLUSH STRAIGHT',
  double_sequence: 'DOUBLE SEQ',
  quad:            '💣 QUAD',
};

export function TrickArea({ trick, playerNames }: TrickAreaProps) {
  const prevPlaysCount = useRef(trick.plays.length);
  const [clearing, setClearing]           = useState(false);
  const [displayedTrick, setDisplayedTrick] = useState(trick);

  useEffect(() => {
    const wasPopulated = prevPlaysCount.current > 0;
    const isNowEmpty   = trick.plays.length === 0;

    if (wasPopulated && isNowEmpty) {
      setClearing(true);
      const t = setTimeout(() => {
        setDisplayedTrick(trick);
        setClearing(false);
      }, 400);
      prevPlaysCount.current = 0;
      return () => clearTimeout(t);
    }

    prevPlaysCount.current = trick.plays.length;
    if (!clearing) setDisplayedTrick(trick);
  }, [trick]);

  const shown    = clearing ? displayedTrick : trick;
  const lastPlay = shown.plays[shown.plays.length - 1] ?? null;
  const handType = shown.currentHand?.type;
  const isEmpty  = shown.plays.length === 0;

  return (
    <div className="trick-area">
      <div className={`trick-badge${handType ? ' trick-badge--visible' : ''}`}>
        {handType ? TYPE_LABEL[handType] ?? handType : ''}
      </div>

      <div className={`trick-cards${clearing ? ' trick-cards--clearing' : ''}${isEmpty ? ' trick-cards--empty' : ''}`}>
        {isEmpty ? (
          <div className="trick-empty">
            <div className="trick-empty__icon">🃏</div>
            <div className="trick-empty__text">Play a card</div>
          </div>
        ) : (
          lastPlay && (
            <div className="trick-latest">
              <div className="trick-latest__who">{playerNames[lastPlay.playerId]}</div>
              <div className="trick-latest__cards">
                {lastPlay.hand.cards.map((card, i) => (
                  <div key={card.id} className="trick-latest__card-wrap" style={{ '--i': i } as React.CSSProperties}>
                    <CardView card={card} />
                  </div>
                ))}
              </div>
              {shown.plays.length > 1 && (
                <div className="trick-history">
                  {shown.plays.slice(0, -1).map((play, i) => (
                    <div key={i} className="trick-history__play">
                      <span className="trick-history__name">{playerNames[play.playerId]}</span>
                      <div className="trick-history__cards">
                        {play.hand.cards.map(c => (
                          <CardView key={c.id} card={c} small />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        )}
      </div>
    </div>
  );
}
