import type { HuntProfile, HuntRun, SourceSearchResult } from '@/types'
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

/**
 * Earlier hunts saved everything they scored, so off-target jobs can already
 * be sitting in storage. Clear out the untouched ones; anything the user saved,
 * applied to or dismissed is theirs to keep.
 */
async function discardStaleOffTargetJobs(huntProfile: HuntProfile): Promise<void> {
  const stored = await storage.getJobs()
  const staleIds = stored
    .filter((job) => job.status === 'new' && !isRelevantJob(job, huntProfile))
    .map((job) => job.id)
  await storage.deleteJobs(staleIds)
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
  const relevant = scoredJobs.filter((j) => isRelevantJob(j, huntProfile))
  const strongMatches = relevant.filter((j) => (j.matchScore ?? 0) >= RECOMMENDATION_THRESHOLDS.strong).length
  const exceptionalMatches = relevant.filter((j) => (j.matchScore ?? 0) >= RECOMMENDATION_THRESHOLDS.apply).length

  await storage.saveJobs(relevant)
  await discardStaleOffTargetJobs(huntProfile)

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
