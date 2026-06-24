import { useState, useEffect, useCallback } from 'react';
import { socketService, SERVER_EVENTS } from '../../../services/socket';
import { roomApi } from '../../../services/roomApi';
import type { RoomSnapshot } from '../../../services/api';

const POLL_INTERVAL_MS = 5000;

interface RoomListResult {
  rooms: RoomSnapshot[];
  loadingRooms: boolean;
  fetchRooms: () => Promise<void>;
}

export function useRoomList(): RoomListResult {
  const [rooms, setRooms]               = useState<RoomSnapshot[]>([]);
  const [loadingRooms, setLoadingRooms] = useState(false);

  const fetchRooms = useCallback(async () => {
    setLoadingRooms(true);
    try {
      const list = await roomApi.list();
      setRooms(list);
    } catch {
      // silent — user can refresh manually
    } finally {
      setLoadingRooms(false);
    }
  }, []);

  // Initial fetch + periodic poll
  useEffect(() => {
    let active = true;
    roomApi.list()
      .then(list => { if (active) setRooms(list); })
      .catch(() => {});
    const timer = setInterval(() => { if (active) fetchRooms(); }, POLL_INTERVAL_MS);
    return () => { active = false; clearInterval(timer); };
  }, [fetchRooms]);

  // Push update from server
  useEffect(() => {
    const { socket } = socketService;
    const handler = () => fetchRooms();
    socket.on(SERVER_EVENTS.ROOM_LIST_UPDATE, handler);
    return () => { socket.off(SERVER_EVENTS.ROOM_LIST_UPDATE, handler); };
  }, [fetchRooms]);

  return { rooms, loadingRooms, fetchRooms };
}
