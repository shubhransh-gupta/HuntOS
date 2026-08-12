import { chromium } from 'playwright'
import { readFileSync } from 'node:fs'
import { mkdir } from 'node:fs/promises'
import { spawn } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')
const outDir = path.join(root, 'docs', 'images')
const port = Number(process.env.SCREENSHOT_PORT ?? 4173)
const baseUrl = process.env.SCREENSHOT_BASE_URL ?? `http://127.0.0.1:${port}`

const seed = JSON.parse(readFileSync(path.join(__dirname, 'screenshot-seed.json'), 'utf8'))

async function waitForServer(url, timeoutMs = 60000) {
  const start = Date.now()
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url)
      if (res.ok) return
    } catch {
      // retry
    }
    await new Promise((r) => setTimeout(r, 500))
  }
  throw new Error(`Server not ready at ${url}`)
}

function startPreview() {
  return spawn('npm', ['run', 'preview', '--', '--port', String(port), '--host', '127.0.0.1'], {
    cwd: root,
    stdio: 'inherit',
    shell: true,
  })
}

async function seedDatabase(page) {
  await page.evaluate(async (payload) => {
    const dbRequest = indexedDB.deleteDatabase('HuntOS')
    await new Promise((resolve, reject) => {
      dbRequest.onsuccess = () => resolve(undefined)
      dbRequest.onerror = () => reject(dbRequest.error)
      dbRequest.onblocked = () => resolve(undefined)
    })

    await new Promise((resolve, reject) => {
      const request = indexedDB.open('HuntOS', 1)
      request.onupgradeneeded = (event) => {
        const db = event.target.result
        // Must mirror src/services/storage/database.ts exactly, including
        // secondary indexes, or Dexie refuses to open the seeded database.
        const schema = {
          profile: [],
          masterResume: [],
          resumeVersions: ['jobId', 'createdAt'],
          huntProfiles: ['isDefault'],
          jobs: ['company', 'matchScore', 'status', 'discoveredAt', 'postedAt', 'recommendation'],
          applications: ['jobId', 'status', 'company', 'updatedAt'],
          huntRuns: ['huntProfileId', 'completedAt'],
          settings: [],
          notes: ['jobId', 'applicationId'],
        }
        for (const [name, indexes] of Object.entries(schema)) {
          const store = db.createObjectStore(name, { keyPath: 'id' })
          for (const index of indexes) store.createIndex(index, index, { unique: false })
        }
      }
      request.onsuccess = (event) => {
        const db = event.target.result
        const tx = db.transaction(
          ['profile', 'masterResume', 'huntProfiles', 'jobs', 'applications', 'huntRuns', 'settings'],
          'readwrite',
        )
        tx.objectStore('profile').put(payload.profile)
        tx.objectStore('masterResume').put(payload.masterResume)
        for (const huntProfile of payload.huntProfiles) tx.objectStore('huntProfiles').put(huntProfile)
        for (const job of payload.jobs) tx.objectStore('jobs').put(job)
        for (const app of payload.applications) tx.objectStore('applications').put(app)
        for (const run of payload.huntRuns) tx.objectStore('huntRuns').put(run)
        tx.objectStore('settings').put(payload.settings)
        tx.oncomplete = () => resolve(undefined)
        tx.onerror = () => reject(tx.error)
      }
      request.onerror = () => reject(request.error)
    })
  }, seed)
}

async function shot(page, name, opts = {}) {
  const rendered = (await page.locator('#root').innerText().catch(() => '')).trim()
  if (rendered.length === 0) {
    throw new Error(`Refusing to save "${name}": #root rendered nothing at ${page.url()}`)
  }

  const file = path.join(outDir, `${name}.png`)
  await page.screenshot({ path: file, fullPage: false, ...opts })
  console.log(`Saved ${name}.png`)
}

async function main() {
  await mkdir(outDir, { recursive: true })

  const preview = startPreview()
  try {
    await waitForServer(baseUrl)

    const browser = await chromium.launch()
    const page = await browser.newPage({
      viewport: { width: 1440, height: 900 },
      deviceScaleFactor: 2,
    })

    const pageErrors = []
    page.on('pageerror', (err) => pageErrors.push(`${page.url()} — ${err.message}`))

    await page.goto(`${baseUrl}/`, { waitUntil: 'networkidle' })
    await page.waitForTimeout(600)
    await shot(page, 'marketing')

    await page.goto(`${baseUrl}/app/welcome`, { waitUntil: 'networkidle' })
    await page.waitForTimeout(400)
    await shot(page, 'onboarding')
    // The mark's rings are tuned for a dark backdrop, so keep the panel behind it
    // rather than capturing on transparency.
    await page.locator('.hero-mark').first().screenshot({
      path: path.join(outDir, 'hero.png'),
    })
    console.log('Saved hero.png')

    await page.goto(`${baseUrl}/app`, { waitUntil: 'domcontentloaded' })
    await seedDatabase(page)
    await page.reload({ waitUntil: 'networkidle' })
    await page.waitForTimeout(800)
    await shot(page, 'dashboard')

    await page.goto(`${baseUrl}/app/hunt`, { waitUntil: 'networkidle' })
    await page.waitForTimeout(600)
    await shot(page, 'hunt')

    if (seed.topJobId) {
      await page.goto(`${baseUrl}/app/jobs/${seed.topJobId}`, { waitUntil: 'networkidle' })
      await page.waitForTimeout(600)

      // Expand the score breakdown so the shot shows explainable matching.
      const why = page.getByRole('button', { name: /^Why \d+%\?$/ })
      if (await why.count()) {
        await why.first().click()
        await page.waitForTimeout(500)
      }
      await shot(page, 'match')
    }

    await page.goto(`${baseUrl}/app/applications`, { waitUntil: 'networkidle' })
    await page.waitForTimeout(600)
    await shot(page, 'applications')

    await browser.close()

    if (pageErrors.length) {
      throw new Error(`Runtime errors during capture:\n  ${pageErrors.join('\n  ')}`)
    }
  } finally {
    preview.kill('SIGTERM')
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
