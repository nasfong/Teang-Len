# CLAUDE.md — Teang Len Multiplayer Card Game

> **Single source of truth for Claude Code behavior in this repository.**
> Read this file in full before modifying any file. Violations will break multiplayer correctness.

---

## Project Overview

Real-time multiplayer Cambodian card game (Teang Len / ទាំងឡែន).

| Layer | Stack | Responsibility |
|---|---|---|
| Frontend | React 19 · Vite · TypeScript · Zustand 5 · React Router v6 | Game engine, UI, state |
| Backend | Node.js · Express 4 · Socket.IO 4 · TypeScript | Rooms, players, socket sync only |
| Storage | In-memory `Map` | No database — ever |

---

## Architecture Boundaries

### Frontend owns — never move these to backend

- Game engine: `frontend/src/game/engine/`
- Game rules: `frontend/src/game/rules/rules.ts`
- Card validation and comparison
- Turn logic (who plays, who skips)
- Combo classification (`classifyHand`, `canBeat`, `isBombPlay`)
- `GameState` mutations (`dealGame`, `playCards`, `skipTurn`)
- Zustand stores: `frontend/src/store/gameStore.ts` and `lobbyStore.ts`

### Backend owns — never implement in frontend

- Room creation and lifecycle
- Player registry (UUID identity)
- Socket.IO room channels
- Broadcasting `GameState` snapshots to all clients
- Seat assignment (`seatIndex` 0–3)
- Connection / disconnection tracking

### The hard boundary

```
Frontend engine runs first → emits result to backend → backend broadcasts to others
Backend never computes, validates, or modifies GameState content
```

`gameState: unknown` in all backend types is intentional. Backend stores and broadcasts it blindly.

---

## Folder Structure

Do not restructure without explicit instruction.

```
frontend/src/
  game/
    engine/        ← pure functions only, no side effects, no store imports
    rules/         ← NEVER touch rules.ts
    types/         ← shared type definitions
  store/
    gameStore.ts   ← engine state, selected cards, play/skip actions
    lobbyStore.ts  ← network identity (playerId, roomId, seatIndex)
  services/
    api.ts         ← all REST calls
    socket.ts      ← singleton SocketService + typed emitters
  pages/
    EnterPage.tsx   ← /enter route
    TablePage.tsx   ← /table and /table/:roomId routes (all post-auth states)
  components/      ← pure display components

backend/src/
  api/             ← REST controllers + router
  sockets/         ← handlers, emit helpers, parsePayload
  services/        ← playerService, roomService
  rooms/           ← roomStore, roomFactory
  types/           ← index.ts, schemas.ts, events.ts
  middleware/      ← errorHandler, validate
  index.ts
```

---

## UI Flow — Required Order

This is the only correct user flow. Do not alter it.

```
1. EnterPage          → user enters display name
2. POST /api/players/guest → receives UUID playerId, stored in localStorage
3. socket autoConnects on page load
4. TablePage (State A) → room browser: list, create, join
5a. Create: pick maxPlayers (2–4), POST /api/rooms → emit("room:join") + emit("player:ready") → /table/:roomId
5b. Join:   POST /api/rooms/:id/join → emit("room:join") + emit("player:ready") → /table/:roomId
6. TablePage (State B) → waiting: seats visible, host sees Start button
7. Host clicks Start → emit("game:start") with initialGameState from dealGame()
8. TablePage (State C) → active gameplay, manual play / skip only
9. All players ranked → TablePage (State D) → Rankings → Back to Rooms → State A
```

**There is no dedicated Lobby page. TablePage handles all post-auth states: room browser, waiting, playing, finished.**
**There is no roomId paste flow. Rooms are joined by clicking room cards in State A.**
**`player:ready` is auto-emitted on room join — there is no separate Ready button.**

---

## Multiplayer Rules

- **NO AI players** — ever. `aiPlayTurn` exists in engine.ts for local testing only. Never call it in networked mode.
- **NO fake/simulated opponents** — every seat must be a real connected user.
- **NO auto-fill** — do not fill empty seats with bots.
- Only the host (`room.hostPlayerId === playerId`) may emit `game:start`.
- Only the player whose turn it is may emit `game:play` or `game:skip`.
- The host is the first player to create the room.
- Minimum 2 players required before host can start (UI enforces `playerCount < 2`).

---

## Seat Mapping — Visual Layout

