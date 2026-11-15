import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import TopBar from '../../components/ui/TopBar'
import ScopeBar from '../../components/ui/ScopeBar'
import SideNav from '../../components/ui/SideNav'
import PageHead from '../../components/ui/PageHead'
import Btn from '../../components/ui/Btn'
import Stamp from '../../components/ui/Stamp'
import Chip from '../../components/ui/Chip'
import { useAuth } from '../../contexts/AuthContext'
import { tmNavSections } from '../../utils/navSections'

// --- HELPER FUNCTIONS ---
function getFormat(label) {
  const l = label.toLowerCase()
  if (l.includes('team')) return 'Team'
  if (l.includes('pair') || l.includes('mixed')) return 'Pair'
  return 'Individual'
}

function calculateAge(dob) {
  if (!dob) return 0
  return new Date().getFullYear() - new Date(dob).getFullYear()
}

function getAgeBounds(ageGroupStr) {
  if (!ageGroupStr) return { min: 0, max: 99 }
  const str = ageGroupStr.toUpperCase()
  if (str.includes('-')) {
    const [min, max] = str.split('-').map(s => parseInt(s.replace(/\D/g, ''), 10))
    return { min: min || 0, max: max || 99 }
  }
  if (str.includes('U') || str.includes('UNDER')) {
    const max = parseInt(str.replace(/\D/g, ''), 10)
    return { min: 0, max: max ? max - 1 : 99 }
  }
  if (str.includes('+') || str.includes('OVER')) {
    const min = parseInt(str.replace(/\D/g, ''), 10)
    return { min: min || 0, max: 99 }
  }
  return { min: 0, max: 99 }
}

function getWeightBounds(label) {
  const l = label.toLowerCase()
  const numbers = l.match(/\d+(\.\d+)?/g)
  if (!numbers) return { min: 0, max: 999 }

  if (numbers.length >= 2 && l.includes('-')) {
    return { min: parseFloat(numbers[0]), max: parseFloat(numbers[1]) }
  }
  
  const weight = parseFloat(numbers[0])
  if (l.includes('over') || l.includes('+')) return { min: weight, max: 999 }
  if (l.includes('under') || l.includes('-')) return { min: 0, max: weight }
  
  return { min: 0, max: 999 }
}

