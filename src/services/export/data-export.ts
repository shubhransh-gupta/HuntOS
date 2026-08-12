import type { Job, Application } from '@/types'

export function exportJobsCsv(jobs: Job[]): string {
  const headers = ['title', 'company', 'location', 'matchScore', 'recommendation', 'source', 'postedAt', 'applicationUrl']
  const rows = jobs.map((j) =>
    headers.map((h) => {
      const val = j[h as keyof Job]
      return `"${String(val ?? '').replace(/"/g, '""')}"`
    }).join(','),
  )
  return [headers.join(','), ...rows].join('\n')
}

export function exportApplicationsCsv(apps: Application[]): string {
  const headers = ['company', 'role', 'status', 'appliedDate', 'source']
  const rows = apps.map((a) =>
    headers.map((h) => `"${String(a[h as keyof Application] ?? '').replace(/"/g, '""')}"`).join(','),
  )
  return [headers.join(','), ...rows].join('\n')
}

export function exportJobsJson(jobs: Job[]): string {
  return JSON.stringify(jobs, null, 2)
}
