import type { HuntCriteria, RawJob, JobSourceConfig } from '@/types'
import type { JobSource } from '../job-source'
import { detectJobUrl } from '../url-detector'
import { fetchGreenhouseJobUrl } from '../greenhouse'
import { fetchLeverJobUrl } from '../lever'
import { sourceFetchJson, SourceFetchError, stripHtml, matchesCriteria } from '../fetch-client'

async function fetchPublicUrl(url: string, criteria: HuntCriteria): Promise<RawJob | null> {
  const detected = detectJobUrl(url)

  if (detected.type === 'greenhouse') {
    return fetchGreenhouseJobUrl(url, criteria)
  }

  if (detected.type === 'lever') {
    return fetchLeverJobUrl(url, criteria)
  }

  if (detected.type === 'json') {
    const data = await sourceFetchJson<Record<string, unknown>>(url)
    if (!data.title || !data.company || !data.description) return null
    const job: RawJob = {
      source: 'public-pages',
      sourceUrl: url,
      company: String(data.company),
      title: String(data.title),
      location: String(data.location ?? 'Unknown'),
      description: String(data.description),
      applicationUrl: String(data.applicationUrl ?? url),
      discoveryMethod: 'fetched',
      postedAt: data.postedAt ? String(data.postedAt) : undefined,
    }
    return matchesCriteria(job, criteria) ? job : job
  }

  throw new SourceFetchError(
    'This URL cannot be fetched automatically. Use Import from this source instead.',
    'unavailable',
  )
}

export const publicPagesSource: JobSource = {
  id: 'public-pages',
  name: 'Public Job URLs',
  capabilities: { search: true, import: true, fetch: true },
  async search(criteria: HuntCriteria, config: JobSourceConfig): Promise<RawJob[]> {
    const urls = [...new Set(config.publicJobUrls.map((u) => u.trim()).filter(Boolean))]
    if (urls.length === 0) return []

    const jobs: RawJob[] = []

    for (const url of urls) {
      try {
        const job = await fetchPublicUrl(url, criteria)
        if (job) jobs.push(job)
      } catch {
        // Skip URLs that cannot be fetched legitimately
      }
    }

    return jobs
  },
}

export async function fetchJobFromPublicUrl(url: string): Promise<RawJob | null> {
  try {
    return await fetchPublicUrl(url, {
      roles: [],
      keywords: [],
      locations: [],
      experienceMin: 0,
      experienceMax: 99,
      postedWithinHours: 8760,
      excludedCompanies: [],
      sources: [],
      sourceConfig: {
        greenhouseBoards: [],
        leverCompanies: [],
        ashbyBoards: [],
        publicJobUrls: [],
        companyCareerUrls: [],
        browserImportQueue: [],
      },
    })
  } catch {
    return null
  }
}

export function parseHtmlJobSnapshot(html: string, sourceUrl: string): RawJob | null {
  const title =
    html.match(/<meta property="og:title" content="([^"]+)"/i)?.[1] ??
    html.match(/<title>([^<]+)<\/title>/i)?.[1]
  const description =
    html.match(/<meta property="og:description" content="([^"]+)"/i)?.[1] ??
    html.match(/<meta name="description" content="([^"]+)"/i)?.[1]

  if (!title) return null

  return {
    source: 'public-pages',
    sourceUrl,
    company: 'Unknown Company',
    title: stripHtml(title),
    location: 'Unknown',
    description: stripHtml(description ?? title),
    applicationUrl: sourceUrl,
    discoveryMethod: 'imported',
  }
}
