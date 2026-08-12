import { Link } from 'react-router-dom'
import {
  Target,
  Sparkles,
  FileText,
  Kanban,
  Shield,
  Search,
  Lock,
  Zap,
  ArrowRight,
  ExternalLink,
  Brain,
} from 'lucide-react'
import { GlassPanel, PrivacyBadge, MarketingButton, SiteCredit } from '@/components/marketing/ui'
import { HuntHeroMark } from '@/components/marketing/HuntHeroMark'

const FEATURES = [
  { icon: Search, title: 'Smart Hunt', desc: 'Discover jobs from sample data, Greenhouse, Lever, and manual imports.' },
  { icon: Brain, title: 'Match Intelligence', desc: 'Transparent scoring engine with explainable match breakdowns.' },
  { icon: FileText, title: 'Resume Tailoring', desc: 'Generate job-specific resumes from your master profile — never fabricated.' },
  { icon: Target, title: 'Hunt Profiles', desc: 'Multiple search profiles for roles, locations, salary, and keywords.' },
  { icon: Kanban, title: 'Application OS', desc: 'Track every application from saved to offer with follow-up reminders.' },
  { icon: Sparkles, title: 'Command Palette', desc: 'Keyboard-first workflow with ⌘K shortcuts across the app.' },
]

const FLOW = ['DISCOVER JOBS', 'MATCH PROFILE', 'TAILOR RESUME', 'APPLY', 'TRACK']

