import { useEffect, useState } from 'react'
import { storage, createDefaultHuntProfile } from '@/services/storage'
import type { HuntProfile } from '@/types'
import { generateId } from '@/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'

export function HuntProfilesPage() {
  const [profiles, setProfiles] = useState<HuntProfile[]>([])

  useEffect(() => {
    load()
  }, [])

  async function load() {
    setProfiles(await storage.getHuntProfiles())
  }

  async function addProfile() {
    const base = await createDefaultHuntProfile()
    const profile: HuntProfile = {
      ...base,
      id: generateId(),
      name: 'New Hunt Profile',
      emoji: '🎯',
      isDefault: profiles.length === 0,
    }
    await storage.saveHuntProfile(profile)
    await load()
  }

  async function deleteProfile(id: string) {
    await storage.deleteHuntProfile(id)
    await load()
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Hunt Profiles</h1>
        <Button onClick={addProfile}>Add Profile</Button>
      </div>
      <div className="space-y-4">
        {profiles.map((p) => (
          <HuntProfileCard key={p.id} profile={p} onUpdate={load} onDelete={() => deleteProfile(p.id)} />
        ))}
        {profiles.length === 0 && (
          <p className="text-sm text-[var(--color-muted-foreground)]">Create a hunt profile to start hunting.</p>
        )}
      </div>
    </div>
  )
}

function HuntProfileCard({
  profile,
  onUpdate,
  onDelete,
}: {
  profile: HuntProfile
  onUpdate: () => void
  onDelete: () => void
}) {
  const [edit, setEdit] = useState(profile)

  async function save() {
    await storage.saveHuntProfile({ ...edit, updatedAt: new Date().toISOString() })
    onUpdate()
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{profile.emoji} {profile.name}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Input value={edit.name} onChange={(e) => setEdit({ ...edit, name: e.target.value })} />
        <Input value={edit.roles.join(', ')} onChange={(e) => setEdit({ ...edit, roles: e.target.value.split(',').map((r) => r.trim()) })} placeholder="Roles" />
        <Input value={edit.locations.join(', ')} onChange={(e) => setEdit({ ...edit, locations: e.target.value.split(',').map((l) => l.trim()) })} placeholder="Locations" />
        <Input value={edit.keywords.join(', ')} onChange={(e) => setEdit({ ...edit, keywords: e.target.value.split(',').map((k) => k.trim()) })} placeholder="Keywords" />
        <div className="flex gap-2">
          <Button size="sm" onClick={save}>Save</Button>
          <Button size="sm" variant="destructive" onClick={onDelete}>Delete</Button>
        </div>
      </CardContent>
    </Card>
  )
}
