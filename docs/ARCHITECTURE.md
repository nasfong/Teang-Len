# ARCHITECTURE.md — Teang Len System Design

---

## Overview

Teang Len is a real-time multiplayer card game. The system is split into two processes that communicate over HTTP (REST) and WebSocket (Socket.IO). The game engine lives entirely on the frontend.

```
┌──────────────────────────────────────────────────┐
│                   Browser (Client)                │
│                                                   │
│  ┌─────────────┐   ┌──────────────────────────┐  │
│  │  React UI   │   │    Game Engine (pure TS)  │  │
│  │  (pages /   │◄──│  dealGame / playCards /   │  │
│  │  components)│   │  skipTurn / classifyHand  │  │
│  └──────┬──────┘   └───────────┬──────────────┘  │
│         │                      │                  │
│  ┌──────▼──────────────────────▼──────────────┐  │
│  │            Zustand Stores                   │  │
│  │  gameStore (GameState)  lobbyStore (room)   │  │
│  └──────┬───────────────────────────┬──────────┘  │
│         │ REST (api.ts)             │ Socket.IO    │
└─────────┼───────────────────────────┼─────────────┘
          │                           │
┌─────────▼───────────────────────────▼─────────────┐
│                  Node.js Backend                   │
│                                                    │
│  ┌────────────┐   ┌──────────────────────────────┐ │
│  │ Express    │   │   Socket.IO                  │ │
│  │ REST API   │   │   roomHandlers / gameHandlers│ │
│  └────────────┘   └──────────────────────────────┘ │
│                                                    │
│  ┌────────────────────────────────────────────────┐│
│  │  roomService / playerService (in-memory Maps) ││
│  └────────────────────────────────────────────────┘│
└────────────────────────────────────────────────────┘
```

---

## Frontend Layers

### 1. Pages (`src/pages/`)

Route-level components. Each page owns one route and its lifecycle.

| File | Route | Responsibility |
|---|---|---|
| `EnterPage.tsx` | `/enter` | Name input, guest player creation, redirect to lobby |
| `LobbyPage.tsx` | `/lobby` | Room list display, create/join room, navigate to table |
| `TablePage.tsx` | `/table/:roomId` | Waiting lobby, active gameplay, game-over screen |

### 2. Components (`src/components/`)

Pure display components. No routing, no store subscriptions beyond what is passed as props.

| File | Renders |
|---|---|
| `PlayerZone.tsx` | One player's card hand and status |
| `TrickArea.tsx` | Current trick play on the table |
| `ActionBar.tsx` | Play and Skip buttons for the local player |
| `CardView.tsx` | A single card |
| `GameLog.tsx` | Game event log sidebar |

### 3. Stores (`src/store/`)

Two separate Zustand stores. Must never be merged.

**`gameStore.ts`** — owns `GameState` and all engine interactions:
- Holds `game: GameState | null`, `error`, `selectedCardIds`
- Calls engine functions (`dealGame`, `playCards`, `skipTurn`) then emits results to backend
- `syncFromServer(gameState)` is the only way remote state enters the store

**`lobbyStore.ts`** — owns network identity and room membership:
- Holds `playerId`, `playerName` (persisted in `localStorage`)
- Holds `roomId`, `room`, `localSeatIndex`, `seatToPlayerId`
- `localSeatIndex` is the bridge between backend `seatIndex` and engine `PlayerId`

### 4. Game Engine (`src/game/engine/`)

Pure TypeScript functions. Zero side effects. No imports from stores, services, or React.

| File | Responsibility |
|---|---|
| `engine.ts` | `dealGame`, `playCards`, `skipTurn`, `isGameOver` |
| `hands.ts` | `classifyHand`, `canBeat`, `isBombPlay` |
| `cards.ts` | `makeDeck`, `shuffleDeck`, `sortCards`, card comparison |

### 5. Rules (`src/game/rules/rules.ts`)

