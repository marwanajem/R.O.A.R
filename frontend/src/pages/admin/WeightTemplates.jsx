import React, { useState, useEffect } from 'react'
import TopBar from '../../components/ui/TopBar'
import SideNav from '../../components/ui/SideNav'
import PageHead from '../../components/ui/PageHead'
import Btn from '../../components/ui/Btn'
import Chip from '../../components/ui/Chip'
import Stamp from '../../components/ui/Stamp'
import { ITF_WEIGHT_CLASSES, WT_WEIGHT_CLASSES } from '../../data/weightTemplates'
import { adminTopNavSections } from '../../utils/navSections'

// Added `format` to the blank class template
function blankClass(ruleset, format, id) {
  return { id, ruleset, format, ageGroup: '', gender: 'M', label: '', min: 0, max: 0, defaultMin: 0, defaultMax: 0 }
}

function TemplateEditor({ ruleset, activeFormat, fallbackClasses }) {
  const [classes, setClasses] = useState([])
  const [loading, setLoading] = useState(true)
  const [filterAge, setFilterAge] = useState('')
  const [filterGender, setFilterGender] = useState('')
  const [saved, setSaved] = useState(false)
  const [nextId, setNextId] = useState(1)
  
  const [editingId, setEditingId] = useState(null)

  useEffect(() => {
    async function fetchTemplates() {
      try {
        const res = await fetch(`/api/weight-templates/${ruleset}`)
        if (res.ok) {
          const data = await res.json()
          if (data.length > 0) {
            setClasses(data.map(d => ({...d, min: Number(d.min), max: Number(d.max)})))
            setNextId(data.length + 1)
          } else {
            // Apply a default format of 'Individual' to the fallback imports if they lack one
            const formattedFallback = fallbackClasses.map(fc => ({ ...fc, format: fc.format || 'Individual' }))
            setClasses(formattedFallback)
            setNextId(formattedFallback.length + 1)
          }
        }
      } catch(e) {
        console.error("Failed to load templates", e)
      } finally {
        setLoading(false)
      }
    }
    fetchTemplates()
  }, [ruleset, fallbackClasses])

  // 1. First, isolate the classes that belong to the currently active Format (Indi/Pair/Team)
  const formatClasses = classes.filter(c => (c.format || 'Individual') === activeFormat)

  // 2. Generate age groups based ONLY on the current format
  const ageGroups = [...new Set(formatClasses.map((wc) => wc.ageGroup))]

  // 3. Apply the user's Age/Gender filters
  const filtered = formatClasses.filter((wc) => {
    const matchAge = !filterAge || wc.ageGroup === filterAge
    const matchGender = !filterGender || wc.gender === filterGender
    return matchAge && matchGender
  })

  function updateClass(id, field, value) {
    setClasses((prev) =>
      prev.map((wc) => (wc.id === id ? { ...wc, [field]: field === 'min' || field === 'max' ? parseFloat(value) || 0 : value } : wc))
    )
  }

  function addClass() {
    const id = `${ruleset.toLowerCase()}-${activeFormat.toLowerCase()}-new-${nextId}`
    setNextId((n) => n + 1)
    
    // Inject the activeFormat when generating a new row
    const newRow = blankClass(ruleset, activeFormat, id)
    
    if (filterAge) newRow.ageGroup = filterAge
    if (filterGender) newRow.gender = filterGender
    
    setClasses((prev) => [newRow, ...prev])
    setEditingId(id) 
  }

  function removeClass(id) {
    setClasses((prev) => prev.filter((wc) => wc.id !== id))
    if (editingId === id) setEditingId(null)
  }

  async function handleSave() {
    setEditingId(null) 
    try {
      // Saves the master list (containing all formats for this ruleset)
      const response = await fetch(`/api/weight-templates/${ruleset}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ classes })
      })
      if (response.ok) {
        setSaved(true)
        setTimeout(() => setSaved(false), 3000)
      }
    } catch(e) {
      console.error('Network error saving templates:', e)
    }
  }

  if (loading) {
    return <div style={{ padding: '2rem', color: 'var(--muted)' }}>Loading templates...</div>
  }

  const accentColor = ruleset === 'WT' ? '#3b82f6' : 'var(--gold, #d4af37)'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      
      <div className="box" style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', padding: '0.75rem 1rem', alignItems: 'center' }}>
        <select className="field-input field-select" value={filterAge} onChange={(e) => setFilterAge(e.target.value)} style={{ width: '150px' }}>
          <option value="">All Age Groups</option>
          {ageGroups.map((ag) => (
            <option key={ag} value={ag}>{ag}</option>
          ))}
        </select>
        <select className="field-input field-select" value={filterGender} onChange={(e) => setFilterGender(e.target.value)} style={{ width: '130px' }}>
          <option value="">All Genders</option>
          <option value="M">Male</option>
          <option value="F">Female</option>
        </select>
        <span style={{ marginLeft: 'auto', fontSize: '0.75rem', color: 'var(--muted)', fontFamily: 'JetBrains Mono, monospace' }}>
          {filtered.length} classes shown
        </span>
        {saved && <Stamp variant="ok">Saved</Stamp>}
        <Btn variant="ghost" size="sm" type="button" onClick={addClass}>+ Add Row</Btn>
        <Btn variant="primary" size="sm" type="button" onClick={handleSave}>Save {activeFormat} Template</Btn>
      </div>

      <div className="box" style={{ padding: 0, overflow: 'hidden' }}>
        <table className="tbl">
          <thead>
            <tr>
              <th>Age Group</th>
              <th>G</th>
              <th>Label</th>
              <th>Min (kg)</th>
              <th>Max (kg)</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((wc) => {
              const isEditing = editingId === wc.id;
              
              const rowStyle = isEditing 
                ? { backgroundColor: 'var(--paper-3)', boxShadow: `inset 3px 0 0 0 ${accentColor}` } 
                : { opacity: 0.85 }

              const inputStyle = {
                fontFamily: 'JetBrains Mono, monospace', 
                fontSize: '0.75rem', 
                padding: '0.3rem 0.5rem',
                backgroundColor: isEditing ? undefined : 'transparent',
                borderColor: isEditing ? undefined : 'transparent',
                color: isEditing ? 'var(--ink)' : 'var(--muted)'
              }

              return (
                <tr key={wc.id} style={rowStyle}>
                  <td>
                    <input
                      type="text"
                      className="field-input"
                      value={wc.ageGroup}
                      disabled={!isEditing}
                      onChange={(e) => updateClass(wc.id, 'ageGroup', e.target.value)}
                      style={{ ...inputStyle, width: '90px' }}
                    />
                  </td>
                  <td>
                    <select
                      className="field-input field-select"
                      value={wc.gender}
                      disabled={!isEditing}
                      onChange={(e) => updateClass(wc.id, 'gender', e.target.value)}
                      style={{ ...inputStyle, width: '60px', padding: isEditing ? '0.3rem 1.5rem 0.3rem 0.5rem' : '0.3rem' }}
                    >
                      <option value="M">M</option>
                      <option value="F">F</option>
                      <option value="Mixed">Mixed</option>
                    </select>
                  </td>
                  <td>
                    <input
                      type="text"
                      className="field-input"
                      value={wc.label}
                      disabled={!isEditing}
                      onChange={(e) => updateClass(wc.id, 'label', e.target.value)}
                      style={{ ...inputStyle, width: '180px' }}
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      className="field-input"
                      value={wc.min === 0 ? '' : wc.min}
                      disabled={!isEditing}
                      onChange={(e) => updateClass(wc.id, 'min', e.target.value)}
                      placeholder="0"
                      style={{ ...inputStyle, width: '70px' }}
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      className="field-input"
                      value={wc.max >= 999 ? '' : wc.max}
                      disabled={!isEditing}
                      onChange={(e) => updateClass(wc.id, 'max', e.target.value)}
                      placeholder="open"
                      style={{ ...inputStyle, width: '70px' }}
                    />
                  </td>
                  <td style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    {isEditing ? (
                      <Btn variant="primary" size="sm" type="button" onClick={() => setEditingId(null)}>Done</Btn>
                    ) : (
                      <Btn variant="ghost" size="sm" type="button" onClick={() => setEditingId(wc.id)}>Edit</Btn>
                    )}
                    <Btn variant="stamp" size="sm" type="button" onClick={() => removeClass(wc.id)}>Remove</Btn>
                  </td>
                </tr>
              )
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: '3rem', color: 'var(--muted)', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.75rem' }}>
                  No {activeFormat.toLowerCase()} classes match the filters. <br/><br/>
                  <Btn variant="ghost" size="sm" type="button" onClick={addClass}>+ Create First {activeFormat} Row</Btn>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default function WeightTemplates() {
  const [activeTab, setActiveTab] = useState('ITF')
  const [activeFormat, setActiveFormat] = useState('Individual')

  // Available formats based on Ruleset for Weight Classes (Sparring/Kyorugi)
  const itfFormats = ['Individual', 'Team']
  const wtFormats = ['Individual', 'Team']
  
  const currentFormats = activeTab === 'ITF' ? itfFormats : wtFormats

  // Auto-switch format if the user toggles rulesets and the current format isn't supported (e.g., Pair in ITF)
 useEffect(() => {
    // Currently, both are ['Individual', 'Team'], so this is just a safeguard
    if (activeFormat === 'Pair') {
      setActiveFormat('Individual')
    }
  }, [activeTab, activeFormat])
  return (
    <div className="wf">
      <TopBar breadcrumbs={[{ label: 'Admin', to: '/admin' }, { label: 'Weight Templates' }]} />
      <div className="wf-body">
        <SideNav sections={adminTopNavSections()} />
        <main className="wf-main">
          <PageHead
            title="Weight Class Templates"
            sub="Global defaults for ITF and WT rulesets — applied when creating a new event"
          />

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.25rem' }}>
            
            {/* Primary Toggle: Ruleset */}
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              {['ITF', 'WT'].map((rs) => {
                const isActive = activeTab === rs;
                const activeColor = rs === 'WT' ? '#3b82f6' : 'var(--gold, #d4af37)';
                const activeBg = rs === 'WT' ? 'rgba(59, 130, 246, 0.15)' : 'var(--gold-deep, rgba(212, 175, 55, 0.15))';
                
                return (
                  <button
                    key={rs}
                    type="button"
                    onClick={() => setActiveTab(rs)}
                    style={{
                      cursor: 'pointer',
                      padding: '0.45rem 1.25rem',
                      fontFamily: 'Saira Condensed, sans-serif',
                      fontSize: '1rem',
                      fontWeight: 700,
                      letterSpacing: '0.06em',
                      borderRadius: '4px',
                      transition: 'all 0.15s',
                      border: isActive ? `.5px solid ${activeColor}` : '.5px solid var(--line)',
                      backgroundColor: isActive ? activeBg : 'transparent',
                      color: isActive ? activeColor : 'var(--muted)'
                    }}
                  >
                    {rs}
                  </button>
                )
              })}
              <Chip variant="default" style={{ alignSelf: 'center', marginLeft: '0.5rem' }}>
                {activeTab === 'ITF' ? 'International Taekwon-Do Federation' : 'World Taekwondo'}
              </Chip>
            </div>

           {/* Secondary Toggle: Format (Indi / Pair / Team) */}
            <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid var(--line)', paddingBottom: '0.5rem' }}>
              {currentFormats.map(fmt => {
                 const isActiveFmt = activeFormat === fmt;
                 const activeColor = activeTab === 'WT' ? '#3b82f6' : 'var(--gold, #d4af37)';
                 const activeBg = activeTab === 'WT' ? 'rgba(59, 130, 246, 0.15)' : 'var(--gold-deep, rgba(212, 175, 55, 0.15))';

                 return (
                   <button
                     key={fmt}
                     type="button"
                     onClick={() => setActiveFormat(fmt)}
                     style={{
                       cursor: 'pointer',
                       padding: '0.35rem 1rem',
                       fontSize: '0.75rem',
                       fontWeight: 600,
                       textTransform: 'uppercase',
                       letterSpacing: '0.05em',
                       borderRadius: '4px', // Matched to the main toggle
                       border: isActiveFmt ? `1px solid ${activeColor}` : '1px solid transparent',
                       backgroundColor: isActiveFmt ? activeBg : 'transparent',
                       color: isActiveFmt ? activeColor : 'var(--muted)',
                       transition: 'all 0.15s'
                     }}
                   >
                     {fmt}
                   </button>
                 )
              })}
            </div>

          </div>

          {activeTab === 'ITF' && <TemplateEditor key="ITF" ruleset="ITF" activeFormat={activeFormat} fallbackClasses={ITF_WEIGHT_CLASSES} />}
          {activeTab === 'WT' && <TemplateEditor key="WT" ruleset="WT" activeFormat={activeFormat} fallbackClasses={WT_WEIGHT_CLASSES} />}
        </main>
      </div>
    </div>
  )
}