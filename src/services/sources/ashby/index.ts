import type { HuntCriteria, JobSourceConfig, RawJob } from '@/types'
import type { JobSource } from '../job-source'
import { matchesCriteria, sourceFetchJson, stripHtml } from '../fetch-client'
import { DEFAULT_ASHBY_BOARDS } from '../company-boards'

interface AshbyPosting {
  id: string
  title: string
  location?: string
  department?: string
  employmentType?: string
  isRemote?: boolean
  publishedAt?: string
  jobUrl?: string
  applyUrl?: string
  descriptionPlain?: string
  descriptionHtml?: string
}

function mapAshbyJob(posting: AshbyPosting, board: string): RawJob {
  const url = posting.jobUrl ?? posting.applyUrl ?? `https://jobs.ashbyhq.com/${board}/${posting.id}`
  return {
    source: 'ashby',
    sourceUrl: url,
    company: board.charAt(0).toUpperCase() + board.slice(1),
    title: posting.title,
    location: posting.location ?? 'Unknown',
    remoteType: posting.isRemote ? 'remote' : 'onsite',
    employmentType: posting.employmentType?.toLowerCase().includes('part') ? 'part-time' : 'full-time',
    postedAt: posting.publishedAt,
    description: stripHtml(posting.descriptionPlain ?? posting.descriptionHtml ?? posting.title),
    applicationUrl: posting.applyUrl ?? url,
    discoveryMethod: 'discovered',
    industry: posting.department,
  }
}

async function fetchBoard(board: string, criteria: HuntCriteria): Promise<RawJob[]> {
  const data = await sourceFetchJson<{ jobs?: AshbyPosting[] }>(
    `https://api.ashbyhq.com/posting-api/job-board/${encodeURIComponent(board)}?includeCompensation=true`,
  )
  return (data.jobs ?? [])
    .map((posting) => mapAshbyJob(posting, board))
    .filter((job) => matchesCriteria(job, criteria))
}

export const ashbySource: JobSource = {
  id: 'ashby',
  name: 'Ashby ATS',
  capabilities: { search: true, import: true, fetch: true },
  async search(criteria: HuntCriteria, config: JobSourceConfig): Promise<RawJob[]> {
    const configured = [...new Set((config.ashbyBoards ?? []).map((b) => b.trim()).filter(Boolean))]
    const boards = configured.length > 0 ? configured : DEFAULT_ASHBY_BOARDS

    const results = await Promise.allSettled(boards.map((board) => fetchBoard(board, criteria)))
    return results.flatMap((result) => (result.status === 'fulfilled' ? result.value : []))
  },
}
