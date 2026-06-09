import { type CSSProperties } from 'react';
import type { GameState, PlayerId } from '../../../game/types';

const RANK_MEDALS = ['🥇', '🥈', '🥉', '🏅'];

interface GameResultsProps {
  game: GameState;
  onBack: () => void;
}

export function GameResults({ game, onBack }: GameResultsProps) {
  const lastRankedId  = game.rankedOrder[game.rankedOrder.length - 1];
  const lastAutoRanked = lastRankedId !== undefined && game.players[lastRankedId].hand.length > 0;

  return (
    <div className="screen screen--gameover">
      <div className="results">
        <div className="results__title">Game Over</div>
        <div className="results__subtitle">Results</div>
        {lastAutoRanked && (
          <p style={{ fontSize: 12, opacity: 0.55, marginBottom: 12, textAlign: 'center' }}>
            Last remaining player automatically assigned final place.
          </p>
        )}
        <div className="results__list">
          {game.rankedOrder.map((pid: PlayerId, i: number) => (
            <div
              key={pid}
              className={`result-row result-row--${i + 1}`}
              style={{ '--delay': `${i * 0.1}s` } as CSSProperties}
            >
              <span className="result-row__medal">{RANK_MEDALS[i]}</span>
              <span className="result-row__name">{game.players[pid].name}</span>
              <span className="result-row__pos">#{i + 1}</span>
            </div>
          ))}
        </div>
        <button className="btn btn--deal" onClick={onBack}>
          Back to Rooms
        </button>
      </div>
    </div>
  );
}
