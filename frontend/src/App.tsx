import { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { EnterPage } from './pages/EnterPage';
import { RoomPage } from './pages/RoomPage';
import { TablePage } from './pages/TablePage';
import { useLobbyStore } from './store/lobbyStore';
import { useGameStore } from './store/gameStore';
import { socketService, SERVER_EVENTS } from './services/socket';
import type { GameState } from './game/types';
import type { RoomSnapshot } from './services/api';
import './styles.css';

// ── Route guards ──────────────────────────────────────────────────────────────

// lobbyStore is seeded from localStorage at module init, so this guard passes
// immediately on refresh without any async bootstrap step.
function RequireAuth({ children }: { children: React.ReactNode }) {
  const playerId = useLobbyStore(s => s.playerId);
  if (!playerId) return <Navigate to="/enter" replace />;
  return <>{children}</>;
}

// Smart catch-all: authenticated users go to /room, new visitors to /enter.
function CatchAll() {
  const playerId = useLobbyStore(s => s.playerId);
  return <Navigate to={playerId ? '/room' : '/enter'} replace />;
}

// ── App ───────────────────────────────────────────────────────────────────────

export default function App() {
  const { playerId, setRoom } = useLobbyStore();
  const { syncFromServer }    = useGameStore();

  // Global socket listeners — scoped to authenticated session
  useEffect(() => {
    if (!playerId) return;
    const { socket } = socketService;

    socket.on(
      SERVER_EVENTS.GAME_UPDATE,
      ({ gameState, triggeredBy }: { gameState: GameState; triggeredBy: string; version: number }) => {
        if (triggeredBy === playerId) return;
        syncFromServer(gameState);
      },
    );

    socket.on(SERVER_EVENTS.ROOM_UPDATE, ({ room }: { room: RoomSnapshot }) => {
      setRoom(room);
    });

    return () => {
      socket.off(SERVER_EVENTS.GAME_UPDATE);
      socket.off(SERVER_EVENTS.ROOM_UPDATE);
    };
  }, [playerId, syncFromServer, setRoom]);

  return (
    <Routes>
      <Route path="/enter" element={<EnterPage />} />
      <Route path="/room" element={<RequireAuth><RoomPage /></RequireAuth>} />
      {/* /table (no roomId) redirects to /room */}
      <Route path="/table" element={<Navigate to="/room" replace />} />
      {/* /table/:roomId — waiting / playing / finished */}
      <Route path="/table/:roomId" element={<RequireAuth><TablePage /></RequireAuth>} />
      <Route path="*" element={<CatchAll />} />
    </Routes>
  );
}
