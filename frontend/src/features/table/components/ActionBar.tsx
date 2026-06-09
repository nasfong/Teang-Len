import type { PlayValidation } from '../../../game/engine/validation';

interface ActionBarProps {
  selectedCount: number;
  canSkip: boolean;
  isPlayerTurn: boolean;
  onPlay: () => void;
  onSkip: () => void;
  currentPlayerName: string;
  playValidation: PlayValidation;
}

export function ActionBar({
  selectedCount,
  canSkip,
  isPlayerTurn,
  onPlay,
  onSkip,
  currentPlayerName,
  playValidation,
}: ActionBarProps) {
  if (!isPlayerTurn) {
    return (
      <div className="action-bar action-bar--waiting">
        <div className="action-bar__hint">
          ⌛ {currentPlayerName}'s turn…
        </div>
      </div>
    );
  }

  const hintText = playValidation.reason
    ? playValidation.reason
    : playValidation.canPlay && selectedCount > 0
      ? `${selectedCount} card${selectedCount > 1 ? 's' : ''} selected · tap to deselect`
      : null;

  return (
    <div className="action-bar">
      <div className="action-bar__your-turn-label">YOUR TURN</div>
      <div className="action-bar__buttons">
        <button
          className="btn btn--skip"
          disabled={!canSkip}
          onClick={onSkip}
          title={!canSkip ? 'Must open the trick' : 'Pass this trick'}
        >
          PASS
        </button>
        <button
          className={`btn btn--play${playValidation.canPlay ? ' btn--play-ready' : ''}`}
          disabled={!playValidation.canPlay}
          onClick={onPlay}
        >
          {selectedCount > 0
            ? <>PLAY <span className="btn__badge">{selectedCount}</span></>
            : 'SELECT CARDS'
          }
        </button>
      </div>
      {hintText && (
        <div className={`action-bar__hint${playValidation.reason ? ' action-bar__hint--invalid' : ''}`}>
          {hintText}
        </div>
      )}
    </div>
  );
}
