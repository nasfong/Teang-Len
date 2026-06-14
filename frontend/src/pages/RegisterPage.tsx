import { useEffect, useState } from 'react';

/**
 * RegisterPage — casual mobile-card-game registration screen.
 *
 * NOTE ON STYLING: this project does not use Tailwind. To keep the requested
 * Tailwind-style design (glossy gradients, tactile 3D borders, responsive
 * mobile↔desktop layout) self-contained and swappable, all styles live in the
 * scoped CSS block below, injected once via <style data-reg-styles>. Class names
 * map 1:1 to the wireframe in the task; Tailwind equivalents noted in comments.
 *
 * Responsiveness:
 *   - Mobile (< 768px): the blue panel fills the screen as a 9:16 app surface.
 *   - Desktop (≥ 768px): the 9:16 frame is centered as a phone mockup, and extra
 *     floating decorations drift into the wider cozy background.
 */

const FONT_URL =
  'https://fonts.googleapis.com/css2?family=Lilita+One&family=Fredoka:wght@500;600;700&display=swap';

const CSS = `
/* ── Page background — warm cozy ambient ─────────────────────────────────── */
.reg-page {
  position: fixed;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  font-family: 'Fredoka', 'Lilita One', system-ui, sans-serif;
  /* from-amber-100 to-orange-200 + soft radial glow */
  background:
    radial-gradient(120% 90% at 50% 0%, rgba(255,255,255,0.55), transparent 60%),
    radial-gradient(90% 70% at 80% 90%, rgba(255,180,90,0.45), transparent 60%),
    linear-gradient(180deg, #fef3c7 0%, #fed7aa 60%, #fdba74 100%);
}

/* ── Floating decorations (placeholder SVGs — swap with assets later) ─────── */
.reg-deco { position: absolute; pointer-events: none; opacity: 0.9; filter: drop-shadow(0 6px 10px rgba(120,60,10,0.25)); animation: reg-float 6s ease-in-out infinite; }
.reg-deco--card1 { top: 12%;  left: 8%;  width: 64px;  transform: rotate(-14deg); }
.reg-deco--card2 { bottom: 14%; left: 12%; width: 54px; transform: rotate(10deg); animation-delay: -2s; }
.reg-deco--coin1 { top: 22%;  right: 10%; width: 50px; animation-delay: -1s; }
.reg-deco--dice  { bottom: 20%; right: 9%; width: 52px; transform: rotate(8deg); animation-delay: -3s; }
.reg-deco--spark { top: 40%; left: 50%; width: 28px; opacity: 0.8; animation-delay: -1.5s; }
/* Desktop-only drifters live further out in the wider canvas */
.reg-deco--desktop { display: none; }

@keyframes reg-float {
  0%, 100% { translate: 0 0; }
  50%      { translate: 0 -14px; }
}

/* ── 9:16 frame (phone mockup on desktop, fullscreen on mobile) ──────────── */
.reg-frame {
  position: relative;
  z-index: 1;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 18px 16px 0;
  box-sizing: border-box;
}

/* ── Title ───────────────────────────────────────────────────────────────── */
.reg-title {
  margin: 6px 0 14px;
  font-family: 'Lilita One', cursive;
  font-size: clamp(28px, 7vw, 40px);
  color: #fff;
  letter-spacing: 0.5px;
  text-align: center;
  /* dark blue stroke + drop */
  -webkit-text-stroke: 2px #00376B;
  paint-order: stroke fill;
  text-shadow: 0 4px 0 #00376B, 0 6px 8px rgba(0,40,90,0.35);
}

/* ── Main registration panel ─────────────────────────────────────────────── */
.reg-panel {
  position: relative;
  width: 100%;
  max-width: 440px;
  flex: 1;
  margin-bottom: 14px;
  padding: 30px 22px 26px;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: 18px;
  /* glossy sky blue */
  background:
    linear-gradient(180deg, rgba(255,255,255,0.30) 0%, rgba(255,255,255,0) 26%),
    linear-gradient(180deg, #6FD0F5 0%, #51BBE7 45%, #2FA0D8 100%);
  border: 4px solid #00376B;          /* border-4 border-blue-900 */
  border-radius: 32px;                /* rounded-3xl */
  box-shadow:
    inset 0 3px 0 rgba(255,255,255,0.5),
    inset 0 -8px 18px rgba(0,55,107,0.28),
    0 14px 28px rgba(0,40,90,0.35),
    0 26px 50px rgba(0,40,90,0.25);
}

/* Branding badge — absolute upper-left of panel */
.reg-badge {
  position: absolute;
  top: -16px;
  left: 18px;
  display: flex;
  flex-direction: column;
  align-items: center;
  line-height: 0.92;
  padding: 8px 16px;
  background: linear-gradient(180deg, #2B7FC9, #1A5AA0);
  border: 3px solid #00376B;
  border-radius: 14px;
  box-shadow: 0 4px 0 #00376B, 0 7px 10px rgba(0,40,90,0.35);
  transform: rotate(-4deg);
}
.reg-badge b   { font-family: 'Lilita One', cursive; color: #fff;    font-size: 15px; -webkit-text-stroke: 1px #00376B; paint-order: stroke fill; }
.reg-badge span{ font-family: 'Lilita One', cursive; color: #FFD27A; font-size: 12px; letter-spacing: 1px; }

/* ── Input fields ────────────────────────────────────────────────────────── */
.reg-field-label {
  margin: 2px 0 -8px 6px;
  font-weight: 600;
  font-size: 13px;
  color: #06365f;
  letter-spacing: 0.3px;
}

.reg-input {
  display: flex;
  align-items: center;
  gap: 10px;
  height: 54px;
  padding: 0 14px;
  border-radius: 16px;                /* rounded-2xl */
  /* deeper inset blue container */
  background: linear-gradient(180deg, #1D6FB0 0%, #2E86C6 100%);
  border: 3px solid #00376B;
  box-shadow:
    inset 0 4px 8px rgba(0,30,60,0.45),
    inset 0 -2px 0 rgba(255,255,255,0.18);
  transition: box-shadow 0.18s, border-color 0.18s;
}
/* focus glow — soft golden */
.reg-input:focus-within {
  border-color: #FFD27A;
  box-shadow:
    inset 0 4px 8px rgba(0,30,60,0.45),
    0 0 0 3px rgba(255,210,122,0.55),
    0 0 18px rgba(255,210,122,0.5);
}
.reg-input__icon { flex-shrink: 0; width: 24px; height: 24px; color: #CFEBFF; }
.reg-input input {
  flex: 1;
  min-width: 0;
  border: none;
  outline: none;
  background: transparent;
  font-family: 'Fredoka', sans-serif;
  font-weight: 600;
  font-size: 16px;
  color: #fff;
}
.reg-input input::placeholder { color: rgba(255,255,255,0.7); }

/* Show / hide password toggle */
.reg-show {
  flex-shrink: 0;
  border: none;
  cursor: pointer;
  font-family: 'Fredoka', sans-serif;
  font-weight: 700;
  font-size: 12px;
  letter-spacing: 0.4px;
  color: #06365f;
  background: rgba(255,255,255,0.85);
  border-radius: 999px;
  padding: 6px 12px;
  box-shadow: 0 2px 0 rgba(0,40,90,0.25);
  transition: background 0.15s, transform 0.08s;
}
.reg-show:active { transform: translateY(1px); }

/* ── Mascots — overlap bottom-right of the form area ─────────────────────── */
.reg-mascots {
  position: absolute;
  right: -6px;
  bottom: 78px;
  width: 124px;
  pointer-events: none;
  filter: drop-shadow(0 6px 8px rgba(0,40,90,0.3));
}

/* ── REGISTER button — glossy green 3D ───────────────────────────────────── */
.reg-btn {
  position: relative;
  margin-top: auto;
  width: 100%;
  height: 60px;
  border: none;
  border-radius: 18px;
  cursor: pointer;
  font-family: 'Lilita One', cursive;
  font-size: 22px;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: #fff;
  background: linear-gradient(180deg, #4EEE36 0%, #38D421 52%, #32C71B 100%);
  border-bottom: 7px solid #1c7a14;   /* thick dark green tactile edge */
  box-shadow: 0 12px 22px -8px rgba(34,150,20,0.85), inset 0 2px 0 rgba(255,255,255,0.55);
  -webkit-text-stroke: 1.5px #14600f;
  paint-order: stroke fill;
  text-shadow: 0 2px 0 #14600f;
  transition: transform 0.1s, border-width 0.1s, box-shadow 0.1s, filter 0.12s;
}
.reg-btn:hover { filter: brightness(1.05); }
.reg-btn:active {
  transform: translateY(6px);
  border-bottom-width: 0;
  box-shadow: 0 5px 12px -6px rgba(34,150,20,0.8), inset 0 2px 0 rgba(255,255,255,0.5);
}
.reg-btn:focus-visible { outline: 4px solid rgba(255,255,255,0.7); outline-offset: 2px; }
/* gloss sweep */
.reg-btn::before {
  content: '';
  position: absolute;
  top: 6px; left: 10px; right: 10px; height: 38%;
  border-radius: 999px;
  background: linear-gradient(180deg, rgba(255,255,255,0.55), rgba(255,255,255,0));
  pointer-events: none;
}

/* ── Login link ──────────────────────────────────────────────────────────── */
.reg-login {
  font-weight: 600;
  font-size: 14px;
  color: #06365f;
  text-align: center;
  margin: -4px 0 12px;
}
.reg-login button {
  border: none; background: none; cursor: pointer;
  font: inherit; color: #00376B; font-weight: 700; text-decoration: underline;
}

/* ── Bottom navigation bar (game-style tabs) ─────────────────────────────── */
.reg-nav {
  position: relative;
  z-index: 1;
  width: 100%;
  max-width: 472px;
  display: flex;
  gap: 10px;
  padding: 10px 14px calc(10px + env(safe-area-inset-bottom, 0px));
  box-sizing: border-box;
  background: linear-gradient(180deg, #2B7FC9, #1A5AA0);
  border-top: 3px solid #00376B;
  border-radius: 22px 22px 0 0;
  box-shadow: 0 -8px 20px rgba(0,40,90,0.3);
}
.reg-tab {
  flex: 1;
  border: 2px solid #00376B;
  border-radius: 14px;
  cursor: pointer;
  padding: 8px 4px 6px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3px;
  color: #fff;
  background: linear-gradient(180deg, #57A8E6, #2E80C8);
  box-shadow: inset 0 2px 0 rgba(255,255,255,0.4), 0 3px 0 #0c3f74;
  transition: transform 0.08s, filter 0.12s;
}
.reg-tab:hover  { filter: brightness(1.06); }
.reg-tab:active { transform: translateY(2px); box-shadow: inset 0 2px 0 rgba(255,255,255,0.35), 0 1px 0 #0c3f74; }
.reg-tab svg   { width: 26px; height: 26px; }
.reg-tab span  { font-family: 'Lilita One', cursive; font-size: 11px; letter-spacing: 0.5px; }
.reg-tab--shop { background: linear-gradient(180deg, #FFC24C, #F08A12); }

/* ═══ Desktop ≥ 768px — center the 9:16 phone, reveal outer drifters ═══════ */
@media (min-width: 768px) {
  .reg-frame {
    width: min(420px, 92vw);
    height: min(760px, 92vh);
    aspect-ratio: 9 / 16;
    background: linear-gradient(180deg, #bfe6ff 0%, #9fd2f5 100%);
    border: 6px solid #0a2f57;
    border-radius: 42px;
    box-shadow: 0 30px 60px rgba(0,30,70,0.45), inset 0 0 0 3px rgba(255,255,255,0.25);
    padding: 18px 16px 0;
    overflow: hidden;
  }
  .reg-nav {
    width: min(420px, 92vw);
    border-radius: 0 0 34px 34px;
    border-top: 3px solid #00376B;
    margin-top: -2px;
  }
  /* extra decorations drift into the wide background */
  .reg-deco--desktop { display: block; }
  .reg-deco--card1 { top: 16%; left: 16%; }
  .reg-deco--card2 { bottom: 18%; left: 20%; }
  .reg-deco--coin1 { top: 20%; right: 20%; }
  .reg-deco--dice  { bottom: 22%; right: 18%; }
}
`;

