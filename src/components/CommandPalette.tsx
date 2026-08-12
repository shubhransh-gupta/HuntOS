import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Command } from 'cmdk'
import { useAppStore } from '@/hooks/useAppStore'
import { cn } from '@/utils'

const commands = [
  { label: 'Search jobs', action: '/hunt', shortcut: '/' },
  { label: 'Run hunt', action: '/hunt?run=true' },
  { label: 'Upload resume', action: '/onboarding' },
  { label: 'Create hunt profile', action: '/hunt-profiles' },
  { label: 'View top matches', action: '/top-matches' },
  { label: 'Generate resume', action: '/resumes/tailored' },
  { label: 'View applications', action: '/applications' },
  { label: 'Export data', action: '/settings' },
  { label: 'Settings', action: '/settings' },
]

export function CommandPalette() {
  const navigate = useNavigate()
  const { commandPaletteOpen, setCommandPaletteOpen } = useAppStore()
  const [search, setSearch] = useState('')

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setCommandPaletteOpen(!commandPaletteOpen)
      }
    }
    document.addEventListener('keydown', down)
    return () => document.removeEventListener('keydown', down)
  }, [commandPaletteOpen, setCommandPaletteOpen])

  if (!commandPaletteOpen) return null

  return (
    <div className="fixed inset-0 z-50 bg-black/50" onClick={() => setCommandPaletteOpen(false)}>
      <div className="mx-auto mt-[20vh] max-w-lg px-4" onClick={(e) => e.stopPropagation()}>
        <Command
          className="overflow-hidden rounded-lg border border-[var(--color-border)] bg-[var(--color-popover)] shadow-2xl"
          shouldFilter
        >
          <Command.Input
            value={search}
            onValueChange={setSearch}
            placeholder="Type a command..."
            className="w-full border-b border-[var(--color-border)] bg-transparent px-4 py-3 text-sm outline-none"
          />
          <Command.List className="max-h-72 overflow-y-auto p-2">
            <Command.Empty className="py-6 text-center text-sm text-[var(--color-muted-foreground)]">
              No results found.
            </Command.Empty>
            {commands.map((cmd) => (
              <Command.Item
                key={cmd.action}
                value={cmd.label}
                onSelect={() => {
                  navigate(cmd.action)
                  setCommandPaletteOpen(false)
                  setSearch('')
                }}
                className={cn(
                  'flex cursor-pointer items-center justify-between rounded-md px-3 py-2 text-sm',
                  'aria-selected:bg-[var(--color-accent)] aria-selected:text-[var(--color-accent-foreground)]',
                )}
              >
                {cmd.label}
                {cmd.shortcut && (
                  <kbd className="rounded border border-[var(--color-border)] px-1.5 text-xs">{cmd.shortcut}</kbd>
                )}
              </Command.Item>
            ))}
          </Command.List>
        </Command>
      </div>
    </div>
  )
}
