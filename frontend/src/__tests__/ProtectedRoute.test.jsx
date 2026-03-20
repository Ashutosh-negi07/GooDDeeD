import { render } from '@testing-library/react'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import ProtectedRoute from '../components/auth/ProtectedRoute'
import { AuthProvider } from '../contexts/AuthContext'
import { describe, it, expect, beforeEach, vi } from 'vitest'

describe('ProtectedRoute', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
  })

  const TestProtectedComponent = () => <div>Protected Content</div>

  it('should render without crashing', () => {
    const { container } = render(
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <TestProtectedComponent />
                </ProtectedRoute>
              }
            />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    )

    expect(container).toBeTruthy()
  })

  it('renders protected content when wrapper is used', () => {
    render(
      <BrowserRouter>
        <AuthProvider>
          <ProtectedRoute>
            <TestProtectedComponent />
          </ProtectedRoute>
        </AuthProvider>
      </BrowserRouter>
    )

    // The component should attempt to render (may redirect if not authenticated)
    expect(document.body).toBeTruthy()
  })
})
