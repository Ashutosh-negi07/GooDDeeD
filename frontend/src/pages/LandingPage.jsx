import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import './LandingPage.css'
import heroImg from '../assets/hero-volunteers.png'
import causeTeaching from '../assets/cause-teaching.png'
import causeCleanup from '../assets/cause-cleanup.png'
import causeTrees from '../assets/cause-trees.png'

function LandingPage() {
  const { user, logout } = useAuth()

  return (
    <div className="landing">
      {/* ===== NAVBAR ===== */}
      <nav className="navbar" id="navbar">
        <div className="container navbar-inner">
          <Link to="/" className="navbar-logo">
            <span className="logo-heart">&#x2764;</span>
            <span className="logo-text">GooDDeeD</span>
          </Link>

          <ul className="navbar-links">
            <li><a href="#hero">Home</a></li>
            <li><Link to="/explore">Explore</Link></li>
            <li><a href="#how-it-works">About</a></li>
            <li><a href="#cta">Contact</a></li>
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

          <button className="navbar-toggle" id="navbar-toggle" aria-label="Toggle menu" onClick={() => {
            document.querySelector('.navbar-links').classList.toggle('open')
            document.querySelector('.navbar-actions').classList.toggle('open')
          }}>
            <span></span>
            <span></span>
            <span></span>
          </button>
        </div>
      </nav>

      {/* ===== HERO ===== */}
      <section className="hero" id="hero">
        <div className="hero-bg">
          <img src={heroImg} alt="Volunteers working together in community" />
          <div className="hero-overlay"></div>
        </div>
        <div className="container hero-content">
          <h1 className="hero-title">
            Make a Difference with Every Good Deed
          </h1>
          <p className="hero-subtitle">
            Join thousands of volunteers making an impact in communities worldwide.
            Whether it's teaching children, cleaning neighborhoods, planting trees,
            or organizing food drives — every good deed counts.
          </p>
          <div className="hero-buttons">
            <Link to="/register" className="btn btn-primary btn-lg">
              Get Started <span className="btn-arrow">→</span>
            </Link>
            <Link to="/explore" className="btn btn-outline-white btn-lg">
              Explore Causes
            </Link>
          </div>
        </div>
      </section>

      {/* ===== DISCOVER CAUSES ===== */}
      <section className="causes-section" id="causes">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">Discover Causes</h2>
            <p className="section-subtitle">
              Find a cause close to your heart and start making a difference today.
            </p>
          </div>

          <div className="causes-grid">
            <div className="cause-card" id="cause-teaching">
              <div className="cause-card-image">
                <img src={causeTeaching} alt="Teaching children" />
                <span className="cause-card-badge">Education</span>
              </div>
              <div className="cause-card-body">
                <h3 className="cause-card-title">Teaching Children</h3>
                <p className="cause-card-desc">
                  Help educate underprivileged children by volunteering as a tutor
                  or mentor in local schools and community centers.
                </p>
                <a href="#" className="cause-card-link">
                  Learn More <span>→</span>
                </a>
              </div>
            </div>

            <div className="cause-card" id="cause-cleanup">
              <div className="cause-card-image">
                <img src={causeCleanup} alt="Community cleanup" />
                <span className="cause-card-badge">Environment</span>
              </div>
              <div className="cause-card-body">
                <h3 className="cause-card-title">Community Cleanup</h3>
                <p className="cause-card-desc">
                  Join neighborhood cleanup drives to keep our parks, streets,
                  and waterways clean and beautiful for everyone.
                </p>
                <a href="#" className="cause-card-link">
                  Learn More <span>→</span>
                </a>
              </div>
            </div>

            <div className="cause-card" id="cause-trees">
              <div className="cause-card-image">
                <img src={causeTrees} alt="Planting trees" />
                <span className="cause-card-badge">Environment</span>
              </div>
              <div className="cause-card-body">
                <h3 className="cause-card-title">Plant Trees</h3>
                <p className="cause-card-desc">
                  Help restore our planet by planting trees in deforested areas
                  and urban spaces that need more green cover.
                </p>
                <a href="#" className="cause-card-link">
                  Learn More <span>→</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== HOW IT WORKS ===== */}
      <section className="how-section" id="how-it-works">
        <div className="container">
          <div className="section-header center">
            <h2 className="section-title">How It Works</h2>
            <p className="section-subtitle">
              Getting started is simple. Three easy steps to begin your journey of giving back.
            </p>
          </div>

          <div className="steps-grid">
            <div className="step-card" id="step-1">
              <div className="step-number">1</div>
              <h3 className="step-title">Sign Up</h3>
              <p className="step-desc">
                Create your free account in seconds. All you need is your name and email to get started.
              </p>
            </div>

            <div className="step-card" id="step-2">
              <div className="step-number">2</div>
              <h3 className="step-title">Find a Cause</h3>
              <p className="step-desc">
                Browse through causes that align with your passion. From education to environment, there's something for everyone.
              </p>
            </div>

            <div className="step-card" id="step-3">
              <div className="step-number">3</div>
              <h3 className="step-title">Start Helping</h3>
              <p className="step-desc">
                Join a cause, pick up tasks, and start making a real difference in your community. Track your impact along the way.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ===== CTA BANNER ===== */}
      <section className="cta-section" id="cta">
        <div className="container cta-inner">
          <h2 className="cta-title">Ready to Make a Difference?</h2>
          <p className="cta-subtitle">
            Join our growing community of volunteers and start creating positive change today.
          </p>
          <Link to="/register" className="btn btn-white btn-lg">
            Start Volunteering <span className="btn-arrow">→</span>
          </Link>
        </div>
      </section>

      {/* ===== FOOTER ===== */}
      <footer className="footer" id="footer">
        <div className="container footer-inner">
          <div className="footer-brand">
            <a href="/" className="footer-logo">
              <span className="logo-heart">&#x2764;</span>
              <span className="logo-text">GooDDeeD</span>
            </a>
            <p className="footer-desc">
              Empowering communities through volunteerism and social impact.
              Every good deed counts.
            </p>
            <div className="footer-socials">
              <a href="#" aria-label="Twitter" className="social-link">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"/></svg>
              </a>
              <a href="#" aria-label="Instagram" className="social-link">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>
              </a>
              <a href="#" aria-label="Facebook" className="social-link">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
              </a>
            </div>
          </div>

          <div className="footer-links-group">
            <h4 className="footer-heading">Quick Links</h4>
            <ul className="footer-links">
              <li><a href="#">Home</a></li>
              <li><a href="#causes">Causes</a></li>
              <li><a href="#how-it-works">About Us</a></li>
              <li><a href="#">Volunteer</a></li>
            </ul>
          </div>

          {/* <div className="footer-links-group">
            <h4 className="footer-heading">Support</h4>
            <ul className="footer-links">
              <li><a href="#">FAQ</a></li>
              <li><a href="#">Privacy Policy</a></li>
              <li><a href="#">Terms of Service</a></li>
              <li><a href="#">Contact Us</a></li>
            </ul>
          </div> */}

          <div className="footer-links-group">
            <h4 className="footer-heading">Contact</h4>
            <ul className="footer-links">
              <li>hello@gooddeed.org</li>
              <li>+1 (555) 123-4567</li>
              <li>123 Volunteer Street</li>
              <li>New York, NY 10001</li>
            </ul>
          </div>
        </div>

        <div className="footer-bottom">
          <div className="container">
            <p>&copy; 2026 GooDDeeD. All rights reserved. Made with ❤️ for a better world.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default LandingPage
