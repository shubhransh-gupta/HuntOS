import type { Job, RawJob } from '@/types'
import { normalizeRawJob, normalizeTitle, normalizeCompany } from '@/services/parser/job-parser'
import { pickBestApplicationUrl } from '@/utils/job-urls'
import { jaccardSimilarity, generateId } from '@/utils'

function jobKey(job: Job | RawJob): string {
  return `${normalizeCompany(job.company)}|${normalizeTitle(job.title)}|${job.location.toLowerCase()}`
}

export function deduplicateJobs(jobs: Job[]): { jobs: Job[]; duplicatesRemoved: number } {
  const groups = new Map<string, Job[]>()

  for (const job of jobs) {
    const key = jobKey(job)
    const existing = groups.get(key) ?? []
    existing.push(job)
    groups.set(key, existing)
  }

  const canonical: Job[] = []
  let duplicatesRemoved = 0

  for (const group of groups.values()) {
    if (group.length === 1) {
      canonical.push(group[0])
      continue
    }

    const merged = mergeJobGroup(group)
    duplicatesRemoved += group.length - 1
    canonical.push(merged)
  }

  const urlDeduped = deduplicateByUrl(canonical)
  duplicatesRemoved += canonical.length - urlDeduped.jobs.length

  return { jobs: urlDeduped.jobs, duplicatesRemoved }
}

function mergeJobGroup(group: Job[]): Job {
  const sorted = [...group].sort((a, b) => {
    const priority = (s: string) =>
      s.includes('careers') || s.includes('company') ? 0 : s.includes('greenhouse') || s.includes('lever') ? 1 : 2
    return priority(a.source) - priority(b.source)
  })

  const primary = sorted[0]
  const foundOn = group.flatMap((j) => j.foundOn)
  const allSkills = [...new Set(group.flatMap((j) => j.skills))]
  const bestDescription = group.reduce((best, j) =>
    j.description.length > best.length ? j.description : best, primary.description)

  return {
    ...primary,
    id: generateId(),
    foundOn,
    skills: allSkills,
    description: bestDescription,
    applicationUrl: pickBestApplicationUrl(group.map((j) => j.applicationUrl)) ?? primary.applicationUrl,
    primaryApplicationUrl: pickBestApplicationUrl(group.map((j) => j.applicationUrl)) ?? primary.applicationUrl,
    requirements: primary.requirements,
  }
}

function deduplicateByUrl(jobs: Job[]): { jobs: Job[]; duplicatesRemoved: number } {
  const result: Job[] = []
  let duplicatesRemoved = 0

  for (const job of jobs) {
    const similar = result.find((existing) => {
      if (existing.applicationUrl === job.applicationUrl && job.applicationUrl) return true
      if (
        normalizeCompany(existing.company) === normalizeCompany(job.company) &&
        normalizeTitle(existing.title) === normalizeTitle(job.title) &&
        jaccardSimilarity(existing.description, job.description) > 0.6
      ) {
        return true
      }
      return false
    })

    if (similar) {
      similar.foundOn = [...similar.foundOn, ...job.foundOn]
      duplicatesRemoved++
    } else {
      result.push(job)
    }
  }

  return { jobs: result, duplicatesRemoved }
}

export function normalizeAndDedupe(rawJobs: RawJob[]): { jobs: Job[]; duplicatesRemoved: number } {
  const normalized = rawJobs.map(normalizeRawJob)
  return deduplicateJobs(normalized)
}
