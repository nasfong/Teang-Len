import type { RoomSnapshot } from '../../../services/api';

interface RoomCardProps {
  room: RoomSnapshot;
  joiningRoomId: string | null;
  isBusy: boolean;
  onJoin: (roomId: string) => void;
}

export function RoomCard({ room, joiningRoomId, isBusy, onJoin }: RoomCardProps) {
  const full = room.players.length >= room.maxPlayers;
  const isJoiningThis = joiningRoomId === room.roomId;

  return (
    <div style={{
      background: 'rgba(255,255,255,0.07)',
      border: `1px solid ${isJoiningThis ? 'rgba(99,102,241,0.5)' : 'rgba(255,255,255,0.12)'}`,
      borderRadius: 10,
      padding: '12px 14px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 10,
      transition: 'border-color 0.15s',
    }}>
      <div>
        <div style={{ fontWeight: 600, fontSize: 14, letterSpacing: 0.5 }}>
          Room {room.roomId.slice(0, 8).toUpperCase()}
        </div>
        <div style={{ opacity: 0.55, fontSize: 12, marginTop: 2 }}>
          {room.players.length} / {room.maxPlayers} players
          {room.players[0] && ` · ${room.players[0].name}`}
        </div>
      </div>
      <button
        className="btn btn--deal"
        onClick={() => onJoin(room.roomId)}
        disabled={isBusy || full}
        style={{ minWidth: 80, fontSize: 13 }}
      >
        {isJoiningThis ? 'Joining…' : full ? 'Full' : 'JOIN'}
      </button>
    </div>
  );
}
