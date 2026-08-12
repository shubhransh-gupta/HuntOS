import type { Job } from '@/types'
import { getRecommendation } from '@/types/matching'
import { formatPostedDate } from '@/services/matching/freshness'
import { Card, Badge } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Link } from 'react-router-dom'
import { cn } from '@/utils'

interface JobCardProps {
  job: Job
  compact?: boolean
  onSave?: () => void
  onApply?: () => void
}

export function JobCard({ job, compact, onSave, onApply }: JobCardProps) {
  const rec = getRecommendation(job.matchScore ?? 0)
  const strongSkills = job.skillMatches?.filter((s) => s.status === 'strong').slice(0, 4) ?? []
  const gaps = job.skillMatches?.filter((s) => s.status === 'missing' && s.importance !== 'nice-to-have').slice(0, 2) ?? []

  return (
    <Card className={cn('border-[var(--color-border)]/80 bg-[var(--color-card)]/75 backdrop-blur-md transition-colors hover:border-[var(--color-purple-glow)]/25', compact && 'p-3')}>
      <div className="flex items-start justify-between gap-4 p-4">
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex items-center gap-2">
            <span className="text-lg font-semibold">{rec.emoji} {job.matchScore ?? 0}%</span>
            <Badge variant={rec.recommendation === 'apply' ? 'success' : 'outline'}>{rec.label}</Badge>
          </div>
          <Link to={`/jobs/${job.id}`} className="block hover:underline">
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
          <Badge variant="outline" className="mt-2 capitalize">{job.discoveryMethod.replace('_', ' ')}</Badge>
        </div>
        {!compact && (
          <div className="flex shrink-0 flex-col gap-2">
            <Link to={`/jobs/${job.id}`}>
              <Button variant="outline" size="sm">View Match</Button>
            </Link>
            <Button size="sm" onClick={onApply}>Apply</Button>
            <Button variant="ghost" size="sm" onClick={onSave}>Save</Button>
          </div>
        )}
      </div>
    </Card>
  )
}
