import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertTriangle, Lock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/utils'
import { useAppStore } from '@/hooks/useAppStore'
import { PrivacyBadge } from '@/components/marketing/ui'
import { HuntHeroMark, OnboardingHero } from '@/components/marketing/HuntHeroMark'
import {
  PROFILE_FIELD_LABELS,
  REQUIRED_PROFILE_FIELDS,
  findMissingProfileFields,
  type ParsedProfile,
  type RequiredProfileField,
} from '@/services/parser/local-profile-parser'

export function WelcomePage() {
  const navigate = useNavigate()

  return (
    <div className="grid-bg flex min-h-screen flex-col items-center justify-center px-6 py-12">
      <div className="glass glow-accent max-w-lg rounded-2xl px-8 py-10 text-center md:px-12 md:py-12">
        <HuntHeroMark size="xl" className="mb-8" />
        <p className="font-display mb-3 text-xs tracking-[0.24em] text-violet-300/80 uppercase">
          Welcome to HuntOS
        </p>
        <h1 className="font-display text-5xl font-semibold tracking-tight text-white md:text-6xl">
          Hunt<span className="bg-gradient-to-r from-violet-300 via-fuchsia-300 to-indigo-300 bg-clip-text text-transparent">OS</span>
        </h1>
        <p className="mt-5 text-lg leading-relaxed text-[var(--color-text-secondary)]">
          Your personal operating system for getting hired.
        </p>
        <p className="font-display mt-3 text-xl text-violet-200/90 italic">
          Stop searching. Start hunting.
        </p>
        <div className="mt-8 border-t border-[var(--color-border)] pt-8">
          <p className="mb-5 text-sm text-[var(--color-muted-foreground)]">Let&apos;s set up your hunt in three quick steps.</p>
          <Button size="lg" className="min-w-[180px] rounded-full" onClick={() => navigate('/app/onboarding')}>
            Get Started
          </Button>
        </div>
      </div>
    </div>
  )
}

const HUNT_FIELDS = [
  { key: 'name', label: 'Hunt name', hint: 'e.g. Marketing — Mumbai' },
  { key: 'emoji', label: 'Emoji', hint: '🔥' },
  { key: 'roles', label: 'Roles (comma separated)', hint: 'e.g. Marketing Manager, Brand Manager' },
  { key: 'locations', label: 'Locations (comma separated)', hint: 'e.g. Mumbai, Remote' },
  { key: 'keywords', label: 'Keywords (comma separated)', hint: 'e.g. SEO, Content Marketing' },
] as const

function splitList(value: string): string[] {
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
}

