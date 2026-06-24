import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

// ── Design tokens (shared chunky blue identity) ───────────────────────────────
const C = {
  panelTop: '#6CC3FF',
  panelMid: '#2B7FC9',
  panelDeep: '#1E5FA0',
  panelEdge: '#00376B',
  fieldBg: '#1E5FA0',
  accent: '#FFD27A',
  btnOuter: '#00376B',
  btnFaceTop: '#8FE04A',
  btnFaceMid: '#6FCB33',
  btnFaceBot: '#5BB528',
  btnBase: '#3F861C',
  btnBaseDark: '#2F6614',
} as const;

const FONT = "'Lilita One', 'Fredoka', 'Comic Sans MS', cursive";

const INPUT_STYLE = {
  width: '100%',
  boxSizing: 'border-box',
  padding: '14px 18px 14px 52px',
  fontSize: 18,
  fontFamily: FONT,
  color: '#fff',
  background: 'rgba(0,0,0,0.2)',
  border: `3px solid ${C.panelEdge}`,
  borderRadius: 16,
  outline: 'none',
  boxShadow: 'inset 0 3px 6px rgba(0,0,0,0.35), inset 0 -2px 0 rgba(255,255,255,0.15)',
} as const;

const ICON_WRAP_STYLE = { position: 'relative' } as const;

const ICON_STYLE = {
  position: 'absolute',
  left: 16,
  top: '50%',
  transform: 'translateY(-50%)',
  display: 'flex',
  pointerEvents: 'none',
  color: C.accent,
  filter: 'drop-shadow(0 1px 1px rgba(0,0,0,0.5))',
} as const;

const UserIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M12 12a5 5 0 1 0 0-10 5 5 0 0 0 0 10Zm0 2c-4.42 0-8 2.69-8 6v1a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-1c0-3.31-3.58-6-8-6Z" />
  </svg>
);

const KeyIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M14 2a7 7 0 0 0-6.74 8.92L2 16.18V21a1 1 0 0 0 1 1h4a1 1 0 0 0 1-1v-2h2a1 1 0 0 0 1-1v-2h1.18A7 7 0 1 0 14 2Zm2.5 6.5a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3Z" />
  </svg>
);

const DEPTH = 6;

