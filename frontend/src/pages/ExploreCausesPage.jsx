import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { Search, ChevronLeft, ChevronRight, Heart, Lock, Globe } from 'lucide-react'
import { causesAPI } from '../api/causes'
import { useAuth } from '../hooks/useAuth'
import Navbar from '../components/layout/Navbar'
import Footer from '../components/layout/Footer'
import TurleImg from '../assets/turtle_image.png'
import './ExploreCausesPage.css'

// Client-side category chips — filters against cause.name + cause.description
// (matches what CauseRepository.searchByKeyword actually queries)
const CATEGORIES = [
  { label: 'All',          keywords: [] },
  { label: '🌱 Environment', keywords: ['environment', 'cleanup', 'clean', 'tree', 'ocean', 'forest', 'green', 'plant', 'recycle', 'plastic'] },
  { label: '📚 Education',   keywords: ['education', 'teach', 'school', 'tutor', 'mentor', 'literacy', 'student', 'learn'] },
  { label: '🍲 Food',        keywords: ['food', 'hunger', 'meal', 'drive', 'distribute', 'donate', 'feed'] },
  { label: '🏡 Community',   keywords: ['community', 'neighborhood', 'local', 'volunteer', 'social', 'park'] },
  { label: '🐾 Animals',     keywords: ['animal', 'pet', 'shelter', 'rescue', 'wildlife'] },
]

function ExploreCausesPage() {
  const { user } = useAuth()
  const [causes, setCauses]               = useState([])
  const [loading, setLoading]             = useState(true)
  const [keyword, setKeyword]             = useState('')
  const [page, setPage]                   = useState(0)
  const [totalPages, setTotalPages]       = useState(0)
  const [totalElements, setTotalElements] = useState(0)
  const [activeCategory, setActiveCategory] = useState(0)
  const size = 9

  const fetchCauses = useCallback(async () => {
    setLoading(true)
    try {
      const res = keyword.trim()
        ? await causesAPI.search(keyword.trim(), page, size)
        : await causesAPI.getAll(page, size)
      setCauses(res.data.content)
      setTotalPages(res.data.page?.totalPages ?? res.data.totalPages ?? 0)
      setTotalElements(res.data.page?.totalElements ?? res.data.totalElements ?? 0)
    } catch {
      setCauses([])
    } finally {
      setLoading(false)
    }
  }, [keyword, page])

  useEffect(() => { fetchCauses() }, [fetchCauses])
  useEffect(() => { setPage(0) }, [keyword, activeCategory])

  // Client-side category filter on loaded causes
  const displayedCauses = activeCategory === 0
    ? causes
    : causes.filter(c => {
        const text = ((c.name || '') + ' ' + (c.description || '')).toLowerCase()
        return CATEGORIES[activeCategory].keywords.some(k => text.includes(k))
      })

  const causeIcons = ['🧹','📚','🌳','🍲','🐾','🏡','👵','💰','🎨','🏃']

  return (
    <div className="explore-page">
      <Navbar />

      {/* Hero Banner */}
      <section className="explore-hero">
        <div className="explore-hero-bg">
          <img src={TurleImg} alt="Ocean waves" />
          <div className="explore-hero-overlay"></div>
        </div>
        <div className="container explore-hero-content">
          <h1 className="explore-hero-title">Explore Causes</h1>
          <p className="explore-hero-subtitle">
            Discover initiatives making a real difference — from beach cleanups to teaching children,
            tree planting to food drives. Find your cause and start helping today.
          </p>

          {/* Search Bar — searches cause name & description */}
          <div className="explore-search-wrap">
            <Search size={20} className="explore-search-icon" />
            <input
              type="text"
              className="explore-search"
              placeholder="Search by cause name or description..."
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              id="explore-search"
            />
            {keyword && (
              <button className="explore-search-clear" onClick={() => setKeyword('')}>✕</button>
            )}
          </div>

          {/* Category chips */}
          <div className="explore-chips">
            {CATEGORIES.map((cat, i) => (
              <button
                key={cat.label}
                className={`explore-chip ${activeCategory === i ? 'active' : ''}`}
                onClick={() => setActiveCategory(i)}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Results */}
      <section className="explore-results">
        <div className="container">
          <div className="explore-results-header">
            <p className="explore-results-count">
              {loading
                ? 'Searching...'
                : `${displayedCauses.length} cause${displayedCauses.length !== 1 ? 's' : ''} found${totalPages > 1 ? ` — page ${page + 1} of ${totalPages}` : ''}`
              }
            </p>
          </div>

          {loading ? (
            <div className="explore-loading">
              <div className="explore-spinner"></div>
              <p>Cold starting the causes...</p>
            </div>
          ) : displayedCauses.length === 0 ? (
            <div className="explore-empty">
              <div className="explore-empty-icon">🔍</div>
              <h3>No causes found</h3>
              <p>Try a different search term or select a different category.</p>
              {(keyword || activeCategory !== 0) && (
                <button className="btn btn-primary" onClick={() => { setKeyword(''); setActiveCategory(0) }}>
                  Clear Filters
                </button>
              )}
            </div>
          ) : (
            <>
              <div className="explore-grid">
                {displayedCauses.map((cause, index) => (
                  <Link to={`/causes/${cause.id}`} key={cause.id} className="explore-card">
                    <div className="explore-card-top">
                      <div className="explore-card-icon">
                        {causeIcons[index % causeIcons.length]}
                      </div>
                      {/* Real 'restricted' field from CauseResponseDTO */}
                      <span className={`explore-card-badge ${cause.restricted ? 'restricted' : 'open'}`}>
                        {cause.restricted
                          ? <><Lock size={11} /> Restricted</>
                          : <><Globe size={11} /> Open</>
                        }
                      </span>
                    </div>
                    <h3 className="explore-card-title">{cause.name}</h3>
                    <p className="explore-card-desc">
                      {cause.description
                        ? cause.description.length > 110
                          ? cause.description.slice(0, 110) + '…'
                          : cause.description
                        : 'No description provided. Join to learn more about this cause!'
                      }
                    </p>
                    <div className="explore-card-footer">
                      <span className="explore-card-date">
                        {new Date(cause.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                      <span className="explore-card-cta">View Details →</span>
                    </div>
                  </Link>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="explore-pagination">
                  <button className="explore-page-btn" disabled={page === 0} onClick={() => setPage(p => p - 1)}>
                    <ChevronLeft size={18} /> Previous
                  </button>
                  <div className="explore-page-numbers">
                    {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => (
                      <button
                        key={i}
                        className={`explore-page-num ${page === i ? 'active' : ''}`}
                        onClick={() => setPage(i)}
                      >{i + 1}</button>
                    ))}
                  </div>
                  <button className="explore-page-btn" disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}>
                    Next <ChevronRight size={18} />
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </section>

      {/* CTA for non-logged-in users */}
      {!user && (
        <section className="explore-cta">
          <div className="container explore-cta-inner">
            <Heart size={28} />
            <div>
              <h2>Want to join a cause?</h2>
              <p>Create a free account to start volunteering and making a difference.</p>
            </div>
            <Link to="/register" className="btn btn-white btn-lg">
              Sign Up Free <span className="btn-arrow">→</span>
            </Link>
          </div>
        </section>
      )}

      <Footer />
    </div>
  )
}

export default ExploreCausesPage
