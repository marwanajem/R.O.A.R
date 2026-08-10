import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { useAuth } from '../../contexts/AuthContext'
import Field from '../../components/ui/Field'
import Btn from '../../components/ui/Btn'

export default function Register() {
  const { register: registerUser } = useAuth()
  const navigate = useNavigate()
  const [serverError, setServerError] = useState('')

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm()

  const password = watch('password')

  const onSubmit = async (data) => {
    setServerError('')
    try {
      await registerUser({
        email: data.email,
        password: data.password,
        name: data.name,
        clubName: data.clubName,
      })
      navigate('/events', { replace: true })
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
          Create Team Manager Account
        </h3>

        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <Field
              label="Full Name"
              name="name"
              id="name"
              type="text"
              autoComplete="name"
              required
              placeholder="Your full name"
              error={errors.name?.message}
              {...register('name', {
                required: 'Full name is required.',
                minLength: { value: 2, message: 'Name must be at least 2 characters.' },
              })}
            />
            <Field
              label="Club / Academy Name"
              name="clubName"
              id="clubName"
              type="text"
              autoComplete="organization"
              required
              placeholder="e.g. Tiger Taekwondo KL"
              error={errors.clubName?.message}
              {...register('clubName', {
                required: 'Club name is required.',
                minLength: { value: 3, message: 'Club name must be at least 3 characters.' },
              })}
            />
            <Field
              label="Email Address"
              name="email"
              id="email"
              type="email"
              autoComplete="email"
              required
              placeholder="you@yourclub.my"
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
              autoComplete="new-password"
              required
              placeholder="Min. 8 characters"
              error={errors.password?.message}
              {...register('password', {
                required: 'Password is required.',
                minLength: { value: 8, message: 'Password must be at least 8 characters.' },
              })}
            />
            <Field
              label="Confirm Password"
              name="confirmPassword"
              id="confirmPassword"
              type="password"
              autoComplete="new-password"
              required
              placeholder="Repeat password"
              error={errors.confirmPassword?.message}
              {...register('confirmPassword', {
                required: 'Please confirm your password.',
                validate: (v) => v === password || 'Passwords do not match.',
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
            style={{ width: '100%', marginTop: '1.25rem' }}
          >
            {isSubmitting ? 'Creating account…' : 'Create Account'}
          </Btn>
        </form>

        <p style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.8125rem', color: 'var(--muted)' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: 'var(--gold)' }}>
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
