import React, { createContext, useContext, useState, useCallback } from 'react'

const AuthContext = createContext(null)

// Mock users — in production these would come from the API / JWT
const MOCK_USERS = [
  {
    id: 'U-001',
    email: 'tm@roar.my',
    password: 'password123',
    name: 'Hafiz Abdullah',
    role: 'TM',
    clubCode: 'TIGERKL',
    clubName: 'Tiger Taekwondo KL',
  },
  {
    id: 'U-002',
    email: 'admin@roar.my',
    password: 'admin123',
    name: 'Admin Roar',
    role: 'ADMIN',
    clubCode: null,
    clubName: null,
  },
]

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
    // Mock auth — replace with API call
    const found = MOCK_USERS.find(
      (u) => u.email.toLowerCase() === email.toLowerCase() && u.password === password
    )
    if (!found) {
      throw new Error('Invalid email or password.')
    }
    const { password: _pw, ...safeUser } = found
    setUser(safeUser)
    sessionStorage.setItem('roar_user', JSON.stringify(safeUser))
    return safeUser
  }, [])

  const register = useCallback(async ({ email, password, name, clubName }) => {
    // Mock register — replace with API call
    const exists = MOCK_USERS.find((u) => u.email.toLowerCase() === email.toLowerCase())
    if (exists) {
      throw new Error('An account with this email already exists.')
    }
    const newUser = {
      id: `U-${Date.now()}`,
      email,
      name,
      role: 'TM',
      clubCode: clubName.toUpperCase().replace(/\s+/g, '').slice(0, 8),
      clubName,
    }
    setUser(newUser)
    sessionStorage.setItem('roar_user', JSON.stringify(newUser))
    return newUser
  }, [])

  const logout = useCallback(() => {
    setUser(null)
    sessionStorage.removeItem('roar_user')
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
