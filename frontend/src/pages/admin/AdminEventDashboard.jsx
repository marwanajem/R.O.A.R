import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom' 
import TopBar from '../../components/ui/TopBar'
import ScopeBar from '../../components/ui/ScopeBar'
import SideNav from '../../components/ui/SideNav'
import PageHead from '../../components/ui/PageHead'
import Btn from '../../components/ui/Btn'
import Chip from '../../components/ui/Chip'
import Stamp from '../../components/ui/Stamp'
import { adminNavSections } from '../../utils/navSections'

function StatCard({ label, value, sub, accent }) {
  return (
    <div className="stat-card">
      <div className="stat-card-label">{label}</div>
      <div className="stat-card-value" style={accent ? { color: accent } : {}}>{value}</div>
      {sub && <div className="stat-card-sub">{sub}</div>}
    </div>
  )
}

export default function AdminEventDashboard() {
  const { id } = useParams() 
  const navigate = useNavigate() 
  const [event, setEvent] = useState(null)
  const [competitors, setCompetitors] = useState([])
  const [queue, setQueue] = useState([])
  const [loading, setLoading] = useState(true)
  
  // Custom Modal States
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false)
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [pendingStatusChange, setPendingStatusChange] = useState(null)

  const dbEventId = id ? parseInt(id.split('-').pop(), 10) : null

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true)
        const eventRes = await fetch(`/api/events/${dbEventId}`)
        if (eventRes.ok) setEvent(await eventRes.json())

        const compRes = await fetch(`/api/events/${dbEventId}/competitors`)
        if (compRes.ok) setCompetitors(await compRes.json())

        const payRes = await fetch(`/api/events/${dbEventId}/payments`)
        if (payRes.ok) setQueue(await payRes.json())
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error)
      } finally {
        setLoading(false)
      }
    }
    if (dbEventId) fetchDashboardData()
  }, [dbEventId])

  // --- Custom Modal Handlers ---
  const handleToggleClick = () => {
    if (!event) return;
    setPendingStatusChange(event.status === 'CLOSED' ? 'OPEN' : 'CLOSED');
    setShowConfirmModal(true);
  }

  const executeStatusChange = async () => {
    setIsUpdatingStatus(true);
    try {
      const res = await fetch(`/api/events/${dbEventId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: pendingStatusChange })
      });

      if (res.ok) {
        setEvent({ ...event, status: pendingStatusChange });
        setShowConfirmModal(false);
      } else {
        alert('Failed to update event status.');
      }
    } catch (error) {
      console.error(error);
      alert('Network error while updating status.');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  async function setPaymentStatus(payId, status) {
    try {
      const payment = queue.find(p => p.id === payId);
      const oldStatus = payment.status;
      
      setQueue((prev) => prev.map((p) => p.id === payId ? { ...p, status } : p));
      
      if (event && event.stats) {
        let newFeesCollected = event.stats.feesCollected;
        if (status === 'verified' && oldStatus !== 'verified') {
          newFeesCollected += parseFloat(payment.amount);
        } else if (oldStatus === 'verified' && status !== 'verified') {
          newFeesCollected -= parseFloat(payment.amount);
        }
        setEvent(prev => ({
          ...prev,
          stats: { ...prev.stats, feesCollected: newFeesCollected }
        }));
      }
      
      const response = await fetch(`/api/events/${dbEventId}/payments/${payId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });

      if (!response.ok) throw new Error('Failed to update payment in database');
    } catch (error) {
      console.error(error);
      alert('Failed to save status to database.');
    }
  }

  if (loading) return <div className="wf"><TopBar /><div className="wf-main"><p style={{ color: 'var(--muted)', padding: '2rem' }}>Loading live dashboard data...</p></div></div>
  if (!event) return <div className="wf"><TopBar /><div className="wf-main"><p style={{ color: 'var(--muted)' }}>Event not found.</p></div></div>

  const stats = event.stats || { competitors: 0, clubs: 0, teams: 0, feesCollected: 0, feesTotal: 0 }
  const pendingPay = queue.filter((p) => p.status === 'pending').length
  const feesPct = stats.feesTotal > 0 ? Math.round((stats.feesCollected / stats.feesTotal) * 100) : 0

  const fillGroups = {}
  competitors.forEach((c) => {
    const key = `${c.ageCategory || 'Open'} · ${c.beltGroup || 'General'} · ${c.gender || 'Mixed'}`
    fillGroups[key] = (fillGroups[key] || 0) + 1
  })
  const fillFlags = Object.entries(fillGroups)
    .map(([cat, count]) => ({ cat, count, flag: count >= 4 ? 'ok' : count >= 2 ? 'warn' : 'stamp' }))
    .sort((a, b) => a.count - b.count)

  return (
    <div className="wf">
      <TopBar breadcrumbs={[{ label: 'Admin', to: '/admin' }, { label: event.shortName }]} />
      <ScopeBar event={event} switchTo="/admin" />
      <div className="wf-body">
        <SideNav sections={adminNavSections(id)} />
        <main className="wf-main">
          <PageHead
            title={event.shortName}
            sub="Admin Event Dashboard"
            right={
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                
                <div style={{ 
                  padding: '0.4rem 0.75rem', 
                  borderRadius: '4px', 
                  fontSize: '0.75rem', 
                  fontWeight: 'bold',
                  fontFamily: 'JetBrains Mono, monospace',
                  backgroundColor: event?.status === 'CLOSED' ? 'rgba(255, 75, 75, 0.1)' : 'rgba(76, 175, 80, 0.1)',
                  color: event?.status === 'CLOSED' ? '#FF4B4B' : '#4CAF50',
                  border: `1px solid ${event?.status === 'CLOSED' ? 'rgba(255, 75, 75, 0.3)' : 'rgba(76, 175, 80, 0.3)'}`
                }}>
                  {event?.status === 'CLOSED' ? 'REGISTRATION CLOSED' : 'REGISTRATION OPEN'}
                </div>

                <Btn 
                  variant={event?.status === 'CLOSED' ? 'primary' : 'warn'} 
                  onClick={handleToggleClick}
                >
                  {event?.status === 'CLOSED' ? 'Reopen Event' : 'Lock Event'}
                </Btn>

                <div style={{ width: '1px', height: '24px', background: 'var(--line)', margin: '0 0.25rem' }}></div>

                <Btn variant="ghost" onClick={() => navigate(`/admin/events/${id}/categories`)}>Category Overrides</Btn>
                <Btn variant="ghost" onClick={() => navigate(`/admin/events/${id}/roster`)}>Competitor Roster</Btn>
              </div>
            }
          />

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '0.75rem', marginBottom: '1.5rem' }}>
            <StatCard label="Competitors" value={stats.competitors} sub={`${stats.clubs} clubs`} />
            <StatCard label="Teams / Pairs" value={stats.teams} sub="entries built" />
            <StatCard label="Fees Collected" value={`MYR ${stats.feesCollected.toLocaleString()}`} sub={`of MYR ${stats.feesTotal.toLocaleString()}`} accent="var(--gold)" />
            <StatCard label="Collection Rate" value={`${feesPct}%`} sub="verified payments" accent={feesPct >= 80 ? 'var(--ok)' : 'var(--gold)'} />
            <StatCard label="Pending Payments" value={pendingPay} sub="awaiting verification" accent={pendingPay > 0 ? 'var(--stamp)' : 'var(--ok)'} />
          </div>

          <div className="box" style={{ marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.875rem' }}>
              <span className="section-label">Payment Queue</span>
              <Chip variant={pendingPay > 0 ? 'warn' : 'ok'}>{pendingPay} pending</Chip>
            </div>
            <table className="tbl">
              <thead>
                <tr>
                  <th>Pay ID</th>
                  <th>Club</th>
                  <th>Reference</th>
                  <th>Amount (MYR)</th>
                  <th>Submitted</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {queue.length === 0 && (
                  <tr>
                    <td colSpan="7" style={{ textAlign: 'center', color: 'var(--muted)', padding: '1.5rem', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.75rem' }}>
                      No payment records found for this event.
                    </td>
                  </tr>
                )}
                {queue.map((p) => (
                  <tr key={p.id} style={{ opacity: p.status === 'rejected' ? 0.5 : 1 }}>
                    <td className="mono">{p.id}</td>
                    <td className="name">{p.club}</td>
                    <td className="mono" style={{ fontSize: '0.7rem' }}>{p.ref}</td>
                    <td className="mono" style={{ color: 'var(--gold)' }}>{p.amount}</td>
                    <td className="mono" style={{ fontSize: '0.7rem' }}>{p.submittedAt}</td>
                    <td><Stamp variant={p.status === 'verified' ? 'ok' : p.status === 'rejected' ? 'stamp' : 'gold'}>{p.status}</Stamp></td>
                    <td>
                      {p.status === 'pending' && (
                        <div style={{ display: 'flex', gap: '0.375rem' }}>
                        {p.proof_url ? (
                            <a href={p.proof_url} target="_blank" rel="noreferrer" className="btn btn-ghost btn-sm" style={{ textDecoration: 'none', width: '96px', justifyContent: 'center' }}>View Proof</a>
                          ) : (
                            <Btn variant="ghost" size="sm" disabled style={{ opacity: 0.5, pointerEvents: 'none', width: '96px', justifyContent: 'center' }}> No file</Btn>
                          )}
                          <Btn variant="primary" size="sm" onClick={() => setPaymentStatus(p.id, 'verified')}>Verify</Btn>
                          <Btn variant="stamp" size="sm" onClick={() => setPaymentStatus(p.id, 'rejected')}>Reject</Btn>
                        </div>
                      )}
                      {p.status === 'verified' && <Btn variant="ghost" size="sm" onClick={() => setPaymentStatus(p.id, 'pending')}>Undo</Btn>}
                      {p.status === 'rejected' && <Btn variant="ghost" size="sm" onClick={() => setPaymentStatus(p.id, 'pending')}>Undo</Btn>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="box">
              <div className="section-label" style={{ marginBottom: '0.875rem' }}>Category Fill Flags</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {fillFlags.length === 0 && <div style={{ fontSize: '0.75rem', color: 'var(--muted)', fontFamily: 'JetBrains Mono, monospace', textAlign: 'center', padding: '1rem' }}>No competitors registered yet.</div>}
                {fillFlags.map((row) => (
                  <div key={row.cat} style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                    <Chip variant={row.flag === 'ok' ? 'ok' : row.flag === 'warn' ? 'warn' : 'stamp'}>{row.count}</Chip>
                    <span style={{ fontSize: '0.8125rem', color: 'var(--ink-2)', flex: 1 }}>{row.cat}</span>
                    {row.flag === 'stamp' && <span style={{ fontSize: '0.6875rem', color: '#f07060', fontFamily: 'JetBrains Mono, monospace' }}>THIN</span>}
                    {row.flag === 'warn' && <span style={{ fontSize: '0.6875rem', color: 'var(--gold)', fontFamily: 'JetBrains Mono, monospace' }}>LOW</span>}
                  </div>
                ))}
              </div>
            </div>

            <div className="box">
              <div className="section-label" style={{ marginBottom: '0.875rem' }}>Cross-Event Club Lookup</div>
              <input className="field-input" placeholder="Search club name or code…" aria-label="Cross-event club search" style={{ marginBottom: '0.75rem' }} />
              <div style={{ fontSize: '0.75rem', color: 'var(--muted)', fontFamily: 'JetBrains Mono, monospace', textAlign: 'center', padding: '1rem' }}>Type to search across all events</div>
            </div>
          </div>
        </main>
      </div>

      {/* --- CUSTOM CONFIRMATION MODAL OVERLAY --- */}
      {showConfirmModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div className="box" style={{ width: '100%', maxWidth: '400px', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div>
              <h3 style={{ margin: '0 0 0.5rem 0', color: 'var(--ink)' }}>
                {pendingStatusChange === 'CLOSED' ? 'Lock Registration?' : 'Reopen Registration?'}
              </h3>
              <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--muted)', lineHeight: '1.5' }}>
                {pendingStatusChange === 'CLOSED' 
                  ? 'Are you sure you want to CLOSE registration? Team Managers will no longer be able to add, edit, or remove fighters.' 
                  : 'Are you sure you want to REOPEN registration? Team Managers will be able to modify their rosters again.'}
              </p>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <Btn variant="ghost" onClick={() => setShowConfirmModal(false)}>Cancel</Btn>
              <Btn 
                variant={pendingStatusChange === 'CLOSED' ? 'warn' : 'primary'} 
                onClick={executeStatusChange} 
                disabled={isUpdatingStatus}
              >
                {isUpdatingStatus ? 'Updating...' : 'Confirm'}
              </Btn>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}