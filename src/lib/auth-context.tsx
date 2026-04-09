import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { api } from './api'

interface User {
  user_id: number
  user_number: number
  name: string
}

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (user: User, token: string) => void
  logout: () => void
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('session_token')
    if (!token) { setLoading(false); return }
    api.me().then(data => {
      if (data.user_id) setUser(data)
      else localStorage.removeItem('session_token')
    }).finally(() => setLoading(false))
  }, [])

  const login = (u: User, token: string) => {
    localStorage.setItem('session_token', token)
    setUser(u)
  }

  const logout = () => {
    localStorage.removeItem('session_token')
    setUser(null)
  }

  return <AuthContext.Provider value={{ user, loading, login, logout }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be inside AuthProvider')
  return ctx
}
