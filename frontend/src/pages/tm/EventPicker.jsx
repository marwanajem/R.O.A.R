import React, { useState, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import TopBar from '../../components/ui/TopBar'
import SideNav from '../../components/ui/SideNav'
import Chip from '../../components/ui/Chip'
import Stamp from '../../components/ui/Stamp'
import Btn from '../../components/ui/Btn'
import { formatDate } from '../../utils/format'
import { tmTopNavSections } from '../../utils/navSections'

function statusVariant(status) {
  if (status === 'open') return 'ok'
  if (status === 'upcoming') return 'gold'
  if (status === 'closed') return 'stamp' 
  if (status === 'archived') return 'default'
  return 'default'
}

function statusLabel(status) {
  if (status === 'open') return 'Open'
  if (status === 'upcoming') return 'Upcoming'
  if (status === 'closed') return 'Reg. Closed' 
  if (status === 'archived') return 'Archived'
  return status ? status.toUpperCase() : 'UNKNOWN'
}

export default function EventPicker() {
  const { user } = useAuth()
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchParams] = useSearchParams() 
  
  
  const [selectedUpcoming, setSelectedUpcoming] = useState(null)
  
  const currentFilter = searchParams.get('filter') || 'all'

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const response = await fetch('/api/events')
        const data = await response.json()
        
        const liveEvents = data.map(ev => {
          let computedStatus = ev.status.toLowerCase();
          
         
          const now = new Date();
          const regCloseDate = new Date(ev.regCloseDate);
          const eventDate = new Date(ev.eventDate);

          
          now.setHours(0,0,0,0);
          regCloseDate.setHours(0,0,0,0);
          eventDate.setHours(0,0,0,0);

          if (now > eventDate) {
            computedStatus = 'archived'; 
          } else if (now > regCloseDate && computedStatus === 'open') {
            computedStatus = 'closed'; 
          }

          return {
            id: ev.id,
            name: ev.shortName,
            venue: ev.venue,
            eventDate: ev.eventDate,
            regEnd: ev.regCloseDate,
            ruleset: ev.type,
            status: computedStatus, 
            fees: { individual: ev.individualFee, team: ev.teamFee }
          }
        })

        setEvents(liveEvents)
      } catch (error) {
        console.error("Failed to fetch live events:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchEvents()
  }, [])

  
  const openEvents = events.filter((e) => e.status === 'open')
  const upcomingEvents = events.filter((e) => e.status === 'upcoming' || e.status === 'closed') 
  const pastEvents = events.filter((e) => e.status === 'archived')

  let sectionsToShow = []
  if (currentFilter === 'all') {
    sectionsToShow = [
      { title: 'Open for Registration', data: openEvents },
      { title: 'Upcoming Events', data: upcomingEvents },
      { title: 'Past Events', data: pastEvents, isArchived: true }
    ]
  } else if (currentFilter === 'open') {
    sectionsToShow = [{ title: 'Open for Registration', data: openEvents }]
  } else if (currentFilter === 'upcoming') {
    sectionsToShow = [{ title: 'Upcoming Events', data: upcomingEvents }]
  } else if (currentFilter === 'past') {
    sectionsToShow = [{ title: 'Past Events', data: pastEvents, isArchived: true }]
  }

  sectionsToShow = sectionsToShow.filter(sec => sec.data.length > 0)

  // Render a Single Event Card
  const renderCard = (ev) => {
    return (
      <div
        className="box"
        style={{ cursor: 'pointer', transition: 'border-color 0.15s', borderColor: 'var(--line)' }}
        onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--gold-soft)'}
        onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--line)'}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.5rem', marginBottom: '0.75rem' }}>
          <Chip variant={ev.ruleset === 'WT' ? 'blue' : 'gold'}>{ev.ruleset}</Chip>
          <Stamp variant={statusVariant(ev.status)}>{statusLabel(ev.status)}</Stamp>
        </div>
        <h3 style={{ fontFamily: 'Saira Condensed, sans-serif', fontSize: '1.25rem', fontWeight: 700, color: 'var(--ink)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.5rem' }}>
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
      </div>
    )
  }

  return (
    <div className="wf">
      <TopBar breadcrumbs={[{ label: 'Events Hub' }]} />
      <div className="wf-body">
        <SideNav sections={tmTopNavSections()} />
        <div className="wf-main" style={{ padding: '2rem' }}>
          <div className="page-head">
            <div>
              <h2>{currentFilter === 'all' ? 'Select Event' : `${currentFilter.charAt(0).toUpperCase() + currentFilter.slice(1)} Events`}</h2>
              <p className="page-head-sub">Welcome back, {user?.name} · {user?.clubName}</p>
            </div>
          </div>

          {loading ? (
            <div style={{ padding: '2rem 0', color: 'var(--muted)' }}>Loading live events...</div>
          ) : sectionsToShow.length === 0 ? (
            <div style={{ padding: '2rem 0', color: 'var(--muted)' }}>No events found for this category.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
              {sectionsToShow.map((section, idx) => (
                <div key={idx}>
                  <div className="section-label" style={{ marginBottom: '1rem', color: 'var(--gold)' }}>{section.title}</div>
                  
                  {section.isArchived ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      {section.data.map((ev) => (
                        <Link key={ev.id} to={`/events/${ev.id}`} style={{ textDecoration: 'none' }}>
                          <div className="box" style={{ display: 'flex', alignItems: 'center', gap: '1rem', opacity: 0.65 }}>
                            <Chip variant="default">{ev.ruleset}</Chip>
                            <span style={{ color: 'var(--ink-2)', fontSize: '0.875rem', flex: 1 }}>{ev.name}</span>
                            <span style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>{formatDate(ev.eventDate)}</span>
                            <Stamp variant="default">Archived</Stamp>
                          </div>
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1rem' }}>
                      {section.data.map((ev) => {
                        
                        if (ev.status === 'upcoming') {
                          return (
                            <div key={ev.id} onClick={() => setSelectedUpcoming(ev)} style={{ textDecoration: 'none' }}>
                              {renderCard(ev)}
                            </div>
                          )
                        }
                        
                        return (
                          <Link key={ev.id} to={`/events/${ev.id}`} style={{ textDecoration: 'none' }}>
                            {renderCard(ev)}
                          </Link>
                        )
                      })}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

     
      {selectedUpcoming && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div className="box" style={{ width: '100%', maxWidth: '450px', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <Chip variant={selectedUpcoming.ruleset === 'WT' ? 'blue' : 'gold'}>{selectedUpcoming.ruleset}</Chip>
              <Stamp variant="gold">Upcoming</Stamp>
            </div>
            
            <div>
              <h2 style={{ fontFamily: 'Saira Condensed, sans-serif', fontSize: '1.5rem', fontWeight: 700, color: 'var(--ink)', textTransform: 'uppercase', letterSpacing: '0.04em', margin: '0 0 0.5rem 0' }}>
                {selectedUpcoming.name}
              </h2>
              <p style={{ fontSize: '0.875rem', color: 'var(--muted)', margin: 0 }}>
                {selectedUpcoming.venue}
              </p>
            </div>

            <hr className="divider" style={{ margin: 0 }} />

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <div className="section-label" style={{ marginBottom: '4px' }}>Event Date</div>
                <div style={{ fontSize: '0.875rem', color: 'var(--ink-2)' }}>{formatDate(selectedUpcoming.eventDate)}</div>
              </div>
              <div>
                <div className="section-label" style={{ marginBottom: '4px' }}>Reg. Closes</div>
                <div style={{ fontSize: '0.875rem', color: 'var(--ink-2)' }}>{formatDate(selectedUpcoming.regEnd)}</div>
              </div>
            </div>

            <div style={{ backgroundColor: 'var(--paper-3)', padding: '1rem', borderRadius: '4px', border: '1px solid var(--line)' }}>
              <div style={{ fontSize: '0.875rem', color: 'var(--ink-2)', lineHeight: 1.5, marginBottom: '0.5rem' }}>
                Registrations are not open yet. Check back soon!
              </div>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>
                  Indiv: <strong style={{ color: 'var(--gold)' }}>MYR {selectedUpcoming.fees.individual}</strong>
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>
                  Team: <strong style={{ color: 'var(--ink-2)' }}>MYR {selectedUpcoming.fees.team}</strong>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
              <Btn variant="primary" onClick={() => setSelectedUpcoming(null)}>
                Close
              </Btn>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}