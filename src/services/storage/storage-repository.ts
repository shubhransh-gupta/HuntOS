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
  JobFilters,
} from '@/types'
import { defaultSourceConfig } from '@/types/source-config'
import { DEFAULT_HUNT_SOURCES } from '@/services/sources/default-sources'
import { db } from './database'
import { generateId } from '@/utils'

const SETTINGS_ID = 'app-settings'

const defaultSettings: AppSettings = {
  id: SETTINGS_ID,
  onboardingComplete: false,
  theme: 'dark',
  ai: {
    provider: 'openai',
    model: 'gpt-4o-mini',
    apiKey: '',
    baseUrl: '',
  },
  notificationsEnabled: false,
  sourceConfig: defaultSourceConfig,
}

export interface StorageRepository {
  getSettings(): Promise<AppSettings>
  saveSettings(settings: Partial<AppSettings>): Promise<AppSettings>
  getProfile(): Promise<MasterProfile | undefined>
  saveProfile(profile: MasterProfile): Promise<void>
  getMasterResume(): Promise<MasterResume | undefined>
  saveMasterResume(resume: MasterResume): Promise<void>
  getHuntProfiles(): Promise<HuntProfile[]>
  saveHuntProfile(profile: HuntProfile): Promise<void>
  deleteHuntProfile(id: string): Promise<void>
  getJobs(filters?: JobFilters): Promise<Job[]>
  getJob(id: string): Promise<Job | undefined>
  saveJobs(jobs: Job[]): Promise<void>
  deleteJobs(ids: string[]): Promise<void>
  updateJob(id: string, updates: Partial<Job>): Promise<void>
  getApplications(): Promise<Application[]>
  saveApplication(app: Application): Promise<void>
  updateApplication(id: string, updates: Partial<Application>): Promise<void>
  deleteApplication(id: string): Promise<void>
  getHuntRuns(): Promise<HuntRun[]>
  saveHuntRun(run: HuntRun): Promise<void>
  getResumeVersions(): Promise<ResumeVersion[]>
  saveResumeVersion(version: ResumeVersion): Promise<void>
  getNotes(jobId?: string, applicationId?: string): Promise<Note[]>
  saveNote(note: Note): Promise<void>
  exportAll(): Promise<Record<string, unknown>>
  deleteAll(): Promise<void>
}

class DexieStorageRepository implements StorageRepository {
  async getSettings(): Promise<AppSettings> {
    const existing = await db.settings.get(SETTINGS_ID)
    if (existing) {
      return {
        ...defaultSettings,
        ...existing,
        sourceConfig: { ...defaultSourceConfig, ...existing.sourceConfig },
      }
    }
    await db.settings.put(defaultSettings)
    return defaultSettings
  }

  async saveSettings(settings: Partial<AppSettings>): Promise<AppSettings> {
    const current = await this.getSettings()
    const updated = { ...current, ...settings, id: SETTINGS_ID }
    await db.settings.put(updated)
    return updated
  }

  async getProfile(): Promise<MasterProfile | undefined> {
    return db.profile.toCollection().first()
  }

  async saveProfile(profile: MasterProfile): Promise<void> {
    await db.profile.put(profile)
  }

  async getMasterResume(): Promise<MasterResume | undefined> {
    return db.masterResume.toCollection().first()
  }

  async saveMasterResume(resume: MasterResume): Promise<void> {
    await db.masterResume.put(resume)
  }

  async getHuntProfiles(): Promise<HuntProfile[]> {
    const profiles = await db.huntProfiles.toArray()
    return Promise.all(profiles.map((profile) => this.migrateSources(profile)))
  }

  /**
   * Hunts used to run against bundled demo jobs. Profiles saved back then still
   * list that source and none of the live feeds, so they would keep returning
   * fake postings. Swap them over once, and persist it so this only happens on
   * the first read.
   *
   * Their week-long freshness window is widened at the same time: it was
   * chosen when results came from a file that was always current, and against
   * real company boards it hides most of what is out there.
   */
  private async migrateSources(profile: HuntProfile): Promise<HuntProfile> {
    if (!profile.sources.includes('sample-data')) return profile

    const migrated: HuntProfile = {
      ...profile,
      sources: [
        ...new Set([...profile.sources.filter((s) => s !== 'sample-data'), ...DEFAULT_HUNT_SOURCES]),
      ],
      postedWithinHours: profile.postedWithinHours === 24 * 7 ? 24 * 30 : profile.postedWithinHours,
    }
    await db.huntProfiles.put(migrated)
    return migrated
  }

  async saveHuntProfile(profile: HuntProfile): Promise<void> {
    if (profile.isDefault) {
      const all = await this.getHuntProfiles()
      await Promise.all(
        all
          .filter((p) => p.id !== profile.id && p.isDefault)
          .map((p) => db.huntProfiles.put({ ...p, isDefault: false })),
      )
    }
    await db.huntProfiles.put(profile)
  }

  async deleteHuntProfile(id: string): Promise<void> {
    await db.huntProfiles.delete(id)
  }

