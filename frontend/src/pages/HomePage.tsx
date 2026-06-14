import { useEffect, useState } from 'react';

const FREDOKA_URL =
  'https://fonts.googleapis.com/css2?family=Fredoka:wght@600;700&display=swap';

const TITLE_STYLE = {
  margin: 0,
  fontSize: 32,
  fontFamily: "'Lilita One', 'Fredoka', 'Comic Sans MS', cursive",
  fontWeight: 700,
  color: '#fff',
  textShadow: `
    -2.5px -2.5px 0 #00376B,
    2.5px -2.5px 0 #00376B,
    -2.5px  2.5px 0 #00376B,
    2.5px  2.5px 0 #00376B,
    0   -2.5px 0 #00376B,
    0    2.5px 0 #00376B,
    -2.5px  0   0 #00376B,
    2.5px  0   0 #00376B
  `,
} as const;

const SUB_TITLE_STYLE = {

  margin: 0,
  fontSize: 32,
  fontFamily: "'Lilita One', 'Fredoka', 'Comic Sans MS', cursive",
  fontWeight: 700,
  color: '#FFD27A',
  textShadow: `
    -2.5px -2.5px 0 #00376B,
    2.5px -2.5px 0 #00376B,
    -2.5px  2.5px 0 #00376B,
    2.5px  2.5px 0 #00376B,
    0   -2.5px 0 #00376B,
    0    2.5px 0 #00376B,
    -2.5px  0   0 #00376B,
    2.5px  0   0 #00376B
  `,
} as const;

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
  fontFamily: "'Lilita One', 'Fredoka', 'Comic Sans MS', cursive",
  fontWeight: 700,
  fontSize: '16px',
  color: '#FFFFFF',
  textShadow: '0px 1px 4px rgba(0,0,0,0.55)',
  letterSpacing: '0.4px',
  lineHeight: 1,
} as const;

