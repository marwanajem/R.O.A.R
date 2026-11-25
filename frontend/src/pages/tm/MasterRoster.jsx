import React, { useState, useEffect, useRef } from 'react'
import TopBar from '../../components/ui/TopBar'
import SideNav from '../../components/ui/SideNav'
import PageHead from '../../components/ui/PageHead'
import Btn from '../../components/ui/Btn'
import Chip from '../../components/ui/Chip'
import Stamp from '../../components/ui/Stamp'
import { useAuth } from '../../contexts/AuthContext'
import { tmTopNavSections } from '../../utils/navSections'
import { COUNTRIES, getFlag } from '../../utils/countries'

const BELT_GRADES = [
  '10th Kup (White)', '9th Kup (White-Yellow)', '8th Kup (Yellow)', '7th Kup (Yellow-Green)',
  '6th Kup (Green)', '5th Kup (Green-Blue)', '4th Kup (Blue)', '3rd Kup (Blue-Red)',
  '2nd Kup (Red)', '1st Kup (Red-Black)', '1st Dan (Black)', '2nd Dan (Black)',
  '3rd Dan (Black)', '4th Dan (Black)', '5th Dan (Black)', '6th Dan (Black)'
]
const MIN_AGE = 4

function getBeltStyle(belt) {
  if (!belt) return { bg: 'var(--paper-3)', color: 'var(--ink)' }
  if (belt.includes('White')) return { bg: '#FFFFFF', color: '#000000', border: '1px solid #E0E0E0' }
  if (belt.includes('Yellow')) return { bg: '#FFD700', color: '#000000' }
  if (belt.includes('Green')) return { bg: '#4CAF50', color: '#FFFFFF' }
  if (belt.includes('Blue')) return { bg: '#2196F3', color: '#FFFFFF' }
  if (belt.includes('Red')) return { bg: '#F44336', color: '#FFFFFF' }
  if (belt.includes('Black')) return { bg: '#212121', color: '#FFFFFF' }
  return { bg: 'var(--paper-3)', color: 'var(--ink)' } 
}

function getBeltRankScore(belt) {
  if (!belt) return -1
  const numMatch = belt.match(/\d+/)
  const num = numMatch ? parseInt(numMatch[0], 10) : 0
  if (belt.includes('Dan')) return 100 + num
  if (belt.includes('Kup')) return 10 - num
  return 0
}

function calculateAge(dobStr) {
  if (!dobStr) return '-'
  return new Date().getFullYear() - new Date(dobStr).getFullYear()
}

function maskIC(ic) {
  if (!ic) return '-'
  const clean = ic.replace(/[^\w]/g, '')
  if (clean.length === 12) return `${clean.substring(0, 6)}-**-****`
  if (clean.length > 4) return clean.substring(0, 4) + '*'.repeat(clean.length - 4)
  return ic
}

function StatCard({ label, value, sub }) {
  return (
    <div className="stat-card" style={{ flex: 1, minWidth: '150px' }}>
      <div className="stat-card-label" style={{ fontSize: '0.6875rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--muted-2)' }}>{label}</div>
      <div className="stat-card-value" style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--gold)', margin: '0.25rem 0' }}>{value}</div>
      {sub && <div className="stat-card-sub" style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>{sub}</div>}
    </div>
  )
}

