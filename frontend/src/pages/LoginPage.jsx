import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import authOcean from '../assets/auth-ocean.png'
import './AuthPages.css'

function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      await login(email, password)
      navigate('/dashboard')
    } catch (err) {
      const msg = err.response?.data?.message
        || err.response?.data?.error
        || 'Invalid email or password.'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-image-side">
        <img src={authOcean} alt="Volunteers cleaning a beach" />
        <div className="auth-image-overlay"></div>
        <div className="auth-image-content">
          <Link to="/" className="auth-logo">
            <span className="logo-heart">&#x2764;</span>
            <span className="logo-text">GooDDeeD</span>
          </Link>
          <h2 className="auth-image-title">Welcome Back</h2>
          <p className="auth-image-subtitle">
            Continue your journey of making a positive impact in communities worldwide.
          </p>
        </div>
      </div>

      <div className="auth-form-side">
        <div className="auth-form-container">
          <div className="auth-form-header">
            <Link to="/" className="auth-logo-mobile">
              <span className="logo-heart">&#x2764;</span>
              <span className="logo-text">GooDDeeD</span>
            </Link>
            <h1 className="auth-title">Sign in to your account</h1>
            <p className="auth-subtitle">Welcome back! Let's keep doing good.</p>
          </div>

          {error && (
            <div className="auth-error" id="login-error">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
              </svg>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="auth-form" id="login-form">
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary auth-submit"
              disabled={loading}
              id="login-submit"
            >
              {loading ? 'Signing in...' : 'Sign In'}
              {!loading && <span className="btn-arrow">→</span>}
            </button>
          </form>

          <p className="auth-switch">
            Don't have an account? <Link to="/register">Create one</Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default LoginPage
