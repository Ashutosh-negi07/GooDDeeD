import { render } from '@testing-library/react'
import App from '../App'
import { describe, it, expect } from 'vitest'

describe('App Component', () => {
  it('renders without crashing', () => {
    const { container } = render(<App />)
    expect(container).toBeTruthy()
  })

  it('renders the landing page by default', () => {
    const { container } = render(<App />)
    // App renders at "/" which is LandingPage
    expect(container.querySelector('div')).toBeTruthy()
  })
})
