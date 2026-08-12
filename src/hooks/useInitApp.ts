import { useEffect } from 'react'
import { storage } from '@/services/storage'
import { useAppStore } from '@/hooks/useAppStore'

export function useInitApp() {
  const { setSettings, setProfile, setHuntProfiles } = useAppStore()

  useEffect(() => {
    async function init() {
      const [settings, profile, huntProfiles] = await Promise.all([
        storage.getSettings(),
        storage.getProfile(),
        storage.getHuntProfiles(),
      ])
      setSettings(settings)
      setProfile(profile ?? null)
      setHuntProfiles(huntProfiles)

      const theme = settings.theme
      if (theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        document.documentElement.classList.add('dark')
      } else {
        document.documentElement.classList.remove('dark')
      }
    }
    init()
  }, [setSettings, setProfile, setHuntProfiles])
}
