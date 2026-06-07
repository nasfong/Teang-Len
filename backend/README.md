# Teang Len Server

Multiplayer coordinator backend for **Teang Len** — a Cambodian card game.

This server handles **rooms, players, and real-time synchronization only**.  
All game rule logic lives exclusively in the frontend engine.

---

## Stack

| | |
|---|---|
| Runtime | Node.js + TypeScript |
| HTTP | Express |
| Realtime | Socket.IO |
| Validation | Zod |
| Storage | In-memory (no database) |

---

## Getting Started

```bash
npm install
npm run dev       # development (tsx watch)
npm run build     # compile to dist/
npm start         # run compiled output
```

Default port: **4000**  
Override: `PORT=5000 npm run dev`

**Environment variables**

| Variable | Default | Description |
|---|---|---|
| `PORT` | `4000` | HTTP listen port |
| `CLIENT_ORIGIN` | `*` | CORS allowed origin |

---

## Project Structure

```
src/
├── api/               # REST controllers + router
├── sockets/           # Socket.IO handlers + emit helpers
├── rooms/             # In-memory store + factory functions
├── services/          # playerService, roomService
├── types/             # Domain types, Zod schemas, event constants
├── middleware/         # errorHandler, validate
├── utils/             # logger
└── index.ts           # Entry point
```

---

## REST API

Base path: `/api`

All responses follow this envelope:

```json
{ "ok": true,  "data": { ... } }
{ "ok": false, "error": "message" }
```

---

### `GET /health`

Server liveness check.

**Response**
```json
{ "ok": true, "service": "teang-len-server", "ts": 1700000000000 }
```

---

### `POST /api/players/guest`

Create a guest player. Call this before creating or joining a room.

**Body**
```json
{ "name": "Sokha" }
```

| Field | Type | Rules |
|---|---|---|
| `name` | string | 1–24 characters |

**Response `201`**
```json
{
  "ok": true,
  "data": {
    "playerId":      "uuid-v4",
    "name":          "Sokha",
    "socketId":      null,
    "status":        "waiting",
    "seatIndex":     null,
    "isGuest":       true,
    "connectedAt":   1700000000000,
    "reconnectedAt": null
  }
}
```

---

### `POST /api/rooms`

Create a new room. The requesting player becomes the **host** and takes **seat 0**.

**Body**
```json
{ "playerId": "uuid-v4", "maxPlayers": 4 }
```

| Field | Type | Rules |
|---|---|---|
| `playerId` | UUID | Must exist |
| `maxPlayers` | integer | 2–4, default `4` |

