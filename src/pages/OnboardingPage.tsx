import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Lock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAppStore } from '@/hooks/useAppStore'
import { PrivacyBadge } from '@/components/marketing/ui'

export function WelcomePage() {
  const navigate = useNavigate()

  return (
    <div className="grid-bg flex min-h-screen flex-col items-center justify-center p-8 text-center">
      <div className="max-w-md space-y-6">
        <h1 className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text font-display text-5xl font-bold tracking-tight text-transparent">
          HUNTOS
        </h1>
        <p className="text-lg text-[var(--color-muted-foreground)]">
          Your personal operating system for getting hired.
        </p>
        <p className="text-sm text-[var(--color-muted-foreground)]">Stop searching. Start hunting.</p>
        <div className="pt-4">
          <p className="mb-4 text-sm">Let&apos;s set up your hunt.</p>
          <Button size="lg" onClick={() => navigate('/app/onboarding')}>
            Get Started
          </Button>
        </div>
      </div>
    </div>
  )
}

export function OnboardingPage() {
  const navigate = useNavigate()
  const { setSettings, setHuntProfiles } = useAppStore()
  const [step, setStep] = useState(1)
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [useAIParsing, setUseAIParsing] = useState(false)
  const [aiAvailable, setAiAvailable] = useState(false)
  const [profileData, setProfileData] = useState<Record<string, unknown>>({})
  const [huntProfileData, setHuntProfileData] = useState({
    name: 'iOS — Bangalore',
    emoji: '🔥',
    roles: 'iOS Developer, Senior iOS Engineer, Mobile Engineer',
    locations: 'Bangalore, Remote',
    keywords: 'Swift, SwiftUI, UIKit',
  })

  useEffect(() => {
    import('@/services/storage').then(({ storage }) => storage.getSettings()).then(async (settings) => {
      const { isRemoteAIConfigured } = await import('@/services/ai')
      setAiAvailable(isRemoteAIConfigured(settings.ai))
    })
  }, [])

  async function handleResumeUpload() {
    if (!file) return
    setLoading(true)
    setError('')
    try {
      const { extractTextFromFile, buildResumeSections, parseProfileLocally } = await import('@/services/parser/resume-parser')
      const { storage } = await import('@/services/storage')
      const { generateId } = await import('@/utils')

      const text = await extractTextFromFile(file)
      const parsed = useAIParsing
        ? await (await import('@/services/ai')).parseResumeWithAI(text)
        : parseProfileLocally(text)

      const profile = {
        id: generateId(),
        ...parsed,
        updatedAt: new Date().toISOString(),
      }

      const masterResume = {
        id: generateId(),
        version: 1,
        rawText: text,
        sections: buildResumeSections(text),
        updatedAt: new Date().toISOString(),
      }

      await storage.saveProfile(profile)
      await storage.saveMasterResume(masterResume)
      setProfileData(profile as unknown as Record<string, unknown>)
      setStep(2)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to parse resume')
    } finally {
      setLoading(false)
    }
  }

  async function saveProfileAndContinue() {
    const { storage } = await import('@/services/storage')
    await storage.saveProfile({
      ...(profileData as unknown as import('@/types').MasterProfile),
      updatedAt: new Date().toISOString(),
    })
    setStep(3)
  }

  async function finishOnboarding() {
    setLoading(true)
    try {
      const { storage, createDefaultHuntProfile } = await import('@/services/storage')

      const huntProfile = {
        ...(await createDefaultHuntProfile()),
        name: huntProfileData.name,
        emoji: huntProfileData.emoji,
        roles: huntProfileData.roles.split(',').map((r) => r.trim()),
        locations: huntProfileData.locations.split(',').map((l) => l.trim()),
        keywords: huntProfileData.keywords.split(',').map((k) => k.trim()),
      }

      await storage.saveHuntProfile(huntProfile)
      const updatedSettings = await storage.saveSettings({
        onboardingComplete: true,
        activeHuntProfileId: huntProfile.id,
      })
      setSettings(updatedSettings)
      setHuntProfiles(await storage.getHuntProfiles())
      navigate('/app')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="grid-bg min-h-screen">
      <div className="mx-auto max-w-2xl p-8">
      <h1 className="font-display mb-2 text-2xl font-bold tracking-tight">Setup Your Hunt</h1>
      <p className="mb-8 text-sm text-[var(--color-muted-foreground)]">Step {step} of 3</p>

      {step === 1 && (
        <div className="space-y-4">
          <PrivacyBadge label="Stored only in this browser" />
          <h2 className="font-semibold">Upload your resume</h2>
          <p className="flex items-start gap-2 rounded-md border border-green-500/20 bg-green-500/10 p-3 text-sm text-green-300">
            <Lock size={16} className="mt-0.5 shrink-0" />
            Your resume file is processed locally in this browser and saved to IndexedDB on this device.
            It is never uploaded to HuntOS servers. Other people cannot access it unless they use this same browser profile.
          </p>
          <label className="flex cursor-pointer flex-col items-center rounded-lg border-2 border-dashed border-[var(--color-border)] p-12 hover:border-[var(--color-muted-foreground)]">
            <input
              type="file"
              accept=".pdf,.docx,.txt,.md"
              className="hidden"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
            <p className="font-medium">Drop your resume here</p>
            <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">PDF / DOCX / TXT / MD</p>
            {file && <p className="mt-4 text-sm">{file.name}</p>}
          </label>
          {aiAvailable && (
            <label className="flex items-start gap-3 rounded-md border border-[var(--color-border)] p-3 text-sm">
              <input
                type="checkbox"
                checked={useAIParsing}
                onChange={(e) => setUseAIParsing(e.target.checked)}
                className="mt-1"
              />
              <span>
                <span className="font-medium">Enhance parsing with AI</span>
                <span className="mt-1 block text-[var(--color-muted-foreground)]">
                  Optional. Sends resume text to your configured AI provider. Leave unchecked to parse locally only.
                </span>
              </span>
            </label>
          )}
          {error && <p className="text-sm text-[var(--color-destructive)]">{error}</p>}
          <Button onClick={handleResumeUpload} disabled={!file || loading}>
            {loading ? 'Parsing...' : 'Continue'}
          </Button>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          <h2 className="font-semibold">Review your profile</h2>
          <p className="text-sm text-[var(--color-muted-foreground)]">Correct any parsing errors.</p>
          {['name', 'email', 'headline', 'location', 'totalExperienceYears'].map((field) => (
            <div key={field}>
              <label className="text-xs font-medium capitalize">{field.replace(/([A-Z])/g, ' $1')}</label>
              <input
                className="mt-1 w-full rounded-md border border-[var(--color-border)] bg-transparent px-3 py-2 text-sm"
                value={String(profileData[field] ?? '')}
                onChange={(e) =>
                  setProfileData({
                    ...profileData,
                    [field]: field === 'totalExperienceYears' ? parseFloat(e.target.value) : e.target.value,
                  })
                }
              />
            </div>
          ))}
          <div>
            <label className="text-xs font-medium">Skills (comma separated)</label>
            <textarea
              className="mt-1 w-full rounded-md border border-[var(--color-border)] bg-transparent px-3 py-2 text-sm"
              rows={3}
              value={((profileData.skills as string[]) ?? []).join(', ')}
              onChange={(e) =>
                setProfileData({
                  ...profileData,
                  skills: e.target.value.split(',').map((s) => s.trim()),
                })
              }
            />
          </div>
          <Button onClick={saveProfileAndContinue}>Continue</Button>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-4">
          <h2 className="font-semibold">Create your first Hunt Profile</h2>
          {(['name', 'emoji', 'roles', 'locations', 'keywords'] as const).map((field) => (
            <div key={field}>
              <label className="text-xs font-medium capitalize">{field}</label>
              <input
                className="mt-1 w-full rounded-md border border-[var(--color-border)] bg-transparent px-3 py-2 text-sm"
                value={huntProfileData[field]}
                onChange={(e) => setHuntProfileData({ ...huntProfileData, [field]: e.target.value })}
              />
            </div>
          ))}
          <Button onClick={finishOnboarding} disabled={loading}>
            {loading ? 'Setting up...' : 'Start Hunting'}
          </Button>
        </div>
      )}
      </div>
    </div>
  )
}
