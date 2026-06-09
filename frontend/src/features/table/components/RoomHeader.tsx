interface RoomHeaderProps {
  roomId: string;
  playerCount: number;
  maxSeats: number;
}

export function RoomHeader({ roomId, playerCount, maxSeats }: RoomHeaderProps) {
  return (
    <div className="room-header">
      <span className="room-header__code">{roomId.slice(0, 6).toUpperCase()}</span>
      <span className="room-header__sep" />
      <span className="room-header__players">{playerCount}/{maxSeats}</span>
    </div>
  );
}
