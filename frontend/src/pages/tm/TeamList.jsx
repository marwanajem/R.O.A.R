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

export default function TeamList() {
  const { id } = useParams()
  const { user } = useAuth()
  
  const [event, setEvent] = useState(null)
  const [teams, setTeams] = useState([])
  const [allCompetitors, setAllCompetitors] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchTeamData = async () => {
      try {
       
        const eventRes = await fetch(`/api/auth/login/api/events/${id}`)
        if (eventRes.ok) setEvent(await eventRes.json())

        if (user?.clubCode) {
          
          const [teamRes, compRes] = await Promise.all([
            fetch(`/api/auth/login/api/teams/event/${id}/club/${user.clubCode}`),
            fetch(`/api/auth/login/api/competitors/event/${id}/club/${user.clubCode}`)
          ])

          if (compRes.ok) setAllCompetitors(await compRes.json())

          if (teamRes.ok) {
            const teamData = await teamRes.json()
            
           
            const formattedTeams = teamData.map(t => ({
              ...t,
              category: t.type,
              beltGroup: '—', 
              slotsFilled: t.members ? t.members.length : 0, 
              slotsRequired: t.type?.toLowerCase().includes('pair') ? 2 : 5, 
              members: t.members || []
            }))
            
            setTeams(formattedTeams)
          }
        }
      } catch (error) {
        console.error('Failed to load teams:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchTeamData()
  }, [id, user?.clubCode])

  
  function getMemberNames(memberIds) {
    if (!memberIds || memberIds.length === 0) return 'No members assigned yet'
    return memberIds
    .map((mid) => {
      const comp = allCompetitors.find((c) => c.id === mid)
      return comp ? comp.fullName.trim() : mid 
    })
    .join(', ')
  }

  if (loading) {
    return (
      <div className="wf">
        <TopBar />
        <div className="wf-main" style={{ padding: '2rem' }}>
          <p style={{ color: 'var(--muted)' }}>Loading teams...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="wf">
      <TopBar
        breadcrumbs={[
          { label: 'Events', to: '/events' },
          { label: event?.shortName || id, to: `/events/${id}` },
          { label: 'Teams & Pairs' },
        ]}
      />
      <ScopeBar event={event} switchTo="/events" />
      <div className="wf-body">
        <SideNav sections={tmNavSections(id)} />
        <main className="wf-main">
          <PageHead
            title="Teams & Pairs"
            sub={`${teams.length} team(s) registered`}
            right={
              <Btn variant="primary" to={`/events/${id}/teams/new`}>
                + Build Team / Pair
              </Btn>
            }
          />

          <div className="box" style={{ padding: 0, overflow: 'hidden' }}>
            <table className="tbl">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Team Name</th>
                  <th>Category</th>
                  <th>Age</th>
                  <th>Belt</th>
                  <th>Slots</th>
                  <th>Members</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {teams.map((t) => (
                  <tr key={t.id}>
                    <td className="mono">{t.id}</td>
                    <td className="name">{t.name}</td>
                    <td><Chip variant="gold">{t.category}</Chip></td>
                    <td><Chip variant="default">{t.ageCategory}</Chip></td>
                    <td><Chip variant="ghost">{t.beltGroup}</Chip></td>
                    <td>
                      <span
                        style={{
                          fontFamily: 'JetBrains Mono, monospace',
                          fontSize: '0.75rem',
                          color: t.slotsFilled >= t.slotsRequired ? 'var(--ok)' : 'var(--gold)',
                        }}
                      >
                        {t.slotsFilled}/{t.slotsRequired}
                      </span>
                      {t.slotsFilled < t.slotsRequired && (
                        <span style={{ fontSize: '0.6875rem', color: 'var(--muted)', marginLeft: '4px' }}>
                          · {t.slotsRequired - t.slotsFilled} more needed
                        </span>
                      )}
                    </td>
                    <td style={{ maxWidth: '240px', fontSize: '0.75rem', color: 'var(--muted)' }}>
                      {getMemberNames(t.members)}
                    </td>
                    <td>
                      <Stamp variant={t.status === 'complete' ? 'ok' : 'gold'}>
                        {t.status}
                      </Stamp>
                    </td>
                  </tr>
                ))}
                {teams.length === 0 && (
                  <tr>
                    <td colSpan={8} style={{ textAlign: 'center', padding: '2rem', color: 'var(--muted)', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.75rem' }}>
                      No teams built yet. Click &quot;Build Team / Pair&quot; to start.
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