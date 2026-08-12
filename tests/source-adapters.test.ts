import { describe, it, expect } from 'vitest'
import { detectJobUrl, extractGreenhouseBoardFromCareerUrl, extractLeverCompanyFromCareerUrl } from '@/services/sources/url-detector'
import { parseManualJobJson } from '@/services/sources/manual-import'
import { parseHtmlJobSnapshot } from '@/services/sources/public-pages'

describe('url detector', () => {
  it('detects greenhouse job URLs', () => {
    const detected = detectJobUrl('https://boards.greenhouse.io/stripe/jobs/123456')
    expect(detected.type).toBe('greenhouse')
    expect(detected.boardOrCompany).toBe('stripe')
    expect(detected.jobId).toBe('123456')
  })

  it('detects lever job URLs', () => {
    const detected = detectJobUrl('https://jobs.lever.co/netflix/abc-123')
    expect(detected.type).toBe('lever')
    expect(detected.boardOrCompany).toBe('netflix')
  })

  it('extracts greenhouse board from career URL', () => {
    expect(extractGreenhouseBoardFromCareerUrl('https://boards.greenhouse.io/figma')).toBe('figma')
  })

  it('extracts lever company from career URL', () => {
    expect(extractLeverCompanyFromCareerUrl('https://jobs.lever.co/lever')).toBe('lever')
  })
})

describe('manual import', () => {
  it('parses valid job JSON', () => {
    const job = parseManualJobJson({
      title: 'iOS Engineer',
      company: 'Acme',
      description: 'Swift role',
    })
    expect(job?.title).toBe('iOS Engineer')
    expect(job?.discoveryMethod).toBe('imported')
  })
})

describe('browser import html snapshot', () => {
  it('parses og:title from HTML', () => {
    const html = '<html><head><meta property="og:title" content="Senior iOS Engineer" /><meta property="og:description" content="Swift UIKit" /></head></html>'
    const job = parseHtmlJobSnapshot(html, 'https://example.com/job')
    expect(job?.title).toBe('Senior iOS Engineer')
    expect(job?.discoveryMethod).toBe('imported')
  })
})
