import React, { useState } from 'react'
import TopBar from '../../components/ui/TopBar'
import SideNav from '../../components/ui/SideNav'
import PageHead from '../../components/ui/PageHead'
import Btn from '../../components/ui/Btn'
import Chip from '../../components/ui/Chip'
import Stamp from '../../components/ui/Stamp'
import { ITF_WEIGHT_CLASSES, WT_WEIGHT_CLASSES } from '../../data/weightTemplates'
import { adminTopNavSections } from '../../utils/navSections'

// BACKEND: on Save, replace console.info with PATCH /api/weight-templates/:ruleset
// Body: full classes array. These are global defaults, not per-event.

function blankClass(ruleset, id) {
  return { id, ruleset, ageGroup: '', gender: 'M', label: '', min: 0, max: 0, defaultMin: 0, defaultMax: 0 }
}

function TemplateEditor({ ruleset, initialClasses }) {
  const [classes, setClasses] = useState(initialClasses)
  const [filterAge, setFilterAge] = useState('')
  const [filterGender, setFilterGender] = useState('')
  const [saved, setSaved] = useState(false)
  const [nextId, setNextId] = useState(initialClasses.length + 1)

  const ageGroups = [...new Set(initialClasses.map((wc) => wc.ageGroup))]

  const filtered = classes.filter((wc) => {
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
    const id = `${ruleset.toLowerCase()}-new-${nextId}`
    setNextId((n) => n + 1)
    setClasses((prev) => [...prev, blankClass(ruleset, id)])
  }

  function removeClass(id) {
    setClasses((prev) => prev.filter((wc) => wc.id !== id))
  }

  function handleSave() {
    console.info(`Weight template saved (ready for API) [${ruleset}]:`, classes)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {/* Filter + actions bar */}
      <div className="box" style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', padding: '0.75rem 1rem', alignItems: 'center' }}>
        <select
          className="field-input field-select"
          value={filterAge}
          onChange={(e) => setFilterAge(e.target.value)}
          style={{ width: '150px' }}
          aria-label="Filter by age group"
        >
          <option value="">All Age Groups</option>
          {ageGroups.map((ag) => (
            <option key={ag} value={ag}>{ag}</option>
          ))}
        </select>
        <select
          className="field-input field-select"
          value={filterGender}
          onChange={(e) => setFilterGender(e.target.value)}
          style={{ width: '130px' }}
          aria-label="Filter by gender"
        >
          <option value="">All Genders</option>
          <option value="M">Male</option>
          <option value="F">Female</option>
        </select>
        <span style={{ marginLeft: 'auto', fontSize: '0.75rem', color: 'var(--muted)', fontFamily: 'JetBrains Mono, monospace', alignSelf: 'center' }}>
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
              <th>Label</th>
              <th>Min (kg)</th>
              <th>Max (kg)</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((wc) => (
              <tr key={wc.id}>
                <td>
                  <input
                    type="text"
                    className="field-input"
                    value={wc.ageGroup}
                    onChange={(e) => updateClass(wc.id, 'ageGroup', e.target.value)}
                    style={{ width: '80px', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.75rem', padding: '0.3rem 0.5rem' }}
                    aria-label="Age group"
                  />
                </td>
                <td>
                  <select
                    className="field-input field-select"
                    value={wc.gender}
                    onChange={(e) => updateClass(wc.id, 'gender', e.target.value)}
                    style={{ width: '70px', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.75rem', padding: '0.3rem 0.5rem' }}
                    aria-label="Gender"
                  >
                    <option value="M">M</option>
                    <option value="F">F</option>
                  </select>
                </td>
                <td>
                  <input
                    type="text"
                    className="field-input"
                    value={wc.label}
                    onChange={(e) => updateClass(wc.id, 'label', e.target.value)}
                    style={{ width: '180px', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.75rem', padding: '0.3rem 0.5rem' }}
                    aria-label="Label"
                  />
                </td>
                <td>
                  <input
                    type="number"
                    className="field-input"
                    value={wc.min === 0 ? '' : wc.min}
                    onChange={(e) => updateClass(wc.id, 'min', e.target.value)}
                    placeholder="0"
                    style={{ width: '80px', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.75rem', padding: '0.3rem 0.5rem' }}
                    aria-label="Min kg"
                  />
                </td>
                <td>
                  <input
                    type="number"
                    className="field-input"
                    value={wc.max >= 999 ? '' : wc.max}
                    onChange={(e) => updateClass(wc.id, 'max', e.target.value)}
                    placeholder="open"
                    style={{ width: '80px', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.75rem', padding: '0.3rem 0.5rem' }}
                    aria-label="Max kg"
                  />
                </td>
                <td>
                  <Btn variant="stamp" size="sm" type="button" onClick={() => removeClass(wc.id)}>
                    Remove
                  </Btn>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: 'var(--muted)', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.75rem' }}>
                  No weight classes match the filters.
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

  return (
    <div className="wf">
      <TopBar
        breadcrumbs={[
          { label: 'Admin', to: '/admin' },
          { label: 'Weight Templates' },
        ]}
      />
      <div className="wf-body">
        <SideNav sections={adminTopNavSections()} />
        <main className="wf-main">
          <PageHead
            title="Weight Class Templates"
            sub="Global defaults for ITF and WT rulesets — applied when creating a new event"
          />

          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem' }}>
            {['ITF', 'WT'].map((rs) => (
              <button
                key={rs}
                type="button"
                onClick={() => setActiveTab(rs)}
                className={`chip ${activeTab === rs ? 'chip-gold' : 'chip-ghost'}`}
                style={{
                  cursor: 'pointer',
                  padding: '0.45rem 1.25rem',
                  fontFamily: 'Saira Condensed, sans-serif',
                  fontSize: '1rem',
                  fontWeight: 700,
                  letterSpacing: '0.06em',
                  border: activeTab === rs ? undefined : '1px solid var(--line)',
                }}
              >
                {rs}
              </button>
            ))}
            <Chip variant="default" style={{ alignSelf: 'center', marginLeft: '0.5rem' }}>
              {activeTab === 'ITF' ? 'International Taekwon-Do Federation' : 'World Taekwondo'}
            </Chip>
          </div>

          {activeTab === 'ITF' && (
            <TemplateEditor key="ITF" ruleset="ITF" initialClasses={ITF_WEIGHT_CLASSES} />
          )}
          {activeTab === 'WT' && (
            <TemplateEditor key="WT" ruleset="WT" initialClasses={WT_WEIGHT_CLASSES} />
          )}
        </main>
      </div>
    </div>
  )
}
