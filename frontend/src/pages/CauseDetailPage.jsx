import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, Lock, Globe, Users, Target, ListTodo, Calendar, Shield, UserCheck, Clock, CheckCircle2, AlertCircle } from 'lucide-react'
import { causesAPI } from '../api/causes'
import { goalsAPI } from '../api/goals'
import { tasksAPI } from '../api/tasks'
import { membershipsAPI } from '../api/memberships'
import { useAuth } from '../hooks/useAuth'
import toast from 'react-hot-toast'
import Navbar from '../components/layout/Navbar'
import Footer from '../components/layout/Footer'
import causeTeaching from '../assets/cause-teaching.png'
import causeCleanup from '../assets/cause-cleanup.png'
import causeTrees from '../assets/cause-trees.png'
import heroVolunteers from '../assets/hero-volunteers.png'
import './CauseDetailPage.css'

function CauseDetailPage() {
  const { id } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()

  const [cause, setCause] = useState(null)
  const [goals, setGoals] = useState([])
  const [tasks, setTasks] = useState([])
  const [members, setMembers] = useState([])
  const [membership, setMembership] = useState(null)
  const [loading, setLoading] = useState(true)
  const [joining, setJoining] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')

  useEffect(() => {
    fetchCauseData()
  }, [id])

  async function fetchCauseData() {
    setLoading(true)
    try {
      const causeRes = await causesAPI.getById(id)
      setCause(causeRes.data)

      // Fetch goals (public)
      const goalsRes = await goalsAPI.getByCause(id, 0, 50).catch(() => null)
      if (goalsRes) setGoals(goalsRes.data.content || [])

      // If logged in, fetch tasks, members, and membership status
      if (user) {
        const [tasksRes, membersRes, myMembershipsRes] = await Promise.all([
          tasksAPI.getByCause(id, { page: 0, size: 50 }).catch(() => null),
          membershipsAPI.getByCause(id).catch(() => null),
          membershipsAPI.getMy().catch(() => null),
        ])
        if (tasksRes) setTasks(tasksRes.data.content || [])
        if (membersRes) setMembers(membersRes.data || [])
        if (myMembershipsRes) {
          const mine = myMembershipsRes.data.find(m => m.causeId === id)
          setMembership(mine || null)
        }
      }
    } catch {
      toast.error('Failed to load cause')
    } finally {
      setLoading(false)
    }
  }

  async function handleJoin() {
    if (!user) {
      navigate('/login')
      return
    }
    setJoining(true)
    try {
      const res = await membershipsAPI.join(id)
      setMembership(res.data)
      toast.success(cause.restricted ? 'Join request sent! Awaiting approval.' : 'You joined this cause!')
      fetchCauseData()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to join')
    } finally {
      setJoining(false)
    }
  }

  async function handleLeave() {
    try {
      await membershipsAPI.leave(id)
      setMembership(null)
      toast.success('You left this cause')
      fetchCauseData()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to leave')
    }
  }

  const isAdmin = membership?.role === 'ADMIN'
  const isMember = membership?.approved === true

  const goalText = goals
    .map(goal => `${goal.title || ''} ${goal.description || ''}`)
    .join(' ')
    .toLowerCase()
  const causeText = `${cause?.name || ''} ${cause?.description || ''}`.toLowerCase()
  const matchText = `${causeText} ${goalText}`

  const hasKeyword = (keywords) => keywords.some(keyword => matchText.includes(keyword))

  let headerImage = heroVolunteers
  if (hasKeyword(['teach', 'education', 'school', 'student', 'literacy', 'mentor', 'tutor'])) {
    headerImage = causeTeaching
  } else if (hasKeyword(['cleanup', 'clean', 'beach', 'ocean', 'plastic', 'waste', 'recycle'])) {
    headerImage = causeCleanup
  } else if (hasKeyword(['tree', 'forest', 'plant', 'green', 'climate', 'nature', 'environment'])) {
    headerImage = causeTrees
  }

  const headerStyle = {
    backgroundImage: `linear-gradient(135deg, rgba(26, 95, 64, 0.82) 0%, rgba(16, 61, 41, 0.82) 100%), url(${headerImage})`,
  }

  const statusColors = {
    COMING_UP: { bg: 'rgba(245, 158, 11, 0.1)', color: '#D97706', label: 'Coming Up' },
    ONGOING: { bg: 'rgba(59, 130, 246, 0.1)', color: '#3B82F6', label: 'Ongoing' },
    COMPLETED: { bg: 'rgba(16, 185, 129, 0.1)', color: '#059669', label: 'Completed' },
  }

  return (
    <div className="cause-detail-page">
      <Navbar />

      {loading ? (
        <div className="cause-detail-loading">
          <div className="explore-spinner"></div>
          <p>Loading cause...</p>
        </div>
      ) : !cause ? (
        <>
          <div className="cause-detail-loading">
            <h2>Cause not found</h2>
            <Link to="/explore" className="btn btn-primary">Back to Explore</Link>
          </div>
          <Footer />
        </>
      ) : (
        <>

      {/* Header */}
      <section className="cd-header" style={headerStyle}>
        <div className="container">
          <Link to="/explore" className="cd-back">
            <ArrowLeft size={18} /> Back to Explore
          </Link>
          <div className="cd-header-content">
            <div className="cd-header-info">
              <div className="cd-header-badges">
                <span className={`cd-badge ${cause.restricted ? 'restricted' : 'open'}`}>
                  {cause.restricted ? <><Lock size={14} /> Restricted</> : <><Globe size={14} /> Open</>}
                </span>
              </div>
              <h1 className="cd-title">{cause.name}</h1>
              <p className="cd-description">{cause.description || 'No description available.'}</p>
              <div className="cd-meta">
                <span><Calendar size={14} /> Created {new Date(cause.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
                <span><Users size={14} /> {members.length} member{members.length !== 1 ? 's' : ''}</span>
                <span><Target size={14} /> {goals.length} goal{goals.length !== 1 ? 's' : ''}</span>
                <span><ListTodo size={14} /> {tasks.length} task{tasks.length !== 1 ? 's' : ''}</span>
              </div>
            </div>
            <div className="cd-header-actions">
              {membership ? (
                <>
                  {!membership.approved && (
                    <div className="cd-pending-badge">
                      <Clock size={16} /> Pending Approval
                    </div>
                  )}
                  {isAdmin && (
                    <Link to={`/cause/${id}/manage`} className="btn btn-primary">
                      <Shield size={16} /> Manage Cause
                    </Link>
                  )}
                  {membership.approved && (
                    <button onClick={handleLeave} className="btn btn-outline cd-leave-btn">
                      Leave Cause
                    </button>
                  )}
                </>
              ) : (
                <button onClick={handleJoin} className="btn btn-primary btn-lg" disabled={joining}>
                  {joining ? 'Joining...' : 'Join This Cause'} {!joining && <span className="btn-arrow">→</span>}
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Tabs */}
      <section className="cd-tabs-section">
        <div className="container">
          <div className="cd-tabs">
            <button className={`cd-tab ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')}>
              Overview
            </button>
            <button className={`cd-tab ${activeTab === 'goals' ? 'active' : ''}`} onClick={() => setActiveTab('goals')}>
              Goals ({goals.length})
            </button>
            {isMember && (
              <button className={`cd-tab ${activeTab === 'tasks' ? 'active' : ''}`} onClick={() => setActiveTab('tasks')}>
                Tasks ({tasks.length})
              </button>
            )}
            <button className={`cd-tab ${activeTab === 'members' ? 'active' : ''}`} onClick={() => setActiveTab('members')}>
              Members ({members.length})
            </button>
          </div>
        </div>
      </section>

      {/* Tab Content */}
      <section className="cd-content">
        <div className="container">

          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="cd-overview">
              <div className="cd-stats-row">
                <div className="cd-stat-card">
                  <Target size={24} className="cd-stat-icon" />
                  <div className="cd-stat-number">{goals.length}</div>
                  <div className="cd-stat-label">Goals</div>
                </div>
                <div className="cd-stat-card">
                  <ListTodo size={24} className="cd-stat-icon" />
                  <div className="cd-stat-number">{tasks.length}</div>
                  <div className="cd-stat-label">Tasks</div>
                </div>
                <div className="cd-stat-card">
                  <Users size={24} className="cd-stat-icon" />
                  <div className="cd-stat-number">{members.filter(m => m.approved).length}</div>
                  <div className="cd-stat-label">Active Members</div>
                </div>
                <div className="cd-stat-card">
                  <CheckCircle2 size={24} className="cd-stat-icon" />
                  <div className="cd-stat-number">{tasks.filter(t => t.status === 'COMPLETED').length}</div>
                  <div className="cd-stat-label">Completed</div>
                </div>
              </div>

              {goals.length > 0 && (
                <div className="cd-section">
                  <h3>Recent Goals</h3>
                  <div className="cd-goals-preview">
                    {goals.slice(0, 3).map(goal => (
                      <div key={goal.id} className="cd-goal-card">
                        <Target size={18} />
                        <div>
                          <h4>{goal.title}</h4>
                          <p>{goal.description || 'No description'}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Goals Tab */}
          {activeTab === 'goals' && (
            <div className="cd-goals-tab">
              {goals.length === 0 ? (
                <div className="cd-empty">
                  <Target size={48} />
                  <h3>No goals yet</h3>
                  <p>This cause hasn't set any goals yet.</p>
                </div>
              ) : (
                <div className="cd-goals-list">
                  {goals.map(goal => (
                    <div key={goal.id} className="cd-goal-item">
                      <div className="cd-goal-icon">
                        <Target size={20} />
                      </div>
                      <div className="cd-goal-info">
                        <h4>{goal.title}</h4>
                        <p>{goal.description || 'No description provided'}</p>
                        <span className="cd-goal-date">
                          Added {new Date(goal.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Tasks Tab */}
          {activeTab === 'tasks' && isMember && (
            <div className="cd-tasks-tab">
              {tasks.length === 0 ? (
                <div className="cd-empty">
                  <ListTodo size={48} />
                  <h3>No tasks yet</h3>
                  <p>Tasks will appear here as they're created by admins.</p>
                </div>
              ) : (
                <div className="cd-tasks-list">
                  {tasks.map(task => {
                    const st = statusColors[task.status] || statusColors.COMING_UP
                    return (
                      <div key={task.id} className="cd-task-item">
                        <span className="cd-task-status" style={{ background: st.bg, color: st.color }}>
                          {st.label}
                        </span>
                        <div className="cd-task-info">
                          <h4>{task.title}</h4>
                          <p>{task.description || 'No description'}</p>
                          {task.dueDate && (
                            <span className="cd-task-due">
                              <Calendar size={12} /> Due {new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                            </span>
                          )}
                        </div>
                        {task.goalTitle && (
                          <span className="cd-task-goal">
                            <Target size={12} /> {task.goalTitle}
                          </span>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {/* Members Tab */}
          {activeTab === 'members' && (
            <div className="cd-members-tab">
              {members.length === 0 ? (
                <div className="cd-empty">
                  <Users size={48} />
                  <h3>No members yet</h3>
                  <p>Be the first to join this cause!</p>
                </div>
              ) : (
                <div className="cd-members-list">
                  {members.map(member => (
                    <div key={member.membershipId} className="cd-member-item">
                      <div className="cd-member-avatar">
                        {member.userName?.charAt(0)?.toUpperCase() || '?'}
                      </div>
                      <div className="cd-member-info">
                        <h4>{member.userName}</h4>
                        <div className="cd-member-badges">
                          <span className={`cd-role-badge ${member.role === 'ADMIN' ? 'admin' : 'supporter'}`}>
                            {member.role === 'ADMIN' ? <><Shield size={12} /> Admin</> : <><UserCheck size={12} /> Supporter</>}
                          </span>
                          {!member.approved && (
                            <span className="cd-pending-badge-small">
                              <Clock size={12} /> Pending
                            </span>
                          )}
                        </div>
                      </div>
                      <span className="cd-member-date">
                        Joined {new Date(member.joinedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>
      </section>

      <Footer />
        </>
      )}
    </div>
  )
}

export default CauseDetailPage
