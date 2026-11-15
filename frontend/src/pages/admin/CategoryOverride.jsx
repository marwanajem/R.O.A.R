import React, { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import TopBar from '../../components/ui/TopBar'
import ScopeBar from '../../components/ui/ScopeBar'
import SideNav from '../../components/ui/SideNav'
import PageHead from '../../components/ui/PageHead'
import Btn from '../../components/ui/Btn'
import Chip from '../../components/ui/Chip'
import Stamp from '../../components/ui/Stamp'
import { adminNavSections } from '../../utils/navSections'
import { ITF_WEIGHT_CLASSES, WT_WEIGHT_CLASSES } from '../../data/weightTemplates'

// NEW: Import your pattern templates
// Note: If you don't have this file yet, you will need to create it!
// E.g. export const ITF_PATTERN_CLASSES = [{ id: 'itf-pat-m-1', label: 'Male Pattern', gender: 'M', type: 'pattern' }]
import { ITF_PATTERN_CLASSES, WT_POOMSAE_CLASSES } from '../../data/patternTemplates'

export default function CategoryOverride() {
  const { id } = useParams()
  const dbEventId = id ? parseInt(id.replace(/[^\d]/g, ''), 10) || id : null
  
  const [event, setEvent] = useState(null)
  const [loading, setLoading] = useState(true)
  const [classes, setClasses] = useState([])
  
  // NEW: Filter States
  const [filterType, setFilterType] = useState('sparring') // 'sparring' or 'pattern'
  const [filterAge, setFilterAge] = useState('')
  const [filterGender, setFilterGender] = useState('')
  
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    const fetchEventData = async () => {
      try {
        const [eventRes, catRes] = await Promise.all([
          fetch(`/api/events/${dbEventId}`),
          fetch(`/api/events/${dbEventId}/categories`)
        ]);

        if (eventRes.ok) {
          const eventData = await eventRes.json();
          setEvent(eventData);
          
          // 1. Get ALL Base Templates for this Ruleset (Both Sparring and Pattern)
          const weightTemplates = eventData.type === 'WT' ? WT_WEIGHT_CLASSES : ITF_WEIGHT_CLASSES;
          // Ensure they are strictly marked as 'sparring'
          const baseWeights = weightTemplates.map(w => ({ ...w, type: 'sparring' }));
          
          const patternTemplates = eventData.type === 'WT' ? WT_POOMSAE_CLASSES : ITF_PATTERN_CLASSES;
          // Ensure they are strictly marked as 'pattern'
          const basePatterns = patternTemplates.map(p => ({ ...p, type: 'pattern', min: 0, max: 999 })); 
          
          const allTemplates = [...baseWeights, ...basePatterns];
          
          if (catRes.ok) {
            const savedCats = await catRes.json();
            if (savedCats.length > 0) {
              const mergedClasses = allTemplates.map(template => {
                // Find matching saved category by ID and Type to avoid collisions
                const saved = savedCats.find(sc => sc.categoryId === template.id && sc.type === template.type);
                if (saved) {
                  return {
                    ...template,
                    enabled: saved.isEnabled === 1,
                    overrideMin: Number(saved.overrideMin),
                    overrideMax: Number(saved.overrideMax)
                  };
                }
                return { ...template, enabled: true, overrideMin: template.min, overrideMax: template.max };
              });
              setClasses(mergedClasses);
              return;
            }
          }

          setClasses(allTemplates.map((c) => ({ ...c, enabled: true, overrideMin: c.min, overrideMax: c.max })));
        }
      } catch (error) {
        console.error('Failed to fetch event data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    if (dbEventId) {
      fetchEventData();
    }
  }, [dbEventId]);

  if (loading) {
    return (
      <div className="wf">
        <TopBar />
        <div className="wf-main"><p style={{ color: 'var(--muted)', padding: '2rem' }}>Loading category data...</p></div>
      </div>
    )
  }

  if (!event) {
    return (
      <div className="wf">
        <TopBar />
        <div className="wf-main"><p style={{ color: 'var(--muted)', padding: '2rem' }}>Event not found.</p></div>
      </div>
    )
  }

  // Filter based on the selected tab (Sparring vs Pattern), Age, and Gender
  const filtered = classes.filter((c) => {
    const matchType = c.type === filterType;
    const matchAge = !filterAge || c.ageGroup === filterAge
    const matchGender = !filterGender || c.gender === filterGender
    return matchType && matchAge && matchGender
  })

  // Dropdown options based on the CURRENT view type (so ages don't mix)
  const currentViewClasses = classes.filter(c => c.type === filterType);

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
          ? { ...wc, overrideMin: wc.min, overrideMax: wc.max }
          : wc
      )
    )
  }

  async function handleSave() {
    try {
      const response = await fetch(`/api/events/${dbEventId}/categories`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        // NEW: Ensure we send the 'type' flag down to the database so it knows which is which!
        body: JSON.stringify({ classes })
      });

      if (response.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      } else {
        console.error("Failed to save categories");
      }
    } catch (e) { 
      console.error('Network error saving categories:', e);
    }
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
      <ScopeBar event={event} switchTo="/admin" isAdmin={true} />
      <div className="wf-body">
        <SideNav sections={adminNavSections(id, event?.type)} />
        <main className="wf-main">
          <PageHead
            title="Category Overrides"
            sub={`Toggle ${event.type} divisions and adjust weight thresholds. Disabled categories will be hidden from Excel templates.`}
            right={
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                {saved && <Stamp variant="ok">Saved</Stamp>}
                <Btn variant="primary" type="button" onClick={handleSave}>
                  Save Changes
                </Btn>
              </div>
            }
          />

          {/* NEW: Discipline Tab Switcher */}
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--line)', paddingBottom: '0.5rem' }}>
             <button 
                className={`btn btn-sm ${filterType === 'sparring' ? 'btn-primary' : 'btn-ghost'}`} 
                onClick={() => { setFilterType('sparring'); setFilterAge(''); }}
             >
                Sparring (Weights)
             </button>
             <button 
                className={`btn btn-sm ${filterType === 'pattern' ? 'btn-primary' : 'btn-ghost'}`} 
                onClick={() => { setFilterType('pattern'); setFilterAge(''); }}
             >
                Pattern (Poomsae / Tul)
             </button>
          </div>

          <div className="box" style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '1rem', padding: '0.75rem 1rem' }}>
            <select
              className="field-input field-select"
              value={filterAge}
              onChange={(e) => setFilterAge(e.target.value)}
              style={{ width: '150px' }}
              aria-label="Filter by age group"
            >
              <option value="">All Age Groups</option>
              {[...new Set(currentViewClasses.map((wc) => wc.ageGroup))].filter(Boolean).map((ag) => (
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
                  <th>Category Name</th>
                  {filterType === 'sparring' && (
                    <>
                      <th>Def. Min (kg)</th>
                      <th>Def. Max (kg)</th>
                      <th>Override Min (kg)</th>
                      <th>Override Max (kg)</th>
                      <th>Modified</th>
                    </>
                  )}
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((wc) => {
                  const isModified = wc.overrideMin !== wc.min || wc.overrideMax !== wc.max
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
                      <td><Chip variant="default">{wc.ageGroup || 'Open'}</Chip></td>
                      <td style={{ color: 'var(--muted)', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.75rem' }}>{wc.gender}</td>
                      <td className="name">{wc.label}</td>
                      
                      {/* Only show weight logic if we are in the Sparring tab */}
                      {filterType === 'sparring' && (
                        <>
                          <td className="mono">{wc.min === 0 ? '—' : wc.min}</td>
                          <td className="mono">{wc.max >= 999 ? '—' : wc.max}</td>
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
                            {isModified && <Chip variant="warn">Modified</Chip>}
                          </td>
                        </>
                      )}
                      <td>
                        {filterType === 'sparring' && isModified && (
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
                      No {filterType} categories match the filters.
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