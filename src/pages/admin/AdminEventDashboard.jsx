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
import { getCompetitorsByEvent } from '../../data/competitors'
import { adminNavSections } from '../../utils/navSections'

// BACKEND: replace getEvent / PAYMENT_QUEUE with fetch('/api/events/:id') and fetch('/api/events/:id/payments')
// Verify/reject buttons should PATCH /api/payments/:payId/status

function StatCard({ label, value, sub, accent }) {
  return (
    <div className="stat-card">
      <div className="stat-card-label">{label}</div>
      <div className="stat-card-value" style={accent ? { color: accent } : {}}>{value}</div>
      {sub && <div className="stat-card-sub">{sub}</div>}
    </div>
  )
}

// Mock payment queue entries
const PAYMENT_QUEUE = [
  { id: 'PAY-001', club: 'Tiger Taekwondo KL', clubCode: 'TIGERKL', amount: 720, ref: 'ROAR2026-TIGERKL-20260601', submittedAt: '2026-06-01 14:32', status: 'pending' },
  { id: 'PAY-002', club: 'Eagle Academy PJ', clubCode: 'EAGLEPH', amount: 540, ref: 'ROAR2026-EAGLEPH-20260602', submittedAt: '2026-06-02 09:15', status: 'pending' },
  { id: 'PAY-003', club: 'Dragon Spirit SS', clubCode: 'DRAONSS', amount: 480, ref: 'ROAR2026-DRAONSS-20260530', submittedAt: '2026-05-30 11:44', status: 'verified' },
  { id: 'PAY-004', club: 'Phoenix TKD KK', clubCode: 'PHOENIXKK', amount: 360, ref: 'ROAR2026-PHOENIXKK-20260528', submittedAt: '2026-05-28 16:20', status: 'verified' },
  { id: 'PAY-005', club: 'Warrior Academy KL', clubCode: 'WARKL', amount: 300, ref: 'ROAR2026-WARKL-20260603', submittedAt: '2026-06-03 08:05', status: 'pending' },
]

