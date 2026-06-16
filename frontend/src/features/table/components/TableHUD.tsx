interface TableHUDProps {
  playerName: string | null;
  roomId: string;
  playerCount: number;
  maxSeats: number;
  isPlaying?: boolean;
  isQueuedToLeave?: boolean;
  onQueueLeave?: () => void;
  onCancelLeave?: () => void;
  /** Visual-only placeholders until the backend exposes these (see TablePage). */
  gems?: string;
  spectators?: number;
}

export function TableHUD({
  roomId,
  playerCount,
  maxSeats,
  isPlaying = false,
  isQueuedToLeave = false,
  onQueueLeave,
  onCancelLeave,
  gems = '50K',
  spectators = 0,
}: TableHUDProps) {
  return (
    <div className="hud">
      {/* Left: stat cluster — gems + spectators + signal */}
      <div className="hud__stats">
        <div className="hud__stat">
          <span className="hud__stat-icon hud__stat-icon--gems">🪙</span>
          <span className="hud__stat-val">{gems}</span>
          <span className="hud__stat-label">GEMS</span>
        </div>
        <div className="hud__stat">
          <span className="hud__stat-icon">👥</span>
          <span className="hud__stat-val">{spectators}</span>
          <span className="hud__stat-label">SPECTATORS</span>
        </div>
        <div className="hud__signal" title={`Room ${roomId.slice(0, 6).toUpperCase()} · ${playerCount}/${maxSeats}`}>
          <span className="hud__signal-icon">📶</span>
          <span className="hud__signal-label">SIGNAL</span>
        </div>
      </div>

      {/* Right: leave button */}
      <div className="hud__right">
        {isPlaying ? (
          isQueuedToLeave ? (
            <button className="hud__leave-btn hud__leave-btn--queued" onClick={onCancelLeave}>
              LEAVING…
            </button>
          ) : (
            <button className="hud__leave-btn" onClick={onQueueLeave}>
              LEAVE
            </button>
          )
        ) : (
          <button className="hud__leave-btn" onClick={onQueueLeave}>
            LEAVE
          </button>
        )}
      </div>
    </div>
  );
}
