import React from 'react'
import { Link } from 'react-router-dom'

/**
 * Btn — Button component
 * variants: primary | ghost | stamp | gold-outline | default
 * size: default | sm
 */
export default function Btn({
  variant = 'default',
  size,
  as,
  to,
  href,
  disabled,
  children,
  className = '',
  ...props
}) {
  const variantClass = {
    primary: 'btn-primary',
    ghost: 'btn-ghost',
    stamp: 'btn-stamp',
    'gold-outline': 'btn-gold-outline',
    default: 'btn-ghost',
  }[variant] || 'btn-ghost'

  const sizeClass = size === 'sm' ? 'btn-sm' : ''
  const cls = `btn ${variantClass} ${sizeClass} ${className}`.trim()

  if (to) {
    return (
      <Link to={to} className={cls} {...props}>
        {children}
      </Link>
    )
  }
  if (href) {
    return (
      <a href={href} className={cls} {...props}>
        {children}
      </a>
    )
  }
  return (
    <button className={cls} disabled={disabled} {...props}>
      {children}
    </button>
  )
}
