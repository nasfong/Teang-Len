interface TableHUDProps {
  playerName: string | null;
  roomId: string;
  playerCount: number;
  maxSeats: number;
  isPlaying?: boolean;
  isQueuedToLeave?: boolean;
  onQueueLeave?: () => void;
  onCancelLeave?: () => void;
}

export function TableHUD({
  playerName,
  roomId,
  playerCount,
  maxSeats,
  isPlaying = false,
  isQueuedToLeave = false,
  onQueueLeave,
  onCancelLeave,
}: TableHUDProps) {
  const initial = (playerName ?? 'G')[0].toUpperCase();

  return (
    <div className="hud">
      <div className="hud__left">
        <div className="hud__avatar">{initial}</div>
        <div className="hud__info">
          <span className="hud__name">{playerName ?? 'Guest'}</span>
          <span className="hud__coins">💰 0</span>
        </div>
      </div>

      <div className="hud__right">
        <span className="hud__room-code">{roomId.slice(0, 6).toUpperCase()}</span>
        <span className="hud__sep" />
        <span className="hud__room-count">👥 {playerCount}/{maxSeats}</span>

        {isPlaying && (
          isQueuedToLeave ? (
            <div className="hud__leave-queue">
              <span className="hud__leave-queue-label">Leaving after match</span>
              <button
                className="hud__leave-cancel"
                onClick={onCancelLeave}
                aria-label="Cancel queued leave"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              className="hud__leave-btn"
              onClick={onQueueLeave}
              aria-label="Leave after current match"
            >
              Leave
            </button>
          )
        )}

        <button className="hud__settings" aria-label="Settings">⚙</button>
      </div>
    </div>
  );
}
