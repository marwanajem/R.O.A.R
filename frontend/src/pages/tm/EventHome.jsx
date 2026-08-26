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

// BACKEND: replace getEvent/getCompetitorsByEvent/getTeamsByEvent with
//   fetch(`/api/events/${id}`) etc. inside a useEffect or React Query call.

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
  const [myCompetitors, setMyCompetitors] = useState([])
  const [myTeams, setMyTeams] = useState([])
  const [loading, setLoading] = useState(true)

 
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
       
        const eventRes = await fetch(`http://localhost:5001/api/events/${id}`)
        if (!eventRes.ok) throw new Error('Event not found')
        const eventData = await eventRes.json()

        
        const formattedEvent = {
          ...eventData,
          fees: {
            individual: eventData.individualFee,
            team: eventData.teamFee
          }
        }
        setEvent(formattedEvent)

        
        if (user?.clubCode) {
          const rosterRes = await fetch(`http://localhost:5001/api/competitors/event/${id}/club/${user.clubCode}`)
          if (rosterRes.ok) {
            const rosterData = await rosterRes.json()
            setMyCompetitors(rosterData)
          }
        
        if (user?.clubCode) {
          
          const rosterRes = await fetch(`http://localhost:5001/api/competitors/event/${id}/club/${user.clubCode}`)
          if (rosterRes.ok) {
            const rosterData = await rosterRes.json()
            setMyCompetitors(rosterData)
          }

          //Teams/Pairs
          const teamRes = await fetch(`http://localhost:5001/api/teams/event/${id}/club/${user.clubCode}`)
          if (teamRes.ok) {
            const teamData = await teamRes.json()
            setMyTeams(teamData)
          }
        }
        }
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [id, user?.clubCode])

  
  if (loading) {
    return (
      <div className="wf">
        <TopBar />
        <div className="wf-main" style={{ padding: '2rem' }}>
          <p style={{ color: 'var(--muted)' }}>Loading event dashboard...</p>
        </div>
      </div>
    )
  }

  
  if (!event) {
    return (
      <div className="wf">
        <TopBar />
        <div className="wf-main" style={{ padding: '2rem' }}>
          <p style={{ color: 'var(--muted)' }}>Event not found.</p>
        </div>
      </div>
    )
  }

  const feesDue = myCompetitors.length * event.fees.individual + myTeams.length * event.fees.team
  const feesPaid = 0

  return (
    <div className="wf">
      <TopBar
        breadcrumbs={[
          { label: 'Events', to: '/events' },
          { label: event.shortName },
        ]}
      />
      <ScopeBar event={event} switchTo="/events" />
      <div className="wf-body">
        <SideNav sections={tmNavSections(id)} />
        <main className="wf-main">
          <PageHead
            title={event.shortName}
            sub={event.venue}
            right={
              <Btn variant="primary" to={`/events/${id}/competitors/add`}>
                + Add Competitor
              </Btn>
            }
          />

         
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
              gap: '0.75rem',
              marginBottom: '1.5rem',
            }}
          >
            <StatCard label="Competitors" value={myCompetitors.length} sub="registered" />
            <StatCard label="Teams / Pairs" value={myTeams.length} sub="built" />
            <StatCard
              label="Fees Due"
              value={`MYR ${feesDue}`}
              sub={`MYR ${feesPaid} paid`}
            />
            <StatCard
              label="Payment Status"
              value={feesPaid >= feesDue && feesDue > 0 ? 'Paid' : 'Pending'}
              sub={feesDue === 0 ? 'No charges yet' : 'Awaiting verification'}
            />
          </div>

          
          <div className="box" style={{ marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <span className="section-label">
                Recent Roster
              </span>
              <Link to={`/events/${id}/competitors`} style={{ fontSize: '0.75rem', color: 'var(--gold)' }}>
                View all →
              </Link>
            </div>
            <table className="tbl">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>IC (masked)</th>
                  <th>Belt</th>
                  <th>Age Cat.</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {myCompetitors.slice(0, 6).map((c) => (
                  <tr key={c.id}>
                    <td className="name">{c.fullName}</td>
                    <td className="mono">{c.icMasked}</td>
                    <td>
                      <Chip variant="ghost">{c.beltGrade}</Chip>
                    </td>
                    <td>
                      <Chip variant="default">{c.ageCategory}</Chip>
                    </td>
                    <td>
                      <Stamp variant={c.status === 'confirmed' ? 'ok' : 'gold'}>
                        {c.status}
                      </Stamp>
                    </td>
                  </tr>
                ))}
                {myCompetitors.length === 0 && (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', color: 'var(--muted)', padding: '2rem', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.75rem' }}>
                      No competitors registered yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

         
          <div className="box">
            <div className="section-label">
              Fee Estimate
            </div>
            <table className="tbl">
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Qty</th>
                  <th>Rate (MYR)</th>
                  <th>Total (MYR)</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Individual Registration</td>
                  <td className="mono">{myCompetitors.length}</td>
                  <td className="mono">{event.fees.individual}</td>
                  <td className="mono">{myCompetitors.length * event.fees.individual}</td>
                </tr>
                <tr>
                  <td>Team / Pair Registration</td>
                  <td className="mono">{myTeams.length}</td>
                  <td className="mono">{event.fees.team}</td>
                  <td className="mono">{myTeams.length * event.fees.team}</td>
                </tr>
                <tr>
                  <td
                    colSpan={3}
                    style={{ textAlign: 'right', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.6875rem', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--muted)' }}
                  >
                    Total Due
                  </td>
                  <td style={{ fontFamily: 'JetBrains Mono, monospace', color: 'var(--gold)', fontWeight: 600 }}>
                    {feesDue}
                  </td>
                </tr>
              </tbody>
            </table>
            <div style={{ marginTop: '1rem' }}>
              <Btn variant="gold-outline" to={`/events/${id}/fees`}>
                Submit Payment Proof →
              </Btn>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}