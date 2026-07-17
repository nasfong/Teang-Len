import { useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { RoomPage } from './pages/RoomPage';
import { TablePage } from './pages/TablePage';
import { useLobbyStore } from './store/lobbyStore';
import { useGameStore } from './store/gameStore';
import { useAuthStore } from './store/authStore';
import { socketService, SERVER_EVENTS } from './services/socket';
import type { GameState } from './game/types';
import type { RoomSnapshot } from './services/api';
import './styles.css';
import HomePage from './pages/HomePage';
import RegisterPage from './pages/RegisterPage';
import LoginPage from './pages/LoginPage';
import Layout from './layout/Layout';

// ── Route guards ──────────────────────────────────────────────────────────────

function Splash() {
  return (
    <div className="screen screen--start">
      <div className="hero">
        <p style={{ opacity: 0.6, fontSize: 14 }}>Loading…</p>
      </div>
    </div>
  );
}

// Auth state is the single source of truth for access. While a stored token is
// being validated (status 'loading') we wait, so a refresh never flashes login.
function RequireAuth({ children }: { children: React.ReactNode }) {
  const status = useAuthStore(s => s.status);
  if (status === 'loading' || status === 'idle') return <Splash />;
  if (status !== 'authenticated') return <Navigate to="/login" replace />;
  return <>{children}</>;
}

// Smart catch-all: authenticated users land on Home, everyone else on /login.
function CatchAll() {
  const status = useAuthStore(s => s.status);
  if (status === 'loading' || status === 'idle') return <Splash />;
  return <Navigate to={status === 'authenticated' ? '/home' : '/login'} replace />;
}

// ── App ───────────────────────────────────────────────────────────────────────

export default function App() {
  const navigate = useNavigate();
  const { setRoom } = useLobbyStore();
  const { syncFromServer, resetGame } = useGameStore();

  const status = useAuthStore(s => s.status);
  const playerId = useAuthStore(s => s.user?.id ?? null);

  // Validate any stored token once on launch (auto-login / session restore).
  useEffect(() => {
    void useAuthStore.getState().restoreSession();
  }, []);

  // Global socket listeners — scoped to an authenticated session.
  useEffect(() => {
    if (status !== 'authenticated' || !playerId) return;
    const { socket } = socketService;

    // On (re)connect, rejoin the active room so a dropped socket recovers.
    socket.on('connect', () => {
      const { playerId: pid, roomId } = useLobbyStore.getState();
      if (pid && roomId) socketService.emitRoomJoin({ roomId, playerId: pid });
    });

    socket.on(
      SERVER_EVENTS.GAME_UPDATE,
      ({ gameState, triggeredBy }: { gameState: GameState; triggeredBy: string; version: number }) => {
        if (triggeredBy === playerId) return;
        syncFromServer(gameState);
      },
    );

    // Match settled server-side (winner took the pot) — pull authoritative
    // balances so every client's coin display reflects the payout/loss.
    socket.on(SERVER_EVENTS.GAME_END, () => {
      void useAuthStore.getState().refreshWallet();
    });

    socket.on(SERVER_EVENTS.ROOM_UPDATE, ({ room }: { room: RoomSnapshot }) => {
      const stillInRoom = room.players.some(p => p.playerId === playerId);
      const { roomId: currentRoomId } = useLobbyStore.getState();
      if (!stillInRoom && currentRoomId === room.roomId) {
        const { game } = useGameStore.getState();
        if (game?.phase === 'game_over') {
          // Let the 3-second result display finish first; TablePage handles the redirect.
          useLobbyStore.getState().setPendingLeave(true);
          return;
        }
        resetGame();
        navigate('/rooms');
        return;
      }
      setRoom(room);
    });

    return () => {
      socket.off('connect');
      socket.off(SERVER_EVENTS.GAME_UPDATE);
      socket.off(SERVER_EVENTS.GAME_END);
      socket.off(SERVER_EVENTS.ROOM_UPDATE);
    };
  }, [status, playerId, syncFromServer, setRoom, resetGame, navigate]);

  return (
    <Routes>
      <Route element={<Layout image="/background.png" />}>
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/home" element={<RequireAuth><HomePage /></RequireAuth>} />
        <Route path="/rooms" element={<RequireAuth><RoomPage /></RequireAuth>} />
        <Route path="/room" element={<Navigate to="/rooms" replace />} />
        <Route path="/table" element={<Navigate to="/rooms" replace />} />
        <Route path="*" element={<CatchAll />} />
      </Route>
      <Route element={<Layout image="/table-background.png" />}>
        <Route path="/table/:roomId" element={<RequireAuth><TablePage /></RequireAuth>} />
      </Route>
    </Routes>
  );
}
