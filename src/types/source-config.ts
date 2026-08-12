import type { RawJob } from './job'

export interface JobSourceConfig {
  greenhouseBoards: string[]
  leverCompanies: string[]
  publicJobUrls: string[]
  companyCareerUrls: string[]
  browserImportQueue: RawJob[]
}

export const defaultSourceConfig: JobSourceConfig = {
  greenhouseBoards: [],
  leverCompanies: [],
  publicJobUrls: [],
  companyCareerUrls: [],
  browserImportQueue: [],
}

export interface SourceSearchResult {
  sourceId: string
  sourceName: string
  jobs: RawJob[]
  error?: string
  status: 'success' | 'skipped' | 'error' | 'unavailable'
}
