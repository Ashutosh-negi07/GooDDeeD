import { Link } from 'react-router-dom'
import { Home, ArrowLeft } from 'lucide-react'
import './NotFoundPage.css'

function NotFoundPage() {
  return (
    <div className="notfound-page">
      <div className="notfound-content">
        <div className="notfound-icon">🌍</div>
        <h1 className="notfound-code">404</h1>
        <h2 className="notfound-title">Page Not Found</h2>
        <p className="notfound-desc">
          Looks like this page got lost on its way to doing good.
          Let's get you back to making a difference!
        </p>
        <div className="notfound-actions">
          <Link to="/" className="btn btn-primary btn-lg">
            <Home size={18} /> Go Home
          </Link>
          <Link to="/explore" className="btn btn-outline btn-lg">
            <ArrowLeft size={18} /> Explore Causes
          </Link>
        </div>
      </div>
    </div>
  )
}

export default NotFoundPage
