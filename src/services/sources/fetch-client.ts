const REQUEST_TIMEOUT_MS = 12000
const MIN_REQUEST_GAP_MS = 300

let lastRequestAt = 0

async function throttle() {
  const elapsed = Date.now() - lastRequestAt
  if (elapsed < MIN_REQUEST_GAP_MS) {
    await new Promise((r) => setTimeout(r, MIN_REQUEST_GAP_MS - elapsed))
  }
  lastRequestAt = Date.now()
}

export type SourceFetchErrorCode =
  | 'network'
  | 'cors'
  | 'rate_limit'
  | 'not_found'
  | 'invalid'
  | 'unavailable'

export class SourceFetchError extends Error {
  readonly code: SourceFetchErrorCode

  constructor(message: string, code: SourceFetchErrorCode = 'network') {
    super(message)
    this.name = 'SourceFetchError'
    this.code = code
  }
}

export async function sourceFetch(url: string, init?: RequestInit): Promise<Response> {
  await throttle()

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)

  try {
    const response = await fetch(url, {
      ...init,
      signal: controller.signal,
      headers: {
        Accept: 'application/json, text/html;q=0.9',
        ...(init?.headers ?? {}),
      },
    })

    if (response.status === 429) {
      throw new SourceFetchError('Rate limited by source. Try again later.', 'rate_limit')
    }

    if (response.status === 404) {
      throw new SourceFetchError('Resource not found.', 'not_found')
    }

    return response
  } catch (error) {
    if (error instanceof SourceFetchError) throw error
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new SourceFetchError('Request timed out.', 'network')
    }
    throw new SourceFetchError(
      'Unable to reach source. It may block browser requests (CORS) — use Import instead.',
      'cors',
    )
  } finally {
    clearTimeout(timeout)
  }
}

export async function sourceFetchJson<T>(url: string): Promise<T> {
  const response = await sourceFetch(url)
  if (!response.ok) {
    throw new SourceFetchError(`Request failed (${response.status}).`, 'network')
  }
  return response.json() as Promise<T>
}

// Descriptions come back as markup, sometimes escaped. Re-exported here so
// every adapter converts them the same way.
export { htmlToText } from '@/utils/html-text'

/**
 * Company and freshness limits, which apply however a job was matched. Kept
 * separate so sources that do their own smarter title matching can still
 * enforce them without the blunt substring check below.
 */
export function passesHardFilters(
  job: { company: string; postedAt?: string },
  criteria: import('@/types').HuntCriteria,
): boolean {
  if (criteria.excludedCompanies.some((c) => job.company.toLowerCase().includes(c.toLowerCase()))) {
    return false
  }

  if (criteria.postedWithinHours && job.postedAt) {
    const cutoff = Date.now() - criteria.postedWithinHours * 3600000
    if (new Date(job.postedAt).getTime() < cutoff) return false
  }

  return true
}

export function matchesCriteria(
  job: { title: string; company: string; description: string; postedAt?: string },
  criteria: import('@/types').HuntCriteria,
): boolean {
  if (!passesHardFilters(job, criteria)) return false

  const haystack = `${job.title} ${job.description}`.toLowerCase()
  const roleMatch = criteria.roles.some((r) => haystack.includes(r.toLowerCase()))
  const keywordMatch = criteria.keywords.some((k) => haystack.includes(k.toLowerCase()))
  return roleMatch || keywordMatch || criteria.roles.length === 0
}