export function OnboardingPage() {
  const navigate = useNavigate()
  const { setSettings, setProfile, setHuntProfiles } = useAppStore()
  const [step, setStep] = useState(1)
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [useAIParsing, setUseAIParsing] = useState(false)
  const [aiAvailable, setAiAvailable] = useState(false)
  const [profileData, setProfileData] = useState<Record<string, unknown>>({})
  const [unreadFields, setUnreadFields] = useState<RequiredProfileField[]>([])
  const [huntProfileData, setHuntProfileData] = useState({
    name: '',
    emoji: '🔥',
    roles: '',
    locations: '',
    keywords: '',
  })

  const stillMissing = findMissingProfileFields(profileData as Partial<ParsedProfile>)
  const huntReady = Boolean(huntProfileData.roles.trim() && huntProfileData.locations.trim())

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
      if (text.trim().length < 40) {
        throw new Error(
          'We could not read any text from that file. If it is a scanned image, try a text-based PDF or DOCX.',
        )
      }

      const parsed = useAIParsing
        ? await (await import('@/services/ai')).parseResumeWithAI(text)
        : parseProfileLocally(text)

      const profile = {
        id: generateId(),
        ...parsed,
        updatedAt: new Date().toISOString(),
      }

      setUnreadFields(findMissingProfileFields(parsed))

      const masterResume = {
        id: generateId(),
        version: 1,
        rawText: text,
        sections: buildResumeSections(text),
        // Kept so the resume can be shown back exactly as uploaded rather than
        // as reflowed text. Stays on this device like everything else.
        originalFile: {
          name: file.name,
          type: file.type || 'application/octet-stream',
          size: file.size,
          data: await file.arrayBuffer(),
        },
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
    if (stillMissing.length > 0) return

    const { storage } = await import('@/services/storage')
    const profile = profileData as unknown as import('@/types').MasterProfile
    await storage.saveProfile({ ...profile, updatedAt: new Date().toISOString() })

    // Seed the hunt from what this person's resume actually says.
    const roles = profile.roles?.length ? profile.roles : [profile.headline].filter(Boolean)
    const locations = [profile.location, 'Remote'].filter(Boolean) as string[]

    setHuntProfileData((current) => ({
      ...current,
      name: current.name || [roles[0], profile.location].filter(Boolean).join(' — '),
      roles: current.roles || roles.join(', '),
      locations: current.locations || locations.join(', '),
      keywords: current.keywords || (profile.skills ?? []).slice(0, 8).join(', '),
    }))
    setStep(3)
  }

  async function finishOnboarding() {
    setLoading(true)
    try {
      const { storage, createDefaultHuntProfile } = await import('@/services/storage')

      const huntProfile = {
        ...(await createDefaultHuntProfile()),
        name: huntProfileData.name.trim() || 'My hunt',
        emoji: huntProfileData.emoji,
        roles: splitList(huntProfileData.roles),
        locations: splitList(huntProfileData.locations),
        keywords: splitList(huntProfileData.keywords),
      }

      await storage.saveHuntProfile(huntProfile)
      const updatedSettings = await storage.saveSettings({
        onboardingComplete: true,
        activeHuntProfileId: huntProfile.id,
      })
      // The app reads these from the store, which nothing else refreshes on a
      // client-side navigation out of onboarding.
      setSettings(updatedSettings)
      setProfile((await storage.getProfile()) ?? null)
      setHuntProfiles(await storage.getHuntProfiles())
      navigate('/app')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="grid-bg min-h-screen px-6 py-10">
      <div className="mx-auto max-w-2xl">
        <OnboardingHero
          kicker={`Step ${step} of 3`}
          title={step === 1 ? 'Upload your resume' : step === 2 ? 'Review your profile' : 'Create your hunt profile'}
          subtitle={
            step === 1
              ? 'Everything stays in your browser.'
              : step === 2
                ? 'Fine-tune what HuntOS learned from your resume.'
                : 'Tell HuntOS what roles you want to pursue.'
          }
        />

      {step === 1 && (
        <div className="glass space-y-4 rounded-2xl p-6 md:p-8">
          <PrivacyBadge label="Stored only in this browser" />
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
          <Button onClick={handleResumeUpload} disabled={!file || loading} className="rounded-full">
            {loading ? 'Parsing...' : 'Continue'}
          </Button>
        </div>
      )}

      {step === 2 && (
        <div className="glass space-y-4 rounded-2xl p-6 md:p-8">
          {unreadFields.length > 0 ? (
            <p className="flex items-start gap-2 rounded-md border border-amber-500/25 bg-amber-500/10 p-3 text-sm text-amber-200">
              <AlertTriangle size={16} className="mt-0.5 shrink-0" />
              <span>
                We couldn&apos;t read{' '}
                <strong>{unreadFields.map((field) => PROFILE_FIELD_LABELS[field]).join(', ')}</strong> from
                your resume. Please fill {unreadFields.length === 1 ? 'it' : 'them'} in below — HuntOS
                won&apos;t guess on your behalf.
              </span>
            </p>
          ) : (
            <p className="text-sm text-[var(--color-muted-foreground)]">
              Read straight from your resume. Correct anything that looks wrong.
            </p>
          )}

          {REQUIRED_PROFILE_FIELDS.filter((field) => field !== 'skills').map((field) => {
            const needsInput = stillMissing.includes(field)
            return (
              <div key={field}>
                <label className="text-xs font-medium">
                  {PROFILE_FIELD_LABELS[field]}
                  {needsInput && <span className="ml-1 text-amber-300">required</span>}
                </label>
                <input
                  type={field === 'totalExperienceYears' ? 'number' : 'text'}
                  placeholder={needsInput ? `Enter your ${PROFILE_FIELD_LABELS[field].toLowerCase()}` : ''}
                  className={cn(
                    'mt-1 w-full rounded-md border bg-transparent px-3 py-2 text-sm',
                    needsInput ? 'border-amber-500/50' : 'border-[var(--color-border)]',
                  )}
                  value={String(profileData[field] ?? '')}
                  onChange={(e) =>
                    setProfileData({
                      ...profileData,
                      [field]:
                        field === 'totalExperienceYears'
                          ? Number(e.target.value) || 0
                          : e.target.value,
                    })
                  }
                />
              </div>
            )
          })}

          <div>
            <label className="text-xs font-medium">
              {PROFILE_FIELD_LABELS.skills} (comma separated)
              {stillMissing.includes('skills') && <span className="ml-1 text-amber-300">required</span>}
            </label>
            <textarea
              rows={3}
              placeholder={stillMissing.includes('skills') ? 'e.g. Brand Strategy, SEO, Copywriting' : ''}
              className={cn(
                'mt-1 w-full rounded-md border bg-transparent px-3 py-2 text-sm',
                stillMissing.includes('skills') ? 'border-amber-500/50' : 'border-[var(--color-border)]',
              )}
              value={((profileData.skills as string[]) ?? []).join(', ')}
              onChange={(e) =>
                setProfileData({ ...profileData, skills: splitList(e.target.value) })
              }
            />
          </div>

          <Button
            onClick={saveProfileAndContinue}
            disabled={stillMissing.length > 0}
            className="rounded-full"
          >
            Continue
          </Button>
          {stillMissing.length > 0 && (
            <p className="text-xs text-[var(--color-muted-foreground)]">
              Fill in {stillMissing.map((field) => PROFILE_FIELD_LABELS[field]).join(', ')} to continue.
            </p>
          )}
        </div>
      )}

      {step === 3 && (
        <div className="glass space-y-4 rounded-2xl p-6 md:p-8">
          <p className="text-sm text-[var(--color-muted-foreground)]">
            Prefilled from your resume. Adjust anything you want to hunt for.
          </p>
          {HUNT_FIELDS.map(({ key, label, hint }) => {
            const needsInput = (key === 'roles' || key === 'locations') && !huntProfileData[key].trim()
            return (
              <div key={key}>
                <label className="text-xs font-medium">
                  {label}
                  {needsInput && <span className="ml-1 text-amber-300">required</span>}
                </label>
                <input
                  type="text"
                  placeholder={hint}
                  className={cn(
                    'mt-1 w-full rounded-md border bg-transparent px-3 py-2 text-sm',
                    needsInput ? 'border-amber-500/50' : 'border-[var(--color-border)]',
                  )}
                  value={huntProfileData[key]}
                  onChange={(e) => setHuntProfileData({ ...huntProfileData, [key]: e.target.value })}
                />
              </div>
            )
          })}
          <Button
            onClick={finishOnboarding}
            disabled={loading || !huntReady}
            className="rounded-full"
          >
            {loading ? 'Setting up...' : 'Start Hunting'}
          </Button>
          {!huntReady && (
            <p className="text-xs text-[var(--color-muted-foreground)]">
              Add at least one role and one location to start hunting.
            </p>
          )}
        </div>
      )}
      </div>
    </div>
  )
}
