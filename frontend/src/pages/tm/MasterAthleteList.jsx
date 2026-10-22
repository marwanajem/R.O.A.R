import React, { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import TopBar from '../../components/ui/TopBar'
import SideNav from '../../components/ui/SideNav'
import Chip from '../../components/ui/Chip'
import Stamp from '../../components/ui/Stamp'
import { tmTopNavSections } from '../../utils/navSections'

export default function MasterAthleteList() {
  const { user } = useAuth()
  const [athletes, setAthletes] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchMasterRoster = async () => {
      if (!user?.clubCode) return;
      
      try {
        const response = await fetch(`/api/competitors/club/${user.clubCode}`)
        if (!response.ok) throw new Error('Failed to fetch data')
        const data = await response.json()
        setAthletes(data)
      } catch (error) {
        console.error("Error loading master roster:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchMasterRoster()
  }, [user])

  return (
    <div className="wf">
      <TopBar breadcrumbs={[{ label: 'Club Management' }, { label: 'Master Athlete List' }]} />
      <div className="wf-body">
        <SideNav sections={tmTopNavSections()} />
        <main className="wf-main" style={{ padding: '2rem' }}>
          <div className="page-head">
            <div>
              <h2>Master Athlete List</h2>
              <p className="page-head-sub">
                All registered competitors across all events for {user?.clubName} ({user?.clubCode})
              </p>
            </div>
            <div className="stat-card" style={{ padding: '0.5rem 1rem', display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
               <div className="stat-card-label">Total Athletes</div>
               <div className="stat-card-value" style={{ fontSize: '1.5rem' }}>{athletes.length}</div>
            </div>
          </div>

          <div className="box" style={{ padding: 0, overflowX: 'auto' }}>
            {loading ? (
              <div style={{ padding: '2rem', color: 'var(--muted)' }}>Loading athletes...</div>
            ) : athletes.length === 0 ? (
              <div style={{ padding: '2rem', color: 'var(--muted)' }}>No athletes registered yet.</div>
            ) : (
              <table className="tbl">
                <thead>
                  <tr>
                    <th>Athlete Name</th>
                    <th>IC / Passport</th>
                    <th>Belt & Weight</th>
                    <th>Registered Event</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {athletes.map((ath) => (
                    <tr key={ath.id}>
                      <td className="name">{ath.fullName}</td>
                      <td className="mono">{ath.icMasked}</td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.375rem', flexWrap: 'wrap' }}>
                          <Chip variant="default">{ath.beltGrade}</Chip>
                          <Chip variant="ghost">{ath.weightKg} kg</Chip>
                        </div>
                      </td>
                      <td>
                        <span style={{ fontSize: '0.8125rem', color: 'var(--ink-2)' }}>
                          {ath.eventName || `Event ID: ${ath.eventId}`}
                        </span>
                      </td>
                      <td>
                        <Stamp variant={ath.status === 'confirmed' ? 'ok' : 'default'}>
                          {ath.status}
                        </Stamp>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}