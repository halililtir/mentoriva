export function TypingDots({ color, label }: { color?: string; label?: string }) {
  return (
    <span
      className="typing-dots inline-flex items-center gap-1"
      style={color ? ({ '--accent': color } as React.CSSProperties) : undefined}
      role="status"
      aria-label={label ?? 'Yazıyor'}
    >
      <span />
      <span />
      <span />
    </span>
  );
}
