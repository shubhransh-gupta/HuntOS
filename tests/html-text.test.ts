import { describe, expect, it } from 'vitest'
import { decodeHtmlEntities, htmlToLine, htmlToText, isTagLike } from '@/utils/html-text'
import { extractSkillsFromText, parseJobRequirements } from '@/services/parser/job-parser'

describe('htmlToText', () => {
  it('reads markup that arrived escaped', () => {
    // Greenhouse escapes its descriptions, so tags come through as entities.
    const escaped = '&lt;div class=&quot;content&quot;&gt;&lt;p&gt;Build iOS apps&lt;/p&gt;&lt;/div&gt;'

    const text = htmlToText(escaped)

    expect(text).toBe('Build iOS apps')
    expect(text).not.toContain('&lt;')
    expect(text).not.toContain('class')
  })

  it('reads ordinary markup too', () => {
    expect(htmlToText('<p>Build <strong>iOS</strong> apps</p>')).toBe('Build iOS apps')
  })

  it('keeps paragraphs and list items on their own lines', () => {
    const html = '<p>About the role</p><ul><li>Ship Swift code</li><li>Review PRs</li></ul>'

    // A blank line sets the list off from the paragraph; the items run on
    // consecutive lines so they read as a list.
    expect(htmlToText(html).split('\n')).toEqual([
      'About the role',
      '',
      '• Ship Swift code',
      '• Review PRs',
    ])
  })

  it('turns line breaks into newlines', () => {
    expect(htmlToText('First<br>Second')).toBe('First\nSecond')
  })

  it('decodes entities left in the text', () => {
    expect(htmlToText('<p>R&amp;D team &mdash; remote</p>')).toBe('R&D team — remote')
    expect(htmlToText('<p>Caf&#233;</p>')).toBe('Café')
  })

  it('does not mistake a comparison for a tag', () => {
    expect(htmlToText('<p>Keep latency &lt; 100ms and uptime &gt; 99%</p>')).toBe(
      'Keep latency < 100ms and uptime > 99%',
    )
  })

  it('collapses everything onto one line when asked', () => {
    expect(htmlToLine('<p>Senior iOS</p><p>Engineer</p>')).toBe('Senior iOS Engineer')
  })

  it('leaves empty input alone', () => {
    expect(htmlToText('')).toBe('')
  })
})

describe('decodeHtmlEntities', () => {
  it('leaves unknown entities untouched', () => {
    expect(decodeHtmlEntities('&notareal; &amp;')).toBe('&notareal; &')
  })
})

describe('isTagLike', () => {
  it('accepts short skill names', () => {
    expect(isTagLike('Swift')).toBe(true)
    expect(isTagLike('React Native')).toBe(true)
  })

  it('rejects sentences and leftover markup', () => {
    expect(isTagLike('5+ years of experience building consumer iOS applications')).toBe(false)
    expect(isTagLike('<div class="content">')).toBe(false)
    expect(isTagLike('You will do the following:')).toBe(false)
    expect(isTagLike('')).toBe(false)
  })
})

describe('extractSkillsFromText', () => {
  it('names technologies in their canonical spelling', () => {
    const skills = extractSkillsFromText('Strong swift and SWIFTUI experience, plus uikit.')

    expect(skills).toEqual(expect.arrayContaining(['Swift', 'SwiftUI', 'UIKit']))
  })

  it('reads names that end in punctuation', () => {
    expect(extractSkillsFromText('C++ and CI/CD pipelines')).toEqual(
      expect.arrayContaining(['C++', 'CI/CD']),
    )
  })

  it('does not match a name buried inside another word', () => {
    expect(extractSkillsFromText('We use Golang')).not.toContain('Go')
    expect(extractSkillsFromText('javascripting')).not.toContain('JavaScript')
  })

  it('lists each technology once', () => {
    const skills = extractSkillsFromText('Swift, Swift, and more Swift')

    expect(skills.filter((s) => s === 'Swift')).toHaveLength(1)
  })
})

describe('parseJobRequirements', () => {
  it('reads bullets out of a converted description', () => {
    const description = htmlToText(
      '&lt;p&gt;Requirements&lt;/p&gt;&lt;ul&gt;&lt;li&gt;Swift&lt;/li&gt;&lt;li&gt;SwiftUI&lt;/li&gt;&lt;/ul&gt;',
    )

    expect(parseJobRequirements(description).required).toEqual(
      expect.arrayContaining(['Swift', 'SwiftUI']),
    )
  })

  it('refuses a paragraph masquerading as a requirement', () => {
    const wall = `Requirements\n${'We are looking for someone exceptional. '.repeat(20)}`

    for (const item of parseJobRequirements(wall).required) {
      expect(item.length).toBeLessThanOrEqual(180)
    }
  })

  it('drops leftover markup rather than listing it as a skill', () => {
    const requirements = parseJobRequirements('Requirements\n<div class="content-intro">\nSwift')

    expect(requirements.required).not.toContain('<div class="content-intro">')
    expect(requirements.required).toContain('Swift')
  })
})
