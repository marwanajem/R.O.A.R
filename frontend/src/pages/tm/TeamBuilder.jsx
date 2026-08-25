import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import TopBar from '../../components/ui/TopBar'
import ScopeBar from '../../components/ui/ScopeBar'
import SideNav from '../../components/ui/SideNav'
import PageHead from '../../components/ui/PageHead'
import SelectField from '../../components/ui/SelectField'
import Btn from '../../components/ui/Btn'
import Chip from '../../components/ui/Chip'
import { useAuth } from '../../contexts/AuthContext'
import { tmNavSections } from '../../utils/navSections'

const CATEGORY_SLOTS = {
  'Team Pattern': 3,
  'Team Sparring': 3,
  'Pair Pattern': 2,
}

export default function TeamBuilder() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  
  const [event, setEvent] = useState(null)
  const [myCompetitors, setMyCompetitors] = useState([])
  const [loading, setLoading] = useState(true)

  const [category, setCategory] = useState('Team Pattern')
  const [filterAge, setFilterAge] = useState('')
  const [filterBelt, setFilterBelt] = useState('')
  const [filterGender, setFilterGender] = useState('')
  const [selected, setSelected] = useState([])

 
  useEffect(() => {
    const fetchData = async () => {
      try {
        const eventRes = await fetch(`[https://roarchampionship.com](https://roarchampionship.com)/api/events/${id}`)
        if (eventRes.ok) setEvent(await eventRes.json())

        if (user?.clubCode) {
          const compRes = await fetch(`[https://roarchampionship.com](https://roarchampionship.com)/api/competitors/event/${id}/club/${user.clubCode}`)
          if (compRes.ok) setMyCompetitors(await compRes.json())
        }
      } catch (error) {
        console.error('Failed to load data:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [id, user?.clubCode])

  const slotsRequired = CATEGORY_SLOTS[category] || 3

  const eligible = myCompetitors.filter((c) => {
    const matchAge = !filterAge || c.ageCategory === filterAge
    const matchBelt = !filterBelt || c.beltGroup === filterBelt
    const matchGender = !filterGender || c.gender === filterGender
    return matchAge && matchBelt && matchGender
  })

  function toggleCompetitor(cid) {
    setSelected((prev) =>
      prev.includes(cid)
        ? prev.filter((x) => x !== cid)
        : prev.length < slotsRequired
        ? [...prev, cid]
        : prev
    )
  }

  function getSelectedCompetitor(cid) {
    return myCompetitors.find((c) => c.id === cid)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (selected.length < slotsRequired) return

    try {
      
      const teamName = `${category} - ${filterGender || 'Mixed'} ${filterAge || 'Open'}`

      const payload = {
        eventId: id,
        clubCode: user.clubCode,
        name: teamName,
        type: category,
        gender: filterGender || 'Mixed',
        ageCategory: filterAge || 'Open',
        members: selected
      }

      
      const response = await fetch('[https://roarchampionship.com](https://roarchampionship.com)/api/teams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (!response.ok) throw new Error('Failed to save team')

      alert('Team created successfully!')
      navigate(`/events/${id}/teams`)
      
    } catch (error) {
      console.error('Submission error:', error)
      alert('There was a problem saving the team.')
    }
  }

  const filled = selected.length
  const slotStatus = filled >= slotsRequired ? 'complete' : filled > 0 ? 'partial' : 'empty'

  if (loading) {
    return (
      <div className="wf">
        <TopBar />
        <div className="wf-main" style={{ padding: '2rem' }}>
          <p style={{ color: 'var(--muted)' }}>Loading eligible athletes...</p>
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
          { label: 'Teams & Pairs', to: `/events/${id}/teams` },
          { label: 'New Team' },
        ]}
      />
      <ScopeBar event={event} switchTo="/events" />
      <div className="wf-body">
        <SideNav sections={tmNavSections(id)} />
        <main className="wf-main">
          <PageHead title="Build Team / Pair" sub="Select competitors for this entry" />

          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: '1.5rem', alignItems: 'start' }}>
              
              <div>
           
                <div className="box" style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
                  <SelectField
                    label="Category"
                    name="category"
                    id="category"
                    value={category}
                    onChange={(e) => { setCategory(e.target.value); setSelected([]) }}
                    style={{ flex: '1 1 160px' }}
                  >
                    <option>Team Pattern</option>
                    <option>Team Sparring</option>
                    <option>Pair Pattern</option>
                  </SelectField>
                  <SelectField
                    label="Age Category"
                    name="filterAge"
                    id="filterAge"
                    value={filterAge}
                    onChange={(e) => setFilterAge(e.target.value)}
                    style={{ flex: '1 1 130px' }}
                  >
                    <option value="">All Ages</option>
                    <option value="U8">U8</option>
                    <option value="9-11">9–11</option>
                    <option value="12-14">12–14</option>
                    <option value="15-17">15–17</option>
                    <option value="18+">18+</option>
                  </SelectField>
                  <SelectField
                    label="Belt Group"
                    name="filterBelt"
                    id="filterBelt"
                    value={filterBelt}
                    onChange={(e) => setFilterBelt(e.target.value)}
                    style={{ flex: '1 1 130px' }}
                  >
                    <option value="">All Belts</option>
                    <option value="CB">CB (8G–5G)</option>
                    <option value="CB-low">CB-Low (4G–1G)</option>
                    <option value="BB">BB (1D–3D)</option>
                    <option value="BB-senior">BB-Senior (4D+)</option>
                  </SelectField>
                  <SelectField
                    label="Gender"
                    name="filterGender"
                    id="filterGender"
                    value={filterGender}
                    onChange={(e) => setFilterGender(e.target.value)}
                    style={{ flex: '1 1 110px' }}
                  >
                    <option value="">All</option>
                    <option value="M">Male</option>
                    <option value="F">Female</option>
                  </SelectField>
                </div>

                {/* Eligible roster */}
                <div className="box" style={{ padding: 0, overflow: 'hidden' }}>
                  <table className="tbl">
                    <thead>
                      <tr>
                        <th style={{ width: '36px' }}></th>
                        <th>Name</th>
                        <th>Age Cat.</th>
                        <th>Belt</th>
                        <th>Wt</th>
                        <th>Pattern</th>
                      </tr>
                    </thead>
                    <tbody>
                      {eligible.map((c) => {
                        const isSelected = selected.includes(c.id)
                        const isDisabled = !isSelected && filled >= slotsRequired
                        return (
                          <tr
                            key={c.id}
                            onClick={() => !isDisabled && toggleCompetitor(c.id)}
                            style={{
                              cursor: isDisabled ? 'not-allowed' : 'pointer',
                              opacity: isDisabled ? 0.4 : 1,
                              background: isSelected ? 'var(--gold-deep)' : undefined,
                            }}
                          >
                            <td>
                              <input
                                type="checkbox"
                                checked={isSelected}
                                readOnly
                                style={{ accentColor: 'var(--gold)', width: '14px', height: '14px' }}
                                aria-label={`Select ${c.fullName}`}
                              />
                            </td>
                            <td className="name" style={{ color: isSelected ? 'var(--gold)' : undefined }}>{c.fullName}</td>
                            <td><Chip variant="default">{c.ageCategory}</Chip></td>
                            <td><Chip variant="ghost">{c.beltGrade}</Chip></td>
                            <td className="mono">{c.weightKg}kg</td>
                            <td><Chip variant={c.patternFormat === 'Carnival' ? 'warn' : 'ghost'}>{c.patternFormat || '—'}</Chip></td>
                          </tr>
                        )
                      })}
                      {eligible.length === 0 && (
                        <tr>
                          <td colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: 'var(--muted)', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.75rem' }}>
                            No eligible competitors found. Adjust filters above.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Right — slots panel */}
              <div className="box-fill" style={{ position: 'sticky', top: '1.5rem' }}>
                <div className="section-label" style={{ marginBottom: '0.75rem' }}>
                  Slots Panel
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                  <Chip variant="gold">{category}</Chip>
                  <span
                    style={{
                      fontFamily: 'JetBrains Mono, monospace',
                      fontSize: '0.75rem',
                      color: slotStatus === 'complete' ? 'var(--ok)' : 'var(--gold)',
                    }}
                  >
                    {filled}/{slotsRequired} filled
                  </span>
                  {filled < slotsRequired && (
                    <span style={{ fontSize: '0.6875rem', color: 'var(--muted)' }}>
                      · {slotsRequired - filled} more needed
                    </span>
                  )}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem' }}>
                  {Array.from({ length: slotsRequired }).map((_, i) => {
                    const cid = selected[i]
                    const c = cid ? getSelectedCompetitor(cid) : null
                    return (
                      <div
                        key={i}
                        className="box-slot"
                        style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', minHeight: '44px' }}
                      >
                        <span
                          style={{
                            fontFamily: 'JetBrains Mono, monospace',
                            fontSize: '0.6875rem',
                            color: 'var(--muted-2)',
                            width: '20px',
                            flexShrink: 0,
                          }}
                        >
                          {i + 1}
                        </span>
                        {c ? (
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: '0.8125rem', color: 'var(--ink)', fontWeight: 500 }}>{c.fullName}</div>
                            <div style={{ fontSize: '0.6875rem', color: 'var(--muted)', fontFamily: 'JetBrains Mono, monospace' }}>
                              {c.beltGrade} · {c.weightKg}kg
                            </div>
                          </div>
                        ) : (
                          <span style={{ fontSize: '0.75rem', color: 'var(--muted-2)', fontFamily: 'JetBrains Mono, monospace' }}>
                            — empty slot —
                          </span>
                        )}
                        {c && (
                          <button
                            type="button"
                            onClick={() => toggleCompetitor(cid)}
                            style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', padding: '2px 4px', fontSize: '0.75rem' }}
                            aria-label={`Remove ${c.fullName}`}
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    )
                  })}
                </div>

                <hr className="divider" />

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <Btn
                    variant="primary"
                    type="submit"
                    disabled={filled < slotsRequired}
                    style={{ width: '100%' }}
                  >
                    Save Team Entry
                  </Btn>
                  <Btn
                    variant="ghost"
                    type="button"
                    onClick={() => navigate(`/events/${id}/teams`)}
                    style={{ width: '100%' }}
                  >
                    Cancel
                  </Btn>
                </div>
              </div>
            </div>
          </form>
        </main>
      </div>
    </div>
  )
}