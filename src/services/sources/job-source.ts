import type { HuntCriteria, RawJob } from '@/types'

export interface SourceCapabilities {
  search: boolean
  import: boolean
  fetch: boolean
}

export interface JobSource {
  id: string
  name: string
  capabilities: SourceCapabilities
  search(criteria: HuntCriteria): Promise<RawJob[]>
}

export type { HuntCriteria }
