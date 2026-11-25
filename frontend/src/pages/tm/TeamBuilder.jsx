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
  const [filterGender, setFilterGender] = useState('')
  const [selected, setSelected] = useState([]) // Stores athleteIds

  useEffect(() => {
    const fetchData = async () => {
      try {
        const eventRes = await fetch(`/api/events/${id}`)
        if (eventRes.ok) setEvent(await eventRes.json())

        if (user?.clubCode) {
          // FIXED: Fetching from registered event competitors, NOT the whole Master Roster
          const compRes = await fetch(`/api/competitors/event/${id}/club/${user.clubCode}`)
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

  const isWT = event?.type?.toUpperCase() === 'WT'
  const sparringLabel = isWT ? 'Team Kyorugi' : 'Team Sparring'
  const patternLabel = isWT ? 'Team Poomsae' : 'Team Pattern'
  const pairLabel = isWT ? 'Pair Poomsae' : 'Pair Pattern'

  const slotsRequired = CATEGORY_SLOTS[category] || 3

  const eligible = myCompetitors.filter((c) => {
    // 1. Exclude athletes already assigned to a team in the currently selected format
    const assignedTypes = c.assignedTeamTypes
      ? c.assignedTeamTypes.split(',')
      : []
    if (assignedTypes.includes(category)) return false

    // 2. Discipline check (checks both global flag and event-specific category)
    if (category.includes('Sparring') || category.includes('Kyorugi')) {
      if (c.isSparring === 0 && !c.weightCategory) return false
    }
    if (category.includes('Pattern') || category.includes('Poomsae')) {
      if (c.isPattern === 0 && !c.patternFormat) return false
    }

    // 3. Calculate age safely from the DATE dob column
    const parsedDob = c.dob ? new Date(c.dob) : null
    const age =
      parsedDob && !Number.isNaN(parsedDob.getTime())
        ? new Date().getFullYear() - parsedDob.getFullYear()
        : null

    // 4. Match Gender & Age Filters
    const matchGender =
      !filterGender || filterGender === 'Mixed' || c.gender === filterGender

    let matchAge = true
    if (filterAge && age === null) matchAge = false
    else if (filterAge === 'U12') matchAge = age < 12
    else if (filterAge === '12-14') matchAge = age >= 12 && age <= 14
    else if (filterAge === '15-17') matchAge = age >= 15 && age <= 17
    else if (filterAge === '18+') matchAge = age >= 18

    return matchAge && matchGender
  })
  function toggleAthlete(aid) {
    setSelected((prev) =>
      prev.includes(aid)
        ? prev.filter((x) => x !== aid)
        : prev.length < slotsRequired
        ? [...prev, aid]
        : prev
    )
  }

  function getSelectedAthlete(aid) {
    return myCompetitors.find((c) => c.athleteId === aid)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    
    if (selected.length === 0) {
      alert("Please select at least one member to start building this team.");
      return;
    }

    try {
      const teamName = `${category} - ${filterGender || 'Mixed'} ${filterAge || 'Open'}`

      const payload = {
        eventId: id,
        clubCode: user.clubCode,
        name: teamName,
        type: category,
        gender: filterGender || 'Mixed',
        ageCategory: filterAge || 'Open',
        members: selected // Sends athleteIds to backend
      }

      const response = await fetch('/api/teams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (!response.ok) throw new Error('Failed to save team')

      navigate(`/events/${id}/roster`)
      
    } catch (error) {
      console.error('Submission error:', error)
      alert('There was a problem saving the team.')
    }
  }

  const filled = selected.length
  const slotStatus = filled >= slotsRequired ? 'complete' : filled > 0 ? 'partial' : 'empty'

  if (loading) return <div className="wf"><TopBar /><div className="wf-main" style={{ padding: '2rem' }}><p style={{ color: 'var(--muted)' }}>Loading eligible athletes...</p></div></div>

  return (
    <div className="wf">
      <TopBar breadcrumbs={[{ label: 'Events', to: '/events' }, { label: event?.shortName || id, to: `/events/${id}` }, { label: 'Team Builder' }]} />
      <ScopeBar event={event} switchTo="/events" />
      <div className="wf-body">
        
        {event && <SideNav sections={tmNavSections(id, event.type)} />}
        
        <main className="wf-main">
          <PageHead title="Build Team / Pair" sub="Construct a team from your registered event roster. Saved teams are instantly confirmed." />

          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: '1.5rem', alignItems: 'start' }}>
              
              <div>
                <div className="box" style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
                  
                  <SelectField label="Format" name="category" id="category" value={category} style={{ flex: '1 1 160px' }}
                    onChange={(e) => { setCategory(e.target.value); setSelected([]); }}
                  >
                    <option value="Team Pattern">{patternLabel}</option>
                    <option value="Team Sparring">{sparringLabel}</option>
                    <option value="Pair Pattern">{pairLabel}</option>
                  </SelectField>

                  <SelectField label="Age Category" name="filterAge" id="filterAge" value={filterAge} style={{ flex: '1 1 130px' }}
                    onChange={(e) => { setFilterAge(e.target.value); setSelected([]); }}
                  >
                    <option value="">All Ages</option>
                    <option value="U12">Under 12</option>
                    <option value="12-14">12–14</option>
                    <option value="15-17">15–17</option>
                    <option value="18+">18+</option>
                  </SelectField>

                  <SelectField label="Gender" name="filterGender" id="filterGender" value={filterGender} style={{ flex: '1 1 110px' }}
                    onChange={(e) => { setFilterGender(e.target.value); setSelected([]); }}
                  >
                    <option value="">All Genders</option>
                    <option value="M">Male</option>
                    <option value="F">Female</option>
                    <option value="Mixed">Mixed</option>
                  </SelectField>
                </div>

                <div className="box" style={{ padding: 0, overflow: 'hidden' }}>
                  <table className="tbl">
                    <thead>
                      <tr>
                        <th style={{ width: '36px' }}></th>
                        <th>Name</th>
                        <th>Age</th>
                        <th>Belt</th>
                        <th>Wt</th>
                      </tr>
                    </thead>
                    <tbody>
                      {eligible.map((c) => {
                        const isSelected = selected.includes(c.athleteId)
                        const isDisabled = !isSelected && filled >= slotsRequired
                        const age = c.dob ? (new Date().getFullYear() - new Date(c.dob).getFullYear()) : 0
                        
                        return (
                          <tr
                            key={c.id}
                            onClick={() => !isDisabled && toggleAthlete(c.athleteId)}
                            style={{
                              cursor: isDisabled ? 'not-allowed' : 'pointer',
                              opacity: isDisabled ? 0.4 : 1,
                              background: isSelected ? 'var(--gold-deep)' : undefined,
                            }}
                          >
                            <td>
                              <input type="checkbox" checked={isSelected} readOnly style={{ accentColor: 'var(--gold)', width: '14px', height: '14px' }} />
                            </td>
                            <td className="name" style={{ color: isSelected ? 'var(--gold)' : undefined }}>{c.fullName}</td>
                            <td><Chip variant="default">{age} yrs</Chip></td>
                            <td><Chip variant="ghost">{c.beltGrade}</Chip></td>
                            <td className="mono">{c.weightKg}kg</td>
                          </tr>
                        )
                      })}
                      {eligible.length === 0 && (
                        <tr>
                          <td colSpan={5} style={{ textAlign: 'center', padding: '2rem', color: 'var(--muted)', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.75rem' }}>
                            No registered athletes found in your event roster. Adjust filters or register athletes first.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Right — slots panel */}
              <div className="box-fill" style={{ position: 'sticky', top: '1.5rem' }}>
                <div className="section-label" style={{ marginBottom: '0.75rem' }}>Slots Panel</div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                  <Chip variant="gold">{category}</Chip>
                  <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.75rem', color: slotStatus === 'complete' ? 'var(--ok)' : 'var(--gold)' }}>
                    {filled}/{slotsRequired} filled
                  </span>
                  {filled < slotsRequired && <span style={{ fontSize: '0.6875rem', color: 'var(--muted)' }}>· {slotsRequired - filled} more needed</span>}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem' }}>
                  {Array.from({ length: slotsRequired }).map((_, i) => {
                    const aid = selected[i]
                    const c = aid ? getSelectedAthlete(aid) : null
                    return (
                      <div key={i} className="box-slot" style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', minHeight: '44px' }}>
                        <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.6875rem', color: 'var(--muted-2)', width: '20px', flexShrink: 0 }}>{i + 1}</span>
                        {c ? (
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: '0.8125rem', color: 'var(--ink)', fontWeight: 500 }}>{c.fullName}</div>
                            <div style={{ fontSize: '0.6875rem', color: 'var(--muted)', fontFamily: 'JetBrains Mono, monospace' }}>{c.beltGrade} · {c.weightKg}kg</div>
                          </div>
                        ) : (
                          <span style={{ fontSize: '0.75rem', color: 'var(--muted-2)', fontFamily: 'JetBrains Mono, monospace' }}>— empty slot —</span>
                        )}
                        {c && (
                          <button type="button" onClick={() => toggleAthlete(aid)} style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', padding: '2px 4px', fontSize: '0.75rem' }}>✕</button>
                        )}
                      </div>
                    )
                  })}
                </div>

                <hr className="divider" />
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <Btn 
                    variant={filled === slotsRequired ? 'primary' : 'gold-outline'} 
                    type="submit" 
                    disabled={filled === 0} 
                    style={{ width: '100%' }}
                  >
                    {filled === slotsRequired ? 'Confirm Team Registration' : 'Save Partial Team'}
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