export default function EventRegistration() {
  const { id } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()

  const [event, setEvent] = useState(null)
  const [categories, setCategories] = useState([])
  const [masterRoster, setMasterRoster] = useState([])
  const [draftedCompetitors, setDraftedCompetitors] = useState([])
  const [loading, setLoading] = useState(true)

  const [stepDisc, setStepDisc] = useState(null)   
  const [stepFormat, setStepFormat] = useState(null) 
  
  const [activeCategory, setActiveCategory] = useState(null)
  const [selectedAthleteIds, setSelectedAthleteIds] = useState([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [successData, setSuccessData] = useState(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [evRes, catRes, rostRes, compRes] = await Promise.all([
          fetch(`/api/events/${id}`),
          fetch(`/api/events/${id}/categories`),
          fetch(`/api/athletes/club/${user.clubCode}`),
          fetch(`/api/events/${id}/competitors`)
        ])
        if (evRes.ok) setEvent(await evRes.json())
        if (catRes.ok) {
           const allCats = await catRes.json()
           setCategories(allCats.filter(c => c.isEnabled === 1))
        }
        if (rostRes.ok) setMasterRoster(await rostRes.json())
        if (compRes.ok) {
           const allComps = await compRes.json()
           setDraftedCompetitors(allComps.filter(c => c.clubCode === user.clubCode))
        }
      } catch (error) {
        console.error('Data fetch error:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [id, user?.clubCode])

  // --- DYNAMIC RULESET TERMINOLOGY ---
  const isWT = event?.type?.toUpperCase() === 'WT'
  const isITF = event?.type?.toUpperCase() === 'ITF'
  const sparringLabel = isWT ? 'Kyorugi' : (isITF ? 'Sparring' : 'Sparring / Kyorugi')
  const patternLabel = isWT ? 'Poomsae' : (isITF ? 'Pattern' : 'Pattern / Poomsae')

  const availableDisciplines = ['sparring', 'pattern'].filter(disc => categories.some(c => c.type === disc))
  const availableFormats = stepDisc ? [...new Set(categories.filter(c => c.type === stepDisc).map(c => getFormat(c.label)))] : []
  const availableCategories = (stepDisc && stepFormat) ? categories.filter(c => c.type === stepDisc && getFormat(c.label) === stepFormat) : []

  const groupedCategories = availableCategories.reduce((acc, cat) => {
    const group = cat.gender || 'Mixed'
    if (!acc[group]) acc[group] = []
    acc[group].push(cat)
    return acc
  }, {})

  const getEligibleAthletes = (category) => {
    return masterRoster.filter(athlete => {
      if (category.type === 'sparring' && athlete.isSparring === 0) return false
      if (category.type === 'pattern' && athlete.isPattern === 0) return false
      if (category.gender && category.gender !== 'Mixed' && athlete.gender !== category.gender) return false
      
      const age = calculateAge(athlete.dob)
      const ageBounds = getAgeBounds(category.ageGroup)
      if (age < ageBounds.min || age > ageBounds.max) return false

      if (category.type === 'sparring') {
        const wBounds = getWeightBounds(category.label)
        if (athlete.weightKg < (wBounds.min - 15) || athlete.weightKg > (wBounds.max + 15)) {
          return false
        }
      }
      return true
    })
  }

  const handleRegisterAthletes = async () => {
    if (selectedAthleteIds.length === 0) return
    setIsSubmitting(true)
    try {
      const promises = selectedAthleteIds.map(athleteId => 
        fetch(`/api/events/${id}/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ athleteId, categoryType: activeCategory.type, categoryLabel: activeCategory.label })
        })
      )
      await Promise.all(promises)
      const compRes = await fetch(`/api/events/${id}/competitors`)
      const allComps = await compRes.json()
      setDraftedCompetitors(allComps.filter(c => c.clubCode === user.clubCode))
      
      setSuccessData({
        count: selectedAthleteIds.length,
        category: activeCategory.label
      })
      
      setActiveCategory(null)
      setSelectedAthleteIds([])
    } catch (error) {
      alert("Failed to register athletes.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const toggleAthleteSelection = (athleteId) => {
    setSelectedAthleteIds(prev => prev.includes(athleteId) ? prev.filter(id => id !== athleteId) : [...prev, athleteId])
  }

  const getFormatLabel = (fmt, disc) => {
    if (fmt === 'Individual') return 'Individual'
    if (disc === 'sparring') {
      return isWT ? `Team ${sparringLabel}` : `Team ${sparringLabel}`
    }
    if (disc === 'pattern') {
      if (fmt === 'Pair') return isWT ? `Pair ${patternLabel}` : `Pair ${patternLabel}`
      return isWT ? `Team ${patternLabel}` : `Team ${patternLabel}`
    }
    return fmt
  }

  if (loading) return <div className="wf"><TopBar /><div className="wf-main" style={{ padding: '2rem' }}>Loading Dashboard...</div></div>

  const ToggleBtn = ({ active, onClick, children }) => (
    <button onClick={onClick} style={{
      padding: '0.75rem 1.5rem', borderRadius: '4px', cursor: 'pointer',
      backgroundColor: active ? 'var(--gold)' : 'transparent',
      border: `1px solid ${active ? 'var(--gold)' : 'var(--line)'}`,
      color: active ? '#000' : 'var(--muted)',
      fontWeight: 600, fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: '0.05em',
      transition: 'all 0.2s', minWidth: '160px'
    }}>
      {children}
    </button>
  )

  return (
    <div className="wf">
      <TopBar breadcrumbs={[{ label: 'Events', to: '/events' }, { label: event?.shortName, to: `/events/${id}` }, { label: 'Register' }]} />
      <ScopeBar event={event} switchTo="/events" />
      <div className="wf-body">
        <SideNav sections={tmNavSections(id, event?.type)} />
        
        <main className="wf-main">
          <PageHead
            title="Registration Dashboard"
            sub="Filter by category and seamlessly register athletes from your Master Roster."
            right={
              <Btn variant="gold-outline" to={`/events/${id}/special-requests`}>
                ? Category Appeals
              </Btn>
            }
          />

          {categories.length === 0 ? (
            /* --- NEW: PENDING STATE IF NO CATEGORIES SAVED --- */
            <div className="box" style={{ textAlign: 'center', padding: '4rem 2rem', border: '1px dashed var(--line)', backgroundColor: 'var(--paper)' }}>
              <div style={{ fontSize: '2rem', marginBottom: '1rem', opacity: 0.5 }}>🚧</div>
              <h3 style={{ margin: '0 0 0.5rem 0', color: 'var(--gold)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                Categories Pending Configuration
              </h3>
              <p style={{ color: 'var(--muted)', fontSize: '0.875rem', maxWidth: '450px', margin: '0 auto', lineHeight: 1.6 }}>
                The tournament administrators have not yet finalized the registration divisions for this event. Please check back once they have generated the categories.
              </p>
            </div>
          ) : (
            /* --- EXISTING STEPS (Wrapped in fragments/divs) --- */
            <>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', marginBottom: '2rem' }}>
                
                {/* STEP 1: DISCIPLINE */}
                <div>
                  <div className="section-label" style={{ marginBottom: '0.75rem' }}>1. Discipline</div>
                  <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                    {availableDisciplines.includes('sparring') && (
                      <ToggleBtn active={stepDisc === 'sparring'} onClick={() => { setStepDisc('sparring'); setStepFormat(null) }}>{sparringLabel}</ToggleBtn>
                    )}
                    {availableDisciplines.includes('pattern') && (
                      <ToggleBtn active={stepDisc === 'pattern'} onClick={() => { setStepDisc('pattern'); setStepFormat(null) }}>{patternLabel}</ToggleBtn>
                    )}
                  </div>
                </div>

                {/* STEP 2: FORMAT */}
                {stepDisc && (
                  <div style={{ animation: 'fadeIn 0.3s' }}>
                    <div className="section-label" style={{ marginBottom: '0.75rem' }}>2. Format</div>
                    <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                      {availableFormats.map(fmt => (
                        <ToggleBtn key={fmt} active={stepFormat === fmt} onClick={() => setStepFormat(fmt)}>
                          {getFormatLabel(fmt, stepDisc)}
                        </ToggleBtn>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* STEP 3: CATEGORY SELECTION */}
              {stepFormat && (
                <div style={{ animation: 'fadeIn 0.3s', borderTop: '1px solid var(--line)', paddingTop: '2rem' }}>
                  <div className="section-label" style={{ marginBottom: '1.5rem' }}>3. Select Category</div>
                  
                  {Object.keys(groupedCategories).map(genderGroup => (
                    <div key={genderGroup} style={{ marginBottom: '2rem' }}>
                      <h4 style={{ color: 'var(--muted)', margin: '0 0 1rem 0', paddingLeft: '0.25rem', borderLeft: '3px solid var(--gold)', fontSize: '0.875rem', textTransform: 'uppercase' }}>
                        {genderGroup === 'M' ? 'Male Categories' : genderGroup === 'F' ? 'Female Categories' : 'Mixed Categories'}
                      </h4>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '0.75rem' }}>
                        {groupedCategories[genderGroup].map(cat => (
                          <div key={cat.id} 
                               onClick={() => { setActiveCategory(cat); setSelectedAthleteIds([]) }}
                               style={{
                                 padding: '1rem', backgroundColor: 'var(--paper)', border: '1px solid var(--line)', 
                                 borderRadius: '4px', cursor: 'pointer', transition: 'all 0.15s',
                                 display: 'flex', flexDirection: 'column', justifyContent: 'space-between'
                               }}
                               onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--gold)'; e.currentTarget.style.backgroundColor = 'var(--paper-2)' }}
                               onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--line)'; e.currentTarget.style.backgroundColor = 'var(--paper)' }}
                          >
                            <div style={{ fontSize: '0.65rem', color: 'var(--muted-2)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>
                              {cat.ageGroup}
                            </div>
                            <div style={{ fontWeight: 600, color: 'var(--ink)', fontSize: '0.875rem' }}>{cat.label}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {/* --- REGISTER ATHLETES MODAL --- */}
          {activeCategory && (
            <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(10, 10, 10, 0.9)', zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
              <div className="box" style={{ width: '100%', maxWidth: '800px', maxHeight: '85vh', display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden', border: '1px solid var(--line)' }}>
                
                {/* Modal Header */}
                <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--line)', backgroundColor: 'var(--paper-2)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Register Athletes</div>
                      <h3 style={{ margin: '0.25rem 0 0 0', color: 'var(--gold)' }}>{activeCategory.label}</h3>
                    </div>
                    <Chip variant="ghost">{activeCategory.gender} • {activeCategory.ageGroup}</Chip>
                  </div>
                </div>

                {/* Tabular Athlete List */}
                <div style={{ overflowY: 'auto', backgroundColor: 'var(--paper)' }}>
                  {getEligibleAthletes(activeCategory).length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '4rem 0', color: 'var(--muted)', fontSize: '0.875rem' }}>
                      No eligible athletes in Master Roster within a safe weight range.
                    </div>
                  ) : (
                    <table className="tbl" style={{ border: 'none', margin: 0 }}>
                      <thead>
                        <tr>
                          <th style={{ width: '40px', textAlign: 'center' }}></th>
                          <th>Athlete Name</th>
                          <th>Belt & Age</th>
                          <th>Weight</th>
                          <th style={{ textAlign: 'right' }}>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {getEligibleAthletes(activeCategory).map(athlete => {
                          const isAlreadyDrafted = draftedCompetitors.some(c => 
                            c.athleteId === athlete.id && (c.weightClass === activeCategory.label || c.patternFormat === activeCategory.label)
                          )

                          let weightWarning = false
                          if (activeCategory.type === 'sparring' && !isAlreadyDrafted) {
                            const wBounds = getWeightBounds(activeCategory.label)
                            if (athlete.weightKg > wBounds.max || athlete.weightKg < wBounds.min) weightWarning = true
                          }

                          return (
                            <tr key={athlete.id} style={{ 
                              opacity: isAlreadyDrafted ? 0.5 : 1, 
                              backgroundColor: selectedAthleteIds.includes(athlete.id) ? 'rgba(212, 175, 55, 0.05)' : 'transparent',
                              cursor: isAlreadyDrafted ? 'default' : 'pointer'
                            }} onClick={() => !isAlreadyDrafted && toggleAthleteSelection(athlete.id)}>
                              
                              <td style={{ textAlign: 'center' }}>
                                <input 
                                  type="checkbox" 
                                  disabled={isAlreadyDrafted}
                                  checked={selectedAthleteIds.includes(athlete.id)}
                                  onChange={() => !isAlreadyDrafted && toggleAthleteSelection(athlete.id)}
                                  style={{ transform: 'scale(1.2)', accentColor: 'var(--gold)', pointerEvents: 'none' }}
                                />
                              </td>
                              <td className="name" style={{ fontWeight: 500 }}>{athlete.fullName}</td>
                              <td style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>
                                {athlete.beltGrade}<br/>{calculateAge(athlete.dob)} yrs
                              </td>
                              <td className="mono">
                                {athlete.weightKg} kg
                                {weightWarning && (
                                  <div style={{ display: 'block', fontSize: '0.65rem', color: '#ffb347', marginTop: '4px' }}>⚠ Must make weight</div>
                                )}
                              </td>
                              <td style={{ textAlign: 'right' }}>
                                {isAlreadyDrafted ? <Stamp variant="ok">Registered</Stamp> : <Stamp variant="ghost">Available</Stamp>}
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  )}
                </div>

                {/* Modal Footer */}
                <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid var(--line)', backgroundColor: 'var(--paper-2)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontSize: '0.875rem', color: 'var(--muted)' }}>
                    Selected: <strong style={{ color: 'var(--ink)' }}>{selectedAthleteIds.length}</strong>
                  </div>
                  <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <Btn variant="ghost" onClick={() => setActiveCategory(null)}>Cancel</Btn>
                    <Btn variant="primary" onClick={handleRegisterAthletes} disabled={selectedAthleteIds.length === 0 || isSubmitting}>
                      {isSubmitting ? 'Registering...' : `Register ${selectedAthleteIds.length} Athletes`}
                    </Btn>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* --- SUCCESS MODAL --- */}
          {successData && (
            <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(10, 10, 10, 0.9)', zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
              <div className="box" style={{ width: '100%', maxWidth: '420px', display: 'flex', flexDirection: 'column', padding: '2.5rem 2rem', textAlign: 'center', border: '1px solid var(--gold)', animation: 'fadeIn 0.2s' }}>
                
                <div style={{ width: '56px', height: '56px', borderRadius: '50%', backgroundColor: 'rgba(212, 175, 55, 0.1)', color: 'var(--gold)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem auto', fontSize: '1.75rem' }}>
                  ✓
                </div>
                
                <h3 style={{ margin: '0 0 0.75rem 0', color: 'var(--gold)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Registration Successful
                </h3>
                
                <p style={{ color: 'var(--muted)', fontSize: '0.875rem', marginBottom: '2.5rem', lineHeight: 1.5 }}>
                  You have successfully registered <strong style={{ color: 'var(--ink)' }}>{successData.count}</strong> athlete{successData.count > 1 ? 's' : ''} for <br/>
                  <strong style={{ color: 'var(--ink)' }}>{successData.category}</strong>.
                </p>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <Btn variant="primary" onClick={() => navigate(`/events/${id}`)}>
                    Return to Dashboard
                  </Btn>
                  <Btn variant="ghost" onClick={() => setSuccessData(null)}>
                    Register Another Category
                  </Btn>
                </div>
                
              </div>
            </div>
          )}

        </main>
      </div>
    </div>
  )
}