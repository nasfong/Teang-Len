import { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { LoginPage } from './pages/LoginPage';
import { LobbyPage } from './pages/LobbyPage';
import { TablePage } from './pages/TablePage';
import { useLobbyStore } from './store/lobbyStore';
import { useGameStore } from './store/gameStore';
import { socketService, SERVER_EVENTS } from './services/socket';
import type { GameState } from './game/types';
import type { RoomSnapshot } from './services/api';
import './styles.css';

// ── Route guards ──────────────────────────────────────────────────────────────

function RequireAuth({ children }: { children: React.ReactNode }) {
  const playerId = useLobbyStore(s => s.playerId);
  if (!playerId) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function RequireRoom({ children }: { children: React.ReactNode }) {
  const playerId = useLobbyStore(s => s.playerId);
  const roomId   = useLobbyStore(s => s.roomId);
  if (!playerId) return <Navigate to="/login" replace />;
  if (!roomId)   return <Navigate to="/lobby" replace />;
  return <>{children}</>;
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
        if (triggeredBy === playerId) return; // skip own broadcast
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
      <Route path="/login" element={<LoginPage />} />
      <Route path="/lobby" element={<RequireAuth><LobbyPage /></RequireAuth>} />
      <Route path="/table" element={<RequireRoom><TablePage /></RequireRoom>} />
      {/* Default: send to login; guard will redirect forward if already authed */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
