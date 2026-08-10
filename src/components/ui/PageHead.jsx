import React from 'react'

/**
 * PageHead — page heading with optional sub-text and right slot
 */
export default function PageHead({ title, sub, right, className = '' }) {
  return (
    <div className={`page-head ${className}`.trim()}>
      <div>
        <h2>{title}</h2>
        {sub && <p className="page-head-sub">{sub}</p>}
      </div>
      {right && <div className="flex items-center gap-2 flex-shrink-0">{right}</div>}
    </div>
  )
}
