import type { JobSource } from './job-source'
import type { HuntCriteria, RawJob } from '@/types'
import sampleJobs from '../../../sample-data/jobs.json'

export const sampleDataSource: JobSource = {
  id: 'sample-data',
  name: 'Sample Data',
  capabilities: { search: true, import: false, fetch: false },
  async search(criteria: HuntCriteria): Promise<RawJob[]> {
    let jobs = sampleJobs as RawJob[]

    if (criteria.excludedCompanies.length) {
      jobs = jobs.filter(
        (j) => !criteria.excludedCompanies.some((c) => j.company.toLowerCase().includes(c.toLowerCase())),
      )
    }

    if (criteria.postedWithinHours) {
      const cutoff = Date.now() - criteria.postedWithinHours * 3600000
      jobs = jobs.filter((j) => {
        const posted = j.postedAt ? new Date(j.postedAt).getTime() : Date.now()
        return posted >= cutoff || !j.postedAt
      })
    }

    return jobs
  },
}

export const manualImportSource: JobSource = {
  id: 'manual-import',
  name: 'Manual Import',
  capabilities: { search: false, import: true, fetch: false },
  async search(): Promise<RawJob[]> {
    return []
  },
}

export function getActiveSources(sourceIds: string[]): JobSource[] {
  const all = [sampleDataSource, manualImportSource]
  return all.filter((s) => sourceIds.includes(s.id))
}

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
