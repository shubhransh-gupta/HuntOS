import { storage } from '@/services/storage'
import { fuzzyMatch } from '@/utils'
import type { Application } from '@/types'

export async function checkDuplicateApplication(
  company: string,
  title: string,
): Promise<Application | null> {
  const apps = await storage.getApplications()
  return (
    apps.find(
      (a) =>
        fuzzyMatch(a.company, company) &&
        fuzzyMatch(a.role, title) &&
        a.status !== 'rejected',
    ) ?? null
  )
}
