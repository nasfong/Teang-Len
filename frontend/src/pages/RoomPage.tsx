import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLobbyStore } from '../store/lobbyStore';
import { socketService } from '../services/socket';
import { api } from '../services/api';
import { useRoomList } from '../features/room/hooks/useRoomList';
import { RoomCard } from '../features/room/components/RoomCard';
import type { RoomSnapshot } from '../services/api';

export function RoomPage() {
  const navigate = useNavigate();
  const { playerId, playerName, roomId: currentRoomId, setRoom } = useLobbyStore();
  const { rooms, loadingRooms, fetchRooms } = useRoomList();

  const [joiningRoomId, setJoiningRoomId] = useState<string | null>(null);
  const [creatingRoom, setCreatingRoom]   = useState(false);
  const [maxPlayersChoice, setMaxPlayersChoice] = useState(4);
  const [pageError, setPageError]         = useState<string | null>(null);

  // If already in a room (e.g. back-navigation), go straight to it
  useEffect(() => {
    if (currentRoomId) navigate(`/table/${currentRoomId}`, { replace: true });
  }, [currentRoomId, navigate]);

  function enterRoom(snapshot: RoomSnapshot, myPlayerId: string): void {
    socketService.emitRoomJoin({ roomId: snapshot.roomId, playerId: myPlayerId });
    socketService.emitPlayerReady({ roomId: snapshot.roomId, playerId: myPlayerId });
    setRoom(snapshot);
    navigate(`/table/${snapshot.roomId}`);
  }

  async function handleCreateRoom(): Promise<void> {
    if (!playerId) return;
    setCreatingRoom(true);
    setPageError(null);
    try {
      const snapshot = await api.createRoom(playerId, maxPlayersChoice);
      enterRoom(snapshot, playerId);
    } catch (e: unknown) {
      setPageError(e instanceof Error ? e.message : 'Failed to create room');
      setCreatingRoom(false);
    }
  }

  async function handleJoinRoom(targetRoomId: string): Promise<void> {
    if (!playerId) return;
    setJoiningRoomId(targetRoomId);
    setPageError(null);
    try {
      const snapshot = await api.joinRoom(targetRoomId, playerId);
      enterRoom(snapshot, playerId);
    } catch (e: unknown) {
      setPageError(e instanceof Error ? e.message : 'Failed to join room');
      setJoiningRoomId(null);
    }
  }

  const isBusy = creatingRoom || joiningRoomId !== null;

  return (
    <div className="screen screen--start">
      <div className="hero">
        <div className="hero__suits">♠ ♣ ♦ ♥</div>
        <h1 className="hero__title">ទាំងឡែន</h1>
        <p className="hero__latin" style={{ marginBottom: 20 }}>Hello, {playerName}</p>

        {/* Create room */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 20, width: '100%' }}>
          <select
            value={maxPlayersChoice}
            onChange={e => setMaxPlayersChoice(Number(e.target.value))}
            disabled={isBusy}
            style={{
              background: 'rgba(255,255,255,0.1)',
              color: '#fff',
              border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: 8,
              padding: '8px 10px',
              fontSize: 13,
              cursor: 'pointer',
            }}
          >
            <option value={2}>2 players</option>
            <option value={3}>3 players</option>
            <option value={4}>4 players</option>
          </select>
          <button
            className="btn btn--deal"
            onClick={handleCreateRoom}
            disabled={isBusy}
            style={{ flex: 1 }}
          >
            {creatingRoom ? 'Creating…' : '+ Create Room'}
          </button>
        </div>

        {/* Room list header */}
        <div style={{
          width: '100%', marginBottom: 8,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <span style={{ opacity: 0.6, fontSize: 13 }}>
            Open Rooms {loadingRooms && <span style={{ opacity: 0.4 }}>↻</span>}
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

        {/* Room list */}
        {rooms.length === 0 ? (
          <p style={{ opacity: 0.5, fontSize: 13, textAlign: 'center', marginTop: 12 }}>
            {loadingRooms ? 'Loading rooms…' : 'No open rooms. Create one!'}
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: '100%' }}>
            {rooms.map(r => (
              <RoomCard
                key={r.roomId}
                room={r}
                joiningRoomId={joiningRoomId}
                isBusy={isBusy}
                onJoin={handleJoinRoom}
              />
            ))}
          </div>
        )}

        {pageError && <p style={{ color: '#f87171', marginTop: 12 }}>{pageError}</p>}
      </div>
    </div>
  );
}