export default function AdminEventDashboard() {
  const { id } = useParams()
  const event = getEvent(id)
  const competitors = getCompetitorsByEvent(id)
  const [queue, setQueue] = useState(PAYMENT_QUEUE)

  if (!event) {
    return (
      <div className="wf">
        <TopBar />
        <div className="wf-main"><p style={{ color: 'var(--muted)' }}>Event not found.</p></div>
      </div>
    )
  }

  function setPaymentStatus(payId, status) {
    // BACKEND: PATCH /api/payments/:payId/status  { status }
    console.info(`Payment ${payId} → ${status}`)
    setQueue((prev) => prev.map((p) => p.id === payId ? { ...p, status } : p))
  }

  const stats = event.stats
  const pendingPay = queue.filter((p) => p.status === 'pending').length
  const feesPct = Math.round((stats.feesCollected / stats.feesTotal) * 100)

  // Compute category fill flags from real competitor data
  const fillGroups = {}
  competitors.forEach((c) => {
    const key = `${c.ageCategory} · ${c.beltGroup} · ${c.gender}`
    fillGroups[key] = (fillGroups[key] || 0) + 1
  })
  const fillFlags = Object.entries(fillGroups)
    .map(([cat, count]) => ({
      cat,
      count,
      flag: count >= 4 ? 'ok' : count >= 2 ? 'warn' : 'stamp',
    }))
    .sort((a, b) => a.count - b.count)

  return (
    <div className="wf">
      <TopBar
        breadcrumbs={[
          { label: 'Admin', to: '/admin' },
          { label: event.shortName },
        ]}
      />
      <ScopeBar event={event} switchTo="/admin" />
      <div className="wf-body">
        <SideNav sections={adminNavSections(id)} />
        <main className="wf-main">
          <PageHead
            title={event.shortName}
            sub="Admin Event Dashboard"
            right={
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <Btn variant="ghost" to={`/admin/events/${id}/categories`}>Category Overrides</Btn>
                <Btn variant="ghost" to={`/admin/events/${id}/roster`}>Competitor Roster</Btn>
              </div>
            }
          />

          {/* 5 Stat cards */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(5, 1fr)',
              gap: '0.75rem',
              marginBottom: '1.5rem',
            }}
          >
            <StatCard label="Competitors" value={stats.competitors} sub={`${stats.clubs} clubs`} />
            <StatCard label="Teams / Pairs" value={stats.teams} sub="entries built" />
            <StatCard label="Fees Collected" value={`MYR ${stats.feesCollected.toLocaleString()}`} sub={`of MYR ${stats.feesTotal.toLocaleString()}`} accent="var(--gold)" />
            <StatCard label="Collection Rate" value={`${feesPct}%`} sub="verified payments" accent={feesPct >= 80 ? 'var(--ok)' : 'var(--gold)'} />
            <StatCard label="Pending Payments" value={pendingPay} sub="awaiting verification" accent={pendingPay > 0 ? 'var(--stamp)' : 'var(--ok)'} />
          </div>

          {/* Payments queue */}
          <div className="box" style={{ marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.875rem' }}>
              <span className="section-label">
                Payment Queue
              </span>
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
                {queue.map((p) => (
                  <tr key={p.id} style={{ opacity: p.status === 'rejected' ? 0.5 : 1 }}>
                    <td className="mono">{p.id}</td>
                    <td className="name">{p.club}</td>
                    <td className="mono" style={{ fontSize: '0.7rem' }}>{p.ref}</td>
                    <td className="mono" style={{ color: 'var(--gold)' }}>{p.amount}</td>
                    <td className="mono" style={{ fontSize: '0.7rem' }}>{p.submittedAt}</td>
                    <td>
                      <Stamp variant={p.status === 'verified' ? 'ok' : p.status === 'rejected' ? 'stamp' : 'gold'}>
                        {p.status}
                      </Stamp>
                    </td>
                    <td>
                      {p.status === 'pending' && (
                        <div style={{ display: 'flex', gap: '0.375rem' }}>
                          <Btn variant="ghost" size="sm">View Proof</Btn>
                          <Btn variant="primary" size="sm" onClick={() => setPaymentStatus(p.id, 'verified')}>Verify</Btn>
                          <Btn variant="stamp" size="sm" onClick={() => setPaymentStatus(p.id, 'rejected')}>Reject</Btn>
                        </div>
                      )}
                      {p.status === 'verified' && (
                        <Btn variant="ghost" size="sm" onClick={() => setPaymentStatus(p.id, 'pending')}>Undo</Btn>
                      )}
                      {p.status === 'rejected' && (
                        <Btn variant="ghost" size="sm" onClick={() => setPaymentStatus(p.id, 'pending')}>Undo</Btn>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Category fill / thin flags + cross-event lookup */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="box">
              <div className="section-label" style={{ marginBottom: '0.875rem' }}>
                Category Fill Flags
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {fillFlags.length === 0 && (
                  <div style={{ fontSize: '0.75rem', color: 'var(--muted)', fontFamily: 'JetBrains Mono, monospace', textAlign: 'center', padding: '1rem' }}>
                    No competitors registered yet.
                  </div>
                )}
                {fillFlags.map((row) => (
                  <div key={row.cat} style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                    <Chip variant={row.flag === 'ok' ? 'ok' : row.flag === 'warn' ? 'warn' : 'stamp'}>
                      {row.count}
                    </Chip>
                    <span style={{ fontSize: '0.8125rem', color: 'var(--ink-2)', flex: 1 }}>{row.cat}</span>
                    {row.flag === 'stamp' && (
                      <span style={{ fontSize: '0.6875rem', color: '#f07060', fontFamily: 'JetBrains Mono, monospace' }}>THIN</span>
                    )}
                    {row.flag === 'warn' && (
                      <span style={{ fontSize: '0.6875rem', color: 'var(--gold)', fontFamily: 'JetBrains Mono, monospace' }}>LOW</span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="box">
              <div className="section-label" style={{ marginBottom: '0.875rem' }}>
                Cross-Event Club Lookup
              </div>
              <input
                className="field-input"
                placeholder="Search club name or code…"
                aria-label="Cross-event club search"
                style={{ marginBottom: '0.75rem' }}
              />
              <div style={{ fontSize: '0.75rem', color: 'var(--muted)', fontFamily: 'JetBrains Mono, monospace', textAlign: 'center', padding: '1rem' }}>
                Type to search across all events
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