Backend assigns `seatIndex` (0–3). Frontend maps to screen position relative to local player using `localSeatIndex` from `lobbyStore`.

```
         Top    = (localSeat + 2) % 4
              ┌───────┐
Left          │       │         Right
(localSeat+3) │  Table│  (localSeat+1) % 4
    % 4       │       │
              └───────┘
        Bottom = local player (localSeat)
```

```typescript
// How TablePage computes positions — never hardcode indices
const seatBottom = localSeatIndex as PlayerId;
const seatRight  = ((localSeatIndex + 1) % 4) as PlayerId;
const seatTop    = ((localSeatIndex + 2) % 4) as PlayerId;
const seatLeft   = ((localSeatIndex + 3) % 4) as PlayerId;
```

- `localSeatIndex` comes from `lobbyStore`, not from the engine.
- `PlayerId` (engine `0|1|2|3`) === `seatIndex` (backend) at all boundaries.
- This mapping is deterministic and must never change.

---

## Routes

| Path | State | Description |
|---|---|---|
| `/enter` | — | Name entry |
| `/table` | A | Room browser (no roomId) |
| `/table/:roomId` | B / C / D | Waiting / Playing / Finished |

---

## Socket Event Contract

Event name constants are the single source of truth. Always import from:
- Frontend: `frontend/src/services/socket.ts` → `CLIENT_EVENTS`, `SERVER_EVENTS`
- Backend: `backend/src/types/events.ts` → `CLIENT_EVENTS`, `SERVER_EVENTS`

### Client → Server

| Event | Payload | When |
|---|---|---|
| `room:join` | `{ roomId, playerId }` | After REST join, and on socket reconnect |
| `room:leave` | `{ roomId, playerId }` | User leaves room |
| `player:ready` | `{ roomId, playerId }` | Auto-emitted on room join |
| `game:start` | `{ roomId, playerId, initialGameState }` | Host only, after clicking Start |
| `game:play` | `{ roomId, playerId, gameState, playerFinished?, finishedRank?, gameOver?, rankings? }` | Active player plays cards |
| `game:skip` | `{ roomId, playerId, gameState }` | Active player skips turn |

### Server → Client

| Event | Payload | Action |
|---|---|---|
| `room:update` | `{ room: RoomSnapshot }` | Call `lobbyStore.setRoom(room)` |
| `room:list:update` | (no payload) | Trigger lobby list re-fetch via `api.listRooms()` |
| `game:update` | `{ roomId, gameState, version, triggeredBy }` | Call `syncFromServer(gameState)` if `triggeredBy !== playerId` |
| `turn:update` | `{ roomId, currentPlayerId, version }` | Highlight active seat |
| `player:finished` | `{ roomId, playerId, rank }` | Show rank badge |
| `game:end` | `{ roomId, rankings, gameState }` | Show results screen |
| `player:disconnected` | `{ roomId, playerId }` | Show disconnected indicator |
| `error` | `{ message }` | Show error to user |

**No other events exist. Do not invent new events without updating this contract.**

---

## GameState Sync Rule

```
GameState is opaque to the backend.
Backend stores it. Backend broadcasts it. Backend never reads it.
```

- `gameState: unknown` in all backend types — intentional and permanent.
- Frontend engine is the only code that creates or mutates `GameState`.
- When `game:update` arrives: call `syncFromServer(gameState)`.
- Guard: only sync if `triggeredBy !== playerId` to avoid overwriting local state.
- Use `version` to discard out-of-order updates.

---

## Execution Order — Multiplayer Move (invariant)

```
1. Validate it is the local player's turn  (game.currentPlayer === localSeatIndex)
2. Run frontend engine:  playCards()  or  skipTurn()
3. Update gameStore with result
4. Emit  game:play  or  game:skip  to backend (full gameState included)
5. Backend stores snapshot, broadcasts  game:update  to all other clients
6. Other clients receive  game:update, call  syncFromServer()
```

Never change this order.

---

## State Stores — Actual Interface (as of codebase)

### `gameStore.ts` — engine state only

```typescript
interface GameStore {
  game: GameState | null;
  error: string | null;
  selectedCardIds: string[];
  startGame(): void;           // host only — calls dealGame(), patches names, emits game:start
  selectCard(cardId: string): void;
  playSelectedCards(): void;   // runs playCards() engine, emits game:play
  skipCurrentTurn(): void;     // runs skipTurn() engine, emits game:skip
  syncFromServer(gameState: GameState): void;  // remote sync — never call locally
  clearError(): void;
  resetGame(): void;           // clears game + calls lobbyStore.clearRoom()
}
```