A single `rules` constant object. Every rule the engine uses is derived from here. Never modify this file unless explicitly changing a game rule.

### 6. Services (`src/services/`)

| File | Responsibility |
|---|---|
| `api.ts` | Typed wrappers around all REST endpoints |
| `socket.ts` | Singleton `SocketService` with typed emit methods and event constants |

---

## Backend Layers

### 1. REST API (`src/api/`)

Express routes for player and room management. All bodies validated with Zod schemas before reaching controllers.

### 2. Socket Handlers (`src/sockets/`)

| File | Responsibility |
|---|---|
| `roomHandlers.ts` | `room:join`, `room:leave`, `player:ready` |
| `gameHandlers.ts` | `game:start`, `game:play`, `game:skip` |
| `disconnectHandler.ts` | Mark player disconnected, notify room |
| `emit.ts` | Typed broadcast helpers (`broadcastGameUpdate`, etc.) |
| `parsePayload.ts` | Zod-parse incoming socket payloads, emit `error` on failure |

### 3. Services (`src/services/`)

| File | Responsibility |
|---|---|
| `playerService.ts` | Create guest players, look up by UUID |
| `roomService.ts` | Room CRUD, seat assignment, `applyGameState`, `startGame` |

### 4. Room Storage (`src/rooms/`)

`roomStore.ts` — in-memory `Map<string, Room>`. No persistence, no database.

`roomFactory.ts` — creates a `Room` with defaults.

---

## State Ownership

| State | Owner | Never in |
|---|---|---|
| `GameState` (cards, trick, turn) | Frontend `gameStore` | Backend (stored as `unknown`) |
| Player identity (UUID, name) | Backend `playerService` + `lobbyStore` | `gameStore` |
| Room membership (seats) | Backend `roomService` + `lobbyStore.room` | `gameStore` |
| Selected cards (UI) | Frontend `gameStore.selectedCardIds` | Backend |
| Seat-to-UUID mapping | Frontend `lobbyStore.seatToPlayerId` | Backend (not needed) |

---

## Synchronization Model

Every move follows this exact sequence:

```
Local player action
  → Frontend engine mutates GameState locally
  → gameStore updated
  → socket emit (game:play or game:skip) with full GameState snapshot
      → Backend receives, stores GameState opaquely, increments version
      → Backend broadcasts game:update to all room members
          → Remote clients apply syncFromServer(gameState)
          → Guard: skip if triggeredBy === own playerId
```

The local player never waits for a server response to update their own UI. The server is a relay, not an authority on game logic.

---

## Why Backend Does Not Own Game Rules

1. **Latency**: Running validation on the server introduces a round-trip before the local player sees their move reflected.
2. **Trust model**: All players in a room are trusted. Cheating prevention is not a design goal.
3. **Simplicity**: One copy of the rules, one place to change them. No serialization of complex rule logic to a server format.
4. **Correctness**: The engine is pure functions that are easy to unit-test in isolation without any server infrastructure.

The backend's only job regarding game logic is to store the snapshot and broadcast it verbatim.

---

## Folder Responsibility Quick Reference

```
frontend/src/game/engine/   Pure functions. Edit when fixing engine logic.
frontend/src/game/rules/    Rule constants. Edit only when changing rules.
frontend/src/game/types/    TypeScript interfaces shared across engine + UI.
frontend/src/store/         Zustand stores. Edit when changing state shape.
frontend/src/services/      API + socket wrappers. Edit when changing endpoints or events.
frontend/src/pages/         Route components. Edit when changing page behavior or flow.
frontend/src/components/    Display components. Edit when changing UI rendering.

backend/src/api/            REST routes and controllers.
backend/src/sockets/        Socket event handlers and emit helpers.
backend/src/services/       Room and player business logic.
backend/src/rooms/          In-memory room store.
backend/src/types/          Shared types, Zod schemas, event name constants.
```
