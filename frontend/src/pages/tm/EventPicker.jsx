/**
 * EventPicker — Team Manager's home screen after login.
 * Lists all available events; clicking one goes to EventHome.
 *
 * BACKEND: replace `import { events }` with fetch('/api/events') in a useEffect.
 */
import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import TopBar from '../../components/ui/TopBar'
import SideNav from '../../components/ui/SideNav'
import Chip from '../../components/ui/Chip'
import Stamp from '../../components/ui/Stamp'
import { formatDate } from '../../utils/format'
import { tmTopNavSections } from '../../utils/navSections'

function statusVariant(status) {
  if (status === 'open') return 'ok'
  if (status === 'upcoming') return 'gold'
  if (status === 'archived') return 'default'
  return 'default'
}

function statusLabel(status) {
  if (status === 'open') return 'Open'
  if (status === 'upcoming') return 'Upcoming'
  if (status === 'archived') return 'Archived'
  return status
}

export default function EventPicker() {
  const { user } = useAuth()
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)

  
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const response = await fetch('https://api.roarchampionship.com/api/events')
        const data = await response.json()

        // Map the DB column names to the format the frontend UI expects
        const liveEvents = data.map(ev => ({
          id: ev.id,
          name: ev.shortName,
          venue: ev.venue,
          eventDate: ev.eventDate,
          regEnd: ev.regCloseDate,
          ruleset: ev.type,
          status: ev.status.toLowerCase(), // Converts DB 'OPEN' to UI 'open'
          fees: {
            individual: ev.individualFee,
            team: ev.teamFee
          },
          // Temporary placeholder categories until we add a categories table to the DB
          categories: ev.type === 'WT' 
            ? ['KYORUGI', 'POOMSAE', 'TEAM POOMSAE'] 
            : ['PATTERN', 'SPARRING', 'TEAM PATTERN', 'TEAM SPARRING', 'PAIR PATTERN']
        }))

        setEvents(liveEvents)
      } catch (error) {
        console.error("Failed to fetch live events:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchEvents()
  }, [])

  const openEvents = events.filter((e) => e.status === 'open' || e.status === 'upcoming')
  const archivedEvents = events.filter((e) => e.status === 'archived')

  return (
    <div className="wf">
      <TopBar breadcrumbs={[{ label: 'Events' }]} />
      <div className="wf-body">
        <SideNav sections={tmTopNavSections()} />
        <div className="wf-main" style={{ padding: '2rem' }}>
          <div className="page-head">
            <div>
              <h2>Select Event</h2>
              <p className="page-head-sub">
                Welcome back, {user?.name} · {user?.clubName}
              </p>
            </div>
          </div>

          {loading ? (
            <div style={{ padding: '2rem 0', color: 'var(--muted)' }}>
              Loading live events...
            </div>
          ) : (
            <>
              
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                  gap: '1rem',
                  marginBottom: '2rem',
                }}
              >
                {openEvents.map((ev) => (
                  <Link
                    key={ev.id}
                    to={`/events/${ev.id}`}
                    style={{ textDecoration: 'none' }}
                  >
                    <div
                      className="box"
                      style={{
                        cursor: 'pointer',
                        transition: 'border-color 0.15s',
                        borderColor: ev.status === 'open' ? 'var(--line)' : 'var(--line)',
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--gold-soft)'}
                      onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--line)'}
                    >
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.5rem', marginBottom: '0.75rem' }}>
                        <Chip variant={ev.ruleset === 'WT' ? 'blue' : 'gold'}>{ev.ruleset}</Chip>
                        <Stamp variant={statusVariant(ev.status)}>{statusLabel(ev.status)}</Stamp>
                      </div>

                      <h3
                        style={{
                          fontFamily: 'Saira Condensed, sans-serif',
                          fontSize: '1.25rem',
                          fontWeight: 700,
                          color: 'var(--ink)',
                          textTransform: 'uppercase',
                          letterSpacing: '0.04em',
                          marginBottom: '0.5rem',
                        }}
                      >
                        {ev.name}
                      </h3>

                      <p style={{ fontSize: '0.8125rem', color: 'var(--muted)', marginBottom: '0.875rem' }}>
                        {ev.venue}
                      </p>

                      <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '1rem' }}>
                        <div>
                          <div className="section-label" style={{ marginBottom: '2px' }}>Event Date</div>
                          <div style={{ fontSize: '0.8125rem', color: 'var(--ink-2)' }}>{formatDate(ev.eventDate)}</div>
                        </div>
                        <div>
                          <div className="section-label" style={{ marginBottom: '2px' }}>Reg. Closes</div>
                          <div style={{ fontSize: '0.8125rem', color: 'var(--ink-2)' }}>{formatDate(ev.regEnd)}</div>
                        </div>
                      </div>

                      <hr className="divider" style={{ margin: '0.75rem 0' }} />

                      <div style={{ display: 'flex', gap: '1rem' }}>
                        <div>
                          <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.75rem', color: 'var(--gold)' }}>MYR {ev.fees.individual}</span>
                          <span style={{ fontSize: '0.6875rem', color: 'var(--muted)', marginLeft: '4px' }}>/ individual</span>
                        </div>
                        <div>
                          <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.75rem', color: 'var(--ink-2)' }}>MYR {ev.fees.team}</span>
                          <span style={{ fontSize: '0.6875rem', color: 'var(--muted)', marginLeft: '4px' }}>/ team</span>
                        </div>
                      </div>

                      <div style={{ marginTop: '0.75rem', display: 'flex', flexWrap: 'wrap', gap: '0.375rem' }}>
                        {ev.categories.map((cat) => (
                          <Chip key={cat} variant="ghost">{cat}</Chip>
                        ))}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>

              {/* Archived */}
              {archivedEvents.length > 0 && (
                <>
                  <div className="section-label" style={{ marginBottom: '0.75rem' }}>
                    Past Events
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {archivedEvents.map((ev) => (
                      <Link key={ev.id} to={`/events/${ev.id}`} style={{ textDecoration: 'none' }}>
                        <div
                          className="box"
                          style={{ display: 'flex', alignItems: 'center', gap: '1rem', opacity: 0.65 }}
                        >
                          <Chip variant="default">{ev.ruleset}</Chip>
                          <span style={{ color: 'var(--ink-2)', fontSize: '0.875rem', flex: 1 }}>{ev.name}</span>
                          <span style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>{formatDate(ev.eventDate)}</span>
                          <Stamp variant="default">Archived</Stamp>
                        </div>
                      </Link>
                    ))}
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}