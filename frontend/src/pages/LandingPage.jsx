import { useEffect, useState, useRef } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { causesAPI } from '../api/causes'
import { ChevronDown, Globe, Lock, Search, CheckCircle2, Handshake } from 'lucide-react'
import './LandingPage.css'
import heroImg from '../assets/hero-volunteers.png'
import causeTeaching from '../assets/cause-teaching.png'
import causeCleanup from '../assets/cause-cleanup.png'
import causeTrees from '../assets/cause-trees.png'

// Platform features — honest descriptions of what GooDDeeD offers, no fake numbers
const FEATURES = [
  {
    icon: <Search size={24} />,
    title: 'Browse Any Cause',
    desc: 'Search and filter causes by keyword. From education to environment, find what speaks to you.',
  },
  {
    icon: <CheckCircle2 size={24} />,
    title: 'Track Your Tasks',
    desc: "Stay organized with a personal task board. See what's coming up, in progress, and done.",
  },
  {
    icon: <Handshake size={24} />,
    title: 'Join a Community',
    desc: 'Collaborate with like-minded volunteers. Cause admins can approve members and coordinate efforts.',
  },
]

function LandingPage() {
  const { user, logout } = useAuth()
  const [featuredCauses, setFeaturedCauses] = useState([])
  const navbarRef = useRef(null)

  // Scroll shadow on navbar
  useEffect(() => {
    const onScroll = () => {
      if (navbarRef.current) {
        navbarRef.current.classList.toggle('scrolled', window.scrollY > 20)
      }
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Fetch first 3 real causes for the "Discover" section
  useEffect(() => {
    causesAPI.getAll(0, 3)
      .then(res => setFeaturedCauses(res.data?.content || []))
      .catch(() => setFeaturedCauses([]))
  }, [])

  return (
    <div className="landing">

      {/* ===== NAVBAR ===== */}
      <nav className="navbar" id="navbar" ref={navbarRef}>
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

          <button
            className="navbar-toggle"
            id="navbar-toggle"
            aria-label="Toggle menu"
            onClick={() => {
              document.querySelector('.navbar-links').classList.toggle('open')
              document.querySelector('.navbar-actions').classList.toggle('open')
            }}
          >
            <span></span><span></span><span></span>
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
            Make a Difference<br />
            with Every <span className="hero-title-accent">Good Deed</span>
          </h1>
          <p className="hero-subtitle">
            Find causes you care about, collaborate with volunteers, and track your
            impact — all in one place. No commitments, just action.
          </p>
          <div className="hero-buttons">
            <Link to="/register" className="btn btn-primary btn-lg">
              Start Volunteering <span className="btn-arrow">→</span>
            </Link>
            <Link to="/explore" className="btn btn-outline-white btn-lg">
              Explore Causes
            </Link>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="hero-scroll">
          <ChevronDown size={22} />
        </div>
      </section>

      {/* ===== FEATURES STRIP — honest platform features ===== */}
      <section className="features-strip">
        <div className="container features-grid">
          {FEATURES.map((f) => (
            <div className="feature-item" key={f.title}>
              <div className="feature-icon">{f.icon}</div>
              <div className="feature-text">
                <h3 className="feature-title">{f.title}</h3>
                <p className="feature-desc">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ===== DISCOVER CAUSES ===== */}
      <section className="causes-section" id="causes">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">Discover Causes</h2>
            <p className="section-subtitle">
              A few examples of the kinds of initiatives volunteers are working on right now.
            </p>
          </div>

          <div className="causes-grid">
            {[
              { img: causeTeaching, label: 'Education',   title: 'Teaching Children',   desc: 'Help educate underprivileged children by volunteering as a tutor or mentor in local schools and community centers.' },
              { img: causeCleanup, label: 'Environment',  title: 'Community Cleanup',   desc: 'Join neighborhood cleanup drives to keep our parks, streets, and waterways clean and beautiful for everyone.' },
              { img: causeTrees,   label: 'Environment',  title: 'Plant Trees',         desc: 'Help restore our planet by planting trees in deforested areas and urban spaces that need more green cover.' },
            ].map((card, i) => (
              <div className="cause-card" key={card.title} id={`cause-card-${i}`}>
                <div className="cause-card-image">
                  <img src={card.img} alt={card.title} />
                  <span className="cause-card-badge">{card.label}</span>
                </div>
                <div className="cause-card-body">
                  <h3 className="cause-card-title">{card.title}</h3>
                  <p className="cause-card-desc">{card.desc}</p>
                  <div className="cause-card-footer">
                    <span className="cause-card-meta">
                      {featuredCauses[i] && (
                        featuredCauses[i].restricted
                          ? <><Lock size={11} /> Restricted</>
                          : <><Globe size={11} /> Open to all</>
                      )}
                    </span>
                    <Link
                      to={featuredCauses[i] ? `/causes/${featuredCauses[i].id}` : '/explore'}
                      className="cause-card-link"
                    >
                      Learn More <span>→</span>
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="causes-see-more">
            <Link to="/explore" className="btn btn-outline">
              Browse All Causes <span className="btn-arrow">→</span>
            </Link>
          </div>
        </div>
      </section>

      {/* ===== MISSION QUOTE ===== */}
      <section className="mission-section">
        <div className="container mission-inner">
          <blockquote className="mission-quote">
            "The best way to find yourself is to lose yourself in the service of others."
          </blockquote>
          <cite className="mission-cite">— Mahatma Gandhi</cite>
        </div>
      </section>

      {/* ===== HOW IT WORKS ===== */}
      <section className="how-section" id="how-it-works">
        <div className="container">
          <div className="section-header center">
            <h2 className="section-title">How It Works</h2>
            <p className="section-subtitle">
              Three simple steps to start giving back to your community.
            </p>
          </div>

          <div className="steps-grid">
            {[
              { n: '1', title: 'Sign Up',       desc: 'Create your free account in seconds. All you need is your name and email.' },
              { n: '2', title: 'Find a Cause',  desc: 'Browse causes that match your values. Open causes let you join instantly.' },
              { n: '3', title: 'Start Helping', desc: 'Pick up tasks, collaborate with your team, and track your progress.' },
            ].map((step, i) => (
              <div className="step-card" key={i} id={`step-${step.n}`}>
                <div className="step-number">{step.n}</div>
                <h3 className="step-title">{step.title}</h3>
                <p className="step-desc">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== CTA BANNER ===== */}
      <section className="cta-section" id="cta">
        <div className="container cta-inner">
          <h2 className="cta-title">Ready to Make a Difference?</h2>
          <p className="cta-subtitle">Join the GooDDeeD community and start creating positive change today.</p>
          <p className="cta-note">Free to join. No commitments. Just impact.</p>
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
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"/></svg>
              </a>
              <a href="#" aria-label="Instagram" className="social-link">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>
              </a>
              <a href="#" aria-label="LinkedIn" className="social-link">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/></svg>
              </a>
            </div>
          </div>

          <div className="footer-links-group">
            <h4 className="footer-heading">Quick Links</h4>
            <ul className="footer-links">
              <li><a href="#hero">Home</a></li>
              <li><Link to="/explore">Causes</Link></li>
              <li><a href="#how-it-works">About Us</a></li>
              <li><Link to="/register">Volunteer</Link></li>
            </ul>
          </div>

          <div className="footer-links-group">
            <h4 className="footer-heading">Contact</h4>
            <ul className="footer-links">
              <li>hello@gooddeed.org</li>
              <li>+1 (555) 123-4567</li>
            </ul>
          </div>
        </div>

        <div className="footer-bottom">
          <div className="container">
            <p>&copy; 2026 GooDDeeD. Made with ❤️ for a better world.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default LandingPage
