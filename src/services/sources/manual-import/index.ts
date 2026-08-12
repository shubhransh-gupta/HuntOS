import type { HuntCriteria, RawJob, JobSourceConfig } from '@/types'
import type { JobSource } from '../job-source'
import { matchesCriteria } from '../fetch-client'

export function parseManualJobJson(data: unknown): RawJob | null {
  if (!data || typeof data !== 'object') return null
  const d = data as Record<string, unknown>
  if (!d.title || !d.company || !d.description) return null

  return {
    source: 'manual-import',
    sourceUrl: (d.sourceUrl as string) ?? (d.url as string) ?? '',
    company: d.company as string,
    title: d.title as string,
    location: (d.location as string) ?? 'Unknown',
    description: d.description as string,
    applicationUrl: (d.applicationUrl as string) ?? (d.url as string),
    discoveryMethod: 'imported',
    postedAt: d.postedAt as string | undefined,
    remoteType: d.remoteType as RawJob['remoteType'],
    skills: d.skills as string[] | undefined,
  }
}

export const manualImportSource: JobSource = {
  id: 'manual-import',
  name: 'Manual Import',
  capabilities: { search: false, import: true, fetch: false },
  async search(_criteria: HuntCriteria, config: JobSourceConfig): Promise<RawJob[]> {
    return config.browserImportQueue.filter((job) => job.discoveryMethod === 'imported' || job.discoveryMethod === 'user_added')
  },
}

export function parseManualJobUrl(url: string): RawJob | null {
  if (!url.trim()) return null
  return {
    source: 'manual-import',
    sourceUrl: url.trim(),
    company: 'Unknown Company',
    title: 'Imported Job',
    location: 'Unknown',
    description: `Job imported from URL: ${url.trim()}\n\nOpen the link and use browser import or paste the job description manually.`,
    applicationUrl: url.trim(),
    discoveryMethod: 'user_added',
  }
}
