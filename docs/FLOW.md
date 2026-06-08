# FLOW.md — User Journey

---

## Complete Flow Diagram

```
Browser opens
      │
      ▼
Has playerId in localStorage?
      │
   No │                 Yes │
      ▼                      ▼
  /enter ──────────────► /table
  EnterPage              TablePage (State A)
      │
      │ User types name, clicks Continue
      │ POST /api/players/guest → { playerId, name }
      │ Store in localStorage + lobbyStore
      │
      ▼
  /table
  TablePage — STATE A: Room Browser
      │
      │ Fetches GET /api/rooms → room list
      │ Polls every 5s, updates on room:list:update
      │
      ├── [Create Room] clicked
      │       Choose maxPlayers (2-4) via dropdown
      │       POST /api/rooms { playerId, maxPlayers }
      │       ← RoomSnapshot
      │       emit room:join + player:ready
      │       lobbyStore.setRoom(snapshot)
      │       navigate /table/:roomId
      │
      └── [JOIN] clicked on a room card
              POST /api/rooms/:roomId/join { playerId }
              ← RoomSnapshot
              emit room:join + player:ready
              lobbyStore.setRoom(snapshot)
              navigate /table/:roomId
                      │
                      ▼
              /table/:roomId
              TablePage — STATE B: Waiting
                      │
                      │ Shows seats from room.players
                      │ Online/offline dot per seat
                      │ [Leave] button for all players
                      │ Host sees [Start Game] (disabled if < 2 players)
                      │
                      │ [Start Game] clicked (host only)
                      │   gameStore.startGame()
                      │     → dealGame() → patch player names
                      │     → set gameStore.game
                      │     → emit game:start { roomId, playerId, initialGameState }
                      │         → backend stores + broadcasts game:update
                      │             → other clients: syncFromServer(gameState)
                      │
                      ▼
              TablePage — STATE C: Playing
              (same URL, no navigation)
                      │
                      │ Local player's turn:
                      │   Click cards → selectCard(id)
                      │   [Play] → playSelectedCards()
                      │              → playCards(engine) → emit game:play
                      │   [Skip] → skipCurrentTurn()
                      │              → skipTurn(engine) → emit game:skip
                      │
                      │ Remote turn:
                      │   game:update received, triggeredBy !== playerId
                      │   → syncFromServer(gameState)
                      │
                      │ All players ranked → game.phase === 'game_over'
                      │
                      ▼
              TablePage — STATE D: Finished
              (same URL, no navigation)
                      │
                      │ Shows rankings with medals
                      │ [Back to Rooms] → resetGame() → navigate /table
```

---

## State Machine

`TablePage` selects its rendered state using this order:

```typescript
if (!roomIdParam)              → State A  (room browser)
if (hydrating || !room)        → Loading  (refresh recovery in progress)
if (hydrateError)              → Error    (room gone, redirect to /table)
if (!game)                     → State B  (waiting)
if (game.phase === 'game_over')→ State D  (finished)
/* else */                     → State C  (playing)
```

---

## Page Refresh Recovery

User refreshes browser on `/table/:roomId`:

1. `lobbyStore` rehydrates `playerId` + `playerName` from `localStorage` immediately — no flash.
2. `RequireAuth` passes — no redirect to `/enter`.
3. `TablePage` mounts with `roomIdParam` set, `room` is null.
4. Hydration effect runs: `GET /api/rooms/:roomId`.
5. `setRoom(snapshot)` — restores seat mapping and `localSeatIndex`.
6. Emits `room:join` + `player:ready` to rejoin socket room.
7. If `snapshot.gameState` is non-null → `syncFromServer(gameState)` — game resumes.
8. If room is gone → shows error, redirects to `/table` after 1.5 seconds.

User refreshes on `/table` (room browser):

- No hydration needed. Room browser loads fresh.

---

## Leave Flow

From State B or State C:

```
[Leave] clicked
  emit room:leave { roomId, playerId }
  gameStore.resetGame()   ← also calls lobbyStore.clearRoom()
  navigate /table         ← back to room browser
```

From State D (game over):

```
[Back to Rooms] clicked
  gameStore.resetGame()   ← also calls lobbyStore.clearRoom()
  navigate /table
```

---

## Key UX Rules

- **No dedicated Lobby page** — the table screen is the lobby.
- **No roomId input** — rooms are joined by clicking room cards only.
- **No ready button** — `player:ready` is emitted automatically on room join.
- **No page transition after joining** — URL updates to `/table/:roomId`, same component renders State B.
- **No AI fill** — empty seats show "Waiting for player…" placeholders.
- **Host starts the game** — only `room.hostPlayerId === playerId` sees the Start button.
- **Minimum 2 players** — Start button is disabled if `playerCount < 2`.
