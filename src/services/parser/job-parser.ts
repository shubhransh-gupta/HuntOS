import type { RawJob, Job, JobRequirements } from '@/types'
import { normalizeText } from '@/utils'

/**
 * Technologies worth surfacing as a tag. One list feeds both the skill chips
 * and the requirement matching, so a posting is read the same way everywhere.
 * Deliberately concrete — words like "performance" or "agile" appear in most
 * postings and say nothing about the fit.
 */
const KNOWN_SKILLS = [
  'SwiftUI', 'Swift Concurrency', 'Swift', 'UIKit', 'Combine', 'async/await',
  'Objective-C', 'C++', 'Kotlin', 'Java', 'Python', 'TypeScript', 'JavaScript', 'Go', 'Rust',
  'React Native', 'Flutter', 'GraphQL', 'Apollo', 'gRPC', 'Protobuf', 'REST',
  'Core Data', 'Realm', 'SQLite', 'Firebase',
  'AVFoundation', 'Core Animation', 'Core ML', 'Metal', 'ARKit', 'MapKit', 'WidgetKit',
  'XCTest', 'Xcode', 'Instruments', 'SPM', 'CocoaPods', 'Fastlane',
  'GitHub Actions', 'Jenkins', 'Bitrise', 'CI/CD',
  'MVVM', 'VIPER', 'TDD', 'Accessibility', 'A/B testing',
  'Fintech', 'Payments',
]

function escapeForRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

// Lookarounds rather than \b, so names ending in punctuation (C++, CI/CD)
// still match.
const SKILL_PATTERN = new RegExp(
  `(?<![a-z0-9])(${KNOWN_SKILLS.map(escapeForRegex).join('|')})(?![a-z0-9])`,
  'gi',
)

/** Canonical spelling for a skill however the posting happened to write it. */
const CANONICAL_SKILLS = new Map(KNOWN_SKILLS.map((s) => [s.toLowerCase(), s]))

/**
 * A requirement is a bullet or a short sentence. Anything much longer is a
 * whole paragraph that a description failed to break up, and it has no place
 * being matched against a skill or rendered as a chip.
 */
const MAX_REQUIREMENT_LENGTH = 180

function isUsableRequirement(item: string): boolean {
  if (item.length < 2 || item.length > MAX_REQUIREMENT_LENGTH) return false
  // Leftover markup or styling that escaped the text conversion.
  if (/[<>{}]|&[a-z]+;|\b(class|href|style|div|span)=/i.test(item)) return false
  return /[a-z]/i.test(item)
}

export function parseJobRequirements(description: string): JobRequirements {
  const lines = description.split('\n').map((l) => l.trim()).filter(Boolean)
  const required: string[] = []
  const preferred: string[] = []
  const responsibilities: string[] = []
  const niceToHave: string[] = []

  let section: 'required' | 'preferred' | 'responsibilities' | 'nice' | null = null

  for (const line of lines) {
    const lower = line.toLowerCase()
    if (/required|must have|qualifications|requirements/i.test(lower) && line.length < 60) {
      section = 'required'
      continue
    }
    if (/preferred|nice to have|bonus|good to have/i.test(lower) && line.length < 60) {
      section = lower.includes('nice') ? 'nice' : 'preferred'
      continue
    }
    if (/responsibilit/i.test(lower) && line.length < 60) {
      section = 'responsibilities'
      continue
    }

    const item = line.replace(/^[-•*✓✗]\s*/, '').trim()
    if (!isUsableRequirement(item)) continue

    if (section === 'required') required.push(item)
    else if (section === 'preferred') preferred.push(item)
    else if (section === 'responsibilities') responsibilities.push(item)
    else if (section === 'nice') niceToHave.push(item)
    else if (/must|required|minimum/i.test(item)) required.push(item)
    else if (/prefer|ideally|bonus/i.test(item)) preferred.push(item)
  }

  // Named technologies are worth listing on their own, even when the posting
  // never labelled them as requirements.
  for (const skill of extractSkillsFromText(description)) {
    const alreadyListed = [...required, ...preferred].some(
      (entry) => entry.toLowerCase() === skill.toLowerCase(),
    )
    if (!alreadyListed) required.push(skill)
  }

  return { required, preferred, responsibilities, niceToHave }
}

export function extractExperienceRange(description: string): { min?: number; max?: number } {
  const match = description.match(/(\d+)\s*[–\-to]+\s*(\d+)\+?\s*years?/i)
  if (match) return { min: parseInt(match[1]), max: parseInt(match[2]) }
  const plusMatch = description.match(/(\d+)\+\s*years?/i)
  if (plusMatch) return { min: parseInt(plusMatch[1]) }
  return {}
}

export function extractSkillsFromText(text: string): string[] {
  const found = new Set<string>()
  for (const match of text.matchAll(SKILL_PATTERN)) {
    const canonical = CANONICAL_SKILLS.get(match[1].toLowerCase())
    if (canonical) found.add(canonical)
  }
  return [...found]
}

/**
 * Jobs are keyed by where they came from rather than given a fresh random id,
 * so hunting again updates the existing record instead of storing a second
 * copy of the same posting.
 */
function postingKey(url: string): string {
  try {
    const parsed = new URL(url)
    return `${parsed.host}${parsed.pathname}`.replace(/\/+$/, '').toLowerCase()
  } catch {
    return url.trim().toLowerCase()
  }
}

function hash(value: string): string {
  let result = 2166136261
  for (let i = 0; i < value.length; i++) {
    result ^= value.charCodeAt(i)
    result = Math.imul(result, 16777619)
  }
  return (result >>> 0).toString(36)
}

export function stableJobId(raw: RawJob): string {
  const key = postingKey(raw.sourceUrl) || `${normalizeText(raw.company)}|${normalizeText(raw.title)}`
  return `${raw.source}-${hash(key)}`
}

export function normalizeRawJob(raw: RawJob): Job {
  const now = new Date().toISOString()
  const requirements = parseJobRequirements(raw.description)
  const exp = extractExperienceRange(raw.description)
  const skills = raw.skills ?? extractSkillsFromText(raw.description)

  return {
    id: stableJobId(raw),
    source: raw.source,
    sourceUrl: raw.sourceUrl,
    company: raw.company,
    title: raw.title,
    location: raw.location,
    remoteType: raw.remoteType ?? 'unknown',
    employmentType: raw.employmentType ?? 'full-time',
    salary: raw.salary,
    experienceMin: raw.experienceMin ?? exp.min,
    experienceMax: raw.experienceMax ?? exp.max,
    postedAt: raw.postedAt,
    discoveredAt: now,
    description: raw.description,
    responsibilities: requirements.responsibilities,
    requirements,
    skills,
    technologies: raw.technologies ?? skills,
    industry: raw.industry,
    applicationUrl: raw.applicationUrl ?? raw.sourceUrl,
    status: 'new',
    discoveryMethod: raw.discoveryMethod,
    foundOn: [
      {
        source: raw.source,
        sourceUrl: raw.sourceUrl,
        applicationUrl: raw.applicationUrl,
        discoveredAt: now,
        discoveryMethod: raw.discoveryMethod,
      },
    ],
    primaryApplicationUrl: raw.applicationUrl ?? raw.sourceUrl,
    postingDateUnavailable: !raw.postedAt,
  }
}

export function normalizeTitle(title: string): string {
  return normalizeText(title).replace(/\bsr\b/g, 'senior').replace(/\beng\b/g, 'engineer')
}

export function normalizeCompany(company: string): string {
  return normalizeText(company)
}
