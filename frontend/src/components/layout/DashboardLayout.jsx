import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { LayoutDashboard, ListTodo, Heart, User, LogOut, Search, Plus } from 'lucide-react'
import './DashboardLayout.css'

function DashboardLayout({ children }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  return (
    <div className="dash-layout">
      {/* Top Navbar */}
      <nav className="dash-topbar">
        <div className="container dash-topbar-inner">
          <Link to="/" className="navbar-logo">
            <span className="logo-heart">&#x2764;</span>
            <span className="logo-text">GooDDeeD</span>
          </Link>
          <div className="dash-topbar-right">
            <div className="dash-user-info">
              <div className="dash-avatar">
                {user?.name?.charAt(0)?.toUpperCase() || '?'}
              </div>
              <span className="dash-user-name">{user?.name}</span>
            </div>
            <button onClick={handleLogout} className="btn btn-outline dash-logout-btn" id="logout-btn">
              <LogOut size={16} />
              Logout
            </button>
          </div>
        </div>
      </nav>

      <div className="dash-body">
        {/* Sidebar */}
        <aside className="dash-sidebar">
          <nav className="dash-sidebar-nav">
            <NavLink to="/dashboard" end className={({ isActive }) => `dash-sidebar-link ${isActive ? 'active' : ''}`}>
              <LayoutDashboard size={20} />
              <span>Dashboard</span>
            </NavLink>
            <NavLink to="/dashboard/tasks" className={({ isActive }) => `dash-sidebar-link ${isActive ? 'active' : ''}`}>
              <ListTodo size={20} />
              <span>My Tasks</span>
            </NavLink>
            <NavLink to="/dashboard/causes" className={({ isActive }) => `dash-sidebar-link ${isActive ? 'active' : ''}`}>
              <Heart size={20} />
              <span>My Causes</span>
            </NavLink>
            <NavLink to="/causes/create" className={({ isActive }) => `dash-sidebar-link ${isActive ? 'active' : ''}`}>
              <Plus size={20} />
              <span>Create Cause</span>
            </NavLink>
            <NavLink to="/explore" className={({ isActive }) => `dash-sidebar-link ${isActive ? 'active' : ''}`}>
              <Search size={20} />
              <span>Explore</span>
            </NavLink>
            <NavLink to="/profile" className={({ isActive }) => `dash-sidebar-link ${isActive ? 'active' : ''}`}>
              <User size={20} />
              <span>Profile</span>
            </NavLink>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="dash-content">
          <div className="container">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}

export default DashboardLayout
