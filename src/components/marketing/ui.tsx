import clsx from 'clsx'
import type { ReactNode } from 'react'

export function GlassPanel({
  children,
  className,
  glow,
}: {
  children: ReactNode
  className?: string
  glow?: boolean
}) {
  return (
    <div className={clsx('glass rounded-2xl', glow && 'glow-accent', className)}>
      {children}
    </div>
  )
}

export function PrivacyBadge({ label = '100% Local-First' }: { label?: string }) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-green-500/20 bg-green-500/10 px-3 py-1.5 text-xs text-green-400">
      <span>🔒</span>
      <span className="font-medium">{label}</span>
    </div>
  )
}

export function SiteCredit({ className }: { className?: string }) {
  return (
    <span className={clsx('leading-relaxed', className)}>
      Created with <span aria-label="love">❤️</span> by{' '}
      <a
        href="https://github.com/shubhransh-gupta"
        target="_blank"
        rel="noreferrer"
        className="font-medium whitespace-nowrap text-[var(--color-text-secondary)] transition-colors hover:text-white"
      >
        Shubhransh Gupta
      </a>
    </span>
  )
}

export function MarketingButton({
  children,
  variant = 'primary',
  size = 'md',
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary'
  size?: 'sm' | 'md' | 'lg'
}) {
  const variants = {
    primary:
      'bg-gradient-to-r from-violet-500 to-indigo-500 text-white shadow-lg shadow-violet-500/20 hover:from-violet-400 hover:to-indigo-400',
    secondary:
      'border border-[var(--color-border)] bg-[var(--color-bg-tertiary)] text-[var(--color-text-primary)] hover:border-[var(--color-border-hover)] hover:bg-[var(--color-bg-secondary)]',
  }
  const sizes = {
    sm: 'px-4 py-1.5 text-xs',
    md: 'px-5 py-2 text-sm',
    lg: 'px-7 py-3 text-base',
  }

  return (
    <button
      className={clsx(
        'inline-flex items-center justify-center gap-2 rounded-full font-medium transition-all disabled:cursor-not-allowed disabled:opacity-50',
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    >
      {children}
    </button>
  )
}
