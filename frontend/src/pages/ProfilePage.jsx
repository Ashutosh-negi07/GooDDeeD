import { useState } from 'react'
import { User, Mail, Calendar, Save } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import api from '../api/axios'
import toast from 'react-hot-toast'
import DashboardLayout from '../components/layout/DashboardLayout'
import './ProfilePage.css'

function ProfilePage() {
  const { user } = useAuth()
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(user?.name || '')
  const [email, setEmail] = useState(user?.email || '')
  const [saving, setSaving] = useState(false)

  async function handleSave(e) {
    e.preventDefault()
    setSaving(true)
    try {
      await api.put(`/users/${user.id}`, null, { params: { name, email } })
      toast.success('Profile updated! Changes will appear on next login.')
      setEditing(false)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  return (
    <DashboardLayout>
      <div className="profile-page">
        <h1 className="profile-title">My Profile</h1>
        <p className="profile-subtitle">View and manage your account information.</p>

        <div className="profile-card">
          <div className="profile-avatar-section">
            <div className="profile-avatar-large">
              {user?.name?.charAt(0)?.toUpperCase() || '?'}
            </div>
            <div>
              <h2 className="profile-name">{user?.name}</h2>
              <p className="profile-email">{user?.email}</p>
            </div>
          </div>

          {editing ? (
            <form onSubmit={handleSave} className="profile-form">
              <div className="form-group">
                <label><User size={14} /> Full Name</label>
                <input type="text" value={name} onChange={e => setName(e.target.value)} required minLength={2} />
              </div>
              <div className="form-group">
                <label><Mail size={14} /> Email</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} required />
              </div>
              <div className="profile-form-actions">
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  <Save size={16} /> {saving ? 'Saving...' : 'Save Changes'}
                </button>
                <button type="button" className="btn btn-outline" onClick={() => { setEditing(false); setName(user?.name || ''); setEmail(user?.email || '') }}>
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <div className="profile-info">
              <div className="profile-info-row">
                <span className="profile-info-label"><User size={14} /> Name</span>
                <span className="profile-info-value">{user?.name}</span>
              </div>
              <div className="profile-info-row">
                <span className="profile-info-label"><Mail size={14} /> Email</span>
                <span className="profile-info-value">{user?.email}</span>
              </div>
              <div className="profile-info-row">
                <span className="profile-info-label"><Calendar size={14} /> Member Since</span>
                <span className="profile-info-value">
                  {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', {
                    year: 'numeric', month: 'long', day: 'numeric'
                  }) : '—'}
                </span>
              </div>
              <button className="btn btn-outline profile-edit-btn" onClick={() => setEditing(true)}>
                Edit Profile
              </button>
            </div>
          )}
        </div>

        {/* Activity Summary */}
        <div className="profile-section">
          <h3>Quick Links</h3>
          <div className="profile-links">
            <a href="/dashboard" className="profile-link-card">
              <span className="profile-link-icon">📊</span>
              <span>Dashboard</span>
            </a>
            <a href="/dashboard/tasks" className="profile-link-card">
              <span className="profile-link-icon">✅</span>
              <span>My Tasks</span>
            </a>
            <a href="/dashboard/causes" className="profile-link-card">
              <span className="profile-link-icon">❤️</span>
              <span>My Causes</span>
            </a>
            <a href="/explore" className="profile-link-card">
              <span className="profile-link-icon">🔍</span>
              <span>Explore</span>
            </a>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}

export default ProfilePage
