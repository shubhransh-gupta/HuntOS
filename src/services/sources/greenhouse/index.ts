import type { HuntCriteria, RawJob, JobSourceConfig } from '@/types'
import type { JobSource } from '../job-source'
import { sourceFetchJson, matchesCriteria } from '../fetch-client'

interface GreenhouseJob {
  id: number
  title: string
  absolute_url: string
  location: { name: string }
  updated_at: string
  content?: string
  departments?: { name: string }[]
}

interface GreenhouseResponse {
  jobs: GreenhouseJob[]
}

function mapGreenhouseJob(job: GreenhouseJob, board: string): RawJob {
  const description = job.content ?? job.title
  return {
    source: 'greenhouse',
    sourceUrl: job.absolute_url,
    company: board.charAt(0).toUpperCase() + board.slice(1),
    title: job.title,
    location: job.location?.name ?? 'Unknown',
    remoteType: /remote/i.test(job.location?.name ?? '') ? 'remote' : 'unknown',
    employmentType: 'full-time',
    postedAt: job.updated_at,
    description: stripHtml(description),
    applicationUrl: job.absolute_url,
    discoveryMethod: 'discovered',
    industry: job.departments?.[0]?.name,
  }
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
}

async function fetchBoard(board: string, criteria: HuntCriteria): Promise<RawJob[]> {
  const data = await sourceFetchJson<GreenhouseResponse>(
    `https://boards-api.greenhouse.io/v1/boards/${encodeURIComponent(board)}/jobs?content=true`,
  )

  return (data.jobs ?? [])
    .map((job) => mapGreenhouseJob(job, board))
    .filter((job) => matchesCriteria(job, criteria))
}

export const greenhouseSource: JobSource = {
  id: 'greenhouse',
  name: 'Greenhouse ATS',
  capabilities: { search: true, import: true, fetch: true },
  async search(criteria: HuntCriteria, config: JobSourceConfig): Promise<RawJob[]> {
    const boards = [...new Set(config.greenhouseBoards.map((b) => b.trim()).filter(Boolean))]
    if (boards.length === 0) return []

    const results = await Promise.allSettled(boards.map((board) => fetchBoard(board, criteria)))
    return results.flatMap((result) => (result.status === 'fulfilled' ? result.value : []))
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
