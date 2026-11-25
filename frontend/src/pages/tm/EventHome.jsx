import React, { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import TopBar from '../../components/ui/TopBar'
import ScopeBar from '../../components/ui/ScopeBar'
import SideNav from '../../components/ui/SideNav'
import PageHead from '../../components/ui/PageHead'
import Btn from '../../components/ui/Btn'
import Chip from '../../components/ui/Chip'
import Stamp from '../../components/ui/Stamp'
import { useAuth } from '../../contexts/AuthContext'
import { tmNavSections } from '../../utils/navSections'

function StatCard({ label, value, sub }) {
  return (
    <div className="stat-card">
      <div className="stat-card-label">{label}</div>
      <div className="stat-card-value">{value}</div>
      {sub && <div className="stat-card-sub">{sub}</div>}
    </div>
  )
}

export default function EventHome() {
  const { id } = useParams()
  const { user } = useAuth()
  
  const [event, setEvent] = useState(null)
  
  // Unified Roster (No more "Cart" separation)
  const [myCompetitors, setMyCompetitors] = useState([])
  const [myTeams, setMyTeams] = useState([])
  
  const [feesPaid, setFeesPaid] = useState(0) 
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [id, user?.clubCode])

  const fetchDashboardData = async () => {
    try {
      const eventRes = await fetch(`/api/events/${id}`)
      if (!eventRes.ok) throw new Error('Event not found')
      setEvent(await eventRes.json())

      if (user?.clubCode) {
        const rosterRes = await fetch(`/api/events/${id}/competitors`)
        if (rosterRes.ok) {
          const allRoster = await rosterRes.json()
          // Unified view: all drafted athletes are considered registered
          setMyCompetitors(allRoster.filter(c => c.clubCode === user.clubCode))
        }

        const teamRes = await fetch(`/api/teams/event/${id}/club/${user.clubCode}`)
        if (teamRes.ok) {
           const teams = await teamRes.json()
           setMyTeams(teams)
        }
        
        const payRes = await fetch(`/api/events/${id}/payments/club/${user.clubCode}/total`)
        if (payRes.ok) {
          const payData = await payRes.json()
          setFeesPaid(payData.totalPaid)
        }
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <div className="wf"><TopBar /><div className="wf-main" style={{ padding: '2rem' }}><p style={{ color: 'var(--muted)' }}>Loading event dashboard...</p></div></div>
  if (!event) return <div className="wf"><TopBar /><div className="wf-main" style={{ padding: '2rem' }}><p style={{ color: 'var(--muted)' }}>Event not found.</p></div></div>

  // --- DYNAMIC FEE CALCULATION ---
  const categoryFees = event.categoryFees ? (typeof event.categoryFees === 'string' ? JSON.parse(event.categoryFees) : event.categoryFees) : {}
  const parsedCats = event.categories ? (typeof event.categories === 'string' ? JSON.parse(event.categories) : event.categories) : []

  let feesDue = 0

  if (parsedCats && parsedCats.length > 0) {
    parsedCats.forEach(catName => {
      const isTeamCat = catName.toLowerCase().includes('team') || catName.toLowerCase().includes('pair')
      const feeRate = parseFloat(categoryFees[catName] || 0)
      let qty = 0

      if (isTeamCat) {
        qty = myTeams.filter(t => t.categoryName === catName).length
      } else {
        const isSparringCat = catName.toLowerCase().includes('sparring') || catName.toLowerCase().includes('kyorugi')
        const isPatternCat = catName.toLowerCase().includes('pattern') || catName.toLowerCase().includes('poomsae')

        qty = myCompetitors.filter(c => {
          if (isSparringCat && c.isSparring) return true
          if (isPatternCat && c.isPattern) return true
          return false
        }).length
      }

      if (qty > 0) {
        feesDue += (qty * feeRate)
      }
    })
  }

  const outstandingBalance = Math.max(0, feesDue - feesPaid)
  const isRegistrationClosed = ['CLOSED', 'ARCHIVED'].includes(event.status?.toUpperCase())

  return (
    <div className="wf">
      <TopBar breadcrumbs={[{ label: 'Events', to: '/events' }, { label: event.shortName }]} />
      <ScopeBar event={event} switchTo="/events" />
      <div className="wf-body">
        
        <SideNav sections={tmNavSections(id, event?.type)} />
        
        <main className="wf-main">
          
          <PageHead
            title={event.shortName}
            sub={event.venue}
            right={
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                {isRegistrationClosed && (
                  <div style={{ 
                    padding: '0.4rem 0.75rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold',
                    fontFamily: 'JetBrains Mono, monospace', backgroundColor: 'rgba(255, 75, 75, 0.1)', color: '#FF4B4B', border: '1px solid rgba(255, 75, 75, 0.3)'
                  }}>
                    {event.status?.toUpperCase() === 'ARCHIVED' ? 'EVENT ARCHIVED' : 'REGISTRATION CLOSED'}
                  </div>
                )}
                
                {!isRegistrationClosed && (
                  <Btn variant="primary" to={`/events/${id}/register`}>
                    + Register from Master Roster
                  </Btn>
                )}
              </div>
            }
          />

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '0.75rem', marginBottom: '1.5rem' }}>
            <StatCard label="Registered Athletes" value={myCompetitors.length} sub="Tournament Roster" />
            <StatCard label="Total Fees Incurred" value={`MYR ${feesDue}`} sub="Based on registrations" />
            <StatCard label="Fees Paid" value={`MYR ${feesPaid}`} sub="Verified by admin" />
            <StatCard 
              label="Outstanding Balance" 
              value={`MYR ${outstandingBalance}`} 
              sub={outstandingBalance === 0 && feesDue > 0 ? 'Account settled' : 'Requires payment'} 
            />
          </div>

          {/* --- OUTSTANDING BALANCE ACTION BAR --- */}
          {outstandingBalance > 0 && (
             <div className="box" style={{ marginBottom: '1.5rem', borderColor: 'var(--gold)', backgroundColor: 'rgba(212, 175, 55, 0.02)', padding: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
               <div>
                 <span className="section-label" style={{ color: 'var(--gold)' }}>Payment Required</span>
                 <div style={{ fontSize: '0.875rem', color: 'var(--muted)', marginTop: '4px' }}>
                   You have an outstanding balance of <strong style={{ color: 'var(--ink)' }}>MYR {outstandingBalance}</strong>. <br/>
                   Athletes are registered, but fees must be cleared before the event.
                 </div>
               </div>
               
               <div style={{ display: 'flex', gap: '0.75rem' }}>
                 <Btn variant="gold-outline" to={`/events/${id}/fees`}>
                   Upload Bank Transfer Receipt →
                 </Btn>
               </div>
             </div>
          )}

          {/* --- UNIFIED TOURNAMENT ROSTER --- */}
          <div className="box" style={{ marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <span className="section-label">Tournament Roster</span>
              <Link to={`/events/${id}/competitors`} style={{ fontSize: '0.75rem', color: 'var(--gold)' }}>View Full Roster & Filters →</Link>
            </div>
            
            <table className="tbl">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Belt</th>
                  <th>Age Cat.</th>
                  <th>Discipline / Category</th>
                  <th style={{ textAlign: 'right' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {myCompetitors.slice(0, 10).map((c) => (
                  <tr key={c.id}>
                    <td className="name">{c.fullName}</td>
                    <td><Chip variant="ghost">{c.beltGrade}</Chip></td>
                    <td><Chip variant="default">{c.ageCategory || '-'}</Chip></td>
                    <td>
                      <div style={{ fontSize: '0.65rem', color: 'var(--gold)', fontWeight: 600, textTransform: 'uppercase', marginBottom: '2px' }}>
                        {c.isSparring && c.isPattern ? 'Sparring & Pattern' : c.isSparring ? 'Sparring' : 'Pattern'}
                      </div>
                      <div className="mono" style={{ fontSize: '0.75rem' }}>
                        {[c.weightClass || c.weightCategory, c.patternFormat].filter(Boolean).join(' • ') || 'Pending'}
                      </div>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <Stamp variant="ok">Registered</Stamp>
                    </td>
                  </tr>
                ))}
                {myCompetitors.length === 0 && (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', color: 'var(--muted)', padding: '3rem', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.75rem' }}>
                      No competitors registered yet. Click "Register from Master Roster" to begin.
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