export interface WorkExperience {
  company: string
  role: string
  startDate?: string
  endDate?: string
  description?: string
  achievements?: string[]
  technologies?: string[]
}

export interface Education {
  institution: string
  degree?: string
  field?: string
  startDate?: string
  endDate?: string
}

export interface Project {
  name: string
  description?: string
  technologies?: string[]
  url?: string
}

export interface MasterProfile {
  id: string
  name: string
  email?: string
  phone?: string
  location?: string
  linkedIn?: string
  github?: string
  portfolio?: string
  headline?: string
  totalExperienceYears: number
  companies: string[]
  roles: string[]
  skills: string[]
  technologies: string[]
  achievements: string[]
  education: Education[]
  certifications: string[]
  industries: string[]
  projects: Project[]
  workExperience: WorkExperience[]
  updatedAt: string
}

export interface MasterResume {
  id: string
  version: number
  rawText: string
  sections: Record<string, string>
  updatedAt: string
}
