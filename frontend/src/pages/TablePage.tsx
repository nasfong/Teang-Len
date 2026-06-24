import { useEffect } from 'react';
import { Navigate, useParams, useNavigate } from 'react-router-dom';
import { useGameStore } from '../store/gameStore';
import { useLobbyStore } from '../store/lobbyStore';
import { socketService } from '../services/socket';
import { useTableHydration } from '../features/table/hooks/useTableHydration';
import { useSeatMapping } from '../features/table/hooks/useSeatMapping';
import { WaitingTable } from '../features/table/components/WaitingTable';
import { GameTable } from '../features/table/components/gametable/GameTable';

export function TablePage() {
  const { roomId: roomIdParam } = useParams<{ roomId?: string }>();
  const navigate = useNavigate();

  const { game, error, clearError, clearGameState, resetGame, startGame } = useGameStore();
  const { playerId, room, localSeatIndex } = useLobbyStore();

  const { hydrateError } = useTableHydration(roomIdParam);

  const numPlayers = game ? game.players.length : (room?.maxPlayers ?? 4);
  const { seatBottom, seatRight, seatTop, seatLeft } = useSeatMapping(localSeatIndex, numPlayers);

  // Auto-clear transient errors
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
        navigate('/rooms');
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
    navigate('/rooms');
  }

  if (!roomIdParam) return <Navigate to="/rooms" replace />;

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

  // ── State B — Waiting room ──────────────────────────────────────────────────
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

  // ── State C / D — Active play + endgame ─────────────────────────────────────
  return (
    <>
      <GameTable onLeave={handleLeave} />
      {error && (
        <div
          onClick={clearError}
          style={{
            position: 'fixed',
            top: 76,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 50,
            padding: '10px 20px',
            borderRadius: 14,
            background: 'rgba(168,40,32,0.95)',
            color: '#fff',
            fontFamily: "'Lilita One', 'Fredoka', 'Comic Sans MS', cursive",
            fontSize: 15,
            boxShadow: '0 6px 16px rgba(0,0,0,0.4)',
            cursor: 'pointer',
          }}
        >
          ⚠ {error}
        </div>
      )}
    </>
  );
}
