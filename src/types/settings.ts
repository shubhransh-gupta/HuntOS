export type AIProviderId = 'openai' | 'anthropic' | 'ollama' | 'openai-compatible'

export interface AISettings {
  provider: AIProviderId
  model: string
  apiKey: string
  baseUrl?: string
}

export interface AppSettings {
  id: string
  onboardingComplete: boolean
  theme: 'light' | 'dark' | 'system'
  ai: AISettings
  notificationsEnabled: boolean
  activeHuntProfileId?: string
}

export interface HuntRun {
  id: string
  huntProfileId: string
  startedAt: string
  completedAt: string
  discovered: number
  duplicatesRemoved: number
  relevant: number
  strongMatches: number
  exceptionalMatches: number
}

export interface ResumeVersion {
  id: string
  name: string
  company: string
  role: string
  version: number
  content: string
  masterResumeVersion: number
  jobId?: string
  atsScore?: number
  createdAt: string
}

export interface Note {
  id: string
  jobId?: string
  applicationId?: string
  content: string
  createdAt: string
  updatedAt: string
}

export interface ResumeSuggestion {
  id: string
  current: string
  suggested: string
  reason: string
  approved?: boolean
}
