import { describe, expect, it } from 'vitest'
import { isRelevantJob } from '@/services/matching/matching-engine'
import type { HuntProfile, Job } from '@/types'

function iosHunt(overrides: Partial<HuntProfile> = {}): HuntProfile {
  return {
    id: 'h1',
    name: 'iOS hunt',
    emoji: '📱',
    roles: ['iOS Developer', 'Senior iOS Engineer'],
    keywords: ['Swift', 'SwiftUI'],
    locations: ['Bangalore'],
    remoteTypes: ['remote', 'hybrid'],
    experienceMin: 4,
    experienceMax: 8,
    postedWithinHours: 168,
    excludedCompanies: [],
    sources: [],
    isDefault: true,
    createdAt: new Date().toISOString(),
    ...overrides,
  } as unknown as HuntProfile
}

function job(title: string, description = '', company = 'TestCo'): Job {
  return { title, description, company, status: 'new' } as unknown as Job
}

describe('isRelevantJob', () => {
  it('keeps jobs whose title matches a hunted role', () => {
    expect(isRelevantJob(job('Senior iOS Engineer'), iosHunt())).toBe(true)
    expect(isRelevantJob(job('iOS Developer'), iosHunt())).toBe(true)
  })

  it('matches a role even when the title words differ around it', () => {
    expect(isRelevantJob(job('Staff iOS Engineer, Payments'), iosHunt())).toBe(true)
  })

  it('rejects a different specialisation that merely mentions the target', () => {
    const android = job(
      'Senior Android Engineer',
      'You will work closely with our iOS and Swift teams on shared features.',
    )
    expect(isRelevantJob(android, iosHunt())).toBe(false)
  })

  it('rejects unrelated disciplines outright', () => {
    expect(isRelevantJob(job('Marketing Manager'), iosHunt())).toBe(false)
    expect(isRelevantJob(job('Data Scientist'), iosHunt())).toBe(false)
    expect(isRelevantJob(job('Senior Backend Engineer'), iosHunt())).toBe(false)
  })

  it('keeps cross-platform mobile roles that include the target', () => {
    expect(isRelevantJob(job('Mobile Engineer (iOS / Android)'), iosHunt())).toBe(true)
  })

  it('allows a neutral title when the description names the field', () => {
    expect(isRelevantJob(job('Software Engineer', 'Swift and SwiftUI codebase'), iosHunt())).toBe(true)
  })

  it('rejects a neutral title with nothing in common', () => {
    expect(isRelevantJob(job('Software Engineer', 'Java and Spring Boot services'), iosHunt())).toBe(false)
  })

  it('does not let a loose skill word drag in unrelated roles', () => {
    // "Combine" is an iOS framework but also an ordinary English word, and
    // "Core Data" must not make every data role look relevant.
    const hunt = iosHunt({ keywords: ['Swift', 'Combine', 'Core Data'] })
    expect(
      isRelevantJob(job('Head of Product', 'You will combine research and data to shape roadmaps'), hunt),
    ).toBe(false)
    expect(isRelevantJob(job('Procurement Analyst', 'Analyse spend data and combine reports'), hunt)).toBe(false)
  })

  it('rejects unrelated engineering roles that merely mention the platform', () => {
    const backend = job(
      'Senior Software Engineer, Backend',
      'Build APIs consumed by our iOS and Android clients.',
    )
    expect(isRelevantJob(backend, iosHunt())).toBe(false)
  })

  it('honours the hunted discipline rather than a hardcoded one', () => {
    const marketing = iosHunt({
      roles: ['Marketing Manager'],
      keywords: ['SEO', 'Brand Strategy'],
    })
    expect(isRelevantJob(job('Senior Marketing Manager'), marketing)).toBe(true)
    expect(isRelevantJob(job('Senior iOS Engineer'), marketing)).toBe(false)
  })

  it('still excludes companies the user opted out of', () => {
    const hunt = iosHunt({ excludedCompanies: ['TestCo'] })
    expect(isRelevantJob(job('Senior iOS Engineer'), hunt)).toBe(false)
  })

  it('keeps everything when no roles or keywords are set', () => {
    const empty = iosHunt({ roles: [], keywords: [] })
    expect(isRelevantJob(job('Anything At All'), empty)).toBe(true)
  })
})
