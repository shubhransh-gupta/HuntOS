import type { RawJob, Job, JobRequirements } from '@/types'
import { generateId, normalizeText } from '@/utils'

const SKILL_PATTERNS = [
  /\b(swift|swiftui|uikit|combine|kotlin|react native|graphql|typescript|python|java|objective-c|c\+\+)\b/gi,
  /\b(\d+\+?\s*years?\s*(?:of\s*)?(?:experience)?)\b/gi,
]

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
    if (!item || item.length < 2) continue

    if (section === 'required') required.push(item)
    else if (section === 'preferred') preferred.push(item)
    else if (section === 'responsibilities') responsibilities.push(item)
    else if (section === 'nice') niceToHave.push(item)
    else if (/must|required|minimum/i.test(item)) required.push(item)
    else if (/prefer|ideally|bonus/i.test(item)) preferred.push(item)
  }

  for (const pattern of SKILL_PATTERNS) {
    const matches = description.match(pattern) ?? []
    for (const m of matches) {
      const skill = m.trim()
      if (!required.some((r) => r.toLowerCase().includes(skill.toLowerCase()))) {
        if (/years/i.test(skill)) continue
        if (!required.includes(skill) && !preferred.includes(skill)) {
          required.push(skill)
        }
      }
    }
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
  const known = [
    'Swift', 'SwiftUI', 'UIKit', 'Combine', 'async/await', 'Objective-C', 'C++',
    'Kotlin', 'React Native', 'GraphQL', 'Apollo', 'Core Data', 'SPM', 'CI/CD',
    'GitHub Actions', 'Xcode', 'Java', 'Python', 'TypeScript', 'Fintech', 'Payments',
  ]
  const lower = text.toLowerCase()
  return known.filter((s) => lower.includes(s.toLowerCase()))
}

export function normalizeRawJob(raw: RawJob): Job {
  const now = new Date().toISOString()
  const requirements = parseJobRequirements(raw.description)
  const exp = extractExperienceRange(raw.description)
  const skills = raw.skills ?? extractSkillsFromText(raw.description)

  return {
    id: generateId(),
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
