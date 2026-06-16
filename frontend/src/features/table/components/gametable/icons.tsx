// Inline SVG icons — matches the project's existing inline-icon pattern
// (see RegisterPage) rather than pulling in an icon dependency.

interface IconProps {
  size?: number;
  color?: string;
}

/** Stacked gold bar — the "gems" stat icon. */
export function GemBarIcon({ size = 18, color = '#F5C24B' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M3 14.5 7 12l5 2.5L8 17l-5-2.5Z"
        fill={color}
        stroke="rgba(0,0,0,0.35)"
        strokeWidth="0.8"
      />
      <path
        d="M11 11.5 16 9l5 2.5L16 14l-5-2.5Z"
        fill={color}
        stroke="rgba(0,0,0,0.35)"
        strokeWidth="0.8"
      />
      <path
        d="M7 16 11 13.5l5 2.5L12 18.5 7 16Z"
        fill="#FFE08A"
        stroke="rgba(0,0,0,0.35)"
        strokeWidth="0.8"
      />
    </svg>
  );
}

/** People silhouette — the "spectators" stat icon. */
export function UsersIcon({ size = 18, color = '#CFE8F2' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color} aria-hidden="true">
      <path d="M16 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm-8 0a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm0 2c-2.67 0-6 1.34-6 4v2h8v-2c0-1.02.5-1.9 1.28-2.6C10.36 13.16 9.2 13 8 13Zm8 0c-.3 0-.62.02-.95.05A5.06 5.06 0 0 1 17 17v2h5v-2c0-2.66-3.33-4-6-4Z" />
    </svg>
  );
}

/** Circular arrows — the bottom-right sort/refresh button. */
export function RefreshIcon({ size = 22, color = '#ffffff' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M20 11a8 8 0 1 0-1.6 5.6M20 4v5h-5"
        stroke={color}
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