  async getJobs(filters?: JobFilters): Promise<Job[]> {
    let jobs = await db.jobs.orderBy('matchScore').reverse().toArray()

    if (filters?.minMatchScore) {
      jobs = jobs.filter((j) => (j.matchScore ?? 0) >= filters.minMatchScore!)
    }
    if (filters?.postedWithinHours) {
      const cutoff = Date.now() - filters.postedWithinHours * 3600000
      jobs = jobs.filter((j) => {
        const posted = j.postedAt ? new Date(j.postedAt).getTime() : new Date(j.discoveredAt).getTime()
        return posted >= cutoff
      })
    }
    if (filters?.locations?.length) {
      jobs = jobs.filter((j) =>
        filters.locations!.some((loc) => j.location.toLowerCase().includes(loc.toLowerCase())),
      )
    }
    if (filters?.remoteTypes?.length) {
      jobs = jobs.filter((j) => filters.remoteTypes!.includes(j.remoteType))
    }
    if (filters?.status?.length) {
      jobs = jobs.filter((j) => filters.status!.includes(j.status))
    }
    if (filters?.sources?.length) {
      jobs = jobs.filter((j) => filters.sources!.includes(j.source))
    }
    if (filters?.discoveryMethods?.length) {
      jobs = jobs.filter((j) => filters.discoveryMethods!.includes(j.discoveryMethod))
    }
    if (filters?.minSalary) {
      jobs = jobs.filter((j) => !j.salary?.min || j.salary.min >= filters.minSalary!)
    }

    return jobs
  }

  async getJob(id: string): Promise<Job | undefined> {
    return db.jobs.get(id)
  }

  async saveJobs(jobs: Job[]): Promise<void> {
    await db.jobs.bulkPut(jobs)
  }

  async deleteJobs(ids: string[]): Promise<void> {
    if (ids.length === 0) return
    await db.jobs.bulkDelete(ids)
  }

  async updateJob(id: string, updates: Partial<Job>): Promise<void> {
    const job = await db.jobs.get(id)
    if (job) await db.jobs.put({ ...job, ...updates })
  }

  async getApplications(): Promise<Application[]> {
    return db.applications.orderBy('updatedAt').reverse().toArray()
  }

  async saveApplication(app: Application): Promise<void> {
    await db.applications.put(app)
  }

  async updateApplication(id: string, updates: Partial<Application>): Promise<void> {
    const app = await db.applications.get(id)
    if (app) await db.applications.put({ ...app, ...updates, updatedAt: new Date().toISOString() })
  }

  async deleteApplication(id: string): Promise<void> {
    await db.applications.delete(id)
  }

  async getHuntRuns(): Promise<HuntRun[]> {
    return db.huntRuns.orderBy('completedAt').reverse().toArray()
  }

  async saveHuntRun(run: HuntRun): Promise<void> {
    await db.huntRuns.put(run)
  }

  async getResumeVersions(): Promise<ResumeVersion[]> {
    return db.resumeVersions.orderBy('createdAt').reverse().toArray()
  }

  async saveResumeVersion(version: ResumeVersion): Promise<void> {
    await db.resumeVersions.put(version)
  }

  async getNotes(jobId?: string, applicationId?: string): Promise<Note[]> {
    if (jobId) return db.notes.where('jobId').equals(jobId).toArray()
    if (applicationId) return db.notes.where('applicationId').equals(applicationId).toArray()
    return db.notes.toArray()
  }

  async saveNote(note: Note): Promise<void> {
    await db.notes.put(note)
  }

  async exportAll(): Promise<Record<string, unknown>> {
    const settingsRows = await db.settings.toArray()
    const resumes = await db.masterResume.toArray()
    return {
      exportedAt: new Date().toISOString(),
      profile: await db.profile.toArray(),
      // The uploaded file's bytes cannot be represented in JSON; the export
      // records that one exists and keeps the extracted text.
      masterResume: resumes.map(({ originalFile, ...resume }) => ({
        ...resume,
        originalFileName: originalFile?.name,
      })),
      resumeVersions: await db.resumeVersions.toArray(),
      huntProfiles: await db.huntProfiles.toArray(),
      jobs: await db.jobs.toArray(),
      applications: await db.applications.toArray(),
      huntRuns: await db.huntRuns.toArray(),
      settings: settingsRows.map((row) => ({
        ...row,
        ai: {
          ...row.ai,
          apiKey: row.ai.apiKey ? '[REDACTED — stored only in this browser]' : '',
        },
      })),
      notes: await db.notes.toArray(),
    }
  }

  async deleteAll(): Promise<void> {
    await Promise.all([
      db.profile.clear(),
      db.masterResume.clear(),
      db.resumeVersions.clear(),
      db.huntProfiles.clear(),
      db.jobs.clear(),
      db.applications.clear(),
      db.huntRuns.clear(),
      db.notes.clear(),
    ])
    await db.settings.put(defaultSettings)
  }
}

export const storage = new DexieStorageRepository()

/**
 * Intentionally free of roles, locations and keywords. Those describe a
 * specific person, so they must come from the user's resume or their own
 * input — never from a built-in example.
 */
export async function createDefaultHuntProfile(): Promise<HuntProfile> {
  const now = new Date().toISOString()
  return {
    id: generateId(),
    name: 'My hunt',
    emoji: '🔥',
    roles: [],
    experienceMin: 0,
    experienceMax: 40,
    locations: [],
    remoteTypes: ['remote', 'hybrid', 'onsite'],
    jobTypes: ['full-time'],
    // Company boards refresh postings slowly; a week hides most of them.
    postedWithinHours: 24 * 30,
    excludedCompanies: [],
    keywords: [],
    sources: [...DEFAULT_HUNT_SOURCES],
    isDefault: true,
    createdAt: now,
    updatedAt: now,
  }
}
