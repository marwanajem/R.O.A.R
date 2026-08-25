import React, { useState } from 'react'
import { useNavigate, Link, useLocation } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { useAuth } from '../../contexts/AuthContext'
import Field from '../../components/ui/Field'
import Btn from '../../components/ui/Btn'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = location.state?.from?.pathname || '/events'
  const [serverError, setServerError] = useState('')

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm()

  const onSubmit = async (data) => {
    setServerError('')
    try {
      const user = await login(data)
      navigate(user.role === 'ADMIN' ? '/admin' : from, { replace: true })
    } catch (err) {
      setServerError(err.message)
    }
  }

  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <div className="auth-logo">R·O·A·R</div>
        <p className="auth-tagline">Championship Registration System</p>

        <hr className="divider" style={{ margin: '1.5rem 0' }} />

        <h3
          style={{
            fontFamily: 'Saira Condensed, sans-serif',
            fontSize: '1.125rem',
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            color: 'var(--ink)',
            marginBottom: '1.25rem',
          }}
        >
          Team Manager Sign In
        </h3>

        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <Field
              label="Email Address"
              name="email"
              id="email"
              type="email"
              autoComplete="email"
              required
              placeholder="tm@yourclub.my"
              error={errors.email?.message}
              {...register('email', {
                required: 'Email is required.',
                pattern: {
                  value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                  message: 'Enter a valid email address.',
                },
              })}
            />
            <Field
              label="Password"
              name="password"
              id="password"
              type="password"
              autoComplete="current-password"
              required
              placeholder="••••••••"
              error={errors.password?.message}
              {...register('password', {
                required: 'Password is required.',
                minLength: { value: 6, message: 'Password must be at least 6 characters.' },
              })}
            />
          </div>

          {serverError && (
            <p
              role="alert"
              style={{
                color: '#f07060',
                fontSize: '0.8125rem',
                marginTop: '0.75rem',
                background: 'rgba(196,57,42,0.1)',
                border: '1px solid rgba(196,57,42,0.3)',
                borderRadius: '3px',
                padding: '0.5rem 0.75rem',
              }}
            >
              {serverError}
            </p>
          )}

          <Btn
            variant="primary"
            type="submit"
            disabled={isSubmitting}
            className="w-full mt-5"
            style={{ width: '100%', marginTop: '1.25rem' }}
          >
            {isSubmitting ? 'Signing in…' : 'Sign In'}
          </Btn>
        </form>

        <p style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.8125rem', color: 'var(--muted)' }}>
          New club?{' '}
          <Link to="/register" style={{ color: 'var(--gold)' }}>
            Create Team Manager account
          </Link>
        </p>

        <div
          style={{
            marginTop: '1.5rem',
            padding: '0.75rem',
            background: 'var(--paper-3)',
            border: '1px solid var(--line)',
            borderRadius: '3px',
            fontSize: '0.75rem',
            color: 'var(--muted)',
            fontFamily: 'JetBrains Mono, monospace',
          }}
        >
          <div style={{ marginBottom: '0.25rem', color: 'var(--muted-2)', letterSpacing: '0.08em', textTransform: 'uppercase', fontSize: '0.625rem' }}>Demo credentials</div>
          <div>TM: tm@roar.my / password123</div>
          <div>Admin: admin@roar.my / admin123</div>
        </div>
      </div>
    </div>
  )
}
