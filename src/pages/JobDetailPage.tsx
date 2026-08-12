import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ExternalLink } from 'lucide-react'
import { storage } from '@/services/storage'
import type { Application, Job, MasterProfile, MasterResume } from '@/types'
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
import { getApplyHref, trackJobApplication } from '@/features/applications/apply-to-job'
import { JobSourceLinks } from '@/components/jobs/JobSourceLinks'

export function JobDetailPage() {
  const { id } = useParams()
  const [job, setJob] = useState<Job | null>(null)
  const [profile, setProfile] = useState<MasterProfile | null>(null)
  const [masterResume, setMasterResume] = useState<MasterResume | null>(null)
  const [showMatch, setShowMatch] = useState(false)
  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null)
  const [applyMessage, setApplyMessage] = useState<string | null>(null)
  const [applications, setApplications] = useState<Application[]>([])
  const [forceApply, setForceApply] = useState(false)

  useEffect(() => {
    if (id) loadJob(id)
  }, [id])

  async function loadJob(jobId: string) {
    const [j, p, r, apps] = await Promise.all([
      storage.getJob(jobId),
      storage.getProfile(),
      storage.getMasterResume(),
      storage.getApplications(),
    ])
    setJob(j ?? null)
    setProfile(p ?? null)
    setMasterResume(r ?? null)
    setApplications(apps)
  }

  function findDuplicateApplication(): Application | null {
    if (!job) return null
    return (
      applications.find(
        (a) =>
          a.company.toLowerCase() === job.company.toLowerCase() &&
          a.role.toLowerCase() === job.title.toLowerCase() &&
          a.status !== 'rejected',
      ) ?? null
    )
  }

  async function handleApplyClick(event: React.MouseEvent<HTMLAnchorElement>) {
    if (!job) return

    const href = getApplyHref(job)
    if (!href) {
      event.preventDefault()
      setApplyMessage('No application URL is available for this job. Use the listing links below.')
      return
    }

    const duplicate = !forceApply ? findDuplicateApplication() : null
    if (duplicate) {
      event.preventDefault()
      setDuplicateWarning(`Previous application on ${new Date(duplicate.appliedDate ?? duplicate.createdAt).toLocaleDateString()}`)
      return
    }

    const result = await trackJobApplication(job, { skipDuplicateCheck: forceApply })
    await loadJob(job.id)
    setDuplicateWarning(null)
    setForceApply(false)
    setApplyMessage(
      result.tracked
        ? 'Opened the company application page and tracked this application in HuntOS.'
        : 'Could not track application.',
    )
  }

  async function handleApplyAnyway() {
    if (!job) return
    setForceApply(true)
    setDuplicateWarning(null)
    const href = getApplyHref(job)
    if (href) window.open(href, '_blank', 'noopener,noreferrer')
    const result = await trackJobApplication(job, { skipDuplicateCheck: true })
    await loadJob(job.id)
    setForceApply(false)
    setApplyMessage(result.tracked ? 'Application page opened and tracked.' : 'Application page opened.')
  }

  if (!job) return <div className="p-8">Loading...</div>

  const rec = getRecommendation(job.matchScore ?? 0)
  const gaps = profile ? analyzeGaps(profile, job) : null
  const ats = profile && masterResume ? analyzeATSCompatibility(profile, masterResume, job) : null
  const applicationUrl = getApplyHref(job)

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

      <div className="flex flex-wrap gap-2">
        {applicationUrl ? (
          <a
            href={applicationUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={handleApplyClick}
            className="inline-flex h-9 items-center justify-center rounded-md bg-[var(--color-primary)] px-4 text-sm font-medium text-[var(--color-primary-foreground)] hover:opacity-90"
          >
            <ExternalLink size={16} className="mr-2" />
            Apply on company site
          </a>
        ) : (
          <Button disabled>Apply unavailable</Button>
        )}
        {applicationUrl && (
          <a href={applicationUrl} target="_blank" rel="noopener noreferrer">
            <Button variant="outline">Open application page</Button>
          </a>
        )}
        <Button variant="outline" onClick={() => storage.updateJob(job.id, { status: 'saved' }).then(() => loadJob(job.id))}>
          Save
        </Button>
        <Button variant="ghost" onClick={() => setShowMatch(!showMatch)}>
          {showMatch ? 'Hide' : 'Why ' + (job.matchScore ?? 0) + '%?'}
        </Button>
      </div>

      <p className="text-xs text-[var(--color-muted-foreground)]">
        HuntOS cannot submit applications on your behalf. Apply opens the real company or ATS page in a new tab and tracks the application locally.
      </p>

      {applyMessage && (
        <Card className="border-[var(--color-success)]/30 bg-[var(--color-success)]/5 p-4 text-sm">
          {applyMessage}
        </Card>
      )}

      {duplicateWarning && (
        <Card className="border-[var(--color-warning)] p-4 text-sm">
          ⚠ YOU MAY HAVE ALREADY APPLIED — {duplicateWarning}
          <div className="mt-3 flex flex-wrap gap-2">
            <Button size="sm" variant="outline" onClick={handleApplyAnyway}>
              Open application page anyway
            </Button>
            <Link to="/app/applications" className="inline-flex items-center text-sm underline">
              View applications
            </Link>
          </div>
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
        <CardHeader><CardTitle>Sources & application links</CardTitle></CardHeader>
        <CardContent>
          <JobSourceLinks job={job} />
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