export default function MasterRoster() {
  const { user } = useAuth()
  const [athletes, setAthletes] = useState([])
  const [loading, setLoading] = useState(true)

  const [search, setSearch] = useState('')
  const [filterGender, setFilterGender] = useState('')
  const [filterDisc, setFilterDisc] = useState('')
  const [sortConfig, setSortConfig] = useState({ key: 'fullName', direction: 'asc' })
  
  const [currentPage, setCurrentPage] = useState(1)
  const rowsPerPage = 25

  const [actionQueue, setActionQueue] = useState([])
  const [warningsQueue, setWarningsQueue] = useState([])

  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isUploadOpen, setIsUploadOpen] = useState(false)
  const [uploadError, setUploadError] = useState('')
  
  const [editingId, setEditingId] = useState(null)
  const [activeQueueIndex, setActiveQueueIndex] = useState(null) 
  
  const [formData, setFormData] = useState({
    fullName: '', icNumber: '', dob: '', gender: '', 
    beltGrade: '10th Kup (White)', weightKg: '', 
    isSparring: true, isPattern: false, countryCode: 'MAS'
  })
  
  const fileInputRef = useRef(null)
  const [uploadFile, setUploadFile] = useState(null)
  const [uploading, setUploading] = useState(false)

  useEffect(() => { fetchRoster() }, [user?.clubCode])
  useEffect(() => { setCurrentPage(1) }, [search, filterGender, filterDisc])

  const fetchRoster = async () => {
    if (!user?.clubCode) return
    try {
      setLoading(true)
      const res = await fetch(`/api/athletes/club/${user.clubCode}`)
      if (res.ok) setAthletes(await res.json())
    } catch (error) { console.error('Error fetching roster:', error) } 
    finally { setLoading(false) }
  }

  const handleIcChange = (e) => {
    let val = e.target.value.toUpperCase().replace(/[^\w]/g, '') 
    let formattedVal = val
    if (/^\d+$/.test(val)) {
       if (val.length > 6) formattedVal = val.slice(0, 6) + '-' + val.slice(6)
       if (val.length > 8) formattedVal = formattedVal.slice(0, 9) + '-' + val.slice(8, 12)
    }

    let newDob = formData.dob
    let newGender = formData.gender
    if (formData.countryCode === 'MAS' && /^\d{12}$/.test(val)) {
      const yy = parseInt(val.substring(0, 2), 10)
      const mm = val.substring(2, 4)
      const dd = val.substring(4, 6)
      const currentYearSuffix = new Date().getFullYear() % 100
      const fullYear = yy > currentYearSuffix ? 1900 + yy : 2000 + yy
      newDob = `${fullYear}-${mm}-${dd}`
      newGender = parseInt(val.substring(11, 12), 10) % 2 === 0 ? 'F' : 'M'
    }
    setFormData(prev => ({ ...prev, icNumber: formattedVal, dob: newDob, gender: newGender }))
  }

  const handleFormSubmit = async (e) => {
    e.preventDefault()
    
    if (!formData.isSparring && !formData.isPattern) return alert("Athlete must participate in at least one discipline.")
    if (calculateAge(formData.dob) < MIN_AGE) return alert(`Athlete must be at least ${MIN_AGE} years old to be registered.`)

    const cleanNewIc = formData.icNumber.replace(/[^\w]/g, '').toUpperCase()
    const existingAthlete = athletes.find(a => a.icNumber.replace(/[^\w]/g, '').toUpperCase() === cleanNewIc && a.id !== editingId)
    
    let url = editingId ? `/api/athletes/${editingId}` : `/api/athletes`
    let method = editingId ? 'PUT' : 'POST'

    if (existingAthlete) {
      const confirmUpdate = window.confirm(`An athlete with IC/Passport ${formData.icNumber} (${existingAthlete.fullName}) is already in your Master Roster.\n\nWould you like to overwrite/update their existing profile with these new details?`)
      if (!confirmUpdate) return 
      url = `/api/athletes/${existingAthlete.id}`
      method = 'PUT'
    }

    try {
      const payload = { ...formData, clubCode: user.clubCode }
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      const data = await res.json()
      
      if (!res.ok) return alert(data.error || 'Failed to save athlete.')
      
      if (activeQueueIndex !== null) {
         setActionQueue(prev => prev.filter((_, i) => i !== activeQueueIndex))
         setActiveQueueIndex(null)
      }

      setIsFormOpen(false)
      fetchRoster()
    } catch (error) { alert('Network error while saving athlete.') }
  }

  const handleCancelForm = () => {
    setIsFormOpen(false)
    setActiveQueueIndex(null) 
  }

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete ${name} permanently?`)) return
    try {
      const res = await fetch(`/api/athletes/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      setAthletes(prev => prev.filter(a => a.id !== id))
    } catch (error) { alert('Cannot delete athlete with active event registrations.') }
  }

  const handleUploadSubmit = async (e) => {
    e.preventDefault()
    if (!uploadFile) return

    setUploading(true)
    setUploadError('')
    
    const fd = new FormData()
    fd.append('file', uploadFile)

    try {
      const res = await fetch(`/api/athletes/club/${user.clubCode}/upload`, { method: 'POST', body: fd })
      const data = await res.json()
      
      if (res.ok) {
        setIsUploadOpen(false) 
        setUploadFile(null)
        if (fileInputRef.current) fileInputRef.current.value = ''
        if (data.warnings?.length > 0) setWarningsQueue(data.warnings)
        if (data.failedRows?.length > 0) setActionQueue(data.failedRows)
        fetchRoster()
      } else {
        setUploadError(data.error || 'Failed to process file.')
      }
    } catch (error) { setUploadError('Network error during upload.') } 
    finally { setUploading(false) }
  }

  const handleSort = (key) => {
    let direction = 'asc'
    if (sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc'
    setSortConfig({ key, direction })
  }

  const filteredAthletes = athletes.filter(a => {
    const matchesSearch = a.fullName.toLowerCase().includes(search.toLowerCase()) || a.icNumber.includes(search)
    const matchesGender = filterGender === '' || a.gender === filterGender
    let matchesDisc = true
    if (filterDisc === 'sparring') matchesDisc = a.isSparring === 1
    if (filterDisc === 'pattern') matchesDisc = a.isPattern === 1
    return matchesSearch && matchesGender && matchesDisc
  })

  const sortedAthletes = [...filteredAthletes].sort((a, b) => {
    let aVal = a[sortConfig.key]
    let bVal = b[sortConfig.key]
    if (sortConfig.key === 'beltGrade') {
      aVal = getBeltRankScore(a.beltGrade)
      bVal = getBeltRankScore(b.beltGrade)
    } else if (sortConfig.key === 'age') {
      aVal = calculateAge(a.dob)
      bVal = calculateAge(b.dob)
    } else if (sortConfig.key === 'weightKg') {
      aVal = parseFloat(a.weightKg) || 0
      bVal = parseFloat(b.weightKg) || 0
    }
    if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1
    if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1
    return 0
  })

  const totalPages = Math.max(1, Math.ceil(sortedAthletes.length / rowsPerPage))
  const paginatedAthletes = sortedAthletes.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage)

  const stats = {
    total: athletes.length,
    male: athletes.filter(a => a.gender === 'M').length,
    female: athletes.filter(a => a.gender === 'F').length,
    blackBelts: athletes.filter(a => a.beltGrade.includes('Dan')).length,
    sparring: athletes.filter(a => a.isSparring === 1).length,
    pattern: athletes.filter(a => a.isPattern === 1).length,
  }

  const SortIcon = ({ col }) => {
    if (sortConfig.key !== col) return <span style={{ opacity: 0.3, marginLeft: '4px' }}>↕</span>
    return <span style={{ color: 'var(--gold)', marginLeft: '4px' }}>{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
  }

  return (
    <div className="wf">
      <TopBar breadcrumbs={[{ label: 'Club Management' }, { label: 'Master Roster' }]} />
      <div className="wf-body">
        <SideNav sections={tmTopNavSections()} />
        <main className="wf-main">
          <PageHead
            title="Master Athlete Roster"
            sub="Manage permanent club members. Register them quickly to future events."
            right={
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <Btn variant="gold-outline" onClick={() => { setIsUploadOpen(true); setUploadError('') }}>↑ Bulk Upload Excel</Btn>
                <Btn variant="primary" onClick={() => {
                  setEditingId(null)
                  setActiveQueueIndex(null)
                  setFormData({ fullName: '', icNumber: '', dob: '', gender: '', beltGrade: '10th Kup (White)', weightKg: '', isSparring: true, isPattern: false, countryCode: 'MAS' })
                  setIsFormOpen(true)
                }}>+ Add Single Athlete</Btn>
              </div>
            }
          />

          <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
            <StatCard label="Total Athletes" value={stats.total} sub="Registered to Master List" />
            <StatCard label="Gender Split" value={`${stats.male} M / ${stats.female} F`} sub="Across all categories" />
            <StatCard label="Disciplines" value={`${stats.sparring} Sp. / ${stats.pattern} Pa.`} sub="Sparring vs Pattern active" />
            <StatCard label="Black Belts" value={stats.blackBelts} sub={`${stats.total - stats.blackBelts} Colored Belts`} />
          </div>

          {warningsQueue.length > 0 && (
            <div className="box" style={{ marginBottom: '1rem', backgroundColor: 'rgba(76,175,80,0.05)', border: '1px solid rgba(76,175,80,0.3)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h4 style={{ color: '#4CAF50', margin: '0 0 0.5rem 0' }}>Upload Successful</h4>
                  <ul style={{ margin: 0, paddingLeft: '1.25rem', fontSize: '0.8125rem', color: 'var(--ink)' }}>
                    {warningsQueue.map((w, i) => <li key={i}>{w}</li>)}
                  </ul>
                </div>
                <Btn variant="ghost" size="sm" onClick={() => setWarningsQueue([])}>Dismiss</Btn>
              </div>
            </div>
          )}

          {actionQueue.length > 0 && (
            <div className="box" style={{ borderColor: 'rgba(255, 75, 75, 0.4)', marginBottom: '1.5rem', backgroundColor: 'rgba(255, 75, 75, 0.05)' }}>
               <h4 style={{ color: '#FF4B4B', marginTop: 0 }}>Action Required: {actionQueue.length} athletes skipped</h4>
               <p style={{ fontSize: '0.875rem', color: 'var(--muted)', marginBottom: '1rem' }}>
                 These athletes were not uploaded due to data errors. Click <strong>"Fix"</strong> to correct them, or <strong>"Discard"</strong> to ignore them.
               </p>
               
               <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                 {actionQueue.map((athlete, idx) => (
                   <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem', backgroundColor: 'var(--paper)', borderRadius: '4px', border: '1px solid var(--line)' }}>
                      <div>
                        <div style={{ fontWeight: 'bold', color: 'var(--ink)', fontSize: '0.875rem' }}>{athlete.fullName || 'Missing Name'}</div>
                        <div style={{ fontSize: '0.75rem', color: '#FF4B4B', marginTop: '0.25rem' }}>{athlete.errorMsg}</div>
                      </div>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <Btn variant="ghost" size="sm" onClick={() => setActionQueue(prev => prev.filter((_, i) => i !== idx))}>Discard</Btn>
                        <Btn variant="primary" size="sm" onClick={() => { setEditingId(null); setFormData(actionQueue[idx]); setActiveQueueIndex(idx); setIsFormOpen(true); }}>Fix</Btn>
                      </div>
                   </div>
                 ))}
               </div>
               <div style={{ marginTop: '1rem', textAlign: 'right' }}><Btn variant="ghost" size="sm" onClick={() => setActionQueue([])}>Clear Entire Queue</Btn></div>
            </div>
          )}

          <div className="box" style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '1rem', padding: '0.75rem 1rem' }}>
            <input className="field-input" placeholder="Search Name or IC..." value={search} onChange={e => setSearch(e.target.value)} style={{ minWidth: '220px', flex: 1 }} />
            <select className="field-input field-select" value={filterGender} onChange={e => setFilterGender(e.target.value)} style={{ width: '120px' }}>
              <option value="">All Genders</option><option value="M">Male</option><option value="F">Female</option>
            </select>
            <select className="field-input field-select" value={filterDisc} onChange={e => setFilterDisc(e.target.value)} style={{ width: '150px' }}>
              <option value="">All Disciplines</option><option value="sparring">Sparring</option><option value="pattern">Pattern</option>
            </select>
          </div>

          <div className="box" style={{ padding: 0, overflow: 'hidden' }}>
            <table className="tbl">
              <thead>
                <tr>
                  <th onClick={() => handleSort('countryCode')} style={{ cursor: 'pointer' }}>Country <SortIcon col="countryCode" /></th>
                  <th onClick={() => handleSort('fullName')} style={{ cursor: 'pointer' }}>Full Name <SortIcon col="fullName" /></th>
                  <th>IC / Passport</th>
                  <th onClick={() => handleSort('age')} style={{ cursor: 'pointer' }}>Age <SortIcon col="age" /></th>
                  <th onClick={() => handleSort('gender')} style={{ cursor: 'pointer' }}>G <SortIcon col="gender" /></th>
                  <th onClick={() => handleSort('beltGrade')} style={{ cursor: 'pointer' }}>Belt Grade <SortIcon col="beltGrade" /></th>
                  <th onClick={() => handleSort('weightKg')} style={{ cursor: 'pointer' }}>Current Wgt <SortIcon col="weightKg" /></th>
                  <th>Disciplines</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {loading && <tr><td colSpan="10" style={{ textAlign: 'center', padding: '2rem', color: 'var(--muted)' }}>Loading roster...</td></tr>}
                {!loading && sortedAthletes.length === 0 && (
                  <tr>
                    <td colSpan="10" style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--muted)' }}>
                      <div style={{ marginBottom: '1rem' }}>No athletes found.</div>
                      {athletes.length === 0 && <Btn variant="gold-outline" onClick={() => window.location.href = `/api/athletes/template?clubCode=${user.clubCode}`}>Download Excel Template</Btn>}
                    </td>
                  </tr>
                )}
                {paginatedAthletes.map(a => {
                  const bStyle = getBeltStyle(a.beltGrade)
                  const age = calculateAge(a.dob)
                  return (
                  <tr key={a.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', color: 'var(--ink)' }}>
                        <span style={{ fontSize: '1.1rem' }}>{getFlag(a.countryCode)}</span>
                        <span className="mono" style={{ fontSize: '0.75rem' }}>{a.countryCode}</span>
                      </div>
                    </td>
                    <td className="name">{a.fullName}</td>
                    <td className="mono" style={{ color: 'var(--muted)', fontSize: '0.75rem' }}>{maskIC(a.icNumber)}</td> 
                    <td className="mono" style={{ color: age < MIN_AGE ? '#FF4B4B' : 'var(--gold)' }}>{age}</td>
                    <td className="mono" style={{ color: 'var(--muted)' }}>{a.gender}</td>
                    <td><span style={{ backgroundColor: bStyle.bg, color: bStyle.color, border: bStyle.border || 'none', padding: '2px 6px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600 }}>{a.beltGrade}</span></td>
                    <td className="mono">{Number(a.weightKg).toFixed(1)} kg</td>
                    <td>
                      <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                        {a.isSparring === 1 && <Stamp variant="gold">Sp.</Stamp>}
                        {a.isPattern === 1 && <Stamp variant="ok">Pa.</Stamp>}
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.375rem' }}>
                        <Btn variant="ghost" size="sm" onClick={() => {
                          setEditingId(a.id); setActiveQueueIndex(null);
                          setFormData({ ...a, isSparring: a.isSparring === 1, isPattern: a.isPattern === 1 })
                          setIsFormOpen(true)
                        }}>Edit</Btn>
                        <Btn variant="ghost" size="sm" onClick={() => handleDelete(a.id, a.fullName)} style={{ color: '#FF4B4B' }}>Del</Btn>
                      </div>
                    </td>
                  </tr>
                )})}
              </tbody>
            </table>
            {!loading && sortedAthletes.length > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', borderTop: '1px solid var(--line)', backgroundColor: 'var(--paper-2)' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>
                  Showing {(currentPage - 1) * rowsPerPage + 1} to {Math.min(currentPage * rowsPerPage, sortedAthletes.length)} of {sortedAthletes.length} athletes
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <Btn variant="ghost" size="sm" onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))} disabled={currentPage === 1}>← Prev</Btn>
                  <span style={{ fontSize: '0.75rem', fontFamily: 'JetBrains Mono, monospace', color: 'var(--ink)' }}>Page {currentPage} of {totalPages}</span>
                  <Btn variant="ghost" size="sm" onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))} disabled={currentPage === totalPages}>Next →</Btn>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      {isFormOpen && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div className="box" style={{ width: '100%', maxWidth: '700px', maxHeight: '90vh', overflowY: 'auto' }}>
            <h3 style={{ margin: '0 0 1.5rem 0', color: 'var(--ink)' }}>{editingId ? 'Edit Athlete' : 'Add New Athlete'}</h3>
            
            <form onSubmit={handleFormSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                  <label style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--muted-2)' }}>Full Name</label>
                  <input required className="field-input" value={formData.fullName} onChange={e => setFormData(prev => ({...prev, fullName: e.target.value.toUpperCase()}))} placeholder="AS PER IC" />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                  <label style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--muted-2)' }}>IC / Passport</label>
                  <input required className="field-input mono" maxLength="14" value={formData.icNumber} onChange={handleIcChange} placeholder="xxxxxx-xx-xxxx" />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                  <label style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--muted-2)' }}>Date of Birth</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <input required type="date" className="field-input mono" style={{ flex: 1 }} value={formData.dob} onChange={e => setFormData({...formData, dob: e.target.value})} />
                    <span style={{ fontSize: '0.75rem', color: calculateAge(formData.dob) < MIN_AGE ? '#FF4B4B' : 'var(--muted)' }}>({calculateAge(formData.dob)}y)</span>
                  </div>
                </div>
               <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                  <label style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--muted-2)' }}>Gender</label>
                  <select 
                    required 
                    className="field-input field-select mono" 
                    value={formData.gender} 
                    onChange={e => setFormData({...formData, gender: e.target.value})}
                    disabled={formData.countryCode === 'MAS' && formData.icNumber.replace(/[^\w]/g, '').length === 12}
                    style={{ 
                      opacity: formData.countryCode === 'MAS' && formData.icNumber.replace(/[^\w]/g, '').length === 12 ? 0.7 : 1,
                      backgroundColor: formData.countryCode === 'MAS' && formData.icNumber.replace(/[^\w]/g, '').length === 12 ? 'var(--paper-3)' : 'var(--paper)'
                    }}
                  >
                    <option value="">Select...</option><option value="M">Male</option><option value="F">Female</option>
                  </select>
                  {formData.countryCode === 'MAS' && formData.icNumber.replace(/[^\w]/g, '').length === 12 && (
                    <span style={{ fontSize: '0.65rem', color: 'var(--gold)', marginTop: '2px' }}>Locked by MyKad identity.</span>
                  )}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                  <label style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--muted-2)' }}>Nationality (ISO)</label>
                  <select required className="field-input field-select mono" value={formData.countryCode} onChange={e => setFormData({...formData, countryCode: e.target.value})}>
                    {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                  <label style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--muted-2)' }}>Belt Grade</label>
                  <select required className="field-input field-select" value={formData.beltGrade} onChange={e => setFormData({...formData, beltGrade: e.target.value})}>
                    {BELT_GRADES.map(b => <option key={b} value={b}>{b}</option>)}
                  </select>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                  <label style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--muted-2)' }}>Current Wgt (kg)</label>
                  <input required type="number" step="0.01" min="10" className="field-input mono" value={formData.weightKg} onChange={e => setFormData({...formData, weightKg: e.target.value})} placeholder="e.g. 65.50" />
                </div>
              </div>

              <div style={{ background: 'var(--paper-3)', padding: '1rem', borderRadius: '4px', border: '1px solid var(--line)' }}>
                <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--muted-2)', marginBottom: '0.75rem' }}>Active Disciplines</div>
                <div style={{ display: 'flex', gap: '2rem' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', color: 'var(--ink)' }}>
                    <input type="checkbox" checked={formData.isSparring} onChange={e => setFormData({...formData, isSparring: e.target.checked})} style={{ accentColor: 'var(--gold)' }} />
                    Sparring / Kyorugi
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', color: 'var(--ink)' }}>
                    <input type="checkbox" checked={formData.isPattern} onChange={e => setFormData({...formData, isPattern: e.target.checked})} style={{ accentColor: 'var(--gold)' }} />
                    Pattern / Poomsae / Tul
                  </label>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
                <Btn variant="ghost" type="button" onClick={handleCancelForm}>Cancel</Btn>
                <Btn variant="primary" type="submit">Save Athlete</Btn>
              </div>
            </form>
          </div>
        </div>
      )}

      {isUploadOpen && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div className="box" style={{ width: '100%', maxWidth: '500px', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <h3 style={{ margin: '0', color: 'var(--ink)' }}>Bulk Upload Roster</h3>
            <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--muted)', lineHeight: '1.5' }}>
              Upload your complete roster via Excel. If any rows contain errors, you will be able to easily correct them on the next screen.
            </p>
            <Btn variant="gold-outline" onClick={() => window.location.href = `/api/athletes/template?clubCode=${user.clubCode}`} style={{ alignSelf: 'flex-start' }}>↓ Download Smart Template</Btn>
            <form onSubmit={handleUploadSubmit} style={{ marginTop: '1rem', borderTop: '1px dashed var(--line)', paddingTop: '1.5rem' }}>
              <input type="file" accept=".xlsx" ref={fileInputRef} onChange={e => setUploadFile(e.target.files[0])} style={{ display: 'block', marginBottom: '1rem', color: 'var(--ink)' }} required />
              {uploadError && (
                <div style={{ padding: '1rem', marginBottom: '1rem', borderRadius: '4px', backgroundColor: 'rgba(255,75,75,0.1)', color: '#FF4B4B', border: '1px solid rgba(255,75,75,0.3)' }}>
                  <strong>{uploadError}</strong>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <Btn variant="ghost" type="button" onClick={() => setIsUploadOpen(false)}>Cancel</Btn>
                <Btn variant="primary" type="submit" disabled={uploading || !uploadFile}>{uploading ? 'Processing...' : 'Upload Data'}</Btn>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}