# ROUTING.md — Route Ownership

React Router v6. All routes defined in `frontend/src/App.tsx`.

---

## Route Table

| Path | Component | Guard | Purpose |
|---|---|---|---|
| `/enter` | `EnterPage` | None | Name entry, guest player creation |
| `/table` | `TablePage` | RequireAuth | Room browser (State A) |
| `/table/:roomId` | `TablePage` | RequireAuth | Waiting / Playing / Finished (States B–D) |
| `*` (catch-all) | `CatchAll` | None | Redirect based on session |

`LobbyPage` no longer exists. `TablePage` serves all post-auth screens.

---

## Route Details

### /enter

- No auth guard.
- If `playerId` already exists in `lobbyStore` (seeded from `localStorage`), immediately redirects to `/table`.
- On submit: calls `POST /api/players/guest`, stores identity via `lobbyStore.setPlayer()`, navigates to `/table`.

---

### /table (no roomId)

- Protected by `RequireAuth`.
- `useParams()` returns `{}` — `roomId` is `undefined`.
- Renders TablePage **State A**: room browser.
- Fetches room list on mount via `GET /api/rooms`.
- Polls every 5 seconds as fallback.
- Subscribes to `room:list:update` for push-based refresh.
- Create Room: user picks maxPlayers (2–4), `POST /api/rooms` → emit `room:join` + `player:ready` → navigate `/table/:roomId`.
- Join Room: `POST /api/rooms/:id/join` → emit `room:join` + `player:ready` → navigate `/table/:roomId`.

---

### /table/:roomId

- Protected by `RequireAuth`.
- `roomId` path param is required and enables refresh recovery.
- Renders TablePage **States B, C, or D** based on game state:

| Sub-state | Condition | UI |
|---|---|---|
| B — Waiting | `game === null` | Seat list, Start button (host only) |
| C — Playing | `game.phase === 'playing'` | Game board |
| D — Finished | `game.phase === 'game_over'` | Rankings, Back to Rooms |

#### Refresh Recovery on /table/:roomId

When `room` is null on mount (browser refresh):

1. Fetches `GET /api/rooms/:roomId` using the URL param.
2. Calls `lobbyStore.setRoom(snapshot)` — restores `localSeatIndex` and `seatToPlayerId`.
3. Emits `room:join` + `player:ready` to rejoin socket room.
4. If `snapshot.gameState` is non-null, calls `gameStore.syncFromServer(snapshot.gameState)`.
5. If room fetch fails → shows error, redirects to `/table` after 1.5 seconds.

---

### * (catch-all)

- If `playerId` exists → redirect to `/table`.
- If not → redirect to `/enter`.

---

## Auth Guard

```typescript
function RequireAuth({ children }: { children: React.ReactNode }) {
  const playerId = useLobbyStore(s => s.playerId);
  if (!playerId) return <Navigate to="/enter" replace />;
  return <>{children}</>;
}
```

`lobbyStore` seeds `playerId` from `localStorage` at module initialization — guard passes synchronously on refresh, no flash.

---

## URL Design Rules

- `roomId` is a path param on `/table/:roomId`, not a query string — enables direct URL refresh.
- `playerId` is in `localStorage` only — URLs are shareable without leaking identity.
- `/table` (no roomId) = room browser. `/table/:roomId` = in-room screen. Same component, different state.
- Never add a separate `/lobby` route. Room browsing lives inside `/table`.
- Never add a roomId input field. Join only via clicking room cards in State A.

---

## Navigation Flows

```
EnterPage  →  /table            (after guest creation)
State A    →  /table/:roomId    (after create or join)
State B/C  →  /table            (after Leave)
State D    →  /table            (after Back to Rooms)
CatchAll   →  /table or /enter  (based on session)
```

No other programmatic navigation exists.

---

## Socket Connection Lifecycle

Socket connects automatically (`autoConnect: true`) at app boot when `socket.ts` is imported. It is not tied to any route.

Room browser socket subscription (`room:list:update`) is active only when `!roomIdParam` (State A). It is cleaned up when navigating to `/table/:roomId`.

Global listeners (`game:update`, `room:update`) are registered in `App.tsx`, scoped to authenticated sessions.
