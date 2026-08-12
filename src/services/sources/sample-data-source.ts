import type { JobSource } from './job-source'
import type { HuntCriteria, RawJob, JobSourceConfig } from '@/types'
import sampleJobs from '../../../sample-data/jobs.json'

export const sampleDataSource: JobSource = {
  id: 'sample-data',
  name: 'Sample Data',
  capabilities: { search: true, import: false, fetch: false },
  async search(criteria: HuntCriteria, _config: JobSourceConfig): Promise<RawJob[]> {
    let jobs = sampleJobs as RawJob[]

    if (criteria.excludedCompanies.length) {
      jobs = jobs.filter(
        (j) => !criteria.excludedCompanies.some((c) => j.company.toLowerCase().includes(c.toLowerCase())),
      )
    }

    if (criteria.postedWithinHours) {
      const cutoff = Date.now() - criteria.postedWithinHours * 3600000
      jobs = jobs.filter((j) => {
        const posted = j.postedAt ? new Date(j.postedAt).getTime() : Date.now()
        return posted >= cutoff || !j.postedAt
      })
    }

    return jobs
  },
}

export { parseManualJobJson } from './manual-import'
