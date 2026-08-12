import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { AmbientBackground } from './AmbientBackground'
import { CommandPalette } from '@/components/CommandPalette'
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts'

export function AppShell() {
  useKeyboardShortcuts()

  return (
    <div className="relative flex h-screen overflow-hidden">
      <AmbientBackground />
      <div className="app-surface flex min-w-0 flex-1">
        <Sidebar />
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
        <CommandPalette />
      </div>
    </div>
  )
}
