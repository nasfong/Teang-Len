import { C, FONT } from './tokens';

interface AvatarProps {
  name: string;
  size?: number;
  /** Highlight ring + glow when it's this player's turn. */
  active?: boolean;
  /** Dim when the player has finished / skipped. */
  dimmed?: boolean;
}

// Stable per-name pastel so seats are visually distinct without backend data.
const FACE_COLORS = ['#6CC3FF', '#FFB36C', '#9BE36C', '#E36CCB', '#FFD24A', '#6CE3D4'];

function faceColor(name: string): string {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return FACE_COLORS[h % FACE_COLORS.length];
}

/** Round cartoon avatar with a gold ring and the player's initial. */
export function Avatar({ name, size = 52, active = false, dimmed = false }: AvatarProps) {
  const ring = active ? C.gold : C.avatarRing;
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: `radial-gradient(circle at 38% 32%, #ffffff55, transparent 55%), ${faceColor(name)}`,
        border: `${Math.max(2, size * 0.06)}px solid ${ring}`,
        boxShadow: active
          ? `0 0 0 2px ${C.goldDeep}, 0 0 14px ${C.gold}, 0 4px 8px rgba(0,0,0,0.4)`
          : `0 0 0 2px ${C.goldDeep}, 0 4px 8px rgba(0,0,0,0.4)`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: FONT,
        fontSize: size * 0.42,
        color: '#fff',
        textShadow: '0 1px 2px rgba(0,0,0,0.5)',
        opacity: dimmed ? 0.5 : 1,
        flexShrink: 0,
        boxSizing: 'border-box',
      }}
    >
      {name ? name[0].toUpperCase() : '?'}
    </div>
  );
}
