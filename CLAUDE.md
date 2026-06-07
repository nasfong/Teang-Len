# CLAUDE.md — Teang Len Multiplayer Card Game

> **This file is the single source of truth for Claude Code behavior in this repository.**
> Read it fully before touching any file. Violations will break multiplayer correctness.

---

## Project Overview

Real-time multiplayer Cambodian card game (Teang Len).

| Layer | Stack | Responsibility |
|---|---|---|
| Frontend | React 19 · Vite · TypeScript · Zustand 5 | Game engine, UI, state |
| Backend | Node.js · Express 4 · Socket.IO 4 · TypeScript | Rooms, players, sync only |
| Storage | In-memory (`Map`) | No database — ever |

---

## Architecture Boundaries

### Frontend owns — never move these to backend

- Game engine (`src/game/engine/`)
- Game rules (`src/game/rules/rules.ts`)
- Card validation and comparison
- Turn logic (who plays, who skips)
- Combo classification (`classifyHand`, `canBeat`, `isBombPlay`)
- `GameState` mutations (`dealGame`, `playCards`, `skipTurn`)
- Zustand game store (`src/store/gameStore.ts`)

### Backend owns — never implement in frontend

- Room creation and lifecycle
- Player registry (UUID identity)
- Socket room channels
- Broadcasting `GameState` snapshots to all clients
- Seat assignment (`seatIndex` 0–3)
- Connection / disconnection tracking

### The hard boundary

```
Frontend engine runs first → emits result to backend → backend broadcasts to others
Backend never computes, validates, or modifies GameState content
```

---

## Folder Structure

Do not restructure without explicit instruction.

```
frontend/src/
  game/
    engine/        ← pure functions only, no side effects
    rules/         ← NEVER touch rules.ts
    types/
  store/
    gameStore.ts   ← engine state only
    lobbyStore.ts  ← network identity + room state
  services/
    api.ts         ← all REST calls
    socket.ts      ← singleton socket + typed emitters
  hooks/
    useSocketListeners.ts
  pages/
    NameEntryScreen.tsx
    LobbyScreen.tsx
    GamePage.tsx
  components/

backend/src/
  api/             ← REST controllers + router
  sockets/         ← handlers, emit helpers
  services/        ← playerService, roomService
  rooms/           ← roomStore, roomFactory
  types/           ← index.ts, schemas.ts, events.ts
  index.ts
```

---

## UI Flow — Required Order

This is the only correct user flow. Do not alter it.

```
1. NameEntryScreen  → user enters display name
2. POST /api/players/guest  → receives UUID playerId
3. socket.connect()
4. LobbyScreen  → shows live room list
5. User clicks a room  → POST /api/rooms/:id/join
6. socket.emit("room:join")
7. GameTable (waiting)  → shows players + ready buttons
8. socket.emit("player:ready")
9. Host clicks Start  → socket.emit("game:start")
10. GamePage (active)  → manual play / skip only
```

**There is no roomId paste flow. Rooms are joined by clicking from a list.**

---

## Multiplayer Rules

- **NO AI players** — ever. Remove any `aiPlayTurn` calls in networked mode.
- **NO fake/simulated opponents** — every seat must be a real connected user.
- **NO auto-fill** — do not fill empty seats with bots.
- Games require real human players in all active seats before starting.
- The host is always `seatIndex 0` / `hostPlayerId`.
- Only the host may emit `game:start`.
- Only the player whose turn it is may emit `game:play` or `game:skip`.

---

## Seat Mapping — Visual Layout

Backend assigns `seatIndex` (0–3). Frontend maps it to screen position relative to the local player.

```
         Top (localSeat + 2) % 4
              ┌───────┐
Left          │       │         Right
(localSeat+3) │  Table│  (localSeat+1) % 4
    % 4       │       │
              └───────┘
        Bottom = local player
```

```typescript
// Always compute positions like this — never hardcode indices
function getRelativeSeat(mySeat: number, theirSeat: number): "bottom" | "right" | "top" | "left" {
  const delta = (theirSeat - mySeat + 4) % 4;
  return (["bottom", "right", "top", "left"] as const)[delta];
}
```

- This mapping is deterministic and must never change.
- `mySeatIndex` comes from `lobbyStore`, not from the engine.

---

## Socket Event Contract

### Client → Server

| Event | Payload | When |
|---|---|---|
| `room:join` | `{ roomId, playerId }` | After REST join + on reconnect |
| `room:leave` | `{ roomId, playerId }` | User leaves room |
| `player:ready` | `{ roomId, playerId }` | Player clicks Ready |
| `game:start` | `{ roomId, playerId, initialGameState }` | Host only, after all ready |
| `game:play` | `{ roomId, playerId, gameState, playerFinished?, finishedRank?, gameOver?, rankings? }` | Active player plays cards |
| `game:skip` | `{ roomId, playerId, gameState }` | Active player skips |

