import { useState } from 'react'
import type { Job, MasterProfile, MasterResume } from '@/types'
import { generateTailoredResume } from '@/services/ai'
import { validateResumeClaims } from '@/services/matching/ats-analyzer'
import { storage } from '@/services/storage'
import { generateId } from '@/utils'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

interface Props {
  job: Job
  profile: MasterProfile
  masterResume: MasterResume
}

export function TailoredResumeGenerator({ job, profile, masterResume }: Props) {
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(false)
  const [violations, setViolations] = useState<string[]>([])

  async function generate() {
    setLoading(true)
    try {
      const requirements = [
        ...job.requirements.required,
        ...job.requirements.preferred,
      ]
      const result = await generateTailoredResume(
        masterResume.rawText,
        job.title,
        job.company,
        requirements,
      )
      const v = validateResumeClaims(masterResume.rawText, result)
      setViolations(v)
      setContent(result)
    } finally {
      setLoading(false)
    }
  }

  async function saveVersion() {
    if (!content) return
    const existing = await storage.getResumeVersions()
    const companyVersions = existing.filter((v) => v.company === job.company && v.role === job.title)
    const version = companyVersions.length + 1

    await storage.saveResumeVersion({
      id: generateId(),
      name: `${job.company} — ${job.title} — v${version}`,
      company: job.company,
      role: job.title,
      version,
      content,
      masterResumeVersion: masterResume.version,
      jobId: job.id,
      createdAt: new Date().toISOString(),
    })
    alert('Tailored resume saved!')
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <p className="text-sm">Current match: {job.matchScore ?? 0}%</p>
      </div>
      <Button onClick={generate} disabled={loading}>
        {loading ? 'Generating...' : 'Generate Tailored Resume'}
      </Button>
      {violations.length > 0 && (
        <p className="text-xs text-[var(--color-warning)]">Validation warnings: {violations.join('; ')}</p>
      )}
      {content && (
        <Card>
          <CardContent className="pt-4">
            <p className="mb-2 text-xs text-[var(--color-muted-foreground)]">
              Based on Master Resume v{masterResume.version} • {profile.name}
            </p>
            <pre className="whitespace-pre-wrap text-sm">{content}</pre>
            <Button className="mt-4" size="sm" onClick={saveVersion}>Save Version</Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
