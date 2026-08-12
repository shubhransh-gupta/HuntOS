import { describe, it, expect } from 'vitest'
import { scoreJob, matchSkills } from '@/services/matching/matching-engine'
import { deduplicateJobs } from '@/services/matching/deduplication'
import { enrichJobFreshness, formatPostedDate } from '@/services/matching/freshness'
import { getRecommendation } from '@/types/matching'
import { analyzeGaps } from '@/services/matching/matching-engine'
import { validateResumeClaims } from '@/services/matching/ats-analyzer'
import { normalizeRawJob } from '@/services/parser/job-parser'
import type { MasterProfile, Job, RawJob } from '@/types'
import { generateId } from '@/utils'

const profile: MasterProfile = {
  id: '1',
  name: 'Test User',
  totalExperienceYears: 5,
  companies: ['Co'],
  roles: ['Senior iOS Engineer'],
  skills: ['Swift', 'SwiftUI', 'UIKit'],
  technologies: ['Swift', 'SwiftUI', 'UIKit', 'Combine'],
  achievements: ['Built payment flows'],
  education: [],
  certifications: [],
  industries: ['Fintech'],
  projects: [],
  workExperience: [],
  updatedAt: new Date().toISOString(),
}

function makeJob(overrides: Partial<Job> = {}): Job {
  return {
    id: generateId(),
    source: 'test',
    sourceUrl: 'https://example.com',
    company: 'TestCo',
    title: 'Senior iOS Engineer',
    location: 'Bangalore',
    remoteType: 'hybrid',
    employmentType: 'full-time',
    experienceMin: 5,
    experienceMax: 7,
    discoveredAt: new Date().toISOString(),
    description: 'Swift SwiftUI UIKit 5-7 years Fintech',
    responsibilities: ['Build iOS apps'],
    requirements: {
      required: ['Swift', 'SwiftUI', 'UIKit', '5+ years'],
      preferred: ['Combine'],
      responsibilities: ['Build iOS apps'],
      niceToHave: ['Kotlin'],
    },
    skills: ['Swift', 'SwiftUI', 'UIKit'],
    technologies: ['Swift', 'SwiftUI', 'UIKit'],
    industry: 'Fintech',
    applicationUrl: 'https://example.com/apply',
    status: 'new',
    discoveryMethod: 'discovered',
    foundOn: [],
    ...overrides,
  }
}

