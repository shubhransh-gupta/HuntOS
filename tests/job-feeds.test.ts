import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  arbeitnowSource,
  jobicySource,
  remoteOkSource,
  remotiveSource,
} from '@/services/sources/job-feeds'
import { defaultSourceConfig } from '@/types/source-config'
import type { HuntCriteria } from '@/types'

const iosCriteria: HuntCriteria = {
  roles: ['iOS Engineer'],
  keywords: ['Swift'],
  locations: [],
  excludedCompanies: [],
  sources: [],
  sourceConfig: defaultSourceConfig,
} as unknown as HuntCriteria

function respondWith(payload: unknown) {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => payload,
    }),
  )
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('public job feeds', () => {
  it('maps a Remotive posting and drops HTML from the description', async () => {
    respondWith({
      jobs: [
        {
          id: 1,
          url: 'https://remotive.com/jobs/1',
          title: 'Senior iOS Engineer',
          company_name: 'Acme',
          category: 'Software Development',
          tags: ['Swift', 'SwiftUI'],
          publication_date: '2026-08-01T10:00:00',
          candidate_required_location: 'Worldwide',
          description: '<p>Build <strong>Swift</strong> apps</p>',
        },
      ],
    })

    const [job] = await remotiveSource.search(iosCriteria, defaultSourceConfig)

    expect(job.title).toBe('Senior iOS Engineer')
    expect(job.company).toBe('Acme')
    expect(job.source).toBe('remotive')
    expect(job.description).toBe('Build Swift apps')
    expect(job.remoteType).toBe('remote')
    expect(job.skills).toEqual(['Swift', 'SwiftUI'])
  })

  it('filters out feed results that do not match the hunt', async () => {
    respondWith({
      jobs: [
        {
          id: 1,
          url: 'https://remotive.com/jobs/1',
          title: 'Inside Sales Contractor',
          company_name: 'Credit Wellness',
          description: 'Cold calling and CRM work',
        },
        {
          id: 2,
          url: 'https://remotive.com/jobs/2',
          title: 'iOS Engineer',
          company_name: 'Acme',
          description: 'Swift codebase',
        },
      ],
    })

    const jobs = await remotiveSource.search(iosCriteria, defaultSourceConfig)

    expect(jobs).toHaveLength(1)
    expect(jobs[0].title).toBe('iOS Engineer')
  })

  it('converts Arbeitnow unix timestamps into ISO dates', async () => {
    respondWith({
      data: [
        {
          slug: 'ios-engineer-berlin',
          company_name: 'Preiswecker',
          title: 'iOS Engineer',
          description: '<p>Swift</p>',
          remote: true,
          url: 'https://arbeitnow.com/jobs/ios-engineer-berlin',
          tags: ['Mobile'],
          location: 'Berlin',
          created_at: 1786516800,
        },
      ],
    })

    const [job] = await arbeitnowSource.search(iosCriteria, defaultSourceConfig)

    expect(job.postedAt).toBe(new Date(1786516800 * 1000).toISOString())
    expect(job.location).toBe('Berlin')
    expect(job.remoteType).toBe('remote')
  })

  it('reads Jobicy field names', async () => {
    respondWith({
      jobs: [
        {
          id: 1,
          url: 'https://jobicy.com/jobs/1',
          jobTitle: 'iOS Engineer',
          companyName: 'Canonical',
          jobIndustry: ['Software Engineering'],
          jobGeo: 'APAC',
          jobDescription: '<p>Swift work</p>',
          pubDate: '2026-08-01T02:48:44+00:00',
        },
      ],
    })

    const [job] = await jobicySource.search(iosCriteria, defaultSourceConfig)

    expect(job.title).toBe('iOS Engineer')
    expect(job.company).toBe('Canonical')
    expect(job.industry).toBe('Software Engineering')
    expect(job.description).toBe('Swift work')
  })

  it('skips the Remote OK terms-of-service entry', async () => {
    respondWith([
      { legal: 'API Terms of Service: please link back' },
      {
        id: '1',
        company: 'Acme',
        position: 'iOS Engineer',
        description: 'Swift',
        url: 'https://remoteok.com/l/1',
        tags: ['ios'],
        salary_min: 100000,
        salary_max: 150000,
      },
    ])

    const jobs = await remoteOkSource.search(iosCriteria, defaultSourceConfig)

    expect(jobs).toHaveLength(1)
    expect(jobs[0].title).toBe('iOS Engineer')
    expect(jobs[0].salary).toEqual({ min: 100000, max: 150000, currency: 'USD' })
  })

  it('ignores Remote OK entries missing the fields we need', async () => {
    respondWith([{ legal: 'terms' }, { id: '2', company: 'Acme' }])

    expect(await remoteOkSource.search(iosCriteria, defaultSourceConfig)).toEqual([])
  })
})
