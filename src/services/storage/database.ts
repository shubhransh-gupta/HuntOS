import Dexie, { type EntityTable } from 'dexie'
import type {
  MasterProfile,
  MasterResume,
  HuntProfile,
  Job,
  Application,
  AppSettings,
  HuntRun,
  ResumeVersion,
  Note,
} from '@/types'

export class HuntOSDatabase extends Dexie {
  profile!: EntityTable<MasterProfile, 'id'>
  masterResume!: EntityTable<MasterResume, 'id'>
  resumeVersions!: EntityTable<ResumeVersion, 'id'>
  huntProfiles!: EntityTable<HuntProfile, 'id'>
  jobs!: EntityTable<Job, 'id'>
  applications!: EntityTable<Application, 'id'>
  huntRuns!: EntityTable<HuntRun, 'id'>
  settings!: EntityTable<AppSettings, 'id'>
  notes!: EntityTable<Note, 'id'>

  constructor() {
    super('HuntOS')
    this.version(1).stores({
      profile: 'id',
      masterResume: 'id',
      resumeVersions: 'id, jobId, createdAt',
      huntProfiles: 'id, isDefault',
      jobs: 'id, company, matchScore, status, discoveredAt, postedAt, recommendation',
      applications: 'id, jobId, status, company, updatedAt',
      huntRuns: 'id, huntProfileId, completedAt',
      settings: 'id',
      notes: 'id, jobId, applicationId',
    })
  }
}

export const db = new HuntOSDatabase()
