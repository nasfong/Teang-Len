import { useEffect, useRef, useState } from 'react';
import type { GameState } from '../../../game/types';
import { rules } from '../../../game/rules/rules';
import { socketService, SERVER_EVENTS } from '../../../services/socket';
import { useGameStore } from '../../../store/gameStore';
import { useLobbyStore } from '../../../store/lobbyStore';

export interface TurnTimerResult {
  secondsLeft:  number | null;  // null when timer is disabled or no active game
  isUrgent:     boolean;        // true when ≤5 seconds remain
  notification: string | null;  // brief auto-action message ("Auto Played", etc.)
}

const { enabled, secondsPerTurn } = rules.turnTimer;

export function useTurnTimer(
  game: GameState | null,
  localSeatIndex: number | null,
): TurnTimerResult {
  const [secondsLeft,  setSecondsLeft]  = useState<number | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

  // Ref for the epoch-ms when the current turn started.
  // Updated from server game:update payloads and from lobbyStore on page refresh.
  const turnStartedAtRef = useRef<number | null>(null);

  // Notification auto-clear timer
  const notifRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Initialize from RoomSnapshot on page refresh ──────────────────────────
  // lobbyStore.room is populated by useTableHydration after mount, so watch
  // for it to become non-null and seed the ref.
  const room = useLobbyStore(s => s.room);
  useEffect(() => {
    if (room?.turnStartedAt) {
      turnStartedAtRef.current = room.turnStartedAt;
    }
  }, [room?.turnStartedAt]);

  // ── Clear ref when game resets ────────────────────────────────────────────
  useEffect(() => {
    if (game === null) {
      turnStartedAtRef.current = null;
      setSecondsLeft(null);
    }
  }, [game]);

  // ── Countdown interval (250 ms poll for smooth display) ───────────────────
  useEffect(() => {
    if (!enabled) {
      setSecondsLeft(null);
      return;
    }

    const id = setInterval(() => {
      if (turnStartedAtRef.current === null) {
        setSecondsLeft(null);
        return;
      }
      const elapsed = Date.now() - turnStartedAtRef.current;
      const left    = Math.max(0, secondsPerTurn - Math.floor(elapsed / 1000));
      setSecondsLeft(left);
    }, 250);

    return () => clearInterval(id);
  }, []);  // runs once — refs keep values current

  // ── Socket listeners (registered once on mount) ───────────────────────────
  useEffect(() => {
    const { socket } = socketService;

    function onGameUpdate(payload: { turnStartedAt?: number }) {
      if (payload.turnStartedAt !== undefined) {
        turnStartedAtRef.current = payload.turnStartedAt;
      }
    }

    function onTurnTimeout() {
      if (!enabled) return;

      const { game: g, autoPlayCard, skipCurrentTurn } = useGameStore.getState();
      const { localSeatIndex: seat, room: r, playerId, seatToPlayerId } = useLobbyStore.getState();

      if (!g || seat === null || !r) return;
      if (g.phase === 'game_over') return;

      const activeSeat     = g.currentPlayer;
      const isMyTurn       = activeSeat === seat;

      // Host executes on behalf of a disconnected active player
      const activeUUID         = seatToPlayerId[activeSeat];
      const playerInRoom       = r.players.find(p => p.playerId === activeUUID);
      const activeDisconnected = playerInRoom?.isOnline === false;
      const isHost             = r.hostPlayerId === playerId;

      const shouldAct = isMyTurn || (activeDisconnected && isHost);
      if (!shouldAct) return;

      const isOpening = g.currentTrick.currentHand === null;

      function showNotif(msg: string): void {
        if (notifRef.current) clearTimeout(notifRef.current);
        setNotification(msg);
        notifRef.current = setTimeout(() => {
          setNotification(null);
          notifRef.current = null;
        }, 1200);
      }

      if (isOpening) {
        const hand = g.players[activeSeat].hand;
        if (hand.length > 0) {
          autoPlayCard(hand[0].id);
          showNotif(isMyTurn ? 'Auto Played' : `${g.players[activeSeat].name} timed out`);
        }
      } else {
        skipCurrentTurn();
        showNotif(isMyTurn ? 'Auto Passed' : `${g.players[activeSeat].name} timed out`);
      }
    }

    socket.on(SERVER_EVENTS.GAME_UPDATE,   onGameUpdate);
    socket.on(SERVER_EVENTS.TURN_TIMEOUT,  onTurnTimeout);

    return () => {
      socket.off(SERVER_EVENTS.GAME_UPDATE,  onGameUpdate);
      socket.off(SERVER_EVENTS.TURN_TIMEOUT, onTurnTimeout);
    };
  }, []);  // runs once — store.getState() always returns fresh state

  // ── Cleanup on unmount ────────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      if (notifRef.current) clearTimeout(notifRef.current);
    };
  }, []);

  return {
    secondsLeft:  enabled ? secondsLeft : null,
    isUrgent:     secondsLeft !== null && secondsLeft <= 5,
    notification,
  };
}
