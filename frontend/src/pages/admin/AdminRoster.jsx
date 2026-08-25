import React, { useState } from 'react'
import { useParams } from 'react-router-dom'
import TopBar from '../../components/ui/TopBar'
import ScopeBar from '../../components/ui/ScopeBar'
import SideNav from '../../components/ui/SideNav'
import PageHead from '../../components/ui/PageHead'
import Chip from '../../components/ui/Chip'
import Stamp from '../../components/ui/Stamp'
import { getEvent } from '../../data/events'
import { getCompetitorsByEvent } from '../../data/competitors'
import { adminNavSections } from '../../utils/navSections'
import { exportCsv } from '../../utils/exportCsv'
import Btn from '../../components/ui/Btn'

// BACKEND: replace getCompetitorsByEvent with fetch(`/api/events/:id/competitors`)

const EXPORT_COLUMNS = [
  { key: 'id',          header: 'ID' },
  { key: 'fullName',    header: 'Full Name' },
  { key: 'clubCode',    header: 'Club Code' },
  { key: 'clubName',    header: 'Club Name' },
  { key: 'icMasked',    header: 'IC (Masked)' },
  { key: 'dob',         header: 'Date of Birth' },
  { key: 'gender',      header: 'Gender' },
  { key: 'beltGrade',   header: 'Belt Grade' },
  { key: 'ageCategory', header: 'Age Category' },
  { key: 'beltGroup',   header: 'Belt Group' },
  { key: 'weightKg',    header: 'Weight (kg)' },
  { key: 'weightClass', header: 'Weight Class' },
  { key: 'patternFormat', header: 'Pattern Format' },
  { key: 'status',      header: 'Status' },
]

export default function AdminRoster() {
  const { id } = useParams()
  const event = getEvent(id)
  const all = getCompetitorsByEvent(id)

  const [search, setSearch] = useState('')
  const [filterClub, setFilterClub] = useState('')
  const [filterGender, setFilterGender] = useState('')
  const [filterAge, setFilterAge] = useState('')
  const [filterBelt, setFilterBelt] = useState('')

  const clubs = [...new Set(all.map((c) => c.clubCode))].sort()

  const filtered = all.filter((c) => {
    const q = search.toLowerCase()
    const matchSearch = !q || c.fullName.toLowerCase().includes(q) || c.icMasked.includes(q) || c.clubCode.toLowerCase().includes(q)
    const matchClub = !filterClub || c.clubCode === filterClub
    const matchGender = !filterGender || c.gender === filterGender
    const matchAge = !filterAge || c.ageCategory === filterAge
    const matchBelt = !filterBelt || c.beltGroup === filterBelt
    return matchSearch && matchClub && matchGender && matchAge && matchBelt
  })

  // Group counts by club for the summary
  const byClub = clubs.map((code) => ({
    code,
    count: all.filter((c) => c.clubCode === code).length,
  }))

  return (
    <div className="wf">
      <TopBar
        breadcrumbs={[
          { label: 'Admin', to: '/admin' },
          { label: event?.shortName || id, to: `/admin/events/${id}` },
          { label: 'Competitor Roster' },
        ]}
      />
      <ScopeBar event={event} switchTo="/admin" />
      <div className="wf-body">
        <SideNav sections={adminNavSections(id)} />
        <main className="wf-main">
          <PageHead
            title="Competitor Roster"
            sub={`${all.length} total · ${clubs.length} clubs`}
            right={
              <Btn variant="ghost" onClick={() => exportCsv(`roar_roster_${id}.csv`, EXPORT_COLUMNS, filtered)}>
                Export CSV
              </Btn>
            }
          />

          {/* Club summary chips */}
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
            {byClub.map(({ code, count }) => (
              <button
                key={code}
                type="button"
                onClick={() => setFilterClub(filterClub === code ? '' : code)}
                className={`chip ${filterClub === code ? 'chip-gold' : 'chip-ghost'}`}
                style={{ cursor: 'pointer', border: filterClub === code ? undefined : '1px solid var(--line)' }}
              >
                {code} · {count}
              </button>
            ))}
          </div>

          {/* Filters */}
          <div className="box" style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '1rem', padding: '0.75rem 1rem' }}>
            <input
              className="field-input"
              placeholder="Search name, IC or club…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ flex: '1 1 200px', minWidth: '180px' }}
              aria-label="Search"
            />
            <select
              className="field-input field-select"
              value={filterGender}
              onChange={(e) => setFilterGender(e.target.value)}
              style={{ width: '130px' }}
              aria-label="Filter gender"
            >
              <option value="">All Genders</option>
              <option value="M">Male</option>
              <option value="F">Female</option>
            </select>
            <select
              className="field-input field-select"
              value={filterAge}
              onChange={(e) => setFilterAge(e.target.value)}
              style={{ width: '150px' }}
              aria-label="Filter age group"
            >
              <option value="">All Age Groups</option>
              {['U8', '9-11', '12-14', '15-17', '18+'].map((ag) => (
                <option key={ag} value={ag}>{ag}</option>
              ))}
            </select>
            <select
              className="field-input field-select"
              value={filterBelt}
              onChange={(e) => setFilterBelt(e.target.value)}
              style={{ width: '150px' }}
              aria-label="Filter belt group"
            >
              <option value="">All Belt Groups</option>
              {['CB', 'CB-low', 'BB', 'BB-senior'].map((bg) => (
                <option key={bg} value={bg}>{bg}</option>
              ))}
            </select>
            <span style={{ marginLeft: 'auto', fontSize: '0.75rem', color: 'var(--muted)', fontFamily: 'JetBrains Mono, monospace', alignSelf: 'center' }}>
              {filtered.length}/{all.length}
            </span>
          </div>

          <div className="box" style={{ padding: 0, overflow: 'hidden' }}>
            <table className="tbl">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Club</th>
                  <th>IC (Masked)</th>
                  <th>G</th>
                  <th>Belt</th>
                  <th>Age Cat.</th>
                  <th>Belt Group</th>
                  <th>Wt (kg)</th>
                  <th>Weight Class</th>
                  <th>Pattern</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => (
                  <tr key={c.id}>
                    <td className="mono">{c.id}</td>
                    <td className="name">{c.fullName}</td>
                    <td>
                      <Chip variant="default">{c.clubCode}</Chip>
                    </td>
                    <td className="mono">{c.icMasked}</td>
                    <td style={{ color: 'var(--muted)', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.75rem' }}>{c.gender}</td>
                    <td><Chip variant="ghost">{c.beltGrade}</Chip></td>
                    <td><Chip variant="default">{c.ageCategory}</Chip></td>
                    <td><Chip variant="gold">{c.beltGroup}</Chip></td>
                    <td className="mono">{c.weightKg}</td>
                    <td style={{ fontSize: '0.75rem', color: 'var(--ink-2)' }}>{c.weightClass}</td>
                    <td><Chip variant={c.patternFormat === 'Carnival' ? 'warn' : 'ghost'}>{c.patternFormat}</Chip></td>
                    <td>
                      <Stamp variant={c.status === 'confirmed' ? 'ok' : 'gold'}>
                        {c.status}
                      </Stamp>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={12} style={{ textAlign: 'center', padding: '2rem', color: 'var(--muted)', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.75rem' }}>
                      No competitors match the current filters.
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
