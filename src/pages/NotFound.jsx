import React from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export default function NotFound() {
  const { user } = useAuth()
  const home = user?.role === 'ADMIN' ? '/admin' : user ? '/events' : '/login'

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--paper)', padding: '2rem' }}>
      <div style={{ maxWidth: '480px', textAlign: 'center' }}>
        <div style={{ fontFamily: 'Saira Condensed, sans-serif', fontSize: '5rem', fontWeight: 700, color: 'var(--gold)', letterSpacing: '0.08em', lineHeight: 1, marginBottom: '0.5rem' }}>
          404
        </div>
        <p style={{ color: 'var(--ink-2)', marginBottom: '0.5rem' }}>Page not found.</p>
        <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.75rem', color: 'var(--muted)', marginBottom: '1.5rem' }}>
          The URL you entered doesn't exist.
        </p>
        <Link
          to={home}
          style={{ display: 'inline-block', background: 'var(--gold)', color: 'var(--paper)', textDecoration: 'none', padding: '0.625rem 1.5rem', borderRadius: '3px', fontFamily: 'Saira Condensed, sans-serif', fontSize: '1rem', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' }}
        >
          Go Home
        </Link>
      </div>
    </div>
  )
}
