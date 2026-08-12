import type { HuntProfile, HuntRun, Job, SourceSearchResult } from '@/types'
import { generateId } from '@/utils'
import { storage } from '@/services/storage'
import { searchAllSources, flattenSourceResults } from '@/services/sources/registry'
import { normalizeAndDedupe } from '@/services/matching/deduplication'
import { enrichJobFreshness } from '@/services/matching/freshness'
import { scoreAllJobs, isRelevantJob } from '@/services/matching/matching-engine'
import { RECOMMENDATION_THRESHOLDS } from '@/types/matching'
import { notifyExceptionalMatches } from '@/services/notifications/notification-service'

export interface HuntCompleteSummary {
  discovered: number
  duplicatesRemoved: number
  relevant: number
  strongMatches: number
  exceptionalMatches: number
  huntRun: HuntRun
  sourceResults: SourceSearchResult[]
}

/** Descriptions saved before markup was decoded properly. */
function hasUnreadableDescription(job: Job): boolean {
  return /&lt;|&gt;|&quot;|&amp;[a-z]+;/i.test(job.description ?? '')
}

/**
 * Earlier hunts saved everything they scored, and saved it with the markup
 * still escaped. Clear out the untouched leftovers; anything the user saved,
 * applied to or dismissed is theirs to keep.
 */
async function pruneStoredJobs(huntProfile: HuntProfile): Promise<void> {
  const stored = await storage.getJobs()
  const removable = stored
    .filter((job) => job.status === 'new')
    .filter((job) => !isRelevantJob(job, huntProfile) || hasUnreadableDescription(job))
    .map((job) => job.id)
  await storage.deleteJobs(removable)
}

export async function runHunt(huntProfile: HuntProfile): Promise<HuntCompleteSummary> {
  const startedAt = new Date().toISOString()
  const profile = await storage.getProfile()
  if (!profile) throw new Error('Profile required to run hunt')

  const settings = await storage.getSettings()

  const criteria = {
    roles: huntProfile.roles,
    keywords: huntProfile.keywords,
    locations: huntProfile.locations,
    experienceMin: huntProfile.experienceMin,
    experienceMax: huntProfile.experienceMax,
    postedWithinHours: huntProfile.postedWithinHours,
    excludedCompanies: huntProfile.excludedCompanies,
    sources: huntProfile.sources,
    sourceConfig: settings.sourceConfig,
  }

  const sourceResults = await searchAllSources(criteria, settings.sourceConfig)
  const allRaw = flattenSourceResults(sourceResults)

  const { jobs: dedupedJobs, duplicatesRemoved } = normalizeAndDedupe(allRaw)
  const freshJobs = dedupedJobs.map(enrichJobFreshness)
  const scoredJobs = scoreAllJobs(profile, freshJobs, huntProfile)
  // Jobs are keyed by their posting, so two sources listing the same opening
  // collapse to one record. Count what will actually be stored, otherwise the
  // summary promises more than the list can show.
  const relevant = [
    ...new Map(
      scoredJobs.filter((j) => isRelevantJob(j, huntProfile)).map((job) => [job.id, job]),
    ).values(),
  ]
  const strongMatches = relevant.filter((j) => (j.matchScore ?? 0) >= RECOMMENDATION_THRESHOLDS.strong).length
  const exceptionalMatches = relevant.filter((j) => (j.matchScore ?? 0) >= RECOMMENDATION_THRESHOLDS.apply).length

  await storage.saveJobs(relevant)
  await pruneStoredJobs(huntProfile)

  const huntRun: HuntRun = {
    id: generateId(),
    huntProfileId: huntProfile.id,
    startedAt,
    completedAt: new Date().toISOString(),
    discovered: allRaw.length,
    duplicatesRemoved,
    relevant: relevant.length,
    strongMatches,
    exceptionalMatches,
  }

  await storage.saveHuntRun(huntRun)

  const exceptional = relevant.filter((j) => (j.matchScore ?? 0) >= RECOMMENDATION_THRESHOLDS.apply)
  await notifyExceptionalMatches(exceptional.slice(0, 3))

  return {
    discovered: allRaw.length,
    duplicatesRemoved,
    relevant: relevant.length,
    strongMatches,
    exceptionalMatches,
    huntRun,
    sourceResults,
  }
}
