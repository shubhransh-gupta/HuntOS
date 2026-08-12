/**
 * End-to-end check of the onboarding flow against a real production build.
 *
 * Guards the two things that broke before: a resume's own details must drive
 * the profile and hunt setup, and anything the parser cannot read must be
 * asked for rather than guessed.
 */
import { chromium } from 'playwright'
import { spawn } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')
const port = Number(process.env.E2E_PORT ?? 4174)
const baseUrl = `http://127.0.0.1:${port}`

const MARKETING_RESUME = `Priya Sharma
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
Led national campaigns and managed a team of six.
`

const UNREADABLE_RESUME = 'scanned page with no usable structure whatsoever at all'

const BANNED = ['ios', 'swift', 'swiftui', 'uikit', 'bangalore']

const failures = []
function check(name, condition, detail = '') {
  if (condition) {
    console.log(`  PASS  ${name}`)
  } else {
    console.log(`  FAIL  ${name}${detail ? ` — ${detail}` : ''}`)
    failures.push(name)
  }
}

async function waitForServer(url, timeoutMs = 60000) {
  const start = Date.now()
  while (Date.now() - start < timeoutMs) {
    try {
      if ((await fetch(url)).ok) return
    } catch {
      // keep polling
    }
    await new Promise((r) => setTimeout(r, 500))
  }
  throw new Error(`Server not ready at ${url}`)
}

async function resetDatabase(page) {
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

async function uploadResume(page, contents) {
  await page.goto(`${baseUrl}/app/onboarding`, { waitUntil: 'networkidle' })
  await page.setInputFiles('input[type="file"]', {
    name: 'resume.txt',
    mimeType: 'text/plain',
    buffer: Buffer.from(contents),
  })
  await page.getByRole('button', { name: 'Continue' }).click()
  await page.waitForTimeout(1200)
}

/** Values of the step 2 profile form, in render order. */
async function stepTwoValues(page) {
  const inputs = await page.locator('input[type="text"], input[type="number"]').all()
  const values = await Promise.all(inputs.map((input) => input.inputValue()))
  const skills = await page.locator('textarea').first().inputValue()
  return { values, skills }
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
    page.on('pageerror', (err) => pageErrors.push(err.message))

    await page.goto(baseUrl, { waitUntil: 'networkidle' })
    await resetDatabase(page)

    console.log('\nA marketing resume drives the whole flow')
    await uploadResume(page, MARKETING_RESUME)

    const parsed = await stepTwoValues(page)
    check('name read from resume', parsed.values.includes('Priya Sharma'), parsed.values.join(' | '))
    check('title read from resume', parsed.values.includes('Marketing Manager'))
    check('location read from resume', parsed.values.includes('Mumbai, India'))
    check('experience read from resume', parsed.values.includes('8'))
    check('skills read from resume', parsed.skills.includes('Brand Strategy'))

    const stepTwoText = (await page.locator('#root').innerText()).toLowerCase()
    check(
      'no engineering defaults on the profile step',
      !BANNED.some((term) => stepTwoText.includes(term)),
      BANNED.filter((term) => stepTwoText.includes(term)).join(', '),
    )

    await page.getByRole('button', { name: 'Continue' }).click()
    await page.waitForTimeout(700)

    const huntValues = await Promise.all(
      (await page.locator('input[type="text"]').all()).map((input) => input.inputValue()),
    )
    const huntText = huntValues.join(' | ')
    check('hunt roles come from the resume', huntText.includes('Marketing Manager'), huntText)
    check('hunt locations come from the resume', huntText.includes('Mumbai'), huntText)
    check('hunt keywords come from the resume', huntText.includes('SEO'), huntText)
    check(
      'no engineering defaults on the hunt step',
      !BANNED.some((term) => huntText.toLowerCase().includes(term)),
      huntText,
    )

    await page.getByRole('button', { name: 'Start Hunting' }).click()
    await page.waitForURL(`${baseUrl}/app`, { timeout: 15000 })
    await page.waitForTimeout(2500)
    const dashboard = await page.locator('#root').innerText()
    check('lands on the dashboard', dashboard.length > 0 && !page.url().includes('onboarding'), page.url())
    check('dashboard greets the parsed name', dashboard.includes('Priya'), dashboard.replace(/\n/g, ' / '))

    console.log('\nAn unreadable resume asks instead of guessing')
    await resetDatabase(page)
    await uploadResume(page, UNREADABLE_RESUME)

    const warning = await page.locator('#root').innerText()
    check("tells the user what couldn't be read", warning.includes("couldn't read"), warning.slice(0, 200))
    check(
      'blocks Continue until required fields are filled',
      await page.getByRole('button', { name: 'Continue' }).isDisabled(),
    )

    const blank = await stepTwoValues(page)
    check('does not invent a name', !blank.values.some((v) => v === 'Your Name'), blank.values.join(' | '))
    check('leaves skills empty', blank.skills.trim() === '', blank.skills)

    console.log('\nHomepage')
    await page.goto(baseUrl, { waitUntil: 'networkidle' })
    await page.waitForTimeout(600)
    const home = await page.locator('#root').innerText()
    check('shows the credit line', home.includes('Created with') && home.includes('Shubhransh Gupta'))
    check('renders the hero mark', (await page.locator('.hero-mark').count()) > 0)
    await page.screenshot({ path: '/tmp/huntos-verify/home-themed.png' })

    check('no runtime errors anywhere', pageErrors.length === 0, pageErrors.join(' | '))

    await browser.close()
  } finally {
    preview.kill('SIGTERM')
  }

  console.log(failures.length ? `\n${failures.length} check(s) failed` : '\nAll checks passed')
  process.exit(failures.length ? 1 : 0)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
