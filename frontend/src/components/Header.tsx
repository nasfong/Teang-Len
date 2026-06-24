import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

// ─────────────────────────────────────────────────────────────────────────────
// Shared player header / dashboard bar.
//
// Single source of truth for the on-screen profile: avatar, username and coin
// balance, read straight from the auth store. Reusable on any authenticated
// page. Action slots (logout today; notifications / mail / settings / a profile
// popup later) live in the `HeaderActions` cluster so adding more needs no
// structural change. Gem balance can be added next to the coin bar when shown.
// ─────────────────────────────────────────────────────────────────────────────

const FREDOKA_URL = 'https://fonts.googleapis.com/css2?family=Fredoka:wght@600;700&display=swap';

const FONT = "'Lilita One', 'Fredoka', 'Comic Sans MS', cursive";
const EDGE = '#00376B';

const TITLE_STYLE = {
  margin: 0,
  fontSize: 32,
  fontFamily: FONT,
  fontWeight: 700,
  color: '#fff',
  textShadow: `
    -2.5px -2.5px 0 ${EDGE}, 2.5px -2.5px 0 ${EDGE},
    -2.5px 2.5px 0 ${EDGE}, 2.5px 2.5px 0 ${EDGE},
    0 -2.5px 0 ${EDGE}, 0 2.5px 0 ${EDGE},
    -2.5px 0 0 ${EDGE}, 2.5px 0 0 ${EDGE}
  `,
} as const;

const SUB_TITLE_STYLE = { ...TITLE_STYLE, color: '#FFD27A' } as const;

const BAR_STYLE = {
  width: '260px',
  height: '32px',
  background: 'rgba(0,0,0,0.25)',
  borderRadius: '20px 44px 44px 20px',
  display: 'flex',
  alignItems: 'center',
  paddingLeft: '48px', // clears the avatar that overlaps the bars' left ends
} as const;

const BAR_TEXT_STYLE = {
  fontFamily: FONT,
  fontWeight: 700,
  fontSize: '16px',
  color: '#FFFFFF',
  textShadow: '0px 1px 4px rgba(0,0,0,0.55)',
  letterSpacing: '0.4px',
  lineHeight: 1,
} as const;

/** Action buttons cluster — extend with notifications / mail / settings here. */
function HeaderActions() {
  const navigate = useNavigate();
  const logout = useAuthStore(s => s.logout);
  const [pressed, setPressed] = useState(false);

  function handleLogout(): void {
    logout();
    navigate('/login', { replace: true });
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <button
        type="button"
        onClick={handleLogout}
        onMouseDown={() => setPressed(true)}
        onMouseUp={() => setPressed(false)}
        onMouseLeave={() => setPressed(false)}
        style={{
          padding: '8px 14px',
          borderRadius: 12,
          border: `3px solid #7A1A14`,
          background: 'linear-gradient(180deg, #E8584F 0%, #C73830 100%)',
          boxShadow: pressed ? 'inset 0 2px 4px rgba(0,0,0,0.3)' : '0 4px 0 #7A1A14, 0 5px 8px rgba(0,0,0,0.3)',
          transform: `translateY(${pressed ? 3 : 0}px)`,
          transition: 'transform 100ms, box-shadow 100ms',
          cursor: 'pointer',
          color: '#fff',
          fontFamily: FONT,
          fontSize: 13,
          letterSpacing: 0.5,
          textShadow: '0 1px 2px rgba(0,0,0,0.45)',
          outline: 'none',
        }}
      >
        LOG OUT
      </button>
    </div>
  );
}

export function Header() {
  const username = useAuthStore(s => s.user?.displayName ?? s.user?.username ?? '');
  const coin = useAuthStore(s => s.user?.wallet.coin ?? 0);

  useEffect(() => {
    if (!document.querySelector('link[data-font="fredoka"]')) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = FREDOKA_URL;
      link.setAttribute('data-font', 'fredoka');
      document.head.appendChild(link);
    }
  }, []);

  return (
    <div style={{ width: '100%', height: '120px' }}>
      <div
        style={{
          height: '80%',
          background: '#2B7FC9',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: `3px solid ${EDGE}`,
          boxShadow: 'inset 0 -3px 0 rgba(255,255,255,0.4)',
        }}
      >
        {/* Logo tab — left rounded badge */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '0 40px',
            borderRadius: '0 64px 64px 0',
            background: 'rgba(0, 0, 0, 0.1)',
            position: 'relative',
            zIndex: 2,
          }}
        >
          <h1 style={TITLE_STYLE}>Teang Len</h1>
          <p style={SUB_TITLE_STYLE}>Game</p>
        </div>

        {/* Right side — avatar + stacked bars + actions */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            paddingRight: '28px',
            paddingLeft: '32px',
            height: '120px',
            position: 'relative',
            borderBottom: '3px solid #000',
            background: '#2B7FC9',
            boxShadow: 'inset 0 -3px 0 rgba(0,0,0,0.25)',
            clipPath:
              'polygon(36px 120px, 29px 118px, 24px 114px, 22px 109px, 0 0, 100% 0, 100% 120px)',
            filter:
              'drop-shadow(-3px 0 0 #00376B) drop-shadow(0 4px 0 #00376B) drop-shadow(0 7px 6px rgba(0,0,0,0.35))',
          }}
        >
          {/* Left diagonal border — mirrors the clipPath edge. */}
          <svg
            aria-hidden
            width="48"
            height="120"
            viewBox="0 0 48 120"
            fill="none"
            style={{ position: 'absolute', left: 0, top: 0, pointerEvents: 'none' }}
          >
            <path d="M 0 0 L 22 109 L 24 114 L 29 118 L 36 120" stroke="#000" strokeWidth={6} strokeLinejoin="round" strokeLinecap="round" />
            <path d="M 5 0 L 27 109 L 29 114 L 34 118 L 41 120" stroke="rgba(255,255,255,0.3)" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
          </svg>

          {/* Avatar — overlaps the front of both stacked bars */}
          <div
            style={{
              width: '84px',
              height: '84px',
              borderRadius: '22px',
              background: 'linear-gradient(180deg, #FFE08A 0%, #FFB23E 100%)',
              border: `3px solid ${EDGE}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
              flexShrink: 0,
              position: 'relative',
              zIndex: 3,
              marginRight: '-44px', // sit on top of the bars (overrides the 16px gap)
            }}
          >
            <img
              src="/profile.png"
              alt="profile"
              style={{ width: '100%', height: '100%', objectFit: 'cover', border: '3px solid #FFFFFF', borderRadius: '22px' }}
            />
          </div>

          {/* Stacked bars — username + coin balance */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={BAR_STYLE}>
              <span style={BAR_TEXT_STYLE}>{username}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={BAR_STYLE}>
                <span style={{ ...BAR_TEXT_STYLE, color: '#FFD27A' }}>🪙 {coin.toLocaleString()}</span>
              </div>
            </div>
          </div>

          <HeaderActions />
        </div>
      </div>
    </div>
  );
}
