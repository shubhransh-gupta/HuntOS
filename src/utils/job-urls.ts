import type { Job, JobSourceListing } from '@/types'
import { SOURCE_LABELS } from '@/services/sources/registry'

const AGGREGATOR_HOSTS = ['linkedin.com', 'naukri.com', 'indeed.com', 'glassdoor.com', 'monster.com']

export function normalizeExternalUrl(url: string): string {
  const trimmed = url.trim()
  if (!trimmed) return trimmed
  if (/^https?:\/\//i.test(trimmed)) return trimmed
  return `https://${trimmed}`
}

export function getSourceDisplayName(source: string): string {
  return SOURCE_LABELS[source] ?? source.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

export function isAggregatorUrl(url: string): boolean {
  try {
    const host = new URL(normalizeExternalUrl(url)).hostname.replace(/^www\./, '')
    return AGGREGATOR_HOSTS.some((aggregator) => host.includes(aggregator))
  } catch {
    return false
  }
}

export function getJobListings(job: Job): JobSourceListing[] {
  if (job.foundOn.length > 0) return job.foundOn
  return [
    {
      source: job.source,
      sourceUrl: job.sourceUrl,
      applicationUrl: job.applicationUrl,
      discoveredAt: job.discoveredAt,
      discoveryMethod: job.discoveryMethod,
    },
  ]
}

export function getJobApplicationUrl(job: Job): string | null {
  const candidates = [
    job.primaryApplicationUrl,
    job.applicationUrl,
    ...job.foundOn.map((listing) => listing.applicationUrl),
    job.sourceUrl,
  ].filter((url): url is string => Boolean(url?.trim()))

  const direct = candidates.find((url) => !isAggregatorUrl(url))
  return direct ?? candidates[0] ?? null
}

export function getJobListingUrl(job: Job, listing?: JobSourceListing): string | null {
  const target = listing ?? getJobListings(job)[0]
  return target?.sourceUrl?.trim() ? target.sourceUrl : job.sourceUrl || null
}

export function pickBestApplicationUrl(urls: string[]): string | undefined {
  const valid = urls.filter(Boolean)
  const direct = valid.find((url) => !isAggregatorUrl(url))
  return direct ?? valid[0]
}