describe('matching engine', () => {
  it('scores strong match for Swift/SwiftUI/5yr profile', () => {
    const huntProfile = {
      id: 'h1',
      name: 'Test',
      emoji: '🔥',
      roles: ['iOS Engineer'],
      experienceMin: 4,
      experienceMax: 7,
      locations: ['Bangalore'],
      remoteTypes: ['hybrid' as const],
      jobTypes: ['full-time' as const],
      postedWithinHours: 24,
      excludedCompanies: [],
      keywords: ['Swift'],
      sources: ['sample-data'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    const result = scoreJob(profile, makeJob(), huntProfile)
    expect(result.matchScore).toBeGreaterThanOrEqual(80)
    expect(result.recommendation.recommendation).toMatch(/apply|strong/)
  })

  it('detects required skill gap for Kotlin', () => {
    const job = makeJob({
      requirements: {
        required: ['Kotlin'],
        preferred: [],
        responsibilities: [],
        niceToHave: [],
      },
      skills: ['Kotlin'],
    })
    const skills = matchSkills(profile, job)
    expect(skills.find((s) => s.skill === 'Kotlin')?.status).toBe('missing')
    expect(skills.find((s) => s.skill === 'Kotlin')?.importance).toBe('required')
  })

  it('treats abbreviated senior titles as senior-level', () => {
    function seniority(title: string) {
      return scoreJob(profile, makeJob({ title })).matchBreakdown.factors.find(
        (f) => f.name === 'Seniority',
      )?.percentage
    }

    expect(seniority('Senior iOS Engineer')).toBe(100)
    expect(seniority('Sr. iOS Engineer')).toBe(100)
    expect(seniority('Principal iOS Engineer')).toBe(100)
    expect(seniority('Staff iOS Engineer')).toBe(100)
  })

  it('does not treat junior titles as senior-level', () => {
    const result = scoreJob(profile, makeJob({ title: 'iOS Engineer' }))
    expect(
      result.matchBreakdown.factors.find((f) => f.name === 'Seniority')?.percentage,
    ).toBeLessThan(100)
  })

  it('matches experience 5 years vs 3-5 range', () => {
    const job = makeJob({ experienceMin: 3, experienceMax: 5 })
    const result = scoreJob(profile, job)
    expect(result.matchBreakdown.factors.find((f) => f.name === 'Experience')?.percentage).toBeGreaterThanOrEqual(85)
  })
})

describe('deduplication', () => {
  it('merges same job from 3 sources into 1 canonical', () => {
    const raw: RawJob[] = [
      { source: 'company-careers', sourceUrl: 'a', company: 'Razorpay', title: 'Senior iOS Engineer', location: 'Bangalore', description: 'Swift UIKit SwiftUI payments fintech 5 years combine graphql', discoveryMethod: 'discovered' },
      { source: 'linkedin', sourceUrl: 'b', company: 'Razorpay', title: 'Senior iOS Engineer', location: 'Bangalore', description: 'Swift UIKit SwiftUI payments fintech 5 years combine graphql', discoveryMethod: 'discovered' },
      { source: 'naukri', sourceUrl: 'c', company: 'Razorpay', title: 'Sr iOS Engineer', location: 'Bengaluru', description: 'Swift UIKit SwiftUI payments fintech 5 years combine graphql', discoveryMethod: 'discovered' },
    ]
    const jobs = raw.map(normalizeRawJob)
    const { jobs: deduped, duplicatesRemoved } = deduplicateJobs(jobs)
    expect(deduped.length).toBe(1)
    expect(duplicatesRemoved).toBeGreaterThanOrEqual(2)
    expect(deduped[0].foundOn.length).toBeGreaterThanOrEqual(2)
  })
})

describe('freshness', () => {
  it('marks posting date unavailable', () => {
    const job = enrichJobFreshness(makeJob({ postedAt: undefined, postingDateUnavailable: true }))
    expect(formatPostedDate(job)).toBe('Posting date unavailable')
  })

  it('detects stale jobs', () => {
    const old = new Date(Date.now() - 20 * 86400000).toISOString()
    const job = enrichJobFreshness(makeJob({ discoveredAt: old }))
    expect(job.isStale).toBe(true)
  })
})

describe('recommendation', () => {
  it('maps score thresholds correctly', () => {
    expect(getRecommendation(94).recommendation).toBe('apply')
    expect(getRecommendation(85).recommendation).toBe('strong')
    expect(getRecommendation(70).recommendation).toBe('maybe')
    expect(getRecommendation(50).recommendation).toBe('low')
  })
})

describe('gap analyzer', () => {
  it('classifies critical vs learnable gaps', () => {
    const job = makeJob({
      requirements: {
        required: ['GraphQL'],
        preferred: ['Apollo'],
        responsibilities: [],
        niceToHave: ['Kotlin'],
      },
    })
    const gaps = analyzeGaps(profile, job)
    expect(gaps.gaps.find((g) => g.skill === 'GraphQL')?.classification).toBe('critical')
    expect(gaps.gaps.find((g) => g.skill === 'Apollo')?.classification).toBe('learnable')
    expect(gaps.gaps.find((g) => g.skill === 'Kotlin')?.classification).toBe('low_importance')
  })
})

describe('resume validation', () => {
  it('flags claims not in master resume', () => {
    const master = 'Worked at Razorpay on Swift payment apps.'
    const tailored = 'Worked at FakeCorp on blockchain apps.'
    const violations = validateResumeClaims(master, tailored)
    expect(violations.length).toBeGreaterThan(0)
  })
})
