import { useEffect, useState } from 'react'
import { getCurrentUser, login as loginRequest, logout as logoutRequest, signup as signupRequest } from '../services/api'
import { AuthContext } from './context.js'

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('bhu_user')
      return saved ? JSON.parse(saved) : null
    } catch {
      return null
    }
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getCurrentUser()
      .then(({ user: current }) => {
        setUser(current)
        if (current) {
          localStorage.setItem('bhu_user', JSON.stringify(current))
        }
      })
      .catch((err) => {
        if (err.message && err.message.includes('Authentication required')) {
          setUser(null)
          localStorage.removeItem('bhu_user')
        }
      })
      .finally(() => setLoading(false))
  }, [])

  const value = {
    user,
    loading,
    isAuthenticated: Boolean(user),
    login: async (data) => {
      const result = await loginRequest(data)
      setUser(result.user)
      localStorage.setItem('bhu_user', JSON.stringify(result.user))
      return result
    },
    signup: async (data) => {
      const result = await signupRequest(data)
      setUser(result.user)
      localStorage.setItem('bhu_user', JSON.stringify(result.user))
      return result
    },
    logout: async () => {
      try {
        await logoutRequest()
      } catch {
        // Continue clearing local state on error
      }
      setUser(null)
      localStorage.removeItem('bhu_user')
    },
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
