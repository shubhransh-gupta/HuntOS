/**
 * Public job feeds that a browser can actually reach.
 *
 * These APIs need no key and send permissive CORS headers, so hunts return
 * real, current postings without any backend. Their own search parameters are
 * loose — Remotive will happily answer a search for "ios" with a sales role —
 * so results are always filtered locally against the hunt criteria.
 */
import type { HuntCriteria, JobSourceConfig, RawJob } from '@/types'
import type { JobSource } from '../job-source'
import { matchesCriteria, sourceFetchJson, htmlToText } from '../fetch-client'

/** The feeds return whole pages; this caps how much we pull per hunt. */
const PAGE_SIZE = 100

function primaryRole(criteria: HuntCriteria): string {
  return criteria.roles[0]?.trim() ?? ''
}

function asArray(value: unknown): string[] {
  if (Array.isArray(value)) return value.filter((v): v is string => typeof v === 'string')
  if (typeof value === 'string' && value.trim()) return [value]
  return []
}

function relevant(jobs: RawJob[], criteria: HuntCriteria): RawJob[] {
  return jobs.filter((job) => matchesCriteria(job, criteria))
}

// ---------------------------------------------------------------- Remotive

interface RemotiveJob {
  id: number
  url: string
  title: string
  company_name: string
  category?: string
  tags?: string[]
  job_type?: string
  publication_date?: string
  candidate_required_location?: string
  salary?: string
  description?: string
}

function mapRemotive(job: RemotiveJob): RawJob {
  return {
    source: 'remotive',
    sourceUrl: job.url,
    company: job.company_name,
    title: job.title,
    location: job.candidate_required_location || 'Remote',
    remoteType: 'remote',
    employmentType: job.job_type === 'contract' ? 'contract' : 'full-time',
    postedAt: job.publication_date,
    description: htmlToText(job.description ?? job.title),
    applicationUrl: job.url,
    discoveryMethod: 'discovered',
    skills: asArray(job.tags),
    industry: job.category,
  }
}

export const remotiveSource: JobSource = {
  id: 'remotive',
  name: 'Remotive',
  capabilities: { search: true, import: false, fetch: false },
  async search(criteria: HuntCriteria): Promise<RawJob[]> {
    const role = primaryRole(criteria)
    const query = role ? `&search=${encodeURIComponent(role)}` : ''
    const data = await sourceFetchJson<{ jobs?: RemotiveJob[] }>(
      `https://remotive.com/api/remote-jobs?limit=${PAGE_SIZE}${query}`,
    )
    return relevant((data.jobs ?? []).map(mapRemotive), criteria)
  },
}

// --------------------------------------------------------------- Arbeitnow

interface ArbeitnowJob {
  slug: string
  company_name: string
  title: string
  description?: string
  remote?: boolean
  url: string
  tags?: string[]
  job_types?: string[]
  location?: string
  created_at?: number
}

function mapArbeitnow(job: ArbeitnowJob): RawJob {
  return {
    source: 'arbeitnow',
    sourceUrl: job.url,
    company: job.company_name,
    title: job.title,
    location: job.location || 'Unknown',
    remoteType: job.remote ? 'remote' : 'onsite',
    employmentType: job.job_types?.[0]?.toLowerCase().includes('part') ? 'part-time' : 'full-time',
    // Arbeitnow timestamps are unix seconds.
    postedAt: job.created_at ? new Date(job.created_at * 1000).toISOString() : undefined,
    description: htmlToText(job.description ?? job.title),
    applicationUrl: job.url,
    discoveryMethod: 'discovered',
    skills: asArray(job.tags),
  }
}

export const arbeitnowSource: JobSource = {
  id: 'arbeitnow',
  name: 'Arbeitnow',
  capabilities: { search: true, import: false, fetch: false },
  async search(criteria: HuntCriteria): Promise<RawJob[]> {
    const data = await sourceFetchJson<{ data?: ArbeitnowJob[] }>(
      'https://www.arbeitnow.com/api/job-board-api',
    )
    return relevant((data.data ?? []).map(mapArbeitnow), criteria)
  },
}

// ------------------------------------------------------------------ Jobicy

interface JobicyJob {
  id: number
  url: string
  jobTitle: string
  companyName: string
  jobIndustry?: string[]
  jobType?: string[]
  jobGeo?: string
  jobLevel?: string
  jobExcerpt?: string
  jobDescription?: string
  pubDate?: string
}

function mapJobicy(job: JobicyJob): RawJob {
  return {
    source: 'jobicy',
    sourceUrl: job.url,
    company: job.companyName,
    title: job.jobTitle,
    location: job.jobGeo || 'Remote',
    remoteType: 'remote',
    employmentType: job.jobType?.[0]?.toLowerCase().includes('part') ? 'part-time' : 'full-time',
    postedAt: job.pubDate,
    description: htmlToText(job.jobDescription ?? job.jobExcerpt ?? job.jobTitle),
    applicationUrl: job.url,
    discoveryMethod: 'discovered',
    industry: job.jobIndustry?.[0],
  }
}

export const jobicySource: JobSource = {
  id: 'jobicy',
  name: 'Jobicy',
  capabilities: { search: true, import: false, fetch: false },
  async search(criteria: HuntCriteria): Promise<RawJob[]> {
    const data = await sourceFetchJson<{ jobs?: JobicyJob[] }>(
      `https://jobicy.com/api/v2/remote-jobs?count=${PAGE_SIZE}`,
    )
    return relevant((data.jobs ?? []).map(mapJobicy), criteria)
  },
}

// ---------------------------------------------------------------- Remote OK

interface RemoteOkJob {
  slug?: string
  id?: string
  date?: string
  company?: string
  position?: string
  tags?: string[]
  description?: string
  location?: string
  url?: string
  apply_url?: string
  salary_min?: number
  salary_max?: number
  /** Present only on the leading terms-of-service entry. */
  legal?: string
}

function mapRemoteOk(job: RemoteOkJob): RawJob | null {
  const url = job.url ?? job.apply_url
  if (!job.position || !job.company || !url) return null
  return {
    source: 'remoteok',
    sourceUrl: url,
    company: job.company,
    title: job.position,
    location: job.location || 'Remote',
    remoteType: 'remote',
    employmentType: 'full-time',
    postedAt: job.date,
    description: htmlToText(job.description ?? job.position),
    applicationUrl: job.apply_url ?? url,
    discoveryMethod: 'discovered',
    skills: asArray(job.tags),
    salary:
      job.salary_min || job.salary_max
        ? { min: job.salary_min, max: job.salary_max, currency: 'USD' }
        : undefined,
  }
}

export const remoteOkSource: JobSource = {
  id: 'remoteok',
  name: 'Remote OK',
  capabilities: { search: true, import: false, fetch: false },
  async search(criteria: HuntCriteria, _config: JobSourceConfig): Promise<RawJob[]> {
    const entries = await sourceFetchJson<RemoteOkJob[]>('https://remoteok.com/api')
    const jobs = (Array.isArray(entries) ? entries : [])
      // The first entry is Remote OK's API terms, not a posting.
      .filter((entry) => !entry.legal)
      .map(mapRemoteOk)
      .filter((job): job is RawJob => job !== null)
    return relevant(jobs, criteria)
  },
}

export const jobFeedSources = [remotiveSource, arbeitnowSource, jobicySource, remoteOkSource]
