/**
 * Checks the deployed site, not a local build: runs a hunt against the live job
 * feeds and confirms no posting markup reaches the cards or the description.
 *
 * Guards the case where a board hands over its description with the markup
 * escaped, which a plain tag-stripping pass leaves untouched.
 */
import { chromium } from 'playwright'

const site = process.env.HUNTOS_URL ?? 'https://shubhransh-gupta.github.io/HuntOS'

const RESUME = `Arjun Mehta
Senior iOS Engineer
arjun.mehta@example.com
+91 90000 11111
Bangalore, India

Summary
iOS engineer with 7 years of experience shipping consumer apps.

Skills
Swift, SwiftUI, UIKit, Combine, Core Data, XCTest

Experience
Senior iOS Engineer at Swiggy
2019 - 2026
Led the checkout rewrite in SwiftUI.
`

const MARKUP = /&lt;|&gt;|&quot;|<div|class=|&amp;[a-z]+;/

let failed = false
function check(label, condition, detail = '') {
  if (!condition) failed = true
  console.log(`  ${condition ? 'PASS' : 'FAIL'}  ${label}${condition ? '' : ` — ${detail}`}`)
}

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } })
const errors = []
page.on('pageerror', (e) => errors.push(e.message))

try {
  await page.goto(`${site}/app/onboarding`, { waitUntil: 'networkidle' })
  await page.setInputFiles('input[type="file"]', {
    name: 'resume.txt',
    mimeType: 'text/plain',
    buffer: Buffer.from(RESUME),
  })
  await page.getByRole('button', { name: 'Continue' }).click()
  await page.waitForTimeout(1500)
  await page.getByRole('button', { name: 'Continue' }).click()
  await page.waitForTimeout(800)
  await page.getByRole('button', { name: 'Start Hunting' }).click()
  await page.waitForTimeout(2500)

  console.log('\nA hunt on the live site')
  await page.goto(`${site}/app/hunt`, { waitUntil: 'networkidle' })
  await page.getByRole('button', { name: 'Hunt', exact: true }).click()
  await page.waitForTimeout(28000)

  const cards = await page.locator('#root').innerText()
  check('the hunt page reaches live feeds', /hunt complete/i.test(cards), cards.slice(0, 120))
  check('no markup on the cards', !MARKUP.test(cards), (cards.match(MARKUP) ?? [])[0])

  const jobLink = page.locator('a[href*="/app/jobs/"]').first()
  if ((await jobLink.count()) === 0) {
    check('a job to open', false, 'no job cards rendered')
  } else {
    await jobLink.click()
    await page.waitForSelector('text=Job Description', { timeout: 20000 })
    const detail = await page.locator('#root').innerText()
    check('no markup in the description', !MARKUP.test(detail), (detail.match(MARKUP) ?? [])[0])

    const body = detail.slice(detail.indexOf('Job Description'))
    const lines = body.split('\n').filter((l) => l.trim())
    check('the description keeps its structure', lines.length > 5, `${lines.length} lines`)
    console.log('\n  Excerpt:')
    console.log(lines.slice(1, 5).map((l) => `    ${l.slice(0, 150)}`).join('\n'))
  }

  check('no runtime errors', errors.length === 0, errors.join(' | '))
} finally {
  await browser.close()
}

console.log(failed ? '\nLive description checks failed' : '\nAll live description checks passed')
process.exit(failed ? 1 : 0)
