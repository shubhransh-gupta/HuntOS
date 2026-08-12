import { chromium } from 'playwright'

const target = process.argv[2] ?? 'https://shubhransh-gupta.github.io/HuntOS'

const RESUME_HTML = `<!doctype html>
<html><head><meta charset="utf-8"><style>
  body { font-family: Helvetica, Arial, sans-serif; font-size: 12px; padding: 40px; }
  h1 { font-size: 22px; margin: 0 0 4px; }
  h2 { font-size: 13px; margin: 18px 0 6px; text-transform: uppercase; }
  p { margin: 2px 0; }
</style></head><body>
  <h1>Priya Sharma</h1>
  <p>Marketing Manager</p>
  <p>priya.sharma@example.com</p>
  <p>+91 98765 43210</p>
  <p>Mumbai, India</p>
  <h2>Skills</h2>
  <p>Brand Strategy, SEO, Content Marketing, Google Analytics</p>
  <h2>Experience</h2>
  <p>Marketing Manager at Unilever</p>
  <p>2018 - 2024</p>
</body></html>`

const browser = await chromium.launch()
const maker = await browser.newPage()
await maker.setContent(RESUME_HTML, { waitUntil: 'load' })
const pdf = await maker.pdf({ format: 'A4' })
await maker.close()

const page = await browser.newPage()
const errors = []
page.on('pageerror', (error) => errors.push(error.message))

await page.goto(`${target}/app/onboarding`, { waitUntil: 'networkidle' })
await page.setInputFiles('input[type="file"]', {
  name: 'resume.pdf',
  mimeType: 'application/pdf',
  buffer: pdf,
})
await page.getByRole('button', { name: 'Continue' }).click()
await page.waitForTimeout(3000)

const values = await page.locator('input[type="text"], input[type="email"], input[type="tel"], input[type="number"]').evaluateAll(
  (nodes) => nodes.map((node) => node.value),
)
const skills = await page.locator('textarea').first().inputValue()
const body = await page.locator('#root').innerText()

let failed = false
const check = (label, condition, detail = '') => {
  if (!condition) failed = true
  console.log(`  ${condition ? 'PASS' : 'FAIL'}  ${label}${condition ? '' : ` — ${detail}`}`)
}

console.log(`\nLive PDF upload — ${target}`)
check('name', values.includes('Priya Sharma'), values.join(' | '))
check('title', values.includes('Marketing Manager'), values.join(' | '))
check('location', values.includes('Mumbai, India'), values.join(' | '))
check('email', values.includes('priya.sharma@example.com'), values.join(' | '))
check('skills', skills.includes('Brand Strategy'), skills)
check('nothing wrongly reported unreadable', !body.includes("couldn't read"), body.slice(0, 250))
check('no runtime errors', errors.length === 0, errors.join(' / '))

await browser.close()
console.log(failed ? '\nLive check failed' : '\nLive check passed')
process.exit(failed ? 1 : 0)
