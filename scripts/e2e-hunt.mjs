/**
 * End-to-end check that a hunt returns real, on-target jobs.
 *
 * This deliberately hits the live job feeds rather than stubbing them, because
 * the thing being verified is that a browser can reach them at all. Guards
 * three past problems: bundled demo jobs being presented as results, jobs from
 * the wrong specialisation showing up, and the result count disagreeing with
 * the list underneath it.
 */
import { chromium } from 'playwright'
import { spawn } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')
const port = Number(process.env.E2E_PORT ?? 4176)
const baseUrl = `http://127.0.0.1:${port}`

const IOS_RESUME = `Arjun Mehta
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

/** Companies in the bundled demo file — none of these may appear in results. */
const DEMO_COMPANIES = ['Razorpay', 'CRED', 'Zerodha', 'PhonePe', 'Meesho']

let failed = false
function check(label, condition, detail = '') {
  if (!condition) failed = true
  console.log(`  ${condition ? 'PASS' : 'FAIL'}  ${label}${condition ? '' : ` — ${detail}`}`)
}

async function openFirstJob(page) {
  await page.locator('a[href*="/app/jobs/"]').first().click()
  await page.waitForSelector('text=Job Description', { timeout: 15000 })
}

async function waitForServer(url, timeoutMs = 60000) {
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    try {
      const res = await fetch(url)
      if (res.ok) return
    } catch {
      /* not up yet */
    }
    await new Promise((r) => setTimeout(r, 400))
  }
  throw new Error(`Server never came up at ${url}`)
}

async function resetDatabase(page) {
  await page.goto(`${baseUrl}/app/welcome`, { waitUntil: 'networkidle' })
  await page.evaluate(
    () =>
      new Promise((resolve) => {
        const request = indexedDB.deleteDatabase('HuntOS')
        request.onsuccess = () => resolve()
        request.onerror = () => resolve()
        request.onblocked = () => resolve()
      }),
  )
}

async function completeOnboarding(page) {
  await page.goto(`${baseUrl}/app/onboarding`, { waitUntil: 'networkidle' })
  await page.setInputFiles('input[type="file"]', {
    name: 'resume.txt',
    mimeType: 'text/plain',
    buffer: Buffer.from(IOS_RESUME),
  })
  await page.getByRole('button', { name: 'Continue' }).click()
  await page.waitForTimeout(1500)
  await page.getByRole('button', { name: 'Continue' }).click()
  await page.waitForTimeout(800)
  await page.getByRole('button', { name: 'Start Hunting' }).click()
  await page.waitForTimeout(2500)
}

/**
 * One entry per rendered job card. A card links to the same job several times
 * (title and action buttons), so results are keyed by job id.
 */
async function renderedJobs(page) {
  return page.evaluate(() => {
    const byId = new Map()
    for (const node of document.querySelectorAll('a[href*="/app/jobs/"]')) {
      const id = node.getAttribute('href').split('/app/jobs/')[1]
      const text = node.textContent?.replace(/\s+/g, ' ').trim() ?? ''
      if (!id) continue
      if (!byId.has(id) || text.length > byId.get(id).length) byId.set(id, text)
    }
    return [...byId.values()]
  })
}

async function main() {
  const preview = spawn('npm', ['run', 'preview', '--', '--port', String(port), '--host', '127.0.0.1'], {
    cwd: root,
    stdio: 'ignore',
    shell: true,
  })

  try {
    await waitForServer(baseUrl)
    const browser = await chromium.launch()
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })

    const pageErrors = []
    page.on('pageerror', (error) => pageErrors.push(error.message))

    await resetDatabase(page)
    await completeOnboarding(page)

    console.log('\nA hunt returns real, on-target jobs')
    await page.goto(`${baseUrl}/app/hunt`, { waitUntil: 'networkidle' })
    await page.getByRole('button', { name: 'Hunt' }).click()

    // Live feeds plus throttling; give the whole pipeline room to finish.
    await page.waitForSelector('text=HUNT COMPLETE', { timeout: 120000 })
    await page.waitForTimeout(1500)

    const body = await page.locator('#root').innerText()
    const titles = await renderedJobs(page)

    const discovered = Number(body.match(/(\d+) jobs discovered/)?.[1] ?? 0)
    const relevant = Number(body.match(/(\d+) relevant/)?.[1] ?? 0)
    const shown = Number(body.match(/Showing (\d+) jobs?/)?.[1] ?? 0)

    console.log(`  (discovered ${discovered}, relevant ${relevant}, shown ${shown}, cards ${titles.length})`)
    for (const title of titles.slice(0, 8)) console.log(`    · ${title.slice(0, 80)}`)

    check('reaches live job feeds', discovered > 0, body.slice(0, 400))
    check('finds jobs worth showing', relevant > 0, body.slice(0, 400))

    check(
      'the stated count matches the list',
      shown === titles.length && shown === relevant,
      `stated ${shown}, relevant ${relevant}, rendered ${titles.length}`,
    )

    const demo = titles.filter((t) => DEMO_COMPANIES.some((c) => t.includes(c)))
    check('no bundled demo jobs', demo.length === 0, demo.join(' | '))

    const offTarget = titles.filter((t) => /\bandroid\b/i.test(t) && !/\bios\b/i.test(t))
    check('no Android-only roles for an iOS profile', offTarget.length === 0, offTarget.join(' | '))

    const cardText = await page.locator('#root').innerText()
    const markup = cardText.match(/&lt;|&gt;|&quot;|<div|class="/) ?? []
    check('no markup leaking onto the cards', markup.length === 0, String(markup[0]))

    const longTag = await page.evaluate(() =>
      Array.from(document.querySelectorAll('span'))
        .map((n) => n.textContent?.trim() ?? '')
        .find((t) => t.length > 40 && /✓|⚠/.test(t)),
    )
    check('tags stay short', !longTag, longTag)

    // The description belongs on the job's own page, not the hunt list.
    const description = await page.evaluate(() => {
      const first = document.querySelector('a[href*="/app/jobs/"]')?.closest('div.rounded-xl, div[class*="card"]')
      return (first?.textContent ?? '').length
    })
    check('cards stay compact', description < 600, `card text length ${description}`)

    await openFirstJob(page)
    const jobText = await page.locator('#root').innerText()
    check('the description reads as text', !/&lt;|&gt;|&quot;|<div|class=/.test(jobText), jobText.slice(0, 160))
    const paragraphs = jobText.split('\n').filter((l) => l.trim().length > 0)
    check('the description keeps its structure', paragraphs.length > 8, `${paragraphs.length} lines`)
    console.log('\n  Description excerpt:')
    console.log(
      jobText
        .slice(jobText.indexOf('Job Description'))
        .split('\n')
        .slice(1, 7)
        .map((l) => `    ${l}`)
        .join('\n'),
    )
    await page.goBack()

    check('renders job cards', titles.length > 0, String(titles.length))

    console.log('\nThe count survives leaving and returning')
    await page.goto(`${baseUrl}/app`, { waitUntil: 'networkidle' })
    await page.waitForTimeout(800)
    await page.goto(`${baseUrl}/app/hunt`, { waitUntil: 'networkidle' })
    await page.waitForTimeout(1500)

    const afterReturn = await renderedJobs(page)
    check(
      'same jobs after navigating away and back',
      afterReturn.length === titles.length,
      `before ${titles.length}, after ${afterReturn.length}`,
    )

    check('no runtime errors', pageErrors.length === 0, pageErrors.join(' / '))

    await browser.close()
  } finally {
    preview.kill('SIGTERM')
  }

  console.log(failed ? '\nHunt checks failed' : '\nAll hunt checks passed')
  process.exit(failed ? 1 : 0)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
