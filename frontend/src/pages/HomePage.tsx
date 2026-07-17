import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '../components/Header';
import { useAuthStore } from '../store/authStore';


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

const Footer = ({ onPlay }: { onPlay: () => void }) => {
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
              onClick={onPlay}
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
  const navigate = useNavigate();
  const refreshWallet = useAuthStore(s => s.refreshWallet);

  // Pull the authoritative balance on landing so the Header's coins are always
  // current (e.g. after leaving a room/game). The Header itself reads the wallet
  // reactively from the auth store — this only keeps the source fresh.
  useEffect(() => {
    void refreshWallet();
  }, [refreshWallet]);

  // The shared Header sources its own profile data from the auth store.
  return (
    <>
      <Header />
      <Footer onPlay={() => navigate('/rooms')} />
    </>
  );
}
