import type { Job } from '@/types'
import { ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  getJobApplicationUrl,
  getJobListingUrl,
  getJobListings,
  getSourceDisplayName,
  normalizeExternalUrl,
} from '@/utils/job-urls'

export function JobSourceLinks({ job, showApply = true }: { job: Job; showApply?: boolean }) {
  const listings = getJobListings(job)
  const applicationUrl = getJobApplicationUrl(job)

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <p className="text-xs font-medium uppercase tracking-wide text-[var(--color-muted-foreground)]">
          Discovered from
        </p>
        {listings.map((listing) => {
          const listingUrl = getJobListingUrl(job, listing)
          if (!listingUrl) return null
          return (
            <a
              key={`${listing.source}-${listing.sourceUrl}`}
              href={normalizeExternalUrl(listingUrl)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 rounded-md border border-[var(--color-border)] px-3 py-2 text-sm hover:bg-[var(--color-bg-tertiary)]"
            >
              <ExternalLink size={14} className="shrink-0 text-[var(--color-accent)]" />
              <span>
                <span className="font-medium">{getSourceDisplayName(listing.source)}</span>
                <span className="mt-0.5 block truncate text-xs text-[var(--color-muted-foreground)]">
                  {normalizeExternalUrl(listingUrl)}
                </span>
              </span>
            </a>
          )
        })}
      </div>

      {showApply && applicationUrl && (
        <a href={normalizeExternalUrl(applicationUrl)} target="_blank" rel="noopener noreferrer">
          <Button variant="outline" size="sm" className="w-full sm:w-auto">
            <ExternalLink size={14} className="mr-2" />
            Open original application page
          </Button>
        </a>
      )}
    </div>
  )
}
