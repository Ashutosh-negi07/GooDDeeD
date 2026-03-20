import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, Save, Trash2, Plus, Target, ListTodo, Users, Shield, UserCheck, Clock, Check, X, Edit3 } from 'lucide-react'
import { causesAPI } from '../api/causes'
import { goalsAPI } from '../api/goals'
import { tasksAPI } from '../api/tasks'
import { membershipsAPI } from '../api/memberships'
import toast from 'react-hot-toast'
import DashboardLayout from '../components/layout/DashboardLayout'
import './ManageCausePage.css'

function ManageCausePage() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [cause, setCause] = useState(null)
  const [goals, setGoals] = useState([])
  const [tasks, setTasks] = useState([])
  const [members, setMembers] = useState([])
  const [hasAccess, setHasAccess] = useState(true)
  const [loading, setLoading] = useState(true)
  const [activeSection, setActiveSection] = useState('details')

  // Edit cause form
  const [causeName, setCauseName] = useState('')
  const [causeDesc, setCauseDesc] = useState('')
  const [causeRestricted, setCauseRestricted] = useState(false)
  const [saving, setSaving] = useState(false)

  // New goal form
  const [showGoalForm, setShowGoalForm] = useState(false)
  const [goalTitle, setGoalTitle] = useState('')
  const [goalDesc, setGoalDesc] = useState('')

  // New task form
  const [showTaskForm, setShowTaskForm] = useState(false)
  const [taskTitle, setTaskTitle] = useState('')
  const [taskDesc, setTaskDesc] = useState('')
  const [taskStatus, setTaskStatus] = useState('COMING_UP')
  const [taskGoalId, setTaskGoalId] = useState('')
  const [taskDueDate, setTaskDueDate] = useState('')

  useEffect(() => {
    fetchAll()
  }, [id])

  async function fetchAll() {
    setLoading(true)
    try {
      const myMembershipsRes = await membershipsAPI.getMy()
      const myMembership = myMembershipsRes.data.find(m => m.causeId === id)

      if (!myMembership || myMembership.role !== 'ADMIN' || !myMembership.approved) {
        setHasAccess(false)
        toast.error('Only approved admins can manage this cause')
        navigate(`/causes/${id}`)
        return
      }

      setHasAccess(true)

      const [causeRes, goalsRes, tasksRes, membersRes] = await Promise.all([
        causesAPI.getById(id),
        goalsAPI.getByCause(id, 0, 100),
        tasksAPI.getByCause(id, { page: 0, size: 100 }).catch(() => null),
        membershipsAPI.getByCause(id).catch(() => null),
      ])
      setCause(causeRes.data)
      setCauseName(causeRes.data.name)
      setCauseDesc(causeRes.data.description || '')
      setCauseRestricted(causeRes.data.restricted)
      setGoals(goalsRes.data.content || [])
      if (tasksRes) setTasks(tasksRes.data.content || [])
      if (membersRes) setMembers(membersRes.data || [])
    } catch {
      toast.error('Failed to load cause data')
      navigate('/dashboard/causes')
    } finally {
      setLoading(false)
    }
  }

  // Save cause details
  async function handleSaveCause(e) {
    e.preventDefault()
    setSaving(true)
    try {
      await causesAPI.update(id, { name: causeName, description: causeDesc, restricted: causeRestricted })
      toast.success('Cause updated!')
      fetchAll()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update')
    } finally {
      setSaving(false)
    }
  }

  // Delete cause
  async function handleDeleteCause() {
    if (!confirm('Are you sure you want to delete this cause? This cannot be undone.')) return
    try {
      await causesAPI.delete(id)
      toast.success('Cause deleted')
      navigate('/dashboard/causes')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete')
    }
  }

  // Create goal
  async function handleCreateGoal(e) {
    e.preventDefault()
    try {
      await goalsAPI.create({ causeId: id, title: goalTitle, description: goalDesc })
      toast.success('Goal created!')
      setGoalTitle('')
      setGoalDesc('')
      setShowGoalForm(false)
      fetchAll()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create goal')
    }
  }

  // Delete goal
  async function handleDeleteGoal(goalId) {
    if (!confirm('Delete this goal?')) return
    try {
      await goalsAPI.delete(goalId)
      toast.success('Goal deleted')
      fetchAll()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete goal')
    }
  }

  // Create task
  async function handleCreateTask(e) {
    e.preventDefault()
    try {
      const data = {
        title: taskTitle,
        description: taskDesc,
        status: taskStatus,
        causeId: id,
        goalId: taskGoalId || null,
        dueDate: taskDueDate ? new Date(taskDueDate).toISOString() : null,
      }
      await tasksAPI.create(data)
      toast.success('Task created!')
      setTaskTitle('')
      setTaskDesc('')
      setTaskStatus('COMING_UP')
      setTaskGoalId('')
      setTaskDueDate('')
      setShowTaskForm(false)
      fetchAll()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create task')
    }
  }

  // Delete task
  async function handleDeleteTask(taskId) {
    if (!confirm('Delete this task?')) return
    try {
      await tasksAPI.delete(taskId)
      toast.success('Task deleted')
      fetchAll()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete task')
    }
  }

  // Update task status
  async function handleStatusChange(taskId, newStatus) {
    try {
      await tasksAPI.updateStatus(taskId, newStatus)
      toast.success('Status updated')
      fetchAll()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update status')
    }
  }

  // Approve / Reject member
  async function handleApprove(membershipId) {
    try {
      await membershipsAPI.approve(membershipId)
      toast.success('Member approved!')
      fetchAll()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to approve')
    }
  }

  async function handleReject(membershipId) {
    if (!confirm('Reject and remove this member?')) return
    try {
      await membershipsAPI.reject(membershipId)
      toast.success('Member rejected')
      fetchAll()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to reject')
    }
  }

  const statusOptions = [
    { value: 'COMING_UP', label: 'Coming Up', color: '#D97706' },
    { value: 'IN_PROGRESS', label: 'In Progress', color: '#3B82F6' },
    { value: 'COMPLETED', label: 'Completed', color: '#059669' },
  ]

  if (loading) {
    return (
      <DashboardLayout>
        <div className="manage-loading">
          <div className="explore-spinner"></div>
          <p>Loading cause...</p>
        </div>
      </DashboardLayout>
    )
  }

  if (!hasAccess) {
    return null
  }

  return (
    <DashboardLayout>
      <div className="manage-page">
        <Link to={`/causes/${id}`} className="manage-back">
          <ArrowLeft size={16} /> Back to Cause
        </Link>

        <div className="manage-header">
          <div>
            <h1 className="manage-title">Manage: {cause?.name}</h1>
            <p className="manage-subtitle">Admin panel for managing goals, tasks, and members.</p>
          </div>
        </div>

        {/* Section Tabs */}
        <div className="manage-tabs">
          {[
            { key: 'details', label: 'Details', icon: <Edit3 size={16} /> },
            { key: 'goals', label: `Goals (${goals.length})`, icon: <Target size={16} /> },
            { key: 'tasks', label: `Tasks (${tasks.length})`, icon: <ListTodo size={16} /> },
            { key: 'members', label: `Members (${members.length})`, icon: <Users size={16} /> },
          ].map(tab => (
            <button
              key={tab.key}
              className={`manage-tab ${activeSection === tab.key ? 'active' : ''}`}
              onClick={() => setActiveSection(tab.key)}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {/* Details Section */}
        {activeSection === 'details' && (
          <div className="manage-section">
            <form onSubmit={handleSaveCause} className="manage-form">
              <div className="form-group">
                <label>Cause Name</label>
                <input type="text" value={causeName} onChange={e => setCauseName(e.target.value)} required minLength={2} maxLength={100} />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea rows={4} value={causeDesc} onChange={e => setCauseDesc(e.target.value)} maxLength={500} placeholder="Describe this cause..." />
              </div>
              <div className="manage-checkbox-row">
                <label className="manage-checkbox-label">
                  <input type="checkbox" checked={causeRestricted} onChange={e => setCauseRestricted(e.target.checked)} />
                  <span>Restricted (requires admin approval to join)</span>
                </label>
              </div>
              <div className="manage-form-actions">
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  <Save size={16} /> {saving ? 'Saving...' : 'Save Changes'}
                </button>
                <button type="button" className="btn btn-danger" onClick={handleDeleteCause}>
                  <Trash2 size={16} /> Delete Cause
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Goals Section */}
        {activeSection === 'goals' && (
          <div className="manage-section">
            <div className="manage-section-header">
              <h3>Goals</h3>
              <button className="btn btn-primary btn-sm" onClick={() => setShowGoalForm(!showGoalForm)}>
                <Plus size={16} /> Add Goal
              </button>
            </div>

            {showGoalForm && (
              <form onSubmit={handleCreateGoal} className="manage-inline-form">
                <div className="form-group">
                  <label>Title</label>
                  <input type="text" value={goalTitle} onChange={e => setGoalTitle(e.target.value)} required minLength={2} maxLength={200} placeholder="e.g., Plant 100 trees by December" />
                </div>
                <div className="form-group">
                  <label>Description (optional)</label>
                  <input type="text" value={goalDesc} onChange={e => setGoalDesc(e.target.value)} maxLength={500} placeholder="Brief description..." />
                </div>
                <div className="manage-inline-actions">
                  <button type="submit" className="btn btn-primary btn-sm"><Check size={14} /> Create</button>
                  <button type="button" className="btn btn-outline btn-sm" onClick={() => setShowGoalForm(false)}><X size={14} /> Cancel</button>
                </div>
              </form>
            )}

            {goals.length === 0 ? (
              <div className="manage-empty">No goals yet. Create one above.</div>
            ) : (
              <div className="manage-items">
                {goals.map(goal => (
                  <div key={goal.id} className="manage-item">
                    <div className="manage-item-icon"><Target size={18} /></div>
                    <div className="manage-item-info">
                      <h4>{goal.title}</h4>
                      <p>{goal.description || 'No description'}</p>
                    </div>
                    <button className="manage-delete-btn" onClick={() => handleDeleteGoal(goal.id)} title="Delete goal">
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tasks Section */}
        {activeSection === 'tasks' && (
          <div className="manage-section">
            <div className="manage-section-header">
              <h3>Tasks</h3>
              <button className="btn btn-primary btn-sm" onClick={() => setShowTaskForm(!showTaskForm)}>
                <Plus size={16} /> Add Task
              </button>
            </div>

            {showTaskForm && (
              <form onSubmit={handleCreateTask} className="manage-inline-form">
                <div className="form-group">
                  <label>Title</label>
                  <input type="text" value={taskTitle} onChange={e => setTaskTitle(e.target.value)} required maxLength={200} placeholder="e.g., Organize Saturday cleanup" />
                </div>
                <div className="form-group">
                  <label>Description (optional)</label>
                  <input type="text" value={taskDesc} onChange={e => setTaskDesc(e.target.value)} maxLength={500} placeholder="Brief description..." />
                </div>
                <div className="manage-form-row">
                  <div className="form-group">
                    <label>Status</label>
                    <select value={taskStatus} onChange={e => setTaskStatus(e.target.value)}>
                      {statusOptions.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Goal (optional)</label>
                    <select value={taskGoalId} onChange={e => setTaskGoalId(e.target.value)}>
                      <option value="">No goal</option>
                      {goals.map(g => <option key={g.id} value={g.id}>{g.title}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Due Date (optional)</label>
                    <input type="date" value={taskDueDate} onChange={e => setTaskDueDate(e.target.value)} />
                  </div>
                </div>
                <div className="manage-inline-actions">
                  <button type="submit" className="btn btn-primary btn-sm"><Check size={14} /> Create</button>
                  <button type="button" className="btn btn-outline btn-sm" onClick={() => setShowTaskForm(false)}><X size={14} /> Cancel</button>
                </div>
              </form>
            )}

            {tasks.length === 0 ? (
              <div className="manage-empty">No tasks yet. Create one above.</div>
            ) : (
              <div className="manage-items">
                {tasks.map(task => {
                  const stOpt = statusOptions.find(s => s.value === task.status)
                  return (
                    <div key={task.id} className="manage-item">
                      <div className="manage-item-info" style={{ flex: 1 }}>
                        <h4>{task.title}</h4>
                        <p>{task.description || 'No description'}</p>
                        {task.goalTitle && <span className="manage-task-goal"><Target size={12} /> {task.goalTitle}</span>}
                      </div>
                      <select
                        className="manage-status-select"
                        value={task.status}
                        onChange={e => handleStatusChange(task.id, e.target.value)}
                        style={{ color: stOpt?.color }}
                      >
                        {statusOptions.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                      </select>
                      <button className="manage-delete-btn" onClick={() => handleDeleteTask(task.id)} title="Delete task">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* Members Section */}
        {activeSection === 'members' && (
          <div className="manage-section">
            <div className="manage-section-header">
              <h3>Members</h3>
            </div>

            {members.length === 0 ? (
              <div className="manage-empty">No members yet.</div>
            ) : (
              <div className="manage-items">
                {members.map(member => (
                  <div key={member.membershipId} className="manage-item member-item">
                    <div className="manage-member-avatar">
                      {member.userName?.charAt(0)?.toUpperCase() || '?'}
                    </div>
                    <div className="manage-item-info" style={{ flex: 1 }}>
                      <h4>{member.userName}</h4>
                      <div className="manage-member-badges">
                        <span className={`mycauses-role-badge ${member.role === 'ADMIN' ? 'admin' : 'supporter'}`}>
                          {member.role === 'ADMIN' ? <><Shield size={12} /> Admin</> : <><UserCheck size={12} /> Supporter</>}
                        </span>
                        {!member.approved && (
                          <span className="manage-pending"><Clock size={12} /> Pending</span>
                        )}
                        {member.approved && (
                          <span className="manage-approved"><Check size={12} /> Approved</span>
                        )}
                      </div>
                    </div>
                    {!member.approved && member.role !== 'ADMIN' && (
                      <div className="manage-member-actions">
                        <button className="btn btn-primary btn-sm" onClick={() => handleApprove(member.membershipId)}>
                          <Check size={14} /> Approve
                        </button>
                        <button className="btn btn-danger btn-sm" onClick={() => handleReject(member.membershipId)}>
                          <X size={14} /> Reject
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}

export default ManageCausePage
