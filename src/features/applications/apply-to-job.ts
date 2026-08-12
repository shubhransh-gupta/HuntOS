import { storage } from '@/services/storage'
import type { Application, Job } from '@/types'
import { generateId } from '@/utils'
import { getJobApplicationUrl, normalizeExternalUrl } from '@/utils/job-urls'
import { checkDuplicateApplication } from './duplicate-check'

export type ApplyToJobResult = {
  applicationUrl: string | null
  duplicate: Application | null
  tracked: boolean
}

export function getApplyHref(job: Job): string | null {
  const applicationUrl = getJobApplicationUrl(job)
  return applicationUrl ? normalizeExternalUrl(applicationUrl) : null
}

export async function trackJobApplication(
  job: Job,
  options?: { skipDuplicateCheck?: boolean },
): Promise<ApplyToJobResult> {
  const applicationUrl = getJobApplicationUrl(job)
  const normalizedUrl = applicationUrl ? normalizeExternalUrl(applicationUrl) : null

  const duplicate = options?.skipDuplicateCheck
    ? null
    : await checkDuplicateApplication(job.company, job.title)

  if (duplicate) {
    return { applicationUrl: normalizedUrl, duplicate, tracked: false }
  }

  await storage.saveApplication({
    id: generateId(),
    jobId: job.id,
    company: job.company,
    role: job.title,
    status: 'applied',
    appliedDate: new Date().toISOString(),
    source: job.source,
    applicationUrl: normalizedUrl ?? undefined,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  })
  await storage.updateJob(job.id, { status: 'applied' })

  return { applicationUrl: normalizedUrl, duplicate: null, tracked: true }
}

/** @deprecated Use getApplyHref + trackJobApplication for reliable new-tab opens */
export async function applyToJob(job: Job, options?: { skipDuplicateCheck?: boolean }): Promise<ApplyToJobResult> {
  const href = getApplyHref(job)
  if (href) window.open(href, '_blank', 'noopener,noreferrer')
  return trackJobApplication(job, options)
}