### Server → Client

| Event | Payload | Action |
|---|---|---|
| `room:update` | `{ room: RoomSnapshot }` | Update lobbyStore.room |
| `room:list:update` | `{ rooms: RoomSnapshot[] }` | Refresh lobby list |
| `game:update` | `{ roomId, gameState, version, triggeredBy }` | Sync remote move |
| `turn:update` | `{ roomId, currentPlayerId, version }` | Highlight active seat |
| `player:finished` | `{ roomId, playerId, rank }` | Show rank badge |
| `game:end` | `{ roomId, rankings, gameState }` | Show results screen |
| `player:disconnected` | `{ roomId, playerId }` | Show disconnected indicator |
| `error` | `{ message }` | Show error to user |

**No other events exist. Do not invent new events without updating this contract.**

---

## GameState Rule

```
GameState is opaque to the backend.
Backend stores it. Backend broadcasts it. Backend never reads it.
```

- `gameState: unknown` in all backend types — intentional.
- Frontend engine is the only code that creates or mutates `GameState`.
- When `game:update` arrives, apply it directly: `gameStore.syncRemoteState(gameState)`.
- Guard: only sync if `triggeredBy !== myPlayerId` to avoid overwriting local state.
- Use `version` to discard out-of-order updates.

---

## State Stores

### `gameStore.ts` — engine state only

```typescript
interface GameStore {
  game: GameState | null;
  error: string | null;
  selectedCardIds: string[];
  startGame(): void;
  selectCard(id: string): void;
  playSelectedCards(): void;
  skipCurrentTurn(): void;
  syncRemoteState(state: GameState): void;  // ← remote sync only
  clearError(): void;
  resetGame(): void;
}
```

### `lobbyStore.ts` — network identity only

```typescript
interface LobbyStore {
  playerId:    string | null;   // UUID from backend
  playerName:  string | null;
  mySeatIndex: number | null;   // maps to engine PlayerId
  roomId:      string | null;
  room:        RoomSnapshot | null;
  isConnected: boolean;
  error:       string | null;
}
```

These two stores must never be merged.

---

## Type Mapping

| Frontend engine | Backend | Rule |
|---|---|---|
| `PlayerId = 0\|1\|2\|3` | `playerId: string (UUID)` | `seatIndex === PlayerId` at boundary |
| `Player.id` | `PlayerSnapshot.seatIndex` | Map on receive |
| `GameState` | `gameState: unknown` | Never deserialize on backend |
| `rank: number \| null` | `status: "finished"` | Derive from engine, signal via `game:play` payload |

---

## REST API

| Method | Path | Purpose |
|---|---|---|
| `POST` | `/api/players/guest` | Create identity, get `playerId` |
| `POST` | `/api/rooms` | Host creates room |
| `GET` | `/api/rooms` | List open rooms (lobby) |
| `GET` | `/api/rooms/:roomId` | Room snapshot |
| `POST` | `/api/rooms/:roomId/join` | Join room |
| `POST` | `/api/rooms/:roomId/leave` | Leave room |
| `GET` | `/health` | Liveness check |

All responses: `{ ok: true, data: T }` or `{ ok: false, error: string }`.

---

## Code Style

- **No `any`** — use `unknown` for opaque data, explicit generics everywhere else.
- **Explicit return types** on all exported functions.
- **Small modules** — one responsibility per file.
- **No default exports** except React components.
- **Pure functions** in `game/engine/` — no side effects, no imports from stores.
- **No abstraction for its own sake** — solve the actual problem.
- **Zod** for all external input validation (REST bodies, socket payloads).
- **Constants** for all socket event names — never inline string literals.

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
✗ Inline roomId input as the primary join UX
✗ Use `any` in TypeScript
✗ Add undocumented socket events
✗ Make backend interpret or validate GameState content
✗ Redesign the seat mapping algorithm
✗ Break the local-engine-first execution order
```

---

## Execution Order — Multiplayer Move

This order is invariant. Never change it.

```
1. Validate it is the local player's turn  (gameStore.game.currentPlayerId === mySeatIndex)
2. Run frontend engine:  playCards()  or  skipTurn()
3. Update gameStore with result
4. Emit  game:play  or  game:skip  to backend (full gameState included)
5. Backend stores snapshot, broadcasts  game:update  to all other clients
6. Other clients receive  game:update, call  syncRemoteState()
```

---

## Reconnection

On every socket `connect` event:

```typescript
socket.on("connect", () => {
  const { playerId, roomId } = lobbyStore.getState();
  if (playerId && roomId) {
    socket.emit("room:join", { roomId, playerId });
  }
});
```

Backend preserves the player's seat during disconnection. The slot is reclaimed only if the room is explicitly destroyed.
