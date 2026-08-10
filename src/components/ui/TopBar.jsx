import React from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import Chip from './Chip'

export default function TopBar({ breadcrumbs = [] }) {
  const { user, logout } = useAuth()

  return (
    <header className="topbar">
      <Link to={user?.role === 'ADMIN' ? '/admin' : '/events'} className="topbar-brand">
        R·O·A·R
      </Link>

      {breadcrumbs.length > 0 && (
        <>
          <span className="topbar-sep">›</span>
          <nav className="breadcrumb" aria-label="Breadcrumb">
            {breadcrumbs.map((crumb, i) => (
              <React.Fragment key={i}>
                {i > 0 && <span className="breadcrumb-sep">›</span>}
                {crumb.to ? (
                  <Link to={crumb.to}>{crumb.label}</Link>
                ) : (
                  <span className="current">{crumb.label}</span>
                )}
              </React.Fragment>
            ))}
          </nav>
        </>
      )}

      <div className="flex items-center gap-3 ml-auto">
        {user && (
          <Chip variant={user.role === 'ADMIN' ? 'stamp' : 'gold'}>
            {user.role === 'ADMIN' ? 'Super Admin' : 'Team Manager'}
          </Chip>
        )}
        {user && (
          <span style={{ color: 'var(--ink-2)', fontSize: '0.8125rem' }}>
            {user.name}
          </span>
        )}
        <button
          onClick={logout}
          className="btn btn-ghost btn-sm"
          aria-label="Sign out"
        >
          Sign out
        </button>
      </div>
    </header>
  )
}
