import React from 'react'

/**
 * Stamp — stamp-pill status badge
 * variants: default (red) | ok (green) | gold
 */
export default function Stamp({ variant = 'default', children, className = '' }) {
  const variantClass = {
    default: 'stamp-default',
    ok: 'stamp-ok',
    gold: 'stamp-gold',
  }[variant] || 'stamp-default'

  return (
    <span className={`stamp-pill ${variantClass} ${className}`.trim()}>
      {children}
    </span>
  )
}
