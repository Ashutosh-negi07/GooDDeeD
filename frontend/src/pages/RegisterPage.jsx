import { useState, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { Eye, EyeOff } from 'lucide-react'
import authOcean from '../assets/auth-ocean.png'
import './AuthPages.css'

function RegisterPage() {
  const [name, setName]                   = useState('')
  const [email, setEmail]                 = useState('')
  const [password, setPassword]           = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPw, setShowPw]               = useState(false)
  const [showConfirm, setShowConfirm]     = useState(false)
  const [error, setError]                 = useState('')
  const [fieldErrors, setFieldErrors]     = useState({}) // from backend 400 fieldErrors map
  const [loading, setLoading]             = useState(false)
  const [slowHint, setSlowHint]           = useState(false)
  const slowTimer                         = useRef(null)

  const { register } = useAuth()
  const navigate     = useNavigate()

  // Client-side validation mirrors backend CreateUserRequest constraints:
  // name: 2-100 chars, email: valid format, password: 6-100 chars
  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length > 0

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setFieldErrors({})
    setSlowHint(false)

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    setLoading(true)
    slowTimer.current = setTimeout(() => setSlowHint(true), 3000)
    try {
      await register(name, email, password)
      navigate('/dashboard')
    } catch (err) {
      // Handle backend validation fieldErrors (400)
      if (err.response?.data?.fieldErrors) {
        setFieldErrors(err.response.data.fieldErrors)
      } else {
        // Handle EmailAlreadyExistsException (409) and BadCredentials (401)
        const msg = err.response?.data?.message
          || err.response?.data?.error
          || 'Registration failed. Please try again.'
        setError(msg)
      }
    } finally {
      clearTimeout(slowTimer.current)
      setLoading(false)
      setSlowHint(false)
    }
  }

  return (
    <div className="auth-page">
      {/* Image Side */}
      <div className="auth-image-side">
        <img src={authOcean} alt="Volunteers cleaning a beach" />
        <div className="auth-image-overlay"></div>
        <div className="auth-image-content">
          <Link to="/" className="auth-logo">
            <span className="logo-heart">&#x2764;</span>
            <span className="logo-text">GooDDeeD</span>
          </Link>
          <h2 className="auth-image-title">Join the Movement</h2>
          <p className="auth-image-subtitle">
            Be part of a global community making real change.
            Every volunteer matters.
          </p>
          <div className="auth-image-chips">
            <span className="auth-image-chip">Free forever</span>
            <span className="auth-image-chip">No commitments</span>
            <span className="auth-image-chip">Just impact</span>
          </div>
        </div>
      </div>

      {/* Form Side */}
      <div className="auth-form-side">
        <div className="auth-form-container">
          <div className="auth-form-header">
            <Link to="/" className="auth-logo-mobile">
              <span className="logo-heart">&#x2764;</span>
              <span className="logo-text">GooDDeeD</span>
            </Link>
            <h1 className="auth-title">Create your account</h1>
            <p className="auth-subtitle">Start making a difference today</p>
          </div>

          {error && (
            <div className="auth-error" id="register-error">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
              </svg>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="auth-form" id="register-form">
            {/* Name — 2-100 chars (backend: @Size(min=2, max=100)) */}
            <div className="form-group">
              <label htmlFor="name">Full Name</label>
              <input
                id="name" type="text"
                placeholder="John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required minLength={2} maxLength={100}
                autoComplete="name"
              />
              {fieldErrors.name && <span className="auth-field-hint" style={{ color: '#DC2626' }}>{fieldErrors.name}</span>}
            </div>

            {/* Email with live validation indicator */}
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                id="email" type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
              {email.length > 0 && (
                <span className={`auth-field-hint ${emailValid ? 'valid' : ''}`}>
                  {emailValid ? '✓ Valid email' : 'Enter a valid email address'}
                </span>
              )}
              {fieldErrors.email && <span className="auth-field-hint" style={{ color: '#DC2626' }}>{fieldErrors.email}</span>}
            </div>

            {/* Password — 6-100 chars (backend: @Size(min=6, max=100)) */}
            <div className="form-group">
              <label htmlFor="password">Password</label>
              <div className="auth-pw-wrap">
                <input
                  id="password"
                  type={showPw ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required minLength={6} maxLength={100}
                  autoComplete="new-password"
                />
                <button type="button" className="auth-pw-toggle" onClick={() => setShowPw(p => !p)} aria-label="Toggle password">
                  {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {password.length > 0 && password.length < 6 && (
                <span className="auth-field-hint">At least 6 characters required</span>
              )}
              {fieldErrors.password && <span className="auth-field-hint" style={{ color: '#DC2626' }}>{fieldErrors.password}</span>}
            </div>

            {/* Confirm Password */}
            <div className="form-group">
              <label htmlFor="confirm-password">Confirm Password</label>
              <div className="auth-pw-wrap">
                <input
                  id="confirm-password"
                  type={showConfirm ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  autoComplete="new-password"
                />
                <button type="button" className="auth-pw-toggle" onClick={() => setShowConfirm(p => !p)} aria-label="Toggle confirm password">
                  {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {confirmPassword.length > 0 && confirmPassword !== password && (
                <span className="auth-field-hint" style={{ color: '#DC2626' }}>Passwords don't match</span>
              )}
              {confirmPassword.length > 0 && confirmPassword === password && (
                <span className="auth-field-hint valid">✓ Passwords match</span>
              )}
            </div>

            <button
              type="submit"
              className="btn btn-primary auth-submit"
              disabled={loading}
              id="register-submit"
            >
              {loading ? <span className="auth-spinner" /> : null}
              {loading ? 'Creating account…' : 'Create Account'}
              {!loading && <span className="btn-arrow">→</span>}
            </button>

            {slowHint && (
              <p className="auth-cold-hint">
                🌱 Cold starting the server… this may take a moment.
              </p>
            )}
          </form>

          <p className="auth-switch">
            Already have an account? <Link to="/login">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default RegisterPage
