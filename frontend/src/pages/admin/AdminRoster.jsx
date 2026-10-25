import React, { useState, useEffect, useMemo } from 'react'
import { useParams } from 'react-router-dom'
import TopBar from '../../components/ui/TopBar'
import ScopeBar from '../../components/ui/ScopeBar'
import SideNav from '../../components/ui/SideNav'
import PageHead from '../../components/ui/PageHead'
import Chip from '../../components/ui/Chip'
import Stamp from '../../components/ui/Stamp'
import Btn from '../../components/ui/Btn'
import { adminNavSections } from '../../utils/navSections'
import { exportCsv } from '../../utils/exportCsv'
import { ITF_WEIGHT_CLASSES, WT_WEIGHT_CLASSES } from '../../data/weightTemplates'

// Added isSparring and isPattern 
const EXPORT_COLUMNS = [
  { key: 'id',          header: 'ID' },
  { key: 'fullName',    header: 'Full Name' },
  { key: 'clubCode',    header: 'Club Code' },
  { key: 'icMasked',    header: 'IC (Masked)' },
  { key: 'dob',         header: 'Date of Birth' },
  { key: 'gender',      header: 'Gender' },
  { key: 'beltGrade',   header: 'Belt Grade' },
  { key: 'ageCategory', header: 'Age Category' },
  { key: 'beltGroup',   header: 'Belt Group' },
  { key: 'weightKg',    header: 'Weight (kg)' },
  { key: 'weightClass', header: 'Weight Class' },
  { key: 'patternFormat', header: 'Pattern Format' },
  { key: 'isSparring',  header: 'Sparring (Y/N)' },
  { key: 'isPattern',   header: 'Pattern (Y/N)' },
  { key: 'status',      header: 'Status' },
]

