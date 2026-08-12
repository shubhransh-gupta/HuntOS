import type { JobSource } from './job-source'
import type { HuntCriteria, RawJob, JobSourceConfig, SourceSearchResult } from '@/types'
import { sampleDataSource } from './sample-data-source'
import { greenhouseSource } from './greenhouse'
import { leverSource } from './lever'
import { companyCareersSource } from './company-careers'
import { publicPagesSource } from './public-pages'
import { manualImportSource } from './manual-import'
import { browserImportSource } from './browser-import'
import { ashbySource } from './ashby'
import { jobFeedSources } from './job-feeds'

export const ALL_JOB_SOURCES: JobSource[] = [
  ...jobFeedSources,
  greenhouseSource,
  leverSource,
  ashbySource,
  companyCareersSource,
  publicPagesSource,
  manualImportSource,
  browserImportSource,
  sampleDataSource,
]

export { DEFAULT_HUNT_SOURCES } from './default-sources'

export const SOURCE_LABELS: Record<string, string> = {
  remotive: 'Remotive',
  arbeitnow: 'Arbeitnow',
  jobicy: 'Jobicy',
  remoteok: 'Remote OK',
  'sample-data': 'Sample Data (demo)',
  greenhouse: 'Greenhouse ATS',
  lever: 'Lever ATS',
  ashby: 'Ashby ATS',
  'company-careers': 'Company Careers',
  'public-pages': 'Public Job URLs',
  'manual-import': 'Manual Import',
  'browser-import': 'Browser Import',
  linkedin: 'LinkedIn',
  naukri: 'Naukri',
  indeed: 'Indeed',
  glassdoor: 'Glassdoor',
}

export function getActiveSources(sourceIds: string[]): JobSource[] {
  return ALL_JOB_SOURCES.filter((s) => sourceIds.includes(s.id))
}

export async function searchAllSources(
  criteria: HuntCriteria,
  config: JobSourceConfig,
): Promise<SourceSearchResult[]> {
  const sources = getActiveSources(criteria.sources)

  const results = await Promise.all(
    sources.map(async (source): Promise<SourceSearchResult> => {
      try {
        const jobs = await source.search(criteria, config)
        return {
          sourceId: source.id,
          sourceName: source.name,
          jobs,
          status: jobs.length > 0 ? 'success' : 'skipped',
        }
      } catch (error) {
        return {
          sourceId: source.id,
          sourceName: source.name,
          jobs: [],
          status: 'error',
          error: error instanceof Error ? error.message : 'Source unavailable',
        }
      }
    }),
  )

  return results
}

export function flattenSourceResults(results: SourceSearchResult[]): RawJob[] {
  return results.flatMap((r) => r.jobs)
}
