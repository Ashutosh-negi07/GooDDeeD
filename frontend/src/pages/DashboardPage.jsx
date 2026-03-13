import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import api from '../api/axios'
import DashboardLayout from '../components/layout/DashboardLayout'
import './DashboardPage.css'

function DashboardPage() {
  const { user } = useAuth()
  const [stats, setStats] = useState(null)
  const [causes, setCauses] = useState([])
  const [loadingData, setLoadingData] = useState(true)

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        const [statsRes, causesRes] = await Promise.all([
          api.get('/tasks/my/statistics').catch(() => null),
          api.get('/causes/my').catch(() => null),
        ])
        if (statsRes) setStats(statsRes.data)
        if (causesRes) setCauses(causesRes.data)
      } finally {
        setLoadingData(false)
      }
    }
    fetchDashboardData()
  }, [])

  const greeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good Morning'
    if (hour < 18) return 'Good Afternoon'
    return 'Good Evening'
  }

  return (
    <DashboardLayout>
      <div className="dashboard">
        {/* Welcome Banner */}
        <div className="dash-welcome" id="dash-welcome">
          <div className="dash-welcome-text">
            <h1>{greeting()}, {user?.name?.split(' ')[0]} 👋</h1>
            <p>Here's an overview of your volunteering journey</p>
          </div>
          <Link to="/explore" className="btn btn-primary">
            Explore Causes <span className="btn-arrow">→</span>
          </Link>
        </div>

        {/* Stats Grid */}
        {loadingData ? (
          <div className="dash-loading">Loading your data...</div>
        ) : (
          <>
            <div className="dash-stats-grid" id="dash-stats">
              <div className="dash-stat-card">
                <div className="dash-stat-icon" style={{ background: 'rgba(45, 106, 79, 0.1)', color: 'var(--color-primary)' }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
                  </svg>
                </div>
                <div className="dash-stat-info">
                  <span className="dash-stat-number">{stats?.totalTasks ?? 0}</span>
                  <span className="dash-stat-label">Total Tasks</span>
                </div>
              </div>

              <div className="dash-stat-card">
                <div className="dash-stat-icon" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10B981' }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                </div>
                <div className="dash-stat-info">
                  <span className="dash-stat-number">{stats?.completedTasks ?? 0}</span>
                  <span className="dash-stat-label">Completed</span>
                </div>
              </div>

              <div className="dash-stat-card">
                <div className="dash-stat-icon" style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#3B82F6' }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                  </svg>
                </div>
                <div className="dash-stat-info">
                  <span className="dash-stat-number">{stats?.ongoingTasks ?? 0}</span>
                  <span className="dash-stat-label">Ongoing</span>
                </div>
              </div>

              <div className="dash-stat-card">
                <div className="dash-stat-icon" style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#F59E0B' }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
                  </svg>
                </div>
                <div className="dash-stat-info">
                  <span className="dash-stat-number">{stats?.comingUpTasks ?? 0}</span>
                  <span className="dash-stat-label">Coming Up</span>
                </div>
              </div>
            </div>

            {/* My Causes */}
            <div className="dash-section" id="dash-causes">
              <h2 className="dash-section-title">My Causes</h2>
              {causes.length === 0 ? (
                <div className="dash-empty">
                  <div className="dash-empty-icon">🌱</div>
                  <h3>No causes yet</h3>
                  <p>Join a cause to start your volunteering journey!</p>
                  <Link to="/explore" className="btn btn-primary">
                    Browse Causes <span className="btn-arrow">→</span>
                  </Link>
                </div>
              ) : (
                <div className="dash-causes-grid">
                  {causes.map((cause) => (
                    <div key={cause.id} className="dash-cause-card">
                      <div className="dash-cause-header">
                        <div className="dash-cause-avatar">
                          {cause.name?.charAt(0)?.toUpperCase()}
                        </div>
                        <div>
                          <h3 className="dash-cause-name">{cause.name}</h3>
                          <span className="dash-cause-badge">
                            {cause.restricted ? '🔒 Restricted' : '🌍 Open'}
                          </span>
                        </div>
                      </div>
                      <p className="dash-cause-desc">
                        {cause.description || 'No description provided.'}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Account Info */}
            <div className="dash-section" id="dash-profile">
              <h2 className="dash-section-title">Account Info</h2>
              <div className="dash-profile-card">
                <div className="dash-profile-row">
                  <span className="dash-profile-label">Name</span>
                  <span className="dash-profile-value">{user?.name}</span>
                </div>
                <div className="dash-profile-row">
                  <span className="dash-profile-label">Email</span>
                  <span className="dash-profile-value">{user?.email}</span>
                </div>
                <div className="dash-profile-row">
                  <span className="dash-profile-label">Member Since</span>
                  <span className="dash-profile-value">
                    {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', {
                      year: 'numeric', month: 'long', day: 'numeric'
                    }) : '—'}
                  </span>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  )
}

export default DashboardPage
