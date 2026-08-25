import React from 'react'
import { Link } from 'react-router-dom'
import Chip from './Chip'

export default function ScopeBar({ event, switchTo }) {
  if (!event) return null

  const rulesetVariant = event.ruleset === 'WT' ? 'blue' : 'gold'

  return (
    <div className="scope">
      <Chip variant={rulesetVariant}>{event.ruleset}</Chip>
      <span style={{ color: 'var(--ink)', fontWeight: 600, fontSize: '0.875rem' }}>
        {event.name}
      </span>
      <span style={{ color: 'var(--muted)', fontSize: '0.75rem' }}>
        {event.eventDate} – {event.eventDateEnd}
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
