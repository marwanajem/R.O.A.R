import React from 'react'
import { Link } from 'react-router-dom'
import Chip from './Chip'
import { formatDate } from '../../utils/format'

export default function ScopeBar({ event, switchTo }) {
  if (!event) return null

  
  const ruleset = event.ruleset || event.type
  const rulesetVariant = ruleset === 'WT' ? 'blue' : 'gold'

  return (
    <div className="scope">
      <Chip variant={rulesetVariant}>{ruleset}</Chip>
      
      <span style={{ color: 'var(--muted)', fontSize: '0.75rem' }}>
        {formatDate(event.eventDate)} 
        {event.venue ? ` · ${event.venue}` : ''}
      </span>
      
      {switchTo && (
        <Link
          to={switchTo}
          className="ml-auto"
          style={{
            color: 'var(--muted)',
            fontSize: '0.75rem',
            fontFamily: 'JetBrains Mono, monospace',
            letterSpacing: '0.05em',
          }}
        >
          switch event ▾
        </Link>
      )}
    </div>
  )
}