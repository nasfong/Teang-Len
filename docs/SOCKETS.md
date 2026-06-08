# SOCKETS.md — Socket Event Contract

Socket.IO 4 over WebSocket. Single namespace (default).

Event name constants are the source of truth:
- Frontend: `frontend/src/services/socket.ts` — CLIENT_EVENTS, SERVER_EVENTS
- Backend:  `backend/src/types/events.ts`    — CLIENT_EVENTS, SERVER_EVENTS

Both files must stay in sync.

---

## Client → Server Events

### room:join

Emitted after REST join and on every socket reconnect.

```typescript
{
  roomId:   string;  // UUID
  playerId: string;  // UUID
}
```

Backend: adds socket to Socket.IO room, updates player socketId, broadcasts room:update.

---

### room:leave

Emitted when user clicks Leave.

```typescript
{
  roomId:   string;
  playerId: string;
}
```

Backend: removes player from room, broadcasts room:update and room:list:update.

---

### player:ready

Auto-emitted on room join (no separate UI button in current implementation).

```typescript
{
  roomId:   string;
  playerId: string;
}
```

Backend: sets player status to "ready", broadcasts room:update.

---

### game:start

Host only. Sends the initial GameState produced by `dealGame()`.

```typescript
{
  roomId:           string;
  playerId:         string;   // must match room.hostPlayerId
  initialGameState: unknown;  // GameState from frontend engine
}
```

Backend: stores gameState opaquely, sets room status to "playing", broadcasts room:update and game:update to all room members.

---

### game:play

Active player only (current turn). Sends the full GameState after `playCards()` ran locally.

```typescript
{
  roomId:    string;
  playerId:  string;
  gameState: unknown;   // full GameState after playCards()

  // Optional signals — backend reads these to fire secondary events
  playerFinished?: boolean;
  finishedRank?:   number;
  gameOver?:       boolean;
  rankings?:       { playerId: string; rank: number }[];  // UUID, not seat index
}
```

Backend:
- Stores updated gameState.
- Broadcasts game:update to all room members.
- If playerFinished: broadcasts player:finished.
- If gameOver: broadcasts game:end.

Note: `rankings` must use UUID playerId values (from `lobbyStore.seatToPlayerId`), not engine seat indices.

---

### game:skip

Active player only. Sends full GameState after `skipTurn()` ran locally.

```typescript
{
  roomId:    string;
  playerId:  string;
  gameState: unknown;   // full GameState after skipTurn()
}
```

Backend: stores updated gameState, broadcasts game:update.

---

## Server → Client Events

### room:update

Fired when room membership or status changes.

```typescript
{
  room: RoomSnapshot;
}
```

Client: call `lobbyStore.setRoom(room)`.

`RoomSnapshot` shape:
```typescript
{
  roomId:       string;
  hostPlayerId: string;
  players:      PlayerSnapshot[];
  status:       "waiting" | "starting" | "playing" | "finished";
  gameState:    unknown;
  version:      number;
  maxPlayers:   number;
  createdAt:    number;
  updatedAt:    number;
}

PlayerSnapshot {
  playerId:   string;
  name:       string;
  status:     "waiting" | "ready" | "playing" | "finished" | "disconnected";
  seatIndex:  number | null;
  isOnline:   boolean;
}
```

---

### room:list:update

Fired when any room is created, joined, or closed. No payload.

Client: re-fetch `GET /api/rooms` to refresh the lobby list.

---

### game:update

Fired after every game:start, game:play, and game:skip.

```typescript
{
  roomId:      string;
  gameState:   unknown;  // full GameState snapshot
  version:     number;   // monotonically increasing
  triggeredBy: string;   // UUID of player who caused this update
}
```

Client handling:
```typescript
if (triggeredBy !== playerId) {
  syncFromServer(gameState);
}
```

Guard against triggeredBy is required to prevent the acting player from overwriting their own already-applied local state.

Use `version` to discard stale out-of-order deliveries.

---

### turn:update

Fired to indicate the active player for UI highlighting. May arrive alongside game:update.

```typescript
{
  roomId:          string;
  currentPlayerId: string;  // UUID of player whose turn it is
  version:         number;
}
```

---

### player:finished

Fired when a player empties their hand (via game:play extended payload).

```typescript
{
  roomId:   string;
  playerId: string;  // UUID
  rank:     number;  // 1, 2, 3, or 4
}
```

---

### game:end

Fired when all players are ranked (game:play with gameOver: true).

```typescript
{
  roomId:    string;
  rankings:  { playerId: string; rank: number }[];  // UUID, ordered 1st to 4th
  gameState: unknown;  // final GameState
}
```

---

### player:disconnected

Fired when a player's socket disconnects unexpectedly.

```typescript
{
  roomId:   string;
  playerId: string;
}
```

Client: show disconnected indicator. Backend preserves the player's seat.

---

### error

Fired when the backend rejects an event payload or operation.

```typescript
{
  message: string;
}
```

Client: display to user.

---

## Reconnection Pattern

On every socket `connect` event (handles both initial connection and reconnects):

```typescript
socket.on("connect", () => {
  const { playerId, roomId } = lobbyStore.getState();
  if (playerId && roomId) {
    socketService.emitRoomJoin({ roomId, playerId });
  }
});
```

The backend restores the player's socketId and marks them online. Their seat is preserved.

---

## Validation

All incoming socket payloads on the backend are validated with Zod schemas defined in `backend/src/types/schemas.ts`. Invalid payloads emit an `error` event back to the sender and are discarded.

---

## Rules

- Never inline event name strings — always use CLIENT_EVENTS / SERVER_EVENTS constants.
- Never add new events without updating both the frontend and backend constants files and this document.
- GameState payload is always `unknown` on the backend — never deserialize or inspect it.
