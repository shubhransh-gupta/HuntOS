import { useState } from 'react'
import type { AppSettings, JobSourceConfig } from '@/types'
import { ALL_JOB_SOURCES, SOURCE_LABELS } from '@/services/sources/registry'
import { parseManualJobJson, parseManualJobUrl } from '@/services/sources/manual-import'
import { fetchJobFromPublicUrl, parseHtmlJobSnapshot } from '@/services/sources/public-pages'
import { queueBrowserImport } from '@/services/sources/browser-import'
import { detectJobUrl } from '@/services/sources/url-detector'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardHeader, CardTitle, CardContent, Badge } from '@/components/ui/card'

interface Props {
  settings: AppSettings
  onSave: (partial: Partial<AppSettings>) => Promise<unknown>
}

function ListEditor({
  label,
  placeholder,
  values,
  onChange,
  hint,
}: {
  label: string
  placeholder: string
  values: string[]
  onChange: (values: string[]) => void
  hint?: string
}) {
  const [input, setInput] = useState('')

  function add() {
    const value = input.trim()
    if (!value || values.includes(value)) return
    onChange([...values, value])
    setInput('')
  }

  return (
    <div>
      <Label>{label}</Label>
      {hint && <p className="mb-1 text-xs text-[var(--color-muted-foreground)]">{hint}</p>}
      <div className="mt-1 flex gap-2">
        <Input value={input} onChange={(e) => setInput(e.target.value)} placeholder={placeholder} onKeyDown={(e) => e.key === 'Enter' && add()} />
        <Button type="button" variant="outline" onClick={add}>Add</Button>
      </div>
      <div className="mt-2 flex flex-wrap gap-1">
        {values.map((value) => (
          <Badge key={value} variant="outline" className="cursor-pointer" onClick={() => onChange(values.filter((v) => v !== value))}>
            {value} ×
          </Badge>
        ))}
      </div>
    </div>
  )
}

