import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLobbyStore } from '../store/lobbyStore';
import { socketService } from '../services/socket';
import { api } from '../services/api';
import { useRoomList } from '../features/room/hooks/useRoomList';
import { RoomCard } from '../features/room/components/RoomCard';
import { CreateRoomModal, type CreateRoomOptions } from '../features/room/components/CreateRoomModal';
import type { RoomSnapshot } from '../services/api';

// ── Cartoon design tokens ─────────────────────────────────────────────────────
const C = {
  edge: '#00376B',
  panel: 'rgba(120,185,235,0.32)',
  panelEdge: 'rgba(255,255,255,0.45)',
  accent: '#FFD27A',
  btnOuter: '#2F6614',
  btnFaceTop: '#8FE04A',
  btnFaceMid: '#6FCB33',
  btnFaceBot: '#5BB528',
  btnBase: '#3F861C',
  btnBaseDark: '#2F6614',
} as const;

const FONT = "'Lilita One', 'Fredoka', 'Comic Sans MS', cursive";

const STROKE = (color: string, w = 2) =>
  `${-w}px ${-w}px 0 ${color}, ${w}px ${-w}px 0 ${color}, ${-w}px ${w}px 0 ${color}, ${w}px ${w}px 0 ${color}`;

// ── Create button ─────────────────────────────────────────────────────────────
const DEPTH = 6;

function CreateButton({ label, disabled, onClick }: { label: string; disabled: boolean; onClick: () => void }) {
  const [pressed, setPressed] = useState(false);
  const [hovered, setHovered] = useState(false);

  return (
    <div
      style={{
        borderRadius: 26,
        background: `linear-gradient(180deg, ${C.btnBase} 0%, ${C.btnBaseDark} 100%)`,
        padding: `0 0 ${DEPTH}px 0`,
        border: `3px solid ${C.btnOuter}`,
        opacity: disabled ? 0.6 : 1,
        filter: 'drop-shadow(0 8px 10px rgba(30,70,15,0.4))',
      }}
    >
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        onMouseDown={() => setPressed(true)}
        onMouseUp={() => setPressed(false)}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => {
          setHovered(false);
          setPressed(false);
        }}
        onTouchStart={() => setPressed(true)}
        onTouchEnd={() => setPressed(false)}
        style={{
          display: 'block',
          margin: -3,
          padding: '12px 60px',
          borderRadius: 28,
          border: `3px solid ${C.btnOuter}`,
          borderBottom: 'none',
          background: `linear-gradient(180deg, ${C.btnFaceTop} 0%, ${C.btnFaceMid} 55%, ${C.btnFaceBot} 100%)`,
          boxShadow: 'inset 0 3px 0 rgba(255,255,255,0.4), inset 0 -3px 0 rgba(0,0,0,0.25)',
          transform: `translateY(${pressed ? DEPTH : hovered && !disabled ? -1.5 : 0}px)`,
          transition: 'transform 130ms cubic-bezier(0.34, 1.4, 0.64, 1)',
          cursor: disabled ? 'default' : 'pointer',
          outline: 'none',
          color: '#fff',
          fontFamily: FONT,
          fontSize: 24,
          textShadow: `${STROKE(C.btnOuter, 2)}, 0 4px 4px rgba(20,60,10,0.4)`,
        }}
      >
        {label}
      </button>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export function RoomPage() {
  const navigate = useNavigate();
  const { playerId, roomId: currentRoomId, setRoom } = useLobbyStore();
  const { rooms, loadingRooms } = useRoomList();

  const [joiningRoomId, setJoiningRoomId] = useState<string | null>(null);
  const [creatingRoom, setCreatingRoom] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [pageError, setPageError] = useState<string | null>(null);

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

  // Only `maxPlayers` is persisted by the backend; roomName/gameMode/betAmount
  // are UI-only until the backend gains fields for them.
  async function handleCreateRoom(opts: CreateRoomOptions): Promise<void> {
    if (!playerId) return;
    setCreatingRoom(true);
    setPageError(null);
    try {
      const snapshot = await api.createRoom(playerId, opts.maxPlayers);
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
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        justifyContent: 'center',
        padding: '20px 16px',
        boxSizing: 'border-box',
      }}
    >
      {/* Translucent room panel */}
      <div
        style={{
          width: '100%',
          maxWidth: 640,
          display: 'flex',
          flexDirection: 'column',
          borderRadius: 28,
          background: C.panel,
          border: `2px solid ${C.panelEdge}`,
          boxShadow: 'inset 0 2px 0 rgba(255,255,255,0.35), 0 10px 24px rgba(0,0,0,0.25)',
          backdropFilter: 'blur(2px)',
          overflow: 'hidden',
        }}
      >
        {/* Grid of rooms */}
        <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: 18 }}>
          {rooms.length === 0 ? (
            <p
              style={{
                fontFamily: FONT,
                fontSize: 18,
                color: '#fff',
                textAlign: 'center',
                marginTop: 40,
                textShadow: '0 2px 3px rgba(0,0,0,0.4)',
              }}
            >
              {loadingRooms ? 'Loading rooms…' : 'No open rooms — tap Create!'}
            </p>
          ) : (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: 16,
              }}
            >
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

          {pageError && (
            <p style={{ color: '#FFE08A', fontFamily: FONT, textAlign: 'center', marginTop: 16 }}>{pageError}</p>
          )}
        </div>

        {/* Create row — pinned at bottom of panel */}
        <div
          style={{
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 14,
            padding: '14px 18px',
            borderTop: '2px solid rgba(255,255,255,0.25)',
          }}
        >
          <CreateButton
            label="Create"
            disabled={isBusy}
            onClick={() => setCreateModalOpen(true)}
          />
        </div>
      </div>

      <CreateRoomModal
        open={createModalOpen}
        creating={creatingRoom}
        onCancel={() => setCreateModalOpen(false)}
        onCreate={handleCreateRoom}
      />
    </div>
  );
}
