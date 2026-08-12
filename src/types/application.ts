export type ApplicationStatus =
  | 'saved'
  | 'to_apply'
  | 'applied'
  | 'oa'
  | 'interview'
  | 'final'
  | 'offer'
  | 'rejected'

export interface Application {
  id: string
  jobId?: string
  company: string
  role: string
  status: ApplicationStatus
  appliedDate?: string
  resumeVersionId?: string
  resumeVersionName?: string
  recruiter?: string
  notes?: string
  interviewDates?: string[]
  salary?: { amount?: number; currency?: string }
  source?: string
  createdAt: string
  updatedAt: string
}

export const APPLICATION_COLUMNS: { id: ApplicationStatus; label: string }[] = [
  { id: 'saved', label: 'Saved' },
  { id: 'to_apply', label: 'To Apply' },
  { id: 'applied', label: 'Applied' },
  { id: 'oa', label: 'OA' },
  { id: 'interview', label: 'Interview' },
  { id: 'final', label: 'Final' },
  { id: 'offer', label: 'Offer' },
  { id: 'rejected', label: 'Rejected' },
]
