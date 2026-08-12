import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { WelcomePage } from '@/pages/OnboardingPage'

function renderWelcome() {
  return render(
    <MemoryRouter initialEntries={['/app/welcome']}>
      <WelcomePage />
    </MemoryRouter>,
  )
}

describe('WelcomePage', () => {
  it('renders the first-launch screen without crashing', () => {
    renderWelcome()
    expect(screen.getByText('Welcome to HuntOS')).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('HuntOS')
  })

  it('shows the call to action that starts onboarding', () => {
    renderWelcome()
    expect(screen.getByRole('button', { name: 'Get Started' })).toBeInTheDocument()
  })
})
