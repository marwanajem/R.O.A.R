import React, { useState } from 'react'
import { useParams } from 'react-router-dom'
import TopBar from '../../components/ui/TopBar'
import ScopeBar from '../../components/ui/ScopeBar'
import SideNav from '../../components/ui/SideNav'
import PageHead from '../../components/ui/PageHead'
import Btn from '../../components/ui/Btn'
import Chip from '../../components/ui/Chip'
import Stamp from '../../components/ui/Stamp'
import { getEvent } from '../../data/events'
import { adminNavSections } from '../../utils/navSections'
import { ITF_WEIGHT_CLASSES, WT_WEIGHT_CLASSES } from '../../data/weightTemplates'

// BACKEND: on Save, replace console.info with PATCH /api/events/:id/categories
// Send the full `classes` array; backend validates ±5 kg tolerance before saving.
// Note: the ±5 kg rule is a business rule — enforce it server-side too, not just here.

export default function CategoryOverride() {
  const { id } = useParams()
  const event = getEvent(id)

  const templateClasses = event?.ruleset === 'WT' ? WT_WEIGHT_CLASSES : ITF_WEIGHT_CLASSES

  const [classes, setClasses] = useState(() =>
    templateClasses.map((wc) => ({ ...wc, enabled: true, overrideMin: wc.min, overrideMax: wc.max }))
  )

  const [filterAge, setFilterAge] = useState('')
  const [filterGender, setFilterGender] = useState('')
  const [saved, setSaved] = useState(false)

  const filtered = classes.filter((wc) => {
    const matchAge = !filterAge || wc.ageGroup === filterAge
    const matchGender = !filterGender || wc.gender === filterGender
    return matchAge && matchGender
  })

  function toggleClass(wcId) {
    setClasses((prev) =>
      prev.map((wc) => (wc.id === wcId ? { ...wc, enabled: !wc.enabled } : wc))
    )
  }

  function setOverride(wcId, field, value) {
    setClasses((prev) =>
      prev.map((wc) =>
        wc.id === wcId ? { ...wc, [field]: parseFloat(value) || 0 } : wc
      )
    )
  }

  function resetClass(wcId) {
    setClasses((prev) =>
      prev.map((wc) =>
        wc.id === wcId
          ? { ...wc, overrideMin: wc.defaultMin, overrideMax: wc.defaultMax }
          : wc
      )
    )
  }

  function handleSave() {
    console.info('Category overrides saved (ready for API):', classes)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  return (
    <div className="wf">
      <TopBar
        breadcrumbs={[
          { label: 'Admin', to: '/admin' },
          { label: event?.shortName || id, to: `/admin/events/${id}` },
          { label: 'Category Overrides' },
        ]}
      />
      <ScopeBar event={event} switchTo="/admin" />
      <div className="wf-body">
        <SideNav sections={adminNavSections(id)} />
        <main className="wf-main">
          <PageHead
            title="Category Overrides"
            sub="Enable/disable weight classes and adjust ±5 kg thresholds"
            right={
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                {saved && <Stamp variant="ok">Saved</Stamp>}
                <Btn variant="primary" type="button" onClick={handleSave}>
                  Save Changes
                </Btn>
              </div>
            }
          />

          {/* Filters */}
          <div className="box" style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '1rem', padding: '0.75rem 1rem' }}>
            <select
              className="field-input field-select"
              value={filterAge}
              onChange={(e) => setFilterAge(e.target.value)}
              style={{ width: '150px' }}
              aria-label="Filter by age group"
            >
              <option value="">All Age Groups</option>
              {[...new Set(templateClasses.map((wc) => wc.ageGroup))].map((ag) => (
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
              {filtered.filter((wc) => wc.enabled).length}/{filtered.length} active
            </span>
          </div>

          <div className="box" style={{ padding: 0, overflow: 'hidden' }}>
            <table className="tbl">
              <thead>
                <tr>
                  <th>On</th>
                  <th>Age Group</th>
                  <th>G</th>
                  <th>Weight Class</th>
                  <th>Default Min (kg)</th>
                  <th>Default Max (kg)</th>
                  <th>Override Min (kg)</th>
                  <th>Override Max (kg)</th>
                  <th>Modified</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((wc) => {
                  const isModified = wc.overrideMin !== wc.defaultMin || wc.overrideMax !== wc.defaultMax
                  return (
                    <tr key={wc.id} style={{ opacity: wc.enabled ? 1 : 0.45 }}>
                      <td>
                        <label className="toggle" aria-label={`Toggle ${wc.label}`}>
                          <input
                            type="checkbox"
                            checked={wc.enabled}
                            onChange={() => toggleClass(wc.id)}
                          />
                          <span className="toggle-track" />
                        </label>
                      </td>
                      <td><Chip variant="default">{wc.ageGroup}</Chip></td>
                      <td style={{ color: 'var(--muted)', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.75rem' }}>{wc.gender}</td>
                      <td className="name">{wc.label}</td>
                      <td className="mono">{wc.defaultMin === 0 ? '—' : wc.defaultMin}</td>
                      <td className="mono">{wc.defaultMax >= 999 ? '—' : wc.defaultMax}</td>
                      <td>
                        <input
                          type="number"
                          className="field-input"
                          value={wc.overrideMin === 0 ? '' : wc.overrideMin}
                          onChange={(e) => setOverride(wc.id, 'overrideMin', e.target.value)}
                          disabled={!wc.enabled}
                          placeholder="—"
                          style={{ width: '80px', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.75rem', padding: '0.3rem 0.5rem' }}
                          aria-label={`Override min for ${wc.label}`}
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          className="field-input"
                          value={wc.overrideMax >= 999 ? '' : wc.overrideMax}
                          onChange={(e) => setOverride(wc.id, 'overrideMax', e.target.value)}
                          disabled={!wc.enabled}
                          placeholder="—"
                          style={{ width: '80px', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.75rem', padding: '0.3rem 0.5rem' }}
                          aria-label={`Override max for ${wc.label}`}
                        />
                      </td>
                      <td>
                        {isModified && (
                          <Chip variant="warn">Modified</Chip>
                        )}
                      </td>
                      <td>
                        {isModified && (
                          <Btn variant="ghost" size="sm" onClick={() => resetClass(wc.id)}>
                            Reset
                          </Btn>
                        )}
                      </td>
                    </tr>
                  )
                })}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={10} style={{ textAlign: 'center', padding: '2rem', color: 'var(--muted)', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.75rem' }}>
                      No weight classes match the filters.
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
