import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useLobbyStore } from '../store/lobbyStore';

const generateDefaultName = (): string => {
  const prefixes = ['Sokha', 'Dara', 'Bory', 'Champa', 'Guest'];
  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
  const pin = Math.floor(1000 + Math.random() * 9000);
  return `${prefix}_${pin}`;
};

export function LoginPage() {
  const { playerId, setPlayer } = useLobbyStore();
  const navigate = useNavigate();

  const [nameInput, setNameInput] = useState(generateDefaultName());
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Already identified — skip login
  if (playerId) return <Navigate to="/lobby" replace />;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const name = nameInput.trim();
    if (!name) return;
    setBusy(true);
    setErr(null);
    try {
      const player = await api.createGuest(name);
      setPlayer(player.playerId, player.name);
      navigate('/lobby');
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : 'Failed to create player');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="screen screen--start">
      <div className="hero">
        <div className="hero__suits">♠ ♣ ♦ ♥</div>
        <h1 className="hero__title">ទាំងឡែន</h1>
        <p className="hero__latin">Teang Len Cambodia</p>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <input
            className="lobby-input"
            type="text"
            placeholder="Enter your name (max 24 chars)"
            maxLength={24}
            value={nameInput}
            onChange={e => setNameInput(e.target.value)}
            disabled={busy}
            autoFocus
          />
          <button className="btn btn--deal" type="submit" disabled={busy || !nameInput.trim()}>
            {busy ? 'Please wait…' : 'Continue'}
          </button>
        </form>
        {err && <p style={{ color: '#f87171', marginTop: 8 }}>{err}</p>}
      </div>
    </div>
  );
}
