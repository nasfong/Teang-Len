export function PlaceholderSeat() {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
      opacity: 0.15, pointerEvents: 'none',
    }}>
      <div style={{
        width: 36, height: 36, borderRadius: '50%',
        border: '2px dashed rgba(255,255,255,0.4)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 14,
      }}>—</div>
      <div style={{ fontSize: 11, letterSpacing: 0.5 }}>Empty</div>
    </div>
  );
}
