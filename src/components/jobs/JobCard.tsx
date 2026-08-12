import { useState } from 'react'
import type { Job } from '@/types'
import { getRecommendation } from '@/types/matching'
import { formatPostedDate } from '@/services/matching/freshness'
import { Card, Badge } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Link } from 'react-router-dom'
import { ExternalLink } from 'lucide-react'
import { cn, isTagLike } from '@/utils'
import { getApplyHref, trackJobApplication } from '@/features/applications/apply-to-job'
import { getJobListingUrl, getSourceDisplayName, normalizeExternalUrl } from '@/utils/job-urls'

interface JobCardProps {
  job: Job
  compact?: boolean
  onSave?: () => void
  onApply?: () => void
}

export function JobCard({ job, compact, onSave, onApply }: JobCardProps) {
  const rec = getRecommendation(job.matchScore ?? 0)
  // Requirement bullets share a field with skill names, so only the entries
  // that read like a tag belong on a card. The rest are full sentences and
  // live on the job's own page.
  const strongSkills = (job.skillMatches ?? [])
    .filter((s) => s.status === 'strong' && isTagLike(s.skill))
    .slice(0, 4)
  const gaps = (job.skillMatches ?? [])
    .filter((s) => s.status === 'missing' && s.importance !== 'nice-to-have' && isTagLike(s.skill))
    .slice(0, 2)
  const [applyNote, setApplyNote] = useState<string | null>(null)
  const listingUrl = getJobListingUrl(job)
  const applyHref = getApplyHref(job)

  async function handleApplyClick() {
    if (!applyHref) {
      setApplyNote('No apply URL — open job details to see listing links.')
      return
    }

    const result = await trackJobApplication(job)
    if (result.duplicate) {
      setApplyNote('Already tracked — opening application page anyway.')
    } else {
      setApplyNote('Opening application page in a new tab.')
      onApply?.()
    }
  }

  return (
    <Card className={cn('border-[var(--color-border)]/80 bg-[var(--color-card)]/75 backdrop-blur-md transition-colors hover:border-[var(--color-purple-glow)]/25', compact && 'p-3')}>
      <div className="flex items-start justify-between gap-4 p-4">
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex items-center gap-2">
            <span className="text-lg font-semibold">{rec.emoji} {job.matchScore ?? 0}%</span>
            <Badge variant={rec.recommendation === 'apply' ? 'success' : 'outline'}>{rec.label}</Badge>
          </div>
          <Link to={`/app/jobs/${job.id}`} className="block hover:underline">
            <h3 className="font-semibold">{job.title}</h3>
            <p className="text-sm text-[var(--color-muted-foreground)]">{job.company}</p>
          </Link>
          <p className="mt-1 text-xs text-[var(--color-muted-foreground)]">
            {job.location} • {job.remoteType} • {formatPostedDate(job)}
          </p>
          <div className="mt-2 flex flex-wrap gap-1">
            {strongSkills.map((s) => (
              <Badge key={s.skill} variant="success">{s.skill} ✓</Badge>
            ))}
            {gaps.map((s) => (
              <Badge key={s.skill} variant="warning">⚠ {s.skill}</Badge>
            ))}
          </div>
          {job.isStale && (
            <p className="mt-2 text-xs text-[var(--color-warning)]">⚠ Possibly stale — discovered over 14 days ago</p>
          )}
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <Badge variant="outline" className="capitalize">{getSourceDisplayName(job.source)}</Badge>
            {listingUrl && (
              <a
                href={normalizeExternalUrl(listingUrl)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-[var(--color-accent)] hover:underline"
                onClick={(e) => e.stopPropagation()}
              >
                <ExternalLink size={12} />
                View listing
              </a>
            )}
          </div>
          {applyNote && <p className="mt-2 text-xs text-[var(--color-muted-foreground)]">{applyNote}</p>}
        </div>
        <div className="flex shrink-0 flex-col gap-2">
          {!compact && (
            <Link to={`/app/jobs/${job.id}`}>
              <Button variant="outline" size="sm">View Match</Button>
            </Link>
          )}
          {applyHref ? (
            <a
              href={applyHref}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => { void handleApplyClick() }}
              className={cn(
                'inline-flex items-center justify-center rounded-md bg-[var(--color-primary)] text-[var(--color-primary-foreground)] hover:opacity-90',
                compact ? 'h-8 px-3 text-xs' : 'h-8 px-3 text-xs',
              )}
            >
              <ExternalLink size={14} className="mr-1" />
              Apply
            </a>
          ) : (
            <Link to={`/app/jobs/${job.id}`}>
              <Button size="sm" variant="secondary">Details</Button>
            </Link>
          )}
          {!compact && onSave && (
            <Button variant="ghost" size="sm" onClick={onSave}>Save</Button>
          )}
        </div>
      </div>
    </Card>
  )
}
