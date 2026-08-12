import type { HuntCriteria, RawJob, JobSourceConfig } from '@/types'
import type { JobSource } from '../job-source'
import {
  extractGreenhouseBoardFromCareerUrl,
  extractLeverCompanyFromCareerUrl,
} from '../url-detector'
import { greenhouseSource } from '../greenhouse'
import { leverSource } from '../lever'

export const companyCareersSource: JobSource = {
  id: 'company-careers',
  name: 'Company Careers',
  capabilities: { search: true, import: false, fetch: true },
  async search(criteria: HuntCriteria, config: JobSourceConfig): Promise<RawJob[]> {
    const urls = [...new Set(config.companyCareerUrls.map((u) => u.trim()).filter(Boolean))]
    if (urls.length === 0) return []

    const greenhouseBoards = new Set<string>(config.greenhouseBoards)
    const leverCompanies = new Set<string>(config.leverCompanies)

    for (const url of urls) {
      const gh = extractGreenhouseBoardFromCareerUrl(url)
      if (gh) greenhouseBoards.add(gh)
      const lever = extractLeverCompanyFromCareerUrl(url)
      if (lever) leverCompanies.add(lever)
    }

    const mergedConfig: JobSourceConfig = {
      ...config,
      greenhouseBoards: [...greenhouseBoards],
      leverCompanies: [...leverCompanies],
    }

    const [greenhouseJobs, leverJobs] = await Promise.all([
      greenhouseSource.search(criteria, mergedConfig),
      leverSource.search(criteria, mergedConfig),
    ])

    return [...greenhouseJobs, ...leverJobs]
  },
}
