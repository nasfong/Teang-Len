import type { GameState, PlayerId } from '../../../game/types';

const RANK_MEDALS = ['🥇', '🥈', '🥉', '🏅'];

interface GameResultsProps {
  game: GameState;
  onBack: () => void;
}

export function GameResults({ game, onBack }: GameResultsProps) {
  return (
    <div className="screen screen--gameover">
      <div className="results">
        <div className="results__title">Game Over</div>
        <div className="results__subtitle">Results</div>
        <div className="results__list">
          {game.rankedOrder.map((pid: PlayerId, i: number) => (
            <div
              key={pid}
              className={`result-row result-row--${i + 1}`}
              style={{ '--delay': `${i * 0.1}s` } as React.CSSProperties}
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
