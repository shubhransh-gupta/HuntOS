import { chromium } from 'playwright'

const targets = process.argv.slice(2)
if (targets.length === 0) {
  console.error('usage: node scripts/verify-live.mjs <url> [...urls]')
  process.exit(1)
}

const browser = await chromium.launch()
let failed = false

for (const url of targets) {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
  const consoleErrors = []
  const badResponses = []
  page.on('pageerror', (err) => consoleErrors.push(err.message))
  page.on('response', (res) => {
    if (res.status() >= 400) badResponses.push(`${res.status()} ${res.url()}`)
  })

  await page.goto(url, { waitUntil: 'networkidle' })
  await page.waitForTimeout(1500)

  const text = (await page.locator('#root').innerText().catch(() => '')).trim()
  const ok = text.length > 0 && consoleErrors.length === 0

  console.log(`\n${ok ? 'PASS' : 'FAIL'}  ${url}`)
  console.log(`  rendered chars: ${text.length}`)
  console.log(`  first line: ${text.split('\n')[0] ?? '(empty)'}`)
  if (consoleErrors.length) console.log(`  errors: ${consoleErrors.join(' | ')}`)
  if (badResponses.length) console.log(`  non-2xx: ${badResponses.join(' | ')}`)

  if (!ok) failed = true
  await page.close()
}

await browser.close()
process.exit(failed ? 1 : 0)
