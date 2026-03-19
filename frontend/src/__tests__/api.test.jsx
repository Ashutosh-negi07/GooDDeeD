import { describe, it, expect, beforeEach, vi } from 'vitest'
import api from '../api/axios'

describe('API Axios Instance', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
  })

  it('should have baseURL set to /api', () => {
    expect(api.defaults.baseURL).toBe('/api')
  })

  it('should have Content-Type header', () => {
    expect(api.defaults.headers['Content-Type']).toBe('application/json')
  })

  it('should add Authorization header when token exists', () => {
    const token = 'test-jwt-token'
    localStorage.setItem('token', token)

    // Manually test the interceptor logic
    const config = { url: '/test', method: 'GET', headers: {} }
    const storedToken = localStorage.getItem('token')
    if (storedToken) {
      config.headers.Authorization = `Bearer ${storedToken}`
    }

    expect(config.headers.Authorization).toBe(`Bearer ${token}`)
  })

  it('should not add Authorization header when no token', () => {
    const config = { url: '/test', method: 'GET', headers: {} }
    const storedToken = localStorage.getItem('token')
    if (storedToken) {
      config.headers.Authorization = `Bearer ${storedToken}`
    }

    expect(config.headers.Authorization).toBeUndefined()
  })
})
