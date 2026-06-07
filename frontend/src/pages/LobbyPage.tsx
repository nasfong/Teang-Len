import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { socketService, SERVER_EVENTS } from '../services/socket';
import { useLobbyStore } from '../store/lobbyStore';
import type { RoomSnapshot } from '../services/api';

const POLL_INTERVAL_MS = 5000;

export function LobbyPage() {
  const { playerId, playerName, setRoom } = useLobbyStore();
  const navigate = useNavigate();

  const [rooms, setRooms]               = useState<RoomSnapshot[]>([]);
  const [loadingRooms, setLoadingRooms] = useState(false);
  const [joiningRoomId, setJoiningRoomId] = useState<string | null>(null);
  const [creatingRoom, setCreatingRoom] = useState(false);
  const [err, setErr]                   = useState<string | null>(null);

  // ── Room list fetch ────────────────────────────────────────────────────────

  const fetchRooms = useCallback(async () => {
    setLoadingRooms(true);
    try {
      const list = await api.listRooms();
      setRooms(list);
    } catch {
      // silent — user can refresh manually
    } finally {
      setLoadingRooms(false);
    }
  }, []);

  // Initial load + auto-poll every 5 s
  useEffect(() => {
    let active = true;
    api.listRooms()
      .then(list => { if (active) setRooms(list); })
      .catch(() => {});
    const timer = setInterval(() => {
      if (active) fetchRooms();
    }, POLL_INTERVAL_MS);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [fetchRooms]);

  // Re-fetch immediately when backend signals any room changed
  useEffect(() => {
    const { socket } = socketService;
    const handler = () => { fetchRooms(); };
    socket.on(SERVER_EVENTS.ROOM_LIST_UPDATE, handler);
    return () => { socket.off(SERVER_EVENTS.ROOM_LIST_UPDATE, handler); };
  }, [fetchRooms]);

  // ── Enter table ───────────────────────────────────────────────────────────

  function enterRoom(snapshot: RoomSnapshot, myPlayerId: string) {
    socketService.emitRoomJoin({ roomId: snapshot.roomId, playerId: myPlayerId });
    socketService.emitPlayerReady({ roomId: snapshot.roomId, playerId: myPlayerId });
    setRoom(snapshot);
    navigate(`/table/${snapshot.roomId}`);
  }

  // ── Create room ────────────────────────────────────────────────────────────

  async function handleCreateRoom() {
    if (!playerId) return;
    setCreatingRoom(true);
    setErr(null);
    try {
      const snapshot = await api.createRoom(playerId, 4);
      enterRoom(snapshot, playerId);
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : 'Failed to create room');
      setCreatingRoom(false);
    }
  }

  // ── Join room ──────────────────────────────────────────────────────────────

  async function handleJoinRoom(targetRoomId: string) {
    if (!playerId) return;
    setJoiningRoomId(targetRoomId);
    setErr(null);
    try {
      const snapshot = await api.joinRoom(targetRoomId, playerId);
      enterRoom(snapshot, playerId);
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : 'Failed to join room');
      setJoiningRoomId(null);
    }
  }

  const isBusy = creatingRoom || joiningRoomId !== null;

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="screen screen--start">
      <div className="hero">
        <div className="hero__suits">♠ ♣ ♦ ♥</div>
        <h1 className="hero__title">ទាំងឡែន</h1>
        <p className="hero__latin" style={{ marginBottom: 16 }}>Hello, {playerName}</p>

        <button
          className="btn btn--deal"
          onClick={handleCreateRoom}
          disabled={isBusy}
          style={{ marginBottom: 20, width: '100%' }}
        >
          {creatingRoom ? 'Creating…' : '+ Create Room'}
        </button>

        <div style={{
          width: '100%', marginBottom: 8,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <span style={{ opacity: 0.6, fontSize: 13 }}>
            Open Rooms
            {loadingRooms && <span style={{ opacity: 0.4, marginLeft: 6 }}>↻</span>}
          </span>
          <button
            className="btn"
            onClick={fetchRooms}
            disabled={loadingRooms || isBusy}
            style={{ fontSize: 12, padding: '4px 10px' }}
          >
            {loadingRooms ? '…' : '↻ Refresh'}
          </button>
        </div>

        {rooms.length === 0 ? (
          <p style={{ opacity: 0.5, fontSize: 13, textAlign: 'center', marginTop: 12 }}>
            {loadingRooms ? 'Loading rooms…' : 'No open rooms. Create one!'}
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: '100%' }}>
            {rooms.map(r => {
              const full = r.players.length >= r.maxPlayers;
              const isJoiningThis = joiningRoomId === r.roomId;
              return (
                <div
                  key={r.roomId}
                  style={{
                    background: 'rgba(255,255,255,0.07)',
                    border: `1px solid ${isJoiningThis ? 'rgba(99,102,241,0.5)' : 'rgba(255,255,255,0.12)'}`,
                    borderRadius: 10,
                    padding: '12px 14px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 10,
                    transition: 'border-color 0.15s',
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14, letterSpacing: 0.5 }}>
                      Room {r.roomId.slice(0, 8).toUpperCase()}
                    </div>
                    <div style={{ opacity: 0.55, fontSize: 12, marginTop: 2 }}>
                      {r.players.length} / {r.maxPlayers} players
                      {r.players[0] && ` · ${r.players[0].name}`}
                    </div>
                  </div>
                  <button
                    className="btn btn--deal"
                    onClick={() => handleJoinRoom(r.roomId)}
                    disabled={isBusy || full}
                    style={{ minWidth: 80, fontSize: 13 }}
                  >
                    {isJoiningThis ? 'Joining…' : full ? 'Full' : 'JOIN'}
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {err && <p style={{ color: '#f87171', marginTop: 12 }}>{err}</p>}
      </div>
    </div>
  );
}
