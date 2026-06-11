// ─────────────────────────────────────────────
// Socket Event Constants
// Single source of truth — import from here everywhere.
// ─────────────────────────────────────────────

// Client → Server
export const CLIENT_EVENTS = {
  ROOM_JOIN:               "room:join",
  ROOM_LEAVE:              "room:leave",
  ROOM_QUEUE_LEAVE:        "room:queue-leave",
  ROOM_CANCEL_QUEUE_LEAVE: "room:cancel-queue-leave",
  PLAYER_READY:            "player:ready",
  GAME_START:              "game:start",
  GAME_PLAY:               "game:play",
  GAME_SKIP:               "game:skip",
} as const;

// Server → Client
export const SERVER_EVENTS = {
  ROOM_UPDATE:          "room:update",
  GAME_UPDATE:          "game:update",
  TURN_UPDATE:          "turn:update",
  TURN_TIMEOUT:         "turn:timeout",
  PLAYER_FINISHED:      "player:finished",
  GAME_END:             "game:end",
  PLAYER_DISCONNECTED:  "player:disconnected",
  ERROR:                "error",
} as const;

export type ClientEvent = typeof CLIENT_EVENTS[keyof typeof CLIENT_EVENTS];
export type ServerEvent = typeof SERVER_EVENTS[keyof typeof SERVER_EVENTS];
