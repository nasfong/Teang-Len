import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../../services/api';
import { socketService } from '../../../services/socket';
import { useLobbyStore } from '../../../store/lobbyStore';
import { useGameStore } from '../../../store/gameStore';
import type { GameState } from '../../../game/types';

interface HydrationResult {
  hydrateError: string | null;
}

export function useTableHydration(roomIdParam: string | undefined): HydrationResult {
  const navigate = useNavigate();
  const [hydrateError, setHydrateError] = useState<string | null>(null);

  const { playerId, room, setRoom } = useLobbyStore();
  const { syncFromServer }          = useGameStore();

  useEffect(() => {
    if (!roomIdParam || !playerId || room) return;
    api.getRoom(roomIdParam)
      .then(snapshot => {
        setRoom(snapshot);
        socketService.emitRoomJoin({ roomId: roomIdParam, playerId });
        socketService.emitPlayerReady({ roomId: roomIdParam, playerId });
        if (snapshot.gameState) syncFromServer(snapshot.gameState as GameState);
      })
      .catch(() => {
        setHydrateError('Room not found. Redirecting…');
        setTimeout(() => navigate('/room'), 1500);
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomIdParam, playerId]); // intentionally omits room — only runs until hydrated

  return { hydrateError };
}
