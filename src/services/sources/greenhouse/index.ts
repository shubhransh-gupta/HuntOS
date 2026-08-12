import type { HuntCriteria, RawJob, JobSourceConfig } from '@/types'
import type { JobSource } from '../job-source'
import { sourceFetchJson, matchesCriteria, passesHardFilters, htmlToText } from '../fetch-client'
import { titleLooksRelevant } from '@/services/matching/matching-engine'
import { DEFAULT_GREENHOUSE_BOARDS } from '../company-boards'

interface GreenhouseJob {
  id: number
  title: string
  absolute_url: string
  company_name?: string
  location: { name: string }
  updated_at: string
  content?: string
  departments?: { name: string }[]
}

interface GreenhouseResponse {
  jobs: GreenhouseJob[]
}

/**
 * A board listing with descriptions is roughly twelve times the size of one
 * without (Stripe: 4.3 MB against 353 KB). Titles are enough to decide what is
 * worth reading, so descriptions are fetched per job and only for the few that
 * survive the title filter.
 */
const DETAIL_BUDGET = 20

function boardLabel(board: string): string {
  return board.charAt(0).toUpperCase() + board.slice(1)
}

function mapGreenhouseJob(job: GreenhouseJob, board: string): RawJob {
  return {
    source: 'greenhouse',
    sourceUrl: job.absolute_url,
    company: job.company_name?.trim() || boardLabel(board),
    title: job.title,
    location: job.location?.name ?? 'Unknown',
    remoteType: /remote/i.test(job.location?.name ?? '') ? 'remote' : 'unknown',
    employmentType: 'full-time',
    postedAt: job.updated_at,
    description: htmlToText(job.content ?? job.title),
    applicationUrl: job.absolute_url,
    discoveryMethod: 'discovered',
    industry: job.departments?.[0]?.name,
  }
}

/** A title-level hit, kept with what is needed to fetch its description. */
interface ScannedJob {
  job: RawJob
  board: string
  id: number
}

async function scanBoard(board: string, criteria: HuntCriteria): Promise<ScannedJob[]> {
  const data = await sourceFetchJson<GreenhouseResponse>(
    `https://boards-api.greenhouse.io/v1/boards/${encodeURIComponent(board)}/jobs`,
  )

  // Only company and freshness limits apply here — the description that the
  // text matcher needs has not been fetched yet, so the title decides.
  return (data.jobs ?? [])
    .filter((job) => titleLooksRelevant(job.title, criteria.roles, criteria.keywords))
    .map((job) => ({ job: mapGreenhouseJob(job, board), board, id: job.id }))
    .filter((scanned) => passesHardFilters(scanned.job, criteria))
}

async function hydrate({ job, board, id }: ScannedJob): Promise<RawJob> {
  try {
    const detail = await sourceFetchJson<GreenhouseJob>(
      `https://boards-api.greenhouse.io/v1/boards/${encodeURIComponent(board)}/jobs/${id}`,
    )
    return { ...job, description: htmlToText(detail.content ?? job.description) }
  } catch {
    // The title-level match still stands; it just goes in without a description.
    return job
  }
}

export const greenhouseSource: JobSource = {
  id: 'greenhouse',
  name: 'Greenhouse ATS',
  capabilities: { search: true, import: true, fetch: true },
  async search(criteria: HuntCriteria, config: JobSourceConfig): Promise<RawJob[]> {
    const configured = [...new Set(config.greenhouseBoards.map((b) => b.trim()).filter(Boolean))]
    const boards = configured.length > 0 ? configured : DEFAULT_GREENHOUSE_BOARDS

    const scans = await Promise.allSettled(boards.map((board) => scanBoard(board, criteria)))
    const found = scans.flatMap((scan) => (scan.status === 'fulfilled' ? scan.value : []))

    const detailed = await Promise.all(found.slice(0, DETAIL_BUDGET).map(hydrate))
    return [...detailed, ...found.slice(DETAIL_BUDGET).map((scanned) => scanned.job)]
  },
}

export async function fetchGreenhouseJobUrl(url: string, criteria: HuntCriteria): Promise<RawJob | null> {
  const match = url.match(/greenhouse\.io\/([^/]+)\/jobs\/(\d+)/)
  if (!match) return null

  const [, board, jobId] = match
  const data = await sourceFetchJson<GreenhouseResponse>(
    `https://boards-api.greenhouse.io/v1/boards/${encodeURIComponent(board)}/jobs?content=true`,
  )
  const job = data.jobs?.find((j) => String(j.id) === jobId)
  if (!job) return null

  const mapped = mapGreenhouseJob(job, board)
  return matchesCriteria(mapped, criteria) ? mapped : mapped
}
