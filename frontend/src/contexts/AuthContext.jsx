import { createContext, useState, useEffect, useRef } from 'react'
import { authAPI } from '../api/auth'

// eslint-disable-next-line react-refresh/only-export-components
export const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const initializedRef = useRef(false)
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(() => !!localStorage.getItem('token'))

  // Restore session on mount
  useEffect(() => {
    if (initializedRef.current) return
    initializedRef.current = true

    const token = localStorage.getItem('token')
    if (token) {
      authAPI.getMe()
        .then((res) => setUser(res.data))
        .catch(() => {
          localStorage.removeItem('token')
          setUser(null)
        })
        .finally(() => setLoading(false))
    }
  }, [])

  const login = async (email, password) => {
    const res = await authAPI.login(email, password)
    const { token, user: userData } = res.data
    localStorage.setItem('token', token)
    setUser(userData)
    return userData
  }

  const register = async (name, email, password) => {
    const res = await authAPI.register(name, email, password)
    const { token, user: userData } = res.data
    localStorage.setItem('token', token)
    setUser(userData)
    return userData
  }

  const updateUser = (updatedFields) => {
    setUser(prev => ({ ...prev, ...updatedFields }))
  }

  const logout = () => {
    localStorage.removeItem('token')
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  )
}
