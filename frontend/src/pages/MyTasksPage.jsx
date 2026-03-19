import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ListTodo, Filter, Calendar, Target, ChevronLeft, ChevronRight } from 'lucide-react'
import { tasksAPI } from '../api/tasks'
import { causesAPI } from '../api/causes'
import DashboardLayout from '../components/layout/DashboardLayout'
import './MyTasksPage.css'

function MyTasksPage() {
  const [tasks, setTasks] = useState([])
  const [causes, setCauses] = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [statusFilter, setStatusFilter] = useState('')
  const [causeFilter, setCauseFilter] = useState('')
  const size = 10

  useEffect(() => {
    causesAPI.getMyCauses().then(res => setCauses(res.data)).catch(() => {})
  }, [])

  useEffect(() => {
    fetchTasks()
  }, [page, statusFilter, causeFilter])

  async function fetchTasks() {
    setLoading(true)
    try {
      const params = { page, size }
      if (statusFilter) params.status = statusFilter
      if (causeFilter) params.causeId = causeFilter
      const res = await tasksAPI.getMyTasks(params)
      setTasks(res.data.content || [])
      setTotalPages(res.data.page?.totalPages ?? res.data.totalPages ?? 0)
    } catch {
      setTasks([])
    } finally {
      setLoading(false)
    }
  }

  const statusColors = {
    COMING_UP: { bg: 'rgba(245, 158, 11, 0.1)', color: '#D97706', label: 'Coming Up' },
    ONGOING: { bg: 'rgba(59, 130, 246, 0.1)', color: '#3B82F6', label: 'Ongoing' },
    COMPLETED: { bg: 'rgba(16, 185, 129, 0.1)', color: '#059669', label: 'Completed' },
  }

  return (
    <DashboardLayout>
      <div className="mytasks-page">
        <div className="mytasks-header">
          <div>
            <h1 className="mytasks-title">My Tasks</h1>
            <p className="mytasks-subtitle">View and filter all tasks from causes you belong to.</p>
          </div>
        </div>

        {/* Filters */}
        <div className="mytasks-filters">
          <Filter size={18} className="mytasks-filter-icon" />
          <select
            className="mytasks-select"
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(0) }}
          >
            <option value="">All Statuses</option>
            <option value="COMING_UP">Coming Up</option>
            <option value="ONGOING">Ongoing</option>
            <option value="COMPLETED">Completed</option>
          </select>
          <select
            className="mytasks-select"
            value={causeFilter}
            onChange={(e) => { setCauseFilter(e.target.value); setPage(0) }}
          >
            <option value="">All Causes</option>
            {causes.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        {/* Task List */}
        {loading ? (
          <div className="mytasks-loading">
            <div className="explore-spinner"></div>
            <p>Loading tasks...</p>
          </div>
        ) : tasks.length === 0 ? (
          <div className="mytasks-empty">
            <ListTodo size={48} />
            <h3>No tasks found</h3>
            <p>
              {statusFilter || causeFilter
                ? 'Try changing your filters.'
                : 'Join a cause to see tasks here.'}
            </p>
            {!statusFilter && !causeFilter && (
              <Link to="/explore" className="btn btn-primary">
                Explore Causes <span className="btn-arrow">→</span>
              </Link>
            )}
          </div>
        ) : (
          <>
            <div className="mytasks-list">
              {tasks.map(task => {
                const st = statusColors[task.status] || statusColors.COMING_UP
                return (
                  <div key={task.id} className="mytasks-card">
                    <div className="mytasks-card-left">
                      <span className="mytasks-status" style={{ background: st.bg, color: st.color }}>
                        {st.label}
                      </span>
                      <div className="mytasks-card-info">
                        <h4>{task.title}</h4>
                        <p>{task.description || 'No description'}</p>
                        <div className="mytasks-card-meta">
                          {task.causeName && (
                            <span className="mytasks-cause-tag">{task.causeName}</span>
                          )}
                          {task.goalTitle && (
                            <span className="mytasks-goal-tag">
                              <Target size={12} /> {task.goalTitle}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    {task.dueDate && (
                      <span className="mytasks-due">
                        <Calendar size={14} />
                        {new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                    )}
                  </div>
                )
              })}
            </div>

            {totalPages > 1 && (
              <div className="mytasks-pagination">
                <button
                  className="explore-page-btn"
                  disabled={page === 0}
                  onClick={() => setPage(p => p - 1)}
                >
                  <ChevronLeft size={18} /> Prev
                </button>
                <span className="mytasks-page-info">Page {page + 1} of {totalPages}</span>
                <button
                  className="explore-page-btn"
                  disabled={page >= totalPages - 1}
                  onClick={() => setPage(p => p + 1)}
                >
                  Next <ChevronRight size={18} />
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  )
}

export default MyTasksPage
