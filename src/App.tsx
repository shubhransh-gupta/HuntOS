import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AppShell } from '@/components/layout/AppShell'
import { useInitApp } from '@/hooks/useInitApp'
import { useAppStore } from '@/hooks/useAppStore'
import { MarketingPage } from '@/pages/MarketingPage'
import { WelcomePage, OnboardingPage } from '@/pages/OnboardingPage'
import { DashboardPage } from '@/pages/DashboardPage'
import { HuntPage, TopMatchesPage, RecentPage, SavedPage } from '@/pages/HuntPage'
import { JobDetailPage } from '@/pages/JobDetailPage'
import { ProfilePage } from '@/pages/ProfilePage'
import { MasterResumePage, TailoredResumesPage } from '@/pages/resumes/ResumePages'
import { HuntProfilesPage } from '@/pages/HuntProfilesPage'
import { ApplicationsPage } from '@/pages/ApplicationsPage'
import { SettingsPage } from '@/pages/SettingsPage'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { settings } = useAppStore()
  if (!settings) return <div className="grid-bg flex h-screen items-center justify-center">Loading HuntOS...</div>
  if (!settings.onboardingComplete) return <Navigate to="/app/welcome" replace />
  return <>{children}</>
}

function AppRoutes() {
  useInitApp()
  const { settings } = useAppStore()

  return (
    <Routes>
      <Route path="/" element={<MarketingPage />} />
      <Route
        path="/app/welcome"
        element={settings?.onboardingComplete ? <Navigate to="/app" replace /> : <WelcomePage />}
      />
      <Route path="/app/onboarding" element={<OnboardingPage />} />
      <Route element={<ProtectedRoute><AppShell /></ProtectedRoute>}>
        <Route path="/app" element={<DashboardPage />} />
        <Route path="/app/hunt" element={<HuntPage />} />
        <Route path="/app/top-matches" element={<TopMatchesPage />} />
        <Route path="/app/recent" element={<RecentPage />} />
        <Route path="/app/saved" element={<SavedPage />} />
        <Route path="/app/jobs/:id" element={<JobDetailPage />} />
        <Route path="/app/applications" element={<ApplicationsPage />} />
        <Route path="/app/resumes/master" element={<MasterResumePage />} />
        <Route path="/app/resumes/tailored" element={<TailoredResumesPage />} />
        <Route path="/app/profile" element={<ProfilePage />} />
        <Route path="/app/hunt-profiles" element={<HuntProfilesPage />} />
        <Route path="/app/settings" element={<SettingsPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

const routerBasename = import.meta.env.BASE_URL.replace(/\/$/, '')

export default function App() {
  return (
    <BrowserRouter basename={routerBasename || undefined}>
      <AppRoutes />
    </BrowserRouter>
  )
}
