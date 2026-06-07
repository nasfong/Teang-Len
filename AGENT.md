# AGENT.md — Teang Len Integration Audit

**Date:** 2026-06-07  
**Scope:** Synchronize frontend networking layer with backend REST + Socket.IO contracts.

---

## Frontend Architecture

**Stack:** React 19 + TypeScript + Vite + Zustand 5

**Current state:** Pure single-player offline simulation. No networking code exists.

**Layer structure:**
```
src/
  App.tsx                   # Root — renders <GamePage />
  pages/GamePage.tsx         # Sole page: start screen / active game / game-over
  store/gameStore.ts         # Zustand — game engine state only
  game/
    types/index.ts            # Card, Hand, Player, GameState, Trick types
    rules/rules.ts            # Single source of truth for all game rules
    engine/
      engine.ts               # dealGame, playCards, skipTurn, aiPlayTurn
      cards.ts                # makeDeck, shuffleDeck, sortCards, compareCards
      hands.ts                # classifyHand, canBeat, isBombPlay
  components/
    ActionBar.tsx             # Play / Skip / AI-turn buttons
    PlayerZone.tsx            # Opponent & human hand display
    CardView.tsx              # Single card renderer
    TrickArea.tsx             # Current trick display
    GameLog.tsx               # Move history sidebar
```

**Zustand store (current):**
```typescript
interface GameStore {
  game: GameState | null;
  error: string | null;
  selectedCardIds: string[];
  startGame(): void;          // dealGame()
  selectCard(id): void;
  playSelectedCards(): void;  // playCards() + local state
  skipCurrentTurn(): void;    // skipTurn() + local state
  aiTakeTurn(): void;         // aiPlayTurn() + local state
  clearError(): void;
  resetGame(): void;
}
```

**Frontend Player type (local, engine-only):**
```typescript
interface Player {
  id: PlayerId;       // 0 | 1 | 2 | 3  ← numeric seat index
  name: string;
  hand: Card[];
  skipped: boolean;
  rank: number | null;
}
```

**Packages installed:**
- react, react-dom, zustand
- NO `socket.io-client`
- NO `axios` / `fetch` wrappers

---

## Backend Architecture

**Stack:** Node.js + TypeScript + Express 4 + Socket.IO 4 + Zod 3 + uuid

**Entry point:** `backend/src/index.ts`

**Layer structure:**
```
src/
  index.ts                  # Express + Socket.IO server, CORS, port 4000
  api/
    router.ts               # All REST routes
    playerController.ts     # POST /api/players/guest
    roomController.ts       # POST /api/rooms, GET /api/rooms/:id, POST join/leave
  sockets/
    index.ts                # Socket.IO setup, registers handlers on each connection
    roomHandlers.ts         # room:join, room:leave, player:ready
    gameHandlers.ts         # game:start, game:play, game:skip
    disconnectHandler.ts    # disconnect — marks player offline, broadcasts
    emit.ts                 # Typed broadcast helpers
  services/
    playerService.ts        # CRUD + socketId management (in-memory Map)
    roomService.ts          # All room mutations, immutable return pattern
  rooms/
    roomFactory.ts          # createRoom, createPlayer, toRoomSnapshot, bumpVersion
    roomStore.ts            # In-memory Map<roomId, Room>
  types/
    index.ts                # Player, Room, RoomSnapshot, PlayerSnapshot, ServiceResult
    schemas.ts              # All Zod validation schemas
    events.ts               # CLIENT_EVENTS + SERVER_EVENTS string constants
```

**Response envelope (all REST):**
```typescript
// Success
{ ok: true, data: T }

// Error
{ ok: false, error: string }
```

---

## API Routes Discovered

### POST /api/players/guest

**Request:**
```json
{ "name": "string (1–24 chars, trimmed)" }
```

**Response 201:**
```json
{
  "ok": true,
  "data": {
    "playerId": "uuid",
    "name": "string",
    "socketId": null,
    "status": "waiting",
    "seatIndex": null,
    "isGuest": true,
    "connectedAt": 1234567890,
    "reconnectedAt": null
  }
}
```

---

### POST /api/rooms

**Request:**
```json
{ "playerId": "uuid", "maxPlayers": 4 }
```
`maxPlayers` is optional, defaults to 4, range 2–4.

**Response 201:**
```json
{
  "ok": true,
  "data": {
    "roomId": "uuid",
    "hostPlayerId": "uuid",
    "players": [PlayerSnapshot],
    "status": "waiting",
    "gameState": null,
    "version": 1,
    "maxPlayers": 4,
    "createdAt": 1234567890,
    "updatedAt": 1234567890
  }
}
```

---

### GET /api/rooms/:roomId

**Response 200:**
```json
{ "ok": true, "data": RoomSnapshot }
```

---