export function MarketingPage() {
  return (
    <div className="grid-bg min-h-screen">
      <nav className="sticky top-0 z-30 border-b border-[var(--color-border)] bg-[var(--color-bg-primary)]/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <span className="font-display text-xl font-semibold tracking-tight text-white">
            Hunt
            <span className="bg-gradient-to-r from-violet-300 via-fuchsia-300 to-indigo-300 bg-clip-text text-transparent">
              OS
            </span>
          </span>
          <div className="flex items-center gap-4">
            <a href="#features" className="hidden text-sm text-[var(--color-text-secondary)] hover:text-white sm:block">
              Features
            </a>
            <a href="#privacy" className="hidden text-sm text-[var(--color-text-secondary)] hover:text-white sm:block">
              Privacy
            </a>
            <Link to="/app">
              <MarketingButton size="sm">Launch App</MarketingButton>
            </Link>
          </div>
        </div>
      </nav>

      <section className="mx-auto max-w-3xl px-4 py-20 md:py-28">
        <div className="glass glow-accent rounded-2xl px-8 py-12 text-center md:px-14 md:py-16">
          <HuntHeroMark size="xl" className="mb-8" />
          <PrivacyBadge />
          <h1 className="font-display mt-6 text-5xl font-semibold tracking-tight text-white md:text-6xl">
            Stop searching.
            <br />
            <span className="bg-gradient-to-r from-violet-300 via-fuchsia-300 to-indigo-300 bg-clip-text text-transparent">
              Start hunting.
            </span>
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-[var(--color-text-secondary)]">
            Your personal operating system for getting hired. Discover the right jobs, score them against
            your profile, tailor your resume, and track every application.
          </p>
          <p className="font-display mt-4 text-xl text-violet-200/90 italic">
            All of it, entirely in your browser.
          </p>

          <div className="mt-10 flex flex-col justify-center gap-4 sm:flex-row">
            <Link to="/app">
              <MarketingButton size="lg" className="w-full sm:w-auto">
                Start Hunting <ArrowRight size={18} />
              </MarketingButton>
            </Link>
            <a href="https://github.com/shubhransh-gupta/HuntOS" target="_blank" rel="noreferrer">
              <MarketingButton size="lg" variant="secondary" className="w-full sm:w-auto">
                View on GitHub
              </MarketingButton>
            </a>
          </div>

          <p className="mt-8 flex items-center justify-center gap-2 border-t border-[var(--color-border)] pt-8 text-sm text-[var(--color-text-muted)]">
            <Lock size={14} /> No account. No cloud storage. Your data stays local.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-4 py-16">
        <div className="grid gap-6 md:grid-cols-2">
          <GlassPanel className="p-6">
            <p className="text-lg italic text-[var(--color-text-secondary)]">
              &ldquo;Job boards optimize for volume. HuntOS optimizes for applications worth sending.&rdquo;
            </p>
          </GlassPanel>
          <GlassPanel className="p-6">
            <p className="text-lg italic text-[var(--color-text-secondary)]">
              &ldquo;500 discovered → 6 exceptional → 3 apply now. That&apos;s the morning experience.&rdquo;
            </p>
          </GlassPanel>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-4 py-16 text-center">
        <div className="flex flex-col items-center justify-center gap-4 text-sm font-mono md:flex-row md:gap-8">
          {FLOW.map((step, i) => (
            <div key={step} className="flex items-center gap-4">
              <span className="glass rounded-full px-4 py-2 text-violet-300">{step}</span>
              {i < FLOW.length - 1 && <span className="hidden text-[var(--color-text-muted)] md:inline">↓</span>}
            </div>
          ))}
        </div>
      </section>

      <section id="features" className="mx-auto max-w-6xl px-4 py-24">
        <h2 className="font-display mb-12 text-center text-3xl font-semibold md:text-4xl">
          Everything you need to get hired with confidence
        </h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map(({ icon: Icon, title, desc }) => (
            <GlassPanel key={title} className="p-6 transition-colors hover:border-[var(--color-border-hover)]">
              <Icon size={24} className="mb-4 text-violet-300" />
              <h3 className="font-display mb-2 text-lg font-semibold">{title}</h3>
              <p className="text-sm text-[var(--color-text-secondary)]">{desc}</p>
            </GlassPanel>
          ))}
        </div>
      </section>

      <section id="privacy" className="mx-auto max-w-4xl px-4 py-24">
        <GlassPanel className="glow-accent p-8 text-center md:p-12">
          <Shield size={48} className="mx-auto mb-6 text-green-400" />
          <h2 className="font-display mb-4 text-3xl font-semibold md:text-4xl">100% Local-First</h2>
          <p className="mx-auto max-w-xl text-lg text-[var(--color-text-secondary)]">
            Your resume, jobs, and application history live in your browser. Nothing is uploaded by default. AI analysis
            only sends selected text to your configured provider.
          </p>
          <div className="mt-10 grid gap-6 text-sm sm:grid-cols-3">
            <div>
              <Lock size={20} className="mx-auto mb-2 text-violet-300" />
              <p className="font-medium">IndexedDB Storage</p>
              <p className="text-[var(--color-text-muted)]">Profile, jobs, and apps stored locally</p>
            </div>
            <div>
              <Target size={20} className="mx-auto mb-2 text-violet-300" />
              <p className="font-medium">Explainable Matching</p>
              <p className="text-[var(--color-text-muted)]">Deterministic scores, not black-box AI</p>
            </div>
            <div>
              <Zap size={20} className="mx-auto mb-2 text-violet-300" />
              <p className="font-medium">Instant Hunt</p>
              <p className="text-[var(--color-text-muted)]">Sample data works fully offline</p>
            </div>
          </div>
        </GlassPanel>
      </section>

      <section className="mx-auto max-w-4xl px-4 py-24 text-center">
        <h2 className="font-display mb-4 text-3xl font-semibold md:text-4xl">Your hunt is full of signal.</h2>
        <p className="font-display mb-8 text-xl text-violet-200/90 italic">We surface what matters.</p>
        <Link to="/app">
          <MarketingButton size="lg">Discover → Match → Tailor → Apply</MarketingButton>
        </Link>
      </section>

      <footer className="border-t border-[var(--color-border)] py-10">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 text-sm text-[var(--color-text-muted)] md:flex-row">
          <SiteCredit />
          <div className="flex gap-6">
            <a
              href="https://github.com/shubhransh-gupta/HuntOS"
              className="flex items-center gap-1 hover:text-white"
              target="_blank"
              rel="noreferrer"
            >
              <ExternalLink size={16} /> GitHub
            </a>
            <Link to="/app" className="hover:text-white">
              Launch App
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
