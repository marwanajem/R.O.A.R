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

export default function CategorySparring() {
  const { id } = useParams()
  const { user } = useAuth()
  
  const [event, setEvent] = useState(null)
  const [sparringRoster, setSparringRoster] = useState([])
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
            
            // Filter: Only show athletes who have a weight class assigned
            // (Assuming 'None' or empty means they are Pattern/Poomsae only)
            const fighters = rosterData.filter(c => 
              c.weightCategory && 
              c.weightCategory !== 'None' && 
              c.weightCategory.trim() !== ''
            ).map(c => ({
              ...c,
              weightClass: c.weightCategory
            }))
            
            setSparringRoster(fighters)
          }
        }
      } catch (error) {
        console.error('Failed to fetch sparring data:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [id, user?.clubCode])

  // --- 3-Tier Sporting Status Logic ---
  const getSportingStatus = (competitor) => {
    // 1. If financial status is not confirmed, they can't fight yet.
    if (competitor.status !== 'confirmed') {
      return { label: 'PENDING PAYMENT', variant: 'gold' }
    }
    
    // 2. If they failed weigh-in (we will add this admin feature later)
    if (competitor.weighInStatus === 'failed') {
      return { label: 'DQ - WEIGH IN', variant: 'stamp' }
    }

    // 3. If they passed weigh-in at the venue
    if (competitor.weighInStatus === 'passed') {
      return { label: 'CONFIRMED', variant: 'ok' }
    }

    // 4. Default state for paid fighters waiting for tournament day
    return { label: 'PENDING WEIGH-IN', variant: 'default' }
  }

  if (loading) return <div className="wf"><TopBar /><div className="wf-main" style={{ padding: '2rem' }}><p style={{ color: 'var(--muted)' }}>Loading category data...</p></div></div>

  const pageTitle = event?.type === 'WT' ? 'Kyorugi (Sparring)' : 'Individual Sparring';

  return (
    <div className="wf">
      <TopBar breadcrumbs={[{ label: 'Events', to: '/events' }, { label: event?.shortName || id, to: `/events/${id}` }, { label: pageTitle }]} />
      <ScopeBar event={event} switchTo="/events" />
      <div className="wf-body">
        
        {event && <SideNav sections={tmNavSections(id, event.type)} />}
        
        <main className="wf-main">
          <PageHead
            title={pageTitle}
            sub={`${sparringRoster.length} fighters registered for this category`}
          />

          <div className="box" style={{ padding: 0, overflow: 'auto' }}>
            <table className="tbl">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>G</th>
                  <th>Age Cat.</th>
                  <th>Belt Group</th>
                  <th>Declared Wt.</th>
                  <th>Assigned Class</th>
                  <th>Sporting Status</th>
                </tr>
              </thead>
              <tbody>
                {sparringRoster.map((c) => {
                  const statusData = getSportingStatus(c);
                  
                  return (
                    <tr key={c.id}>
                      <td className="mono">{c.id}</td>
                      <td className="name">{c.fullName}</td>
                      <td style={{ color: 'var(--muted)', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.75rem' }}>{c.gender}</td>
                      <td><Chip variant="default">{c.ageCategory}</Chip></td>
                      <td><Chip variant="gold">{c.beltGroup}</Chip></td>
                      <td className="mono">{c.weightKg} kg</td>
                      <td style={{ fontSize: '0.8125rem', color: 'var(--ink)' }}>{c.weightClass}</td>
                      <td>
                        <Stamp variant={statusData.variant}>
                          {statusData.label}
                        </Stamp>
                      </td>
                    </tr>
                  )
                })}
                {sparringRoster.length === 0 && (
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