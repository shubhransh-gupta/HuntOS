import type { HuntCriteria, RawJob, JobSourceConfig } from '@/types'

export interface SourceCapabilities {
  search: boolean
  import: boolean
  fetch: boolean
}

export interface JobSource {
  id: string
  name: string
  capabilities: SourceCapabilities
  search(criteria: HuntCriteria, config: JobSourceConfig): Promise<RawJob[]>
}

export type { HuntCriteria }
