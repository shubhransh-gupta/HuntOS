export type DiscoveryMethod = 'discovered' | 'imported' | 'fetched' | 'user_added'
export type RemoteType = 'remote' | 'hybrid' | 'onsite' | 'unknown'
export type EmploymentType = 'full-time' | 'part-time' | 'contract' | 'internship' | 'unknown'
export type JobStatus = 'new' | 'saved' | 'applied' | 'archived'
export type Recommendation = 'apply' | 'strong' | 'maybe' | 'low'

export interface JobSourceListing {
  source: string
  sourceUrl: string
  applicationUrl?: string
  discoveredAt: string
  discoveryMethod: DiscoveryMethod
}

export interface JobRequirements {
  required: string[]
  preferred: string[]
  responsibilities: string[]
  niceToHave: string[]
}

export interface Job {
  id: string
  source: string
  sourceUrl: string
  company: string
  title: string
  location: string
  remoteType: RemoteType
  employmentType: EmploymentType
  salary?: { min?: number; max?: number; currency?: string }
  experienceMin?: number
  experienceMax?: number
  postedAt?: string
  discoveredAt: string
  description: string
  responsibilities: string[]
  requirements: JobRequirements
  skills: string[]
  technologies: string[]
  industry?: string
  applicationUrl: string
  matchScore?: number
  matchBreakdown?: import('./matching').MatchBreakdown
  skillMatches?: import('./matching').SkillMatch[]
  recommendation?: Recommendation
  status: JobStatus
  discoveryMethod: DiscoveryMethod
  foundOn: JobSourceListing[]
  primaryApplicationUrl?: string
  isStale?: boolean
  postingDateUnavailable?: boolean
  canonicalId?: string
}

export interface RawJob {
  source: string
  sourceUrl: string
  company: string
  title: string
  location: string
  remoteType?: RemoteType
  employmentType?: EmploymentType
  salary?: { min?: number; max?: number; currency?: string }
  experienceMin?: number
  experienceMax?: number
  postedAt?: string
  description: string
  applicationUrl?: string
  discoveryMethod: DiscoveryMethod
  skills?: string[]
  technologies?: string[]
  industry?: string
}

export interface JobFilters {
  postedWithinHours?: number
  minMatchScore?: number
  locations?: string[]
  remoteTypes?: RemoteType[]
  experienceMin?: number
  experienceMax?: number
  minSalary?: number
  sources?: string[]
  discoveryMethods?: DiscoveryMethod[]
  status?: JobStatus[]
}
