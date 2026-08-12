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
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/hunt', icon: Search, label: 'Hunt' },
  { to: '/top-matches', icon: Flame, label: 'Top Matches' },
  { to: '/recent', icon: Clock, label: 'Recent' },
  { to: '/saved', icon: Bookmark, label: 'Saved' },
  { to: '/applications', icon: Kanban, label: 'Applications' },
  { to: '/profile', icon: User, label: 'Profile' },
  { to: '/resumes/master', icon: FileText, label: 'Resumes' },
  { to: '/hunt-profiles', icon: Target, label: 'Hunt Profiles' },
  { to: '/settings', icon: Settings, label: 'Settings' },
]

export function Sidebar() {
  const location = useLocation()
  const { sidebarOpen, setSidebarOpen } = useAppStore()

  return (
    <aside
      className={cn(
        'flex h-screen flex-col border-r border-[var(--color-border)] bg-[var(--color-card)] transition-all',
        sidebarOpen ? 'w-56' : 'w-16',
      )}
    >
      <div className="flex h-14 items-center justify-between border-b border-[var(--color-border)] px-4">
        {sidebarOpen && (
          <div>
            <div className="text-sm font-bold tracking-wider">HUNTOS</div>
            <div className="text-[10px] text-[var(--color-muted-foreground)]">Stop searching. Start hunting.</div>
          </div>
        )}
        <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(!sidebarOpen)} className="shrink-0">
          {sidebarOpen ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </Button>
      </div>
      <nav className="flex-1 space-y-0.5 p-2">
        {navItems.map(({ to, icon: Icon, label }) => {
          const active = location.pathname === to || (to !== '/' && location.pathname.startsWith(to))
          return (
            <Link
              key={to}
              to={to}
              className={cn(
                'flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors',
                active
                  ? 'bg-[var(--color-accent)] font-medium text-[var(--color-accent-foreground)]'
                  : 'text-[var(--color-muted-foreground)] hover:bg-[var(--color-accent)] hover:text-[var(--color-accent-foreground)]',
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
