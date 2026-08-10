import React from 'react'
import { useParams, Link } from 'react-router-dom'
import TopBar from '../../components/ui/TopBar'
import ScopeBar from '../../components/ui/ScopeBar'
import SideNav from '../../components/ui/SideNav'
import PageHead from '../../components/ui/PageHead'
import Btn from '../../components/ui/Btn'
import Chip from '../../components/ui/Chip'
import Stamp from '../../components/ui/Stamp'
import { getEvent } from '../../data/events'
import { getTeamsByEvent } from '../../data/teams'
import { getCompetitorsByEvent } from '../../data/competitors'
import { useAuth } from '../../contexts/AuthContext'
import { tmNavSections } from '../../utils/navSections'

export default function TeamList() {
  const { id } = useParams()
  const { user } = useAuth()
  const event = getEvent(id)
  const allTeams = getTeamsByEvent(id)
  const allCompetitors = getCompetitorsByEvent(id)
  const teams = allTeams.filter((t) => t.clubCode === user?.clubCode)

  function getMemberNames(memberIds) {
    return memberIds
      .map((mid) => allCompetitors.find((c) => c.id === mid)?.fullName || mid)
      .join(', ')
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