const Header = () => {
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
    <div
      style={{
        width: '100%',
        height: '120px',
      }}
    >
      <div
        style={{
          height: "80%",
          background: '#2B7FC9',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: `3px solid ${C.panelEdge}`,
          boxShadow: [
            `inset 0 -3px 0 rgba(255,255,255,0.4)`,      // bottom shadow
          ].join(', '),
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

        {/* Right side — avatar + stacked bars */}
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
            boxShadow: [
              // `inset 0 3px 0 rgba(255,255,255,0.4)`,  // top highlight
              `inset 0 -3px 0 rgba(0,0,0,0.25)`,      // bottom shadow
              // left highlight can't follow the diagonal (inset shadows are
              // axis-aligned) — it's drawn by the SVG highlight path below instead.
              // `inset 3px 0 0 rgba(255,255,255,0.2)`,
              // `inset -3px 0 0 rgba(0,0,0,0.2)`,       // right shadow
            ].join(', '),
            // Rounded bottom-left angle: the single corner vertex is replaced by a
            // short arc of points (a fillet) so the diagonal meets the bottom edge
            // with a smooth radius. Y values use px since the height is fixed (120px).
            clipPath:
              'polygon(36px 120px, 29px 118px, 24px 114px, 22px 109px, 0 0, 100% 0, 100% 120px)',
            // drop-shadow follows the clipped silhouette (incl. the rounded cut),
            // unlike box-shadow which gets clipped away. The -x shadow draws a line
            // along the diagonal left edge; the +y one gives the bottom 3D edge.
            filter:
              'drop-shadow(-3px 0 0 #00376B) drop-shadow(0 4px 0 #00376B) drop-shadow(0 7px 6px rgba(0,0,0,0.35))',
          }}
        >
          {/* Left diagonal border — SVG path follows the same points as the
              clipPath (diagonal + rounded corner). The parent clipPath trims the
              outer half of the stroke, leaving a crisp border on the curved edge. */}
          <svg
            aria-hidden
            width="48"
            height="120"
            viewBox="0 0 48 120"
            fill="none"
            style={{ position: 'absolute', left: 0, top: 0, pointerEvents: 'none' }}
          >
            {/* Dark border on the diagonal/curved edge */}
            <path
              d="M 0 0 L 22 109 L 24 114 L 29 118 L 36 120"
              stroke="#000"
              strokeWidth={6}
              strokeLinejoin="round"
              strokeLinecap="round"
            />
            {/* White highlight — same shape, offset inward so it sits just inside
                the border and follows the same curve (the inset box-shadow can't). */}
            <path
              d="M 5 0 L 27 109 L 29 114 L 34 118 L 41 120"
              stroke="rgba(255,255,255,0.3)"
              strokeWidth={2}
              strokeLinejoin="round"
              strokeLinecap="round"
            />
          </svg>

          {/* Avatar — overlaps the front of both stacked bars */}
          <div
            style={{
              width: '84px',
              height: '84px',
              borderRadius: '22px',
              background: 'linear-gradient(180deg, #FFE08A 0%, #FFB23E 100%)',
              border: `3px solid ${C.panelEdge}`,
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
              style={{
                width: '100%', height: '100%', objectFit: 'cover',
                border: '3px solid #FFFFFF',
                borderRadius: '22px',

              }}
            />
          </div>

          {/* Stacked bars */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {/* Player name bar */}
            <div style={BAR_STYLE}>
              <span style={BAR_TEXT_STYLE}>Player123</span>
            </div>

            {/* Coin bar + coin badge */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={BAR_STYLE}>
                <span style={{ ...BAR_TEXT_STYLE, color: "#FFD27A" }}>12,000</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ── Footer design tokens ──────────────────────────────────────────────────────
const C = {
  // Panel (blue card)
  panelTop: '#6CC3FF',
  panelMid: '#2B7FC9',
  panelDeep: '#1E5FA0',
  panelEdge: '#00376B',
  panelRim: 'rgba(255,255,255,0.55)',
  panelShade: 'rgba(0,0,0,0.28)',
  panelStud: '#BFE6FF',
  panelStudCore: '#7CC4F5',
  gloss: 'rgba(255,255,255,0.6)',

  // Button (Clash-style chunky pill)
  btnOuter: '#00376B', // dark olive outer stroke
  btnFaceTop: '#8FE04A', // bright lime, top of face
  btnFaceMid: '#6FCB33',
  btnFaceBot: '#5BB528', // deeper green, bottom of face
  btnBase: '#3F861C', // 3D slab beneath
  btnBaseDark: '#2F6614', // base lower edge
  textStroke: '#000', // dark green letter outline
} as const;

// Base slab thickness — also how far the face travels down on press.
const DEPTH = 6;

const Footer = () => {
  const [pressed, setPressed] = useState<boolean>(false);
  const [hovered, setHovered] = useState<boolean>(false);

  return (
    <div
      style={{
        position: 'absolute',
        bottom: 0,
        width: '100%',
        display: 'flex',
        justifyContent: 'center',
      }}
    >
      {/* Blue card panel */}
      <div
        style={{
          position: 'relative',
          height: '100px',
          width: '64%',
          display: 'flex',
          borderRadius: '32px 32px 0 0',
          background: `linear-gradient(180deg, ${C.panelTop} 0%, ${C.panelMid} 55%, ${C.panelDeep} 100%)`,
          border: `3px solid ${C.panelEdge}`,
          boxShadow: [
            `inset 0 3px 0 rgba(255,255,255,0.4)`,  // top highlight
            `inset 0 -3px 0 rgba(0,0,0,0.25)`,      // bottom shadow
            `inset 3px 0 0 rgba(255,255,255,0.2)`,  // left highlight
            `inset -3px 0 0 rgba(0,0,0,0.2)`,       // right shadow
          ].join(', '),
        }}
      >

        {/* PLAY button — wrapper → base slab → pressable face */}
        <div
          style={{
            position: 'absolute',
            left: '13%',
            top: '-10px',
            transform: 'translateX(-50%)',
            filter: 'drop-shadow(0 8px 10px rgba(30,70,15,0.38))',
          }}
        >
          {/* Base slab — the 3D thickness */}
          <div
            style={{
              borderRadius: 26,
              background: `linear-gradient(180deg, ${C.btnBase} 0%, ${C.btnBaseDark} 100%)`,
              padding: `0 0 ${DEPTH}px 0`,
              border: `3px solid ${C.btnOuter}`,
              // borderBottom: 'none',
            }}
          >
            {/* Face — the bright lime surface */}
            <button
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
                position: 'relative',
                display: 'block',
                margin: -3,
                padding: '15px 50px',
                borderRadius: 28,
                border: `3px solid ${C.btnOuter}`,
                borderBottom: 'none',
                background: `linear-gradient(180deg, ${C.btnFaceTop} 0%, ${C.btnFaceMid} 55%, ${C.btnFaceBot} 100%)`,
                boxShadow: [
                  `inset 0 3px 0 rgba(255,255,255,0.4)`,  // top highlight
                  `inset 0 -3px 0 rgba(0,0,0,0.25)`,      // bottom shadow
                  `inset 3px 0 0 rgba(255,255,255,0.2)`,  // left highlight
                  `inset -3px 0 0 rgba(0,0,0,0.2)`,       // right shadow
                ].join(', '),
                transform: `translateY(${pressed ? DEPTH : hovered ? -1.5 : 0}px)`,
                transition: 'transform 130ms cubic-bezier(0.34, 1.4, 0.64, 1)',
                cursor: 'pointer',
                outline: 'none',
                overflow: 'hidden',
              }}
            >
              {/* Glossy top-left sheen — soft 140° diagonal light */}
              <span
                aria-hidden
                style={{
                  position: 'absolute',
                  top: 10,
                  left: 6,
                  width: '14px',
                  height: '4px',
                  borderRadius: '100%',
                  background: '#fff',
                  filter: 'blur(0.6px)',
                  transform: 'rotate(140deg)',
                }}
              />

              {/* Label */}
              <span
                style={{
                  color: '#fff',
                  fontFamily: "'Lilita One', 'Fredoka', 'Comic Sans MS', cursive",
                  fontSize: 32,
                  textTransform: 'uppercase',
                  textShadow: `
                    -2px -2px 0 ${C.btnOuter},
                    2px -2px 0 ${C.btnOuter},
                    -2px  2px 0 ${C.btnOuter},
                    2px  2px 0 ${C.btnOuter},
                    0   -2px 0 ${C.btnOuter},
                    0    2px 0 ${C.btnOuter},
                    -2px  0   0 ${C.btnOuter},
                    2px  0   0 ${C.btnOuter},
                    0    4px 4px rgba(20,60,10,0.40)
                  `,
                }}
              >
                PLAY
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function HomePage() {
  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        backgroundImage: "url('/background.png')",
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
    >
      <Header />
      <Footer />
    </div>
  );
}
