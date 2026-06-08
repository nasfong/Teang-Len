# AGENT.md — Task Context

> This file tracks current work state. Overwrite it freely between sessions.
> For permanent rules, see CLAUDE.md. For architecture, see docs/.

---

## Current Status

Stable. Three-route architecture: /enter → /room → /table/:roomId.

---

## Completed Work

- [x] Frontend game engine (dealGame, playCards, skipTurn, classifyHand, canBeat)
- [x] Game rules configuration (rules.ts) — single source of truth
- [x] Zustand stores (gameStore, lobbyStore) — separate, correct boundaries
- [x] Socket service singleton with typed emitters
- [x] REST API service (api.ts)
- [x] EnterPage — name entry, guest player creation, navigate to /room
- [x] RoomPage — dedicated lobby at /room:
      - room list (poll 5s + room:list:update push)
      - create room with maxPlayers (2–4) selector
      - join room by clicking room card
      - navigates to /table/:roomId after create/join
- [x] TablePage — pure gameplay screen at /table/:roomId:
      State B: waiting (seats on table layout, online indicators, host start)
      State C: playing (game board, actions)
      State D: finished (rankings, back to rooms)
- [x] Routing: /enter, /room, /table/:roomId — clean separation of concerns
- [x] Catch-all redirects authenticated users to /room, new visitors to /enter
- [x] /table (no roomId) redirects to /room
- [x] Refresh recovery on /table/:roomId (GET /api/rooms/:id → hydrate → socket rejoin)
- [x] Seat mapping (localSeatIndex, seatToPlayerId)
- [x] Backend socket handlers with opaque GameState passthrough
- [x] Extended game:play payload signals (playerFinished, gameOver, rankings)

---

## Current Mission

No active mission. Awaiting next task.

## Recently Completed

- [x] Fulu (Full House) rule added to game engine:
      - `rules.allowFulu: boolean` (default `true`) in rules.ts — single source of truth
      - `isFullHouse` in hands.ts guarded by `rules.allowFulu`
      - Fulu beats only Fulu; triple rank primary, pair rank secondary
      - Display label: "Fulu" in TrickArea TYPE_LABEL map
      - Vitest tests: detection (enabled/disabled), comparison (triple wins, pair tiebreak)

---

## Pending Work

- [ ] Verify reconnection: auto re-emit room:join on socket connect event
- [ ] Confirm backend emits room:list:update on room create/join
- [ ] End-to-end test: full 4-player game from name entry to ranking screen
- [ ] Production build and deployment configuration

---

## Known Problems

- aiPlayTurn exists in engine.ts — must never be called in networked mode.
- Game can be started with as few as 2 players; engine always deals for 4 seats.
- Room list polling (5s) runs alongside room:list:update push — both active in RoomPage.
