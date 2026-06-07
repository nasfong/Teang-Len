interface ActionBarProps {
  selectedCount: number;
  canSkip: boolean;
  isPlayerTurn: boolean;
  onPlay: () => void;
  onSkip: () => void;
  currentPlayerName: string;
}

export function ActionBar({
  selectedCount,
  canSkip,
  isPlayerTurn,
  onPlay,
  onSkip,
  currentPlayerName,
}: ActionBarProps) {
  if (!isPlayerTurn) {
    return (
      <div className="action-bar action-bar--waiting">
        <div className="action-bar__hint">
          Waiting for {currentPlayerName}…
        </div>
      </div>
    );
  }

  return (
    <div className="action-bar action-bar--your-turn">
      <div className="action-bar__your-turn-label">Your Turn</div>
      <div className="action-bar__buttons">
        <button
          className={`btn btn--play${selectedCount > 0 ? ' btn--play-ready' : ''}`}
          disabled={selectedCount === 0}
          onClick={onPlay}
        >
          {selectedCount > 0 ? (
            <>
              <span className="btn__badge">{selectedCount}</span>
              Play Cards
            </>
          ) : (
            'Select Cards'
          )}
        </button>

        <button
          className="btn btn--skip"
          disabled={!canSkip}
          onClick={onSkip}
          title={!canSkip ? "Can't skip when opening a trick" : 'Skip this trick'}
        >
          Skip
        </button>
      </div>
      {selectedCount > 0 && (
        <div className="action-bar__hint">
          {selectedCount} card{selectedCount > 1 ? 's' : ''} selected · tap card to deselect
        </div>
      )}
    </div>
  );
}
