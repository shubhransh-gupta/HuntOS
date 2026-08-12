import type { Job } from '@/types'

const STALE_DAYS = 14

export function enrichJobFreshness(job: Job): Job {
  const now = Date.now()
  const discoveredMs = new Date(job.discoveredAt).getTime()
  const daysSinceDiscovered = (now - discoveredMs) / (1000 * 60 * 60 * 24)

  return {
    ...job,
    isStale: daysSinceDiscovered > STALE_DAYS,
    postingDateUnavailable: !job.postedAt,
  }
}

export function formatPostedDate(job: Job): string {
  if (job.postingDateUnavailable || !job.postedAt) return 'Posting date unavailable'
  const diffMs = Date.now() - new Date(job.postedAt).getTime()
  const hours = Math.floor(diffMs / 3600000)
  if (hours < 1) return 'Posted just now'
  if (hours < 24) return `Posted ${hours}h ago`
  const days = Math.floor(hours / 24)
  return `Posted ${days}d ago`
}

export function formatDiscoveredDate(job: Job): string {
  const diffMs = Date.now() - new Date(job.discoveredAt).getTime()
  const mins = Math.floor(diffMs / 60000)
  if (mins < 60) return `Discovered ${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `Discovered ${hours}h ago`
  const days = Math.floor(hours / 24)
  return `Discovered ${days}d ago`
}
