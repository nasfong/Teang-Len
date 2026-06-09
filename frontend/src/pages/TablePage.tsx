import { useEffect } from 'react';
import { Navigate, useParams, useNavigate } from 'react-router-dom';
import { useGameStore } from '../store/gameStore';
import { useLobbyStore } from '../store/lobbyStore';
import { socketService } from '../services/socket';
import { useTableHydration } from '../features/table/hooks/useTableHydration';
import { useSeatMapping } from '../features/table/hooks/useSeatMapping';
import { WaitingTable } from '../features/table/components/WaitingTable';
import { GameResults } from '../features/table/components/GameResults';
import { PlayerZone } from '../features/table/components/PlayerZone';
import { TrickArea } from '../features/table/components/TrickArea';
import { ActionBar } from '../features/table/components/ActionBar';
import { GameLog } from '../features/table/components/GameLog';
import { PlaceholderSeat } from '../features/table/components/PlaceholderSeat';
import { TableHUD } from '../features/table/components/TableHUD';
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
    clearError, resetGame, startGame,
  } = useGameStore();

  const { playerId, playerName, room, localSeatIndex } = useLobbyStore();

  const { hydrateError } = useTableHydration(roomIdParam);

  const numPlayers = game ? game.players.length : (room?.maxPlayers ?? 4);
  const { seatBottom, seatRight, seatTop, seatLeft } = useSeatMapping(localSeatIndex, numPlayers);

  useEffect(() => {
    if (!error) return;
    const t = setTimeout(clearError, 3000);
    return () => clearTimeout(t);
  }, [error, clearError]);

  function handleLeave(): void {
    if (roomIdParam && playerId) {
      socketService.emitRoomLeave({ roomId: roomIdParam, playerId });
    }
    resetGame();
    navigate('/room');
  }

  function handleBackToRooms(): void {
    resetGame();
    navigate('/room');
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
        roomIdParam={roomIdParam}
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

  // ── State D — Finished ─────────────────────────────────────────────────────

  if (game.phase === 'game_over') {
    return <GameResults game={game} onBack={handleBackToRooms} />;
  }

  // ── State C — Playing ──────────────────────────────────────────────────────

  const isPlayerTurn      = game.currentPlayer === seatBottom;
  const canSkip           = game.currentTrick.currentHand !== null;
  const currentPlayerName = game.players[game.currentPlayer].name;
  const playerNames       = game.players.map(p => p.name);

  const selectedCards = game.players[seatBottom].hand.filter(c => selectedCardIds.includes(c.id));
  const playValidation: PlayValidation = isPlayerTurn
    ? validatePlay(selectedCards, game.currentTrick.currentHand)
    : { canPlay: false, reason: '' };

  function renderOpponent(seat: PlayerId | null, position: 'top' | 'left' | 'right') {
    if (seat === null) return <PlaceholderSeat />;
    return (
      <PlayerZone
        player={game!.players[seat]}
        isCurrentTurn={game!.currentPlayer === seat}
        isHuman={false}
        position={position}
      />
    );
  }

  const tableClass = numPlayers === 2 ? 'table table--two-player' : 'table';

  return (
    <div className={isGameLogEnabled() ? 'game-root game-root--log' : 'game-root'}>
      {error && (
        <div className="toast toast--error" onClick={clearError}>
          ⚠ {error}
        </div>
      )}

      <div className={tableClass}>

        {/* HUD — replaces old RoomHeader + turn-pill overlays */}
        <div className="table__hud">
          <TableHUD
            playerName={playerName}
            roomId={roomIdParam}
            playerCount={game.players.length}
            maxSeats={maxSeats}
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
            <TrickArea trick={game.currentTrick} playerNames={playerNames} />
          </div>

          <div className="table__side table__side--right">
            {renderOpponent(seatRight, 'right')}
          </div>
        </div>

        <div className="table__bottom">
          <ActionBar
            selectedCount={selectedCardIds.length}
            canSkip={canSkip}
            isPlayerTurn={isPlayerTurn}
            onPlay={playSelectedCards}
            onSkip={skipCurrentTurn}
            currentPlayerName={currentPlayerName}
            playValidation={playValidation}
          />
          <PlayerZone
            player={game.players[seatBottom]}
            isCurrentTurn={isPlayerTurn}
            isHuman={true}
            selectedCardIds={selectedCardIds}
            onCardClick={selectCard}
            position="bottom"
          />
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