### `lobbyStore.ts` — network identity only

```typescript
interface LobbyStore {
  playerId:        string | null;  // UUID from backend, seeded from localStorage
  playerName:      string | null;  // seeded from localStorage
  roomId:          string | null;
  room:            RoomSnapshot | null;
  seatToPlayerId:  Record<number, string>;  // seatIndex → UUID playerId
  localSeatIndex:  number | null;           // this client's seat (= engine PlayerId)
  setPlayer(playerId: string, name: string): void;
  setRoom(room: RoomSnapshot): void;  // also computes seatToPlayerId + localSeatIndex
  clearRoom(): void;
  reset(): void;
}
```

These two stores must never be merged.

---

## Type Mapping — Frontend ↔ Backend

| Frontend engine | Backend | Rule |
|---|---|---|
| `PlayerId = 0\|1\|2\|3` | `seatIndex: number` | Identical values at all boundaries |
| `Player.id` | `PlayerSnapshot.seatIndex` | Map on receive |
| `GameState` | `gameState: unknown` | Never deserialize on backend |
| `rank: number \| null` | `status: "finished"` | Frontend derives rank, signals via `game:play` extended payload |

---

## REST API

| Method | Path | Purpose |
|---|---|---|
| `POST` | `/api/players/guest` | Create identity, get `playerId` |
| `POST` | `/api/rooms` | Host creates room |
| `GET` | `/api/rooms` | List open rooms (lobby) |
| `GET` | `/api/rooms/:roomId` | Room snapshot (used for refresh recovery in TablePage) |
| `POST` | `/api/rooms/:roomId/join` | Join room |
| `POST` | `/api/rooms/:roomId/leave` | Leave room |
| `GET` | `/health` | Liveness check |

All responses: `{ ok: true, data: T }` or `{ ok: false, error: string }`.

---

## Code Style

- **No `any`** — use `unknown` for opaque data, explicit generics everywhere else.
- **Explicit return types** on all exported functions.
- **No default exports** except React components.
- **Pure functions** in `game/engine/` — no side effects, no imports from stores or services.
- **Zod** for all external input validation (REST bodies, socket payloads).
- **Constants** for all socket event names — never inline string literals.
- **No abstraction for its own sake** — solve the actual problem in the fewest layers.

---

## Anti-Patterns — Claude Must Never Do These

```
✗ Rewrite or modify game/rules/rules.ts
✗ Move any game logic to the backend
✗ Add AI players or simulated opponents to networked play
✗ Introduce a new state management library
✗ Replace the socket system with polling or a different library
✗ Add a database or persistence layer without explicit instruction
✗ Change the folder structure without explicit instruction
✗ Merge gameStore and lobbyStore
✗ Add a roomId paste/input field as the primary join UX
✗ Use `any` in TypeScript
✗ Add undocumented socket events
✗ Make backend interpret or validate GameState content
✗ Redesign the seat mapping algorithm
✗ Break the local-engine-first execution order
✗ Hardcode seat indices instead of computing from localSeatIndex
✗ Reference mySeatIndex — the correct field is localSeatIndex
✗ Reference syncRemoteState — the correct method is syncFromServer
✗ Add a dedicated /lobby route — room browsing lives in TablePage State A
✗ Navigate to /lobby anywhere in code — the correct destination is /table
```

---

## Reconnection

On every socket `connect` event the frontend re-emits `room:join` if identity + room are known:

```typescript
socket.on("connect", () => {
  const { playerId, roomId } = lobbyStore.getState();
  if (playerId && roomId) {
    socket.emit("room:join", { roomId, playerId });
  }
});
```

`TablePage` handles page refresh by fetching `GET /api/rooms/:roomId` and restoring `GameState` from `snapshot.gameState`. Backend preserves the player's seat during disconnection; the slot is reclaimed only if the room is destroyed.

---

## Further Reading

- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) — layer breakdown and ownership model
- [docs/FLOW.md](docs/FLOW.md) — full user journey with route transitions
- [docs/GAME_RULES.md](docs/GAME_RULES.md) — Teang Len card game rules
- [docs/SOCKETS.md](docs/SOCKETS.md) — socket event payloads and contracts
- [docs/ROUTING.md](docs/ROUTING.md) — route ownership and refresh recovery
