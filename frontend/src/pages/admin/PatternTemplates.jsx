import React, { useState, useEffect } from 'react'
import TopBar from '../../components/ui/TopBar'
import SideNav from '../../components/ui/SideNav'
import PageHead from '../../components/ui/PageHead'
import Btn from '../../components/ui/Btn'
import Chip from '../../components/ui/Chip'
import Stamp from '../../components/ui/Stamp'
import { ITF_PATTERN_CLASSES, WT_PATTERN_CLASSES } from '../../data/patternTemplates'
import { adminTopNavSections } from '../../utils/navSections'

function blankPatternClass(ruleset, id) {
  return { id, ruleset, ageGroup: '', gender: 'M', beltGroup: 'Black Belt', label: '', requiredPattern: '' }
}

function PatternEditor({ ruleset, fallbackClasses }) {
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
        const res = await fetch(`/api/pattern-templates/${ruleset}`)
        if (res.ok) {
          const data = await res.json()
          if (data.length > 0) {
            setClasses(data)
            setNextId(data.length + 1)
          } else {
            setClasses(fallbackClasses)
            setNextId(fallbackClasses.length + 1)
          }
        }
      } catch(e) {
        console.error("Failed to load pattern templates", e)
      } finally {
        setLoading(false)
      }
    }
    fetchTemplates()
  }, [ruleset, fallbackClasses])

  const ageGroups = [...new Set(classes.map((wc) => wc.ageGroup))]

  const filtered = classes.filter((wc) => {
    const matchAge = !filterAge || wc.ageGroup === filterAge
    const matchGender = !filterGender || wc.gender === filterGender
    return matchAge && matchGender
  })

  function updateClass(id, field, value) {
    setClasses((prev) =>
      prev.map((wc) => (wc.id === id ? { ...wc, [field]: value } : wc))
    )
  }

  function addClass() {
    const id = `${ruleset.toLowerCase()}-pat-new-${nextId}`
    setNextId((n) => n + 1)
    
    const newRow = blankPatternClass(ruleset, id)
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
      const response = await fetch(`/api/pattern-templates/${ruleset}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ classes })
      })
      if (response.ok) {
        setSaved(true)
        setTimeout(() => setSaved(false), 3000)
      }
    } catch(e) {
      console.error('Network error saving pattern templates:', e)
    }
  }

  if (loading) {
    return <div style={{ padding: '2rem', color: 'var(--muted)' }}>Loading pattern templates...</div>
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
        <Btn variant="primary" size="sm" type="button" onClick={handleSave}>Save Template</Btn>
      </div>

      <div className="box" style={{ padding: 0, overflow: 'hidden' }}>
        <table className="tbl">
          <thead>
            <tr>
              <th>Age Group</th>
              <th>G</th>
              <th>Belt Div</th>
              <th>Category Label</th>
              <th>Required Pattern / Poomsae</th>
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
                      style={{ ...inputStyle, width: '110px' }}
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
                    </select>
                  </td>
                  <td>
                    <input
                      type="text"
                      className="field-input"
                      value={wc.beltGroup}
                      disabled={!isEditing}
                      onChange={(e) => updateClass(wc.id, 'beltGroup', e.target.value)}
                      style={{ ...inputStyle, width: '110px' }}
                    />
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
                      type="text"
                      className="field-input"
                      value={wc.requiredPattern || ''}
                      disabled={!isEditing}
                      onChange={(e) => updateClass(wc.id, 'requiredPattern', e.target.value)}
                      placeholder="e.g. Chon-Ji"
                      style={{ ...inputStyle, width: '160px' }}
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
                <td colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: 'var(--muted)', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.75rem' }}>
                  No pattern divisions match the filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default function PatternTemplates() {
  const [activeTab, setActiveTab] = useState('ITF')

  return (
    <div className="wf">
      <TopBar breadcrumbs={[{ label: 'Admin', to: '/admin' }, { label: 'Pattern Templates' }]} />
      <div className="wf-body">
        <SideNav sections={adminTopNavSections()} />
        <main className="wf-main">
          <PageHead
            title="Pattern / Poomsae Class Templates"
            sub="Global defaults for forms and patterns — applied when setting up championships"
          />

          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem' }}>
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
                    border: isActive ? `1px solid ${activeColor}` : '1px solid var(--line)',
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

          {activeTab === 'ITF' && <PatternEditor key="ITF" ruleset="ITF" fallbackClasses={ITF_PATTERN_CLASSES} />}
          {activeTab === 'WT' && <PatternEditor key="WT" ruleset="WT" fallbackClasses={WT_PATTERN_CLASSES} />}
        </main>
      </div>
    </div>
  )
}