import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import api from '../services/api'
import notificationService from '../services/notificationService'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  // Auto‑login: check for existing token on mount
  useEffect(() => {
    // Inicializar servicio nativo de notificaciones
    notificationService.initialize()

    const token = localStorage.getItem('jcs_token')
    if (token) {
      api.get('/auth/me')
        .then(res => {
          setUser(res.data.user)
          notificationService.registerPush()
        })
        .catch(() => localStorage.removeItem('jcs_token'))
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [])

  const login = useCallback(async (email, password) => {
    const res = await api.post('/auth/login', { email, password })
    localStorage.setItem('jcs_token', res.data.token)
    setUser(res.data.user)
    notificationService.registerPush()
    return res.data
  }, [])

  const register = useCallback(async ({ name, email, password, birthDate }) => {
    const res = await api.post('/auth/register', { name, email, password, birthDate })
    localStorage.setItem('jcs_token', res.data.token)
    setUser(res.data.user)
    notificationService.registerPush()
    return res.data
  }, [])

  const logout = useCallback(() => {
    notificationService.unregisterPush()
    localStorage.removeItem('jcs_token')
    setUser(null)
  }, [])

  const value = { user, setUser, loading, login, register, logout, isAuthenticated: !!user }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
