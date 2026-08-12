import { useEffect, useState } from 'react'
import { storage } from '@/services/storage'
import type { MasterProfile } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/input'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'

export function ProfilePage() {
  const [profile, setProfile] = useState<MasterProfile | null>(null)

  useEffect(() => {
    storage.getProfile().then((p) => setProfile(p ?? null))
  }, [])

  async function save() {
    if (!profile) return
    await storage.saveProfile({ ...profile, updatedAt: new Date().toISOString() })
  }

  if (!profile) return <div className="p-8">No profile yet. Complete onboarding first.</div>

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-8">
      <h1 className="text-2xl font-bold">Your Profile</h1>
      <Card>
        <CardHeader>
          <CardTitle>{profile.name}</CardTitle>
          <p className="text-sm text-[var(--color-muted-foreground)]">
            {profile.headline} • ~{profile.totalExperienceYears} years experience
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {(['name', 'email', 'phone', 'location', 'headline'] as const).map((field) => (
            <div key={field}>
              <label className="text-xs font-medium capitalize">{field}</label>
              <Input
                value={profile[field] ?? ''}
                onChange={(e) => setProfile({ ...profile, [field]: e.target.value })}
              />
            </div>
          ))}
          <div>
            <label className="text-xs font-medium">Core Skills</label>
            <Textarea
              rows={3}
              value={profile.skills.join(', ')}
              onChange={(e) => setProfile({ ...profile, skills: e.target.value.split(',').map((s) => s.trim()) })}
            />
          </div>
          <div>
            <label className="text-xs font-medium">Industries</label>
            <Input
              value={profile.industries.join(', ')}
              onChange={(e) => setProfile({ ...profile, industries: e.target.value.split(',').map((s) => s.trim()) })}
            />
          </div>
          <Button onClick={save}>Save Profile</Button>
        </CardContent>
      </Card>
    </div>
  )
}
