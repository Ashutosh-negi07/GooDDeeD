import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, Plus, Globe, Lock } from 'lucide-react'
import { causesAPI } from '../api/causes'
import toast from 'react-hot-toast'
import DashboardLayout from '../components/layout/DashboardLayout'
import './CreateCausePage.css'

function CreateCausePage() {
  const navigate = useNavigate()

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [restricted, setRestricted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [nameError, setNameError] = useState('')

  function validateName(value) {
    if (!value.trim()) return 'Name is required'
    if (value.trim().length < 2) return 'Name must be at least 2 characters'
    if (value.trim().length > 100) return 'Name cannot exceed 100 characters'
    return ''
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const err = validateName(name)
    if (err) {
      setNameError(err)
      return
    }
    setSubmitting(true)
    try {
      const res = await causesAPI.create({
        name: name.trim(),
        description: description.trim() || null,
        restricted,
      })
      toast.success('Cause created! You are now the admin.')
      navigate(`/cause/${res.data.id}/manage`)
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to create cause. Please try again.'
      toast.error(msg)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <DashboardLayout>
      <div className="create-cause-page">
        <Link to="/dashboard/causes" className="create-cause-back">
          <ArrowLeft size={16} /> Back to My Causes
        </Link>

        <div className="create-cause-header">
          <div className="create-cause-icon-wrap">
            <Plus size={28} />
          </div>
          <div>
            <h1 className="create-cause-title">Create a New Cause</h1>
            <p className="create-cause-subtitle">
              Start a cause, invite members, set goals, and assign tasks.
            </p>
          </div>
        </div>

        <div className="create-cause-card">
          <form onSubmit={handleSubmit} className="create-cause-form" noValidate>

            {/* Name */}
            <div className={`form-group ${nameError ? 'has-error' : ''}`}>
              <label htmlFor="cause-name">
                Cause Name <span className="required">*</span>
              </label>
              <input
                id="cause-name"
                type="text"
                value={name}
                maxLength={100}
                placeholder="e.g., Beach Cleanup Initiative"
                onChange={(e) => {
                  setName(e.target.value)
                  if (nameError) setNameError(validateName(e.target.value))
                }}
                onBlur={() => setNameError(validateName(name))}
                required
              />
              {nameError && <span className="form-error">{nameError}</span>}
              <span className="form-hint">{name.trim().length}/100 characters</span>
            </div>

            {/* Description */}
            <div className="form-group">
              <label htmlFor="cause-desc">Description <span className="form-optional">(optional)</span></label>
              <textarea
                id="cause-desc"
                rows={4}
                value={description}
                maxLength={500}
                placeholder="Describe the mission and goals of this cause..."
                onChange={(e) => setDescription(e.target.value)}
              />
              <span className="form-hint">{description.trim().length}/500 characters</span>
            </div>

            {/* Restricted toggle */}
            <div className="create-cause-access-section">
              <h3 className="create-cause-access-title">Access Type</h3>
              <div className="create-cause-access-options">
                <button
                  type="button"
                  className={`access-option ${!restricted ? 'active' : ''}`}
                  onClick={() => setRestricted(false)}
                >
                  <Globe size={22} />
                  <div>
                    <strong>Open</strong>
                    <p>Anyone can join immediately without approval</p>
                  </div>
                  <div className={`access-radio ${!restricted ? 'selected' : ''}`} />
                </button>
                <button
                  type="button"
                  className={`access-option ${restricted ? 'active' : ''}`}
                  onClick={() => setRestricted(true)}
                >
                  <Lock size={22} />
                  <div>
                    <strong>Restricted</strong>
                    <p>Members must be approved by an admin before joining</p>
                  </div>
                  <div className={`access-radio ${restricted ? 'selected' : ''}`} />
                </button>
              </div>
            </div>

            {/* Actions */}
            <div className="create-cause-actions">
              <button
                type="submit"
                className="btn btn-primary btn-lg"
                disabled={submitting}
                id="create-cause-submit"
              >
                {submitting ? 'Creating...' : <><Plus size={18} /> Create Cause</>}
              </button>
              <Link to="/dashboard/causes" className="btn btn-outline btn-lg">
                Cancel
              </Link>
            </div>

          </form>
        </div>
      </div>
    </DashboardLayout>
  )
}

export default CreateCausePage