const LoginPage = () => {
  const navigate = useNavigate();
  const { status, error: err, login, clearError } = useAuthStore();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [pressed, setPressed] = useState(false);
  const [hovered, setHovered] = useState(false);
  const busy = status === 'loading';

  if (status === 'authenticated') return <Navigate to="/home" replace />;

  async function handleSubmit(): Promise<void> {
    const u = username.trim();
    if (!u || !password || busy) return;
    clearError();
    const ok = await login(u, password);
    if (ok) navigate('/home');
  }

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
        boxSizing: 'border-box',
      }}
    >
      {/* Card */}
      <div
        style={{
          width: '100%',
          maxWidth: 380,
          padding: '32px 28px 36px',
          borderRadius: 28,
          background: `linear-gradient(180deg, ${C.panelTop} 0%, ${C.panelMid} 55%, ${C.panelDeep} 100%)`,
          border: `3px solid ${C.panelEdge}`,
          boxShadow: [
            'inset 0 3px 0 rgba(255,255,255,0.4)',
            'inset 0 -3px 0 rgba(0,0,0,0.25)',
            'inset 3px 0 0 rgba(255,255,255,0.2)',
            'inset -3px 0 0 rgba(0,0,0,0.2)',
            '0 12px 28px rgba(0,0,0,0.35)',
          ].join(', '),
        }}
      >
        {/* Title */}
        <h1
          style={{
            margin: '0 0 28px',
            textAlign: 'center',
            fontFamily: FONT,
            fontSize: 34,
            color: '#fff',
            letterSpacing: '0.5px',
            textShadow: `
              -2.5px -2.5px 0 ${C.panelEdge},
              2.5px -2.5px 0 ${C.panelEdge},
              -2.5px 2.5px 0 ${C.panelEdge},
              2.5px 2.5px 0 ${C.panelEdge},
              0 -2.5px 0 ${C.panelEdge},
              0 2.5px 0 ${C.panelEdge},
              -2.5px 0 0 ${C.panelEdge},
              2.5px 0 0 ${C.panelEdge},
              0 5px 5px rgba(0,0,0,0.35)
            `,
          }}
        >
          LOGIN
        </h1>

        {/* Username */}
        <div style={{ ...ICON_WRAP_STYLE, marginBottom: 20 }}>
          <span style={ICON_STYLE}>
            <UserIcon />
          </span>
          <input
            id="username"
            className="register-input"
            type="text"
            placeholder="Username"
            value={username}
            onChange={e => setUsername(e.target.value)}
            style={INPUT_STYLE}
          />
        </div>

        {/* Password */}
        <div style={{ ...ICON_WRAP_STYLE, marginBottom: 32 }}>
          <span style={ICON_STYLE}>
            <KeyIcon />
          </span>
          <input
            id="password"
            className="register-input"
            type="password"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            style={INPUT_STYLE}
          />
        </div>

        {/* Submit button — chunky pill */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            filter: 'drop-shadow(0 8px 10px rgba(30,70,15,0.38))',
          }}
        >
          <div
            style={{
              borderRadius: 26,
              background: `linear-gradient(180deg, ${C.btnBase} 0%, ${C.btnBaseDark} 100%)`,
              padding: `0 0 ${DEPTH}px 0`,
              border: `3px solid ${C.btnOuter}`,
            }}
          >
            <button
              type="button"
              disabled={busy}
              onClick={handleSubmit}
              onMouseDown={() => setPressed(true)}
              onMouseUp={() => setPressed(false)}
              onMouseEnter={() => setHovered(true)}
              onMouseLeave={() => {
                setHovered(false);
                setPressed(false);
              }}
              onTouchStart={() => setPressed(true)}
              onTouchEnd={() => setPressed(false)}
              style={{
                display: 'block',
                margin: -3,
                padding: '13px 56px',
                borderRadius: 28,
                border: `3px solid ${C.btnOuter}`,
                borderBottom: 'none',
                background: `linear-gradient(180deg, ${C.btnFaceTop} 0%, ${C.btnFaceMid} 55%, ${C.btnFaceBot} 100%)`,
                boxShadow: [
                  'inset 0 3px 0 rgba(255,255,255,0.4)',
                  'inset 0 -3px 0 rgba(0,0,0,0.25)',
                  'inset 3px 0 0 rgba(255,255,255,0.2)',
                  'inset -3px 0 0 rgba(0,0,0,0.2)',
                ].join(', '),
                transform: `translateY(${pressed ? DEPTH : hovered ? -1.5 : 0}px)`,
                transition: 'transform 130ms cubic-bezier(0.34, 1.4, 0.64, 1)',
                cursor: busy ? 'default' : 'pointer',
                opacity: busy ? 0.7 : 1,
                outline: 'none',
                color: '#fff',
                fontFamily: FONT,
                fontSize: 24,
                textTransform: 'uppercase',
                textShadow: `
                  -2px -2px 0 ${C.btnOuter},
                  2px -2px 0 ${C.btnOuter},
                  -2px 2px 0 ${C.btnOuter},
                  2px 2px 0 ${C.btnOuter},
                  0 -2px 0 ${C.btnOuter},
                  0 2px 0 ${C.btnOuter},
                  -2px 0 0 ${C.btnOuter},
                  2px 0 0 ${C.btnOuter}
                `,
              }}
            >
              {busy ? 'Please wait…' : 'Log In'}
            </button>
          </div>
        </div>

        {err && (
          <p style={{ margin: '16px 0 0', textAlign: 'center', fontFamily: FONT, fontSize: 14, color: '#FFE08A' }}>
            {err}
          </p>
        )}

        {/* Navigate to Register */}
        <p
          style={{
            margin: '24px 0 0',
            textAlign: 'center',
            fontFamily: FONT,
            fontSize: 15,
            color: '#fff',
            textShadow: '0 1px 2px rgba(0,0,0,0.45)',
          }}
        >
          No account?{' '}
          <Link
            to="/register"
            style={{
              color: C.accent,
              textDecoration: 'none',
              textShadow: `0 1px 0 ${C.panelEdge}, 0 1px 3px rgba(0,0,0,0.4)`,
            }}
          >
            Sign Up
          </Link>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
