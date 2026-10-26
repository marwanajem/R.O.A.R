import React, { useState, forwardRef } from 'react'
import { useNavigate, Link, useLocation } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { useAuth } from '../../contexts/AuthContext'
import Field from '../../components/ui/Field'
import Btn from '../../components/ui/Btn'

// New: Custom Password Field with Show/Hide Toggle (Compatible with react-hook-form)
const PasswordField = forwardRef(({ label, id, error, placeholder, autoComplete, ...rest }, ref) => {
  const [show, setShow] = useState(false)
  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <label className="field-label" htmlFor={id} style={{ marginBottom: '4px' }}>{label}</label>
      <div style={{ position: 'relative' }}>
        <input 
          type={show ? "text" : "password"}
          id={id}
          ref={ref}
          autoComplete={autoComplete}
          className="field-input" 
          placeholder={placeholder}
          style={{ paddingRight: '4rem', width: '100%' }} 
          {...rest} 
        />
        <button 
          type="button"
          onClick={() => setShow(!show)}
          style={{
            position: 'absolute', right: '0.5rem', top: '50%', transform: 'translateY(-50%)',
            background: 'transparent', border: 'none', color: 'var(--muted)', cursor: 'pointer',
            fontSize: '0.75rem', fontFamily: 'JetBrains Mono, monospace', fontWeight: 600
          }}
        >
          {show ? 'HIDE' : 'SHOW'}
        </button>
      </div>
      {error && <span style={{ color: '#f07060', fontSize: '0.75rem', marginTop: '4px' }}>{error}</span>}
    </div>
  )
})

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
              placeholder="you@example.com"
              error={errors.email?.message}
              {...register('email', {
                required: 'Email is required.',
                pattern: {
                  value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                  message: 'Enter a valid email address.',
                },
              })}
            />
            
            <PasswordField
              label="Password"
              id="password"
              autoComplete="current-password"
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
      </div>
    </div>
  )
}