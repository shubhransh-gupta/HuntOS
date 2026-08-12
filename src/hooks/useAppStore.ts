import { create } from 'zustand'
import type { AppSettings, HuntProfile, MasterProfile } from '@/types'

interface AppState {
  settings: AppSettings | null
  profile: MasterProfile | null
  huntProfiles: HuntProfile[]
  isHunting: boolean
  sidebarOpen: boolean
  commandPaletteOpen: boolean
  setSettings: (s: AppSettings) => void
  setProfile: (p: MasterProfile | null) => void
  setHuntProfiles: (p: HuntProfile[]) => void
  setIsHunting: (v: boolean) => void
  setSidebarOpen: (v: boolean) => void
  setCommandPaletteOpen: (v: boolean) => void
}

export const useAppStore = create<AppState>((set) => ({
  settings: null,
  profile: null,
  huntProfiles: [],
  isHunting: false,
  sidebarOpen: true,
  commandPaletteOpen: false,
  setSettings: (settings) => set({ settings }),
  setProfile: (profile) => set({ profile }),
  setHuntProfiles: (huntProfiles) => set({ huntProfiles }),
  setIsHunting: (isHunting) => set({ isHunting }),
  setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
  setCommandPaletteOpen: (commandPaletteOpen) => set({ commandPaletteOpen }),
}))
