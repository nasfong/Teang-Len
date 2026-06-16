import type { PlayValidation } from '../../../game/engine/validation';

interface ActionBarProps {
  selectedCount: number;
  canSkip: boolean;
  isPlayerTurn: boolean;
  onPlay: () => void;
  onSkip: () => void;
  currentPlayerName: string;
  playValidation: PlayValidation;
  isLocked?: boolean;
  turnSecondsLeft?: number | null;
  isUrgent?: boolean;
}

export function ActionBar({
  selectedCount,
  canSkip,
  isPlayerTurn,
  onPlay,
  onSkip,
  currentPlayerName,
  playValidation,
  isLocked = false,
  turnSecondsLeft = null,
  isUrgent = false,
}: ActionBarProps) {
  // Not your turn → subtle floating hint (no buttons), matching the reference.
  if (!isPlayerTurn) {
    return (
      <div className="table-actions table-actions--waiting">
        <div className="table-actions__hint">⌛ {currentPlayerName}'s turn…</div>
      </div>
    );
  }

  const beatReady = playValidation.canPlay && !isLocked;
  const hintText = playValidation.reason
    ? playValidation.reason
    : beatReady && selectedCount > 0
      ? `${selectedCount} card${selectedCount > 1 ? 's' : ''} selected`
      : !canSkip
        ? 'Pick cards to open the trick'
        : null;

  return (
    <div className="table-actions">
      {turnSecondsLeft !== null && (
        <div className={`table-actions__timer${isUrgent ? ' table-actions__timer--urgent' : ''}`}>
          {String(turnSecondsLeft).padStart(2, '0')}
        </div>
      )}

      <div className="table-actions__buttons">
        <button
          className="action-pill action-pill--pass"
          disabled={!canSkip || isLocked}
          onClick={onSkip}
          title={!canSkip ? 'Must open the trick' : 'Pass this trick'}
        >
          PASS
        </button>
        <button
          className={`action-pill action-pill--beat${beatReady ? ' action-pill--beat-ready' : ''}`}
          disabled={!beatReady}
          onClick={onPlay}
        >
          BEAT
          {selectedCount > 0 && <span className="action-pill__badge">{selectedCount}</span>}
        </button>
      </div>

      {hintText && (
        <div className={`table-actions__hint${playValidation.reason ? ' table-actions__hint--invalid' : ''}`}>
          {hintText}
        </div>
      )}
    </div>
  );
}
