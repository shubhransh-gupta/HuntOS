import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { storage } from '@/services/storage'
import { useAppStore } from '@/hooks/useAppStore'
import { getGreeting } from '@/utils'
import { getAverageMatchScore } from '@/services/matching/matching-engine'
import { RECOMMENDATION_THRESHOLDS } from '@/types/matching'
import type { Job, HuntRun, Application, MasterResume } from '@/types'
import { JobCard } from '@/components/jobs/JobCard'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/label'
import { runHunt } from '@/features/hunt/HuntPipeline'

export function DashboardPage() {
  const { profile, huntProfiles, isHunting, setIsHunting } = useAppStore()
  const [jobs, setJobs] = useState<Job[]>([])
  const [lastHunt, setLastHunt] = useState<HuntRun | null>(null)
  const [applications, setApplications] = useState<Application[]>([])
  const [masterResume, setMasterResume] = useState<MasterResume | null>(null)

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    const [allJobs, runs, apps, resume] = await Promise.all([
      storage.getJobs(),
      storage.getHuntRuns(),
      storage.getApplications(),
      storage.getMasterResume(),
    ])
    setJobs(allJobs)
    setLastHunt(runs[0] ?? null)
    setApplications(apps)
    setMasterResume(resume ?? null)
  }

  async function handleHunt() {
    const activeProfile = huntProfiles.find((p) => p.isDefault) ?? huntProfiles[0]
    if (!activeProfile) return
    setIsHunting(true)
    try {
      await runHunt(activeProfile)
      await loadData()
    } finally {
      setIsHunting(false)
    }
  }

  const exceptional = jobs.filter((j) => (j.matchScore ?? 0) >= RECOMMENDATION_THRESHOLDS.apply).slice(0, 3)
  const good = jobs
    .filter((j) => (j.matchScore ?? 0) >= RECOMMENDATION_THRESHOLDS.strong && (j.matchScore ?? 0) < RECOMMENDATION_THRESHOLDS.apply)
    .slice(0, 4)
  const followUps = applications.filter((a) => {
    if (a.status !== 'applied' || !a.appliedDate) return false
    const days = (Date.now() - new Date(a.appliedDate).getTime()) / 86400000
    return days >= 7
  })
  const savedCount = jobs.filter((j) => j.status === 'saved').length

  return (
    <div className="mx-auto max-w-5xl space-y-8 p-8">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">HUNTOS</h1>
          <p className="text-[var(--color-muted-foreground)]">
            {getGreeting()}, {profile?.name?.split(' ')[0] ?? 'Hunter'}.
          </p>
          <p className="text-sm font-medium">Your hunt is ready.</p>
          {lastHunt && (
            <p className="text-xs text-[var(--color-muted-foreground)]">
              Last hunt: {new Date(lastHunt.completedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </p>
          )}
        </div>
        <Button onClick={handleHunt} disabled={isHunting || huntProfiles.length === 0}>
          {isHunting ? 'Hunting...' : 'Hunt'}
        </Button>
      </div>

      <section>
        <h2 className="mb-4 text-lg font-semibold">🔥 {exceptional.length} APPLY NOW</h2>
        {exceptional.length === 0 ? (
          <Card className="p-6 text-center text-sm text-[var(--color-muted-foreground)]">
            Run a hunt to discover exceptional matches.
          </Card>
        ) : (
          <div className="space-y-3">
            {exceptional.map((job) => (
              <JobCard key={job.id} job={job} compact />
            ))}
          </div>
        )}
      </section>

      {good.length > 0 && (
        <section>
          <h2 className="mb-4 text-lg font-semibold">⚡ {good.length} GOOD MATCHES</h2>
          <div className="space-y-3">
            {good.map((job) => (
              <JobCard key={job.id} job={job} compact />
            ))}
          </div>
        </section>
      )}

      <Separator />

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>📌 YOUR HUNT</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            <p>{lastHunt?.discovered ?? 0} discovered</p>
            <p>{lastHunt?.relevant ?? 0} relevant</p>
            <p>{lastHunt?.strongMatches ?? 0} strong</p>
            <p>{lastHunt?.exceptionalMatches ?? 0} exceptional</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>📄 RESUME</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            <p>Master Resume v{masterResume?.version ?? 1}</p>
            <p>Average match: {getAverageMatchScore(jobs)}%</p>
            <Link to="/resumes/master" className="text-xs underline">View master resume</Link>
          </CardContent>
        </Card>
      </div>

      {(followUps.length > 0 || savedCount > 0) && (
        <Card>
          <CardHeader>
            <CardTitle>⚡ NEEDS ATTENTION</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            {followUps.length > 0 && <p>{followUps.length} applications need follow-up</p>}
            {savedCount > 0 && <p>{savedCount} saved jobs</p>}
            <Link to="/applications" className="text-xs underline">View applications</Link>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
