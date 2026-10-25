import React, { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import TopBar from '../../components/ui/TopBar'
import ScopeBar from '../../components/ui/ScopeBar'
import SideNav from '../../components/ui/SideNav'
import PageHead from '../../components/ui/PageHead'
import Chip from '../../components/ui/Chip'
import Stamp from '../../components/ui/Stamp'
import { useAuth } from '../../contexts/AuthContext'
import { tmNavSections } from '../../utils/navSections'

export default function CategoryPattern() {
  const { id } = useParams()
  const { user } = useAuth()
  
  const [event, setEvent] = useState(null)
  const [patternRoster, setPatternRoster] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const eventRes = await fetch(`/api/events/${id}`)
        if (eventRes.ok) {
          const eventData = await eventRes.json()
          setEvent(eventData)
        }

        if (user?.clubCode) {
          const rosterRes = await fetch(`/api/competitors/event/${id}/club/${user.clubCode}`)
          if (rosterRes.ok) {
            const rosterData = await rosterRes.json()
            
            // Filter: Only show athletes who have a pattern format assigned
            const athletes = rosterData.filter(c => 
              c.patternFormat && 
              c.patternFormat !== 'None' && 
              c.patternFormat.trim() !== ''
            )
            
            setPatternRoster(athletes)
          }
        }
      } catch (error) {
        console.error('Failed to fetch pattern data:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [id, user?.clubCode])

  // --- Strict Sporting Status Logic ---
  const getSportingStatus = (competitor) => {
    // 1. If financial status is not confirmed, they can't compete yet.
    if (competitor.status !== 'confirmed') {
      return { label: 'PENDING PAYMENT', variant: 'gold' }
    }
    
    // 2. Pattern competitors do not weigh in. Payment = Confirmed to compete!
    return { label: 'CONFIRMED', variant: 'ok' }
  }

  if (loading) return <div className="wf"><TopBar /><div className="wf-main" style={{ padding: '2rem' }}><p style={{ color: 'var(--muted)' }}>Loading category data...</p></div></div>

  const pageTitle = event?.type === 'WT' ? 'Poomsae (Pattern)' : 'Individual Pattern';

  return (
    <div className="wf">
      <TopBar breadcrumbs={[{ label: 'Events', to: '/events' }, { label: event?.shortName || id, to: `/events/${id}` }, { label: pageTitle }]} />
      <ScopeBar event={event} switchTo="/events" />
      <div className="wf-body">
        
        {event && <SideNav sections={tmNavSections(id, event.type)} />}
        
        <main className="wf-main">
          <PageHead
            title={pageTitle}
            sub={`${patternRoster.length} athletes registered for this category`}
          />

          <div className="box" style={{ padding: 0, overflow: 'auto' }}>
            <table className="tbl">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>G</th>
                  <th>Age Cat.</th>
                  <th>Belt</th>
                  <th>Belt Group</th>
                  <th>Format</th>
                  <th>Sporting Status</th>
                </tr>
              </thead>
              <tbody>
                {patternRoster.map((c) => {
                  const statusData = getSportingStatus(c);
                  
                  return (
                    <tr key={c.id}>
                      <td className="mono">{c.id}</td>
                      <td className="name">{c.fullName}</td>
                      <td style={{ color: 'var(--muted)', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.75rem' }}>{c.gender}</td>
                      <td><Chip variant="default">{c.ageCategory}</Chip></td>
                      <td><Chip variant="ghost">{c.beltGrade}</Chip></td>
                      <td><Chip variant="gold">{c.beltGroup}</Chip></td>
                      <td>
                        <Chip variant={c.patternFormat === 'Carnival' ? 'warn' : 'ghost'}>
                          {c.patternFormat}
                        </Chip>
                      </td>
                      <td>
                        <Stamp variant={statusData.variant}>
                          {statusData.label}
                        </Stamp>
                      </td>
                    </tr>
                  )
                })}
                {patternRoster.length === 0 && (
                  <tr>
                    <td colSpan={8} style={{ textAlign: 'center', padding: '2rem', color: 'var(--muted)', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.75rem' }}>
                      No competitors from your club are entered into this category.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </main>
      </div>
    </div>
  )
}