**Response `201`** — returns a [Room Snapshot](#room-snapshot).

---

### `GET /api/rooms/:roomId`

Fetch current room state.

**Response `200`** — returns a [Room Snapshot](#room-snapshot).

---

### `POST /api/rooms/:roomId/join`

Join an existing room. Idempotent — rejoining as the same player is safe.

**Body**
```json
{ "playerId": "uuid-v4" }
```

**Errors**

| Code | Reason |
|---|---|
| `404` | Room not found |
| `409` | Game already started |
| `409` | Room is full |

**Response `200`** — returns updated [Room Snapshot](#room-snapshot).

---

### `POST /api/rooms/:roomId/leave`

Leave a room. If the host leaves, host is automatically transferred to the next player.  
If the last player leaves, the room is deleted.

**Body**
```json
{ "playerId": "uuid-v4" }
```

**Response `200`** — returns updated [Room Snapshot](#room-snapshot).

---

### Room Snapshot

Returned by all room endpoints and broadcast via `room:update`.

```json
{
  "roomId":       "uuid-v4",
  "hostPlayerId": "uuid-v4",
  "status":       "waiting",
  "maxPlayers":   4,
  "version":      3,
  "gameState":    null,
  "createdAt":    1700000000000,
  "updatedAt":    1700000001000,
  "players": [
    {
      "playerId":  "uuid-v4",
      "name":      "Sokha",
      "status":    "ready",
      "seatIndex": 0,
      "isOnline":  true
    }
  ]
}
```

| Field | Description |
|---|---|
| `status` | `waiting` · `starting` · `playing` · `finished` |
| `version` | Increments on every mutation — use to detect stale updates |
| `gameState` | Opaque JSON set by the frontend engine — backend never reads this |
| `isOnline` | `true` when player has an active socket connection |

**Player status values:** `waiting` · `ready` · `playing` · `finished` · `disconnected`

---

## Socket.IO

Connect to `ws://localhost:4000`.

```js
import { io } from "socket.io-client";
const socket = io("http://localhost:4000");
```

---

### Client → Server Events

---

#### `room:join`

Join a room's socket channel. Send immediately after `POST /api/rooms/:roomId/join`.  
Also used to reconnect after a dropped connection.

```json
{ "roomId": "uuid-v4", "playerId": "uuid-v4" }
```

Triggers: `room:update` broadcast to all room members.

---

#### `room:leave`

Leave a room's socket channel.

```json
{ "roomId": "uuid-v4", "playerId": "uuid-v4" }
```

Triggers: `room:update` broadcast.

---

#### `player:ready`

Mark self as ready. Host can start once enough players are ready.

```json
{ "roomId": "uuid-v4", "playerId": "uuid-v4" }
```

Triggers: `room:update` broadcast.

---

#### `game:start`

Host-only. Sends the **initial game state** from the frontend engine.  
Backend stores it opaquely and transitions room status to `playing`.

```json
{
  "roomId":           "uuid-v4",
  "playerId":         "uuid-v4",
  "initialGameState": { "...": "any shape the frontend engine uses" }
}
```

Triggers: `room:update` + `game:update` broadcast.

---

#### `game:play`

A player plays their cards. The **frontend engine** resolves the move and sends the resulting game state.  
Backend stores it and broadcasts to all players.

Optionally signal end-of-player or end-of-game via extra fields.

```json
{
  "roomId":    "uuid-v4",
  "playerId":  "uuid-v4",
  "gameState": { "...": "updated engine state" },

  // Optional — signal that this player has finished
  "playerFinished": true,
  "finishedRank":   1,

  // Optional — signal that all players are done
  "gameOver":  true,
  "rankings":  [
    { "playerId": "uuid-v4", "rank": 1 },
    { "playerId": "uuid-v4", "rank": 2 }
  ]
}
```

Triggers: `game:update`, and conditionally `player:finished` / `game:end`.

---

#### `game:skip`

A player skips their turn. Frontend engine sends updated state reflecting the skip.

```json
{
  "roomId":    "uuid-v4",
  "playerId":  "uuid-v4",
  "gameState": { "...": "updated engine state" }
}
```

Triggers: `game:update` broadcast.

---

### Server → Client Events

---

#### `room:update`

Broadcast whenever room membership or player status changes.

```json
{
  "room": { "...": "Room Snapshot" }
}
```

---

#### `game:update`

Broadcast after every `game:play` or `game:skip`. Contains the full opaque game state.

```json
{
  "roomId":      "uuid-v4",
  "gameState":   { "...": "opaque engine state" },
  "version":     7,
  "triggeredBy": "uuid-v4"
}
```

---

#### `turn:update`

Signals whose turn it is next. Emitted by the server when needed.

```json
{
  "roomId":          "uuid-v4",
  "currentPlayerId": "uuid-v4",
  "version":         7
}
```

---

#### `player:finished`

A player has played all their cards.

```json
{
  "roomId":   "uuid-v4",
  "playerId": "uuid-v4",
  "rank":     1
}
```

---

#### `game:end`

All players have finished. Final rankings included.

```json
{
  "roomId":    "uuid-v4",
  "gameState": { "...": "final engine state" },
  "rankings":  [
    { "playerId": "uuid-v4", "rank": 1 },
    { "playerId": "uuid-v4", "rank": 2 },
    { "playerId": "uuid-v4", "rank": 3 },
    { "playerId": "uuid-v4", "rank": 4 }
  ]
}
```

---

#### `player:disconnected`

A player's socket dropped.

```json
{
  "roomId":   "uuid-v4",
  "playerId": "uuid-v4"
}
```

Frontend should show a reconnecting indicator.  
The player's slot is held — they can rejoin via `room:join` with the same `playerId`.

---

#### `error`

Sent only to the socket that caused the error.

```json
{ "message": "Only host can start the game" }
```

---

## Typical Flow

```
1. POST /api/players/guest          → get playerId
2. POST /api/rooms                   → get roomId  (host)
   POST /api/rooms/:id/join          → join room   (others)

3. socket.emit("room:join", ...)     → all players join socket channel
4. socket.emit("player:ready", ...)  → mark ready

5. socket.emit("game:start", ...)    → host sends initialGameState
   ← game:update broadcast to all

6. socket.emit("game:play", ...)     → active player sends new gameState
   ← game:update broadcast to all

7. game:play with playerFinished: true
   ← player:finished broadcast

8. game:play with gameOver: true
   ← game:end broadcast
```

---

## Architecture Notes

- **`gameState` is opaque.** The backend stores and forwards whatever JSON the frontend engine sends. It never reads, validates, or modifies the contents.
- **`version`** increments on every room mutation. Frontend can use it to discard out-of-order updates.
- **Reconnection** is supported. A player who disconnects keeps their seat. Reconnect by emitting `room:join` with the same `playerId` and `roomId`.
- **Host transfer** happens automatically when the host leaves a waiting room.
- **No authentication.** `playerId` is trust-based. Add auth middleware when moving to production.
