import { Link } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import './Navbar.css'

function Navbar() {
  const { user, logout } = useAuth()

  return (
    <nav className="navbar" id="navbar">
      <div className="container navbar-inner">
        <Link to="/" className="navbar-logo">
          <span className="logo-heart">&#x2764;</span>
          <span className="logo-text">GooDDeeD</span>
        </Link>

        <ul className="navbar-links">
          <li><Link to="/">Home</Link></li>
          <li><Link to="/explore">Explore</Link></li>
        </ul>

        <div className="navbar-actions">
          {user ? (
            <>
              <Link to="/dashboard" className="navbar-login">Dashboard</Link>
              <button onClick={logout} className="btn btn-primary navbar-register">Logout</button>
            </>
          ) : (
            <>
              <Link to="/login" className="navbar-login">Login</Link>
              <Link to="/register" className="btn btn-primary navbar-register">Register</Link>
            </>
          )}
        </div>

        <button className="navbar-toggle" aria-label="Toggle menu" onClick={() => {
          document.querySelector('.nav-shared .navbar-links')?.classList.toggle('open')
          document.querySelector('.nav-shared .navbar-actions')?.classList.toggle('open')
        }}>
          <span></span>
          <span></span>
          <span></span>
        </button>
      </div>
    </nav>
  )
}

export default Navbar
