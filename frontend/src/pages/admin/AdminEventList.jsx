import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import TopBar from '../../components/ui/TopBar'
import SideNav from '../../components/ui/SideNav'
import PageHead from '../../components/ui/PageHead'
import Btn from '../../components/ui/Btn'
import Chip from '../../components/ui/Chip'
import Stamp from '../../components/ui/Stamp'
import { adminTopNavSections } from '../../utils/navSections'
import { formatDate } from '../../utils/format'

function statusVariant(status) {
  if (!status) return 'default'
  const s = status.toLowerCase()
  if (s === 'open') return 'ok'
  if (s === 'upcoming') return 'gold'
  if (s === 'closed') return 'stamp'
  if (s === 'archived') return 'default'
  return 'default'
}

function statusLabel(status) {
  if (!status) return 'UNKNOWN'
  const s = status.toLowerCase()
  if (s === 'closed') return 'REG. CLOSED'
  return s.toUpperCase()
}

export default function AdminEventList() {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)

  const [search, setSearch] = useState('')
  const [filterRuleset, setFilterRuleset] = useState('ALL') // Default to ALL
  const [filterStatus, setFilterStatus] = useState('')

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const response = await fetch('/api/events?all=true');
        if (response.ok) {
          const data = await response.json();
          
          const safeEvents = data.map(ev => {
            const eventYear = ev.eventDate ? new Date(ev.eventDate).getFullYear() : new Date().getFullYear();
            
            let computedStatus = ev.status ? ev.status.toLowerCase() : 'upcoming';
            const now = new Date();
            const regCloseDate = new Date(ev.regCloseDate);
            const eventDate = new Date(ev.eventDate);

            now.setHours(0,0,0,0);
            regCloseDate.setHours(0,0,0,0);
            eventDate.setHours(0,0,0,0);

            if (now > eventDate) {
              computedStatus = 'archived';
            } else if (now > regCloseDate && computedStatus === 'open') {
              computedStatus = 'closed';
            }
            
            return {
              rawId: ev.id,
              uiId: `EVT-${eventYear}-${String(ev.id).padStart(3, '0')}`,
              name: ev.shortName,
              ruleset: ev.type,
              status: computedStatus,
              regEnd: ev.regCloseDate, 
              eventDate: ev.eventDate, 
              stats: { 
                competitors: ev.competitorCount || 0, 
                clubs: ev.clubCount || 0,            
                pendingPayments: ev.pendingPayments || 0 
              }, 
              categories: [] 
            };
          });
          
          setEvents(safeEvents);
        }
      } catch (error) {
        console.error('Failed to fetch events:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchEvents();
  }, []);

  // 1. Filter by Ruleset first so the Status Chips can show accurate counts
  const rulesetEvents = events.filter(ev => filterRuleset === 'ALL' || ev.ruleset === filterRuleset);

  // 2. Filter the remainder by Search and Status
  const filteredEvents = rulesetEvents.filter((ev) => {
    const q = search.toLowerCase();
    const matchSearch = !q || ev.name.toLowerCase().includes(q) || ev.uiId.toLowerCase().includes(q);
    const matchStatus = !filterStatus || ev.status === filterStatus;
    
    return matchSearch && matchStatus;
  });

  return (
    <div className="wf">
      <TopBar breadcrumbs={[{ label: 'Admin' }, { label: 'Events' }]} />
      <div className="wf-body">
        <SideNav sections={adminTopNavSections()} />
        <div className="wf-main">
          <PageHead
            title="Events CMS"
            sub="Manage championship events, categories, and registrations"
            right={
              <Btn variant="primary" to="/admin/events/new">
                + Create Event
              </Btn>
            }
          />

          {/* Color-Coded ITF / WT Tabs Filter */}
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--line)', paddingBottom: '1.25rem' }}>
            {['ALL', 'ITF', 'WT'].map(tab => {
              const isActive = filterRuleset === tab;
              
              let bg = isActive ? 'rgba(212, 175, 55, 0.1)' : 'transparent';
              let color = isActive ? 'var(--gold)' : 'var(--muted)';
              let border = isActive ? 'rgba(212, 175, 55, 0.3)' : 'transparent';

              if (tab === 'WT' && isActive) {
                bg = 'rgba(59, 130, 246, 0.1)';      
                color = '#60A5FA';                   
                border = 'rgba(59, 130, 246, 0.3)';  
              }

              return (
                <button
                  key={tab}
                  onClick={() => setFilterRuleset(tab)}
                  style={{
                    background: bg,
                    color: color,
                    border: `1px solid ${border}`,
                    padding: '0.4rem 1.25rem',
                    borderRadius: '4px',
                    fontSize: '0.8125rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    fontFamily: 'JetBrains Mono, monospace',
                    transition: 'all 0.2s ease'
                  }}
                >
                  {tab === 'ALL' ? 'ALL EVENTS' : tab}
                </button>
              )
            })}
          </div>

          {/* Status Chips (Counts dynamically update based on Ruleset Tab) */}
          <div style={{ display: 'flex', gap: '0.625rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
            <div onClick={() => setFilterStatus('open')} style={{ cursor: 'pointer' }}>
              <Chip variant={filterStatus === 'open' ? 'ok' : 'ghost'}>
                {rulesetEvents.filter((e) => e.status === 'open').length} Open
              </Chip>
            </div>
            <div onClick={() => setFilterStatus('upcoming')} style={{ cursor: 'pointer' }}>
              <Chip variant={filterStatus === 'upcoming' ? 'gold' : 'ghost'}>
                {rulesetEvents.filter((e) => e.status === 'upcoming').length} Upcoming
              </Chip>
            </div>
            <div onClick={() => setFilterStatus('closed')} style={{ cursor: 'pointer' }}>
              <Chip variant={filterStatus === 'closed' ? 'stamp' : 'ghost'}>
                {rulesetEvents.filter((e) => e.status === 'closed').length} Closed
              </Chip>
            </div>
            <div onClick={() => setFilterStatus('archived')} style={{ cursor: 'pointer' }}>
              <Chip variant={filterStatus === 'archived' ? 'default' : 'ghost'}>
                {rulesetEvents.filter((e) => e.status === 'archived').length} Archived
              </Chip>
            </div>
            <div onClick={() => setFilterStatus('')} style={{ cursor: 'pointer' }}>
              <Chip variant={filterStatus === '' ? 'default' : 'ghost'}>
                {rulesetEvents.length} Total
              </Chip>
            </div>
          </div>

          {/* Search & Select Filter Bar */}
          <div className="box" style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '1rem', padding: '0.75rem 1rem' }}>
            <input 
              className="field-input" 
              placeholder="Search by Event Name or ID..." 
              value={search} 
              onChange={(e) => setSearch(e.target.value)} 
              style={{ flex: '1 1 200px', minWidth: '180px' }} 
            />
            <select className="field-input field-select" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} style={{ width: '150px' }}>
              <option value="">All Statuses</option>
              <option value="open">Open</option>
              <option value="upcoming">Upcoming</option>
              <option value="closed">Reg. Closed</option>
              <option value="archived">Archived</option>
            </select>
          </div>

          {/* Data Table */}
          <div className="box" style={{ padding: 0, overflow: 'auto' }}>
            {loading ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--muted)' }}>Loading events...</div>
            ) : (
              <table className="tbl">
                <thead>
                  <tr>
                    <th>Event ID</th>
                    <th>Name</th>
                    <th>Ruleset</th>
                    <th>Status</th>
                    <th>Reg Closes</th>
                    <th>Event Date</th>
                    <th>Competitors</th>
                    <th>Clubs</th>
                    <th>Payments</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEvents.map((ev) => (
                    <tr key={ev.rawId}>
                      <td className="mono" style={{ fontSize: '0.75rem', color: 'var(--muted-2)' }}>{ev.uiId}</td>
                      <td className="name" style={{ fontWeight: 600 }}>{ev.name}</td>
                      <td>
                        <Chip variant={ev.ruleset === 'WT' ? 'blue' : 'gold'}>{ev.ruleset}</Chip>
                      </td>
                      <td>
                        <Stamp variant={statusVariant(ev.status)}>
                          {statusLabel(ev.status)}
                        </Stamp>
                      </td>
                      <td className="mono" style={{ fontSize: '0.8125rem' }}>
                        {formatDate(ev.regEnd)}
                      </td>
                      <td className="mono" style={{ fontSize: '0.8125rem' }}>
                        {formatDate(ev.eventDate)}
                      </td>
                      <td className="mono">{ev.stats.competitors}</td>
                      <td className="mono">{ev.stats.clubs}</td>
                      <td>
                        <span className="mono" style={{ color: ev.stats.pendingPayments > 0 ? 'var(--gold)' : 'var(--ok)' }}>
                          {ev.stats.pendingPayments} pending
                        </span>
                      </td>
                      <td style={{ whiteSpace: 'nowrap', width: '1%' }}>
                        <div style={{ display: 'flex', gap: '0.375rem', justifyContent: 'flex-end' }}>
                          <Btn variant="ghost" size="sm" to={`/admin/events/${ev.rawId}`}>
                            Manage
                          </Btn>
                          <Btn variant="ghost" size="sm" to={`/admin/events/${ev.rawId}/categories`}>
                            Cats
                          </Btn>
                          <Btn variant="ghost" size="sm" to={`/admin/events/${ev.rawId}/edit`}>
                            Edit
                          </Btn>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredEvents.length === 0 && (
                    <tr>
                      <td colSpan="10" style={{ textAlign: 'center', padding: '2rem', color: 'var(--muted)', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.75rem' }}>
                        No events match the current filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}