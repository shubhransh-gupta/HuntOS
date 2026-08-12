import { useCallback, useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { storage } from '@/services/storage'
import { useAppStore } from '@/hooks/useAppStore'
import type { Job } from '@/types'
import { JobCard } from '@/components/jobs/JobCard'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { runHunt } from '@/features/hunt/HuntPipeline'
import type { HuntCompleteSummary } from '@/features/hunt/HuntPipeline'
import { SOURCE_LABELS } from '@/services/sources/registry'

export function HuntPage() {
  const [searchParams] = useSearchParams()
  const { huntProfiles, setIsHunting, isHunting } = useAppStore()
  const [jobs, setJobs] = useState<Job[]>([])
  const [summary, setSummary] = useState<HuntCompleteSummary | null>(null)
  const [minMatchScore, setMinMatchScore] = useState<number | undefined>(undefined)
  const [search, setSearch] = useState('')

  /**
   * A read started before a hunt saves its jobs still returns the older
   * snapshot, and if it resolves last it would replace the fresh list. Only
   * the most recently started read is allowed to publish.
   */
  const newestRead = useRef(0)

  const loadJobs = useCallback(async () => {
    const read = ++newestRead.current
    const data = await storage.getJobs(minMatchScore ? { minMatchScore } : undefined)
    if (read === newestRead.current) setJobs(data)
  }, [minMatchScore])

  const handleHunt = useCallback(async () => {
    const profile = huntProfiles.find((p) => p.isDefault) ?? huntProfiles[0]
    if (!profile) return
    setIsHunting(true)
    try {
      const result = await runHunt(profile)
      setSummary(result)
      await loadJobs()
    } finally {
      setIsHunting(false)
    }
  }, [huntProfiles, loadJobs, setIsHunting])

  useEffect(() => {
    loadJobs()
  }, [loadJobs])

  // Hunt profiles arrive asynchronously, so an auto-run has to wait for them
  // rather than silently giving up on an empty list.
  const autoRunStarted = useRef(false)
  useEffect(() => {
    if (autoRunStarted.current) return
    if (searchParams.get('run') !== 'true') return
    if (huntProfiles.length === 0) return
    autoRunStarted.current = true
    handleHunt()
  }, [searchParams, huntProfiles, handleHunt])

  async function handleSave(jobId: string) {
    await storage.updateJob(jobId, { status: 'saved' })
    await loadJobs()
  }

  const filtered = jobs.filter((j) => {
    if (!search) return true
    const q = search.toLowerCase()
    return j.title.toLowerCase().includes(q) || j.company.toLowerCase().includes(q)
  })

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Hunt</h1>
          <p className="text-sm text-[var(--color-muted-foreground)]">Discover and rank opportunities</p>
        </div>
        <Button onClick={handleHunt} disabled={isHunting}>
          {isHunting ? 'HUNTING...' : 'Hunt'}
        </Button>
      </div>

      {isHunting && (
        <div className="rounded-lg border border-[var(--color-border)] p-4 text-sm">
          <p className="font-medium">HUNTING...</p>
          <p className="text-[var(--color-muted-foreground)]">Searching configured sources</p>
          {(huntProfiles.find((p) => p.isDefault) ?? huntProfiles[0])?.sources.map((sourceId) => (
            <p key={sourceId}>✓ {SOURCE_LABELS[sourceId] ?? sourceId}</p>
          ))}
          <p className="mt-2 animate-pulse">Discovering... Normalizing... Deduplicating... Matching...</p>
        </div>
      )}

      {summary && !isHunting && (
        <div className="rounded-lg border border-[var(--color-success)]/30 bg-[var(--color-success)]/5 p-4 text-sm">
          <p className="font-semibold">HUNT COMPLETE</p>
          <p>{summary.discovered} jobs discovered</p>
          <p>{summary.duplicatesRemoved} duplicates removed</p>
          <p>{summary.relevant} relevant</p>
          <p>{summary.strongMatches} strong matches</p>
          <p>{summary.exceptionalMatches} exceptional matches</p>
          {summary.sourceResults.length > 0 && (
            <div className="mt-3 border-t border-[var(--color-border)] pt-3">
              <p className="font-medium">Sources</p>
              {summary.sourceResults.map((result) => (
                <p key={result.sourceId}>
                  {result.status === 'success' && `✓ ${result.sourceName}: ${result.jobs.length} jobs`}
                  {result.status === 'skipped' && `○ ${result.sourceName}: no matches`}
                  {result.status === 'error' && `⚠ ${result.sourceName}: ${result.error ?? 'unavailable'}`}
                </p>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="flex flex-wrap gap-3">
        <Input placeholder="Search jobs..." value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-xs" />
        <select
          className="rounded-md border border-[var(--color-border)] bg-transparent px-3 py-2 text-sm"
          value={minMatchScore ?? ''}
          onChange={(e) => setMinMatchScore(e.target.value ? parseInt(e.target.value) : undefined)}
        >
          <option value="">All matches</option>
          <option value="90">90%+</option>
          <option value="80">80%+</option>
          <option value="70">70%+</option>
        </select>
      </div>

      {filtered.length > 0 && (
        <p data-testid="hunt-result-count" className="text-sm text-[var(--color-muted-foreground)]">
          Showing {filtered.length} {filtered.length === 1 ? 'job' : 'jobs'}
          {minMatchScore ? ` scoring ${minMatchScore}% or higher` : ''}
          {search ? ` matching "${search}"` : ''}
        </p>
      )}

      <div className="space-y-3">
        {filtered.map((job) => (
          <JobCard key={job.id} job={job} onSave={() => handleSave(job.id)} />
        ))}
        {filtered.length === 0 && (
          <p className="text-center text-sm text-[var(--color-muted-foreground)]">No jobs yet. Run a hunt to get started.</p>
        )}
      </div>
    </div>
  )
}

export function TopMatchesPage() {
  const [jobs, setJobs] = useState<Job[]>([])

  useEffect(() => {
    storage.getJobs({ minMatchScore: 80 }).then(setJobs)
  }, [])

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-8">
      <h1 className="text-2xl font-bold">🔥 Top Matches</h1>
      <div className="space-y-3">
        {jobs.map((job) => (
          <JobCard key={job.id} job={job} />
        ))}
      </div>
    </div>
  )
}

export function RecentPage() {
  const [jobs, setJobs] = useState<Job[]>([])

  useEffect(() => {
    storage.getJobs().then((j) => setJobs(j.slice(0, 20)))
  }, [])

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-8">
      <h1 className="text-2xl font-bold">Recent</h1>
      <div className="space-y-3">
        {jobs.map((job) => (
          <JobCard key={job.id} job={job} compact />
        ))}
      </div>
    </div>
  )
}

export function SavedPage() {
  const [jobs, setJobs] = useState<Job[]>([])

  useEffect(() => {
    storage.getJobs({ status: ['saved'] }).then(setJobs)
  }, [])

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-8">
      <h1 className="text-2xl font-bold">Saved</h1>
      <div className="space-y-3">
        {jobs.map((job) => (
          <JobCard key={job.id} job={job} />
        ))}
        {jobs.length === 0 && <p className="text-sm text-[var(--color-muted-foreground)]">No saved jobs yet.</p>}
      </div>
    </div>
  )
}
