import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { storage } from '@/services/storage'
import type { Job, MasterProfile, MasterResume } from '@/types'
import { getRecommendation } from '@/types/matching'
import { analyzeGaps } from '@/services/matching/matching-engine'
import { formatPostedDate, formatDiscoveredDate } from '@/services/matching/freshness'
import { analyzeATSCompatibility } from '@/services/matching/ats-analyzer'
import { Card, CardHeader, CardTitle, CardContent, Badge, Progress } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/label'
import { MatchAnalysisPanel } from '@/features/matching/MatchAnalysisPanel'
import { ResumeOptimizer } from '@/features/resume/ResumeOptimizer'
import { TailoredResumeGenerator } from '@/features/resume/TailoredResumeGenerator'
import { checkDuplicateApplication } from '@/features/applications/duplicate-check'

export function JobDetailPage() {
  const { id } = useParams()
  const [job, setJob] = useState<Job | null>(null)
  const [profile, setProfile] = useState<MasterProfile | null>(null)
  const [masterResume, setMasterResume] = useState<MasterResume | null>(null)
  const [showMatch, setShowMatch] = useState(false)
  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null)

  useEffect(() => {
    if (id) loadJob(id)
  }, [id])

  async function loadJob(jobId: string) {
    const [j, p, r] = await Promise.all([
      storage.getJob(jobId),
      storage.getProfile(),
      storage.getMasterResume(),
    ])
    setJob(j ?? null)
    setProfile(p ?? null)
    setMasterResume(r ?? null)
  }

  async function handleApply() {
    if (!job) return
    const dup = await checkDuplicateApplication(job.company, job.title)
    if (dup) {
      setDuplicateWarning(`Previous application on ${new Date(dup.appliedDate ?? dup.createdAt).toLocaleDateString()}`)
      return
    }
    await storage.saveApplication({
      id: crypto.randomUUID(),
      jobId: job.id,
      company: job.company,
      role: job.title,
      status: 'applied',
      appliedDate: new Date().toISOString(),
      source: job.source,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })
    await storage.updateJob(job.id, { status: 'applied' })
  }

  if (!job) return <div className="p-8">Loading...</div>

  const rec = getRecommendation(job.matchScore ?? 0)
  const gaps = profile ? analyzeGaps(profile, job) : null
  const ats = profile && masterResume ? analyzeATSCompatibility(profile, masterResume, job) : null

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-8">
      <div>
        <div className="mb-2 flex items-center gap-2">
          <span className="text-2xl font-bold">{rec.emoji} {job.matchScore ?? 0}% MATCH</span>
          <Badge variant="success">{rec.label}</Badge>
        </div>
        <h1 className="text-3xl font-bold">{job.title}</h1>
        <p className="text-lg text-[var(--color-muted-foreground)]">{job.company}</p>
        <p className="text-sm">{job.location} • {job.remoteType} • {job.experienceMin}–{job.experienceMax} years</p>
        <p className="text-xs text-[var(--color-muted-foreground)]">{formatPostedDate(job)} • {formatDiscoveredDate(job)}</p>
        {job.isStale && <p className="text-xs text-[var(--color-warning)]">⚠ Possibly stale</p>}
      </div>

      <div className="flex gap-2">
        <Button onClick={handleApply}>Apply</Button>
        <Button variant="outline" onClick={() => storage.updateJob(job.id, { status: 'saved' })}>Save</Button>
        <Button variant="ghost" onClick={() => setShowMatch(!showMatch)}>
          {showMatch ? 'Hide' : 'Why ' + (job.matchScore ?? 0) + '%?'}
        </Button>
      </div>

      {duplicateWarning && (
        <Card className="border-[var(--color-warning)] p-4 text-sm">
          ⚠ YOU MAY HAVE ALREADY APPLIED — {duplicateWarning}
          <Link to="/app/applications" className="ml-2 underline">View applications</Link>
        </Card>
      )}

      {showMatch && job.matchBreakdown && <MatchAnalysisPanel breakdown={job.matchBreakdown} />}

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Skill Match</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {job.skillMatches?.map((s) => (
              <div key={s.skill} className="flex justify-between text-sm">
                <span>{s.skill}</span>
                <span>{s.status === 'strong' ? '✓' : s.status === 'partial' ? '~' : '⚠'}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        {gaps && (
          <Card>
            <CardHeader><CardTitle>Resume Gap</CardTitle></CardHeader>
            <CardContent>
              <p className="mb-2 text-sm">{gaps.matchedCount} / {gaps.totalImportant} important requirements matched</p>
              {gaps.gaps.map((g) => (
                <Badge key={g.skill} variant={g.classification === 'critical' ? 'destructive' : 'warning'} className="mr-1 mb-1">
                  {g.skill} ({g.classification.replace('_', ' ')})
                </Badge>
              ))}
            </CardContent>
          </Card>
        )}
      </div>

      {ats && (
        <Card>
          <CardHeader><CardTitle>Estimated ATS Compatibility: {ats.score}/100</CardTitle></CardHeader>
          <CardContent>
            <Progress value={ats.score} className="mb-2" />
            <p className="text-xs text-[var(--color-muted-foreground)]">
              This is an estimated compatibility score, not the employer&apos;s actual ATS score.
            </p>
          </CardContent>
        </Card>
      )}

      <Separator />

      {profile && masterResume && (
        <div className="space-y-4">
          <h2 className="font-semibold">Resume</h2>
          <ResumeOptimizer job={job} masterResume={masterResume} onUpdate={() => loadJob(job.id)} />
          <TailoredResumeGenerator job={job} profile={profile} masterResume={masterResume} />
        </div>
      )}

      <Card>
        <CardHeader><CardTitle>Found on</CardTitle></CardHeader>
        <CardContent>
          {job.foundOn.map((f) => (
            <div key={f.sourceUrl} className="text-sm">
              ✓ {f.source} ({f.discoveryMethod})
            </div>
          ))}
          {job.primaryApplicationUrl && (
            <p className="mt-2 text-sm">Primary application: {job.primaryApplicationUrl}</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Job Description</CardTitle></CardHeader>
        <CardContent>
          <pre className="whitespace-pre-wrap text-sm">{job.description}</pre>
        </CardContent>
      </Card>
    </div>
  )
}
