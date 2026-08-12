export interface DetectedSource {
  type: 'greenhouse' | 'lever' | 'json' | 'unknown'
  boardOrCompany?: string
  jobId?: string
  url: string
}

export function detectJobUrl(url: string): DetectedSource {
  try {
    const parsed = new URL(url.trim())

    const greenhouseBoardMatch = parsed.pathname.match(/^\/([^/]+)\/jobs(?:\/(\d+))?/)
    if (parsed.hostname.includes('greenhouse.io') && greenhouseBoardMatch) {
      return {
        type: 'greenhouse',
        boardOrCompany: greenhouseBoardMatch[1],
        jobId: greenhouseBoardMatch[2],
        url,
      }
    }

    const leverMatch = parsed.pathname.match(/^\/([^/]+)(?:\/([^/]+))?/)
    if (parsed.hostname.includes('lever.co') && leverMatch) {
      return {
        type: 'lever',
        boardOrCompany: leverMatch[1],
        jobId: leverMatch[2],
        url,
      }
    }

    if (url.endsWith('.json')) {
      return { type: 'json', url }
    }

    return { type: 'unknown', url }
  } catch {
    return { type: 'unknown', url }
  }
}

export function extractGreenhouseBoardFromCareerUrl(url: string): string | null {
  const detected = detectJobUrl(url)
  if (detected.type === 'greenhouse' && detected.boardOrCompany) return detected.boardOrCompany

  try {
    const parsed = new URL(url)
    if (parsed.hostname.includes('greenhouse.io')) {
      const parts = parsed.pathname.split('/').filter(Boolean)
      if (parts[0] && parts[0] !== 'jobs') return parts[0]
    }
    const parts = parsed.pathname.split('/').filter(Boolean)
    if (parts.length >= 1 && parsed.hostname.includes('careers')) return parts[0]
  } catch {
    return null
  }

  return null
}

export function extractLeverCompanyFromCareerUrl(url: string): string | null {
  const detected = detectJobUrl(url)
  if (detected.type === 'lever' && detected.boardOrCompany) return detected.boardOrCompany
  return null
}
