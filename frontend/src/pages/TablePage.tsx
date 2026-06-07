import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useGameStore } from '../store/gameStore';
import { useLobbyStore } from '../store/lobbyStore';
import { socketService } from '../services/socket';
import { api } from '../services/api';
import { PlayerZone } from '../components/PlayerZone';
import { TrickArea } from '../components/TrickArea';
import { ActionBar } from '../components/ActionBar';
import { GameLog } from '../components/GameLog';
import type { PlayerId, GameState } from '../game/types';

const RANK_MEDALS = ['🥇', '🥈', '🥉', '🏅'];

const POSITION_LABELS = ['Bottom', 'Right', 'Top', 'Left'] as const;

function seatPositionLabel(seatIdx: number, localSeat: number): string {
  return POSITION_LABELS[(seatIdx - localSeat + 4) % 4];
}

export function TablePage() {
  const { roomId: roomIdParam } = useParams<{ roomId: string }>();
  const navigate = useNavigate();

  const {
    game, error, selectedCardIds,
    selectCard, playSelectedCards, skipCurrentTurn,
    clearError, resetGame, startGame, syncFromServer,
  } = useGameStore();

  const { playerId, room, localSeatIndex, setRoom } = useLobbyStore();

  const [hydrating, setHydrating] = useState(false);
  const [hydrateError, setHydrateError] = useState<string | null>(null);

  // ── Refresh recovery ──────────────────────────────────────────────────────
  // When room is null (page was refreshed): fetch room snapshot, rejoin socket,
  // and restore game state if a game was in progress.
  useEffect(() => {
    if (!roomIdParam || !playerId || room) return; // already hydrated

    setHydrating(true);
    api.getRoom(roomIdParam)
      .then(snapshot => {
        setRoom(snapshot);
        socketService.emitRoomJoin({ roomId: roomIdParam, playerId });
        socketService.emitPlayerReady({ roomId: roomIdParam, playerId });
        if (snapshot.gameState) {
          syncFromServer(snapshot.gameState as GameState);
        }
      })
      .catch(() => {
        // Room is gone — go back to lobby
        setHydrateError('Room not found. Redirecting…');
        setTimeout(() => navigate('/lobby'), 1500);
      })
      .finally(() => setHydrating(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomIdParam, playerId]); // intentionally omits room — only runs until hydrated

  useEffect(() => {
    if (!error) return;
    const t = setTimeout(clearError, 3000);
    return () => clearTimeout(t);
  }, [error, clearError]);

  // ── Shared actions ────────────────────────────────────────────────────────

  function handleLeave() {
    if (roomIdParam && playerId) {
      socketService.emitRoomLeave({ roomId: roomIdParam, playerId });
    }
    resetGame();
    navigate('/lobby');
  }

  function handleBackToLobby() {
    resetGame();
    navigate('/lobby');
  }

  // ── Loading / error during refresh recovery ───────────────────────────────

  if (hydrating || (!room && !hydrateError)) {
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

  const isHost = room?.hostPlayerId === playerId;
  const playerCount = room?.players.length ?? 0;

  // ── Waiting state (pre-game) ──────────────────────────────────────────────

  if (!game) {
    return (
      <div className="screen screen--start">
        <div className="hero">
          <div className="hero__suits">♠ ♣ ♦ ♥</div>
          <h1 className="hero__title">Table</h1>
          <p style={{ fontSize: 11, opacity: 0.4, marginBottom: 16, letterSpacing: 1 }}>
            {roomIdParam?.slice(0, 8).toUpperCase()}
          </p>

          <div style={{ width: '100%', marginBottom: 20 }}>
            {Array.from({ length: room?.maxPlayers ?? 4 }).map((_, i) => {
              const p = room?.players.find(rp => rp.seatIndex === i);
              const isLocalSeat = p?.playerId === playerId;
              const posLabel = localSeatIndex !== null
                ? seatPositionLabel(i, localSeatIndex)
                : `Seat ${i}`;
              return (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '10px 14px',
                    marginBottom: 8,
                    background: isLocalSeat
                      ? 'rgba(99,102,241,0.15)'
                      : p ? 'rgba(255,255,255,0.07)' : 'rgba(255,255,255,0.03)',
                    border: `1px solid ${isLocalSeat
                      ? 'rgba(99,102,241,0.4)'
                      : p ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.05)'}`,
                    borderRadius: 10,
                  }}
                >
                  <div style={{
                    width: 36, height: 36, borderRadius: '50%',
                    background: p ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.05)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 18,
                  }}>
                    {p ? (isLocalSeat ? '🧑' : '👤') : '⏳'}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: p ? 600 : 400, fontSize: 14, opacity: p ? 1 : 0.35, display: 'flex', alignItems: 'center', gap: 6 }}>
                      {p ? p.name : 'Waiting for player…'}
                      {p && p.playerId === room?.hostPlayerId && (
                        <span style={{ fontSize: 10, background: 'rgba(250,204,21,0.15)', color: '#facc15', padding: '1px 5px', borderRadius: 4, fontWeight: 700, letterSpacing: 0.5 }}>
                          HOST
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: 11, opacity: 0.5, marginTop: 2 }}>
                      {posLabel}{isLocalSeat ? ' · you' : ''}
                    </div>
                  </div>
                  {p && (
                    <div style={{
                      width: 8, height: 8, borderRadius: '50%',
                      background: p.isOnline ? '#4ade80' : '#6b7280',
                    }} />
                  )}
                </div>
              );
            })}
          </div>

          <div style={{ display: 'flex', gap: 12, width: '100%' }}>
            <button className="btn" onClick={handleLeave} style={{ flex: 1 }}>
              Leave
            </button>
            {isHost && (
              <button
                className="btn btn--deal"
                onClick={() => startGame()}
                disabled={playerCount < 2}
                style={{ flex: 1 }}
              >
                {playerCount < 2 ? `Need ${2 - playerCount} more` : 'Start Game'}
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ── Game over ─────────────────────────────────────────────────────────────

  if (game.phase === 'game_over') {
    return (
      <div className="screen screen--gameover">
        <div className="results">
          <div className="results__title">Game Over</div>
          <div className="results__subtitle">Results</div>
          <div className="results__list">
            {game.rankedOrder.map((pid, i) => (
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
          <button className="btn btn--deal" onClick={handleBackToLobby}>Back to Lobby</button>
        </div>
      </div>
    );
  }

  // ── Playing state ─────────────────────────────────────────────────────────

  const seat = localSeatIndex ?? 0;
  const seatBottom = seat as PlayerId;
  const seatRight  = ((seat + 1) % 4) as PlayerId;
  const seatTop    = ((seat + 2) % 4) as PlayerId;
  const seatLeft   = ((seat + 3) % 4) as PlayerId;

  const isPlayerTurn      = game.currentPlayer === seatBottom;
  const canSkip           = game.currentTrick.currentHand !== null;
  const currentPlayerName = game.players[game.currentPlayer].name;
  const playerNames       = game.players.map(p => p.name);

  return (
    <div className="game-root">
      {error && (
        <div className="toast toast--error" onClick={clearError}>
          ⚠ {error}
        </div>
      )}

      <div className="turn-pill">
        <span className="turn-pill__dot" />
        {currentPlayerName}'s turn
      </div>

      <div className="table">
        <div className="table__top">
          <PlayerZone
            player={game.players[seatTop]}
            isCurrentTurn={game.currentPlayer === seatTop}
            isHuman={false}
            position="top"
          />
        </div>

        <div className="table__middle">
          <div className="table__side table__side--left">
            <PlayerZone
              player={game.players[seatLeft]}
              isCurrentTurn={game.currentPlayer === seatLeft}
              isHuman={false}
              position="left"
            />
          </div>

          <div className="table__center">
            <TrickArea trick={game.currentTrick} playerNames={playerNames} />
          </div>

          <div className="table__side table__side--right">
            <PlayerZone
              player={game.players[seatRight]}
              isCurrentTurn={game.currentPlayer === seatRight}
              isHuman={false}
              position="right"
            />
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

      <div className="sidebar">
        <GameLog entries={game.log} />
      </div>
    </div>
  );
}
