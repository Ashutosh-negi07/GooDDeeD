import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Heart, Shield, UserCheck, Lock, Globe, Clock, Settings, Plus } from 'lucide-react'
import { causesAPI } from '../api/causes'
import { membershipsAPI } from '../api/memberships'
import DashboardLayout from '../components/layout/DashboardLayout'
import './MyCausesPage.css'

function MyCausesPage() {
  const [memberships, setMemberships] = useState([])
  const [causes, setCauses] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    setLoading(true)
    try {
      const [membershipsRes, causesRes] = await Promise.all([
        membershipsAPI.getMy(),
        causesAPI.getMyCauses(),
      ])
      setMemberships(membershipsRes.data || [])
      setCauses(causesRes.data || [])
    } catch {
      setMemberships([])
      setCauses([])
    } finally {
      setLoading(false)
    }
  }

  const getMembership = (causeId) => memberships.find(m => m.causeId === causeId)

  const causeIcons = ['🧹', '📚', '🌳', '🍲', '🐾', '🏡', '👵', '💰']

  return (
    <DashboardLayout>
      <div className="mycauses-page">
        <div className="mycauses-header">
          <div>
            <h1 className="mycauses-title">My Causes</h1>
            <p className="mycauses-subtitle">Causes you've joined and your role in each.</p>
          </div>
          <div className="mycauses-header-actions">
            <Link to="/causes/create" className="btn btn-primary">
              <Plus size={16} /> Create Cause
            </Link>
            <Link to="/explore" className="btn btn-outline">
              Explore More <span className="btn-arrow">→</span>
            </Link>
          </div>
        </div>

        {loading ? (
          <div className="mycauses-loading">
            <div className="explore-spinner"></div>
            <p>Loading causes...</p>
          </div>
        ) : causes.length === 0 ? (
          <div className="mycauses-empty">
            <Heart size={48} />
            <h3>No causes yet</h3>
            <p>Join a cause to start making a difference!</p>
            <Link to="/explore" className="btn btn-primary">
              Browse Causes <span className="btn-arrow">→</span>
            </Link>
          </div>
        ) : (
          <div className="mycauses-grid">
            {causes.map((cause, index) => {
              const m = getMembership(cause.id)
              const isAdmin = m?.role === 'ADMIN'
              return (
                <div key={cause.id} className="mycauses-card">
                  <div className="mycauses-card-top">
                    <div className="mycauses-card-icon">
                      {causeIcons[index % causeIcons.length]}
                    </div>
                    <div className="mycauses-card-badges">
                      <span className={`mycauses-role-badge ${isAdmin ? 'admin' : 'supporter'}`}>
                        {isAdmin ? <><Shield size={12} /> Admin</> : <><UserCheck size={12} /> Supporter</>}
                      </span>
                      {m && !m.approved && (
                        <span className="mycauses-pending">
                          <Clock size={12} /> Pending
                        </span>
                      )}
                    </div>
                  </div>

                  <h3 className="mycauses-card-name">{cause.name}</h3>
                  <p className="mycauses-card-desc">
                    {cause.description || 'No description provided.'}
                  </p>

                  <div className="mycauses-card-footer">
                    <span className={`mycauses-access ${cause.restricted ? 'restricted' : 'open'}`}>
                      {cause.restricted ? <><Lock size={12} /> Restricted</> : <><Globe size={12} /> Open</>}
                    </span>
                    <div className="mycauses-card-actions">
                      <Link to={`/causes/${cause.id}`} className="mycauses-link">View</Link>
                      {isAdmin && (
                        <Link to={`/cause/${cause.id}/manage`} className="mycauses-link manage">
                          <Settings size={14} /> Manage
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}

export default MyCausesPage