export function JobSourcesSettings({ settings, onSave }: Props) {
  const [importJson, setImportJson] = useState('')
  const [importUrl, setImportUrl] = useState('')
  const [importHtml, setImportHtml] = useState('')
  const [importStatus, setImportStatus] = useState<string | null>(null)

  const config = settings.sourceConfig

  async function updateSourceConfig(next: JobSourceConfig) {
    await onSave({ sourceConfig: next })
  }

  async function importJsonJob() {
    try {
      const raw = parseManualJobJson(JSON.parse(importJson))
      if (!raw) throw new Error('Invalid job JSON (needs title, company, description)')
      await updateSourceConfig(queueBrowserImport(config, raw))
      setImportJson('')
      setImportStatus('Job queued for next hunt (Manual Import / Browser Import source).')
    } catch (e) {
      setImportStatus(e instanceof Error ? e.message : 'Import failed')
    }
  }

  async function importFromUrl() {
    setImportStatus('Fetching public URL...')
    try {
      const detected = detectJobUrl(importUrl)
      const fetched = await fetchJobFromPublicUrl(importUrl)
      if (fetched) {
        await updateSourceConfig(queueBrowserImport(config, { ...fetched, discoveryMethod: 'fetched' }))
        setImportUrl('')
        setImportStatus(`Fetched via ${detected.type === 'unknown' ? 'public URL' : detected.type}. Queued for next hunt.`)
        return
      }

      const fallback = parseManualJobUrl(importUrl)
      if (fallback) {
        await updateSourceConfig(queueBrowserImport(config, fallback))
        setImportUrl('')
        setImportStatus('URL saved for tracking. Could not auto-fetch — paste description via browser import.')
      }
    } catch (e) {
      setImportStatus(e instanceof Error ? e.message : 'Could not fetch URL. Use Import from this source instead.')
    }
  }

  async function importFromHtml() {
    try {
      const parsed = parseHtmlJobSnapshot(importHtml, importUrl || 'browser-import://local')
      if (!parsed) throw new Error('Could not parse HTML snapshot')
      await updateSourceConfig(queueBrowserImport(config, parsed))
      setImportHtml('')
      setImportStatus('Browser snapshot imported and queued for next hunt.')
    } catch (e) {
      setImportStatus(e instanceof Error ? e.message : 'HTML import failed')
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Live Job Sources</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-[var(--color-muted-foreground)]">
            HuntOS only uses public APIs and user-provided URLs. Sources that block browser access show as unavailable — use Import instead.
          </p>

          <ListEditor
            label="Greenhouse board slugs"
            placeholder="e.g. stripe"
            hint="Public API: boards-api.greenhouse.io/v1/boards/{slug}/jobs"
            values={config.greenhouseBoards}
            onChange={(greenhouseBoards) => updateSourceConfig({ ...config, greenhouseBoards })}
          />

          <ListEditor
            label="Lever company slugs"
            placeholder="e.g. netflix"
            hint="Public API: api.lever.co/v0/postings/{company}"
            values={config.leverCompanies}
            onChange={(leverCompanies) => updateSourceConfig({ ...config, leverCompanies })}
          />

          <ListEditor
            label="Ashby job board slugs"
            placeholder="e.g. ramp"
            hint="Public API: api.ashbyhq.com/posting-api/job-board/{slug}"
            values={config.ashbyBoards ?? []}
            onChange={(ashbyBoards) => updateSourceConfig({ ...config, ashbyBoards })}
          />

          <ListEditor
            label="Company career page URLs"
            placeholder="https://boards.greenhouse.io/company"
            hint="HuntOS detects Greenhouse/Lever URLs and uses their public APIs."
            values={config.companyCareerUrls}
            onChange={(companyCareerUrls) => updateSourceConfig({ ...config, companyCareerUrls })}
          />

          <ListEditor
            label="Public job URLs"
            placeholder="https://boards.greenhouse.io/co/jobs/123"
            values={config.publicJobUrls}
            onChange={(publicJobUrls) => updateSourceConfig({ ...config, publicJobUrls })}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Import Job</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Import JSON</Label>
            <textarea
              className="mt-1 w-full rounded-md border border-[var(--color-border)] bg-transparent px-3 py-2 text-sm"
              rows={3}
              placeholder='{"title":"...","company":"...","description":"..."}'
              value={importJson}
              onChange={(e) => setImportJson(e.target.value)}
            />
            <Button className="mt-2" onClick={importJsonJob}>Import JSON</Button>
          </div>

          <div>
            <Label>Import from public URL</Label>
            <Input value={importUrl} onChange={(e) => setImportUrl(e.target.value)} placeholder="Greenhouse or Lever job URL" />
            <Button className="mt-2" variant="outline" onClick={importFromUrl}>Fetch / Save URL</Button>
          </div>

          <div>
            <Label>Browser import (paste page HTML)</Label>
            <textarea
              className="mt-1 w-full rounded-md border border-[var(--color-border)] bg-transparent px-3 py-2 text-sm"
              rows={4}
              placeholder="Paste copied job page HTML or text..."
              value={importHtml}
              onChange={(e) => setImportHtml(e.target.value)}
            />
            <Button className="mt-2" variant="outline" onClick={importFromHtml}>Import Snapshot</Button>
          </div>

          {importStatus && <p className="text-sm">{importStatus}</p>}
          {config.browserImportQueue.length > 0 && (
            <p className="text-xs text-[var(--color-muted-foreground)]">
              {config.browserImportQueue.length} job(s) queued for hunt. Enable Manual Import or Browser Import in your Hunt Profile sources.
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Available Source Adapters</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {ALL_JOB_SOURCES.map((source) => (
            <div key={source.id} className="flex items-center justify-between text-sm">
              <span>{SOURCE_LABELS[source.id] ?? source.name}</span>
              <span className="text-xs text-[var(--color-muted-foreground)]">
                {source.capabilities.search ? 'search' : ''}
                {source.capabilities.import ? ' · import' : ''}
                {source.capabilities.fetch ? ' · fetch' : ''}
              </span>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
