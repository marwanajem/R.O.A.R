import React from 'react'

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, info) {
    console.error('Uncaught error:', error, info)
  }

  render() {
    if (this.state.error) {
      return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--paper)', padding: '2rem' }}>
          <div style={{ maxWidth: '480px', textAlign: 'center' }}>
            <div style={{ fontFamily: 'Saira Condensed, sans-serif', fontSize: '3rem', fontWeight: 700, color: 'var(--stamp)', letterSpacing: '0.08em', marginBottom: '1rem' }}>
              ERROR
            </div>
            <p style={{ color: 'var(--ink-2)', marginBottom: '0.5rem' }}>Something went wrong on this page.</p>
            <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.75rem', color: 'var(--muted)', marginBottom: '1.5rem' }}>
              {this.state.error?.message}
            </p>
            <button
              onClick={() => { this.setState({ error: null }); window.location.href = '/' }}
              style={{ background: 'var(--gold)', color: 'var(--paper)', border: 'none', padding: '0.625rem 1.25rem', borderRadius: '3px', fontFamily: 'Saira Condensed, sans-serif', fontSize: '1rem', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', cursor: 'pointer' }}
            >
              Go Home
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
