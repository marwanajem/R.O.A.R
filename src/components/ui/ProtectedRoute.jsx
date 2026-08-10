import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'

/**
 * ProtectedRoute
 * requiredRole: 'TM' | 'ADMIN' | undefined (any authenticated user)
 */
export default function ProtectedRoute({ children, requiredRole }) {
  const { user } = useAuth()
  const location = useLocation()

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (requiredRole && user.role !== requiredRole) {
    // Redirect to role-appropriate home
    const fallback = user.role === 'ADMIN' ? '/admin' : '/events'
    return <Navigate to={fallback} replace />
  }

  return children
}
