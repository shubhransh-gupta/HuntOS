import type { MasterProfile, HuntProfile, Job } from '@/types'
import type { MatchBreakdown, SkillMatch, GapAnalysis } from '@/types/matching'
import { getRecommendation } from '@/types/matching'
import { normalizeText } from '@/utils'

const WEIGHTS = {
  technicalSkills: 30,
  experience: 20,
  responsibilities: 20,
  industry: 10,
  location: 10,
  seniority: 5,
  salary: 5,
}

function hasSkill(profile: MasterProfile, skill: string): boolean {
  const s = normalizeText(skill)
  const all = [...profile.skills, ...profile.technologies].map(normalizeText)
  return all.some((p) => p.includes(s) || s.includes(p))
}

function isExperienceRequirement(skill: string): boolean {
  return /\d+\+?\s*years?/i.test(skill) || /experience/i.test(skill)
}

export function matchSkills(profile: MasterProfile, job: Job): SkillMatch[] {
  const matches: SkillMatch[] = []

  for (const skill of job.requirements.required) {
    if (isExperienceRequirement(skill)) continue
    matches.push({
      skill,
      status: hasSkill(profile, skill) ? 'strong' : 'missing',
      importance: 'required',
    })
  }
  for (const skill of job.requirements.preferred) {
    matches.push({
      skill,
      status: hasSkill(profile, skill) ? 'strong' : 'missing',
      importance: 'preferred',
    })
  }
  for (const skill of job.requirements.niceToHave) {
    matches.push({
      skill,
      status: hasSkill(profile, skill) ? 'strong' : 'missing',
      importance: 'nice-to-have',
    })
  }

  if (matches.length === 0) {
    for (const skill of job.skills) {
      matches.push({
        skill,
        status: hasSkill(profile, skill) ? 'strong' : 'missing',
        importance: 'required',
      })
    }
  }

  return matches
}

function scoreTechnicalSkills(profile: MasterProfile, job: Job): number {
  const matches = matchSkills(profile, job)
  if (matches.length === 0) return WEIGHTS.technicalSkills * 0.5

  let score = 0
  let max = 0
  for (const m of matches) {
    const weight = m.importance === 'required' ? 3 : m.importance === 'preferred' ? 2 : 0.5
    max += weight
    if (m.status === 'strong') score += weight
    else if (m.status === 'partial') score += weight * 0.5
  }
  return max === 0 ? 0 : (score / max) * WEIGHTS.technicalSkills
}

function scoreExperience(profile: MasterProfile, job: Job): number {
  const years = profile.totalExperienceYears
  const min = job.experienceMin ?? 0
  const max = job.experienceMax ?? min + 5

  if (years >= min && years <= max) return WEIGHTS.experience
  if (years >= min - 1 && years <= max + 1) return WEIGHTS.experience * 0.85
  if (years < min) {
    const gap = min - years
    return Math.max(0, WEIGHTS.experience - gap * 4)
  }
  return WEIGHTS.experience * 0.7
}

function scoreResponsibilities(profile: MasterProfile, job: Job): number {
  const profileText = normalizeText(
    [
      ...profile.achievements,
      ...profile.skills,
      ...profile.technologies,
      ...profile.workExperience.map((w) => w.description ?? ''),
    ].join(' '),
  )
  const respText = normalizeText(
    [...job.responsibilities, ...job.requirements.responsibilities, job.description].join(' '),
  )
  const respWords = respText.split(' ').filter((w) => w.length > 4)
  if (respWords.length === 0) return WEIGHTS.responsibilities * 0.5

  const matched = respWords.filter((w) => profileText.includes(w)).length
  return (matched / respWords.length) * WEIGHTS.responsibilities
}

function scoreIndustry(profile: MasterProfile, job: Job): number {
  if (!job.industry) return WEIGHTS.industry * 0.7
  const match = profile.industries.some(
    (i) => normalizeText(i).includes(normalizeText(job.industry!)) ||
      normalizeText(job.industry!).includes(normalizeText(i)),
  )
  return match ? WEIGHTS.industry : WEIGHTS.industry * 0.3
}

function scoreLocation(_profile: MasterProfile, huntProfile: HuntProfile | undefined, job: Job): number {
  if (job.remoteType === 'remote') return WEIGHTS.location
  if (!huntProfile) return WEIGHTS.location * 0.75

  const jobLoc = normalizeText(job.location)
  const locMatch = huntProfile.locations.some((l) => jobLoc.includes(normalizeText(l)))
  const remoteMatch = huntProfile.remoteTypes.includes(job.remoteType as 'remote' | 'hybrid' | 'onsite')
  if (locMatch || remoteMatch) return WEIGHTS.location
  if (job.remoteType === 'hybrid') return WEIGHTS.location * 0.8
  return WEIGHTS.location * 0.2
}

