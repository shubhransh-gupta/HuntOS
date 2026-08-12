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
    <div className={clsx('glass rounded-lg', glow && 'glow-accent', className)}>
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
    primary: 'bg-[var(--color-accent)] text-white hover:bg-indigo-500',
    secondary:
      'border border-[var(--color-border)] bg-[var(--color-bg-tertiary)] text-[var(--color-text-primary)] hover:bg-[var(--color-bg-secondary)]',
  }
  const sizes = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
  }

  return (
    <button
      className={clsx(
        'inline-flex items-center justify-center gap-2 rounded-md font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50',
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
