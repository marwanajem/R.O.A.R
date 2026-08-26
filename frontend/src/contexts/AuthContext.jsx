import React, { createContext, useContext, useState, useCallback } from 'react'

const AuthContext = createContext(null)


const API_URL = 'http://localhost:5001/api/auth'

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const stored = sessionStorage.getItem('roar_user')
      return stored ? JSON.parse(stored) : null
    } catch {
      return null
    }
  })

  const login = useCallback(async ({ email, password }) => {
    try {
      
      const response = await fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Invalid email or password.')
      }

     
      sessionStorage.setItem('roar_token', data.token)
      sessionStorage.setItem('roar_user', JSON.stringify(data.user))
      
      setUser(data.user)
      return data.user
    } catch (error) {
      throw new Error(error.message)
    }
  }, [])

  const register = useCallback(async ({ email, password, name, clubName }) => {
    try {
     
      const response = await fetch(`${API_URL}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, role: 'TM', name, clubName })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'An account with this email already exists.')
      }

     
      return await login({ email, password })
    } catch (error) {
      throw new Error(error.message)
    }
  }, [login])

  const logout = useCallback(() => {
    setUser(null)
    sessionStorage.removeItem('roar_user')
    sessionStorage.removeItem('roar_token') // Make sure to delete the secure token!
  }, [])

  return (
    <AuthContext.Provider value={{ user, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}