import { cn } from '@/utils'

export function HuntHeroMark({ className, size = 'lg' }: { className?: string; size?: 'md' | 'lg' | 'xl' }) {
  const sizes = {
    md: 'h-24 w-24',
    lg: 'h-32 w-32',
    xl: 'h-40 w-40',
  }

  return (
    <div className={cn('hero-mark relative mx-auto', sizes[size], className)}>
      <div className="hero-mark-shine absolute inset-0 rounded-full" aria-hidden />
      <div className="hero-mark-ring hero-mark-ring-a absolute inset-0 rounded-full" aria-hidden />
      <div className="hero-mark-ring hero-mark-ring-b absolute inset-2 rounded-full" aria-hidden />
      <div className="hero-mark-core absolute inset-4 flex items-center justify-center rounded-full">
        <svg viewBox="0 0 64 64" className="h-14 w-14" aria-hidden>
          <defs>
            <linearGradient id="hunt-hero-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#c4b5fd" />
              <stop offset="45%" stopColor="#8b5cf6" />
              <stop offset="100%" stopColor="#6366f1" />
            </linearGradient>
            <radialGradient id="hunt-hero-shine" cx="35%" cy="30%" r="65%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
              <stop offset="35%" stopColor="#ddd6fe" stopOpacity="0.45" />
              <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
            </radialGradient>
          </defs>
          <circle cx="32" cy="32" r="28" fill="url(#hunt-hero-gradient)" />
          <circle cx="32" cy="32" r="28" fill="url(#hunt-hero-shine)" />
          <circle cx="32" cy="32" r="10" fill="none" stroke="rgba(255,255,255,0.92)" strokeWidth="2.5" />
          <circle cx="32" cy="32" r="3.5" fill="#ffffff" />
          <path
            d="M32 8v8M32 48v8M8 32h8M48 32h8"
            stroke="rgba(255,255,255,0.85)"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
        </svg>
      </div>
    </div>
  )
}

export function OnboardingHero({
  title,
  subtitle,
  kicker,
}: {
  title: string
  subtitle?: string
  kicker?: string
}) {
  return (
    <div className="mb-10 text-center">
      <HuntHeroMark size="xl" className="mb-8" />
      {kicker && (
        <p className="font-display mb-3 text-sm tracking-[0.2em] text-violet-300/80 uppercase">
          {kicker}
        </p>
      )}
      <h1 className="font-display text-4xl font-semibold tracking-tight text-white md:text-5xl">
        {title}
      </h1>
      {subtitle && (
        <p className="font-display mt-3 text-lg text-violet-200/80 italic md:text-xl">{subtitle}</p>
      )}
    </div>
  )
}
