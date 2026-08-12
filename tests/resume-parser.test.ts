import { describe, expect, it } from 'vitest'
import { parseProfileLocally } from '@/services/parser/local-profile-parser'

describe('parseProfileLocally', () => {
  it('extracts basic fields without sending data anywhere', () => {
    const text = `Jane Doe
Senior iOS Engineer
jane.doe@example.com
+1 555 123 4567
linkedin.com/in/janedoe

Skills
Swift, SwiftUI, UIKit, Combine

Experience
5 years building mobile apps`

    const profile = parseProfileLocally(text)

    expect(profile.name).toBe('Jane Doe')
    expect(profile.email).toBe('jane.doe@example.com')
    expect(profile.phone).toContain('555')
    expect(profile.linkedIn).toContain('linkedin.com/in/janedoe')
    expect(profile.skills).toContain('Swift')
    expect(profile.totalExperienceYears).toBe(5)
  })
})
