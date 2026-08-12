import type { JobSourceConfig } from './source-config'

export interface HuntProfile {
  id: string
  name: string
  emoji: string
  roles: string[]
  experienceMin: number
  experienceMax: number
  locations: string[]
  remoteTypes: ('remote' | 'hybrid' | 'onsite')[]
  salaryMin?: number
  salaryCurrency?: string
  jobTypes: ('full-time' | 'part-time' | 'contract')[]
  postedWithinHours: number
  excludedCompanies: string[]
  keywords: string[]
  sources: string[]
  isDefault?: boolean
  createdAt: string
  updatedAt: string
}

export interface HuntCriteria {
  roles: string[]
  keywords: string[]
  locations: string[]
  experienceMin: number
  experienceMax: number
  postedWithinHours: number
  excludedCompanies: string[]
  sources: string[]
  sourceConfig: JobSourceConfig
}
