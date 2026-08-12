import { cn } from '@/utils'

const SQUARES = Array.from({ length: 18 }, (_, i) => ({
  id: i,
  size: 28 + (i % 4) * 16,
  left: `${(i * 17 + 7) % 95}%`,
  top: `${(i * 23 + 11) % 90}%`,
  delay: `${(i * 1.7) % 12}s`,
  duration: `${14 + (i % 5) * 4}s`,
  opacity: 0.08 + (i % 3) * 0.06,
}))

export function AmbientBackground({ className }: { className?: string }) {
  return (
    <div className={cn('ambient-root', className)} aria-hidden>
      <div className="ambient-glow ambient-glow-a" />
      <div className="ambient-glow ambient-glow-b" />
      <div className="ambient-grid" />
      {SQUARES.map((sq) => (
        <span
          key={sq.id}
          className="ambient-square"
          style={{
            width: sq.size,
            height: sq.size,
            left: sq.left,
            top: sq.top,
            animationDelay: sq.delay,
            animationDuration: sq.duration,
            opacity: sq.opacity,
          }}
        />
      ))}
    </div>
  )
}
