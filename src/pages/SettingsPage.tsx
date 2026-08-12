import { useEffect, useState } from 'react'
import { storage } from '@/services/storage'
import { createAIProvider } from '@/services/ai/ai-provider'
import { requestNotificationPermission } from '@/services/notifications/notification-service'
import type { AIProviderId, AppSettings } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label, Switch, Separator } from '@/components/ui/label'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { downloadBlob } from '@/utils'
import { exportJobsCsv, exportApplicationsCsv } from '@/services/export/data-export'
import { JobSourcesSettings } from '@/features/settings/JobSourcesSettings'

export function SettingsPage() {
  const [settings, setSettings] = useState<AppSettings | null>(null)
  const [testResult, setTestResult] = useState<string | null>(null)

  useEffect(() => {
    storage.getSettings().then(setSettings)
  }, [])

  async function save(partial: Partial<AppSettings>) {
    const updated = await storage.saveSettings(partial)
    setSettings(updated)
    if (partial.theme) {
      const isDark =
        partial.theme === 'dark' ||
        (partial.theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)
      document.documentElement.classList.toggle('dark', isDark)
    }
    return updated
  }

  async function testConnection() {
    if (!settings) return
    setTestResult('Testing...')
    const provider = createAIProvider(settings.ai)
    const ok = await provider.testConnection()
    setTestResult(ok ? 'Connection successful!' : 'Connection failed. Check your API key.')
  }

  async function exportAll() {
    const data = await storage.exportAll()
    downloadBlob(JSON.stringify(data, null, 2), 'huntos-export.json', 'application/json')
  }

  async function deleteAll() {
    if (confirm('Delete all local HuntOS data? This cannot be undone.')) {
      await storage.deleteAll()
      window.location.href = `${import.meta.env.BASE_URL}app/welcome`
    }
  }

  if (!settings) return null

  return (
    <div className="mx-auto max-w-2xl space-y-8 p-8">
      <h1 className="text-2xl font-bold">Settings</h1>

      <Card>
        <CardHeader><CardTitle>AI Provider</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Provider</Label>
            <select
              className="mt-1 w-full rounded-md border border-[var(--color-border)] bg-transparent px-3 py-2 text-sm"
              value={settings.ai.provider}
              onChange={(e) => save({ ai: { ...settings.ai, provider: e.target.value as AIProviderId } })}
            >
              <option value="openai">OpenAI</option>
              <option value="anthropic">Anthropic</option>
              <option value="ollama">Ollama</option>
              <option value="openai-compatible">OpenAI Compatible</option>
            </select>
          </div>
          <div>
            <Label>Model</Label>
            <Input value={settings.ai.model} onChange={(e) => save({ ai: { ...settings.ai, model: e.target.value } })} />
          </div>
          <div>
            <Label>API Key</Label>
            <Input type="password" value={settings.ai.apiKey} onChange={(e) => save({ ai: { ...settings.ai, apiKey: e.target.value } })} placeholder="Stored locally only" />
          </div>
          <div>
            <Label>Base URL (optional)</Label>
            <Input value={settings.ai.baseUrl ?? ''} onChange={(e) => save({ ai: { ...settings.ai, baseUrl: e.target.value } })} />
          </div>
          <Button onClick={testConnection}>Test Connection</Button>
          {testResult && <p className="text-sm">{testResult}</p>}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Appearance</CardTitle></CardHeader>
        <CardContent>
          <select
            className="w-full rounded-md border border-[var(--color-border)] bg-transparent px-3 py-2 text-sm"
            value={settings.theme}
            onChange={(e) => save({ theme: e.target.value as AppSettings['theme'] })}
          >
            <option value="dark">Dark</option>
            <option value="light">Light</option>
            <option value="system">System</option>
          </select>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Notifications</CardTitle></CardHeader>
        <CardContent className="flex items-center justify-between">
          <span className="text-sm">Browser notifications for exceptional matches</span>
          <Switch
            checked={settings.notificationsEnabled}
            onCheckedChange={async (v) => {
              if (v) await requestNotificationPermission()
              save({ notificationsEnabled: v })
            }}
          />
        </CardContent>
      </Card>

      <JobSourcesSettings settings={settings} onSave={save} />

      <Card>
        <CardHeader><CardTitle>Privacy</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-[var(--color-muted-foreground)]">
            LOCAL-FIRST — Your resume, jobs and application history are stored locally.
            HuntOS does not require an account. AI analysis may send selected information to your configured AI provider.
          </p>
          <Separator />
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={exportAll}>Export all data</Button>
            <Button variant="outline" onClick={async () => {
              const jobs = await storage.getJobs()
              downloadBlob(exportJobsCsv(jobs), 'jobs.csv', 'text/csv')
            }}>Export Jobs CSV</Button>
            <Button variant="outline" onClick={async () => {
              const apps = await storage.getApplications()
              downloadBlob(exportApplicationsCsv(apps), 'applications.csv', 'text/csv')
            }}>Export Applications CSV</Button>
            <Button variant="destructive" onClick={deleteAll}>Delete all local data</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
