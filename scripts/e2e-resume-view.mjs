/**
 * End-to-end check that an uploaded resume can be viewed as the file the user
 * uploaded, not just as extracted text.
 *
 * The PDF is produced by Chromium so the real pdfjs render path runs, and the
 * rendered canvas is inspected to confirm something was actually drawn.
 */
import { chromium } from 'playwright'
import { spawn } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')
const port = Number(process.env.E2E_PORT ?? 4177)
const baseUrl = `http://127.0.0.1:${port}`

const RESUME_HTML = `<!doctype html>
<html><head><meta charset="utf-8"><style>
  body { font-family: Helvetica, Arial, sans-serif; font-size: 12px; padding: 40px; }
  h1 { font-size: 22px; margin: 0 0 4px; }
  h2 { font-size: 13px; margin: 18px 0 6px; text-transform: uppercase; }
</style></head><body>
  <h1>Arjun Mehta</h1>
  <p>Senior iOS Engineer</p>
  <p>arjun.mehta@example.com</p>
  <p>Bangalore, India</p>
  <h2>Skills</h2>
  <p>Swift, SwiftUI, UIKit, Combine</p>
  <h2>Experience</h2>
  <p>Senior iOS Engineer at Swiggy</p>
  <p>2019 - 2026</p>
</body></html>`

let failed = false
function check(label, condition, detail = '') {
  if (!condition) failed = true
  console.log(`  ${condition ? 'PASS' : 'FAIL'}  ${label}${condition ? '' : ` — ${detail}`}`)
}

async function waitForServer(url, timeoutMs = 60000) {
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    try {
      if ((await fetch(url)).ok) return
    } catch {
      /* not up yet */
    }
    await new Promise((r) => setTimeout(r, 400))
  }
  throw new Error(`Server never came up at ${url}`)
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

    const maker = await browser.newPage()
    await maker.setContent(RESUME_HTML, { waitUntil: 'load' })
    const pdf = await maker.pdf({ format: 'A4', printBackground: true })
    await maker.close()

    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
    const pageErrors = []
    page.on('pageerror', (error) => pageErrors.push(error.message))

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

    await page.goto(`${baseUrl}/app/onboarding`, { waitUntil: 'networkidle' })
    await page.setInputFiles('input[type="file"]', {
      name: 'arjun-resume.pdf',
      mimeType: 'application/pdf',
      buffer: pdf,
    })
    await page.getByRole('button', { name: 'Continue' }).click()
    await page.waitForTimeout(2500)
    await page.getByRole('button', { name: 'Continue' }).click()
    await page.waitForTimeout(800)
    await page.getByRole('button', { name: 'Start Hunting' }).click()
    await page.waitForTimeout(2000)

    console.log('\nThe master resume shows the uploaded file')
    await page.goto(`${baseUrl}/app/resumes/master`, { waitUntil: 'networkidle' })
    await page.waitForTimeout(2500)

    const body = await page.locator('#root').innerText()
    check('keeps the original file name', body.includes('arjun-resume.pdf'), body.slice(0, 200))
    check('offers the original for download', body.includes('Download original'), body.slice(0, 200))

    const canvasCount = await page.locator('canvas').count()
    check('renders the PDF to a canvas', canvasCount > 0, `canvases: ${canvasCount}`)

    // A blank canvas would still count, so confirm ink was actually laid down.
    const painted = await page.evaluate(() => {
      const canvas = document.querySelector('canvas')
      if (!canvas) return false
      const pixels = canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height).data
      const colours = new Set()
      for (let i = 0; i < pixels.length; i += 4) {
        colours.add(`${pixels[i]},${pixels[i + 1]},${pixels[i + 2]}`)
        if (colours.size > 1) return true
      }
      return false
    })
    check('the rendered page is not blank', painted)

    check('does not show raw text by default', !body.includes('Senior iOS Engineer at Swiggy'), body.slice(0, 250))

    console.log('\nThe extracted text is still reachable')
    await page.getByRole('button', { name: 'Extracted text' }).click()
    await page.waitForTimeout(600)
    const textValue = await page.locator('textarea').first().inputValue()
    check('shows the parsed text on request', textValue.includes('Swiggy'), textValue.slice(0, 150))

    check('no runtime errors', pageErrors.length === 0, pageErrors.join(' / '))

    await browser.close()
  } finally {
    preview.kill('SIGTERM')
  }

  console.log(failed ? '\nResume view checks failed' : '\nAll resume view checks passed')
  process.exit(failed ? 1 : 0)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
