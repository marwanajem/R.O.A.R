import React, { useState,useEffect } from 'react'
import { useParams } from 'react-router-dom'
import TopBar from '../../components/ui/TopBar'
import ScopeBar from '../../components/ui/ScopeBar'
import SideNav from '../../components/ui/SideNav'
import PageHead from '../../components/ui/PageHead'
import Btn from '../../components/ui/Btn'
import Chip from '../../components/ui/Chip'
import Stamp from '../../components/ui/Stamp'
import { getEvent } from '../../data/events'
import { getCompetitorsByEvent } from '../../data/competitors'
import { useAuth } from '../../contexts/AuthContext'
import { tmNavSections } from '../../utils/navSections'

// BACKEND: delete is DELETE /api/events/:id/competitors/:cid

export default function CompetitorList() {
  const { id } = useParams()
  const { user } = useAuth()
  

 const [event, setEvent] = useState(null)
 const [list, setList] = useState([])
 const [loading, setLoading] = useState(true)

  
  const [search, setSearch] = useState('')
  const [filterGender, setFilterGender] = useState('')
  const [filterAge, setFilterAge] = useState('')
  const [confirmDelete, setConfirmDelete] = useState(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        
        const eventRes = await fetch(`/api/events/${id}`)
        if (eventRes.ok) {
          const eventData = await eventRes.json()
          setEvent(eventData)
        }

     
        if (user?.clubCode) {
          const rosterRes = await fetch(`/api/competitors/event/${id}/club/${user.clubCode}`)
          if (rosterRes.ok) {
            const rosterData = await rosterRes.json()
            
           
            const formattedRoster = rosterData.map(c => ({
              ...c,
              weightClass: c.weightCategory, 
            }))
            
            setList(formattedRoster)
          }
        }
      } catch (error) {
        console.error('Failed to fetch data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [id, user?.clubCode])

  const filtered = list.filter((c) => {
    const q = search.toLowerCase()
    const matchSearch = !q || c.fullName.toLowerCase().includes(q) || c.icMasked.includes(q)
    const matchGender = !filterGender || c.gender === filterGender
    const matchAge = !filterAge || c.ageCategory === filterAge
    return matchSearch && matchGender && matchAge
  })
  async function handleDelete(cid) {
    if (confirmDelete === cid) {
      try {
        
        const response = await fetch(`/api/auth/login/api/competitors/${cid}`, {
          method: 'DELETE',
        });

        if (!response.ok) throw new Error('Failed to delete');

        
        setList((prev) => prev.filter((c) => c.id !== cid));
        setConfirmDelete(null);
        
      } catch (error) {
        console.error('Error deleting competitor:', error);
        alert('There was a problem deleting this competitor.');
      }
    } else {
      setConfirmDelete(cid);
    }
  }

  if (loading) {
    return (
      <div className="wf">
        <TopBar />
        <div className="wf-main" style={{ padding: '2rem' }}>
          <p style={{ color: 'var(--muted)' }}>Loading roster...</p>
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
          { label: 'Competitors' },
        ]}
      />
      <ScopeBar event={event} switchTo="/events" />
      <div className="wf-body">
        <SideNav sections={tmNavSections(id)} />
        <main className="wf-main">
          <PageHead
            title="Competitors"
            sub={`${filtered.length} of ${list.length} shown`}
            right={
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <Btn variant="ghost" to={`/events/${id}/competitors/upload`}>Upload CSV</Btn>
                <Btn variant="primary" to={`/events/${id}/competitors/add`}>+ Add Competitor</Btn>
              </div>
            }
          />

          <div className="box" style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '1rem', padding: '0.75rem 1rem' }}>
            <input
              className="field-input"
              placeholder="Search by name or IC…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ flex: '1 1 200px', minWidth: '180px' }}
              aria-label="Search competitors"
            />
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
            <select
              className="field-input field-select"
              value={filterAge}
              onChange={(e) => setFilterAge(e.target.value)}
              style={{ width: '150px' }}
              aria-label="Filter by age category"
            >
              <option value="">All Age Groups</option>
              <option value="U8">U8</option>
              <option value="9-11">9–11</option>
              <option value="12-14">12–14</option>
              <option value="15-17">15–17</option>
              <option value="18+">18+</option>
            </select>
          </div>

          <div className="box" style={{ padding: 0, overflow: 'auto' }}>
            <table className="tbl">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>IC (Masked)</th>
                  <th>DOB</th>
                  <th>G</th>
                  <th>Belt</th>
                  <th>Age Cat.</th>
                  <th>Belt Group</th>
                  <th>Wt (kg)</th>
                  <th>Weight Class</th>
                  <th>Pattern</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => (
                  <tr key={c.id}>
                    <td className="mono">{c.id}</td>
                    <td className="name">{c.fullName}</td>
                    <td className="mono">{c.icMasked}</td>
                    <td className="mono" style={{ color: 'var(--muted)' }}>
      {c.dob ? new Date(c.dob).toLocaleDateString('en-GB') : '—'}
    </td>
                    <td style={{ color: 'var(--muted)', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.75rem' }}>{c.gender}</td>
                    <td><Chip variant="ghost">{c.beltGrade}</Chip></td>
                    <td><Chip variant="default">{c.ageCategory}</Chip></td>
                    <td><Chip variant="gold">{c.beltGroup}</Chip></td>
                    <td className="mono">{c.weightKg}</td>
                    <td style={{ fontSize: '0.75rem', color: 'var(--ink-2)' }}>{c.weightClass}</td>
                    <td><Chip variant={c.patternFormat === 'Carnival' ? 'warn' : 'ghost'}>{c.patternFormat}</Chip></td>
                    <td><Stamp variant={c.status === 'confirmed' ? 'ok' : 'gold'}>{c.status}</Stamp></td>
                    <td style={{ whiteSpace: 'nowrap', width: '1%' }}>
                      <div style={{ display: 'flex', gap: '0.375rem', minWidth: 'max-content', justifyContent: 'flex-end' }}>
                        <Btn variant="ghost" size="sm" to={`/events/${id}/competitors/${c.id}/edit`}>Edit</Btn>
                        {confirmDelete === c.id ? (
                          <>
                            <Btn variant="stamp" size="sm" onClick={() => handleDelete(c.id)}>Confirm</Btn>
                            <Btn variant="ghost" size="sm" onClick={() => setConfirmDelete(null)}>Cancel</Btn>
                          </>
                        ) : (
                          <Btn variant="ghost" size="sm" onClick={() => handleDelete(c.id)}>Delete</Btn>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={13} style={{ textAlign: 'center', padding: '2rem', color: 'var(--muted)', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.75rem' }}>
                      No competitors match the current filters.
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
