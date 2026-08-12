import type { MasterProfile } from '@/types'

export type ParsedProfile = Omit<MasterProfile, 'id' | 'updatedAt'>

/**
 * Fields onboarding insists on before it will let someone start hunting.
 * Anything the parser cannot read confidently is left blank so the user is
 * asked for it, rather than silently inheriting a guess.
 */
export const REQUIRED_PROFILE_FIELDS = [
  'name',
  'email',
  'headline',
  'location',
  'totalExperienceYears',
  'skills',
] as const

export type RequiredProfileField = (typeof REQUIRED_PROFILE_FIELDS)[number]

export const PROFILE_FIELD_LABELS: Record<RequiredProfileField, string> = {
  name: 'Full name',
  email: 'Email',
  headline: 'Current title',
  location: 'Location',
  totalExperienceYears: 'Years of experience',
  skills: 'Skills',
}

const SECTION_HEADINGS =
  /^(summary|professional summary|career summary|profile|objective|about|about me|contact|contact details|skills|technical skills|core skills|key skills|core competencies|competencies|areas of expertise|expertise|technologies|tools|tools & technologies|experience|work experience|professional experience|work history|career history|employment|employment history|education|projects|certifications|certificates|awards|achievements|accomplishments|publications|languages|interests|hobbies|references|volunteering|activities)\b/i

const SKILLS_HEADING =
  /^(skills|technical skills|core skills|key skills|core competencies|competencies|areas of expertise|expertise|technologies|tools|tools & technologies)\b/i

const EXPERIENCE_HEADING =
  /^(experience|work experience|professional experience|work history|career history|employment|employment history)\b/i

/**
 * Header lines often pack several details together, e.g.
 * "Priya Sharma | priya@example.com | Mumbai, India". Commas are left alone
 * because locations depend on them.
 */
function segmentsOf(line: string): string[] {
  return line
    .split(/\s*[|•·❘]\s*|\s+[–—]\s+/)
    .map((segment) => segment.trim())
    .filter(Boolean)
}

/**
 * Deliberately broad: it spans engineering, design, marketing, finance,
 * healthcare, legal and operations so non-technical resumes parse too.
 */
const ROLE_WORDS =
  /\b(engineer|developer|programmer|architect|designer|manager|director|analyst|scientist|consultant|specialist|administrator|administrator|coordinator|strategist|marketer|copywriter|writer|editor|producer|recruiter|accountant|auditor|controller|attorney|lawyer|paralegal|nurse|physician|doctor|therapist|pharmacist|teacher|professor|lecturer|tutor|researcher|technician|associate|assistant|intern|officer|founder|cofounder|co-founder|president|partner|principal|head|lead|chief|executive|supervisor|superintendent|planner|buyer|merchandiser|salesperson|representative|advisor|adviser|agent|operator|inspector|surveyor|actuary|economist|statistician|devops|sre|qa|tester)\b/i

const NON_NAME_WORDS =
  /\b(resume|curriculum vitae|cv|profile|portfolio|contact|phone|email|address|linkedin|github)\b/i

const MONTHS =
  '(?:jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*'

function cleanLines(text: string): string[] {
  return text
    .split('\n')
    .map((line) => line.replace(/\s+/g, ' ').trim())
    .filter(Boolean)
}

function isSectionHeading(line: string): boolean {
  return SECTION_HEADINGS.test(line.replace(/[:–—-]+$/, '').trim())
}

function extractEmail(text: string): string | undefined {
  return text.match(/[\w.+-]+@[\w-]+\.[\w.-]*[a-z]{2,}/i)?.[0]
}

/** Requires a plausible digit count so dates and IDs aren't mistaken for phones. */
function extractPhone(text: string): string | undefined {
  const candidates = text.match(/\+?[\d][\d\s().-]{7,}\d/g) ?? []
  for (const candidate of candidates) {
    const digits = candidate.replace(/\D/g, '')
    if (digits.length >= 10 && digits.length <= 15) return candidate.trim()
  }
  return undefined
}

