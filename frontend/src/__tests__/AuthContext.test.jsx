import { render, screen } from '@testing-library/react'
import { useContext } from 'react'
import { AuthContext, AuthProvider } from '../contexts/AuthContext'
import { describe, it, expect, beforeEach, vi } from 'vitest'

// Mock the auth API to prevent real network calls
vi.mock('../api/auth', () => ({
  authAPI: {
    getMe: vi.fn().mockRejectedValue(new Error('not logged in')),
    login: vi.fn(),
    register: vi.fn(),
  }
}))

describe('AuthContext', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
  })

  it('should provide initial auth state (no user)', () => {
    const TestComponent = () => {
      const { user, loading } = useContext(AuthContext)
      return (
        <div>
          {user ? `User: ${user.email}` : 'Not logged in'}
        </div>
      )
    }

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    expect(screen.getByText('Not logged in')).toBeDefined()
  })

  it('should provide logout function', () => {
    const TestComponent = () => {
      const { logout } = useContext(AuthContext)
      return <button onClick={logout}>Logout</button>
    }

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    expect(screen.getByText('Logout')).toBeDefined()
  })

  it('should expose login and register functions', () => {
    const TestComponent = () => {
      const { login, register } = useContext(AuthContext)
      return (
        <div>
          {typeof login === 'function' ? 'login-ok' : 'login-missing'}
          {typeof register === 'function' ? 'register-ok' : 'register-missing'}
        </div>
      )
    }

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    expect(screen.getByText(/login-ok/)).toBeDefined()
    expect(screen.getByText(/register-ok/)).toBeDefined()
  })
})