### POST /api/rooms/:roomId/join

**Request:**
```json
{ "playerId": "uuid" }
```

**Response 200:**
```json
{ "ok": true, "data": RoomSnapshot }
```

---

### POST /api/rooms/:roomId/leave

**Request:**
```json
{ "playerId": "uuid" }
```

**Response 200:**
```json
{ "ok": true, "data": RoomSnapshot }
```

---

### GET /health

**Response 200:**
```json
{ "ok": true, "service": "teang-len-server", "ts": 1234567890 }
```

---

## Socket Events Discovered

### Client → Server

| Event | Payload |
|-------|---------|
| `room:join` | `{ roomId: string, playerId: string }` |
| `room:leave` | `{ roomId: string, playerId: string }` |
| `player:ready` | `{ roomId: string, playerId: string }` |
| `game:start` | `{ roomId: string, playerId: string, initialGameState: GameState }` |
| `game:play` | `{ roomId: string, playerId: string, gameState: GameState, playerFinished?: boolean, finishedRank?: number, gameOver?: boolean, rankings?: PlayerId[] }` |
| `game:skip` | `{ roomId: string, playerId: string, gameState: GameState }` |

### Server → Client

| Event | Payload |
|-------|---------|
| `room:update` | `{ room: RoomSnapshot }` |
| `game:update` | `{ roomId: string, gameState: GameState, version: number, triggeredBy: string }` |
| `turn:update` | `{ roomId: string, ... }` |
| `player:finished` | `{ roomId: string, playerId: string, rank: number }` |
| `game:end` | `{ roomId: string, rankings: any[], gameState: GameState }` |
| `player:disconnected` | `{ roomId: string, playerId: string }` |
| `error` | `{ message: string }` |

---

## Payload Contracts

### PlayerSnapshot (in all RoomSnapshot.players)
```typescript
{
  playerId: string;      // UUID — NOT numeric
  name: string;
  status: "waiting" | "ready" | "playing" | "finished" | "disconnected";
  seatIndex: number | null;
  isOnline: boolean;
}
```

### RoomSnapshot
```typescript
{
  roomId: string;
  hostPlayerId: string;
  players: PlayerSnapshot[];
  status: "waiting" | "starting" | "playing" | "finished";
  gameState: unknown;    // opaque — any serializable value
  version: number;
  maxPlayers: number;
  createdAt: number;
  updatedAt: number;
}
```

### game:play extended payload
```typescript
{
  roomId: string;
  playerId: string;
  gameState: GameState;          // full frontend GameState object
  playerFinished?: boolean;      // true when player just emptied hand
  finishedRank?: number;         // 1 = first out
  gameOver?: boolean;            // true when only 1 active player remains
  rankings?: number[];           // final PlayerId ranking array
}
```

---

## Integration Risks

| # | Risk | Severity |
|---|------|----------|
| 1 | `socket.io-client` not installed in frontend | **CRITICAL** — app cannot connect |
| 2 | No API service layer exists in frontend | **CRITICAL** — no REST calls possible |
| 3 | No socket service exists in frontend | **CRITICAL** — no real-time communication |
| 4 | No room store / lobby state in frontend | **CRITICAL** — no room or player identity |
| 5 | Frontend `Player.id` is `0\|1\|2\|3`; backend `playerId` is UUID | **HIGH** — type conflict at boundary |
| 6 | Frontend has no `playerId` concept; store is anonymous | **HIGH** — cannot authenticate any action |
| 7 | Frontend has no `roomId` concept | **HIGH** — cannot address any socket room |
| 8 | `game:start` requires `initialGameState` — frontend must call `dealGame()` and pass result | **HIGH** — game state origin |
| 9 | `game:play` / `game:skip` require full `gameState` in every emit | **MEDIUM** — payload size, must serialize entire state |
| 10 | Seat mapping: backend `seatIndex` (0–3) must map to engine `PlayerId` (0–3) | **MEDIUM** — multiplayer seat assignment |
| 11 | No lobby / room UI screens exist | **MEDIUM** — user flow gap |
| 12 | Reconnection flow requires `room:join` emit on socket reconnect | **MEDIUM** — handled by backend, frontend must re-emit |
| 13 | Backend gameState is opaque — frontend is authoritative on rules | **LOW** — by design, not a bug |
| 14 | Version field in `game:update` can be used to discard stale updates | **LOW** — optimization opportunity |

---

## Assumptions