function looksLikeName(line: string): boolean {
  if (line.length < 4 || line.length > 50) return false
  if (/[@\d]/.test(line)) return false
  if (/https?:\/\//i.test(line)) return false
  if (isSectionHeading(line) || NON_NAME_WORDS.test(line)) return false
  if (ROLE_WORDS.test(line)) return false

  const words = line.split(' ').filter(Boolean)
  if (words.length < 2 || words.length > 4) return false

  return words.every((word) => /^[A-Z][a-zA-Z'’.-]*$/.test(word) || /^[A-Z'’.-]+$/.test(word))
}

function extractName(lines: string[]): string | undefined {
  const labelled = lines
    .map((line) => line.match(/^(?:name)\s*[:-]\s*(.+)$/i)?.[1]?.trim())
    .find((value): value is string => Boolean(value && looksLikeName(value)))
  if (labelled) return labelled

  return lines.slice(0, 8).flatMap(segmentsOf).find(looksLikeName)
}

function extractHeadline(lines: string[], name: string | undefined): string | undefined {
  const labelled = lines
    .map((line) => line.match(/^(?:title|role|headline|position|designation)\s*[:-]\s*(.+)$/i)?.[1]?.trim())
    .find((value): value is string => Boolean(value))
  if (labelled) return labelled

  return lines
    .slice(0, 12)
    .flatMap(segmentsOf)
    .find((line) => {
      if (line === name) return false
      if (line.length < 3 || line.length > 90) return false
      if (/[@]/.test(line) || /https?:\/\//i.test(line)) return false
      if (isSectionHeading(line)) return false
      // A sentence is a summary, not a title.
      if (/[.!?]\s/.test(line)) return false
      return ROLE_WORDS.test(line)
    })
}

function extractLocation(lines: string[]): string | undefined {
  const labelled = lines
    .map((line) => line.match(/^(?:location|address|based in|city)\s*[:-]\s*(.+)$/i)?.[1]?.trim())
    .find((value): value is string => Boolean(value))
  if (labelled) return labelled

  // "Bengaluru, India" or "Austin, TX" near the top of the document.
  return lines
    .slice(0, 12)
    .flatMap(segmentsOf)
    .find((line) => {
      if (line.length > 60) return false
      if (/[@\d]/.test(line) || /https?:\/\//i.test(line)) return false
      if (isSectionHeading(line) || ROLE_WORDS.test(line)) return false
      return /^[A-Z][A-Za-z .'’-]+,\s*[A-Z][A-Za-z .'’-]+$/.test(line)
    })
}

/** Returns the body of a section, stopping at the next heading. */
function sectionBody(lines: string[], heading: RegExp): string[] {
  const start = lines.findIndex((line) => heading.test(line.replace(/[:–—-]+$/, '').trim()))
  if (start === -1) return []

  const body: string[] = []
  // A heading may carry its content inline: "Skills: Swift, Kotlin".
  const inline = lines[start].replace(heading, '').replace(/^[:–—\s-]+/, '').trim()
  if (inline) body.push(inline)

  for (let i = start + 1; i < lines.length; i++) {
    if (isSectionHeading(lines[i])) break
    body.push(lines[i])
  }
  return body
}

function extractSkills(lines: string[]): string[] {
  const body = sectionBody(lines, SKILLS_HEADING)
  if (body.length === 0) return []

  const seen = new Set<string>()
  const skills: string[] = []

  for (const raw of body.join('\n').split(/[,|•·;\t\n/]+/)) {
    // Drop "Languages:" style prefixes inside a skills block.
    const skill = raw.replace(/^[\s–—*-]+/, '').replace(/^[A-Za-z ]{3,20}:\s*/, '').trim()
    if (skill.length < 2 || skill.length > 40) continue
    if (/\d{4}/.test(skill) || /^\d+$/.test(skill)) continue

    const key = skill.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    skills.push(skill)
    if (skills.length >= 30) break
  }

  return skills
}

function experienceLines(lines: string[]): string[] {
  return sectionBody(lines, EXPERIENCE_HEADING)
}

function extractRoles(lines: string[]): string[] {
  const seen = new Set<string>()
  const roles: string[] = []

  for (const line of experienceLines(lines)) {
    if (line.length > 80 || !ROLE_WORDS.test(line)) continue
    // "Senior Engineer at Acme" / "Senior Engineer — Acme" / "Senior Engineer | Acme"
    const role = line.split(/\s+(?:at|@)\s+|\s*[|–—]\s*|\s{2,}/)[0].replace(/[,.]$/, '').trim()
    if (role.length < 3 || role.length > 60 || !ROLE_WORDS.test(role)) continue
    if (/\d{4}/.test(role)) continue

    const key = role.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    roles.push(role)
    if (roles.length >= 5) break
  }

  return roles
}

function extractCompanies(lines: string[]): string[] {
  const seen = new Set<string>()
  const companies: string[] = []

  for (const line of experienceLines(lines)) {
    const match = line.match(/\s+(?:at|@)\s+([A-Z][\w&.,' -]{1,40})/)
    const company = match?.[1]?.replace(/[,.]$/, '').trim()
    if (!company || company.length < 2) continue

    const key = company.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    companies.push(company)
    if (companies.length >= 5) break
  }

  return companies
}

/** Falls back to the span of dates in the experience section. */
function experienceYearsFromDates(lines: string[]): number | undefined {
  const body = experienceLines(lines).join('\n')
  if (!body) return undefined

  const range = new RegExp(
    `(?:${MONTHS}\\s+)?((?:19|20)\\d{2})\\s*(?:-|–|—|to)\\s*(present|current|now|(?:${MONTHS}\\s+)?(?:19|20)\\d{2})`,
    'gi',
  )

  const currentYear = new Date().getFullYear()
  let earliest = Infinity
  let latest = -Infinity

  for (const match of body.matchAll(range)) {
    const start = Number(match[1])
    const endRaw = match[2]
    const end = /present|current|now/i.test(endRaw)
      ? currentYear
      : Number(endRaw.match(/(?:19|20)\d{2}/)?.[0])

    if (!Number.isFinite(start) || !Number.isFinite(end)) continue
    earliest = Math.min(earliest, start)
    latest = Math.max(latest, end)
  }

  if (!Number.isFinite(earliest) || !Number.isFinite(latest)) return undefined

  const years = latest - earliest
  return years >= 1 && years <= 50 ? years : undefined
}

function extractExperienceYears(text: string, lines: string[]): number | undefined {
  const stated =
    text.match(/(\d{1,2}(?:\.\d)?)\s*\+?\s*(?:years?|yrs?)[^.\n]{0,30}?\bexperience\b/i) ??
    text.match(/\bexperience\b[^.\n]{0,30}?(\d{1,2}(?:\.\d)?)\s*\+?\s*(?:years?|yrs?)/i)

  if (stated) {
    const years = parseFloat(stated[1])
    if (years > 0 && years <= 50) return years
  }

  return experienceYearsFromDates(lines)
}

export function parseProfileLocally(text: string): ParsedProfile {
  const lines = cleanLines(text)

  const linkedIn = text.match(/(?:https?:\/\/)?(?:www\.)?linkedin\.com\/in\/[\w-]+/i)?.[0]
  const github = text.match(/(?:https?:\/\/)?(?:www\.)?github\.com\/[\w-]+/i)?.[0]
  const portfolio = text.match(/https?:\/\/[^\s)]+/i)?.[0]

  const name = extractName(lines)
  const skills = extractSkills(lines)

  return {
    name: name ?? '',
    email: extractEmail(text),
    phone: extractPhone(text),
    location: extractLocation(lines),
    linkedIn,
    github,
    portfolio:
      portfolio && !portfolio.includes('linkedin.com') && !portfolio.includes('github.com')
        ? portfolio
        : undefined,
    headline: extractHeadline(lines, name),
    totalExperienceYears: extractExperienceYears(text, lines) ?? 0,
    companies: extractCompanies(lines),
    roles: extractRoles(lines),
    skills,
    technologies: skills,
    achievements: [],
    education: [],
    certifications: [],
    industries: [],
    projects: [],
    workExperience: [],
  }
}

/** Required fields the parser could not fill, so onboarding can ask for them. */
export function findMissingProfileFields(
  profile: Partial<ParsedProfile>,
): RequiredProfileField[] {
  return REQUIRED_PROFILE_FIELDS.filter((field) => {
    const value = profile[field]
    if (field === 'skills') return !Array.isArray(value) || value.length === 0
    if (field === 'totalExperienceYears') return typeof value !== 'number' || value <= 0
    return typeof value !== 'string' || value.trim().length === 0
  })
}
