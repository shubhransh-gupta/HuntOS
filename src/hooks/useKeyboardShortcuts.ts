import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppStore } from '@/hooks/useAppStore'

export function useKeyboardShortcuts() {
  const navigate = useNavigate()
  const { setCommandPaletteOpen } = useAppStore()

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) return

      switch (e.key) {
        case '/':
          e.preventDefault()
          navigate('/app/hunt')
          break
        case 'k':
          if (e.metaKey || e.ctrlKey) {
            e.preventDefault()
            setCommandPaletteOpen(true)
          }
          break
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [navigate, setCommandPaletteOpen])
}
