import { storage } from '@/services/storage'

export async function notifyExceptionalMatches(
  jobs: { title: string; company: string; matchScore?: number; postedAt?: string }[],
) {
  const settings = await storage.getSettings()
  if (!settings.notificationsEnabled || jobs.length === 0) return
  if (!('Notification' in window) || Notification.permission !== 'granted') return

  for (const job of jobs) {
    new Notification(`🔥 New ${job.matchScore}% match`, {
      body: `${job.title}\n${job.company}`,
      icon: '/favicon.svg',
    })
  }
}

export async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) return false
  if (Notification.permission === 'granted') return true
  if (Notification.permission === 'denied') return false
  const result = await Notification.requestPermission()
  return result === 'granted'
}
