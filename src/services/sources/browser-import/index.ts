import type { HuntCriteria, RawJob, JobSourceConfig } from '@/types'
import type { JobSource } from '../job-source'
import { matchesCriteria } from '../fetch-client'

export const browserImportSource: JobSource = {
  id: 'browser-import',
  name: 'Browser Import',
  capabilities: { search: true, import: true, fetch: false },
  async search(criteria: HuntCriteria, config: JobSourceConfig): Promise<RawJob[]> {
    return config.browserImportQueue
      .filter((job) => job.discoveryMethod === 'imported' || job.discoveryMethod === 'fetched')
      .filter((job) => matchesCriteria(job, criteria))
  },
}

export function queueBrowserImport(config: JobSourceConfig, job: RawJob): JobSourceConfig {
  return {
    ...config,
    browserImportQueue: [...config.browserImportQueue, job],
  }
}

export function clearBrowserImportQueue(config: JobSourceConfig): JobSourceConfig {
  return { ...config, browserImportQueue: [] }
}
