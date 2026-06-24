import { useEffect } from 'react';
import { Navigate, useParams, useNavigate } from 'react-router-dom';
import { useGameStore } from '../store/gameStore';
import { useLobbyStore } from '../store/lobbyStore';
import { socketService } from '../services/socket';
import { useTableHydration } from '../features/table/hooks/useTableHydration';
import { useSeatMapping } from '../features/table/hooks/useSeatMapping';
import { useDealAnimation } from '../features/table/hooks/useDealAnimation';
import { useTurnTimer } from '../features/table/hooks/useTurnTimer';
import { WaitingTable } from '../features/table/components/WaitingTable';
import { PlayerZone } from '../features/table/components/PlayerZone';
import { TrickArea } from '../features/table/components/TrickArea';
import { ActionBar } from '../features/table/components/ActionBar';
import { GameLog } from '../features/table/components/GameLog';
import { PlaceholderSeat } from '../features/table/components/PlaceholderSeat';
import { TableHUD } from '../features/table/components/TableHUD';
import { GameStartBanner } from '../features/table/components/GameStartBanner';
import { isGameLogEnabled } from '../game/rules/rules';
import { validatePlay } from '../game/engine/validation';
import type { PlayerId } from '../game/types';
import type { PlayValidation } from '../game/engine/validation';

