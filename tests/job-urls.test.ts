import { describe, expect, it } from 'vitest'
import { getJobApplicationUrl, isAggregatorUrl, pickBestApplicationUrl } from '@/utils/job-urls'
import type { Job } from '@/types'

describe('job-urls', () => {
  it('prefers company application URLs over aggregators', () => {
    expect(
      pickBestApplicationUrl([
        'https://linkedin.com/jobs/example',
        'https://boards.greenhouse.io/company/job/123',
      ]),
    ).toBe('https://boards.greenhouse.io/company/job/123')
  })

  it('detects aggregator hosts', () => {
    expect(isAggregatorUrl('https://www.linkedin.com/jobs/view/123')).toBe(true)
    expect(isAggregatorUrl('https://careers.example.com/jobs/ios')).toBe(false)
  })

  it('returns direct application url from merged job metadata', () => {
    const job = {
      source: 'linkedin',
      sourceUrl: 'https://linkedin.com/jobs/razorpay-senior-ios',
      applicationUrl: 'https://linkedin.com/jobs/razorpay-senior-ios',
      primaryApplicationUrl: 'https://razorpay.com/careers/senior-ios-engineer',
      foundOn: [],
    } as unknown as Job

    expect(getJobApplicationUrl(job)).toBe('https://razorpay.com/careers/senior-ios-engineer')
  })
})
