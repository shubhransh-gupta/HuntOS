import { Link, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  Search,
  Flame,
  Clock,
  Bookmark,
  Kanban,
  FileText,
  Target,
  Settings,
  ChevronLeft,
  ChevronRight,
  User,
} from 'lucide-react'
import { cn } from '@/utils'
import { useAppStore } from '@/hooks/useAppStore'
import { Button } from '@/components/ui/button'

const navItems = [
  { to: '/app', icon: LayoutDashboard, label: 'Dashboard', exact: true },
  { to: '/app/hunt', icon: Search, label: 'Hunt' },
  { to: '/app/top-matches', icon: Flame, label: 'Top Matches' },
  { to: '/app/recent', icon: Clock, label: 'Recent' },
  { to: '/app/saved', icon: Bookmark, label: 'Saved' },
  { to: '/app/applications', icon: Kanban, label: 'Applications' },
  { to: '/app/profile', icon: User, label: 'Profile' },
  { to: '/app/resumes/master', icon: FileText, label: 'Resumes' },
  { to: '/app/hunt-profiles', icon: Target, label: 'Hunt Profiles' },
  { to: '/app/settings', icon: Settings, label: 'Settings' },
]

export function Sidebar() {
  const location = useLocation()
  const { sidebarOpen, setSidebarOpen } = useAppStore()

  return (
    <aside
      className={cn(
        'glass flex h-screen flex-col border-r transition-all',
        sidebarOpen ? 'w-56' : 'w-16',
      )}
    >
      <div className="flex h-14 items-center justify-between border-b border-[var(--color-border)] px-4">
        {sidebarOpen && (
          <Link to="/" className="hover:opacity-80">
            <div className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text font-display text-sm font-bold tracking-tight text-transparent">
              HUNTOS
            </div>
            <div className="text-[10px] tracking-wide text-[var(--color-muted-foreground)]">Stop searching. Start hunting.</div>
          </Link>
        )}
        <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(!sidebarOpen)} className="shrink-0">
          {sidebarOpen ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </Button>
      </div>
      <nav className="flex-1 space-y-0.5 p-2">
        {navItems.map(({ to, icon: Icon, label, exact }) => {
          const active = exact
            ? location.pathname === to
            : location.pathname === to || location.pathname.startsWith(`${to}/`)
          return (
            <Link
              key={to}
              to={to}
              className={cn(
                'flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors',
                active
                  ? 'bg-[var(--color-accent)] font-medium text-white'
                  : 'text-[var(--color-muted-foreground)] hover:bg-[var(--color-bg-tertiary)] hover:text-white',
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {sidebarOpen && <span>{label}</span>}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
