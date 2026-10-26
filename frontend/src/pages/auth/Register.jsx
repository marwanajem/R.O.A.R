import React, { useState, forwardRef } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import Field from '../../components/ui/Field'
import Btn from '../../components/ui/Btn'

// Reusable Requirement Tracker
const ReqItem = ({ met, text }) => (
  <div style={{ 
    fontSize: '0.75rem', 
    color: met ? 'var(--ok)' : 'var(--muted)', 
    display: 'flex', 
    alignItems: 'center', 
    gap: '0.5rem',
    fontFamily: 'JetBrains Mono, monospace',
    marginBottom: '0.25rem'
  }}>
    <span style={{ fontSize: '1rem', fontWeight: 700 }}>{met ? '✓' : '○'}</span>
    <span style={{ textDecoration: met ? 'line-through' : 'none', opacity: met ? 0.7 : 1 }}>
      {text}
    </span>
  </div>
)

// Custom Password Field with Show/Hide Toggle 
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

export default function Register() {
  const navigate = useNavigate()
  
  const [serverError, setServerError] = useState('')
  const [showVerify, setShowVerify] = useState(false)
  
  // Verification states
  const [otp, setOtp] = useState('')
  const [verifyError, setVerifyError] = useState('')
  const [verifyMsg, setVerifyMsg] = useState('')
  
  // Resend states
  const [isResending, setIsResending] = useState(false)
  const [resendMsg, setResendMsg] = useState('')

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
    getValues
  } = useForm()

  const password = watch('password') || ''
  const reqLength = password.length >= 8
  const reqUpper = /[A-Z]/.test(password)
  const reqNumber = /[0-9]/.test(password)
  const reqSpecial = /[^A-Za-z0-9]/.test(password)
  const isPasswordValid = reqLength && reqUpper && reqNumber && reqSpecial

  const onSubmit = async (data) => {
    setServerError('')
    setResendMsg('')
    setVerifyError('')
    
    if (!isPasswordValid) {
      return setServerError('Please meet all password security requirements.')
    }

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: data.name,
          email: data.email,
          password: data.password,
          clubName: data.clubName,
          role: 'TM'
        })
      })
      
      const result = await res.json()
      
      if (res.ok) {
        if (result.requiresVerification) {
          setShowVerify(true)
        } else {
          navigate('/login')
        }
      } else {
        setServerError(result.error || 'Registration failed.')
      }
    } catch (err) {
      setServerError('Server error. Please try again later.')
    }
  }

  const handleVerify = async (e) => {
    e.preventDefault()
    setVerifyError('')
    setResendMsg('')
    setVerifyMsg('Verifying...')
    
    try {
      const res = await fetch('/api/auth/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: getValues('email'), otp })
      })
      const data = await res.json()
      
      if (res.ok) {
        setVerifyMsg('Success! Redirecting to login...')
        setTimeout(() => navigate('/login'), 1500)
      } else {
        setVerifyMsg('')
        setVerifyError(data.error || 'Invalid verification code.')
      }
    } catch (err) {
      setVerifyMsg('')
      setVerifyError('Server error.')
    }
  }

  const handleResend = async () => {
    setIsResending(true)
    setVerifyError('')
    setResendMsg('')
    
    try {
      const res = await fetch('/api/auth/resend-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: getValues('email') })
      })
      const data = await res.json()
      
      if (res.ok) {
        setResendMsg(data.message || 'New code sent!')
      } else {
        setVerifyError(data.error || 'Failed to resend code.')
      }
    } catch (err) {
      setVerifyError('Server error while resending.')
    } finally {
      setIsResending(false)
    }
  }

  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <div className="auth-logo">R·O·A·R</div>
        <p className="auth-tagline">Championship Registration System</p>

        <hr className="divider" style={{ margin: '1.5rem 0' }} />

        {!showVerify ? (
          <>
            <h3 style={{ fontFamily: 'Saira Condensed, sans-serif', fontSize: '1.125rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--ink)', marginBottom: '1.25rem' }}>
              Create Team Manager Account
            </h3>

            <form onSubmit={handleSubmit(onSubmit)} noValidate>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <Field label="Full Name" name="name" id="name" type="text" autoComplete="name" required placeholder="Your full name" error={errors.name?.message} {...register('name', { required: 'Full name is required.', minLength: { value: 2, message: 'Name must be at least 2 characters.' } })} />
                <Field label="Club / Academy Name" name="clubName" id="clubName" type="text" autoComplete="organization" required placeholder="Your club or academy name" error={errors.clubName?.message} {...register('clubName', { required: 'Club name is required.', minLength: { value: 3, message: 'Club name must be at least 3 characters.' } })} />
                <Field label="Email Address" name="email" id="email" type="email" autoComplete="email" required placeholder="you@example.com" error={errors.email?.message} {...register('email', { required: 'Email is required.', pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Enter a valid email address.' } })} />
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <PasswordField label="Password" id="password" autoComplete="new-password" placeholder="••••••••" error={errors.password?.message} {...register('password', { required: 'Password is required.' })} />
                  {password.length > 0 && (
                    <div style={{ padding: '0.75rem', background: 'var(--paper-2)', borderRadius: '4px', border: '1px solid var(--line)' }}>
                      <ReqItem met={reqLength} text="8+ characters" />
                      <ReqItem met={reqUpper} text="1+ uppercase letter" />
                      <ReqItem met={reqNumber} text="1+ number" />
                      <ReqItem met={reqSpecial} text="1+ special char" />
                    </div>
                  )}
                </div>

                <PasswordField label="Confirm Password" id="confirmPassword" autoComplete="new-password" placeholder="••••••••" error={errors.confirmPassword?.message} {...register('confirmPassword', { required: 'Please confirm your password.', validate: (v) => v === password || 'Passwords do not match.' })} />
              </div>

              {serverError && (
                <p role="alert" style={{ color: '#f07060', fontSize: '0.8125rem', marginTop: '0.75rem', background: 'rgba(196,57,42,0.1)', border: '1px solid rgba(196,57,42,0.3)', borderRadius: '3px', padding: '0.5rem 0.75rem' }}>
                  {serverError}
                </p>
              )}

              <Btn variant="primary" type="submit" disabled={isSubmitting || (password.length > 0 && !isPasswordValid)} style={{ width: '100%', marginTop: '1.25rem', opacity: isPasswordValid || password.length === 0 ? 1 : 0.5 }}>
                {isSubmitting ? 'Processing…' : 'Create Account'}
              </Btn>
            </form>

            <p style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.8125rem', color: 'var(--muted)' }}>
              Already have an account? <Link to="/login" style={{ color: 'var(--gold)' }}>Sign in</Link>
            </p>
          </>
        ) : (
          <>
            <h3 style={{ fontFamily: 'Saira Condensed, sans-serif', fontSize: '1.125rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--ink)', marginBottom: '0.5rem', textAlign: 'center' }}>
              Verify Your Email
            </h3>
            <p style={{ textAlign: 'center', fontSize: '0.875rem', color: 'var(--muted)', marginBottom: '1.5rem' }}>
              We sent a 6-digit code to <strong>{getValues('email')}</strong>.<br/>
              <span style={{ fontSize: '0.75rem', color: 'var(--gold)', display: 'inline-block', marginTop: '0.5rem' }}>
                * Note: This code will expire in 10 minutes.
              </span>
            </p>

            <form onSubmit={handleVerify} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <input 
                  type="text" 
                  className="field-input" 
                  value={otp} 
                  onChange={e => setOtp(e.target.value)} 
                  maxLength={6}
                  placeholder="000000"
                  style={{ textAlign: 'center', fontSize: '1.5rem', letterSpacing: '0.5rem', fontFamily: 'JetBrains Mono, monospace', padding: '1rem' }}
                  required 
                />
              </div>
              
              {verifyError && <p role="alert" style={{ color: '#f07060', fontSize: '0.8125rem', background: 'rgba(196,57,42,0.1)', border: '1px solid rgba(196,57,42,0.3)', borderRadius: '3px', padding: '0.5rem 0.75rem', textAlign: 'center' }}>{verifyError}</p>}
              {verifyMsg && <p role="alert" style={{ color: 'var(--ok)', fontSize: '0.8125rem', textAlign: 'center' }}>{verifyMsg}</p>}
              {resendMsg && !verifyMsg && <p role="alert" style={{ color: 'var(--ok)', fontSize: '0.8125rem', textAlign: 'center' }}>{resendMsg}</p>}
              
              <Btn variant="primary" type="submit" style={{ width: '100%', marginTop: '0.5rem' }}>
                Verify & Continue
              </Btn>

              {/* ACTION LINKS: Wrong Email & Resend Code */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem', fontSize: '0.8125rem' }}>
                <button 
                  type="button" 
                  onClick={() => setShowVerify(false)} 
                  style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', textDecoration: 'underline', padding: 0 }}
                >
                  Wrong email?
                </button>
                
                <button 
                  type="button" 
                  onClick={handleResend} 
                  disabled={isResending} 
                  style={{ background: 'none', border: 'none', color: isResending ? 'var(--muted)' : 'var(--gold)', cursor: isResending ? 'default' : 'pointer', textDecoration: 'underline', padding: 0 }}
                >
                  {isResending ? 'Sending...' : 'Resend Code'}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  )
}