export function TablePage() {
  const { roomId: roomIdParam } = useParams<{ roomId?: string }>();
  const navigate = useNavigate();

  const {
    game, error, selectedCardIds,
    selectCard, playSelectedCards, skipCurrentTurn,
    clearError, clearGameState, resetGame, startGame,
  } = useGameStore();

  const { playerId, playerName, room, localSeatIndex } = useLobbyStore();

  const { hydrateError } = useTableHydration(roomIdParam);

  const numPlayers = game ? game.players.length : (room?.maxPlayers ?? 4);
  const { seatBottom, seatRight, seatTop, seatLeft } = useSeatMapping(localSeatIndex, numPlayers);

  // Must be called before any early returns — Rules of Hooks
  const { dealPhase, revealedCount, dealOrder, bombCardIds, isLocked, showBanner } = useDealAnimation(game, localSeatIndex);
  const { secondsLeft, isUrgent, notification } = useTurnTimer(game, localSeatIndex);

  useEffect(() => {
    if (!error) return;
    const t = setTimeout(clearError, 3000);
    return () => clearTimeout(t);
  }, [error, clearError]);

  // Auto-transition out of endgame after 3 seconds
  useEffect(() => {
    if (game?.phase !== 'game_over') return;
    const t = setTimeout(() => {
      const { pendingLeave } = useLobbyStore.getState();
      if (pendingLeave) {
        resetGame();
        navigate('/room');
      } else {
        clearGameState();
      }
    }, 3000);
    return () => clearTimeout(t);
  }, [game?.phase, clearGameState, resetGame, navigate]);

  function handleLeave(): void {
    if (roomIdParam && playerId) {
      socketService.emitRoomLeave({ roomId: roomIdParam, playerId });
    }
    resetGame();
    navigate('/room');
  }

  function handleQueueLeave(): void {
    if (roomIdParam && playerId) {
      socketService.emitRoomQueueLeave({ roomId: roomIdParam, playerId });
    }
  }

  function handleCancelLeave(): void {
    if (roomIdParam && playerId) {
      socketService.emitRoomCancelQueueLeave({ roomId: roomIdParam, playerId });
    }
  }

  if (!roomIdParam) return <Navigate to="/room" replace />;

  if (!room && !hydrateError) {
    return (
      <div className="screen screen--start">
        <div className="hero">
          <p style={{ opacity: 0.5, fontSize: 14 }}>Reconnecting…</p>
        </div>
      </div>
    );
  }

  if (hydrateError) {
    return (
      <div className="screen screen--start">
        <div className="hero">
          <p style={{ color: '#f87171', fontSize: 14 }}>{hydrateError}</p>
        </div>
      </div>
    );
  }

  const isHost      = room?.hostPlayerId === playerId;
  const playerCount = room?.players.length ?? 0;
  const maxSeats    = room?.maxPlayers ?? 4;

  // ── State B — Waiting ──────────────────────────────────────────────────────

  if (!game) {
    return (
      <WaitingTable
        room={room}
        playerId={playerId}
        maxSeats={maxSeats}
        seats={{ bottom: seatBottom, right: seatRight, top: seatTop, left: seatLeft }}
        playerCount={playerCount}
        isHost={isHost}
        onStart={startGame}
        onLeave={handleLeave}
      />
    );
  }

  // ── State C — Playing (+ endgame result display) ──────────────────────────

  const isEndgame         = game.phase === 'game_over';
  const isPlayerTurn      = !isEndgame && game.currentPlayer === seatBottom;
  const canSkip           = game.currentTrick.currentHand !== null;
  const currentPlayerName = game.players[game.currentPlayer].name;
  const playerNames       = game.players.map(p => p.name);
  const isQueuedToLeave   = room?.pendingLeavePlayerIds?.includes(playerId ?? '') ?? false;

  const selectedCards = game.players[seatBottom].hand.filter(c => selectedCardIds.includes(c.id));
  const playValidation: PlayValidation = isPlayerTurn
    ? validatePlay(selectedCards, game.currentTrick.currentHand)
    : { canPlay: false, reason: '' };

  // Visual-only balances until the backend exposes player balances.
  const coinFor = (seat: PlayerId): string => ['25.0M', '15.0M', '20.1M', '50K'][seat % 4];

  function renderOpponent(seat: PlayerId | null, position: 'top' | 'left' | 'right') {
    if (seat === null) return <PlaceholderSeat />;
    const isTurn = !isEndgame && game!.currentPlayer === seat;
    return (
      <PlayerZone
        player={game!.players[seat]}
        isCurrentTurn={isTurn}
        isHuman={false}
        position={position}
        turnSecondsLeft={isTurn ? secondsLeft : null}
        isUrgent={isTurn ? isUrgent : false}
        isEndgame={isEndgame}
        coins={coinFor(seat)}
      />
    );
  }

  const tableClass = numPlayers === 2 ? 'table table--two-player' : 'table';

  return (
    <div className={isGameLogEnabled() ? 'game-root game-root--log' : 'game-root'}>
      <GameStartBanner show={showBanner} />

      {error && (
        <div className="toast toast--error" onClick={clearError}>
          ⚠ {error}
        </div>
      )}
      {notification && (
        <div className="toast toast--info">{notification}</div>
      )}

      <div className={tableClass}>

        {/* HUD — replaces old RoomHeader + turn-pill overlays */}
        <div className="table__hud">
          <TableHUD
            playerName={playerName}
            roomId={roomIdParam}
            playerCount={game.players.length}
            maxSeats={maxSeats}
            isPlaying={!isEndgame}
            isQueuedToLeave={isQueuedToLeave}
            onQueueLeave={handleQueueLeave}
            onCancelLeave={handleCancelLeave}
          />
        </div>

        <div className="table__top">
          {renderOpponent(seatTop, 'top')}
        </div>

        <div className="table__middle">
          <div className="table__side table__side--left">
            {renderOpponent(seatLeft, 'left')}
          </div>

          <div className="table__center">
            {!isEndgame && (
              <>
                <TrickArea trick={game.currentTrick} playerNames={playerNames} />
                <ActionBar
                  selectedCount={selectedCardIds.length}
                  canSkip={canSkip}
                  isPlayerTurn={isPlayerTurn}
                  onPlay={playSelectedCards}
                  onSkip={skipCurrentTurn}
                  currentPlayerName={currentPlayerName}
                  playValidation={playValidation}
                  isLocked={isLocked}
                  turnSecondsLeft={isPlayerTurn ? secondsLeft : null}
                  isUrgent={isPlayerTurn ? isUrgent : false}
                />
              </>
            )}
          </div>

          <div className="table__side table__side--right">
            {renderOpponent(seatRight, 'right')}
          </div>
        </div>

        <div className="table__bottom">
          {/* Local player badge — bottom-left corner */}
          <div className="table__me-badge">
            <div className="table__me-avatar">{(playerName ?? 'G')[0].toUpperCase()}</div>
            <div className="table__me-meta">
              <span className="table__me-name">{playerName ?? 'You'}</span>
              <span className="table__me-coins">🪙 {coinFor(seatBottom)}</span>
            </div>
          </div>

          <PlayerZone
            player={game.players[seatBottom]}
            isCurrentTurn={isPlayerTurn}
            isHuman={true}
            selectedCardIds={isEndgame ? [] : selectedCardIds}
            onCardClick={isEndgame || isLocked ? undefined : selectCard}
            position="bottom"
            dealPhase={dealPhase}
            revealedCount={revealedCount}
            dealOrder={dealOrder}
            bombCardIds={bombCardIds}
            isEndgame={isEndgame}
          />

          {/* Sort hand — bottom-right corner (visual placeholder) */}
          <button className="table__sort-btn" aria-label="Sort hand" title="Sort hand">🔄</button>
        </div>

      </div>

      {isGameLogEnabled() && (
        <div className="sidebar">
          <GameLog entries={game.log} />
        </div>
      )}
    </div>
  );
}