1. Backend runs on `http://localhost:4000` (from `backend/src/index.ts` port).
2. Frontend is served on `http://localhost:5173` (Vite default).
3. The game is always 4-player (`maxPlayers: 4`) per the engine's `rules.deck.playerCount`.
4. The local human player occupies `seatIndex` matching their `PlayerId` (0-based).
5. All 3 AI players are replaced by remote human players in multiplayer; AI logic is irrelevant in networked play.
6. `GameState` from the frontend engine is safe to serialize with `JSON.stringify` (no circular refs, no functions).
7. The host (seat 0 / `hostPlayerId`) is responsible for calling `dealGame()` and emitting `game:start`.
8. `game:play` and `game:skip` are emitted only by the player whose turn it is.
9. Reconnect: on socket `connect`/`reconnect`, client re-emits `room:join` if `playerId` + `roomId` are known.

---

## Files That Will Be Modified / Created

### New files (frontend):
| File | Purpose |
|------|---------|
| `frontend/src/services/api.ts` | REST calls: createGuest, createRoom, joinRoom, leaveRoom, getRoom |
| `frontend/src/services/socket.ts` | Socket.IO client: connect, emit, subscribe to server events |
| `frontend/src/store/lobbyStore.ts` | Zustand store: playerId, playerName, roomId, room snapshot |

### Modified files (frontend):
| File | Change |
|------|--------|
| `frontend/package.json` | Add `socket.io-client` dependency |
| `frontend/src/store/gameStore.ts` | Wire `startGame`, `playSelectedCards`, `skipCurrentTurn` to emit socket events alongside local engine calls |
| `frontend/src/App.tsx` | Add lobby → room → game navigation flow |
| `frontend/src/pages/GamePage.tsx` | Receive seat assignment from room; listen for `game:update` to sync remote moves |

### Backend:
No backend modifications required. Contracts are well-defined and complete.

---

## Mismatch Report

### Missing Payloads (frontend calls that don't exist yet)

**createGuest()**
- Expected: `POST /api/players/guest` with `{ name: string }`
- Actual: **NO API CALL EXISTS**
- Missing: entire function

**createRoom()**
- Expected: `POST /api/rooms` with `{ playerId: string, maxPlayers: number }`
- Actual: **NO API CALL EXISTS**
- Missing: entire function, `playerId` field

**joinRoom()**
- Expected: `POST /api/rooms/:roomId/join` with `{ playerId: string }`
- Actual: **NO API CALL EXISTS**
- Missing: entire function

**leaveRoom()**
- Expected: `POST /api/rooms/:roomId/leave` with `{ playerId: string }`
- Actual: **NO API CALL EXISTS**
- Missing: entire function

---

### Event Mismatches (socket emits that don't exist yet)

| Event | Status |
|-------|--------|
| `room:join` | Missing — no socket emit |
| `room:leave` | Missing — no socket emit |
| `player:ready` | Missing — no socket emit |
| `game:start` | Missing — no socket emit |
| `game:play` | Missing — no socket emit |
| `game:skip` | Missing — no socket emit |

| Server event | Listener status |
|--------------|----------------|
| `room:update` | Missing — no `socket.on` |
| `game:update` | Missing — no `socket.on` |
| `player:finished` | Missing — no `socket.on` |
| `game:end` | Missing — no `socket.on` |
| `player:disconnected` | Missing — no `socket.on` |
| `error` | Missing — no `socket.on` |

---

### Type Mismatches

| Field | Frontend type | Backend type | Notes |
|-------|--------------|-------------|-------|
| Player identity | `PlayerId = 0\|1\|2\|3` | `playerId: string (UUID)` | Numeric seats vs UUID identity |
| Player name | inline string in engine | fetched from `POST /api/players/guest` | No identity concept |
| Room identity | none | `roomId: string (UUID)` | Not tracked anywhere in frontend |
| Player status | `rank: number \| null` (engine) | `status: "waiting"\|"ready"\|"playing"\|...` | Different status model |
| isOnline | not tracked | `isOnline: boolean` (derived from socketId) | Backend tracks connection state |

---

## Implementation Plan (Step 5)

**Phase 1 — Install dependency**
- Add `socket.io-client` to `frontend/package.json`

**Phase 2 — Create service layer**
- `frontend/src/services/api.ts` — all REST calls with typed responses
- `frontend/src/services/socket.ts` — singleton socket client with typed emit/on

**Phase 3 — Create lobby store**
- `frontend/src/store/lobbyStore.ts` — `playerId`, `playerName`, `roomId`, `room: RoomSnapshot | null`, `mySeatIndex`

**Phase 4 — Wire game store to socket**
- `startGame()` → emit `game:start` with `dealGame()` result (host only)
- `playSelectedCards()` → emit `game:play` with updated `GameState`
- `skipCurrentTurn()` → emit `game:skip` with updated `GameState`
- Listen on `game:update` → sync remote game state into store

**Phase 5 — Add lobby flow to App**
- `App.tsx`: if no `playerId` → show name input; if no `roomId` → show lobby; else show game
- `GamePage.tsx`: seed initial player names from `RoomSnapshot.players`