export default function AdminRoster() {
  const { id } = useParams()
  
  const [event, setEvent] = useState(null)
  const [all, setAll] = useState([])
  const [loading, setLoading] = useState(true)

  const [search, setSearch] = useState('')
  const [filterClub, setFilterClub] = useState('')
  const [filterGender, setFilterGender] = useState('')
  const [filterAge, setFilterAge] = useState('')
  const [filterBelt, setFilterBelt] = useState('')
  const [sortConfig, setSortConfig] = useState({ key: 'fullName', direction: 'asc' })

  const [editingFighter, setEditingFighter] = useState(null)
  const [isSaving, setIsSaving] = useState(false)
  const [editForm, setEditForm] = useState({
    weightClass: '', ageCategory: '', beltGroup: '', weightKg: '', status: '', patternFormat: '', isSparring: true, isPattern: true
  })

  useEffect(() => {
    const fetchData = async () => {
      try {
        const dbEventId = parseInt(id.replace(/[^\d]/g, ''), 10) || id; 
        const [eventRes, rosterRes] = await Promise.all([
          fetch(`/api/events/${dbEventId}`),
          fetch(`/api/events/${dbEventId}/competitors`)
        ])
        if (eventRes.ok) setEvent(await eventRes.json())
        if (rosterRes.ok) setAll(await rosterRes.json())
      } catch (error) {
        console.error('Failed to fetch data:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [id])

  const clubs = [...new Set(all.map((c) => c.clubCode))].sort()
  const filtered = all.filter((c) => {
    const q = search.toLowerCase()
    const matchSearch = !q || c.fullName.toLowerCase().includes(q) || c.icMasked.includes(q) || c.clubCode.toLowerCase().includes(q)
    return matchSearch && (!filterClub || c.clubCode === filterClub) && (!filterGender || c.gender === filterGender) && (!filterAge || c.ageCategory === filterAge) && (!filterBelt || c.beltGroup === filterBelt)
  })

  const sortedAndFiltered = useMemo(() => {
    let sortableItems = [...filtered]
    if (sortConfig) {
      sortableItems.sort((a, b) => {
        let aVal = a[sortConfig.key] || ''
        let bVal = b[sortConfig.key] || ''
        if (sortConfig.key === 'weightKg') {
          aVal = parseFloat(aVal) || 0
          bVal = parseFloat(bVal) || 0
        }
        if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1
        if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1
        return 0
      })
    }
    return sortableItems
  }, [filtered, sortConfig])

  const requestSort = (key) => {
    let direction = 'asc'
    if (sortConfig?.key === key && sortConfig.direction === 'asc') direction = 'desc'
    setSortConfig({ key, direction })
  }

  
  const openEdit = (fighter) => {
    setEditingFighter(fighter)
    setEditForm({
      weightClass: fighter.weightClass || fighter.weightCategory || '',
      ageCategory: fighter.ageCategory || '',
      beltGroup: fighter.beltGroup || '',
      weightKg: fighter.weightKg || '',
      patternFormat: fighter.patternFormat || '',
      status: fighter.status || 'pending',
      
      isSparring: fighter.isSparring !== undefined ? !!fighter.isSparring : true,
      isPattern: fighter.isPattern !== undefined ? !!fighter.isPattern : true
    })
  }

  const handleFormChange = (field, value) => {
    setEditForm(prev => {
      const next = { ...prev, [field]: value };
      
     
      if ((field === 'weightKg' || field === 'ageCategory') && event && next.isSparring) {
        const weightVal = parseFloat(next.weightKg);
        if (!isNaN(weightVal)) {
          const templates = event.type === 'WT' ? WT_WEIGHT_CLASSES : ITF_WEIGHT_CLASSES;
          const match = templates.find(t => 
            t.gender === editingFighter.gender && 
            t.ageGroup === next.ageCategory &&
            weightVal > (t.min || 0) && 
            weightVal <= (t.max || 999)
          );
          if (match) next.weightClass = match.label;
        }
      }
      
      
      if (field === 'isSparring' && !value) next.weightClass = 'None';
      if (field === 'isPattern' && !value) next.patternFormat = 'None';

      return next;
    });
  }

  const handleSaveEdit = async () => {
    setIsSaving(true)
    try {
      const dbEventId = parseInt(id.replace(/[^\d]/g, ''), 10) || id;
      const res = await fetch(`/api/events/${dbEventId}/competitors/${editingFighter.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...editForm,
          weightCategory: editForm.weightClass 
        })
      })

      if (res.ok) {
        setAll(prev => prev.map(c => c.id === editingFighter.id ? { ...c, ...editForm, weightCategory: editForm.weightClass } : c))
        setEditingFighter(null)
      } else {
        alert('Failed to update fighter')
      }
    } catch (error) {
      console.error(error)
    } finally {
      setIsSaving(false)
    }
  }

  if (loading) return <div className="wf"><TopBar /><div className="wf-main" style={{ padding: '2rem', color: 'var(--muted)' }}>Loading roster...</div></div>

  return (
    <div className="wf">
      <TopBar breadcrumbs={[{ label: 'Admin', to: '/admin' }, { label: event?.shortName || id, to: `/admin/events/${id}` }, { label: 'Competitor Roster' }]} />
      <ScopeBar event={event} switchTo="/admin" isAdmin={true} />
      
      <div className="wf-body">
        <SideNav sections={adminNavSections(id)} />
        <main className="wf-main">
          
          <PageHead
            title="Competitor Roster"
            sub={`${all.length} total entries · ${clubs.length} clubs`}
            right={
              <Btn variant="gold-outline" onClick={() => exportCsv(`roar_roster_${event?.shortName || id}.csv`, EXPORT_COLUMNS, sortedAndFiltered)}>
                Export Final CSV
              </Btn>
            }
          />

          <div className="box" style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '1rem', padding: '0.75rem 1rem', alignItems: 'center' }}>
            <input className="field-input" placeholder="Search name or club…" value={search} onChange={(e) => setSearch(e.target.value)} style={{ flex: '1 1 200px' }} />
            <select className="field-input field-select" value={filterGender} onChange={(e) => setFilterGender(e.target.value)} style={{ width: '130px' }}><option value="">All Genders</option><option value="M">Male</option><option value="F">Female</option></select>
            <select className="field-input field-select" value={filterAge} onChange={(e) => setFilterAge(e.target.value)} style={{ width: '150px' }}><option value="">All Age Groups</option><option value="15-17">15-17</option><option value="18+">18+</option></select>
            <span style={{ marginLeft: 'auto', fontSize: '0.75rem', color: 'var(--muted)', fontFamily: 'JetBrains Mono, monospace' }}>Showing {sortedAndFiltered.length}/{all.length}</span>
          </div>

          <div className="box" style={{ padding: 0, maxHeight: '65vh', overflowY: 'auto', position: 'relative' }}>
            <table className="tbl" style={{ margin: 0 }}>
              <thead style={{ position: 'sticky', top: 0, backgroundColor: '#13110E', zIndex: 10, outline: '1px solid var(--line)' }}>
                <tr>
                  <th onClick={() => requestSort('id')} style={{ cursor: 'pointer' }}>ID</th>
                  <th onClick={() => requestSort('fullName')} style={{ cursor: 'pointer' }}>Name</th>
                  <th onClick={() => requestSort('clubCode')} style={{ cursor: 'pointer' }}>Club</th>
                  <th>Events</th>
                  <th onClick={() => requestSort('ageCategory')} style={{ cursor: 'pointer' }}>Age Cat.</th>
                  <th>Belt Group</th>
                  <th onClick={() => requestSort('weightKg')} style={{ cursor: 'pointer' }}>Wt (kg)</th>
                  <th>Weight Class</th>
                  <th onClick={() => requestSort('status')} style={{ cursor: 'pointer' }}>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {sortedAndFiltered.map((c) => (
                  <tr key={c.id}>
                    <td className="mono" style={{ fontSize: '0.75rem', color: 'var(--muted-2)' }}>{c.id}</td>
                    <td className="name">{c.fullName}</td>
                    <td><Chip variant="default">{c.clubCode}</Chip></td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'flex-start' }}>
                        {c.isSparring ? <Chip variant="ghost">Sparring</Chip> : null}
                        {c.isPattern ? <Chip variant="ghost">Pattern</Chip> : null}
                        {!c.isSparring && !c.isPattern ? <span style={{ fontSize: '0.65rem', color: 'var(--muted)' }}>None</span> : null}
                      </div>
                    </td>
                    <td><Chip variant="default">{c.ageCategory}</Chip></td>
                    <td><Chip variant="gold">{c.beltGroup}</Chip></td>
                    <td className="mono">{c.weightKg || '-'}</td>
                    <td style={{ fontSize: '0.75rem', color: 'var(--ink-2)' }}>{c.weightClass || c.weightCategory || 'N/A'}</td>
                    <td><Stamp variant={c.status === 'confirmed' ? 'ok' : 'gold'}>{c.status}</Stamp></td>
                    <td>
                      <Btn variant="ghost" size="sm" onClick={() => openEdit(c)}>Edit</Btn>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </main>
      </div>

      {/* Admin Edit Modal Overlay */}
      {editingFighter && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div className="box" style={{ width: '100%', maxWidth: '450px', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <h3 style={{ margin: '0 0 0.25rem 0', color: 'var(--ink)' }}>Admin Override</h3>
              <div style={{ fontSize: '0.875rem', color: 'var(--muted)' }}>Editing: <strong style={{ color: 'var(--gold)' }}>{editingFighter.fullName}</strong></div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <label style={{ fontSize: '0.75rem', color: 'var(--ink-2)' }}>Weight (kg)</label>
                <input 
                  type="number" 
                  className="field-input" 
                  value={editForm.weightKg} 
                  onChange={e => handleFormChange('weightKg', e.target.value)} 
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <label style={{ fontSize: '0.75rem', color: 'var(--ink-2)' }}>Weight Class</label>
                <input 
                  type="text" 
                  className="field-input" 
                  value={editForm.weightClass} 
                  onChange={e => handleFormChange('weightClass', e.target.value)} 
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <label style={{ fontSize: '0.75rem', color: 'var(--ink-2)' }}>Age Category</label>
                <input 
                  type="text" 
                  className="field-input" 
                  value={editForm.ageCategory} 
                  onChange={e => handleFormChange('ageCategory', e.target.value)} 
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <label style={{ fontSize: '0.75rem', color: 'var(--ink-2)' }}>Belt Group</label>
                <input 
                  type="text" 
                  className="field-input" 
                  value={editForm.beltGroup} 
                  onChange={e => handleFormChange('beltGroup', e.target.value)} 
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <label style={{ fontSize: '0.75rem', color: 'var(--ink-2)' }}>Pattern Format</label>
                <input 
                  type="text" 
                  className="field-input" 
                  value={editForm.patternFormat} 
                  onChange={e => handleFormChange('patternFormat', e.target.value)} 
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <label style={{ fontSize: '0.75rem', color: 'var(--ink-2)' }}>Status</label>
                <select className="field-input field-select" value={editForm.status} onChange={e => handleFormChange('status', e.target.value)}>
                  <option value="pending">Pending</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="dq">Disqualified (DQ)</option>
                </select>
              </div>
            </div>

            {/* NEW: Event Entrance Toggles */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.25rem' }}>
              <label style={{ fontSize: '0.75rem', color: 'var(--ink-2)' }}>Events Entered</label>
              <div style={{ display: 'flex', gap: '1.5rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', cursor: 'pointer', fontSize: '0.875rem' }}>
                  <input type="checkbox" checked={editForm.isSparring} onChange={e => handleFormChange('isSparring', e.target.checked)} style={{ accentColor: 'var(--gold)' }} />
                  Sparring
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', cursor: 'pointer', fontSize: '0.875rem' }}>
                  <input type="checkbox" checked={editForm.isPattern} onChange={e => handleFormChange('isPattern', e.target.checked)} style={{ accentColor: 'var(--gold)' }} />
                  Pattern
                </label>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
              <Btn variant="ghost" onClick={() => setEditingFighter(null)}>Cancel</Btn>
              <Btn variant="primary" onClick={handleSaveEdit} disabled={isSaving}>
                {isSaving ? 'Saving...' : 'Save Overrides'}
              </Btn>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}