import { describe, expect, it } from 'vitest'
import {
  findMissingProfileFields,
  parseProfileLocally,
} from '@/services/parser/local-profile-parser'

const iosResume = `Jane Doe
Senior iOS Engineer
jane.doe@example.com
+1 555 123 4567
linkedin.com/in/janedoe
Bengaluru, India

Skills
Swift, SwiftUI, UIKit, Combine

Experience
Senior iOS Engineer at Razorpay
2019 - Present
Built payment flows with 5 years of experience shipping mobile apps`

const marketingResume = `Priya Sharma
Marketing Manager
priya.sharma@example.com
+91 98765 43210
Mumbai, India

Summary
Brand marketer with 8 years of experience across FMCG and retail.

Skills
Brand Strategy, SEO, Content Marketing, Google Analytics, Copywriting

Experience
Marketing Manager at Unilever
2018 - 2024
Led national campaigns and managed a team of six.`

describe('parseProfileLocally', () => {
  it('extracts basic fields without sending data anywhere', () => {
    const profile = parseProfileLocally(iosResume)

    expect(profile.name).toBe('Jane Doe')
    expect(profile.email).toBe('jane.doe@example.com')
    expect(profile.phone).toContain('555')
    expect(profile.linkedIn).toContain('linkedin.com/in/janedoe')
    expect(profile.headline).toBe('Senior iOS Engineer')
    expect(profile.location).toBe('Bengaluru, India')
    expect(profile.skills).toContain('Swift')
    expect(profile.totalExperienceYears).toBe(5)
  })

  it('parses a non-technical resume without leaking engineering defaults', () => {
    const profile = parseProfileLocally(marketingResume)

    expect(profile.name).toBe('Priya Sharma')
    expect(profile.headline).toBe('Marketing Manager')
    expect(profile.location).toBe('Mumbai, India')
    expect(profile.totalExperienceYears).toBe(8)
    expect(profile.skills).toContain('Brand Strategy')
    expect(profile.skills).toContain('SEO')
    expect(profile.roles).toContain('Marketing Manager')
    expect(profile.companies).toContain('Unilever')

    const serialised = JSON.stringify(profile).toLowerCase()
    for (const term of ['ios', 'swift', 'swiftui', 'uikit', 'bangalore']) {
      expect(serialised).not.toContain(term)
    }
  })

  it('leaves fields blank rather than guessing when the resume is unreadable', () => {
    const profile = parseProfileLocally('some scanned text with no structure at all')

    expect(profile.name).toBe('')
    expect(profile.email).toBeUndefined()
    expect(profile.headline).toBeUndefined()
    expect(profile.location).toBeUndefined()
    expect(profile.totalExperienceYears).toBe(0)
    expect(profile.skills).toEqual([])
  })

  it('never invents a placeholder name', () => {
    expect(parseProfileLocally('').name).toBe('')
    expect(parseProfileLocally('Skills\nExcel').name).toBe('')
  })

  it('only reads skills from a skills section instead of shredding the document', () => {
    const profile = parseProfileLocally(`Ravi Kumar
Data Analyst
ravi@example.com

Experience
Data Analyst at Acme
Wrote a great many words that are definitely not skills.`)

    expect(profile.skills).toEqual([])
  })

  it('derives years of experience from date ranges when not stated outright', () => {
    const profile = parseProfileLocally(`Alex Stone
Product Manager
alex@example.com

Experience
Product Manager at Globex
2015 - 2021`)

    expect(profile.totalExperienceYears).toBe(6)
  })

  it('ignores dates and identifiers when looking for a phone number', () => {
    const profile = parseProfileLocally(`Sam Reed
Account Manager
sam@example.com

Experience
Account Manager at Initech
2019 - 2021`)

    expect(profile.phone).toBeUndefined()
  })
})

describe('findMissingProfileFields', () => {
  it('reports nothing missing for a fully parsed resume', () => {
    expect(findMissingProfileFields(parseProfileLocally(marketingResume))).toEqual([])
  })

  it('lists every required field an unreadable resume left blank', () => {
    const missing = findMissingProfileFields(parseProfileLocally('gibberish'))

    expect(missing).toEqual([
      'name',
      'email',
      'headline',
      'location',
      'totalExperienceYears',
      'skills',
    ])
  })

  it('treats zero years and empty skills as missing', () => {
    expect(findMissingProfileFields({ totalExperienceYears: 0, skills: [] })).toContain(
      'totalExperienceYears',
    )
    expect(findMissingProfileFields({ totalExperienceYears: 0, skills: [] })).toContain('skills')
  })
})