// ── Inline SVG placeholders (swap with real assets later) ────────────────────
const IconUser = () => (
  <svg className="reg-input__icon" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
    <path d="M12 12a5 5 0 1 0 0-10 5 5 0 0 0 0 10Zm0 2c-4.42 0-8 2.69-8 6v2h16v-2c0-3.31-3.58-6-8-6Z" />
  </svg>
);
const IconLock = () => (
  <svg className="reg-input__icon" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
    <path d="M6 10V7a6 6 0 1 1 12 0v3h1a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h1Zm2 0h8V7a4 4 0 1 0-8 0v3Zm4 4a2 2 0 0 0-1 3.73V19a1 1 0 0 0 2 0v-1.27A2 2 0 0 0 12 14Z" />
  </svg>
);
const CardSVG = ({ className }: { className: string }) => (
  <svg className={className} viewBox="0 0 40 56" fill="none" aria-hidden>
    <rect x="1.5" y="1.5" width="37" height="53" rx="6" fill="#fff" stroke="#1e3a8a" strokeWidth="3" />
    <path d="M20 14c4 4 7 6 7 10a7 7 0 0 1-14 0c0-4 3-6 7-10Z" fill="#dc2626" />
  </svg>
);
const CoinSVG = ({ className }: { className: string }) => (
  <svg className={className} viewBox="0 0 40 40" fill="none" aria-hidden>
    <circle cx="20" cy="20" r="18" fill="#FFD044" stroke="#A05C08" strokeWidth="3" />
    <circle cx="20" cy="20" r="11" fill="none" stroke="#E0930F" strokeWidth="2" />
    <text x="20" y="26" textAnchor="middle" fontFamily="Lilita One, cursive" fontSize="16" fill="#A05C08">$</text>
  </svg>
);
const DiceSVG = ({ className }: { className: string }) => (
  <svg className={className} viewBox="0 0 40 40" fill="none" aria-hidden>
    <rect x="2" y="2" width="36" height="36" rx="9" fill="#fff" stroke="#1e3a8a" strokeWidth="3" />
    <circle cx="13" cy="13" r="3" fill="#1e3a8a" /><circle cx="27" cy="13" r="3" fill="#1e3a8a" />
    <circle cx="20" cy="20" r="3" fill="#1e3a8a" />
    <circle cx="13" cy="27" r="3" fill="#1e3a8a" /><circle cx="27" cy="27" r="3" fill="#1e3a8a" />
  </svg>
);
const SparkSVG = ({ className }: { className: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="#fff8d6" aria-hidden>
    <path d="M12 0c1 6 5 10 12 12-7 2-11 6-12 12-1-6-5-10-12-12C7 10 11 6 12 0Z" />
  </svg>
);
const MascotsSVG = () => (
  <svg className="reg-mascots" viewBox="0 0 124 110" fill="none" aria-hidden>
    {/* boy */}
    <circle cx="40" cy="40" r="22" fill="#FFD9B0" stroke="#1e3a8a" strokeWidth="3" />
    <path d="M20 38a20 20 0 0 1 40 0Z" fill="#3b82f6" />
    <circle cx="33" cy="40" r="3" fill="#1e3a8a" /><circle cx="47" cy="40" r="3" fill="#1e3a8a" />
    <path d="M33 48q7 6 14 0" stroke="#1e3a8a" strokeWidth="3" strokeLinecap="round" />
    <rect x="24" y="60" width="32" height="38" rx="12" fill="#22c55e" stroke="#15803d" strokeWidth="3" />
    {/* girl */}
    <circle cx="86" cy="46" r="22" fill="#FFE0C2" stroke="#1e3a8a" strokeWidth="3" />
    <path d="M66 44a20 20 0 0 1 40 0Z" fill="#ec4899" />
    <circle cx="79" cy="46" r="3" fill="#1e3a8a" /><circle cx="93" cy="46" r="3" fill="#1e3a8a" />
    <path d="M79 54q7 6 14 0" stroke="#1e3a8a" strokeWidth="3" strokeLinecap="round" />
    <rect x="70" y="66" width="32" height="40" rx="12" fill="#f472b6" stroke="#be185d" strokeWidth="3" />
  </svg>
);

const NavTab = ({
  label,
  variant,
  children,
}: {
  label: string;
  variant?: 'shop';
  children: React.ReactNode;
}) => (
  <button type="button" className={`reg-tab${variant === 'shop' ? ' reg-tab--shop' : ''}`}>
    {children}
    <span>{label}</span>
  </button>
);

export default function RegisterPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);

  // Inject scoped styles + font once.
  useEffect(() => {
    if (!document.querySelector('link[data-font="lilita-fredoka"]')) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = FONT_URL;
      link.setAttribute('data-font', 'lilita-fredoka');
      document.head.appendChild(link);
    }
    if (!document.querySelector('style[data-reg-styles]')) {
      const style = document.createElement('style');
      style.setAttribute('data-reg-styles', '');
      style.textContent = CSS;
      document.head.appendChild(style);
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // UI-only deliverable — wire to your auth flow here.
    // eslint-disable-next-line no-console
    console.log('register', { username, password });
  };

  return (
    <div className="reg-page">
      {/* Floating background decorations (placeholders) */}
      <CardSVG className="reg-deco reg-deco--card1" />
      <CardSVG className="reg-deco reg-deco--card2" />
      <CoinSVG className="reg-deco reg-deco--coin1" />
      <DiceSVG className="reg-deco reg-deco--dice" />
      <SparkSVG className="reg-deco reg-deco--spark" />
      {/* Desktop-only outer drifters */}
      <CoinSVG className="reg-deco reg-deco--desktop reg-deco--coin1" />
      <SparkSVG className="reg-deco reg-deco--desktop reg-deco--spark" />

      <div className="reg-frame">
        <h1 className="reg-title">Create Account</h1>

        <form className="reg-panel" onSubmit={handleSubmit}>
          {/* Branding badge */}
          <div className="reg-badge">
            <b>Teang Len</b>
            <span>GAME</span>
          </div>

          {/* Username */}
          <label className="reg-field-label" htmlFor="reg-username">Username</label>
          <div className="reg-input">
            <IconUser />
            <input
              id="reg-username"
              type="text"
              placeholder="Username"
              autoComplete="username"
              value={username}
              onChange={e => setUsername(e.target.value)}
            />
          </div>

          {/* Password */}
          <label className="reg-field-label" htmlFor="reg-password">Password</label>
          <div className="reg-input">
            <IconLock />
            <input
              id="reg-password"
              type={showPw ? 'text' : 'password'}
              placeholder="Password"
              autoComplete="new-password"
              value={password}
              onChange={e => setPassword(e.target.value)}
            />
            <button
              type="button"
              className="reg-show"
              onClick={() => setShowPw(s => !s)}
              aria-pressed={showPw}
            >
              {showPw ? 'Hide' : 'Show'}
            </button>
          </div>

          {/* Mascots overlapping the lower-right */}
          <MascotsSVG />

          {/* Action */}
          <button type="submit" className="reg-btn">Register</button>
        </form>

        <p className="reg-login">
          Already have an account?{' '}
          <button type="button">Login</button>
        </p>
      </div>

      {/* Bottom navigation mockup */}
      <nav className="reg-nav" aria-label="Game navigation">
        <NavTab label="FRIENDS">
          <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden>
            <path d="M8 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Zm8 0a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM8 13c-3 0-6 1.6-6 4.5V20h12v-2.5C14 14.6 11 13 8 13Zm8 0c-.6 0-1.2.05-1.7.15 1 .9 1.7 2.1 1.7 3.85V20h6v-2.5C22 14.6 19 13 16 13Z" />
          </svg>
        </NavTab>
        <NavTab label="PROFILE">
          <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden>
            <path d="M12 12a5 5 0 1 0 0-10 5 5 0 0 0 0 10Zm0 2c-4.42 0-8 2.69-8 6v2h16v-2c0-3.31-3.58-6-8-6Z" />
          </svg>
        </NavTab>
        <NavTab label="SHOP" variant="shop">
          <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden>
            <path d="M6 6h15l-1.5 9h-12L6 6Zm0 0-.7-3H2m6 18a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3Zm10 0a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3Z" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </NavTab>
      </nav>
    </div>
  );
}
