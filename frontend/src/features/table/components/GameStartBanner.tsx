interface GameStartBannerProps {
  show: boolean;
}

export function GameStartBanner({ show }: GameStartBannerProps) {
  if (!show) return null;
  return (
    <div className="deal-banner" aria-live="assertive" aria-atomic="true">
      <span className="deal-banner__text">GAME START</span>
    </div>
  );
}
