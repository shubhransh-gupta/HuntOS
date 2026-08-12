import { cn } from '@/utils'

export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('rounded-lg border border-[var(--color-border)]/80 bg-[var(--color-card)]/75 text-[var(--color-card-foreground)] backdrop-blur-md', className)}
      {...props}
    />
  )
}

export function CardHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('flex flex-col space-y-1.5 p-4', className)} {...props} />
}

export function CardTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h3 className={cn('font-semibold leading-none tracking-tight', className)} {...props} />
}

export function CardContent({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('p-4 pt-0', className)} {...props} />
}

export function Badge({ className, variant = 'default', ...props }: React.HTMLAttributes<HTMLSpanElement> & { variant?: 'default' | 'success' | 'warning' | 'destructive' | 'outline' }) {
  const variants = {
    default: 'bg-[var(--color-secondary)] text-[var(--color-secondary-foreground)]',
    success: 'bg-[var(--color-success)]/15 text-[var(--color-success)]',
    warning: 'bg-[var(--color-warning)]/15 text-[var(--color-warning)]',
    destructive: 'bg-[var(--color-destructive)]/15 text-[var(--color-destructive)]',
    outline: 'border border-[var(--color-border)] text-[var(--color-muted-foreground)]',
  }
  return (
    <span className={cn('inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium', variants[variant], className)} {...props} />
  )
}

export function Progress({ value, className }: { value: number; className?: string }) {
  return (
    <div className={cn('h-2 w-full overflow-hidden rounded-full bg-[var(--color-secondary)]', className)}>
      <div className="h-full bg-[var(--color-primary)] transition-all" style={{ width: `${Math.min(100, value)}%` }} />
    </div>
  )
}
