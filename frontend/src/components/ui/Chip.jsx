import React from 'react'

/**
 * Chip — inline label badge
 * variants: default | gold | ok | warn | stamp | ghost | blue
 */
export default function Chip({ variant = 'default', children, className = '' }) {
  const variantClass = {
    default: 'chip-default',
    gold: 'chip-gold',
    ok: 'chip-ok',
    warn: 'chip-warn',
    stamp: 'chip-stamp',
    ghost: 'chip-ghost',
    blue: 'chip-blue',
  }[variant] || 'chip-default'

  return (
    <span className={`chip ${variantClass} ${className}`.trim()}>
      {children}
    </span>
  )
}
