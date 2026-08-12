import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AppShell } from '@/components/layout/AppShell'
import { useInitApp } from '@/hooks/useInitApp'
import { useAppStore } from '@/hooks/useAppStore'
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
  if (!settings) return <div className="flex h-screen items-center justify-center">Loading HuntOS...</div>
  if (!settings.onboardingComplete) return <Navigate to="/welcome" replace />
  return <>{children}</>
}

function AppRoutes() {
  useInitApp()
  const { settings } = useAppStore()

  return (
    <Routes>
      <Route path="/welcome" element={
        settings?.onboardingComplete ? <Navigate to="/" replace /> : <WelcomePage />
      } />
      <Route path="/onboarding" element={<OnboardingPage />} />
      <Route element={<ProtectedRoute><AppShell /></ProtectedRoute>}>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/hunt" element={<HuntPage />} />
        <Route path="/top-matches" element={<TopMatchesPage />} />
        <Route path="/recent" element={<RecentPage />} />
        <Route path="/saved" element={<SavedPage />} />
        <Route path="/jobs/:id" element={<JobDetailPage />} />
        <Route path="/applications" element={<ApplicationsPage />} />
        <Route path="/resumes/master" element={<MasterResumePage />} />
        <Route path="/resumes/tailored" element={<TailoredResumesPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/hunt-profiles" element={<HuntProfilesPage />} />
        <Route path="/settings" element={<SettingsPage />} />
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
