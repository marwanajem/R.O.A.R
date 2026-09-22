import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import TopBar from '../../components/ui/TopBar'
import SideNav from '../../components/ui/SideNav'
import PageHead from '../../components/ui/PageHead'
import Btn from '../../components/ui/Btn'
import Chip from '../../components/ui/Chip'
import Stamp from '../../components/ui/Stamp'
import { adminTopNavSections } from '../../utils/navSections'

function statusVariant(status) {
  if (!status) return 'default'
  const s = status.toLowerCase()
  if (s === 'open') return 'ok'
  if (s === 'upcoming') return 'gold'
  return 'default'
}

export default function AdminEventList() {
  const [events, setEvents] = useState([])

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const response = await fetch('/api/events');
        if (response.ok) {
          const data = await response.json();
          
      
         const formatDate = (val) => {
            if (!val) return '—';
            const d = new Date(val);
            if (isNaN(d)) return '—';
            
            
            const year = d.getFullYear();
            const month = String(d.getMonth() + 1).padStart(2, '0');
            const day = String(d.getDate()).padStart(2, '0');
            
            return `${year}-${month}-${day}`;
          };

          const safeEvents = data.map(ev => {
            const eventYear = ev.eventDate ? new Date(ev.eventDate).getFullYear() : new Date().getFullYear();
            
            return {
              rawId: ev.id,
              uiId: `EVT-${eventYear}-${String(ev.id).padStart(3, '0')}`,
              name: ev.shortName,
              ruleset: ev.type,
              status: ev.status ? ev.status.toLowerCase() : 'upcoming',
              regStart: '—', 
              regEnd: formatDate(ev.regCloseDate), // Fixed date cutoff
              eventDate: formatDate(ev.eventDate), // Fixed date cutoff
              stats: { 
                competitors: ev.competitorCount || 0, 
                clubs: ev.clubCount || 0,            
                pendingPayments: 0 
              }, 
              categories: [] 
            };
          });
          
          setEvents(safeEvents);
        }
      } catch (error) {
        console.error('Failed to fetch events:', error);
      }
    };
    
    fetchEvents();
  }, []);

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

        {/* Summary chips */}
        <div style={{ display: 'flex', gap: '0.625rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
          <Chip variant="ok">{events.filter((e) => e.status === 'open').length} Open</Chip>
          <Chip variant="gold">{events.filter((e) => e.status === 'upcoming').length} Upcoming</Chip>
          <Chip variant="default">{events.filter((e) => e.status === 'archived').length} Archived</Chip>
          <Chip variant="default">{events.length} Total</Chip>
        </div>

        <div className="box" style={{ padding: 0, overflow: 'hidden' }}>
          <table className="tbl">
            <thead>
              <tr>
                <th>Event ID</th>
                <th>Name</th>
                <th>Ruleset</th>
                <th>Status</th>
                <th>Reg Window</th>
                <th>Event Date</th>
                <th>Competitors</th>
                <th>Clubs</th>
                <th>Payments</th>
                <th>Categories</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {events.map((ev) => (
                <tr key={ev.rawId}>
                  <td className="mono">{ev.uiId}</td>
                  <td className="name">{ev.name}</td>
                  <td>
                    <Chip variant={ev.ruleset === 'WT' ? 'blue' : 'gold'}>{ev.ruleset}</Chip>
                  </td>
                  <td>
                    <Stamp variant={statusVariant(ev.status)}>
                      {ev.status.toUpperCase()}
                    </Stamp>
                  </td>
                  <td className="mono" style={{ fontSize: '0.7rem' }}>
                    {ev.regStart}<br />
                    <span style={{ color: 'var(--muted-2)' }}>→ {ev.regEnd}</span>
                  </td>
                  <td className="mono">{ev.eventDate}</td>
                  <td className="mono">{ev.stats.competitors}</td>
                  <td className="mono">{ev.stats.clubs}</td>
                  <td>
                    <span className="mono" style={{ color: ev.stats.pendingPayments > 0 ? 'var(--gold)' : 'var(--ok)' }}>
                      {ev.stats.pendingPayments} pending
                    </span>
                  </td>
                  <td style={{ maxWidth: '200px' }}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '3px' }}>
                      {ev.categories.map((cat) => (
                        <Chip key={cat} variant="ghost" style={{ fontSize: '0.6rem' }}>{cat}</Chip>
                      ))}
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.375rem' }}>
                      <Btn variant="ghost" size="sm" to={`/admin/events/${ev.uiId}`}>
                        Manage
                      </Btn>
                      <Btn variant="ghost" size="sm" to={`/admin/events/${ev.uiId}/categories`}>
                        Cats
                      </Btn>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        </div>
      </div>
    </div>
  )
}