function scoreSeniority(profile: MasterProfile, job: Job): number {
  const title = normalizeText(job.title)
  const isSenior = title.includes('senior') || title.includes('lead') || title.includes('staff')
  const profileSenior = profile.roles.some((r) => /senior|lead|staff/i.test(r))
  if (isSenior && profileSenior) return WEIGHTS.seniority
  if (!isSenior && !profileSenior) return WEIGHTS.seniority
  if (isSenior && !profileSenior) return WEIGHTS.seniority * 0.5
  return WEIGHTS.seniority * 0.8
}

function scoreSalary(huntProfile: HuntProfile | undefined, job: Job): number {
  if (!huntProfile?.salaryMin || !job.salary?.min) return WEIGHTS.salary * 0.7
  return job.salary.min >= huntProfile.salaryMin ? WEIGHTS.salary : WEIGHTS.salary * 0.3
}

export function scoreJob(
  profile: MasterProfile,
  job: Job,
  huntProfile?: HuntProfile,
): { matchScore: number; matchBreakdown: MatchBreakdown; skillMatches: SkillMatch[]; recommendation: ReturnType<typeof getRecommendation> } {
  const skillMatches = matchSkills(profile, job)

  const factors = [
    { name: 'Technical skills', score: scoreTechnicalSkills(profile, job), maxScore: WEIGHTS.technicalSkills },
    { name: 'Experience', score: scoreExperience(profile, job), maxScore: WEIGHTS.experience },
    { name: 'Responsibilities', score: scoreResponsibilities(profile, job), maxScore: WEIGHTS.responsibilities },
    { name: 'Industry', score: scoreIndustry(profile, job), maxScore: WEIGHTS.industry },
    { name: 'Location', score: scoreLocation(profile, huntProfile, job), maxScore: WEIGHTS.location },
    { name: 'Seniority', score: scoreSeniority(profile, job), maxScore: WEIGHTS.seniority },
    { name: 'Salary', score: scoreSalary(huntProfile, job), maxScore: WEIGHTS.salary },
  ]

  const totalScore = factors.reduce((s, f) => s + f.score, 0)
  const maxScore = Object.values(WEIGHTS).reduce((s, w) => s + w, 0)
  const percentage = Math.round((totalScore / maxScore) * 100)

  const strongMatches = skillMatches.filter((m) => m.status === 'strong').map((m) => m.skill)
  const gaps = skillMatches
    .filter((m) => m.status === 'missing' && m.importance !== 'nice-to-have')
    .map((m) => m.skill)
  const concerns = skillMatches
    .filter((m) => m.status === 'missing' && m.importance === 'preferred')
    .map((m) => `Missing preferred skill: ${m.skill}`)

  const matchBreakdown: MatchBreakdown = {
    factors: factors.map((f) => ({
      ...f,
      percentage: Math.round((f.score / f.maxScore) * 100),
    })),
    totalScore,
    maxScore,
    percentage,
    strongMatches,
    gaps,
    concerns,
  }

  return {
    matchScore: percentage,
    matchBreakdown,
    skillMatches,
    recommendation: getRecommendation(percentage),
  }
}

export function scoreAllJobs(
  profile: MasterProfile,
  jobs: Job[],
  huntProfile?: HuntProfile,
): Job[] {
  return jobs.map((job) => {
    const result = scoreJob(profile, job, huntProfile)
    return {
      ...job,
      matchScore: result.matchScore,
      matchBreakdown: result.matchBreakdown,
      skillMatches: result.skillMatches,
      recommendation: result.recommendation.recommendation,
    }
  })
}

export function analyzeGaps(profile: MasterProfile, job: Job): GapAnalysis {
  const skillMatches = matchSkills(profile, job)
  const important = skillMatches.filter((m) => m.importance !== 'nice-to-have')
  const matchedCount = important.filter((m) => m.status === 'strong').length

  const gaps = skillMatches
    .filter((m) => m.status === 'missing')
    .map((m) => ({
      skill: m.skill,
      classification:
        m.importance === 'required'
          ? ('critical' as const)
          : m.importance === 'preferred'
            ? ('learnable' as const)
            : ('low_importance' as const),
    }))

  return { matchedCount, totalImportant: important.length, gaps }
}

export function isRelevantJob(job: Job, huntProfile?: HuntProfile): boolean {
  if (!huntProfile) return true
  if (huntProfile.excludedCompanies.some((c) => job.company.toLowerCase().includes(c.toLowerCase()))) {
    return false
  }
  const title = normalizeText(job.title)
  const roleMatch = huntProfile.roles.some((r) => title.includes(normalizeText(r)) || normalizeText(r).includes(title))
  const keywordMatch = huntProfile.keywords.some((k) =>
    normalizeText(job.description).includes(normalizeText(k)),
  )
  return roleMatch || keywordMatch
}

export function getAverageMatchScore(jobs: Job[]): number {
  const scored = jobs.filter((j) => j.matchScore !== undefined)
  if (scored.length === 0) return 0
  return Math.round(scored.reduce((s, j) => s + (j.matchScore ?? 0), 0) / scored.length)
}
