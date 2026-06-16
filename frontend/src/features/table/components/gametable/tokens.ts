// ── Design tokens — cartoon game table (warm wood + blue felt) ────────────────
// Shared by every component in this folder. Inline-style first, matching the
// project's existing token-object approach (see RegisterPage / RoomPage).

export const C = {
  // Table felt
  feltTop: '#2E7D8F', feltMid: '#1F6373', feltDeep: '#15505E',
  feltEdge: '#0E3A45',
  // Wood frame
  woodLight: '#A9612F', woodMid: '#7C4A2A', woodDark: '#4E2E18',
  woodTrim: '#D9A86B',
  // Buttons
  passTop: '#E8584F', passMid: '#D13E37', passDeep: '#A82820', passRim: '#7A1A14',
  beatTop: '#7BD64A', beatMid: '#56B82E', beatDeep: '#3F9220', beatRim: '#2C6614',
  leaveTop: '#E8584F', leaveMid: '#C73830', leaveRim: '#8A1F18',
  // Chrome / text
  gold: '#F5C24B', goldDeep: '#C8860F', coin: '#FFD24A',
  panelDark: 'rgba(20,30,40,0.78)', textWhite: '#ffffff', textStroke: '#0A2A35',
  avatarRing: '#E0B45A',
} as const;

export const FONT = "'Lilita One', 'Fredoka', 'Comic Sans MS', cursive";

/** 8-direction text outline, the project's standard cartoon stroke. */
export const stroke = (color: string, w = 2): string =>
  [
    `${-w}px ${-w}px 0 ${color}`, `${w}px ${-w}px 0 ${color}`,
    `${-w}px ${w}px 0 ${color}`, `${w}px ${w}px 0 ${color}`,
    `0 ${-w}px 0 ${color}`, `0 ${w}px 0 ${color}`,
    `${-w}px 0 0 ${color}`, `${w}px 0 0 ${color}`,
  ].join(', ');

export const isRedSuit = (suit: string): boolean => suit === '♦' || suit === '♥';
