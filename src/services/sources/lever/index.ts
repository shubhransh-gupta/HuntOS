import type { HuntCriteria, RawJob, JobSourceConfig } from '@/types'
import type { JobSource } from '../job-source'
import { sourceFetchJson, matchesCriteria } from '../fetch-client'

interface LeverPosting {
  id: string
  text: string
  hostedUrl: string
  createdAt: number
  categories: {
    location?: string
    team?: string
    commitment?: string
  }
  descriptionPlain?: string
  description?: string
}

function mapLeverJob(posting: LeverPosting, company: string): RawJob {
  const description = posting.descriptionPlain ?? posting.description ?? posting.text
  const location = posting.categories.location ?? 'Unknown'
  return {
    source: 'lever',
    sourceUrl: posting.hostedUrl,
    company: company.charAt(0).toUpperCase() + company.slice(1),
    title: posting.text,
    location,
    remoteType: /remote/i.test(location) ? 'remote' : 'unknown',
    employmentType: /full/i.test(posting.categories.commitment ?? '') ? 'full-time' : 'unknown',
    postedAt: new Date(posting.createdAt).toISOString(),
    description,
    applicationUrl: posting.hostedUrl,
    discoveryMethod: 'discovered',
    industry: posting.categories.team,
  }
}

async function fetchCompany(company: string, criteria: HuntCriteria): Promise<RawJob[]> {
  const postings = await sourceFetchJson<LeverPosting[]>(
    `https://api.lever.co/v0/postings/${encodeURIComponent(company)}?mode=json`,
  )

  return postings
    .map((posting) => mapLeverJob(posting, company))
    .filter((job) => matchesCriteria(job, criteria))
}

export const leverSource: JobSource = {
  id: 'lever',
  name: 'Lever ATS',
  capabilities: { search: true, import: true, fetch: true },
  async search(criteria: HuntCriteria, config: JobSourceConfig): Promise<RawJob[]> {
    const companies = [...new Set(config.leverCompanies.map((c) => c.trim()).filter(Boolean))]
    if (companies.length === 0) return []

    const results = await Promise.allSettled(companies.map((company) => fetchCompany(company, criteria)))
    return results.flatMap((result) => (result.status === 'fulfilled' ? result.value : []))
  },
}

export async function fetchLeverJobUrl(url: string, criteria: HuntCriteria): Promise<RawJob | null> {
  const match = url.match(/jobs\.lever\.co\/([^/]+)(?:\/([a-f0-9-]+))?/)
  if (!match) return null

  const [, company, postingId] = match
  const postings = await sourceFetchJson<LeverPosting[]>(
    `https://api.lever.co/v0/postings/${encodeURIComponent(company)}?mode=json`,
  )

  const posting = postingId
    ? postings.find((p) => p.id === postingId)
    : postings.find((p) => p.hostedUrl === url)

  if (!posting) return null
  const mapped = mapLeverJob(posting, company)
  return matchesCriteria(mapped, criteria) ? mapped : mapped
}
